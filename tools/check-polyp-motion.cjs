'use strict';
// Run by the user. Analytic animation checks, NOT visual acceptance or a game capture.
const assert=require('node:assert/strict'),R=require('./polyp-motion-rig.cjs');
const mesh=R.mesh(),aspect=R.config.aspect,dist=(a,b)=>Math.hypot((a[0]-b[0])*aspect,a[1]-b[1]);
const sample=(x,y,t)=>R.deform(x,y,t),probes=[[.275,.665],[.715,.61],[.43,.29],[.54,.48],...R.config.contacts.map(c=>c.p)];
function continuity(fn){
 const epsilon=1e-6;
 for(let i=0;i<=120;i++){const t=i/120;for(const p of probes){
  assert.ok(dist(fn(...p,t-epsilon),fn(...p,t+epsilon))<1e-4,`position jump at ${t}`);
 }}
 for(const t of [0,...R.config.contacts.flatMap(c=>[-c.phase,R.config.duty-c.phase])])for(const p of probes){
  const h=1e-5,a=fn(...p,t-h),b=fn(...p,t),c=fn(...p,t+h);
  const left=[(b[0]-a[0])/h,(b[1]-a[1])/h],right=[(c[0]-b[0])/h,(c[1]-b[1])/h];
  assert.ok(dist(left,right)<.003,`velocity jump at ${t}`);
 }
}
function planted(fn){
 for(let i=0;i<R.config.contacts.length;i++){
  const c=R.config.contacts[i],start=.08-c.phase,end=.55-c.phase;
  const world=t=>{const p=fn(...c.p,t);return [p[0]+R.config.stride[0]*t,p[1]+R.config.stride[1]*t];};
  assert.ok(dist(world(start),world(end))<1e-9,`contact ${i+1} slides during stance`);
  const vertex=mesh.points.find(p=>p.x===c.p[0]&&p.y===c.p[1]);assert.ok(vertex,`contact ${i+1} is absent from rendered mesh`);
  for(const t of [start,end])assert.ok(dist(R.deformBound(vertex,R.prepare(t)),fn(...c.p,t))<1e-10,'render/contact mismatch');
 }
}
function localShape(fn){
 const ratios=[];
 for(let i=0;i<60;i++){const t=i/60,a=fn(.275,.665,t),b=fn(.715,.61,t),c=fn(.43,.29,t);ratios.push(dist(a,b)/dist(b,c));}
 assert.ok(Math.max(...ratios)-Math.min(...ratios)>.04,'body only translates/rotates/scales as a whole');
}
continuity(sample);console.log('PASS position/velocity continuity including loop boundary');
planted(sample);console.log('PASS planted contact world positions and rendered anchor vertices');
localShape(sample);console.log('PASS independent changes of local body proportions');
// In a rigid patch distances must remain fixed in IMAGE space, including non-square texture aspect.
for(const [i,plate] of R.config.plates.entries()){
 const p=plate.center,q=[p[0]+.007,p[1]+.005];
 assert.equal(R.bindPoint(...p).plate[i],1,'plate probe must be inside rigid region');
 assert.equal(R.bindPoint(...q).plate[i],1,'plate probe must be inside rigid region');
 for(let n=0;n<60;n++)assert.ok(Math.abs(dist(sample(...p,n/60),sample(...q,n/60))-dist(p,q))<1e-10,`plate ${i+1} stretches`);
}console.log('PASS rigid plate interior distances');
let minRatio=Infinity,maxRatio=0;
const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
for(let n=0;n<120;n++){
 const state=R.prepare(n/120),v=mesh.points.map(p=>R.deformBound(p,state));
 for(let j=0;j<mesh.indices.length;j+=3){
  const ids=Array.from(mesh.indices.slice(j,j+3)),base=ids.map(k=>[mesh.points[k].x,mesh.points[k].y]),now=ids.map(k=>v[k]);
  const ratio=area(...now)/area(...base);minRatio=Math.min(minRatio,ratio);maxRatio=Math.max(maxRatio,ratio);
  assert.ok(Number.isFinite(ratio)&&ratio>.02,`mesh folds/collapses at phase ${n}/120 triangle ${j/3}, ratio=${ratio}`);
 }
}console.log(`PASS sampled mesh orientation; local area ratio ${minRatio.toFixed(3)}–${maxRatio.toFixed(3)} (not mass-conservation proof)`);
// Known bad alternatives MUST fail; these guards cannot be satisfied by an unchanged/bobbing sprite or a slideshow.
assert.throws(()=>localShape((x,y,t)=>{const s=1+.05*Math.sin(t*2*Math.PI);return [.5+(x-.5)*s,.5+(y-.5)*s+.02*Math.cos(t*2*Math.PI)];}));
assert.throws(()=>planted((x,y)=>[x,y]));
assert.throws(()=>continuity((x,y,t)=>sample(x,y,Math.floor(R.fract(t)*6)/6)));
console.log('PASS negative controls: whole-body pulse, slipping static body, six-pose slideshow');
console.log('Still required: user full-cycle visual review, source likeness, ground contacts, real game camera/50 px/grayscale/browser checks.');
