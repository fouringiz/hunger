// v0.10 castes: Aeroplankton flies (Cannon and Flamethrower cannot reach it, the Carapacid shadow does not cover it,
// Turret and Voltaic hit it); Polyp bursts where it dies into six zygotes that hatch Polypoids (which do not split again). Legacy presets
// keep the classic waves.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {verifyParty}=require('../tools/replay-party.cjs');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){ const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(src,c); return c; }
const c=boot(), run=code=>vm.runInContext('{'+code+'}',c); let n=0;
const cases={
  'waves carry Aeroplankton from wave 5 and Polyps from wave 6; legacy presets keep the classic three castes': `
    const types=w=>new Set(waveDef(w).map(s=>s.type));
    assert.ok(!types(4).has('aero')&&!types(4).has('polyp'),'wave 4 is classic');
    assert.ok(types(5).has('aero')&&!types(5).has('polyp'),'wave 5 brings the first flight');
    assert.ok(types(6).has('aero')&&types(6).has('polyp'),'wave 6 brings the first Polyp');
    assert.ok(waveDef(10).filter(s=>s.type==='aero').length>waveDef(5).filter(s=>s.type==='aero').length,'flights grow');
  `,
  'Cannon and Flamethrower cannot target a flying body; Turret and Voltaic can': `
    reset(); S.credits=9999; S.phase='wave';
    const air=makeEnemy('aero',5); air.d=520; Object.assign(air,posAt(520)); S.enemies=[air];
    const near=(type)=>{ let best=null,bd=1e9; for(const s of SLOTS){ const d=Math.hypot(s.x-air.x,s.y-air.y); if(!s.tower&&d<bd){bd=d;best=s;} } build(best,type); return best.tower; };
    for(const [type,can] of [['cannon',false],['flamer',false],['turret',true],['voltaic',true]]){
      const t=near(type); upgrade(t); upgrade(t); const st=tstats(t); const tg=pickTarget(t,st);
      assert.equal(!!tg, can, type+(can?' targets':' ignores')+' the flyer'); sell(t); finishSell(t);
    }
  `,
  'shells, the jet and plasma pools pass under a flying body': `
    reset(); S.credits=9999; S.phase='wave';
    const air=makeEnemy('aero',5); air.d=520; Object.assign(air,posAt(520)); const walker=makeEnemy('forager',5); walker.d=520; Object.assign(walker,posAt(520)); S.enemies=[air,walker];
    build(SLOTS[5],'cannon'); const t=S.towers[0]; t.paused=true; S.shells=[];
    fireArc(t,tstats(t),walker); for(const sh of S.shells) sh.t=sh.flight; advanceShells(SIM_STEP);
    assert.equal(air.hp,air.maxHp,'the shell burst did not touch the flyer'); assert.ok(walker.hp<walker.maxHp,'and hit the walker');
    sell(t); finishSell(t); build(SLOTS[5],'flamer'); const f=S.towers[0]; f.paused=true;
    for(let i=0;i<200;i++){ S.time=i*0.02; fireFlame(f,tstats(f),walker); }
    assert.equal(air.hp,air.maxHp,'the jet never touches the flyer'); assert.ok(!(air.burnUntil>S.time),'it does not burn');
  `,
  'the Carapacid shadow does not cover a flying target': `
    reset(); S.credits=9999; S.phase='wave'; build(SLOTS[2],'turret'); const t=S.towers[0];
    const air=makeEnemy('aero',1), shield=makeEnemy('carapacid',1); air.x=350; air.y=270; shield.x=350; shield.y=236; S.enemies=[air,shield];
    fireFlat(t,tstats(t),air); assert.ok(air.hp<air.maxHp&&shield.hp===shield.maxHp,'the round reaches the flyer over the shell');
  `,
  'a Polyp bursts into six zygotes at its lane position, not bodies; Polypoids hatch one by one on POLYP_HATCH with the parent mutations': `
    reset(); S.wave=6; startWave(); S.spawnQueue.length=0; S.phase='wave';
    const p=makeEnemy('polyp',6); p.wave=6; p.seq=4; p.d=400; Object.assign(p,posAt(400)); p.muts=['keratin']; S.enemies=[p];
    build(SLOTS[2],'turret'); const t=S.towers[0]; t.paused=true;
    damage(p,10000,t); assert.ok(p.dead); assert.equal(POLYP_SPLIT,6); assert.deepEqual(POLYP_HATCH,[0.5,1,1.5,2,2.5,3]);
    assert.deepEqual([ENEMY.polypoid.hp,ENEMY.polypoid.speed,ENEMY.polypoid.bounty,ENEMY.polypoid.gateDmg],[40,56,3,1],'pinned verdict numbers');
    stepSimulation(SIM_STEP);
    const kids=()=>S.enemies.filter(e=>e.type==='polypoid');
    assert.equal(kids().length,0,'no Polypoid at the death'); assert.equal(S.zygotes.length,6,'six zygotes');
    assert.ok(S.zygotes.every(z=>Math.abs(z.d-400)<=POLYP_SCATTER),'scattered within ±POLYP_SCATTER of the death point');
    const zd=new Map(S.zygotes.map(z=>[z.seq,z.d]));
    assert.ok(!S.zygotes.some(z=>S.enemies.includes(z)),'zygotes are not in S.enemies');
    const credits=S.credits, hatchTicks=[]; let seen=0;
    for(let k=1;k<=Math.round(3.2/SIM_STEP);k++){ stepSimulation(SIM_STEP); const now=kids().length; assert.ok(now-seen<=1,'at most one per tick');
      for(;seen<now;seen++){ hatchTicks.push(k); const kid=kids()[seen]; assert.ok(Math.abs(kid.d-zd.get(kid.seq))<=ENEMY.polypoid.speed*SIM_STEP+1e-6,'each Polypoid hatches at the d of its own zygote'); } }
    assert.equal(hatchTicks.length,6,'all six hatched');
    POLYP_HATCH.forEach((h,i)=>{ const want=Math.round(h/SIM_STEP); assert.ok(Math.abs(hatchTicks[i]+1-want)<=1,'hatch '+i+' at '+h+' s (tick '+hatchTicks[i]+')'); });
    assert.ok(hatchTicks.every((k,i)=>i===0||k>hatchTicks[i-1]),'strictly one at a time');
    for(const k of kids()){ assert.equal(k.wave,6); assert.deepEqual(k.muts,['keratin'],'inherits mutations'); }
    assert.ok(new Set(kids().map(k=>k.seq)).size===6,'distinct spawn indices'); assert.equal(S.zygotes.length,0);
    assert.equal(S.credits,credits,'zygotes and hatching give no bounty');
    damage(kids()[0],10000,t); stepSimulation(SIM_STEP);
    assert.equal(kids().length,5,'a Polypoid dies without splitting'); assert.equal(S.zygotes.length,0);
  `,
  'the zygote scatter is deterministic per (wave, seq), stratified into one zygote per bin, hatch times are a permutation, different Polyps differ, and the lane ends clamp': `
    const brood=(wave,seq,d=400)=>{ reset(); S.phase='wave'; S.zygotes=[]; const p=makeEnemy('polyp',wave); p.wave=wave; p.seq=seq; p.d=d; splitBody(p); return S.zygotes.map(z=>({idx:z.idx,offset:z.offset,d:z.d,t:z.t,side:z.side,seq:z.seq})); };
    assert.deepEqual(brood(7,3),brood(7,3),'same (wave, seq) gives the same offsets and hatch order'); assert.deepEqual(brood(7,3,200),brood(7,3,200).map(z=>({...z})));
    const bin=2*POLYP_SCATTER/POLYP_SPLIT, patterns=new Set();
    for(let wave=6;wave<=10;wave++) for(let seq=0;seq<40;seq++){
      const b=brood(wave,seq); patterns.add(JSON.stringify(b.map(z=>z.offset)));
      assert.equal(b.length,POLYP_SPLIT);
      for(const z of b){ assert.ok(z.offset>=-POLYP_SCATTER&&z.offset<=POLYP_SCATTER,'within ±POLYP_SCATTER'); assert.ok(Math.abs(z.side)<=8,'presentation offset within ±8'); }
      const bins=b.map(z=>Math.min(POLYP_SPLIT-1,Math.floor((z.offset+POLYP_SCATTER)/bin))).sort((x,y)=>x-y);
      assert.deepEqual(bins,[0,1,2,3,4,5],'every bin holds exactly one zygote (wave '+wave+', seq '+seq+')');
      assert.deepEqual(b.map(z=>z.t).sort((x,y)=>x-y),[...POLYP_HATCH],'hatch times are a permutation of POLYP_HATCH');
    }
    assert.ok(patterns.size>=190,'different Polyps get different patterns ('+patterns.size+' of 200)');
    assert.notDeepEqual(brood(7,3).map(z=>z.offset),brood(7,4).map(z=>z.offset),'neighbouring Polyps differ');
    const orders=new Set(); for(let seq=0;seq<40;seq++) orders.add(brood(8,seq).map(z=>z.t).join()); assert.ok(orders.size>10,'the hatch order is shuffled, not always lane order');
    assert.ok(brood(6,1,5).every(z=>z.d>=0),'clamped at the Mouth'); assert.ok(brood(6,1,GATE_D-3).every(z=>z.d<=GATE_D-20),'clamped short of the Gate');
  `,
  'a cannon-radius splash centred on an end zygote of a straight stretch never reaches the opposite end': `
    const R=TOWER.cannon.splash; let widest=0;
    for(let wave=6;wave<=9;wave++) for(let seq=0;seq<50;seq++){
      reset(); S.phase='wave'; S.zygotes=[]; const p=makeEnemy('polyp',wave); p.wave=wave; p.seq=seq; p.d=330; splitBody(p);
      const zs=[...S.zygotes].sort((a,b)=>a.idx-b.idx), pts=zs.map(z=>posAt(z.d));
      for(const c of [pts[0],pts[POLYP_SPLIT-1]]) widest=Math.max(widest,pts.filter(q=>Math.hypot(q.x-c.x,q.y-c.y)<=R).length);
      assert.ok(Math.hypot(pts[0].x-pts[POLYP_SPLIT-1].x,pts[0].y-pts[POLYP_SPLIT-1].y)>R,'opposite ends of the brood are further apart than one shell radius (wave '+wave+', seq '+seq+')');
    }
    assert.ok(widest<POLYP_SPLIT,'a shell centred on an end zygote never covers the whole brood (most points covered: '+widest+')');
  `,
  'zygotes are untouched by splash, jets, pools and chains; a howitzer-damage splash at the death point kills no Polypoid, one at the first hatch kills at most two': `
    reset(); S.wave=1; startWave(); S.spawnQueue.length=0; S.phase='wave'; S.credits=9999;
    build(SLOTS[2],'turret'); build(SLOTS[5],'cannon'); const tt=S.towers[0], tc=S.towers[1]; tt.paused=true; tc.paused=true;
    const mk=()=>{ const p=makeEnemy('polyp',1); p.wave=1; p.seq=0; p.d=400; Object.assign(p,posAt(400)); S.enemies=[p]; S.zygotes=[]; damage(p,10000,tt); stepSimulation(SIM_STEP); return p; };
    const polyp=mk(); const shell=()=>{ S.shells=[{sx:tc.x,sy:tc.y,tx:polyp.x,ty:polyp.y,t:0,flight:0.65,tower:tc,dmg:TOWER.cannon.dmg*50,splash:TOWER.cannon.splash,prime:null}]; advanceShells(0.65); };
    shell(); assert.equal(S.enemies.filter(e=>e.type==='polypoid').length,0); assert.equal(S.zygotes.length,6,'the blast at t=0 finds nothing and leaves every zygote');
    let k=0; while(!S.enemies.some(e=>e.type==='polypoid')&&k++<200) stepSimulation(SIM_STEP);
    shell(); assert.ok(S.enemies.filter(e=>e.type==='polypoid'&&e.dead).length<=2,'at the first hatch at most two die');
    assert.equal(S.zygotes.length,5,'the unhatched zygotes are still pending');
    S.credits=0; S.gate=GATE_MAX; for(let i=0;i<400;i++) stepSimulation(SIM_STEP); assert.equal(S.zygotes.length,0);
  `,
  'a wave stays open while its zygotes are unhatched, and game over clears them; the same input gives the same hatch ticks': `
    const trial=()=>{ reset(); startWave(); S.spawnQueue.length=0; S.streams[0].queue.length=0; S.phase='wave'; S.credits=9999;
      build(SLOTS[2],'turret'); const t=S.towers[0]; t.paused=true;
      const p=makeEnemy('polyp',1); p.wave=1; p.seq=0; p.d=400; Object.assign(p,posAt(400)); S.enemies=[p]; damage(p,10000,t);
      const ticks=[]; let seen=0, endedBeforeLast=false, k=0;
      while(S.phase==='wave'&&k++<2000){ stepSimulation(SIM_STEP); const hatched=S.enemies.filter(e=>e.type==='polypoid').length+S.kills-1; while(seen<Math.min(6,hatched)){ ticks.push(k); seen++; }
        if(S.zygotes.length&&(S.phase!=='wave'||!S.streams.length)) endedBeforeLast=true; for(const e of S.enemies) damage(e,1e6,t); }
      return {ticks,endedBeforeLast,k}; };
    const a=trial(), b=trial(); assert.deepEqual(a.ticks,b.ticks,'same input, same hatch ticks'); assert.equal(a.ticks.length,6);
    assert.ok(!a.endedBeforeLast,'the wave did not end with zygotes pending');
    assert.ok(a.k>Math.round(POLYP_HATCH[5]/SIM_STEP)-2,'the wave ended only after the last hatch (tick '+a.k+')');
    reset(); S.phase='wave'; S.gate=0; S.zygotes=[{type:'polypoid',idx:0,t:1,max:1,d:100,x:0,y:0,wave:1,muts:[],seq:0}]; S.enemies=[makeEnemy('forager',1)]; stepSimulation(SIM_STEP);
    assert.equal(S.phase,'over'); assert.equal(S.zygotes.length,0,'game over clears the zygotes');
  `,
  'Grounding never makes a flying body a rod; ground bodies keep the every-third cadence and every Carapacid': `
    reset(); S.mutations=['grounding']; S.phase='wave'; S.spawnedThisWave=0;
    const bodies=waveDef(6).map(s=>makeEnemy(s.type,6));
    assert.ok(bodies.some(b=>b.T.air),'wave 6 has a flight');
    assert.ok(bodies.every(b=>!b.T.air||!b.rod),'no Aeroplankton is a rod');
    assert.ok(bodies.every(b=>b.type!=='carapacid'||b.rod),'every Carapacid is a rod');
    bodies.forEach((b,i)=>{ if(!b.T.air&&b.type!=='carapacid') assert.equal(b.rod,i%ROD_EVERY===ROD_EVERY-1,'ground body '+i+' follows the cadence'); });
    assert.ok(bodies.some(b=>b.rod&&(b.type==='polyp'||b.type==='forager')),'rods still appear on ground bodies of the wave');
  `,
};
for(const [name,code] of Object.entries(cases)){ run(code); console.log('PASS '+name); n++; }
const legacy=boot('?balance=v04'); assert.ok(!new Set(vm.runInContext('waveDef(8).map(s=>s.type)',legacy)).has('aero'),'legacy waves are classic');
console.log('PASS the legacy v04 preset keeps the classic three-caste waves'); n++;
const rec=JSON.parse(vm.runInContext(`(() => { reset(); beginReplayRecording();
  performPlayerAction({kind:'build',slot:2,type:'turret'}); performPlayerAction({kind:'build',slot:5,type:'cannon'}); performPlayerAction({kind:'build',slot:15,type:'generator'});
  const ref=s=>({slot:s,type:SLOTS[s].tower.type,generation:replay.generations[s]});
  let k=0; while(replay.mode==='recording'&&k++<700000){ if(S.phase==='build'){ for(const s of [2,5]){ const t=SLOTS[s].tower; if(t.level<3) performPlayerAction({kind:'upgrade',...ref(s)}); } performPlayerAction({kind:'wave'}); } update(SIM_STEP); }
  return JSON.stringify(exportReplay()); })()`,c));
assert.ok(rec.events.length>5 && verifyParty(rec).verified,'a v0.10 game with flyers and Polyps records and verifies');
console.log('PASS a v0.10 game records and verifies'); n++;
console.log(n+' caste scenarios, 0 failures');
