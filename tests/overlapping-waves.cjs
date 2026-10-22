// Overlapping waves (v0.7): a wave can be called at any time; early calls pay credits; the first call over a live wave
// gives the swarm one extra mutation, once; waves complete on their own bodies; victory needs all ten waves cleared.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {verifyParty}=require('../tools/replay-party.cjs');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){ const ctx=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(src,ctx); return ctx; }
const cases={
  'an early call in a pause pays for the waiting skipped': `
    reset(); beginReplayRecording(); S.buildTimer=10; const c0=S.credits;
    assert.ok(performPlayerAction({kind:'wave'})); assert.equal(S.credits-c0, Math.round(EARLY_CALL_BONUS*10));
  `,
  'a call over a live wave starts the next wave at once, pays a whole pause and runs both streams': `
    reset(); beginReplayRecording(); performPlayerAction({kind:'wave'}); for(let i=0;i<120;i++) update(SIM_STEP);
    const c0=S.credits; assert.equal(S.phase,'wave');
    assert.ok(performPlayerAction({kind:'wave'}),'a call during a wave is accepted');
    assert.equal(S.wave,2); assert.equal(S.streams.length,2,'two waves on the field');
    assert.equal(S.credits-c0, Math.round(EARLY_CALL_BONUS*BUILD_PAUSE));
    const spawnedBefore=S.enemies.length; for(let i=0;i<120;i++) update(SIM_STEP);
    assert.ok(S.enemies.some(e=>e.wave===1)&&S.enemies.some(e=>e.wave===2),'bodies of both waves are on the lane');
    assert.ok(replay.events.some(e=>e.kind==='wave'&&e.stacked===true),'the overlapping call is marked in the record');
  `,
  'the first overlapping call gives one extra mutation, once, deterministically, and scheduled ones still come': `
    const rush=()=>{ reset(); beginReplayRecording(); performPlayerAction({kind:'wave'}); for(let i=0;i<90;i++) update(SIM_STEP);
      performPlayerAction({kind:'wave'}); const first=S.rushMutation; performPlayerAction({kind:'wave'}); return {first, muts:S.mutations.slice()}; };
    const a=rush(), b=rush();
    assert.ok(a.first && MUT[a.first],'the rush grants a catalogue mutation');
    assert.deepEqual(a.muts,[a.first],'exactly one, and a second overlapping call adds nothing');
    assert.deepEqual(a,b,'the same game picks the same mutation');
    S.phase='wave'; S.streams=[]; S.enemies=[];
    S.dmg={flat:100,arc:0,electro:0}; endWave(EVOLUTION_WAVES[0],false); S.dmg={flat:0,arc:100,electro:0}; endWave(EVOLUTION_WAVES[1],false);
    assert.equal(S.mutations.length, MUT_STACK_CAP+1,'both scheduled evolutions still come on top of the rush');
    reset(); S.phase='wave'; S.dmg={flat:100,arc:0,electro:0}; endWave(EVOLUTION_WAVES[0],false); S.dmg={flat:0,arc:100,electro:0}; endWave(EVOLUTION_WAVES[1],false);
    S.dmg={flat:0,arc:0,electro:100}; endWave(EVOLUTION_WAVES[1],false);
    assert.equal(S.mutations.length, MUT_STACK_CAP,'without a rush the cap stays at two');
  `,
  'a wave completes on its own bodies while a later wave is still on the field': `
    reset(); beginReplayRecording(); performPlayerAction({kind:'wave'}); performPlayerAction({kind:'wave'});
    for(const st of S.streams) st.queue.length=0; S.spawnQueue=S.streams[1].queue;
    const a=makeEnemy('forager',1); a.wave=1; const b=makeEnemy('forager',2); b.wave=2; S.enemies=[a,b];
    a.dead=true; update(SIM_STEP);
    assert.deepEqual(S.streams.map(s=>s.wave),[2],'wave 1 is complete'); assert.equal(S.phase,'wave','the field is not clear');
    b.dead=true; update(SIM_STEP); assert.equal(S.phase,'build','clearing the last body ends the fight');
  `,
  'all ten waves can be called; an eleventh call is refused; victory needs the field clear': `
    reset(); beginReplayRecording(); S.credits=99999;
    for(const s of [0,1,2,3,4,5,6,8,9,10,11,12]) build(SLOTS[s], s%3===0?'cannon':s%3===1?'turret':'voltaic'); build(SLOTS[15],'generator'); upgrade(SLOTS[15].tower); upgrade(SLOTS[15].tower);
    for(let w=0;w<10;w++) assert.ok(performPlayerAction({kind:'wave'}),'call '+(w+1));
    assert.equal(S.wave,10); assert.equal(performPlayerAction({kind:'wave'}),false,'no eleventh wave');
    assert.equal(S.phase,'wave'); let k=0; while(S.phase==='wave'&&k++<600000) update(SIM_STEP);
    assert.equal(S.phase,'over');
  `,
  'legacy rule presets pay no early-call bonus': ``,
  'Cluster bomblets carry an airburst hint and strike three fragments each inside their blast': `
    reset(); S.credits=9000; build(SLOTS[5],'cannon'); const t=S.towers[0]; upgrade(t); upgrade(t); upgrade(t,'B');
    const aim=makeEnemy('forager',5); aim.d=560; Object.assign(aim,posAt(560)); aim.state='attached'; S.enemies=[aim]; S.phase='wave'; S.shells=[]; S.fx=[]; t.paused=true;
    fireArc(t,tstats(t),aim); assert.ok(S.shells.every(sh=>sh.cluster&&sh.cluster.cx!==undefined),'every bomblet knows the burst point');
    const shells=S.shells.slice(); for(const sh of S.shells) sh.t=sh.flight; stepSimulation(SIM_STEP);
    const frags=S.fx.filter(f=>f.kind==='frag'); assert.equal(frags.length,15,'three fragments per bomblet');
    assert.ok(frags.every(f=>shells.some(sh=>Math.hypot(f.x-sh.tx,f.y-sh.ty)<=sh.splash)),'fragments land inside a blast area');
  `,
};
const c=boot(); let n=0;
for(const [name,code] of Object.entries(cases)){ if(!code) continue; vm.runInContext('{'+code+'}',c); console.log('PASS '+name); n++; }
const legacy=boot('?balance=v04'); assert.equal(vm.runInContext('EARLY_CALL_BONUS',legacy),0); console.log('PASS legacy rule presets pay no early-call bonus'); n++;
const rec=JSON.parse(vm.runInContext(`(() => { reset(); beginReplayRecording(); performPlayerAction({kind:'build',slot:5,type:'cannon'});
  performPlayerAction({kind:'wave'}); for(let i=0;i<200;i++) update(SIM_STEP); performPlayerAction({kind:'wave'});
  let k=0; while(replay.mode==='recording'&&k++<600000){ if(S.phase==='build') performPlayerAction({kind:'wave'}); update(SIM_STEP); }
  return JSON.stringify(exportReplay()); })()`,c));
assert.ok(rec.events.some(e=>e.stacked),'the overlapping call is recorded'); assert.ok(verifyParty(rec).verified,'an overlapping game verifies');
console.log('PASS an overlapping game is recorded and verifies'); n++;
console.log(n+' overlapping-wave scenarios, 0 failures');
