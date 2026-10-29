// Taking a branch swaps the head: the tower holds fire for BRANCH_SWAP_SECONDS while the level-3 head sinks and the
// branch head rises; the picture is driven by the same simulation warm-up. Historical presets keep the instant swap.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){ const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(src,c); return c; }
const run=(c,code)=>vm.runInContext('(()=>{'+code+'})()',c);
// Returns the tick of the first hit after the branch is taken on a fully warmed level-3 Turret.
const firstHitAfterBranch=(c)=>run(c,`
  reset();S.credits=100000;S.phase='wave';S.wave=1;S.spawnQueue=[];
  const slot=SLOTS[0];build(slot,'turret');S.selected=null;const t=slot.tower;upgrade(t);upgrade(t);
  for(let i=0;i<60*3;i++)update(SIM_STEP);
  S.phase='wave';S.spawnQueue=[];const e=makeEnemy('forager',1);e.hp=e.maxHp=1e9;const near=nearestPathD(slot.x,slot.y);e.d=near;Object.assign(e,posAt(near));S.enemies=[e];
  const hold=()=>{e.d=near;Object.assign(e,posAt(near));};
  for(let i=0;i<60*3;i++){hold();update(SIM_STEP);}
  if(e.hp===e.maxHp)return {tick:-2};
  e.hp=e.maxHp;t.cd=0;upgrade(t,'A');const warm=t.warm,warmFrom=t.warmFrom;
  for(let tick=0;tick<60*5;tick++){hold();update(SIM_STEP);if(e.hp<e.maxHp)return {tick,warm,warmFrom};}
  return {tick:-1,warm,warmFrom};`);
const c=boot();
assert.equal(run(c,'return BRANCH_SWAP'),0.9,'campaign branch swap is 0.9 s');
const swap=firstHitAfterBranch(c),step=run(c,'return SIM_STEP');
assert.ok(swap.tick!==-2,'the level-3 Turret was firing before the branch');
assert.equal(swap.warm,0.9);assert.equal(swap.warmFrom,0.9,'the warm-up ring measures against the swap');
assert.ok(swap.tick+1>=Math.round(.9/step),`no hit during the swap (first hit at tick ${swap.tick})`);
assert.ok(swap.tick<Math.ceil(.9/step)+20,`fires again right after it (tick ${swap.tick})`);
console.log(`PASS campaign: branch swap holds fire ${run(c,'return BRANCH_SWAP')} s, first hit at tick ${swap.tick}`);
const paused=run(c,`reset();S.credits=100000;const slot=SLOTS[0];build(slot,'turret');const t=slot.tower;upgrade(t);upgrade(t);for(let i=0;i<200;i++)update(SIM_STEP);togglePause(t);upgrade(t,'A');return {warm:t.warm,paused:t.paused};`);
assert.ok(paused.paused&&paused.warm<=0,'a paused tower takes the branch without a swap timer; resuming costs the usual WARMUP');
for(const preset of ['v04','parityA']){const l=boot('?balance='+preset);assert.equal(run(l,'return BRANCH_SWAP'),0,`${preset} swaps instantly`);
  const s=firstHitAfterBranch(l);assert.ok(s.tick>=0&&s.tick<20,`${preset}: fires at once after the branch (tick ${s.tick})`);}
console.log('PASS paused towers and historical presets keep the instant swap');
