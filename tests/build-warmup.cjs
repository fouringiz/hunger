// A new building deploys for BUILD_WARMUP_SECONDS before it fights, the same time its deployment is drawn; resuming
// from pause keeps the longer WARMUP; historical presets build instantly as recorded.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){ const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(src,c); return c; }
const run=(c,code)=>vm.runInContext('(()=>{'+code+'})()',c);
const firstShotTick=(c)=>run(c,`
  reset();S.credits=5000;S.phase='wave';S.wave=1;S.spawnQueue=[];
  const slot=SLOTS[0];build(slot,'turret');S.selected=null;const t=slot.tower;
  const e=makeEnemy('forager',1);e.hp=e.maxHp=1e9;const near=nearestPathD(slot.x,slot.y);e.d=near;Object.assign(e,posAt(near));S.enemies=[e];
  for(let tick=0;tick<60*5;tick++){update(SIM_STEP);if(e.hp<e.maxHp)return {tick,warmFrom:t.warmFrom};}
  return {tick:-1,warmFrom:t.warmFrom};`);

const c=boot();
assert.equal(run(c,'return BUILD_WARMUP'),1.65,'campaign build warm-up is 1.65 s');
assert.equal(run(c,'return BUILDING_DEPLOY_SECONDS'),run(c,'return BUILD_WARMUP_SECONDS'),'the deployment animation lasts exactly the warm-up');
assert.equal(run(c,'return WARMUP'),2.5,'resume warm-up stays 2.5 s');
const shot=firstShotTick(c);
assert.ok(shot.tick>=Math.floor(1.65/run(c,'return SIM_STEP')),`a new Turret holds fire through deployment (first hit at tick ${shot.tick})`);
assert.ok(shot.tick<Math.ceil(1.65/run(c,'return SIM_STEP'))+10,`and fires right after it (tick ${shot.tick})`);
assert.equal(shot.warmFrom,1.65,'the ring measures against the build warm-up');
console.log(`PASS campaign: first shot at tick ${shot.tick}, deployment ${run(c,'return BUILD_WARMUP_SECONDS')} s`);

const resumed=run(c,`reset();S.credits=5000;const slot=SLOTS[0];build(slot,'turret');const t=slot.tower;for(let i=0;i<200;i++)update(SIM_STEP);
  togglePause(t);togglePause(t);return {warm:t.warm,warmFrom:t.warmFrom};`);
assert.equal(resumed.warm,2.5,'resume charges the full WARMUP');assert.equal(resumed.warmFrom,2.5,'and the ring knows it');
console.log('PASS resume from pause still costs 2.5 s');

for(const preset of ['v04','parityA']){ const l=boot('?balance='+preset);
  assert.equal(run(l,'return BUILD_WARMUP'),0,`${preset} builds instantly`);
  const s=firstShotTick(l); assert.ok(s.tick>=0&&s.tick<10,`${preset}: a new Turret fires at once (tick ${s.tick})`); }
console.log('PASS historical presets build instantly as recorded');
