// Does a scheduled mutation change the next wave, and what answers it?
// Part A reproduces the documented wave-4/5 control at several refresh rates and speeds.
// Part B replays paired responses to the first mutation across draft HP pressure.
// Replaces tools/check-coordinator.cjs and tools/check-background-evolution.cjs:
// the schedule lives in the prototype now, so no overlay is loaded.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {source, experiment} = require('./check-balance.cjs');
const root = path.join(__dirname, '..');
const generated = path.join(root, 'reports/generated');
const canvas = {getContext: () => ({}), style: {}, addEventListener() {}};
const context = vm.createContext({document: {getElementById: () => canvas}, window: {devicePixelRatio: 1},
  innerWidth: 960, innerHeight: 540, addEventListener() {}, requestAnimationFrame() {},
  performance: {now: () => 0}, structuredClone, assert});
vm.runInContext(source + '\n' + experiment, context);

// ---- Part A: the known layout, played at several refresh rates and game speeds.
vm.runInContext(`
function evolutionControl(action, frameSeconds, speed) {
  HP_MULT = 1;
  EVOLUTION_WAVES.splice(0, EVOLUTION_WAVES.length, ...BASE_EVOLUTION_WAVES);
  reset(); build(SLOTS[8], 'turret'); build(SLOTS[9], 'cannon');
  const startingCredits = S.credits;
  S.wave = BASE_EVOLUTION_WAVES[0] - 1;
  function playWave() {
    startWave();
    let frames = 0;
    while (S.phase === 'wave' && frames++ < 60000) update(frameSeconds * speed);
    assert.equal(S.phase, 'build', 'wave must finish with the Gate alive');
    return {wave:S.wave, gate:S.gate, leaked:S.waveLeaked, kills:S.waveKills,
      mutations:[...S.mutations], credits:S.credits};
  }
  const scheduled = playWave();
  assert.equal(scheduled.mutations.length, 1, 'the schedule must grant one mutation');
  if (action === 'unmutated') S.mutations = [];
  if (action === 'add-turret') { build(SLOTS[0], 'turret'); assert.ok(SLOTS[0].tower); }
  if (action === 'upgrade-cannon') { upgrade(SLOTS[9].tower); assert.equal(SLOTS[9].tower.level, 2); }
  if (action === 'upgrade-turret') { upgrade(SLOTS[8].tower); assert.equal(SLOTS[8].tower.level, 2); }
  const purchaseCost = scheduled.credits - S.credits, energy = power();
  assert.ok(!energy.brown);
  return {startingCredits, scheduled, purchaseCost, energy, next: playWave()};
}
`, context);

const actions = ['unmutated', 'unchanged', 'add-turret', 'upgrade-cannon', 'upgrade-turret'];
const controls = [];
for (const fps of [30, 60, 120]) for (const speed of [1, 2]) for (const action of actions) {
  controls.push({fps, speed, action,
    control: vm.runInContext(`evolutionControl(${JSON.stringify(action)}, ${1 / fps}, ${speed})`, context)});
}
const baseline = controls.filter(row => row.fps === 60 && row.speed === 1);
for (const row of controls) assert.deepEqual(row.control, baseline.find(b => b.action === row.action).control,
  `different outcome at ${row.fps} fps, speed ${row.speed}, ${row.action}`);
const unmutated = baseline.find(row => row.action === 'unmutated').control.next;
const unchanged = baseline.find(row => row.action === 'unchanged').control.next;
assert.ok(unchanged.leaked > unmutated.leaked, 'the mutation must have a measurable effect');
for (const action of actions.slice(2)) {
  const reinforced = baseline.find(row => row.action === action).control.next;
  assert.ok(reinforced.leaked < unchanged.leaked && reinforced.gate > unchanged.gate, action);
}

// ---- Part B: paired responses to the first mutation, within one affordable budget.
vm.runInContext(`
function compareResponses(strategy, layout, hpMultiplier) {
  HP_MULT = hpMultiplier;
  const firstEvolution = BASE_EVOLUTION_WAVES[0];
  const prefix = runTrial(strategy, 'natural', layout, SIM_STEP, firstEvolution + 1);
  if (S.phase === 'over') return {strategy,layout,hpMultiplier,prefix,eligible:false};
  assert.equal(S.wave, firstEvolution); assert.equal(S.mutations.length, 1);
  const saved = structuredClone({state:S, slots:SLOTS});
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

// A playable pressure page for the user playtest: enemy HP only, no other change.
const prototype = fs.readFileSync(path.join(root, 'prototype/index.html'), 'utf8');
const pressure = prototype
  .replaceAll('Ultimate TD — core loop prototype v0.3', 'Ultimate TD — evolution pressure: HP ×1.5')
  .replace('</script>', `
const __coreMakeEnemy = makeEnemy;                 // research page only: draft pressure, not canon
makeEnemy = function(type, n) { const e = __coreMakeEnemy(type, n); e.hp *= 1.5; e.maxHp *= 1.5; return e; };
</script>`);
fs.mkdirSync(generated, {recursive: true});
fs.writeFileSync(path.join(generated, 'evolution-pressure.html'), pressure);

if (process.argv.includes('--control-only')) {
  for (const row of baseline) console.log(JSON.stringify({action:row.action, ...row.control}));
  console.log(`PASS: ${controls.length} controls agree across refresh rates and speeds.`);
  process.exit(0);
}

const campaigns = [];
for (const hpMultiplier of [1, 1.5, 2]) for (const scheduled of [false, true])
  for (const strategy of ['turret','cannon','mixed']) for (let layout = 0; layout < 3; layout++) {
    vm.runInContext('HP_MULT = ' + hpMultiplier, context);
    campaigns.push({hpMultiplier, scheduled,
      ...vm.runInContext(`runTrial(${JSON.stringify(strategy)},${scheduled ? '"natural"' : '"none"'},${layout},SIM_STEP)`, context)});
  }
const responses = [];
for (const hpMultiplier of [1, 1.5, 2]) for (const strategy of ['turret','cannon'])
  for (let layout = 0; layout < 3; layout++)
    responses.push(vm.runInContext(`compareResponses(${JSON.stringify(strategy)},${layout},${hpMultiplier})`, context));

fs.writeFileSync(path.join(generated, 'evolution-response-results.json'),
  JSON.stringify({simulationStep: vm.runInContext('SIM_STEP', context), controls, campaigns, responses}, null, 2) + '\n');
for (const row of baseline) console.log(JSON.stringify({action:row.action, ...row.control}));
for (const hpMultiplier of [1, 1.5, 2]) for (const scheduled of [false, true]) {
  const rows = campaigns.filter(r => r.hpMultiplier === hpMultiplier && r.scheduled === scheduled);
  console.log(JSON.stringify({hpMultiplier, scheduled, strategies: ['turret','cannon','mixed'].map(strategy => {
    const r = rows.filter(x => x.strategy === strategy);
    return {strategy, wins:r.filter(x => x.win).length, clean:r.filter(x => x.gate === 20 && x.win).length,
      gates:r.map(x => x.gate), mutations:r.map(x => x.waves.at(-1).mutations)};
  })}));
}
console.log(`PASS: ${controls.length} controls, ${campaigns.length} campaigns and ${responses.length} paired response groups.`);
