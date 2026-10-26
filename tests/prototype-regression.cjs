const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../prototype/index.html'), 'utf8');
const canvas = {getContext: () => ({}), style: {}, addEventListener() {}};
const context = vm.createContext({document: {getElementById: () => canvas}, window: {devicePixelRatio: 1}, innerWidth: 960, innerHeight: 540, addEventListener() {}, requestAnimationFrame() {}, performance: {now: () => 0}, assert});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const cases = {
  'Sprinter Reflex uses the approved 1.7× campaign multiplier': `
    assert.equal(SPRINTER_DASH_MULT, 1.7);
    reset(); build(SLOTS[0], 'cannon'); const t = S.towers[0];
    S.mutations = ['sprinter'];
    const e = makeEnemy('forager', 5); e.d = 300; Object.assign(e, posAt(300));
    S.enemies = [e]; S.phase = 'wave'; S.wave = 5;
    fireArc(t, tstats(t), e); t.paused = true;
    assert.ok(e.dash > 0); update(SIM_STEP);
    assert.ok(Math.abs(e.effSpeed - e.T.speed * SPRINTER_DASH_MULT) < 1e-6);
  `,
  'leech hunts across the map and retargets after a sale without teleporting': `
    reset(); S.credits = 1000; build(SLOTS[15], 'generator'); build(SLOTS[13], 'generator');
    S.phase = 'wave'; S.wave = 5;
    const e = makeEnemy('leech', 5); S.enemies = [e];
    const nearest = S.towers.reduce((a,b) => Math.hypot(a.x-e.x,a.y-e.y) < Math.hypot(b.x-e.x,b.y-e.y) ? a : b);
    update(0.05); assert.equal(e.gen, nearest); assert.equal(e.state, 'seek');
    assert.ok(e.y > 90); assert.equal(e.d, 0);
    for (let i = 0; i < 100; i++) update(0.05);
    let x = e.x, y = e.y; sell(nearest); update(0.05);
    assert.notEqual(e.gen, nearest); assert.ok(e.gen); assert.ok(Math.hypot(e.x-x,e.y-y) <= e.speed*0.05 + 0.001);
    sell(e.gen); x = e.x; y = e.y; update(0.05);
    assert.equal(e.gen, null); assert.ok(Math.hypot(e.x-x,e.y-y) <= e.speed*0.05 + 0.001);
  `,
  'without generators a leech follows the lane to the gate': `
    reset(); S.phase = 'wave'; S.wave = 5;
    const e = makeEnemy('leech', 5); S.enemies = [e];
    for (let i = 0; i < 2000 && !e.dead; i++) {
      update(0.05); const p = posAt(e.d); assert.equal(e.x,p.x); assert.equal(e.y,p.y);
    }
    assert.ok(e.dead); assert.equal(S.gate, GATE_MAX-e.T.gateDmg);
  `,
  'a sated leech releases power and returns smoothly to the lane': `
    reset(); build(SLOTS[15], 'generator'); S.phase = 'wave'; S.wave = 5;
    const e = makeEnemy('leech',5); S.enemies = [e];
    for (let i=0; i<2000 && !e.sated; i++) update(0.05);
    assert.ok(e.sated); assert.equal(power().prod,80); assert.equal(e.gen,null);
    for (let i=0; i<2000 && !e.dead; i++) {
      const x=e.x,y=e.y; update(0.05);
      assert.ok(Math.hypot(e.x-x,e.y-y) <= e.speed*1.24*0.05+0.001);
    }
    assert.ok(e.dead);
  `,
  'a lone leech can attach to a generator in every build slot': `
    for (let slotIndex = 0; slotIndex < SLOTS.length; slotIndex++) {
      reset(); build(SLOTS[slotIndex], 'generator'); S.phase = 'wave'; S.wave = 5;
      const e = makeEnemy('leech', 5); S.enemies = [e];
      let attached = false;
      for (let i = 0; i < 2000 && !e.dead; i++) {
        update(0.05);
        if (e.state === 'attached') { attached = true; break; }
      }
      assert.ok(attached, 'Leech missed generator in slot ' + slotIndex + ' at ' + SLOTS[slotIndex].x + ',' + SLOTS[slotIndex].y);
    }
  `,
  'artillery leads its target forward along the lane': `
    reset(); build(SLOTS[0], 'cannon');
    const e = makeEnemy('carapacid', 1); e.d = 400;
    Object.assign(e, posAt(e.d));
    fireArc(S.towers[0], tstats(S.towers[0]), e);
    const expected = posAt(e.d + e.effSpeed * 0.65);
    assert.equal(S.shells[0].tx, expected.x); assert.equal(S.shells[0].ty, expected.y);
  `,
  'generator stays powered during approach and recovers after feeding': `
    reset(); build(SLOTS[0], 'generator'); S.phase = 'wave'; S.wave = 1;
    const g = S.towers[0], e = makeEnemy('leech', 1);
    e.d = 140; Object.assign(e, posAt(e.d)); S.enemies.push(e);
    update(SIM_STEP); assert.ok(['seek', 'surfacing'].includes(e.state)); assert.equal(power().prod, 80);   // v0.11: a hunt inside surfaceDist surfaces at once; the generator still runs
    e.x = g.x; e.y = g.y; update(SIM_STEP);
    assert.equal(e.state, 'surfacing'); assert.equal(power().prod, 80);   // v0.11: it surfaces first; the generator still runs
    for (let i = 0; i < Math.ceil(BUILD_WARMUP_SECONDS / SIM_STEP) + 2; i++) update(SIM_STEP);   // warm-up ticks, the seek tick, the attach tick
    assert.equal(e.state, 'attached'); assert.equal(power().prod, 40);
    damage(e, 10000, null); assert.equal(power().prod, 80);
  `,
  'reserved damage excludes priority targets and resumes after a miss': `
    reset(); build(SLOTS[0], 'cannon'); const t = S.towers[0], st = tstats(t);
    const e = makeEnemy('leech', 1); e.state = 'attached'; e.x = t.x + 100; e.y = t.y; e.hp = 20; e.incoming = 45;
    const other = makeEnemy('forager', 1); other.x = t.x + 120; other.y = t.y;
    S.enemies = [e, other]; assert.equal(pickTarget(t, st), other);
    S.enemies = [e]; assert.equal(pickTarget(t, st), null);
    e.incoming = 0; assert.equal(pickTarget(t, st), e);
  `,
  'a shell actually damages the target it was aimed at': `
    reset(); build(SLOTS[0], 'cannon'); const t = S.towers[0];
    const e = makeEnemy('carapacid', 1); e.d = 400;
    Object.assign(e, posAt(e.d)); S.enemies = [e]; S.phase = 'wave'; S.wave = 1;
    fireArc(t, tstats(t), e); t.paused = true;
    const initial = e.hp;
    for (let i = 0; i < 14; i++) update(0.05);
    assert.equal(e.hp, initial - tstats(t).dmg); assert.equal(e.incoming, 0);
  `,
  'a missed shell releases its reservation so firing can resume': `
    reset(); build(SLOTS[0], 'cannon'); const t = S.towers[0], st = tstats(t);
    const e = makeEnemy('carapacid', 1); e.d = 350; e.hp = 20;
    Object.assign(e, posAt(e.d)); S.enemies = [e]; S.phase = 'wave'; S.wave = 1;
    fireArc(t, st, e); t.paused = true;
    S.shells[0].tx = -1000; S.shells[0].ty = -1000;
    assert.equal(pickTarget(t, st), null);
    for (let i = 0; i < 14; i++) update(0.05);
    assert.equal(e.hp, 20); assert.equal(e.incoming, 0); assert.equal(pickTarget(t, st), e);
  `,
  'a scheduled mutation causes a leak that either a purchase or an upgrade can prevent': `
    function playWave(keepMutation, counter) {
      reset();
      build(SLOTS[8], 'turret'); build(SLOTS[9], 'cannon');
      S.wave = 3; startWave();
      for (let i = 0; i < 30000 && S.phase === 'wave'; i++) update(1/60);
      assert.equal(S.phase, 'build', 'wave 4 must finish without losing the Gate');
      assert.equal(S.mutations.length, 1, 'the schedule must grant exactly one mutation after wave 4');
      if (!keepMutation) S.mutations = [];
      if (counter === 'turret') { build(SLOTS[0], 'turret'); assert.ok(SLOTS[0].tower); }
      if (counter === 'upgrade') { upgrade(SLOTS[9].tower); assert.equal(SLOTS[9].tower.level, 2); }
      startWave();
      for (let i = 0; i < 30000 && S.phase === 'wave'; i++) update(1/60);
      assert.equal(S.phase, 'build', 'wave 5 must finish without losing the Gate');
      return {gate:S.gate, leaked:S.waveLeaked};
    }
    const unmutated = playWave(false);
    const unchanged = playWave(true);
    const rebuilt = playWave(true, 'turret');
    const upgraded = playWave(true, 'upgrade');
    assert.ok(unchanged.leaked > unmutated.leaked, 'the mutation should worsen wave 5');
    assert.ok(rebuilt.leaked < unchanged.leaked, 'the countermeasure should reduce leaks');
    assert.ok(rebuilt.gate > unchanged.gate, 'the countermeasure should preserve more Gate HP');
    assert.ok(upgraded.leaked < unchanged.leaked, 'an ordinary upgrade also prevents leaks');
    assert.ok(upgraded.gate > unchanged.gate, 'an ordinary upgrade also preserves Gate HP');
  `,
  'the evolution memorandum names the real cause of a primary mutation': `
    reset(); S.wave = EVOLUTION_WAVES[0] - 1; startWave(); S.dmg = {flat:100, arc:0}; endWave();
    assert.deepEqual(S.mutations, ['keratin']);
    assert.ok(S.report.includes('kinetic fire dominance'), 'kinetic dominance is named as the cause');
    assert.ok(!S.report.includes('artillery'), 'artillery is not mentioned when it never fired');
    reset(); S.wave = EVOLUTION_WAVES[0] - 1; startWave(); S.dmg = {flat:0, arc:100}; endWave();
    assert.deepEqual(S.mutations, ['sprinter']);
    assert.ok(S.report.includes('artillery dominance'), 'artillery dominance is named as the cause');
  `,
  'a replacement mutation is explained as a replacement, never as absent artillery dominance': `
    reset(); S.mutations = ['keratin']; S.wave = EVOLUTION_WAVES[1] - 1; startWave(); S.dmg = {flat:100, arc:0}; endWave();
    assert.deepEqual(S.mutations, ['keratin', 'sprinter'], 'the repeat is replaced by the other counter');
    assert.ok(!S.report.includes('artillery dominance'), 'zero arc damage must never be reported as artillery dominance');
    assert.ok(S.report.includes('already present'), 'the report explains the replacement');
    assert.ok(S.report.includes('accelerate at shell-whistle'), 'the effect describes the observed reflex, not a promised miss');
  `,
  'voltaic chain strikes up to its hop count with falloff and never the same body twice': `
    reset(); build(SLOTS[2], 'voltaic'); const t = S.towers[0]; const st = tstats(t);
    const bodies = [];
    for (let i = 0; i < 6; i++) { const e = makeEnemy('forager', 1); e.d = 470 + i * 25; Object.assign(e, posAt(e.d)); bodies.push(e); }
    S.enemies = bodies; S.phase = 'wave';
    const struck = fireElectro(t, st, bodies[5]);
    assert.equal(struck.length, st.hops + 1, 'primary plus hops');
    assert.equal(new Set(struck).size, struck.length, 'a body is struck at most once');
    assert.ok(struck[0].hp < struck[1].hp, 'the primary takes full damage, hops take less');
    assert.ok(S.dmg.electro > 0 && S.dmg.flat === 0 && S.dmg.arc === 0, 'voltaic fire lands in its own ledger column');
  `,
  'chain hops respect reserved damage: a doomed neighbour is skipped for a free one': `
    reset(); build(SLOTS[2], 'voltaic'); const t = S.towers[0]; const st = tstats(t);
    const first = makeEnemy('forager', 1), doomed = makeEnemy('forager', 1), free = makeEnemy('forager', 1);
    first.d = 520; doomed.d = 500; free.d = 480;
    [first, doomed, free].forEach(e => Object.assign(e, posAt(e.d)));
    doomed.hp = 5; doomed.incoming = 45;                 // a shell worth 45 is already in flight at it
    S.enemies = [first, doomed, free]; S.phase = 'wave';
    const struck = fireElectro(t, st, first);
    assert.ok(!struck.includes(doomed), 'the chain does not spend a hop on a body already reserved for death');
    assert.ok(struck.includes(free), 'the hop goes to the nearest free body instead');
    assert.equal(doomed.hp, 5, 'the doomed body is untouched by the chain');
  `,
  'a Carapacid in the bolt path intercepts the discharge and the chain continues from it': `
    reset(); build(SLOTS[2], 'voltaic'); const t = S.towers[0]; const st = tstats(t);
    const far = makeEnemy('forager', 1), shield = makeEnemy('carapacid', 1);
    far.x = 350; far.y = 270; far.d = 560; shield.x = 350; shield.y = 236; shield.d = 540;   // shield sits on the line tower→target
    S.enemies = [far, shield]; S.phase = 'wave';
    const struck = fireElectro(t, st, far);
    assert.equal(struck[0], shield, 'the shell body takes the primary hit');
    assert.ok(struck.includes(far), 'the chain continues past the shield');
    assert.ok(S.shots[0].blocked, 'the intercepted bolt is shown as blocked');
  `,
  'a lightning rod ends the chain; rods are every third spawn and every Carapacid of a grounded wave': `
    reset(); S.mutations = ['grounding']; S.wave = 5; startWave(); S.enemies = []; S.spawnQueue = [];
    const spawned = []; for (let i = 0; i < 7; i++) spawned.push(makeEnemy(i === 4 ? 'carapacid' : 'forager', 5));
    assert.deepEqual(spawned.map(e => e.rod), [false, false, true, false, true, true, false], 'rods are deterministic: indices 2 and 5, plus the Carapacid at 4');
    build(SLOTS[2], 'voltaic'); const t = S.towers[0]; const st = tstats(t);
    const a = makeEnemy('forager', 5), rod = makeEnemy('forager', 5), c = makeEnemy('forager', 5); rod.rod = true; a.rod = c.rod = false;
    [a, rod, c].forEach((e, i) => { e.d = 480 + i * 25; Object.assign(e, posAt(e.d)); });
    S.enemies = [a, rod, c]; S.phase = 'wave';
    const struck = fireElectro(t, st, c);              // c first, hop to rod, chain must stop there
    assert.deepEqual(struck, [c, rod], 'the rod takes its hit and no further hop happens');
    assert.ok(rod.hp < rod.maxHp, 'the rod is damaged, not immune');
    assert.ok(S.fx.some(f => f.kind === 'spark'), 'the grounding is shown as a spark');
    reset(); S.mutations = []; S.wave = 5; startWave(); S.enemies = []; S.spawnQueue = [];
    assert.ok(!makeEnemy('carapacid', 5).rod, 'without Grounding nobody is a rod');
  `,
  'voltaic dominance earns Grounding and the dominant line gets its next unused counter before any replacement': `
    const scheduled = EVOLUTION_WAVES[0] - 1;
    reset(); S.wave = scheduled; startWave(); S.dmg = {flat:10, arc:10, electro:100}; endWave();
    assert.deepEqual(S.mutations, ['grounding']); assert.ok(S.report.includes('voltaic dominance'));
    reset(); S.mutations = ['sprinter']; S.wave = EVOLUTION_WAVES[1] - 1; startWave(); S.dmg = {flat:0, arc:100, electro:0}; endWave();
    assert.deepEqual(S.mutations, ['sprinter', 'dispersal'], 'artillery dominance stacks its second counter');
    assert.ok(!S.report.includes('already present'), 'a second counter against the same line is not a replacement');
    reset(); S.mutations = ['keratin']; S.wave = EVOLUTION_WAVES[1] - 1; startWave(); S.dmg = {flat:100, arc:5, electro:50}; endWave();
    assert.deepEqual(S.mutations, ['keratin', 'grounding'], 'with kinetic exhausted, the fallback follows the ledger: voltaic before artillery');
    assert.ok(S.report.includes('already present'), 'and it is reported as a replacement');
  `,
  'Dispersal stretches the spawn intervals of a mutated wave and leaves speed and composition unchanged (experimental)': `
    reset(); S.wave = 4; startWave(); const plain = S.spawnQueue.map(s => s.delay); const plainTypes = S.spawnQueue.map(s => s.type);
    reset(); S.mutations = ['dispersal']; S.wave = 4; startWave();
    assert.deepEqual(S.spawnQueue.map(s => s.type), plainTypes, 'composition is unchanged');
    S.spawnQueue.forEach((s, i) => assert.ok(Math.abs(s.delay - plain[i] * DISPERSAL_SPACING) < 1e-9), 'every interval is stretched by the spacing factor');
    const e = makeEnemy('forager', 5); assert.equal(e.speed, ENEMY.forager.speed, 'speed is untouched');
  `,
  'the swarm evolves only on the scheduled waves, and the schedule stays inside the campaign': `
    assert.ok(EVOLUTION_WAVES.length > 0);
    assert.ok(EVOLUTION_WAVES.every(w => w < WAVES), 'a scheduled wave after the last one could never fire');
    for (let wave = 1; wave < EVOLUTION_WAVES[0]; wave++) {
      reset(); S.wave = wave - 1; startWave(); S.dmg = {flat:100, arc:0}; endWave();
      assert.equal(S.mutations.length, 0, 'wave ' + wave + ' is not a scheduled wave');
      assert.ok(S.report.startsWith('DISPATCH'), 'an ordinary wave reports a dispatch');
    }
    reset(); S.wave = EVOLUTION_WAVES[0] - 1; startWave(); S.dmg = {flat:100, arc:0}; endWave();
    assert.equal(S.mutations.length, 1);
    assert.ok(S.report.startsWith('MEMORANDUM'), 'a scheduled wave reports a Marsh memorandum');
  `,
  'wave composition does not depend on the evolution schedule': `
    const before = EVOLUTION_WAVES.map(w => previewText(w));
    const composition = ESCORT_WAVES.map(w => JSON.stringify(waveDef(w).map(e => e.type)));
    const saved = [...EVOLUTION_WAVES];
    try {
      EVOLUTION_WAVES.length = 0;
      assert.deepEqual(ESCORT_WAVES.map(w => JSON.stringify(waveDef(w).map(e => e.type))), composition,
        'a silenced schedule must still play the same waves, or paired controls are not paired');
    } finally { EVOLUTION_WAVES.splice(0, EVOLUTION_WAVES.length, ...saved); }
    assert.deepEqual(EVOLUTION_WAVES.map(w => previewText(w)), before);
  `,
  'the schedule honours the stack cap and never grants the same counter twice': `
    reset();
    for (const wave of EVOLUTION_WAVES) { S.wave = wave - 1; startWave(); S.dmg = {flat:100, arc:0}; endWave(); }
    assert.equal(S.mutations.length, Math.min(EVOLUTION_WAVES.length, MUT_STACK_CAP));
    assert.equal(new Set(S.mutations).size, S.mutations.length, 'a repeated counter must be replaced');
  `,
  'the damage ledger picks the counter and restarts at every mutation': `
    const scheduled = EVOLUTION_WAVES[0] - 1;
    reset(); S.wave = scheduled; startWave(); S.dmg = {flat:100, arc:1}; endWave();
    assert.deepEqual(S.mutations, ['keratin']); assert.deepEqual(S.dmg, {flat:0, arc:0, electro:0});
    reset(); S.wave = scheduled; startWave(); S.dmg = {flat:1, arc:100}; endWave();
    assert.deepEqual(S.mutations, ['sprinter']);
    reset(); S.wave = scheduled; startWave(); S.dmg = {flat:0, arc:0}; endWave();
    assert.deepEqual(S.mutations, ['keratin'], 'a tie answers kinetic fire');
  `,
  'the ledger reads fire before resistances and ignores overkill': `
    reset(); build(SLOTS[0], 'turret'); const t = S.towers[0];
    const bare = makeEnemy('carapacid', 1), plated = makeEnemy('carapacid', 1);
    plated.muts = ['keratin']; S.enemies = [bare, plated];
    damage(bare, 100, t); const ledger = S.dmg.flat, bareHp = bare.hp;
    S.dmg = {flat:0, arc:0};
    damage(plated, 100, t);
    assert.ok(plated.hp > bareHp, 'keratinized plating must reduce the damage taken');
    assert.equal(S.dmg.flat, ledger, 'plating must not hide kinetic fire from the ledger');
    S.dmg = {flat:0, arc:0};
    const dying = makeEnemy('forager', 1); dying.hp = 5; S.enemies.push(dying);
    damage(dying, 100, t);
    assert.equal(S.dmg.flat, 5, 'overkill is not evolution pressure');
  `,
  'a mutation reaches the next wave, not the one that earned it': `
    reset(); S.wave = EVOLUTION_WAVES[0] - 1; startWave();
    assert.deepEqual(makeEnemy('forager', S.wave).muts, []);
    S.dmg = {flat:100, arc:0}; endWave();
    assert.equal(S.mutations.length, 1);
    startWave(); assert.deepEqual(makeEnemy('forager', S.wave).muts, S.mutations);
  `,
  'a lost Gate ends the run before the swarm can evolve': `
    reset(); S.wave = EVOLUTION_WAVES[0] - 1; startWave();
    S.dmg = {flat:100, arc:0}; S.gate = 1; S.spawnQueue = [];
    const e = makeEnemy('forager', S.wave); e.d = GATE_D; S.enemies = [e];
    update(SIM_STEP);
    assert.equal(S.phase, 'over'); assert.equal(S.win, false);
    assert.equal(S.mutations.length, 0, 'a lost run grants the swarm nothing');
  `,
  'a shell fired at the last body of a wave still lands after that body leaked': `
    reset(); S.credits = 900; build(SLOTS[5], 'cannon'); S.wave = 1; startWave(); S.spawnQueue.length = 0;
    const e = makeEnemy('forager', 1); e.wave = 1; e.d = GATE_D - 60; Object.assign(e, posAt(e.d)); S.enemies = [e];
    const t = S.towers[0]; fireArc(t, tstats(t), e); assert.equal(S.shells.length, 1, 'a shell is in flight');
    e.d = GATE_D + 1; Object.assign(e, posAt(GATE_D)); stepSimulation(SIM_STEP);        // the body reaches the Gate first
    assert.ok(S.phase !== 'wave', 'the field is clear and the game is in its pause');
    assert.equal(S.shells.length, 1, 'the shell is still flying when the pause starts');
    for (let i = 0; i < 120; i++) stepSimulation(SIM_STEP);
    assert.equal(S.shells.length, 0, 'it lands during the pause instead of hanging until the next wave');
  `,
  'an occupied or demolishing slot cannot host a second tower': `
    reset(); build(SLOTS[2], 'cannon');
    const original = SLOTS[2].tower, credits = S.credits;
    build(SLOTS[2], 'turret');
    assert.equal(S.towers.length, 1); assert.equal(SLOTS[2].tower, original); assert.equal(S.credits, credits);
    sell(original); build(SLOTS[2], 'turret');
    assert.equal(S.towers.length, 1); assert.equal(S.credits, credits);
    update(SELL_TIME + SIM_STEP); build(SLOTS[2], 'turret');
    assert.equal(S.towers.length, 1); assert.equal(SLOTS[2].tower.type, 'turret');
  `,
  'fractional frame time is accumulated and reset with a new game': `
    reset(); update(SIM_STEP / 2); assert.equal(S.time, 0);
    update(SIM_STEP / 2); assert.equal(S.time, SIM_STEP);
    update(SIM_STEP / 2); reset(); update(SIM_STEP / 2);
    assert.equal(S.time, 0); update(SIM_STEP / 2); assert.equal(S.time, SIM_STEP);
  `,
  'real frame updates give identical combat at different refresh rates and game speeds': `
    const render = draw; draw = () => {};
    function runFrames(frameDurations, speed) {
      reset(); build(SLOTS[8], 'turret'); build(SLOTS[9], 'cannon');
      S.wave = 3; startWave(); S.speed = speed; last = 0;
      let wallTime = 0, i = 0;
      const duration = 120 / speed;
      while (wallTime < duration - 1e-9) {
        wallTime = Math.min(duration, wallTime + frameDurations[i++ % frameDurations.length]);
        frame(wallTime * 1000);
      }
      return {gate:S.gate, wave:S.wave, phase:S.phase, kills:S.kills, credits:S.credits,
        time:S.time, mutations:[...S.mutations], report:S.report,
        enemies:S.enemies.map(e=>({type:e.type,hp:e.hp,d:e.d,x:e.x,y:e.y,dash:e.dash})),
        towers:S.towers.map(t=>({type:t.type,kills:t.kills,cd:t.cd})),
        shells:S.shells.map(sh=>({t:sh.t,tx:sh.tx,ty:sh.ty})), queue:S.spawnQueue.length};
    }
    try {
      const reference = runFrames([1/60], 1);
      for (const speed of [1,2]) for (const durations of [[1/20],[1/30],[1/60],[1/90],[1/120],[1/144],[1/120,1/30,0.08]]) {
        assert.deepEqual(runFrames(durations, speed), reference, 'refresh pattern ' + durations + ', speed ' + speed);
      }
    } finally { draw = render; }
  `,
};
let failed = 0;
for (const [name, source] of Object.entries(cases)) {
  try { vm.runInContext(`{${source}}`, context); console.log('PASS', name); }
  catch (error) { failed++; console.error('FAIL', name, error.message); }
}
process.exitCode = failed ? 1 : 0;
console.log(Object.keys(cases).length + ' scenarios, ' + failed + ' failures');
