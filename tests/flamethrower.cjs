// Flamethrower (v0.8): a jet of burning fuel sweeping a quarter circle; touched bodies keep burning; a Carapacid in the
// jet passes only part of the fire; Plasma leaves burning pools; Cryojet slows instead of burning; Mirror Chitin answers fire.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {verifyParty}=require('../tools/replay-party.cjs');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
vm.runInContext(src,c);
const setup=`const flamer=(br)=>{ reset(); S.credits=9999; S.phase='wave'; build(SLOTS[2],'flamer'); const t=SLOTS[2].tower; if(br){upgrade(t);upgrade(t);upgrade(t,br);} t.paused=true; return t; };
  const at=(type,dx,dy,t)=>{ const e=makeEnemy(type,1); e.x=t.x+dx; e.y=t.y+dy; e.d=500; e.state='attached'; return e; };`;
const cases={
  'the jet sweeps no wider than a quarter circle around its target': `${setup}
    const t=flamer(); const e=at('forager',60,0,t); S.enemies=[e]; let lo=1e9, hi=-1e9;
    for(let i=0;i<400;i++){ S.time=i*0.017; fireFlame(t,tstats(t),e); const d=t.angle-Math.atan2(e.y-t.y,e.x-t.x); lo=Math.min(lo,d); hi=Math.max(hi,d); }
    assert.ok(hi<=Math.PI/4+1e-9 && lo>=-Math.PI/4-1e-9,'within ±45°'); assert.ok(hi-lo>Math.PI/3,'and it really sweeps');
  `,
  'a touched body keeps burning after the jet has passed, and burns do not stack': `${setup}
    const t=flamer(); const e=at('carapacid',50,0,t); S.enemies=[e]; S.time=0;
    let k=0; while(k<200 && !(t.angle===Math.atan2(e.y-t.y,e.x-t.x))) { S.time=k*0.005; k++; }
    S.time=0; t.angle=0; const st=tstats(t); const a0=Math.atan2(e.y-t.y,e.x-t.x);
    const hit=()=>{ for(let i=0;i<2000;i++){ S.time=i*0.003; fireFlame(t,st,e); if(e.burnUntil>S.time) return true; } return false; };
    assert.ok(hit(),'the sweep crosses the body'); const hp=e.hp, dps=e.burnDps;
    fireFlame(t,st,e); assert.equal(e.burnDps,dps,'a second touch refreshes, never stacks');
    const start=S.time; while(S.time<start+1){ stepSimulation(SIM_STEP); }
    assert.ok(e.hp<hp-dps*0.8,'it keeps burning for a second after the touch');
  `,
  'a Carapacid in the jet passes only part of the fire to the body behind it': `${setup}
    const burnOf=(withShield)=>{ const t=flamer(); const behind=at('forager',70,0,t); const list=[behind]; if(withShield) list.push(at('carapacid',35,0,t));
      S.enemies=list; t.angle=0; for(let i=0;i<4000;i++){ S.time=i*0.002; fireFlame(t,tstats(t),behind); if(behind.burnUntil>S.time) break; } return behind.burnDps; };
    const open=burnOf(false), shaded=burnOf(true);
    assert.ok(Math.abs(shaded-open*FLAME_SHADOW_PASS)<1e-9,'the shadow passes '+FLAME_SHADOW_PASS+' of the fire: '+open+' -> '+shaded);
  `,
  'Plasma leaves burning pools on the lane; Cryojet slows and does not burn': `${setup}
    let t=flamer('A'); let e=makeEnemy('forager',1); e.d=520; Object.assign(e,posAt(520)); S.enemies=[e];
    fireFlame(t,tstats(t),e); assert.equal(S.pools.length,1,'a pool where the fuel lands'); const p=S.pools[0];
    const walker=makeEnemy('forager',1); walker.d=520; Object.assign(walker,posAt(520)); S.enemies=[walker]; const hp=walker.hp;
    for(let i=0;i<30;i++) stepSimulation(SIM_STEP); assert.ok(walker.hp<hp,'the pool burns whoever stands in it');
    t=flamer('B'); e=at('forager',40,0,t); S.enemies=[e];
    for(let i=0;i<4000 && !(e.slowUntil>S.time);i++){ S.time=i*0.002; fireFlame(t,tstats(t),e); }
    assert.ok(e.slowUntil>S.time,'coolant slows'); assert.ok(!(e.burnUntil>S.time),'and does not burn');
    assert.ok(laneEffectiveSpeed(e,1)<e.speed,'a slowed body moves slower on the lane');
  `,
  'Mirror Chitin cuts fire by 30% and fire dominance earns it': `${setup}
    const t=flamer(); const a=makeEnemy('forager',1), b=makeEnemy('forager',1); b.muts=['mirror'];
    const ha=a.hp, hb=b.hp; damage(a,10,t); damage(b,10,t); assert.ok(Math.abs((hb-b.hp)-(ha-a.hp)*0.7)<1e-9);
    reset(); S.wave=EVOLUTION_WAVES[0]-1; startWave(); S.dmg={flat:5,arc:5,electro:5,fire:100}; endWave();
    assert.deepEqual(S.mutations,['mirror']); assert.ok(S.report.includes('fire dominance'));
  `,
};
let n=0; for(const [name,code] of Object.entries(cases)){ vm.runInContext('{'+code+'}',c); console.log('PASS '+name); n++; }
const rec=JSON.parse(vm.runInContext(`(() => { reset(); beginReplayRecording();
  performPlayerAction({kind:'build',slot:2,type:'flamer'}); performPlayerAction({kind:'build',slot:5,type:'cannon'});
  const ref=s=>({slot:s,type:SLOTS[s].tower.type,generation:replay.generations[s]});
  let k=0; while(replay.mode==='recording'&&k++<600000){
    if(S.phase==='build'){ const f=SLOTS[2].tower; if(f.level<3) performPlayerAction({kind:'upgrade',...ref(2)}); else if(!f.branch) performPlayerAction({kind:'upgrade',...ref(2),branch:'A'}); performPlayerAction({kind:'wave'}); }
    update(SIM_STEP); }
  return JSON.stringify(exportReplay()); })()`,c));
assert.ok(rec.events.some(e=>e.type==='flamer'&&e.branch==='A'),'a Plasma game was recorded'); assert.ok(verifyParty(rec).verified,'and verifies');
console.log('PASS a Flamethrower game is recorded and verifies'); n++;
console.log(n+' flamethrower scenarios, 0 failures');
