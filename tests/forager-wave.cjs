'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(enabled=true){
 const calls=[],images=[];class Image{constructor(){this.complete=true;this.naturalWidth=280;this.naturalHeight=80;images.push(this);}}
 const gradient=()=>({addColorStop(){}}),ctx=new Proxy({}, {get(o,k){if(k==='createLinearGradient'||k==='createRadialGradient')return gradient;if(k==='measureText')return t=>({width:String(t).length*5});return o[k]??(o[k]=(...args)=>calls.push([k,...args]));}});
 const canvas=()=>({style:{},getContext:()=>ctx,addEventListener(){}}),c=vm.createContext({Image,document:{getElementById:canvas,createElement:canvas},window:{devicePixelRatio:1},innerWidth:960,innerHeight:540,location:{pathname:'/prototype/index.html',search:enabled?'?foragerWave=1':''},URLSearchParams,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
 vm.runInContext(source,c);return {run:x=>vm.runInContext(x,c),calls,images};
}
const place="function place(d){e.d=d;Object.assign(e,posAt(d));}reset();S.phase='wave';S.wave=1;const e=makeEnemy('forager',1);S.enemies=[e];";
const r=boot();r.run(place+'place(225);');const pose=()=>JSON.parse(r.run('JSON.stringify(foragerWavePose(e))'));
const bend=pose();assert.equal(bend.segments.length,7);assert.equal(bend.legs.length,12);
assert.ok(bend.segments.some(p=>p.x<178&&Math.abs(p.y-90)<2),'tail still occupies the entry straight');
assert.ok(bend.segments.some(p=>p.y>96&&Math.abs(p.x-180)<2),'front has followed the simulation around the corner');
assert.ok(new Set(bend.segments.map(p=>Math.round(Math.atan2(p.uy,p.ux)*10))).size>1,'segments do not rotate as one rigid board');
const frozen=JSON.stringify(bend);r.run('S.time+=20;presentationTime+=20;');assert.equal(JSON.stringify(pose()),frozen,'elapsed time cannot make a stopped body or feet move');
for(const d of [150,224,270,395]){
 r.run(`place(${d});`);const a=pose();r.run(`place(${d}+.05);`);const b=pose();let count=0;
 for(let i=0;i<a.legs.length;i++)if(a.legs[i].stance&&b.legs[i].stance){assert.ok(Math.hypot(a.legs[i].foot.x-b.legs[i].foot.x,a.legs[i].foot.y-b.legs[i].foot.y)<1e-8,'stance feet stay fixed on straights and corners');count++;}assert.ok(count>=6);
}
const speeds=[];
for(const dash of [0,1]){const t=boot();t.run(place+`place(150);e.dash=${dash};const before=e.d;update(SIM_STEP);`);speeds.push(t.run('e.d-before'));}
assert.ok(Math.abs(speeds[1]/speeds[0]-r.run('SPRINTER_DASH_MULT'))<1e-8,'actual Sprinter motion accelerates distance-driven animation');
console.log('PASS segmented cornering, motion-only phase, planted feet and real Sprinter speed');
const signature=r.run('JSON.stringify(S)');r.run('ensureForagerTextures();drawForagerGround();enemyArt(e);drawForagerGround();enemyArt(e);');assert.equal(r.run('JSON.stringify(S)'),signature,'rendering cannot modify enemies or any other simulation state');
assert.ok(r.calls.filter(c=>c[0]==='drawImage').length>=7,'the rig draws sprite slices');
for(const type of ['carapacid','leech'])assert.equal(r.run(`drawForagerWave(makeEnemy('${type}',1))`),false,'other castes retain their renderer');
const off=boot(false);assert.equal(off.images.some(i=>i.src.endsWith('hunger-forager-wave-v1.webp')),false,'the opt-out does not load the study sprite');assert.equal(off.run("drawForagerWave(makeEnemy('forager',1))"),false);
r.run('foragerTextures=null;foragerWaveArt.complete=false');assert.equal(r.run('drawForagerWave(e)'),false,'unloaded artwork falls back to the existing renderer');assert.doesNotThrow(()=>r.run('enemyArt(e)'));
console.log('PASS opt-in loading, fallback, unchanged castes and immutable replay state');
const marks=boot();marks.run(place+'place(150);drawForagerGround();');assert.equal(marks.run('foragerGroundMarks.length'),1);
marks.run('S.time+=2;drawForagerGround()');assert.equal(marks.run('foragerGroundMarks.length'),0,'contact veins fade while a stopped enemy produces no new tracks');
marks.run('for(let i=0;i<600;i++){place(150+i*6);drawForagerGround();}');assert.ok(marks.run('foragerGroundMarks.length')<=256,'track storage stays bounded');
marks.run('reset();drawForagerGround()');assert.equal(marks.run('foragerGroundMarks.length'),0,'reset clears presentation traces');
console.log('PASS finite contact lifetime, bounded trace storage and reset');
const control=boot(false),shown=boot(true);
for(const t of [control,shown])t.run(place+'place(150);');
for(let i=0;i<240;i++){control.run('update(SIM_STEP)');shown.run('update(SIM_STEP);drawForagerGround();enemyArt(e)');}
assert.equal(shown.run('JSON.stringify(S)'),control.run('JSON.stringify(S)'),'rendered and undisplayed motion end in the same complete state, including enemies');
console.log('PASS rendered/headless fixed-step equivalence');
