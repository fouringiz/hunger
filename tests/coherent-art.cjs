// Presentation checks: anchored buildings, grounded roster, stable scattered formation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){
 const images=[],draws=[],rotations=[];class Image{constructor(){this.complete=true;this.naturalWidth=1448;this.naturalHeight=1086;images.push(this);}}
 const ctx=new Proxy({}, {get(o,k){if(k==='drawImage')return (...a)=>draws.push(a);if(k==='rotate')return a=>rotations.push(a);if(k==='createLinearGradient')return ()=>({addColorStop(){}});if(k==='measureText')return t=>({width:String(t).length*6});return o[k]??(o[k]=()=>{});}});
 const canvas={style:{},getContext:()=>ctx,addEventListener(){}};
 const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
 vm.runInContext(source,c);return {run:x=>vm.runInContext(x,c),images,draws,rotations};
}
const normal=boot();normal.run("reset();S.phase='build';S.credits=1000;build(SLOTS[0],'turret');");
const bases=[];
for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const kick of [0,5]){
 normal.draws.length=0;normal.run(`S.towers[0].angle=${angle};drawPlantedWeapon(S.towers[0],${kick});`);
 bases.push(normal.draws[0].slice(1));
 assert.equal(normal.draws.length,2,'weapon and base are separate layers');
}
for(const base of bases)assert.deepEqual(base,bases[0],'aim and recoil do not move the foundation');
assert.equal(normal.rotations.length,0,'the foundation is never rotated in the canvas plane');
for(const type of ['forager','carapacid','leech']){
 normal.draws.length=0;normal.run(`enemyArt(makeEnemy('${type}',1));`);
 const expected=normal.images.find(i=>i.src.endsWith(type==='forager'?'hunger-infantry-trial-v1.png':'hunger-crawlers-v2.png'));
 assert.ok(normal.draws.some(a=>a[0]===expected),type+' uses a grounded sprite in the normal campaign too');
}
normal.run("infantryArt.complete=false;");normal.draws.length=0;normal.run("enemyArt(makeEnemy('forager',1));");
assert.ok(!normal.draws.some(d=>d[0]===normal.images.find(i=>i.src.endsWith('hunger-crawlers-v2.png'))),'an unloaded Forager never becomes a Leech');
const trial=boot('?infantry=1');trial.run("reset();S.phase='build';S.buildTimer=999;S.credits=1000;build(SLOTS[3],'barracks');for(let i=0;i<300;i++)update(SIM_STEP);");
const points=()=>JSON.parse(trial.run('JSON.stringify(S.towers[0].soldiers.map(s=>soldierGroundPoint(s,S.towers[0])))'));
const first=points();assert.deepEqual(points(),first,'formation stays fixed across redraws');
const [a,b,c]=first;assert.ok(Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))>100,'soldiers are not drawn in a straight rank');
trial.run('draw()');assert.ok(trial.draws.some(d=>d[0]===trial.images.find(i=>i.src.endsWith('hunger-structures-v2.png'))&&d[1]===1102),'Barracks renders its dedicated sprite');
const state=trial.run("JSON.stringify(S,(k,v)=>['slot','target','blockedBy'].includes(k)?undefined:v)");
trial.run('draw();draw()');assert.equal(trial.run("JSON.stringify(S,(k,v)=>['slot','target','blockedBy'].includes(k)?undefined:v)"),state,'drawing never changes simulation state');
for(const art of trial.images){art.complete=false;art.naturalWidth=0;}assert.doesNotThrow(()=>trial.run('draw()'),'all new art retains a loading/failed fallback');
console.log('PASS fixed foundations, separate aim/recoil, grounded roster in both modes, Barracks sprite, stable non-collinear formation, render parity and fallbacks');
