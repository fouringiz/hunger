// Separate, playable experiment. No canonical prototype or passport is rewritten.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {source, experiment} = require('./check-balance.cjs');
const root = path.join(__dirname, '..');
const overlay = fs.readFileSync(path.join(root, 'experiments/background-evolution.js'), 'utf8');
const canvas = {getContext:()=>({}), style:{}, addEventListener(){}};
const context = vm.createContext({document:{getElementById:()=>canvas}, window:{devicePixelRatio:1},
  innerWidth:960, innerHeight:540, addEventListener(){}, requestAnimationFrame(){}, performance:{now:()=>0}, structuredClone, assert});
vm.runInContext(source + '\n' + overlay + '\n' + experiment, context);
vm.runInContext(`
function compareResponses(strategy, layout, hpMultiplier) {
  EVOLUTION_EXPERIMENT.enabled = true; EVOLUTION_EXPERIMENT.hpMultiplier = hpMultiplier;
  const prefix = runTrial(strategy, 'natural', layout, SIM_STEP, 5);
  if (S.phase === 'over') return {strategy,layout,hpMultiplier,prefix,eligible:false};
  assert.equal(S.wave,4); assert.equal(S.mutations.length,1);
  const saved = structuredClone({state:S,slots:SLOTS});
  const budget = Math.min(110, S.credits);
  const plans = [{kind:'none',cost:0}];
  for (let slot=0; slot<SLOTS.length; slot++) {
    const t=SLOTS[slot].tower;
    if(t && t.type===strategy && t.level<3 && t.T.upg[t.level]<=budget && power().cons+5<=power().prod)
      plans.push({kind:'upgrade',slot,cost:t.T.upg[t.level]});
    if(!t) for(const type of ['turret','cannon'])
      if(TOWER[type].cost<=budget && power().cons+TOWER[type].power<=power().prod)
        plans.push({kind:type===strategy?'same-weapon':'switch-weapon',slot,type,cost:TOWER[type].cost});
  }
  const results=[];
  for(const mutations of [false,true]) for(const plan of plans) {
    const clone=structuredClone(saved); S=clone.state; SLOTS.splice(0,SLOTS.length,...clone.slots);
    if(!mutations)S.mutations=[];
    const beforeCredits=S.credits, beforeGate=S.gate;
    if(plan.kind==='upgrade')upgrade(SLOTS[plan.slot].tower);
    else if(plan.type)build(SLOTS[plan.slot],plan.type);
    assert.equal(beforeCredits-S.credits,plan.cost); assert.ok(!power().brown);
    const energy=power().cons; startWave();
    let ticks=0; while(S.phase==='wave' && ticks++<30000)update(SIM_STEP);
    assert.notEqual(S.phase,'wave','simulation timeout');
    results.push({mutations,plan,energy,gateLoss:beforeGate-S.gate,gate:S.gate,leaked:S.waveLeaked});
  }
  return {strategy,layout,hpMultiplier,eligible:true,prefix,budget,mutation:saved.state.mutations[0],results};
}
`, context);

// UI copy is changed only in the generated experimental page.
let html = fs.readFileSync(path.join(root, 'prototype/index.html'), 'utf8');
html = html.replaceAll('Ultimate TD — core loop prototype v0.2', 'Ultimate TD — Background evolution experiment')
  .replace('Leeches (wave 5+) drain generators and feed the swarm. The Coordinator (waves 4, 8) only watches:',
    'No Coordinator. After waves 4 and 8 the swarm evolves against your dominant damage type.')
  .replace('it rides mid-wave behind a Carapacid shield, turns at mid-lane and slips back out. Kill it before it reports, or the swarm mutates.',
    'Marsh announces the mutation before the next wave. Prepare during the build phase. Experimental rules.')
  .replace('Begin campaign', 'Begin experiment')
  .replace('</script>', '\n' + overlay + '\n</script>');
const generated = path.join(root, 'reports/generated');
fs.mkdirSync(generated, {recursive:true});
fs.writeFileSync(path.join(generated, 'background-evolution.html'), html);
const pressureHtml = html
  .replaceAll('Ultimate TD — Background evolution experiment', 'Ultimate TD — Background evolution: HP ×1.5')
  .replace('const EVOLUTION_EXPERIMENT = {enabled:true, hpMultiplier:1,', 'const EVOLUTION_EXPERIMENT = {enabled:true, hpMultiplier:1.5,')
  .replace('Experimental rules.', 'Enemy HP ×1.5 — draft pressure test.');
fs.writeFileSync(path.join(generated, 'background-evolution-pressure.html'), pressureHtml);
// Execute the exact generated pages too, so a missing overlay is a build failure.
for (const [page, expectedHp] of [[html,1],[pressureHtml,1.5]]) {
  const c=vm.createContext({document:{getElementById:()=>canvas},window:{devicePixelRatio:1},
    innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(page.match(/<script>([\s\S]*?)<\/script>/)[1],c);
  assert.equal(vm.runInContext('EVOLUTION_EXPERIMENT.hpMultiplier',c),expectedHp);
  assert.equal(vm.runInContext("waveDef(4).some(e=>e.type==='coordinator')",c),false);
}

// Smoke checks: an independent schedule, correct damage selection, no duplicate
// mutations, and no Coordinator or hidden income from killing one.
vm.runInContext(`
  assert.ok(waveDef(4).every(e=>e.type!=='coordinator'));
  reset(); S.wave=3; startWave(); assert.equal(S.coordInWave,false);
  S.dmg={flat:100,arc:0}; endWave(); assert.deepEqual(S.mutations,['keratin']);
  S.wave=8; S.dmg={flat:100,arc:0}; endWave(); assert.deepEqual(S.mutations,['keratin','sprinter']);
  reset(); S.wave=4; S.dmg={flat:0,arc:100}; endWave(); assert.deepEqual(S.mutations,['sprinter']);
  reset(); S.wave=3; endWave(); assert.equal(S.mutations.length,0);
  reset(); EVOLUTION_EXPERIMENT.enabled=false; S.wave=4; endWave(); assert.equal(S.mutations.length,0);
  EVOLUTION_EXPERIMENT.enabled=true;
`, context);
if (process.argv.includes('--build-only')) {
  console.log('PASS: generated experimental pages and schedule checks.');
  process.exit(0);
}
const campaigns=[];
for(const hpMultiplier of [1,1.5,2]) for(const enabled of [false,true]) for(const strategy of ['turret','cannon','mixed']) for(let layout=0;layout<3;layout++) {
  vm.runInContext('EVOLUTION_EXPERIMENT.enabled='+enabled+'; EVOLUTION_EXPERIMENT.hpMultiplier='+hpMultiplier,context);
  campaigns.push({hpMultiplier,enabled,...vm.runInContext('runTrial('+JSON.stringify(strategy)+',"natural",'+layout+',SIM_STEP)',context)});
}
const controls=[];
for(const hpMultiplier of [1,1.5,2]) for(const strategy of ['turret','cannon']) for(let layout=0;layout<3;layout++)
  controls.push(vm.runInContext('compareResponses('+JSON.stringify(strategy)+','+layout+','+hpMultiplier+')',context));
fs.writeFileSync(path.join(generated,'background-evolution-results.json'),JSON.stringify({campaigns,controls},null,2)+'\n');
for(const hpMultiplier of [1,1.5,2]) for(const enabled of [false,true]) {
  const rows=campaigns.filter(r=>r.hpMultiplier===hpMultiplier && r.enabled===enabled);
  console.log(JSON.stringify({hpMultiplier,enabled,strategies:['turret','cannon','mixed'].map(strategy=>{
    const r=rows.filter(x=>x.strategy===strategy);return {strategy,wins:r.filter(x=>x.win).length,clean:r.filter(x=>x.gate===20&&x.win).length,gates:r.map(x=>x.gate),mutations:r.map(x=>x.waves.at(-1).mutations)};
  })}));
}
console.log('PASS: experimental schedule checks. Generated playable page and '+campaigns.length+' campaigns / '+controls.length+' paired response groups.');
