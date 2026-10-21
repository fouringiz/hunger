// Exact-spend funded snapshots for the opt-in infantry field trial; not campaign economics.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ROOT = path.join(__dirname,'..');
const SOURCE = fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const LAYOUTS = [
  {id:'player-loop',cannons:[2,3],generator:15,reinforcement:4},
  {id:'west-mid',cannons:[2,8],generator:15,reinforcement:0},
  {id:'east-turn',cannons:[5,10],generator:15,reinforcement:11}
];
const ARMS = ['unchanged','barracks','cannon','turret-upgrade'];
function runtime(search='?infantry=1') {
  const canvas={getContext:()=>({}),style:{},addEventListener(){}};
  const ctx=vm.createContext({document:{getElementById:()=>canvas},window:{devicePixelRatio:1},
    location:{pathname:'/prototype/index.html',search},URLSearchParams,innerWidth:960,innerHeight:540,
    addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(SOURCE,ctx);
  return ctx;
}
function trial(layout,wave,arm,search='?infantry=1') {
  const ctx=runtime(search);ctx.spec={layout,wave,arm};
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    const {layout,wave,arm}=spec;
    reset();S.credits=420;S.phase='build';S.buildTimer=999;
    for(const i of layout.cannons)build(SLOTS[i],'cannon');
    build(SLOTS[layout.generator],'generator');
    const baselineInvestment=S.towers.reduce((sum,t)=>sum+t.invested,0),before=S.credits;
    if(arm==='turret-upgrade'){build(SLOTS[layout.reinforcement],'turret');upgrade(SLOTS[layout.reinforcement].tower);}
    else if(arm!=='unchanged')build(SLOTS[layout.reinforcement],arm);
    const actionSpend=before-S.credits,totalInvestment=S.towers.reduce((sum,t)=>sum+t.invested,0);
    assert.equal(baselineInvestment,310);
    assert.equal(actionSpend,arm==='unchanged'?0:110,'active arms must spend exactly the same amount');
    assert.equal(totalInvestment,arm==='unchanged'?310:420);
    // Identical five-second preparation, including real soldier march. No artificial instant deployment.
    for(let i=0;i<300;i++)update(SIM_STEP);
    S.wave=wave-1;S.mutations=wave===5?['sprinter']:['sprinter','dispersal'];
    const powerAtStart=power(),cashBeforeWave=S.credits;
    startWave();const start=S.time;let ticks=0;
    while(S.phase==='wave'&&ticks<18000){update(SIM_STEP);ticks++;}
    return {layout:layout.id,wave,arm,baselineInvestment,actionSpend,totalInvestment,cashBeforeWave,
      cashAfterWave:S.credits,powerAtStart,mutations:wave===5?['sprinter']:['sprinter','dispersal'],
      outcome:S.phase==='wave'?'timeout':S.gate<=0?'loss':'clear',gate:S.gate,leaks:S.waveLeaked,
      terminalSeconds:S.time-start,kills:S.waveKills,meleeDamage:S.meleeDamage,
      casualties:S.infantryCasualties,blockedSeconds:S.infantryBlockedSeconds};
  })()`,ctx)));
}
function playerSnapshot() {
  const ctx=runtime();
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    reset();S.phase='build';S.buildTimer=999;S.credits=890;
    for(const [i,type] of [[2,'cannon'],[3,'cannon'],[15,'generator']]){
      build(SLOTS[i],type);upgrade(SLOTS[i].tower);upgrade(SLOTS[i].tower);
    }
    assert.equal(S.credits,0);const waves=[];
    for(let wave=1;wave<=10;wave++){
      startWave();let ticks=0;while(S.phase==='wave'&&ticks<18000){update(SIM_STEP);ticks++;}
      waves.push({wave,gate:S.gate,leaks:S.waveLeaked,outcome:S.phase==='wave'?'timeout':S.gate<=0?'loss':'clear'});
      if(S.phase==='wave'||S.gate<=0)break;
      S.buildTimer=999;
    }
    return {investment:890,fundedFromWaveOne:true,waves,gate:S.gate,win:S.win};
  })()`,ctx)));
}
function run() {
  const rows=[];
  for(const layout of LAYOUTS)for(const wave of [5,9])for(const arm of ARMS)rows.push(trial(layout,wave,arm));
  // Experimental mode with no Barracks must preserve actual outcomes in these snapshots.
  for(const row of rows.filter(r=>r.arm!=='barracks')){
    const normal=trial(LAYOUTS.find(l=>l.id===row.layout),row.wave,row.arm,'');
    assert.deepEqual(row,normal,`trial flag changed no-infantry outcome: ${row.layout}/${row.wave}/${row.arm}`);
  }
  const snapshot=playerSnapshot();
  const data={generated:new Date().toISOString(),step:1/60,layouts:LAYOUTS,rows,playerSnapshot:snapshot};
  fs.mkdirSync(path.join(ROOT,'reports/generated'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'reports/generated/infantry-trial-results.json'),JSON.stringify(data,null,2)+'\n');
  const lines=rows.map(r=>`| ${r.layout} | ${r.wave} | ${r.arm} | ${r.actionSpend} | ${r.outcome} | ${r.gate} | ${r.leaks} | ${r.terminalSeconds.toFixed(2)} | ${r.meleeDamage.toFixed(2)} | ${r.casualties} | ${r.blockedSeconds.toFixed(2)} |`);
  const barracks=rows.filter(r=>r.arm==='barracks');
  const ranking={better:0,tied:0,worse:0};
  const comparisons=barracks.map(r=>{
    const alternatives=rows.filter(x=>x.layout===r.layout&&x.wave===r.wave&&['cannon','turret-upgrade'].includes(x.arm));
    const best=alternatives.sort((a,b)=>b.gate-a.gate||a.leaks-b.leaks||a.terminalSeconds-b.terminalSeconds)[0];
    const better=r.gate>best.gate||r.gate===best.gate&&r.leaks<best.leaks;
    const worse=r.gate<best.gate||r.gate===best.gate&&r.leaks>best.leaks;
    ranking[better?'better':worse?'worse':'tied']++;
    return `- ${r.layout}, wave ${r.wave}: Barracks Gate ${r.gate}, leaks ${r.leaks}; best declared conventional arm (${best.arm}) Gate ${best.gate}, leaks ${best.leaks}.`;
  });
  const report=`# Melee infantry field trial — exact-spend control\n\nGenerated: ${data.generated}. Experimental, not a campaign balance verdict.\n\n## Method\n\nThree predeclared layouts × waves 5/9 × four arms = 24 fixed-step trials. The unchanged reference invests 310 credits in two L1 Cannons and an L1 Generator and leaves 110 unused. Each active response spends exactly that remaining 110: one Barracks, one L1 Cannon, or one L2 Turret (60 + 50). Total active investment is 420; leftover prewave cash is zero in every active arm. No selling, refunds, bonus resources or later purchases. All arms receive the same five-second build phase, with real soldier march. All start with 20 Gate HP. Wave 5 carries Sprinter; wave 9 carries Sprinter and Dispersal, identical within every comparison. Layouts are recorded in the generated JSON. These are funded synthetic snapshots, not reachable campaign purchase sequences.\n\nOutcomes are clear/loss/timeout, observed Gate HP/leaks and terminal time (not full wave length after defeat). Measurements stop at defeat; a destroyed Gate censors remaining pressure. Melee damage is actual HP removed, not reserved damage; blocked seconds sum across contact pairs. Infantry costs, HP, damage and power are draft constants. Melee damage is separate from the three weapon ledgers; the trial skips counter selection at a scheduled checkpoint if no conventional weapon dealt damage, rather than inventing a dominance cause. That policy is experimental and not adopted campaign evolution. Normal/trial mode with no Barracks is compared exactly for all 18 conventional/reference snapshots.\n\n## Results\n\n| Layout | Wave | Arm | Added spend | Outcome | Gate HP | Leaks | Terminal s | Melee damage | Casualties | Blocked pair s |\n|---|---:|---|---:|---|---:|---:|---:|---:|---:|---:|\n${lines.join('\n')}\n\n## Bounded comparison\n\n${comparisons.join('\n')}\n\nThis compares the declared purchases and placements, not optimized spending or a universal advantage for infantry. Holding enemies can amplify artillery; these results do not separate damage from holding time and do not justify nerfing a weapon.\n\n## Player-reported build\n\nScreenshot-inferred Cannons at slots 2/3 and Generator at slot 15, all L3, total investment 890. Player reports all ten waves and 20 HP. The reproduction grants the complete final build at wave one; purchase timing was not supplied, so this only checks the funded final layout, not the player's economy. Measured result: Gate ${snapshot.gate}, win ${snapshot.win}, ${snapshot.waves.length} observed waves.\n\n## Verdict\n\nOn observed Gate HP and leaks, Barracks is better than the best declared conventional response in ${ranking.better} of six paired checkpoints, tied in ${ranking.tied}, and worse in ${ranking.worse}. This draft does not establish a gameplay advantage for infantry. The implementation is ready for bounded gameplay/visual review; it is not a tuned balance release. No adoption into campaign canon and no balance change is inferred from this small snapshot study. A stronger whole-campaign comparison needs recorded purchase timing and matched investment schedules.\n\n## Reproduce\n\nRun \`node tests/infantry-trial.cjs\` and \`node tools/check-infantry.cjs\`. Play \`prototype/index.html?infantry=1\`; Barracks is an experimental option. Generated JSON is ignored by git.\n`;
  fs.writeFileSync(path.join(ROOT,'reports/infantry-field-trial.md'),report);
  console.log(`PASS: ${rows.length} equal-spend trials; 18 no-infantry mode parity checks; player funded snapshot Gate ${snapshot.gate}.`);
  console.log(comparisons.join('\n'));
  return data;
}
if(require.main===module)run();
module.exports={run,trial,playerSnapshot};
