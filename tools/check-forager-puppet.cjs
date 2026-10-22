'use strict';
const assert=require('node:assert/strict');
const rig=require('./lib/forager-puppet-study.js');
let plantedPairs=0;
for(let d=0;d<rig.STRIDE*5;d+=.2){
  const a=rig.pose(d),b=rig.pose(d+.01);
  assert.equal(a.legs.length,6);
  for(let i=0;i<6;i++){
    const l=a.legs[i],next=b.legs[i];
    for(const point of [l.hip,l.knee,l.foot])assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
    assert.ok(Math.abs(Math.hypot(l.knee.x-l.hip.x,l.knee.y-l.hip.y)-53)<1e-7);
    assert.ok(Math.abs(Math.hypot(l.knee.x-l.foot.x,l.knee.y-l.foot.y)-72)<1e-7);
    if(l.planted&&next.planted){assert.deepEqual(l.foot,next.foot);plantedPairs++;}
    const before=rig.pose(d-1e-6).legs[i].foot,after=rig.pose(d+1e-6).legs[i].foot;
    assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<.001,'foot trajectory must be continuous');
  }
}
assert.ok(plantedPairs>5000);
for(const l of rig.pose(0).legs){
  for(const boundary of [rig.STANCE,1]){
    const distance=(boundary-l.phase+1)*rig.STRIDE;
    const before=rig.pose(distance-1e-7).legs[l.id].foot,after=rig.pose(distance+1e-7).legs[l.id].foot;
    assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<1e-4,'stance and transfer must meet at their exact boundary');
  }
}
assert.deepEqual(rig.pose(17),rig.pose(17),'fixed travel freezes body and legs');
const atNormal=rig.pose(40),atFast=rig.pose(40*1.7);
assert.notDeepEqual(atNormal.legs.map(l=>l.phase),atFast.legs.map(l=>l.phase));
console.log('PASS planted feet stay in world space, six finite two-bone legs, continuous transfers, distance-driven gait');
