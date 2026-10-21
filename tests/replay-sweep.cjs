// The counterfactual player must reproduce every recorded human timeline exactly when no rule is overridden,
// and the tool's override hooks must change the game in the declared direction.
'use strict';
const assert=require('node:assert/strict');
const {runCounterfactual,baselineCheck,loadFixtures}=require('../tools/replay-sweep.cjs');
const fixtures=loadFixtures();
assert.ok(fixtures.length>=4,'four human timelines are the reference set');
for(const r of baselineCheck(fixtures)) assert.ok(r.strict&&r.exact,`${r.name}: strict verifier and counterfactual player agree`);
console.log('PASS counterfactual player reproduces all recorded timelines exactly');
const cannon=fixtures.find(f=>f.name==='cannon-only').data;
const weaker=runCounterfactual(cannon,{cannonDmg:36});
assert.ok(!weaker.win||weaker.gate<20,'a weaker cannon does not sweep the cannon-only timeline clean');
console.log('PASS cannon damage override changes the outcome in the declared direction');
const noEvo=runCounterfactual(fixtures.find(f=>f.name==='voltaic-only').data,{evolution:false});
assert.equal(noEvo.mutations.length,0,'evolution off produces no mutations');
console.log('PASS evolution override removes the schedule');
const {loadPresetFixtures}=require('../tools/replay-sweep.cjs');
const preset=loadPresetFixtures('parityA');
assert.equal(preset.length,4,'the parityA candidate set holds four games');
for(const r of baselineCheck(preset)) assert.ok(r.strict&&r.exact,`${r.name} (parityA): strict verifier and counterfactual player agree under the preset`);
console.log('PASS the parityA candidate set reproduces exactly under its preset');
for(const {name,data} of [...fixtures,...preset]){
  const plain=runCounterfactual(data,{}), measured=runCounterfactual(data,{},{instrument:true});
  assert.equal(measured.signature,plain.signature,`${name}: instrumentation must not change the game`);
}
console.log('PASS instrumented runs end in the same state as plain runs on all eight games');
const v=runCounterfactual(fixtures.find(f=>f.name==='voltaic-only').data,{},{instrument:true}).measures;
assert.ok(v.rodBreaks>0 && v.rodBreaksAfterRodDied>0 && v.rodBreaksAfterRodDied<v.rodBreaks,'rod breaks are counted, including chains stopped by a rod that died from the hit');
const vOff=runCounterfactual(fixtures.find(f=>f.name==='voltaic-only').data,{evolution:false},{instrument:true}).measures;
assert.equal(vOff.rodBreaks,0,'no Grounding, no rod breaks');
console.log('PASS chain breaks are measured only under Grounding');
console.log('6 sweep scenarios, 0 failures');
