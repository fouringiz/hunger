// v0.10 castes: Aeroplankton flies (Cannon and Flamethrower cannot reach it, the Carapacid shadow does not cover it,
// Turret and Voltaic hit it); Polyp splits where it dies into two Polypoids that do not split again. Legacy presets
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
  'a Polyp splits into two Polypoids at its lane position, with its mutations; Polypoids do not split': `
    reset(); S.wave=6; startWave(); S.spawnQueue.length=0; S.phase='wave';
    const p=makeEnemy('polyp',6); p.wave=6; p.seq=4; p.d=400; Object.assign(p,posAt(400)); p.muts=['keratin']; S.enemies=[p];
    build(SLOTS[2],'turret'); const t=S.towers[0]; t.paused=true;
    damage(p,10000,t); assert.ok(p.dead); assert.equal(S.births.length,2,'two children queued, not yet on the field');
    stepSimulation(SIM_STEP);
    const kids=S.enemies.filter(e=>e.type==='polypoid'); assert.equal(kids.length,2,'released after the step');
    for(const k of kids){ assert.ok(Math.abs(k.d-400)<=6+ENEMY.polypoid.speed*SIM_STEP+1e-6,'near the parent'); assert.equal(k.wave,6); assert.deepEqual(k.muts,['keratin'],'inherits mutations'); }
    assert.ok(new Set(kids.map(k=>k.seq)).size===2,'distinct spawn indices');
    const before=S.enemies.length; damage(kids[0],10000,t); stepSimulation(SIM_STEP);
    assert.equal(S.enemies.filter(e=>e.type==='polypoid').length,1,'a Polypoid dies without splitting');
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
