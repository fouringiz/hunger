// v0.13: the Polyp family draws from baked atlases. Presentation only: the rules and source fingerprints stay at the
// simulation baseline, every draw is read-only, a dying Polyp leaves one frozen three-frame burst at its drawn death
// point (and no generic death ring), and the zygote hatch plays its frames in order before the Polypoid appears.
'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {loadImage}=require('@napi-rs/canvas');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const baseline=require('../reports/carapacid-shelter/simulation-baseline.json');
(async()=>{
  for(const kind of ['polyp','polypoid','zygote']){
    const table=require(`../assets/hunger-${kind}-v1.frames.json`),image=await loadImage(path.join(__dirname,'../assets',table.atlas));
    assert.deepEqual([image.width,image.height],[table.cell*table.columns,table.cell*table.rows],kind+': atlas matches its frame table');
    if(kind!=='zygote')assert.deepEqual(table.clips.filter(c=>c.direction).map(c=>c.direction),['right','down','left','up'],kind+': four directions');
  }
  const {run}=await loadWorld({zone:'mire'});
  assert.equal(run('replayRulesFingerprint()'),baseline.rules,'rules fingerprint unchanged');
  assert.equal(run('replaySourceFingerprint()'),baseline.source,'source fingerprint unchanged');
  assert.ok(run("polypFamilyReady('polyp')&&polypFamilyReady('polypoid')&&polypFamilyReady('zygote')"),'atlases load in the capture world');
  const draw=()=>{const s=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),s,'drawing is read-only');};
  run("reset();S.phase='wave';S.wave=6;S.spawnQueue=[];S.streams=[];var p=makeEnemy('polyp',6);p.wave=6;p.seq=2;p.d=420;Object.assign(p,posAt(420));p.hp=1;S.enemies=[p];");
  draw();assert.equal(run('polypDeaths.length'),0,'no burst while alive');
  run('damage(p,10,null);update(SIM_STEP);presentationTime+=SIM_STEP;');draw();
  assert.equal(run('polypDeaths.length'),1,'one burst for one death');assert.equal(run('S.zygotes.length'),6,'the simulation placed its zygotes');
  const at=JSON.parse(run('JSON.stringify(polypDeaths[0])')),v=JSON.parse(run('JSON.stringify(visualEnemy(p))'));
  assert.ok(Math.hypot(at.x-v.x,at.y-v.y)<1e-9,'the burst sits at the drawn death point');
  assert.ok(run("S.fx.some(f=>f.kind==='death'&&f.color===ENEMY.polyp.color)"),'the simulation still records its death effect');
  const frames=[];
  for(let i=0;i<6;i++){frames.push(run('polypDeaths.length?Math.min(2,Math.floor((presentationTime-polypDeaths[0].at)/POLYP_DEATH_TIME*3)):-1'));run('update(0.06);presentationTime+=0.06;');draw();}
  assert.deepEqual(frames.filter(f=>f>=0),[...frames.filter(f=>f>=0)].sort(),'burst frames advance');
  assert.ok(frames.includes(0)&&frames.includes(2),'all three burst frames show');assert.equal(run('polypDeaths.length'),0,'the burst ends after POLYP_DEATH_TIME');
  // A Polyp that walks into the Gate does not burst.
  run("var q=makeEnemy('polyp',6);q.wave=6;q.seq=3;q.d=GATE_D-1;Object.assign(q,posAt(q.d));S.enemies=[q];S.zygotes=[];");draw();
  run('update(0.2);presentationTime+=0.2;');draw();assert.equal(run('polypDeaths.length'),0,'a leak is not a death');
  console.log('PASS polyp family art: atlases match tables, fingerprints at baseline, read-only burst at the death point');
})().catch(e=>{console.error(e);process.exitCode=1;});
