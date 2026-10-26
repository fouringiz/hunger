// A hunting Leech no longer crawls through the footing of another platform: the hunt is planned once around the slabs
// in its way and still ends attached to the nearest generator. Historical presets keep the straight line.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){ const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(src,c); return c; }
const c=boot(), run=code=>vm.runInContext('{'+code+'}',c), fn=(ctx,code)=>vm.runInContext('(()=>{'+code+'})()',ctx);

// Every (lane point, generator slot) pair whose straight line crosses another slab's footing, taken from the real map.
const crossings=JSON.parse(fn(c,`
  const out=[];
  for(let gi=0;gi<SLOTS.length;gi++)for(let d=0;d<GATE_D;d+=40){
    const p=posAt(d),g=SLOTS[gi];
    const blocked=SLOTS.some((s,i)=>i!==gi&&segmentCrossesRect(p.x,p.y,g.x,g.y,slabFootprint(s,0)));
    if(blocked)out.push({gi,d});
  }
  return JSON.stringify(out);`));
assert.ok(crossings.length>=5,`the map has straight hunts through foreign slabs to test (${crossings.length})`);

// Run one hunt: generator on slot gi, Leech at lane distance d; record every tick of the seek.
function hunt(ctx,gi,d){
  const r=code=>vm.runInContext('{'+code+'}',ctx);
  r(`reset();S.credits=5000;S.phase='wave';S.wave=3;S.spawnQueue=[];build(SLOTS[${gi}],'generator');S.selected=null;
     var leech=makeEnemy('leech',3);leech.d=${d};Object.assign(leech,posAt(leech.d));S.enemies=[leech];
     var trace=[];var ticks=0;
     while(leech.state!=='attached'&&ticks<60*60){update(SIM_STEP);ticks++;if(leech.state==='seek')trace.push([leech.x,leech.y]);}`);
  return JSON.parse(r('JSON.stringify({attached:leech.state==="attached",ticks,trace,bends:leech.route?leech.route.length:0,gen:[SLOTS['+gi+'].x,SLOTS['+gi+'].y]})'));
}
function insideForeignSlab(ctx,gi,x,y){ return vm.runInContext(`SLOTS.some((s,i)=>i!==${gi}&&(r=>${x}>r.x1&&${x}<r.x2&&${y}>r.y1&&${y}<r.y2)(slabFootprint(s,0)))`,ctx); }

let checked=0, bent=0;
for(const {gi,d} of crossings){
  const h=hunt(c,gi,d);
  assert.ok(h.attached,`Leech from d=${d} reaches the generator on slot ${gi} (${h.ticks} ticks)`);
  for(const [x,y] of h.trace) assert.ok(!insideForeignSlab(c,gi,x,y),`Leech from d=${d} to slot ${gi} never stands inside a foreign slab (at ${x.toFixed(1)},${y.toFixed(1)})`);
  checked++;
}
console.log(`PASS ${checked} straight-through hunts now bend around the slabs and still attach`);

// A clear hunt is still a straight line, and the generator's own slab is never an obstacle.
const clear=JSON.parse(fn(c,`
  for(let gi=0;gi<SLOTS.length;gi++)for(let d=0;d<GATE_D;d+=40){const p=posAt(d),g=SLOTS[gi];
    if(!SLOTS.some((s,i)=>i!==gi&&segmentCrossesRect(p.x,p.y,g.x,g.y,slabFootprint(s,ENEMY.leech.r))))return JSON.stringify({gi,d});}`));
run(`reset();S.credits=5000;build(SLOTS[${clear.gi}],'generator');var e=makeEnemy('leech',3);e.d=${clear.d};Object.assign(e,posAt(e.d));
     assert.equal(leechRoute(e,SLOTS[${clear.gi}].tower).length,1,'an unobstructed hunt has no bends');`);
console.log('PASS an unobstructed hunt is still a straight line');

// The planned route is deterministic and part of the fingerprint; the straight-line presets are untouched.
assert.ok(run('JSON.stringify(LEECH_SLAB_AVOIDANCE)').includes('margin'),'campaign rules carry the avoidance');
const legacy=boot('?balance=v04'), lr=code=>vm.runInContext('{'+code+'}',legacy);
assert.equal(lr('LEECH_SLAB_AVOIDANCE'),null,'legacy presets keep the straight line');
const first=crossings[0];
lr(`reset();S.credits=5000;build(SLOTS[${first.gi}],'generator');var e=makeEnemy('leech',3);e.d=${first.d};Object.assign(e,posAt(e.d));
    assert.equal(leechRoute(e,SLOTS[${first.gi}].tower).length,1,'legacy route is the generator alone');`);
console.log('PASS ?balance=v04 hunts straight as recorded');
