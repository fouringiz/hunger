// Every caste must survive draw() with every marker the renderer can put on a body: a health bar, a Grounding rod,
// each mutation, slow and burn. v0.10 added Aeroplankton and the Polyps without teaching the ground-actor metrics about
// them, so the first hit on one of them threw inside draw() and the frame loop stopped (the game "froze" with no HUD).
'use strict';
const assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
  const {run}=await loadWorld({zone:'mire',viewport:[964,631]});
  const castes=JSON.parse(run('JSON.stringify(Object.keys(ENEMY))')),mutations=JSON.parse(run('JSON.stringify(Object.keys(MUT))'));
  assert.ok(castes.includes('aero')&&castes.includes('polyp')&&castes.includes('polypoid'),'the v0.10 castes are under test');
  const states={
    fresh:'', hurt:'b.hp=b.maxHp*0.4;', rod:'b.rod=true;', slowed:'b.slowUntil=S.time+5;', burning:'b.burnUntil=S.time+5;',
    ...Object.fromEntries(mutations.map(m=>['mut:'+m,`b.muts=['${m}'];`])),
    everything:`b.hp=1;b.rod=true;b.slowUntil=S.time+5;b.burnUntil=S.time+5;b.muts=${JSON.stringify(mutations)};`,
  };
  let drawn=0;
  for(const caste of castes)for(const [name,setup]of Object.entries(states)){
    run(`reset();S.phase='wave';S.wave=6;S.spawnQueue=[];var b=makeEnemy('${caste}',6);b.wave=6;b.d=320;Object.assign(b,posAt(b.d));${setup}S.enemies=[b];`);
    const signature=run('replaySignature()');
    try{ run('draw();'); }
    catch(e){ assert.fail(`draw() threw for ${caste} (${name}): ${e.message}`); }
    assert.equal(run('replaySignature()'),signature,`rendering ${caste} (${name}) is read-only`);
    const point=JSON.parse(run('JSON.stringify(enemyBodyPoint(b))')),height=run("typeof enemyBodyHeight==='function'?enemyBodyHeight(b):1");
    assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(height)&&height>0,`${caste}: body point and height are numbers`);
    drawn++;
  }
  console.log(`caste-markers-draw: ${drawn} caste/marker combinations drawn without throwing`);
})().catch(e=>{console.error(e);process.exitCode=1;});
