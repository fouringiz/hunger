// Calibrates Sprinter Reflex without changing the playable mission.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const prototypePath = path.join(__dirname, '../prototype/index.html');
const original = fs.readFileSync(prototypePath, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

function load(dashMultiplier) {
  const canvas = {getContext: () => ({}), style: {}, addEventListener() {}};
  const context = vm.createContext({
    document: {getElementById: () => canvas},
    window: {devicePixelRatio: 1}, innerWidth: 960, innerHeight: 540,
    addEventListener() {}, requestAnimationFrame() {}, performance: {now: () => 0},
  });
  if (!/const SPRINTER_DASH_MULT = 1\.7;/.test(original)) throw new Error('Sprinter Reflex multiplier not found in prototype source.');
  const source = original.replace(/const SPRINTER_DASH_MULT = 1\.7;/, `const SPRINTER_DASH_MULT = ${dashMultiplier};`);
  vm.runInContext(source, context);
  return context;
}

function evaluateShot(dashMultiplier, type) {
  const c = load(dashMultiplier);
  return vm.runInContext(`
    reset(); build(SLOTS[2], 'cannon');
    const cannon = S.towers[0], target = makeEnemy(${JSON.stringify(type)}, 5);
    S.mutations = ['sprinter']; target.muts = ['sprinter'];
    target.d = 480; Object.assign(target, posAt(target.d));
    S.enemies = [target]; S.phase = 'wave'; S.wave = 5;
    const hp = target.hp; fireArc(cannon, tstats(cannon), target); const shell = S.shells[0];
    cannon.paused = true;
    for (let i = 0; i < 40; i++) update(1/60);
    ({damage: hp-target.hp, offset: Math.hypot(target.x-shell.tx, target.y-shell.ty), hitRadius: shell.splash + target.r*0.5});
  `, c);
}

function controlWave(dashMultiplier, turretSlot = null) {
  if (turretSlot === 2) throw new Error('Slot 2 already contains the Cannon.');
  const c = load(dashMultiplier);
  return vm.runInContext(`
    reset(); build(SLOTS[2], 'cannon');
    if (${turretSlot === null ? 'false' : 'true'}) build(SLOTS[${turretSlot ?? 0}], 'turret');
    S.credits = 0; S.phase = 'wave'; S.wave = 5; S.mutations = ['sprinter'];
    const gap = 66;
    for (let i = 0; i < 14; i++) {
      const enemy = makeEnemy('forager', 5); enemy.muts = ['sprinter']; enemy.d = 140 + i*gap;
      Object.assign(enemy, posAt(enemy.d)); S.enemies.push(enemy);
    }
    let steps = 0;
    while (S.phase === 'wave' && steps < 6000) { update(1/60); steps++; }
    ({gate: S.gate, leaked: S.waveLeaked, kills: S.kills, seconds: +(steps/60).toFixed(1), completed: S.phase !== 'wave'});
  `, c);
}

const multipliers = [1.7, 2.0, 2.2, 2.4, 2.5, 2.6, 2.8, 3.0];
const impacts = multipliers.flatMap(multiplier => ['forager', 'carapacid', 'leech'].map(type => ({
  multiplier, type, ...evaluateShot(multiplier, type),
})));
const controls = multipliers.map(multiplier => ({
  multiplier,
  cannonOnly: controlWave(multiplier),
  turretSlots: Array.from({length: 16}, (_, slot) => slot).filter(slot => slot !== 2)
    .map(slot => ({slot, ...controlWave(multiplier, slot)})),
}));
const results = {multipliers, impacts, controls};
fs.mkdirSync(path.join(__dirname, '../reports/generated'), {recursive: true});
fs.writeFileSync(path.join(__dirname, '../reports/generated/sprinter-sweep-results.json'), JSON.stringify(results, null, 2) + '\n');
for (const row of controls) {
  const best = [...row.turretSlots].sort((a, b) => a.leaked - b.leaked || b.kills - a.kills)[0];
  console.log(JSON.stringify({multiplier: row.multiplier, cannonOnly: row.cannonOnly, bestTurret: best}));
}
