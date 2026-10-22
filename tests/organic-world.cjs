'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){
  const images=[],draws=[];let canvases=0;
  class Image{constructor(){this.complete=true;this.naturalWidth=512;images.push(this);}set src(value){this.url=value;if(value.includes('forager-mire')){this.naturalWidth=2496;this.naturalHeight=3072;}}get src(){return this.url;}}
  const ctx=new Proxy({}, {get(o,k){if(k==='drawImage')return (...a)=>draws.push(a);if(k==='createLinearGradient')return ()=>({addColorStop(){}});if(k==='createPattern')return ()=>({});if(k==='measureText')return t=>({width:String(t).length*6});return o[k]??(o[k]=()=>{});}});
  const canvas={style:{},getContext:()=>ctx,addEventListener(){}};
  const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement(){canvases++;return {...canvas};}},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(source,c);return {run:s=>vm.runInContext(s,c),images,draws,canvases:()=>canvases};
}
const a=boot(),b=boot('?zone=ember'),invalid=boot('?zone=__proto__');
assert.equal(a.run('WORLD_ZONE'),'mire');assert.equal(b.run('WORLD_ZONE'),'ember');assert.equal(invalid.run('WORLD_ZONE'),'mire');
assert.ok(a.images.some(i=>i.src.endsWith('hunger-world-mire-v1.webp')));assert.ok(b.images.some(i=>i.src.endsWith('hunger-world-ember-v1.webp')));
assert.equal(a.run('replayRulesFingerprint()'),b.run('replayRulesFingerprint()'));assert.equal(a.run('replaySourceFingerprint()'),b.run('replaySourceFingerprint()'));
for(const r of [a,b]){
  r.run("reset();S.phase='build';S.credits=10000;build(SLOTS[0],'turret');build(SLOTS[5],'cannon');build(SLOTS[15],'generator');startWave();update(1);draw();");
  const signature=r.run('replaySignature()'),allocations=r.canvases();
  for(let i=0;i<20;i++)r.run('presentationTime+=.05;draw();');
  assert.equal(r.run('replaySignature()'),signature,'terrain, depth order and pulse cannot change gameplay');
  assert.equal(r.canvases(),allocations,'repeated drawing does not create more terrain or architectural canvases');
  assert.ok(r.run('terrainArt.width===W*WORLD_RASTER_SCALE'),'detailed terrain is cached at the declared raster resolution');
}
assert.equal(a.run('replaySignature()'),b.run('replaySignature()'),'palette has no effect on the actual simulated opening');
console.log('PASS independent zone art, exact simulation parity and bounded raster caches');
const g=a.run('gatePoint(0,0,GATE_MOUTH_DEPTH)');assert.equal(g[0],a.run('GATE.x'));assert.equal(g[1],a.run('GATE.y'),'the barrier intersects the lane at the actual leak point');
const p=a.run('gatePoint(-60,0,14)'),q=a.run('gatePoint(-60,80,14)');assert.equal(p[0],q[0]);assert.ok(q[1]<p[1],'vertical stone edges rise above their grounded footing');
const top=a.run('gatePoint(-50,80,14)');assert.ok(top[0]!==q[0]&&top[1]!==q[1],'top faces follow the oblique ground-plane axis');
console.log('PASS grounded vertical architecture and exact barrier/lane intersection');
for(const type of ['turret','cannon','voltaic']){
  const r=boot();r.run(`reset();S.phase='build';S.credits=10000;build(SLOTS[0],'${type}');observeConstruction();presentationTime=2;observeConstruction();buildingPauseProgress(S.towers[0]);togglePause(S.towers[0]);buildingPauseProgress(S.towers[0]);`);
  const afterPause=r.run('replaySignature()');r.run('presentationTime+=.25');const mid=r.run('buildingPauseProgress(S.towers[0])');
  assert.ok(mid>0&&mid<1,type+' folds gradually');r.run('presentationTime+=.3;draw();');assert.equal(r.run('buildingPauseProgress(S.towers[0])'),0);
  assert.equal(r.run('replaySignature()'),afterPause,'folding does not edit pause, warmup, cooldown or power');
  r.run('togglePause(S.towers[0]);buildingPauseProgress(S.towers[0]);');const afterResume=r.run('replaySignature()');
  r.run('presentationTime+=.6;draw()');assert.equal(r.run('buildingPauseProgress(S.towers[0])'),1);assert.equal(r.run('replaySignature()'),afterResume,'unfolding does not consume resume warmup');
}
console.log('PASS reversible weapon/Tesla pause poses with unchanged combat state');
const failed=boot();for(const image of failed.images){image.complete=false;image.naturalWidth=0;}
assert.doesNotThrow(()=>failed.run("reset();S.phase='build';S.credits=1000;build(SLOTS[0],'voltaic');draw();"),'terrain, buildings and Gate work with missing art');
const loaded=boot();loaded.run('draw()');const ground=loaded.images.find(i=>i.src.includes('hunger-world-mire'));
ground.onload();assert.equal(loaded.run('terrainArt'),null,'late material load invalidates the fallback');assert.doesNotThrow(()=>loaded.run('draw()'));
console.log('PASS missing-image fallback and asynchronous cache refresh');
