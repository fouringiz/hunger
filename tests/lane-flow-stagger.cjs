// Presentation only. Polyps and Polypoids run their own gait phase and tempo from replayHash(wave:seq); large bodies on
// the lane are drawn on its centre line and small bodies inside a large body's footprint are drawn pushed outward,
// on their own side, so the stream flows around it. Simulation positions are never touched.
'use strict';
const assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
  const {run}=await loadWorld({zone:'mire'});
  const j=code=>JSON.parse(run(`JSON.stringify((()=>{${code}})())`));
  // Gait: two Polyps exactly one base stride apart would crawl in lockstep without their own phase and tempo.
  const gait=j(`reset();S.phase='wave';S.spawnQueue=[];S.streams=[];
    const mk=(seq,d)=>{const b=makeEnemy('polyp',6);b.wave=6;b.seq=seq;b.d=d;Object.assign(b,posAt(d));return b;};
    const stride=ENEMY.polyp.speed*POLYP_FAMILY.polyp.cycle;let differ=0,samples=0,lockstep=0;
    for(let k=0;k<60;k++){const a=mk(2*k,400),b=mk(2*k+1,400+stride);S.enemies=[a,b];let same=0;
      for(let i=0;i<40;i++){a.d+=1.3;b.d+=1.3;Object.assign(a,posAt(a.d));Object.assign(b,posAt(b.d));samples++;
        if(polypFamilyPose(a,0).frame!==polypFamilyPose(b,0).frame)differ++;else same++;}
      if(same===40)lockstep++;}
    const tempos=[polypGaitOf({wave:6,seq:0}).tempo,polypGaitOf({wave:6,seq:1}).tempo];
    const all=Array.from({length:200},(_,s)=>polypGaitOf({wave:6,seq:s}).tempo);
    return {differ:differ/samples,lockstep,tempos,min:Math.min(...all),max:Math.max(...all)};`);
  assert.ok(gait.differ>=.6,'neighbouring Polyps one base stride apart are mostly in different frames ('+(gait.differ*100).toFixed(0)+'%)');
  assert.equal(gait.lockstep,0,'no neighbouring pair crawls in lockstep');
  assert.ok(gait.min>=.9&&gait.max<=1.1&&gait.max-gait.min>.15,'tempo spans 0.9-1.1x');
  assert.notEqual(gait.tempos[0],gait.tempos[1],'neighbours run different tempos');
  // Lateral flow: a Forager level with a Polyp is drawn outside its body, one far from it keeps its own offset.
  const flow=j(`reset();S.phase='wave';S.spawnQueue=[];S.streams=[];
    const p=makeEnemy('polyp',6);p.wave=6;p.seq=0;p.d=420;Object.assign(p,posAt(420));
    const foragers=Array.from({length:40},(_,i)=>{const f=makeEnemy('forager',6);f.wave=6;f.seq=i;return f;});
    S.enemies=[p,...foragers];const at=(f,d)=>{f.d=d;Object.assign(f,posAt(d));return laneOffset(f);};
    const level=foragers.map(f=>at(f,420)),far=foragers.map(f=>at(f,600)),own=foragers.map(f=>staggerOf(f).off);
    const sim=JSON.stringify(S.enemies.map(e=>[e.d,e.x,e.y])),before=replaySignature();for(const e of S.enemies)visualEnemy(e);draw();
    return {polyp:laneOffset(p),level,far,own,clear:LANE_LARGE_BODY.polyp.across,half:LANE_HALF_VISUAL,
      readonly:replaySignature()===before&&JSON.stringify(S.enemies.map(e=>[e.d,e.x,e.y]))===sim};`);
  assert.equal(flow.polyp,0,'a large body takes the centre line');
  assert.ok(flow.level.every(o=>Math.abs(o)>=flow.clear),'every Forager level with the Polyp is drawn outside its body');
  assert.ok(flow.level.every((o,i)=>Math.sign(o)===Math.sign(flow.own[i])||flow.own[i]===0),'each is pushed out on its own side');
  assert.ok(flow.level.every(o=>Math.abs(o)<=flow.half),'and stays inside the lane');
  assert.deepEqual(flow.far,flow.own,'away from large bodies the hash offset is unchanged');
  assert.ok(flow.readonly,'drawing changes no simulation state or position');
  console.log('PASS lane flow: Polyps out of lockstep (tempo 0.9-1.1), large bodies centred, small bodies flow around them, simulation untouched');
})().catch(e=>{console.error(e);process.exitCode=1;});
