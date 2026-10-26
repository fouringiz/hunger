'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
 const sourceHtml=execFileSync('git',['show','22e4d45:prototype/index.html'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
 for(const zone of ['mire','ember']){
  const before=await loadWorld({zone,sourceHtml}),after=await loadWorld({zone});
  const setup="reset();S.phase='wave';S.spawnQueue=[];S.enemies=[makeEnemy('forager',1)];S.enemies[0].d=70;Object.assign(S.enemies[0],posAt(70));";
  for(const world of [before,after])world.run(setup);
  // Simulation fingerprints follow the approved-simulation baseline (shelter, v0.10 castes); geometry still matches the visual baseline commit.
  const sim=require('../reports/carapacid-shelter/simulation-baseline.json');
  assert.equal(after.run('replayRulesFingerprint()'),sim.rules,'rules');assert.equal(after.run('replaySourceFingerprint()'),sim.source,'source');
  for(const expr of ['JSON.stringify(PATH)','GATE_D','JSON.stringify(SLOTS)'])assert.equal(after.run(expr),before.run(expr),expr);
  for(let frame=0;frame<8;frame++){
   for(const world of [before,after])world.run('for(let tick=0;tick<8;tick++){stepSimulation(SIM_STEP);presentationTime+=SIM_STEP;}draw();');
   const pixels=world=>Buffer.from(world.canvas.getContext('2d').getImageData(0,0,world.canvas.width,world.canvas.height).data);
   assert.ok(pixels(before).equals(pixels(after)),`${zone} Forager-only scene remains pixel-identical at frame ${frame}`);
   assert.equal(after.run('replaySignature()'),before.run('replaySignature()'),'simulation parity');
  }
 }
 console.log('PASS creature mire: baseline geometry/rules and Forager scene pixels unchanged in both zones');
})().catch(e=>{console.error(e);process.exitCode=1;});
