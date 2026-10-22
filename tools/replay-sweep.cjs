// Counterfactual balance sweep over recorded human timelines.
// RESEARCH MODE: fingerprints are not checked, because the rules are deliberately changed.
// Policy (declared, not tuned): recorded actions are attempted at their recorded tick; an action that cannot
// apply (credits, phase, generation) is deferred, in order, to the first tick where it can; an action still
// pending after DEFER_LIMIT ticks is dropped; actions the game never reached (defeat first) are counted separately
// as unreached. Deferred/dropped/unreached counts are reported as a fidelity measure.
// With no overrides the counterfactual player must reproduce the strict verifier's terminal state exactly.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {verifyParty}=require('./replay-party.cjs');
const ROOT=path.join(__dirname,'..');
const DEFER_LIMIT=60*60;           // one minute of simulation
const TICK_LIMIT=400000;
const FIXTURE_DIR=path.join(ROOT,'reports/replays/human-v0.4');
const PRESET_FIXTURE_DIRS={parityA:path.join(ROOT,'reports/replays/human-v0.4-parityA')};

function makeContext(search='') {
  const html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
  const src=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const canvas={getContext:()=>({}),style:{},addEventListener(){}};
  const ctx=vm.createContext({document:{getElementById:()=>canvas,createElement:()=>({})},window:{devicePixelRatio:1},
    location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,
    innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(src,ctx,{timeout:10000});
  return ctx;
}
// overrides: {hp, growth, turretDmg, cannonDmg, voltaicDmg, evolution:true|false}
// opts.instrument: observe the game through wrappers around damage / fireElectro / stepSimulation. The wrappers call
// the original functions unchanged and only count; tests pin that an instrumented run ends in the same signature.
// A replay recorded under a balance preset is replayed under that preset.
function runCounterfactual(data, overrides={}, opts={}) {
  const ctx=makeContext('?'+[data.balancePreset?'balance='+data.balancePreset:'',data.infantryTrial?'infantry=1':''].filter(Boolean).join('&'));
  ctx.__events=data.events.filter(e=>e.kind!=='speed').map(e=>({...e}));
  ctx.__ov=overrides; ctx.__initial=data.initial; ctx.__instrument=!!opts.instrument;
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
    const M={dmg:{flat:0,arc:0,electro:0}, bolts:0, hops:0, rodBreaks:0, rodBreaksAfterRodDied:0, deniedHops:0, deniedDmg:0,
      shellsResolved:0, arcHits:0, perWave:{}, brownoutTicks:0, pausedTowerTicks:0, waveTicks:0, mutationTicks:[]};
    if(__instrument){
      const baseDamage=damage;
      damage=function(e,amt,tower){ const alive=!e.dead, before=Math.max(0,e.hp);
        const r=baseDamage(e,amt,tower);
        if(alive && tower && M.dmg[tower.T.kind]!==undefined){ M.dmg[tower.T.kind]+=before-Math.max(0,e.hp); if(tower.T.kind==='arc'){ M.arcHits++; (M.perWave[S.wave]??={hits:0,shells:0}).hits++; } }
        return r; };
      const baseElectro=fireElectro;
      fireElectro=function(t,st,target){ const struck=baseElectro(t,st,target); M.bolts++; M.hops+=Math.max(0,struck.length-1);
        const last=struck[struck.length-1];
        if(last && last.rod){ M.rodBreaks++; if(last.dead) M.rodBreaksAfterRodDied++;
          // What the chain would have reached had the rod not stopped it: the same selection rule as fireElectro
          // (nearest living body within hop range, not yet struck, not already covered by reserved damage), no damage applied.
          let from=last, k=struck.length; const seen=new Set(struck);
          while(k<=st.hops){ let next=null,best=Infinity;
            for(const e of S.enemies){ if(e.dead||seen.has(e)||e.hp-e.incoming<=0) continue; const d=Math.hypot(e.x-from.x,e.y-from.y);
              if(d<=t.T.hopRange&&d<best){best=d;next=e;} }
            if(!next) break;
            M.deniedHops++; M.deniedDmg+=Math.min(st.dmg*Math.pow(t.T.hopFalloff,k), next.hp); seen.add(next); from=next; k++; }
        }
        return struck; };
      const baseStep=stepSimulation;
      stepSimulation=function(dt){ const shellsBefore=new Set(S.shells), mutBefore=S.mutations.length;
        const r=baseStep(dt);
        for(const sh of shellsBefore) if(!S.shells.includes(sh)){ M.shellsResolved++; (M.perWave[S.wave]??={hits:0,shells:0}).shells++; }
        if(S.phase==='wave'){ M.waveTicks++; (M.perWave[S.wave]??={hits:0,shells:0}).ticks=((M.perWave[S.wave].ticks)||0)+1; if(power().brown) M.brownoutTicks++; M.pausedTowerTicks+=S.towers.filter(t=>t.paused).length; }
        if(S.mutations.length>mutBefore) M.mutationTicks.push({tick:replay.tick+1,mutation:S.mutations[S.mutations.length-1]});
        return r; };
    }
    let i=0, tick=0, deferred=0, dropped=0, lateTicks=0;
    while(S.phase!=='over' && tick<${TICK_LIMIT}){
      while(i<__events.length && __events[i].tick<=tick){
        const e=__events[i];
        // a recorded wave call over a live wave is replayed as one; a call made in a pause waits for a pause
        const fits=!(e.kind==='wave'&&!e.stacked&&S.phase!=='build');
        if(fits&&performPlayerAction(e,true)){ if(tick>e.tick){deferred++; lateTicks+=tick-e.tick;} i++; continue; }
        if(tick-e.tick>${DEFER_LIMIT}){ dropped++; i++; continue; }
        break;                                   // keep order: wait for this action before trying the next
      }
      stepSimulation(SIM_STEP); tick++; replay.tick=tick;
    }
    const unreached=__events.length-i;         // actions the game never reached (defeat before their tick) — not drops
    return {win:!!S.win, gate:S.gate, wave:S.wave, credits:S.credits, kills:S.kills, mutations:[...S.mutations],
      ticks:tick, deferred, dropped, unreached, lateTicks, signature:replaySignature(), ledger:{...S.dmg},
      measures:__instrument?M:null};
  })()`,ctx,{timeout:120000});
}
// The baseline reference set contains campaign-rule games only. A preset set must contain games of exactly that preset.
function loadFixtures(dir=FIXTURE_DIR, preset='v04') {   // the v0.4 reference games are replayed under the legacy v04 rules
  const all=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort().map(f=>({name:f.replace(/\.json$/,''),data:JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))}));
  const wrong=all.filter(x=>(x.data.balancePreset??null)!==preset);
  if(wrong.length) console.error(`Skipping replays whose preset is not ${preset??'none'}: `+wrong.map(x=>x.name).join(', '));
  return all.filter(x=>(x.data.balancePreset??null)===preset);
}
function loadPresetFixtures(preset){ return loadFixtures(PRESET_FIXTURE_DIRS[preset],preset); }
function shares(d){ const tot=d.flat+d.arc+d.electro||1; return [d.flat,d.arc,d.electro].map(v=>Math.round(100*v/tot)); }
function measureRow(set,name,data,evolution){
  const r=runCounterfactual(data,{evolution},{instrument:true}), m=r.measures, sh=shares(m.dmg);
  const f=[r.deferred?'d'+r.deferred:'',r.dropped?'x'+r.dropped:'',r.unreached?'u'+r.unreached:''].filter(Boolean).join('/');
  return {set,name,evolution,win:r.win,gate:r.gate,wave:r.wave,ticks:r.ticks,fidelity:f,shares:sh,
    bolts:m.bolts,rodBreaks:m.rodBreaks,rodBreaksAfterRodDied:m.rodBreaksAfterRodDied,deniedHops:m.deniedHops,deniedDmg:Math.round(m.deniedDmg),
    electroDmg:Math.round(m.dmg.electro),bodiesPerShell:m.shellsResolved?+(m.arcHits/m.shellsResolved).toFixed(2):null,shells:m.shellsResolved,
    waveS:+(m.waveTicks/60).toFixed(1),brownoutS:+(m.brownoutTicks/60).toFixed(1),perWave:m.perWave,pausedTowerS:+(m.pausedTowerTicks/60).toFixed(1),mutations:m.mutationTicks.map(x=>x.mutation+'@'+Math.round(x.tick/60)+'s').join(' ')};
}
function measure(){
  const rows=[], sets=[['baseline',loadFixtures()],['parityA',loadPresetFixtures('parityA')]];
  for(const [set,fixtures] of sets){ baselineCheck(fixtures); for(const {name,data} of fixtures) for(const evo of [true,false]) rows.push(measureRow(set,name,data,evo)); }
  const md=['| set | timeline | evolution | outcome | ticks | damage share K/A/V % | bolts | rod breaks (rod already dead) | voltaic dmg dealt / est. denied (hops) | bodies per shell (shells) | brownout s / wave s | paused tower·s | mutations |',
            '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for(const r of rows) md.push(`| ${r.set} | ${r.name} | ${r.evolution?'on':'off'} | ${r.win?'W':'L'} g${r.gate} w${r.wave}${r.fidelity?' ('+r.fidelity+')':''} | ${r.ticks} | ${r.shares.join('/')} | ${r.bolts} | ${r.rodBreaks} (${r.rodBreaksAfterRodDied}) | ${r.electroDmg} / ${r.deniedDmg} (${r.deniedHops}) | ${r.bodiesPerShell??'—'} (${r.shells}) | ${r.brownoutS} / ${r.waveS} | ${r.pausedTowerS} | ${r.mutations||'—'} |`);
  md.push('','Bodies damaged per resolved shell, by wave (evolution on / off). Mutations apply from the wave after they appear.','',
    '| set | timeline | '+[1,2,3,4,5,6,7,8,9,10].map(w=>'w'+w).join(' | ')+' |','|---|---|'+Array(10).fill('---').join('|')+'|');
  for(const r of rows.filter(x=>x.evolution&&x.shells)){
    const off=rows.find(x=>x.set===r.set&&x.name===r.name&&!x.evolution);
    const c=w=>{ const a=r.perWave[w], b=off.perWave[w]; const f=x=>x&&x.shells?(x.hits/x.shells).toFixed(2):'—'; return f(a)+' / '+f(b); };
    md.push(`| ${r.set} | ${r.name} | `+[1,2,3,4,5,6,7,8,9,10].map(c).join(' | ')+' |');
  }
  md.push('','Wave duration in seconds, by wave (evolution on / off).','',
    '| set | timeline | '+[1,2,3,4,5,6,7,8,9,10].map(w=>'w'+w).join(' | ')+' |','|---|---|'+Array(10).fill('---').join('|')+'|');
  for(const r of rows.filter(x=>x.evolution)){
    const off=rows.find(x=>x.set===r.set&&x.name===r.name&&!x.evolution);
    const c=w=>{ const f=x=>x&&x.ticks?(x.ticks/60).toFixed(0):'—'; return f(r.perWave[w])+' / '+f(off.perWave[w]); };
    md.push(`| ${r.set} | ${r.name} | `+[1,2,3,4,5,6,7,8,9,10].map(c).join(' | ')+' |');
  }
  return {rows,md:md.join('\n')};
}
function baselineCheck(fixtures) {
  const rows=[];
  for(const {name,data} of fixtures){
    const strict=verifyParty(data);
    const cf=runCounterfactual(data,{});
    const same=cf.signature===data.terminal.signature && cf.deferred===0 && cf.dropped===0 && cf.unreached===0;
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
// Predeclared combinations of the single-factor parity shifts (run with `combos`). Not tuned values.
const COMBOS=[
  {label:'parity A: turret 8.5 + voltaic 17 + cannon 40', ov:{turretDmg:8.5,voltaicDmg:17,cannonDmg:40}},
  {label:'parity B: turret 8.5 + voltaic 17 + cannon 36', ov:{turretDmg:8.5,voltaicDmg:17,cannonDmg:36}},
  {label:'parity A @ HP x1.25',  ov:{turretDmg:8.5,voltaicDmg:17,cannonDmg:40,hp:1.25}},
  {label:'parity B @ HP x1.25',  ov:{turretDmg:8.5,voltaicDmg:17,cannonDmg:36,hp:1.25}},
  {label:'parity B @ growth 0.10', ov:{turretDmg:8.5,voltaicDmg:17,cannonDmg:36,growth:0.10}},
];
function cell(r){ const f=[r.deferred?`d${r.deferred}`:'',r.dropped?`x${r.dropped}`:'',r.unreached?`u${r.unreached}`:''].filter(Boolean).join('/'); return `${r.win?'W':'L'} g${r.gate} w${r.wave} t${r.ticks}${f?` (${f})`:''}`; }
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
function combos(fixtures){
  const md=['\n### Predeclared combinations\n','| combination | evolution | '+fixtures.map(x=>x.name).join(' | ')+' |','|---|---|'+fixtures.map(()=>'---').join('|')+'|'];
  const out=[];
  for(const c of COMBOS) for(const evolution of [true,false]){
    const row=fixtures.map(({name,data})=>{const r=runCounterfactual(data,{...c.ov,evolution}); out.push({combo:c.label,evolution,timeline:name,...r}); return cell(r);});
    md.push(`| ${c.label} | ${evolution?'on':'off'} | ${row.join(' | ')} |`);
  }
  return {out,md:md.join('\n')};
}
function main(){
  const args=process.argv.slice(2);
  const fixtures=loadFixtures();
  console.log('Baseline fidelity (strict verifier vs counterfactual player, no overrides):');
  for(const r of baselineCheck(fixtures)) console.log(`  ${r.name.padEnd(14)} verified=${r.strict} exact=${r.exact} ${r.win?'W':'L'} gate ${r.gate}`);
  if(args.includes('measure')){ const {rows,md}=measure(); console.log(md);
    const gen=path.join(ROOT,'reports/generated'); fs.mkdirSync(gen,{recursive:true}); fs.writeFileSync(path.join(gen,'replay-measures.json'),JSON.stringify(rows,null,2)+'\n'); return; }
  if(args.includes('combos')){ const {out,md}=combos(fixtures); console.log(md);
    const gen=path.join(ROOT,'reports/generated'); fs.mkdirSync(gen,{recursive:true}); fs.writeFileSync(path.join(gen,'replay-combos.json'),JSON.stringify(out,null,2)+'\n'); return; }
  const factorNames=args.filter(a=>FACTORS[a]); const which=factorNames.length?factorNames:Object.keys(FACTORS);
  const {out,md}=sweep(fixtures,which);
  console.log(md);
  console.log('\nCell format: W/L = win/loss, g = Gate HP at end, w = last wave, t = simulation ticks, (dN/xM/uK) = N deferred, M dropped after waiting, K unreached because the game ended first. Evolution off = EVOLUTION_WAVES emptied.');
  const gen=path.join(ROOT,'reports/generated'); fs.mkdirSync(gen,{recursive:true});
  fs.writeFileSync(path.join(gen,'replay-sweep.json'),JSON.stringify({policy:'defer-in-order, drop after 3600 ticks',factors:out},null,2)+'\n');
  fs.writeFileSync(path.join(gen,'replay-sweep.md'),md+'\n');
}
if(require.main===module){ try{main();}catch(e){console.error(e.message);process.exitCode=1;} }
module.exports={runCounterfactual,baselineCheck,loadFixtures,loadPresetFixtures,measure,FACTORS,COMBOS};
