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
console.log('3 sweep scenarios, 0 failures');
