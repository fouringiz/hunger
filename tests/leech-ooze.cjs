// v0.11 — the Leech hunts beneath the ooze (passport v2.15). Relational checks, no balance pins beyond the verdict numbers:
// a hunting Leech is submerged until LEECH_OOZE.surfaceDist from its generator, cannot be targeted while submerged, takes
// only the collateral share of area damage, no flat damage, surfaces standing still for BUILD_WARMUP_SECONDS at full
// damage, then attaches; a wave never carries more Leeches than there are free generators; presets keep the old Leech.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){ const c=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(src,c); return c; }
const c=boot(), run=code=>vm.runInContext('{'+code+'}',c), get=code=>vm.runInContext(code,c);

assert.equal(get('ENEMY.leech.hp'),200,'verdict pin: Leech 200 HP');
assert.equal(get('ENEMY.leech.speed'),38,'verdict pin: Leech speed 38');
assert.equal(get('ENEMY.leech.bounty'),35,'verdict pin: Leech bounty 35');
assert.equal(get('LEECH_OOZE.surfaceDist'),120,'verdict pin: surfaces 120 units from the target');
assert.ok(get('LEECH_OOZE.collateral')>0&&get('LEECH_OOZE.collateral')<1,'collateral is a share, not immunity and not full damage');

// One Leech, one generator on slot 7 (far from the lane mouth), no other enemies. Trace the hunt.
function hunt(ctx,extra=''){
  const r=code=>vm.runInContext('{'+code+'}',ctx);
  r(`reset();S.credits=5000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[7],'generator');S.selected=null;
     var leech=makeEnemy('leech',5);S.enemies=[leech];${extra}
     var trace=[];var ticks=0;
     while(leech.state!=='attached'&&!leech.dead&&ticks<60*90){update(SIM_STEP);ticks++;
       trace.push({state:leech.state,sub:leech.submerged,x:leech.x,y:leech.y,hp:leech.hp,L:Math.hypot(SLOTS[7].x-leech.x,SLOTS[7].y-leech.y)});}`);
  return JSON.parse(r('JSON.stringify({attached:leech.state==="attached",dead:leech.dead,ticks,trace})'));
}
const h=hunt(c);
assert.ok(h.attached,`the Leech still ends attached (${h.ticks} ticks)`);
const first=h.trace[0];
assert.ok(first.sub&&first.state==='seek','the hunt starts beneath the ooze on the first tick');
const surfaceAt=h.trace.findIndex(t=>t.state==='surfacing');
assert.ok(surfaceAt>0,'the Leech surfaces before attaching');
assert.ok(h.trace.slice(0,surfaceAt).every(t=>t.sub),'submerged on every tick before surfacing');
const SD=get('LEECH_OOZE.surfaceDist');
assert.ok(h.trace.slice(0,surfaceAt-1).every(t=>t.L>SD),'never within surfaceDist while still moving submerged');
assert.ok(h.trace[surfaceAt].L<=SD+1e-6,'surfaces once within surfaceDist of the generator');
const surfacing=h.trace.filter(t=>t.state==='surfacing');
assert.ok(Math.abs(surfacing.length-Math.round(get('BUILD_WARMUP_SECONDS')/get('SIM_STEP')))<=1,`stands still for BUILD_WARMUP_SECONDS (${surfacing.length} ticks)`);
assert.ok(surfacing.every(t=>Math.hypot(t.x-surfacing[0].x,t.y-surfacing[0].y)<1e-6),'no movement while surfacing');
assert.ok(h.trace.slice(surfaceAt+surfacing.length).every(t=>!t.sub),'the crawl after surfacing is in the open');
console.log(`PASS submerged hunt: ${surfaceAt} ticks beneath the ooze, ${surfacing.length} surfacing, attached at tick ${h.ticks}`);

// Targeting: a turret on the hunt line (slot 1, between the mouth and a generator on slot 2) ignores the submerged body
// passing it and engages it the moment it surfaces.
run(`reset();S.credits=5000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[2],'generator');build(SLOTS[1],'turret');S.selected=null;
     for(const t of S.towers)t.warm=0;
     var leech=makeEnemy('leech',5);S.enemies=[leech];var hpSub=null,hpSurf=null,ticks=0;
     while(leech.state!=='attached'&&!leech.dead&&ticks<60*90){update(SIM_STEP);ticks++;
       if(leech.submerged)hpSub=leech.hp;
       if(leech.state==='surfacing')hpSurf=leech.hp;}`);
assert.equal(get('hpSub'),get('leech.maxHp'),'flat fire never reaches the submerged body');
assert.ok(get('hpSurf')<get('leech.maxHp'),'the turret engages the Leech while it surfaces');
console.log('PASS turret: no hits beneath the ooze, hits on the surface');

// Collateral: a cannon shell bursting on a Forager next to the ripple reaches the Leech at the collateral share only.
run(`reset();S.credits=5000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[7],'generator');S.selected=null;
     var leech=makeEnemy('leech',5);leech.state='seek';leech.gen=SLOTS[7].tower;SLOTS[7].tower.leeched=leech;leech.submerged=true;leech.route=[{x:SLOTS[7].x,y:SLOTS[7].y}];
     leech.x=300;leech.y=300;var bait=makeEnemy('forager',5);bait.x=305;bait.y=300;S.enemies=[leech,bait];
     var cannon={T:TOWER.cannon,x:300,y:300,level:1,kills:0};
     var before=leech.hp;
     S.shells.push({sx:0,sy:0,tx:305,ty:300,t:10,flight:0.65,tower:cannon,dmg:40,splash:48,prime:bait});
     advanceShells(SIM_STEP);`);
assert.ok(get('bait.hp')<get('bait.maxHp'),'the shell lands on the bait');
const taken=get('before-leech.hp');
assert.ok(taken>0,'some splash bleeds through the ooze');
assert.ok(Math.abs(taken-40*get('LEECH_OOZE.collateral'))<1e-9,`exactly the collateral share of the shell (${taken})`);
console.log('PASS cannon splash bleeds through at the collateral share');

// A tesla hop onto a body next to the ripple also bleeds through; the chain itself never jumps onto the submerged body.
run(`reset();S.credits=5000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[7],'generator');S.selected=null;
     var leech=makeEnemy('leech',5);leech.state='seek';leech.gen=SLOTS[7].tower;SLOTS[7].tower.leeched=leech;leech.submerged=true;leech.route=[{x:SLOTS[7].x,y:SLOTS[7].y}];
     leech.x=300;leech.y=300;var bait=makeEnemy('forager',5);bait.x=310;bait.y=300;S.enemies=[leech,bait];
     var volt={T:TOWER.voltaic,x:300,y:200,level:1,kills:0,angle:0};var st=tstats(volt);
     var before=leech.hp;var struck=fireElectro(volt,st,bait);`);
assert.ok(get('struck.every(e=>e!==leech)'),'the chain never selects the submerged body');
assert.ok(get('before-leech.hp')>0&&get('before-leech.hp')<get('tstats(volt).dmg'),'a hop beside the ripple bleeds through at less than full damage');
console.log('PASS tesla hop beside the ripple bleeds through');

// The wave composition never carries more Leeches than there are free generators.
run(`reset();S.credits=5000;`);
assert.equal(get('waveDef(9).filter(s=>s.type==="leech").length'),0,'no generators on the field: no Leeches in the wave');
run(`build(SLOTS[0],'generator');`);
assert.equal(get('waveDef(9).filter(s=>s.type==="leech").length'),1,'one free generator: one Leech, however many the wave would send');
run(`build(SLOTS[1],'generator');build(SLOTS[2],'generator');`);
assert.equal(get('waveDef(9).filter(s=>s.type==="leech").length'),Math.min(3,1+Math.floor((9-5)/2)),'the cap never raises the count above the wave schedule');
console.log('PASS wave cap by free generators');

// Presets keep the recorded Leech: 130/46/25, no ooze, straight hunt, targetable from the first tick.
const legacy=boot('?balance=v04'), lg=code=>vm.runInContext(code,legacy);
assert.equal(lg('LEECH_OOZE'),null,'legacy presets have no ooze');
assert.deepEqual([lg('ENEMY.leech.hp'),lg('ENEMY.leech.speed'),lg('ENEMY.leech.bounty')],[130,46,25],'legacy Leech numbers unchanged');
vm.runInContext(`{reset();S.credits=5000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[7],'generator');S.selected=null;
  var leech=makeEnemy('leech',5);S.enemies=[leech];update(SIM_STEP);}`,legacy);
assert.ok(lg('leech.state==="seek"&&!leech.submerged'),'legacy hunt is in the open from the first tick');
console.log('PASS ?balance=v04 keeps the recorded Leech');
