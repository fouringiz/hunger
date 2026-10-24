'use strict';
const assert=require('node:assert/strict');
const {createCanvas}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const baseline=require('../reports/gate-integration/baseline.json');
// Shelter movement was explicitly authorized after this visual baseline. Keep its geometry checks.
Object.assign(baseline,require('../reports/carapacid-shelter/simulation-baseline.json'));
(async()=>{
 for(const zone of ['mire','ember']){
  const {canvas,run,images}=await loadWorld({zone});
  run("reset();S.phase='wave';S.spawnQueue=[];presentationTime=2;draw();");
  for(const [expr,key]of [['replayRulesFingerprint()','rules'],['replaySourceFingerprint()','source'],['GATE_D','gateD']])assert.equal(run(expr),baseline[key]);
  for(const [expr,key]of [['PATH','path'],['SLOTS.map(s=>[s.x,s.y])','slots'],['GATE_DETAIL_BOX','box'],['GATE_FLOOR','floor']])assert.equal(run('JSON.stringify('+expr+')'),JSON.stringify(baseline[key]),key+' must stay unchanged');
  const signature=run('replaySignature()'),surface=run('gateSurface()');assert.equal(run('gateSurface()'),surface,'material is cached');
  const raw=createCanvas(surface.width,surface.height),g=raw.getContext('2d');g.drawImage(images.gateDetailArt,0,0,raw.width,raw.height);
  const before=g.getImageData(0,0,raw.width,raw.height).data,after=surface.getContext('2d').getImageData(0,0,raw.width,raw.height).data;
  let feathered=0,cyanPreserved=0,warm=0,core=0;
  for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++){
   const k=(y*raw.width+x)*4;
   if(y<raw.height*.84){
    assert.equal(after[k+3],before[k+3],'accepted upper silhouette/projection unchanged');
    // The approved cutout's solid interior has alpha around 249–253, not 255.
    if(before[k+3]>240){
     const cyan=before[k+1]>before[k]*1.16&&before[k+2]>before[k]*1.2;
     if(cyan){for(let channel=0;channel<3;channel++)assert.ok(Math.abs(after[k+channel]-before[k+channel])<=1,'cyan RGB preserved through alpha roundtrip');cyanPreserved++;}
     else{core++;if(after[k]>before[k]&&after[k+1]<before[k+1])warm++;}
    }
   }
   if(y>raw.height*.95&&before[k+3]>220&&after[k+3]<before[k+3]-30)feathered++;
  }
  assert.ok(feathered>500,'bottom cutout seam must blend into the ground');assert.ok(cyanPreserved>1000,'cyan portal must survive zone grading');
  if(zone==='ember')assert.ok(warm/core>.8,'Ember masonry/moss must be warmer than original green art');
  assert.equal(run('portalLightAmount({x:GATE.x-81,y:GATE.y})'),0);assert.ok(run('portalLightAmount({x:GATE.x-30,y:GATE.y})')>.5);
  // Compare actual renderer body pixels at the same location, with light enabled/disabled.
  for(const type of ['forager','carapacid','leech']){
   run(`S.gate=0;const actor_${type}=makeEnemy('${type}',1);actor_${type}.x=GATE.x-30;actor_${type}.y=GATE.y;actor_${type}.d=GATE_D-30;ctx.clearRect(0,0,W,H);enemyArt(actor_${type});`);
   const unlit=Buffer.from(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data);
   run(`S.gate=20;ctx.clearRect(0,0,W,H);enemyArt(actor_${type});`);
   const lit=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let brighter=0;
   for(let i=0;i<lit.length;i+=4)if(unlit[i+3]>220&&lit[i+2]>unlit[i+2]+8)brighter++;
   assert.ok(brighter>20,type+' body pixels must pick up cyan light');
  }
  run('ctx.clearRect(0,0,W,H);terrain();drawGateApproach();');
  const px=run('GATE.x-35'),py=run('GATE.y+5'),screen=canvas.getContext('2d').getImageData(px*2,py*2,10,6).data;
  const contact=run('worldLiveArt').getContext('2d').getImageData(px*2,py*2,10,6).data;
  assert.deepEqual(Buffer.from(contact),Buffer.from(screen),'burial samples exactly the lit floor, never an unlit brown patch');
  assert.equal(run('replaySignature()'),signature,'surface and light do not change simulation');
  console.log('PASS '+zone+': fixed geometry/silhouette, irregular base, grading, cyan body spill and matching contact floor');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
