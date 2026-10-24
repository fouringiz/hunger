'use strict';
const assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const baseline=require('../reports/local-ground-life/baseline.json');
// Shelter movement was explicitly authorized after this visual baseline. Keep its geometry checks.
Object.assign(baseline,require('../reports/carapacid-shelter/simulation-baseline.json'));
(async()=>{
 for(const zone of ['mire','ember']){
  const {canvas,run}=await loadWorld({zone,viewport:[960,540]});
  run('reset();S.phase="build";S.enemies=[];');
  assert.equal(run('replayRulesFingerprint()'),baseline.rules,'balance/geometry unchanged');
  assert.equal(run('replaySourceFingerprint()'),baseline.source,'combat function sources unchanged');
  assert.equal(run('JSON.stringify(PATH)'),JSON.stringify(baseline.path));
  assert.equal(run('GATE_D'),baseline.gateD);assert.equal(run('PLATFORM_HEIGHT'),baseline.platformHeight);
  assert.equal(run('JSON.stringify(SLOTS.map(s=>[s.x,s.y]))'),JSON.stringify(baseline.slots));
  const sites=JSON.parse(run('JSON.stringify(groundLifeSites())'));
  assert.ok(sites.length>=10&&sites.length<=20);assert.ok(sites.every(s=>s.r*2>=20&&s.r*2<=60));
  assert.equal(new Set(sites.map(s=>s.phase)).size,sites.length);assert.equal(new Set(sites.map(s=>s.period)).size,sites.length);
  const foundations=JSON.parse(run('JSON.stringify(groundFoundationRects())'));
  for(const s of sites)assert.ok(!foundations.some(b=>s.x+s.r>b.x&&s.x-s.r<b.x+b.w&&s.y+s.r*.6>b.y&&s.y-s.r*.6<b.y+b.h),'local activity cannot intersect a foundation');
  const mask=new Int16Array(960*540).fill(-1),changed=new Set();
  sites.forEach((s,id)=>{
   for(let y=Math.max(0,Math.floor(s.y-s.r*.6-2));y<Math.min(540,Math.ceil(s.y+s.r*.6+2));y++)
    for(let x=Math.max(0,Math.floor(s.x-s.r-2));x<Math.min(960,Math.ceil(s.x+s.r+2));x++)mask[y*960+x]=id;
  });
  const frame=t=>{run('presentationTime='+t+';ctx.setTransform(1,0,0,1,0,0);terrain();');return Buffer.from(canvas.getContext('2d').getImageData(0,0,960,540).data);};
  const signature=run('replaySignature()'),first=frame(2);
  for(const t of [3,4,6,9,11]){
   const next=frame(t);
   for(let px=0;px<mask.length;px++){
    const k=px*4,different=first[k]!==next[k]||first[k+1]!==next[k+1]||first[k+2]!==next[k+2]||first[k+3]!==next[k+3];
    if(!different)continue;
    assert.ok(mask[px]>=0,zone+': background drift outside local patch at '+px%960+','+Math.floor(px/960));changed.add(mask[px]);
   }
  }
  assert.equal(changed.size,sites.length,'every independent patch actually moves');
  assert.equal(run('replaySignature()'),signature,'rendering does not alter simulation');
  // A creature disturbing the edge of a footing must still leave its protected ground intact.
  const surface=()=>Buffer.from(run('worldLiveArt').getContext('2d').getImageData(0,0,1920,1080).data),fixed=surface();
  run("const e=makeEnemy('forager',1);e.x=SLOTS[0].x+30;e.y=SLOTS[0].y+35;e.d=100;S.enemies=[e];mireTraffic=[{x:e.x,y:e.y,angle:0,at:presentationTime,size:9}];");
  frame(11.2);const disturbed=surface(),b=foundations[0];
  for(let y=Math.ceil(b.y*2);y<Math.floor((b.y+b.h)*2);y++)for(let x=Math.ceil(b.x*2);x<Math.floor((b.x+b.w)*2);x++){
   const k=(y*1920+x)*4;assert.equal(disturbed.readUInt32LE(k),fixed.readUInt32LE(k),'creature contact must not shift foundation ground');
  }
  console.log('PASS '+zone+': static background/foundations, independent bounded activity, unchanged combat/geometry');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
