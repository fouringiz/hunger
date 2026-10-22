// Level-4 branches: one per tower, only from level 3, for good; each answers its declared threat; recorded in replays.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {verifyParty}=require('../tools/replay-party.cjs');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(){ const ctx=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(src,ctx); return ctx; }
const run=(c,code)=>vm.runInContext(code,c);
const cases={
  'a branch is taken once, only from level 3, and costs its price': `
    reset(); S.credits=5000; build(SLOTS[2],'turret'); const t=S.towers[0];
    assert.equal(upgrade(t,'A'),false,'no branch below level 3');
    upgrade(t); upgrade(t); assert.equal(t.level,3);
    const before=S.credits; assert.equal(upgrade(t,'B'),true); assert.equal(t.level,4); assert.equal(t.branch,'B');
    assert.equal(before-S.credits,BRANCHES.turret.B.cost);
    assert.equal(upgrade(t,'A'),false,'the branch is for good'); assert.equal(upgrade(t),false,'no plain upgrade past level 3');
    build(SLOTS[15],'generator'); const g=S.towers[1]; upgrade(g); upgrade(g); assert.equal(upgrade(g,'A'),false,'generators have no branches');
  `,
  'each branch reshapes level-3 stats as declared': `
    reset(); S.credits=9000;
    const mk=(slot,type,br)=>{ build(SLOTS[slot],type); const t=SLOTS[slot].tower; upgrade(t); upgrade(t); const l3=tstats(t); if(br) upgrade(t,br); return [l3,tstats(t)]; };
    let [a,b]=mk(1,'turret','A'); assert.ok(Math.abs(b.interval-a.interval*0.5)<1e-9 && Math.abs(b.dmg-a.dmg*0.75)<1e-9,'Machine Gun: twice the rate, 0.75 damage');
    [a,b]=mk(2,'turret','B'); assert.ok(b.dmg===a.dmg*4 && b.range===a.range+40 && b.pierce,'Rifle: x4 damage, +40 range, pierces');
    [a,b]=mk(3,'voltaic','A'); assert.ok(b.hops===a.hops+2 && b.falloff===0.8,'Tesla: +2 hops, slower falloff');
    [a,b]=mk(5,'voltaic','B'); assert.ok(b.hops===0 && b.dmg===a.dmg*3,'Prism: no chain, x3 damage');
    [a,b]=mk(6,'cannon','A'); assert.ok(Math.abs(b.dmg-a.dmg*2.2)<1e-9 && Math.abs(b.interval-a.interval*1.4)<1e-9,'Howitzer: x2.2 damage, slower');
    [a,b]=mk(8,'cannon','B'); assert.ok(b.bomblets===5 && Math.abs(b.bombletDmg-a.dmg*0.35)<1e-9,'Cluster: five bomblets at 0.35 damage');
  `,
  'the Rifle round passes a Carapacid shadow that stops a plain turret': `
    for(const br of [null,'B']){
      reset(); S.credits=9000; build(SLOTS[2],'turret'); const t=S.towers[0]; upgrade(t); upgrade(t); if(br) upgrade(t,br);
      const far=makeEnemy('forager',1), shield=makeEnemy('carapacid',1);
      far.x=350; far.y=270; shield.x=350; shield.y=236; S.enemies=[far,shield]; S.phase='wave';
      fireFlat(t,tstats(t),far);
      if(br) assert.ok(far.hp<far.maxHp && shield.hp===shield.maxHp,'the Rifle hits the target behind the shield');
      else assert.ok(far.hp===far.maxHp && shield.hp<shield.maxHp,'a plain turret is stopped by the shield');
    }
  `,
  'the Prism has no chain for a lightning rod to cut; the Tesla chain is longer': `
    const line=()=>{ const out=[]; for(let i=0;i<8;i++){ const e=makeEnemy('forager',5); e.d=470+i*25; Object.assign(e,posAt(e.d)); e.rod=false; out.push(e);} return out; };
    reset(); S.credits=9000; build(SLOTS[2],'voltaic'); let t=S.towers[0]; upgrade(t); upgrade(t); upgrade(t,'A');
    let es=line(); S.enemies=es; S.phase='wave'; let struck=fireElectro(t,tstats(t),es[7]); assert.equal(struck.length,tstats(t).hops+1,'Tesla strikes primary plus every hop');
    reset(); S.credits=9000; build(SLOTS[2],'voltaic'); t=S.towers[0]; upgrade(t); upgrade(t); upgrade(t,'B');
    es=line(); es[7].rod=true; S.enemies=es; S.phase='wave'; struck=fireElectro(t,tstats(t),es[7]);
    assert.equal(struck.length,1,'the Prism strikes one body'); assert.ok(es[7].maxHp-es[7].hp>0,'and a rod takes the full beam');
  `,
  'Cluster bomblets reach spread bodies that a single shell from the same aim misses': `
    reset(); S.credits=9000; build(SLOTS[5],'cannon'); const t=S.towers[0]; upgrade(t); upgrade(t); upgrade(t,'B');
    const aim=makeEnemy('forager',5); aim.d=560; Object.assign(aim,posAt(560)); aim.state='attached'; S.enemies=[aim]; S.phase='wave'; S.shells=[];
    fireArc(t,tstats(t),aim); const shells=S.shells.slice();
    assert.equal(shells.length,5,'five bomblets');
    const centre=shells.find(sh=>sh.prime===aim), ring=shells.filter(sh=>sh!==centre);
    const bodies=ring.map(sh=>({x:sh.tx,y:sh.ty,r:ENEMY.forager.r}));
    const hitBy=(list,b)=>list.some(sh=>Math.hypot(b.x-sh.tx,b.y-sh.ty)<=sh.splash+b.r*0.5);   // the impact rule of stepSimulation
    assert.ok(bodies.every(b=>hitBy(ring,b)),'every body on the ring is under a bomblet');
    const plain=[{tx:centre.tx,ty:centre.ty,splash:TOWER.cannon.splash}];
    assert.ok(bodies.every(b=>!hitBy(plain,b)),'a plain shell at the same aim reaches none of them');
  `,
};
const c=boot(); let n=0;
for(const [name,code] of Object.entries(cases)){ run(c,'{'+code+'}'); console.log('PASS '+name); n++; }
const exported=JSON.parse(run(c,`(() => { reset(); beginReplayRecording();
  performPlayerAction({kind:'build',slot:5,type:'cannon'}); performPlayerAction({kind:'build',slot:2,type:'turret'});
  const ref=s=>({slot:s,type:SLOTS[s].tower.type,generation:replay.generations[s]});
  let k=0;
  while(replay.mode==='recording'&&k++<600000){
    if(S.phase==='build'){
      const c=SLOTS[5].tower; if(c.level<3) performPlayerAction({kind:'upgrade',...ref(5)}); else if(!c.branch) performPlayerAction({kind:'upgrade',...ref(5),branch:'B'});
      performPlayerAction({kind:'wave'});
    }
    update(SIM_STEP);
  }
  assert.equal(SLOTS[5].tower.branch,'B','the game earned the Cluster');
  assert.equal(performPlayerAction({kind:'upgrade',...ref(5),branch:'C'}),false,'an unknown branch is refused');
  return JSON.stringify(exportReplay()); })()`));
assert.ok(exported.events.some(e=>e.kind==='upgrade'&&e.branch==='B'),'the branch is recorded'); assert.ok(verifyParty(exported).verified,'a branch game verifies');
console.log('PASS a branch purchase is recorded and the game verifies'); n++;
console.log(n+' branch scenarios, 0 failures');
