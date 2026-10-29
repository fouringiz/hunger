'use strict';
// Read actual pixels in the Node-only regression, never in the file:// game renderer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const html=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8');
async function scene(sourceHtml,zone='mire'){
  const w=await loadWorld({sourceHtml,zone,viewport:[960,540]});
  w.run("reset();S.credits=10000;build(SLOTS[2],'flamer');S.towers[0].level=3;S.towers[0].warm=0;S.towers[0].angle=Math.PI/2;S.time=.05;S.selected=null;observeConstruction();presentationTime=3.1;observeConstruction();drawFuelContact=()=>false;prepareFuelContacts=()=>{fuelContactFrame=new Map();};let rasterCold,rasterHot,rasterUnmasked;const rasterPixels=()=>ctx.getImageData(0,0,W,H).data.slice();");
  return w;
}
async function nozzleBridge(sourceHtml,zone){
  const w=await scene(sourceHtml,zone);
  w.run('S.enemies=[];S.towers[0].jetAt=undefined;draw();rasterCold=rasterPixels();S.towers[0].jetAt=0;draw();rasterHot=rasterPixels();');
  const evidence=JSON.parse(w.run(`JSON.stringify((()=>{const t=S.towers[0],m=weaponMuzzle(t),end=t.y+18+PLATFORM_HEIGHT-1;let bands=0,visible=0;for(let y=Math.ceil(m.y+3);y<end;y++){let delta=0;for(let x=Math.floor(m.x)-3;x<=Math.ceil(m.x)+3;x++){const i=(y*W+x)*4;delta+=Math.abs(rasterHot[i]-rasterCold[i])+Math.abs(rasterHot[i+1]-rasterCold[i+1])+Math.abs(rasterHot[i+2]-rasterCold[i+2]);}bands++;if(delta>12)visible++;}return {bands,visible};})())`));
  assert.ok(evidence.bands>=15,'actual nozzle-to-platform crossing is exercised');
  assert.ok(evidence.visible/evidence.bands>=.8,'nozzle-to-platform bridge must remain visible, not a detached flame below the foundation: '+JSON.stringify(evidence));
}
async function enemyCore(sourceHtml){
  const w=await scene(sourceHtml);
  w.run("S.enemies=[makeEnemy('carapacid',1)];S.enemies[0].d=420;S.enemies[0].hp=S.enemies[0].maxHp*.5;const rasterMask=document.createElement('canvas');rasterMask.width=W;rasterMask.height=H;const rasterMaskCtx=rasterMask.getContext('2d'),realJetMask=maskFuelJetBodies;");
  // The approved body atlas is mostly alpha 253, not 255 (only 17 source pixels are 255).
  // Sample its dense core, retaining the actual fire-overlap requirement. destination-out
  // may leave at most (255 - bodyAlpha) per RGB channel, even for a saturated jet.
  // Only that physically unavoidable residual is exempt; excess RGB error still must be <3.
  for(let n=0;n<16;n++){
    w.run(`{const t=S.towers[0],e=S.enemies[0];t.angle=${n*Math.PI/8};const m=weaponMuzzle(t),x=t.x+Math.cos(t.angle)*tstats(t).range,y=t.y+Math.sin(t.angle)*tstats(t).range;e.x=m.x+(x-m.x)*.64;e.y=m.y+(y-m.y)*.64+enemyBodyHeight(e)*.48;}S.towers[0].jetAt=undefined;draw();rasterCold=rasterPixels();S.towers[0].jetAt=0;draw();rasterHot=rasterPixels();maskFuelJetBodies=()=>{};draw();rasterUnmasked=rasterPixels();maskFuelJetBodies=realJetMask;`);
    const evidence=JSON.parse(w.run(`JSON.stringify((()=>{const e=visualEnemy(S.enemies[0]),g=rasterMaskCtx;g.clearRect(0,0,W,H);g.save();g.translate(e.x-64,e.y-88);g.scale(.5,.5);stampFuelBody(g,e);g.restore();const a=g.getImageData(0,0,W,H).data;let samples=0,error=0;for(let i=0;i<a.length;i+=4)if(a[i+3]>=250){const hit=Math.abs(rasterUnmasked[i]-rasterCold[i])+Math.abs(rasterUnmasked[i+1]-rasterCold[i+1])+Math.abs(rasterUnmasked[i+2]-rasterCold[i+2]);if(hit>12){samples++;const residual=Math.abs(rasterHot[i]-rasterCold[i])+Math.abs(rasterHot[i+1]-rasterCold[i+1])+Math.abs(rasterHot[i+2]-rasterCold[i+2]);error+=Math.max(0,residual-3*(255-a[i+3]));}}let barError=0;const bw=e.r*2+6,by=e.y-enemyBodyHeight(e)-6;for(let y=Math.ceil(by);y<Math.floor(by+4);y++)for(let x=Math.ceil(e.x-bw/2);x<Math.floor(e.x+bw/2);x++){const i=(y*W+x)*4;barError+=Math.abs(rasterHot[i]-rasterCold[i])+Math.abs(rasterHot[i+1]-rasterCold[i+1])+Math.abs(rasterHot[i+2]-rasterCold[i+2]);}return {samples,meanError:samples?error/samples:0,barError};})())`));
    assert.ok(evidence.samples>=12,'actual fire/body overlap exercised in heading '+n+': '+JSON.stringify(evidence));
    assert.ok(evidence.meanError<3,'jet must preserve opaque enemy core in heading '+n+': '+JSON.stringify(evidence));
    assert.equal(evidence.barError,0,'jet must not overwrite the health bar in heading '+n);
  }
}
(async()=>{
  await nozzleBridge(html,'mire');await nozzleBridge(html,'ember');await enemyCore(html);
  // Exact known-bad placement: a correct-looking source sheet hidden under later platform/tower draws.
  const old=html.replace('  drawFuelJetsLayer();\n','').replace('  // Ground anchors determine depth consistently for buildings, creatures and soldiers.','  drawFuelJetsLayer();\n  // Ground anchors determine depth consistently for buildings, creatures and soldiers.');
  assert.notEqual(old,html);await assert.rejects(()=>nozzleBridge(old,'mire'),/bridge must remain visible/);
  const blanket=html.replace('  maskFuelJetBodies(g);','  /* known-bad blanket jet: no body holes */');assert.notEqual(blanket,html);
  await assert.rejects(()=>enemyCore(blanket),/preserve opaque enemy core|health bar/);
  console.log('PASS real-pixel nozzle/platform bridge on Mire/Ember, 16-heading enemy core/bar protection; detached and blanket variants rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
