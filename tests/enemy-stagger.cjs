// Presentation only: bodies are drawn spread across the lane, with their own size and gait phase, from their spawn index.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
vm.runInContext(src,c);
vm.runInContext(`
  reset(); S.wave=7; startWave();
  for(let i=0;i<900;i++) stepSimulation(SIM_STEP);
  const bodies=S.enemies.filter(e=>!e.dead&&e.type==='forager'); assert.ok(bodies.length>=6,'enough foragers on the lane');
  assert.ok(bodies.every(e=>Number.isInteger(e.seq)),'every body carries its spawn index');
  const vis=bodies.map(visualEnemy);
  const offs=vis.map(v=>{ const a=posAt(v.__sim.d+4), b=posAt(v.__sim.d), L=Math.hypot(a.x-b.x,a.y-b.y)||1; return ((v.x-v.__sim.x)*(-(a.y-b.y)/L)+(v.y-v.__sim.y)*((a.x-b.x)/L)); });
  assert.ok(offs.every(o=>Math.abs(o)<=LANE_HALF_VISUAL),'offsets stay inside the lane');
  assert.ok(new Set(offs.map(o=>Math.round(o))).size>=4,'neighbours sit at different offsets: '+offs.map(o=>o.toFixed(1)).join(' '));
  assert.ok(vis.every(v=>v.__k>=0.92&&v.__k<=1.08),'sizes within ±8%'); assert.ok(new Set(vis.map(v=>v.__k.toFixed(3))).size>=3,'and not all equal');
  const again=bodies.map(visualEnemy); assert.deepEqual(again.map(v=>[v.x,v.y,v.__k]),vis.map(v=>[v.x,v.y,v.__k]),'the same body always gets the same offset and size');
  const phases=new Set(bodies.map(e=>foragerMirePose(e,0).frame)); assert.ok(phases.size>=3,'gait phases differ between neighbours');
`,c);
vm.runInContext(`
  reset(); S.wave=7; startWave(); for(let i=0;i<900;i++) stepSimulation(SIM_STEP); const before=replaySignature();
  for(const e of S.enemies) { visualEnemy(e); foragerMirePose(e,0); } assert.equal(replaySignature(),before,'reading visual positions changes no simulation state');
`,c);
console.log('PASS bodies spread across the lane with their own size and gait phase, deterministically, without touching the simulation');
console.log('1 enemy-stagger scenario, 0 failures');
