// Deterministic, headless experiments against the actual prototype simulation.
// dt is the elapsed time delivered per call; update always uses SIM_STEP ticks.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../prototype/index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const canvas = {getContext: () => ({}), style: {}, addEventListener() {}};
const context = vm.createContext({document: {getElementById: () => canvas}, window: {devicePixelRatio: 1}, innerWidth: 960, innerHeight: 540, addEventListener() {}, requestAnimationFrame() {}, performance: {now: () => 0}});
vm.runInContext(source, context);
const experiment = `
function runTrial(strategy, mode, layout, dt, stopBeforeWave = Infinity) {
  reset(); S.phase = 'build';
  const waves = [], decisions = [];
  const preferred = strategy === 'cannon' ? 'cannon' : 'turret';
  function coverage(slot, type, level=1) {
    const T = TOWER[type], range = T.range + 15*(level-1);
    let score=0;
    for(let d=0; d<GATE_D; d+=15) {
      const p=posAt(d), dist=Math.hypot(slot.x-p.x,slot.y-p.y);
      if(dist<=range && (!T.minRange || dist>=T.minRange)) score += 1 + (layout%3)*0.4*(1-d/GATE_D);
    }
    // Six reproducible placement preferences, identical across paired conditions.
    return score * (1 + 0.12*Math.sin((SLOTS.indexOf(slot)+1)*(layout+1)));
  }
  function shop() {
    let type=preferred;
    if(strategy==='mixed') {
      const flat=S.towers.filter(t=>t.type==='turret').reduce((n,t)=>n+t.invested,0);
      const arc=S.towers.filter(t=>t.type==='cannon').reduce((n,t)=>n+t.invested,0);
      type=flat<=arc?'turret':'cannon';
    }
    if(mode==='adapt' && S.wave>=4 && strategy!=='mixed') type=preferred==='turret'?'cannon':'turret';
    const T=TOWER[type], candidates=[];
    for(const slot of SLOTS) if(!slot.tower) candidates.push({cost:T.cost, extra:T.power, value:coverage(slot,type)*T.dmg/T.interval/T.cost, go:()=>build(slot,type)});
    for(const t of S.towers) if(t.type===type && t.level<3) {
      const st=tstats(t), nextDamage=T.dmg*Math.pow(1.35,t.level), nextInterval=T.interval*(t.level===2?0.85:1);
      candidates.push({cost:T.upg[t.level],extra:5,value:(coverage(t.slot,type,t.level+1)*nextDamage/nextInterval-coverage(t.slot,type,t.level)*st.dmg/st.interval)/T.upg[t.level],go:()=>upgrade(t)});
    }
    candidates.sort((a,b)=>b.value-a.value);
    const action=candidates.find(c=>c.cost<=S.credits);
    if(!action)return false;
    const pw=power();
    if(pw.cons+action.extra>pw.prod) {
      const gen=S.towers.find(t=>t.type==='generator' && t.level<3 && t.T.upg[t.level]<=S.credits);
      if(gen){upgrade(gen);return true;}
      const slot=SLOTS.filter(s=>!s.tower).sort((a,b)=>(coverage(a,'turret')+coverage(a,'cannon'))-(coverage(b,'turret')+coverage(b,'cannon')))[0];
      if(slot && S.credits>=TOWER.generator.cost){build(slot,'generator');return true;}
      return false;
    }
    action.go();return true;
  }
  for(let wave=1;wave<=WAVES && S.phase!=='over';wave++) {
    if(wave === stopBeforeWave) break;
    if(mode==='none')S.mutations=[];
    if(mode==='forced' || mode==='adapt')S.mutations=wave>=9?['keratin','sprinter']:wave>=5?[preferred==='cannon'?'sprinter':'keratin']:[];
    for(let j=0;j<100 && shop();j++);
    decisions.push({wave,credits:S.credits,towers:S.towers.map(t=>({type:t.type,level:t.level,slot:SLOTS.indexOf(t.slot)}))});
    startWave(); let steps=0, brown=0;
    while(S.phase==='wave' && steps<20000){if(power().brown)brown+=dt;update(dt);steps++;}
    if(steps>=20000)throw Error('Simulation timeout');
    waves.push({wave,gate:S.gate,leaked:S.waveLeaked,coordinatorEscaped:S.coordEscaped,mutations:[...S.mutations],brownSeconds:Math.round(brown),seconds:Math.round(steps*dt)});
  }
  return {strategy,mode,layout,dt,win:S.win,gate:S.gate,lastWave:S.wave,kills:S.kills,credits:S.credits,waves,decisions};
}
`;
vm.runInContext(experiment, context);
module.exports = {source, experiment};
if (require.main === module) {
const results=[];
for(const dt of [0.05, 1/60]) for(const strategy of ['turret','cannon','mixed']) for(let layout=0;layout<6;layout++) for(const mode of ['none','natural','forced','adapt']) {
  results.push(vm.runInContext(`runTrial(${JSON.stringify(strategy)},${JSON.stringify(mode)},${layout},${dt})`,context));
}
fs.mkdirSync(path.join(__dirname, '../reports/generated'), {recursive: true});
fs.writeFileSync(path.join(__dirname,'../reports/generated/balance-results.json'),JSON.stringify(results,null,2)+'\n');
for(const dt of [0.05,1/60]) for(const strategy of ['turret','cannon','mixed']) for(const mode of ['none','natural','forced','adapt']) {
  const rows=results.filter(r=>r.dt===dt&&r.strategy===strategy&&r.mode===mode);
  console.log(JSON.stringify({dt,strategy,mode,wins:rows.filter(r=>r.win).length,meanGate:rows.reduce((n,r)=>n+r.gate,0)/rows.length,meanLastWave:rows.reduce((n,r)=>n+r.lastWave,0)/rows.length,mutatedRuns:rows.filter(r=>r.waves.some(w=>w.mutations.length)).length}));
}
}
