'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search='',missing=[]){   // missing: asset name fragments that fail to load, to exercise fallbacks
 const draws=[],images=[];class Image{constructor(){this.complete=true;images.push(this);}set src(value){this.url=value;this.naturalWidth=missing.some(m=>value.includes(m))?0:value.includes('forager-mire')?2496:256;this.naturalHeight=value.includes('forager-mire')?3072:256;}get src(){return this.url;}}
 const strokes=[];
 const drawing=new Proxy({globalAlpha:1},{get(o,k){if(k==='drawImage')return (...args)=>draws.push(args);if(k==='strokeRect')return (...args)=>strokes.push({args,width:o.lineWidth});if(k==='createLinearGradient')return ()=>({addColorStop(){}});if(k==='createPattern')return image=>({image});if(k==='measureText')return value=>({width:String(value).length*6});return o[k]??(o[k]=()=>{});}});
 const canvas={getContext:()=>drawing,style:{},addEventListener(){}};
 const context=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
 vm.runInContext(source,context);return {run:code=>vm.runInContext(code,context),draws,images,strokes};
}
for(const search of ['', '?infantry=1']){
 const r=boot(search);r.run("reset();const e=makeEnemy('forager',1);e.x=200;e.y=90;e.d=100;e.state='lane';");
 const before=r.run('JSON.stringify(e)'),signature=r.run('replaySignature()');r.run('enemyArt(e)');
 const atlas=r.images.find(im=>im.src.endsWith('hunger-forager-mire-v1.webp'));
 assert.equal(r.draws.filter(d=>d[0]===atlas).length,1,'the campaign/trial use exactly one new Forager atlas draw');
 assert.equal(r.run('JSON.stringify(e)'),before);assert.equal(r.run('replaySignature()'),signature,'rendering never writes combat state');
 for(const type of ['carapacid','leech']){r.draws.length=0;r.run(`enemyArt(makeEnemy('${type}',1))`);assert.ok(!r.draws.some(d=>d[0]===atlas),'other castes keep their existing art');}
}
console.log('PASS default campaign/trial Forager integration, one atlas draw, other castes and state parity');
const r=boot();r.run("reset();const e=makeEnemy('forager',1);e.x=e.y=e.d=0;e.state='lane';");
const pose=angle=>JSON.parse(r.run(`JSON.stringify(foragerMirePose(e,${angle}))`));
const still=pose(0);assert.equal(still.frame,0);r.run('S.time+=100');assert.deepEqual(pose(0),still,'stopping freezes gait and yaw regardless of elapsed time');
const frames=new Set();for(let i=0;i<120;i++){r.run('e.d+=.1;e.x+=.1');frames.add(pose(0).frame);}assert.ok(frames.size>=10,'travel cycles the drawn poses');
const stopped=pose(0);r.run('S.time+=20');assert.deepEqual(pose(Math.PI/2),stopped,'a stopped actor does not turn or walk by itself');
r.run('e.d+=1;e.x+=1');const moved=pose(Math.PI/2);assert.ok(moved.heading>stopped.heading&&moved.heading<Math.PI/2,'corners turn progressively as the body advances');
const headings=new Set();for(let i=0;i<32;i++){r.run(`const sample${i}=makeEnemy('forager',1)`);headings.add(r.run(`foragerMirePose(sample${i},${i*Math.PI*2/32}).direction`));}assert.equal(headings.size,16,'yaw has sixteen upright projected views');
console.log('PASS frozen gait, travel-driven speed, progressive corners and sixteen directions');
function observedTravel(dash){const b=boot();b.run("reset();S.phase='wave';S.wave=1;S.spawnQueue=[];const actor=makeEnemy('forager',1);actor.d=300;Object.assign(actor,posAt(actor.d));actor.hp=actor.maxHp=10000;S.enemies=[actor];");if(dash)b.run("S.mutations=['sprinter'];actor.dash=1;");const start=b.run('foragerMirePose(actor,0).distance');b.run('update(.1)');return b.run('foragerMirePose(actor,0).distance')-start;}
assert.ok(observedTravel(true)>observedTravel(false),'the actual Sprinter movement accelerates the observed gait');
console.log('PASS the gait follows real Sprinter travel');
const f=boot();f.run("reset();foragerMireArt.complete=false;enemyArt(makeEnemy('forager',1))");assert.ok(f.draws.some(d=>d[0].src.endsWith('hunger-ground-actors-v3.png')),'missing new art retains the old grounded sprite');
f.run('groundActorArt.complete=false;infantryArt.complete=false;');assert.doesNotThrow(()=>f.run("enemyArt(makeEnemy('forager',1))"));
console.log('PASS asynchronous/failed image fallback');
const terrain=boot('',['concrete-platform']);terrain.run('terrain()');assert.ok(terrain.strokes.length>0,'without platform art the slots fall back to drawn outlines');assert.ok(terrain.strokes.every(s=>s.width===1),'organic lane stroke widths must not leak into build-slot outlines');
const platforms=boot();platforms.run('terrain()');const slotCount=platforms.run('SLOTS.length');assert.equal(platforms.draws.filter(a=>String(a[0]&&a[0].url).includes('concrete-platform')).length,slotCount,'with platform art every slot is drawn from it');
console.log('PASS cached organic lane preserves build-slot outlines');
