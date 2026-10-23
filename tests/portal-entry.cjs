// Presentation only: over the last PORTAL_APPROACH pixels a body keeps the heading it arrived with and fades into the
// portal, instead of turning to face up the screen and reading as rearing onto its tail against the front-on Gate.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
vm.runInContext(src,c);
vm.runInContext(`
  reset(); const e=makeEnemy('forager',1); e.state='lane';
  const raw=d=>{ const p=posAt(d+4),q=posAt(d); return Math.atan2(p.y-q.y,p.x-q.x); };
  assert.ok(raw(GATE_D-10) < -Math.PI/3,'the lane really bends up into the portal (the case being handled)');
  e.d=GATE_D-PORTAL_APPROACH-20; assert.equal(portalFade(e),1,'no fade before the approach'); assert.equal(enemyHeading(e),raw(e.d),'normal heading before the approach');
  const arrival=raw(GATE_D-PORTAL_APPROACH);
  for(const d of [GATE_D-PORTAL_APPROACH+5, GATE_D-20, GATE_D-2]){ e.d=d; assert.equal(enemyHeading(e),arrival,'heading held at '+d); }
  e.d=GATE_D-PORTAL_APPROACH/2; assert.equal(portalFade(e),1,'no fading anywhere before the threshold');
  e.d=GATE_D; assert.equal(portalFade(e),0,'fully faded at the Gate');
  e.state='attached'; e.d=GATE_D-5; assert.equal(portalFade(e),1,'a body off the lane is not faded');
`,c);
console.log('PASS bodies keep their arrival heading and fade into the portal over the last approach');
console.log('1 portal-entry scenario, 0 failures');
