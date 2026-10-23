// Presentation only: the Forager's leg cycle is driven by distance and paced for a crawl through sludge.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
vm.runInContext(src,c);
vm.runInContext(`
  const cycle=FORAGER_MIRE.stride/FORAGER_MIRE.duty;
  assert.ok(cycle>=36&&cycle<=44,'one leg cycle per 36-44 px of lane, got '+cycle.toFixed(1));
  assert.ok(ENEMY.forager.speed/cycle<2,'under two cycles a second at walking speed');
  reset(); const e=makeEnemy('forager',1); e.state='lane'; e.d=300; Object.assign(e,posAt(e.d));
  let prev=foragerMirePose(e,0).frame, jumps=0, steps=0;
  for(let i=0;i<120;i++){ e.d+=ENEMY.forager.speed*SIM_STEP*3; Object.assign(e,posAt(e.d)); const f=foragerMirePose(e,0).frame; steps++;
    const adv=(f-prev+8)%8; if(adv>1) jumps++; prev=f; }
  assert.equal(jumps,0,'at walking speed no frame is skipped between 3-tick steps');
  const still=foragerMirePose(e,0).frame; foragerMirePose(e,0); assert.equal(foragerMirePose(e,0).frame,still,'standing still, the legs do not move');
`,c);
console.log('PASS forager gait: 25-30 px per cycle, no skipped frames at walking speed, still when stopped');
console.log('1 forager-gait scenario, 0 failures');
