const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../prototype/index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function game(search = '?infantry=1') {
  const canvas = {getContext: () => ({}), style: {}, addEventListener() {}};
  const context = vm.createContext({document:{getElementById:()=>canvas}, window:{devicePixelRatio:1}, location:{search,pathname:'/'},
    URLSearchParams, innerWidth:960, innerHeight:540, addEventListener(){}, requestAnimationFrame(){}, performance:{now:()=>0}, assert});
  vm.runInContext(source + `\nglobalThis.__bridge = {get S(){return S}, set S(v){S=v}, reset, build, power, update, endWave, togglePause, sell, makeEnemy, posAt, startWave, fireArc, tstats,
    SLOTS, INFANTRY, INFANTRY_TRIAL, SIM_STEP, WARMUP, WAVES, GATE_D, EVOLUTION_WAVES};`, context);
  return context.__bridge;
}
function test(name, run) {
  try { run(); console.log('PASS', name); }
  catch (error) { console.error('FAIL', name, error.stack || error); process.exitCode = 1; }
}
function placeSingleSoldier(g, tower, d, hp = 60) {           // a deployed garrison with one soldier already on the lane
  tower.warm = 0;
  for (const soldier of tower.soldiers) soldier.alive = false;
  const soldier = tower.soldiers[0];
  soldier.alive = true; soldier.hp = hp; soldier.d = d; soldier.x = g.posAt(d).x; soldier.y = g.posAt(d).y - 8;
  soldier.arrived = true; soldier.cd = 0; soldier.retalCd = 0; soldier.target = null;
  return soldier;
}

test('trial flag keeps the normal four-item build and rejects Barracks outside trial', () => {
  const g = game('?infantry=0');
  g.reset(); const credits = g.S.credits; g.build(g.SLOTS[0], 'barracks');
  assert.equal(g.S.towers.length, 0); assert.equal(g.S.credits, credits);
  assert.equal(g.INFANTRY_TRIAL, false);
});

test('Barracks spends credits, draws power and creates its roster through the real build action', () => {
  const g = game(); g.reset(); const before=g.S.credits; g.build(g.SLOTS[0], 'barracks');
  assert.equal(g.S.credits, before-g.INFANTRY.cost); assert.equal(g.S.towers[0].type, 'barracks');
  assert.equal(g.power().cons, g.INFANTRY.power); assert.equal(g.S.towers[0].soldiers.length, g.INFANTRY.soldiers);
  assert.equal(g.S.towers[0].level, 1);
});

test('soldiers march from the Barracks to the nearest lane segment before taking contact', () => {
  const g = game(); g.reset(); g.build(g.SLOTS[0], 'barracks');
  const t = g.S.towers[0], start = {x:t.soldiers[0].x,y:t.soldiers[0].y};
  g.S.phase = 'build'; g.S.buildTimer=999;
  for (let i=0;i<300;i++) g.update(g.SIM_STEP);
  assert.ok(t.soldiers.every(s=>s.arrived));
  assert.ok(Math.hypot(t.soldiers[0].x-start.x,t.soldiers[0].y-start.y)>20);
  assert.ok(Math.abs(t.soldiers[0].y-g.posAt(t.soldiers[0].d).y)<9);
});

test('crossing contact stops an enemy, applies melee damage and timed retaliation, and awards a kill once', () => {
  const g = game(); g.reset(); g.build(g.SLOTS[0], 'barracks');
  const t=g.S.towers[0], soldier=placeSingleSoldier(g,t,180), e=g.makeEnemy('forager',1);
  e.d=179.5; Object.assign(e,g.posAt(e.d)); g.S.enemies=[e]; g.S.phase='wave'; g.S.spawnQueue=[];
  const initialCredits=g.S.credits;
  g.update(g.SIM_STEP); const healthAfterContact=soldier.hp;
  for(let i=0;i<240 && !e.dead;i++) g.update(g.SIM_STEP);
  assert.equal(e.dead,true); assert.equal(g.S.kills,1); assert.equal(g.S.credits,initialCredits+e.T.bounty);
  assert.equal(g.S.meleeDamage,e.maxHp); assert.ok(healthAfterContact<soldier.maxHp, 'retaliation should reduce soldier health'); assert.ok(g.S.infantryBlockedSeconds>0);
  g.update(g.SIM_STEP); assert.equal(g.S.kills,1);
});

test('three soldiers hold at most three enemies while a fourth passes', () => {
  const g=game(); g.reset(); g.build(g.SLOTS[0],'barracks'); const t=g.S.towers[0]; t.warm=0;   // deployed, soldiers posted by hand
  const ds=[170,188,206]; t.soldiers.forEach((s,i)=>{s.d=ds[i];s.arrived=true;s.x=g.posAt(ds[i]).x;s.y=g.posAt(ds[i]).y-8;});
  const enemies=ds.map(d=>{const e=g.makeEnemy('carapacid',1);e.d=d-0.5;Object.assign(e,g.posAt(e.d));return e;});
  const extra=g.makeEnemy('carapacid',1);extra.d=ds[2]-0.5;Object.assign(extra,g.posAt(extra.d));
  g.S.enemies=[...enemies,extra];g.S.phase='wave';g.S.spawnQueue=[];
  g.update(g.SIM_STEP);
  assert.equal(t.soldiers.filter(s=>s.target).length,3);
  assert.equal(enemies.filter(e=>e.blockedBy).length,3);
  assert.equal(extra.blockedBy||null,null);
});

test('a killed soldier releases its Carapacid and the enemy resumes forward movement', () => {
  const g=game();g.reset();g.S.credits=1000;g.build(g.SLOTS[0],'barracks');g.build(g.SLOTS[1],'cannon');const t=g.S.towers[0],cannon=g.S.towers[1];
  const soldier=placeSingleSoldier(g,t,180,60),e=g.makeEnemy('carapacid',1);e.d=180;Object.assign(e,g.posAt(e.d));
  soldier.target=e;e.blockedBy=soldier;e.effSpeed=0;g.S.enemies=[e];g.S.phase='wave';g.S.spawnQueue=[];
  cannon.cd = 1000;
  for(let i=0;i<125 && soldier.alive;i++)g.update(g.SIM_STEP);
  assert.equal(soldier.alive,false);assert.equal(g.S.infantryCasualties,1);assert.equal(e.blockedBy,null);
  assert.equal(g.S.meleeDamage,16, 'the soldier who dies to retaliation cannot strike again that tick');
  assert.equal(e.effSpeed,e.T.speed, 'the release restores lane speed before the tower phase');
  g.fireArc(cannon,g.tstats(cannon),e);
  const lead=g.posAt(e.d+e.T.speed*0.65);
  assert.ok(g.S.shells.some(sh=>Math.abs(sh.tx-lead.x)<1e-9 && Math.abs(sh.ty-lead.y)<1e-9), 'Cannon leads the released enemy at resumed speed: ' + JSON.stringify({d:e.d,shells:g.S.shells.map(sh=>[sh.tx,sh.ty]),lead}));
  const stopped=e.d;g.update(g.SIM_STEP);assert.ok(e.d>stopped);
});

test('Barracks warmup suppresses marching, capture, blocking and attacks after resume', () => {
  const g=game();g.reset();g.build(g.SLOTS[0],'barracks');const t=g.S.towers[0],s=placeSingleSoldier(g,t,180);
  t.paused=true;g.togglePause(t);const e=g.makeEnemy('forager',1);e.d=179.5;Object.assign(e,g.posAt(e.d));
  g.S.enemies=[e];g.S.phase='wave';g.S.spawnQueue=[];g.update(g.SIM_STEP);
  assert.ok(t.warm>0);assert.equal(e.blockedBy,null);assert.equal(s.target,null);assert.equal(g.S.meleeDamage,0);
  assert.ok(e.d>180, 'enemy passes the rally point while the Barracks is warming up');
});

test('an enemy already past a rally point is never rewound into contact', () => {
  const g=game();g.reset();g.build(g.SLOTS[0],'barracks');const t=g.S.towers[0];placeSingleSoldier(g,t,180);
  const e=g.makeEnemy('carapacid',1);e.d=180.5;Object.assign(e,g.posAt(e.d));g.S.enemies=[e];g.S.phase='wave';g.S.spawnQueue=[];
  g.update(g.SIM_STEP);assert.equal(e.blockedBy,null);assert.ok(e.d>180.5);
});

test('pause and sale release contact immediately; resume uses warmup and keeps surviving health', () => {
  const g=game();g.reset();g.build(g.SLOTS[0],'barracks');const t=g.S.towers[0],s=placeSingleSoldier(g,t,170,42);
  const e=g.makeEnemy('forager',1);s.target=e;e.blockedBy=s;
  g.togglePause(t);assert.equal(e.blockedBy,null);assert.equal(s.target,null);assert.equal(s.hp,42);
  g.togglePause(t);assert.equal(t.paused,false);assert.equal(t.warm,g.WARMUP);
  s.target=e;e.blockedBy=s;g.sell(t);assert.equal(e.blockedBy,null);assert.equal(s.alive,false);
});

test('contacts clear on reset and casualties return only at an interwave transition', () => {
  const g=game();g.reset();g.build(g.SLOTS[0],'barracks');let t=g.S.towers[0],s=placeSingleSoldier(g,t,170,14);
  const e=g.makeEnemy('forager',1);s.target=e;e.blockedBy=s;g.reset();assert.equal(e.blockedBy,null);assert.equal(s.target,null);
  g.build(g.SLOTS[0],'barracks');t=g.S.towers[0];t.soldiers[0].alive=false;t.soldiers[0].hp=0;
  g.S.wave=1;g.S.phase='wave';g.endWave();assert.equal(t.soldiers[0].alive,true);assert.equal(t.soldiers[0].hp,60);
  assert.equal(t.soldiers[0].arrived,false);assert.equal(t.soldiers[0].x,t.x);assert.equal(t.soldiers[0].y,t.y);
  t.soldiers[0].alive=false;t.soldiers[0].hp=0;g.S.wave=g.WAVES;g.endWave();assert.equal(t.soldiers[0].alive,false);
});

test('a Leech releases lane contact as soon as it starts seeking a Generator', () => {
  const g=game();g.reset();g.build(g.SLOTS[0],'barracks');g.build(g.SLOTS[1],'generator');const t=g.S.towers[0];
  const s=placeSingleSoldier(g,t,180),e=g.makeEnemy('leech',5);e.d=180;Object.assign(e,g.posAt(e.d));s.target=e;e.blockedBy=s;
  g.S.enemies=[e];g.S.wave=5;g.S.phase='wave';g.S.spawnQueue=[];g.update(g.SIM_STEP);
  assert.equal(e.state,'seek');assert.equal(e.blockedBy,null);assert.equal(s.target,null);
});

test('melee-only damage at a scheduled evolution does not create a weapon mutation or false cause', () => {
  const g=game();g.reset();g.S.wave=g.EVOLUTION_WAVES[0];g.S.meleeDamage=100;g.endWave();
  assert.equal(g.S.mutations.length,0);assert.ok(!g.S.report.includes('dominance'));
});

test('Cannon lead sees a blocked Carapacid as stopped and its released speed returns', () => {
  const g=game();g.reset();g.build(g.SLOTS[0],'cannon');const t=g.S.towers[0];
  const e=g.makeEnemy('carapacid',1),s={target:e};e.blockedBy=s;e.d=400;e.effSpeed=0;Object.assign(e,g.posAt(e.d));
  g.fireArc(t,g.tstats(t),e); assert.equal(g.S.shells.at(-1).tx,g.posAt(e.d).x); assert.equal(g.S.shells.at(-1).ty,g.posAt(e.d).y);
  e.blockedBy=null;e.effSpeed=e.T.speed;g.fireArc(t,g.tstats(t),e);
  assert.equal(g.S.shells.at(-1).tx,g.posAt(e.d+e.T.speed*0.65).x); assert.equal(g.S.shells.at(-1).ty,g.posAt(e.d+e.T.speed*0.65).y);
});

test('infantry combat matches across 20, 60 and 144 Hz at both game speeds', () => {
  const g=game();
  function run(hz,speed) {
    g.reset();g.build(g.SLOTS[0],'barracks');g.S.wave=1;g.startWave();g.S.spawnQueue=[];g.S.speed=speed;
    const t=g.S.towers[0],s=placeSingleSoldier(g,t,180),e=g.makeEnemy('forager',1);e.d=179.5;Object.assign(e,g.posAt(e.d));g.S.enemies=[e];
    const frame=1/hz,total=4/speed;for(let elapsed=0;elapsed<total-1e-9;elapsed+=frame)g.update(Math.min(frame,total-elapsed)*speed);
    return {hp:e.hp,dead:e.dead,kills:g.S.kills,soldierHp:s.hp,melee:g.S.meleeDamage,time:g.S.time};
  }
  const expected=run(60,1);
  for(const speed of [1,2])for(const hz of [20,60,144])assert.deepEqual(run(hz,speed),run(60,1),`${hz} Hz at speed ${speed}`);
  assert.equal(expected.dead,true);
});

test('casualties do not respawn midwave and remain dead after the final victory', () => {
  const g=game();g.reset();g.build(g.SLOTS[0],'barracks');const t=g.S.towers[0],s=placeSingleSoldier(g,t,180,1);
  const e=g.makeEnemy('carapacid',1);e.d=180;Object.assign(e,g.posAt(e.d));s.target=e;e.blockedBy=s;
  g.S.enemies=[e];g.S.phase='wave';g.S.wave=1;g.S.spawnQueue=[];g.update(g.SIM_STEP);
  assert.equal(s.alive,false);
  for(let i=0;i<120;i++)g.update(g.SIM_STEP);
  assert.equal(s.alive,false, 'the living wave cannot replace a casualty');
  g.S.enemies=[];g.S.wave=g.WAVES-1;g.endWave();assert.equal(s.alive,true, 'replacement is allowed between nonfinal waves');
  s.alive=false;s.hp=0;g.S.wave=g.WAVES;g.endWave();
  assert.equal(g.S.phase,'over');assert.equal(s.alive,false);
  for(let i=0;i<60;i++)g.update(g.SIM_STEP);
  assert.equal(s.alive,false, 'final victory cannot respawn the roster');
});
