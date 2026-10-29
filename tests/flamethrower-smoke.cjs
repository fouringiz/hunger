'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const html=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8');
async function boot(sourceHtml=html){
  const w=await loadWorld({sourceHtml,viewport:[960,540]});
  w.run("reset();S.credits=100000;build(SLOTS[2],'flamer');S.towers[0].level=3;S.towers[0].warm=0;S.time=.05;S.towers[0].jetAt=0;observeConstruction();presentationTime=3.1;observeConstruction();");return w;
}
async function rise(w){
  for(let n=0;n<16;n++){
    const p=JSON.parse(w.run(`JSON.stringify((()=>{S.towers[0].angle=${n*Math.PI/8};const p={tower:S.towers[0],at:3.1,x:400,y:250,drift:4};return [flameSmokePose(p,3.3),flameSmokePose(p,3.9)];})())`));
    assert.ok(p[1].y<p[0].y-10,'smoke must rise up screen in heading '+n);
    assert.ok(Math.abs(p[1].x-p[0].x)<4,'drift remains slight');
  }
}
async function frames(w){
  const seq=JSON.parse(w.run('JSON.stringify(Array.from({length:121},(_,i)=>flameSmokePose({at:0,x:0,y:0,drift:0},i/100)))'));
  const used=new Set();for(const p of seq){assert.ok(p.alpha>=0&&p.alpha<=1);for(const [frame,weight]of p.cells){assert.notEqual(frame,4,'ring frame 5 must never be shown');if(weight>0)used.add(frame);}}
  assert.deepEqual([...used],[0,1,2,3,5]);
  const blend=seq[90].cells;assert.equal(blend.length,2,'4 to 6 must crossfade');assert.ok(blend.every(c=>c[1]>0&&c[1]<1));
  assert.equal(seq[0].alpha,0);assert.equal(seq[120].alpha,0,'end of 1.2s life fades out');
}
(async()=>{
  const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/hunger-flamethrower-smoke-v1.frames.json')));assert.deepEqual(meta.cell,[256,256]);assert.deepEqual(meta.anchor,[128,128]);assert.equal(meta.frames,6);
  const w=await boot();await rise(w);await frames(w);
  const sig=w.run('replaySignature()');w.run('updateFlameSmoke();drawFlameSmoke();');assert.equal(w.run('replaySignature()'),sig,'smoke never mutates simulation');
  const snapshot=w.run('JSON.stringify(flameSmokePuffs.map(({at,x,y,drift})=>({at,x,y,drift})))');
  const twin=await boot();twin.run('S.towers[0].angle=15*Math.PI/8;updateFlameSmoke();');assert.equal(twin.run('JSON.stringify(flameSmokePuffs.map(({at,x,y,drift})=>({at,x,y,drift})))'),snapshot,'slot and presentation time reproduce emission');
  for(const state of ["t.paused=true","t.selling=true","t.branch='B'","constructionArt.set(t,{at:presentationTime,done:false})"]){
    const v=await boot();v.run(`updateFlameSmoke();{const t=S.towers[0];${state};}updateFlameSmoke();`);assert.equal(v.run('flameSmokePuffs.length'),0,'no smoke for '+state);
  }
  const absent=await boot();absent.run('flameSmokeReady=()=>false;updateFlameSmoke();');assert.equal(absent.run('flameSmokePuffs.length'),0,'missing smoke art is harmless');
  const cap=await boot();cap.run("reset();S.credits=100000;for(const slot of [...SLOTS,...SLOTS.slice(0,4).map(s=>({...s,tower:null}))])build(slot,'flamer');observeConstruction();presentationTime=6.2;observeConstruction();for(const t of S.towers){t.warm=0;t.jetAt=0;}for(let i=0;i<6;i++){presentationTime=6.2+i*.21;updateFlameSmoke();}");
  const counts=JSON.parse(cap.run('JSON.stringify(S.towers.map(t=>flameSmokePuffs.filter(p=>p.tower===t).length))'));assert.ok(counts.some(n=>n===6),'per-tower boundary exercised');assert.ok(counts.every(n=>n<=6),'six puffs per tower');assert.equal(cap.run('flameSmokePuffs.length'),96,'global 96 cap exercised');
  cap.run('presentationTime+=1.21;for(const t of S.towers)t.jetAt=undefined;updateFlameSmoke();');assert.equal(cap.run('flameSmokePuffs.length'),0,'particles expire without active fire');
  // Overlap must be capped for the entire layer, not separately for each puff.
  w.run('presentationTime=3.7;flameSmokePuffs=Array.from({length:6},()=>({tower:S.towers[0],at:3.1,x:400,y:250,drift:0}));flameSmokeEmitters.set(S.towers[0],{next:100});ctx.clearRect(0,0,W,H);drawFlameSmoke();');
  const alpha=JSON.parse(w.run('JSON.stringify((()=>{const a=ctx.getImageData(0,0,W,H).data;let max=0;for(let i=3;i<a.length;i+=4)max=Math.max(max,a[i]);return max;})())'));assert.ok(alpha>50,'actual overlapping smoke drawn');assert.ok(alpha<=Math.ceil(.45*255),'aggregate smoke alpha capped at .45');
  assert.ok(!/Math\.random/.test(html.slice(html.indexOf('const FLAME_SMOKE='),html.indexOf('function drawPlantedWeapon'))),'no random source in smoke path');
  const along=html.replace('y:p.y-22*age','y:p.y+Math.sin(p.tower.angle)*22*age');assert.notEqual(along,html);await assert.rejects(()=>boot(along).then(rise),/rise up screen/);
  const ring=html.replace('else cells=[[5,1]]','else cells=[[4,1]]');assert.notEqual(ring,html);await assert.rejects(()=>boot(ring).then(frames),/ring frame 5/);
  console.log('PASS smoke sheet metadata, 16-heading screen rise, ring rejection, lifecycle/crossfade, caps, deterministic read-only emissions, inactive/Cryojet/missing art, aggregate alpha; bad direction/ring variants rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
