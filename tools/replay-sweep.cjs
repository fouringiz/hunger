// Counterfactual balance sweep over recorded human timelines.
// RESEARCH MODE: fingerprints are not checked, because the rules are deliberately changed.
// Policy (declared, not tuned): recorded actions are attempted at their recorded tick; an action that cannot
// apply (credits, phase, generation) is deferred, in order, to the first tick where it can; an action still
// pending after DEFER_LIMIT ticks is dropped. Deferred/dropped counts are reported as a fidelity measure.
// With no overrides the counterfactual player must reproduce the strict verifier's terminal state exactly.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {verifyParty}=require('./replay-party.cjs');
const ROOT=path.join(__dirname,'..');
const DEFER_LIMIT=60*60;           // one minute of simulation
const TICK_LIMIT=400000;
const FIXTURE_DIR=path.join(ROOT,'reports/replays/human-v0.4');

function makeContext() {
  const html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
  const src=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const canvas={getContext:()=>({}),style:{},addEventListener(){}};
  const ctx=vm.createContext({document:{getElementById:()=>canvas,createElement:()=>({})},window:{devicePixelRatio:1},
    location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,
    innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(src,ctx,{timeout:10000});
  return ctx;
}
// overrides: {hp, growth, turretDmg, cannonDmg, voltaicDmg, evolution:true|false}
function runCounterfactual(data, overrides={}) {
  const ctx=makeContext();
  ctx.__events=data.events.filter(e=>e.kind!=='speed').map(e=>({...e}));
  ctx.__ov=overrides; ctx.__initial=data.initial;
  return vm.runInContext(`(() => {
    reset(); S.phase='build'; S.buildTimer=25; S.time=__initial.time; S.accumulator=__initial.accumulator;   // the recorded clock may start after menu idle time
    const ov=__ov;
    if(ov.turretDmg!==undefined) TOWER.turret.dmg=ov.turretDmg;
    if(ov.cannonDmg!==undefined) TOWER.cannon.dmg=ov.cannonDmg;
    if(ov.voltaicDmg!==undefined) TOWER.voltaic.dmg=ov.voltaicDmg;
    if(ov.evolution===false) EVOLUTION_WAVES.splice(0, EVOLUTION_WAVES.length);
    if(ov.hp!==undefined || ov.growth!==undefined){
      const base=makeEnemy;
      makeEnemy=function(type,n){ const e=base(type,n); let m=ov.hp===undefined?1:ov.hp;
        if(ov.growth!==undefined) m*=(1+ov.growth*(n-1))/(1+0.08*(n-1));
        e.hp*=m; e.maxHp*=m; return e; };
    }
    let i=0, tick=0, deferred=0, dropped=0, lateTicks=0;
    while(S.phase!=='over' && tick<${TICK_LIMIT}){
      while(i<__events.length && __events[i].tick<=tick){
        const e=__events[i];
        if(performPlayerAction(e,true)){ if(tick>e.tick){deferred++; lateTicks+=tick-e.tick;} i++; continue; }
        if(tick-e.tick>${DEFER_LIMIT}){ dropped++; i++; continue; }
        break;                                   // keep order: wait for this action before trying the next
      }
      stepSimulation(SIM_STEP); tick++; replay.tick=tick;
    }
    const pending=__events.length-i;
    return {win:!!S.win, gate:S.gate, wave:S.wave, credits:S.credits, kills:S.kills, mutations:[...S.mutations],
      ticks:tick, deferred, dropped:dropped+pending, lateTicks, signature:replaySignature(), ledger:{...S.dmg}};
  })()`,ctx,{timeout:120000});
}
function loadFixtures(dir=FIXTURE_DIR) {
  return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort().map(f=>({name:f.replace(/\.json$/,''),data:JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))}));
}
function baselineCheck(fixtures) {
  const rows=[];
  for(const {name,data} of fixtures){
    const strict=verifyParty(data);
    const cf=runCounterfactual(data,{});
    const same=cf.signature===data.terminal.signature && cf.deferred===0 && cf.dropped===0;
    rows.push({name,strict:strict.verified,gate:cf.gate,win:cf.win,exact:same,deferred:cf.deferred,dropped:cf.dropped});
    if(!same) throw new Error(`Counterfactual player diverged from the verifier on ${name} without overrides.`);
  }
  return rows;
}
const FACTORS={
  turret:  {label:'Turret damage',  key:'turretDmg', values:[7,8.5,10]},
  cannon:  {label:'Cannon damage',  key:'cannonDmg', values:[45,40,36]},
  voltaic: {label:'Voltaic damage', key:'voltaicDmg',values:[14,17,20]},
  hp:      {label:'Enemy HP multiplier (constant)', key:'hp', values:[1,1.25,1.5]},
  growth:  {label:'Enemy HP growth per wave', key:'growth', values:[0.08,0.10,0.11]},
};
function cell(r){ return `${r.win?'W':'L'} g${r.gate} w${r.wave}${r.deferred||r.dropped?` (d${r.deferred}/x${r.dropped})`:''}`; }
function sweep(fixtures, factorNames) {
  const out={}; const md=[];
  for(const fn of factorNames){
    const f=FACTORS[fn]; out[fn]={label:f.label,values:{}};
    for(const evolution of [true,false]){
      md.push(`\n### ${f.label} — evolution ${evolution?'on':'off'}\n`);
      md.push('| value | '+fixtures.map(x=>x.name).join(' | ')+' |'); md.push('|---|'+fixtures.map(()=>'---').join('|')+'|');
      for(const v of f.values){
        const row=[]; for(const {name,data} of fixtures){ const r=runCounterfactual(data,{[f.key]:v,evolution}); (out[fn].values[`${v}:${evolution?'on':'off'}`]??={})[name]=r; row.push(cell(r)); }
        md.push(`| ${v} | ${row.join(' | ')} |`);
      }
    }
  }
  return {out,md:md.join('\n')};
}
function main(){
  const args=process.argv.slice(2);
  const factorNames=args.filter(a=>FACTORS[a]); const which=factorNames.length?factorNames:Object.keys(FACTORS);
  const fixtures=loadFixtures();
  console.log('Baseline fidelity (strict verifier vs counterfactual player, no overrides):');
  for(const r of baselineCheck(fixtures)) console.log(`  ${r.name.padEnd(14)} verified=${r.strict} exact=${r.exact} ${r.win?'W':'L'} gate ${r.gate}`);
  const {out,md}=sweep(fixtures,which);
  console.log(md);
  console.log('\nCell format: W/L = win/loss, g = Gate HP at end, w = last wave, (dN/xM) = N deferred / M dropped actions. Evolution off = EVOLUTION_WAVES emptied.');
  const gen=path.join(ROOT,'reports/generated'); fs.mkdirSync(gen,{recursive:true});
  fs.writeFileSync(path.join(gen,'replay-sweep.json'),JSON.stringify({policy:'defer-in-order, drop after 3600 ticks',factors:out},null,2)+'\n');
  fs.writeFileSync(path.join(gen,'replay-sweep.md'),md+'\n');
}
if(require.main===module){ try{main();}catch(e){console.error(e.message);process.exitCode=1;} }
module.exports={runCounterfactual,baselineCheck,loadFixtures,FACTORS};
