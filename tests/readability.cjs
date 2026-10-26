const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(require('node:path').join(__dirname, '../prototype/index.html'), 'utf8');
const calls = Object.create(null);
const ctx = new Proxy({}, {get(target, key) {
  if (key === 'measureText') return value => ({width:String(value).length * 6});
  if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({addColorStop(){}});
  if (key === 'canvas') return canvas;
  if (!(key in target)) target[key] = (...args) => { calls[key] = (calls[key] || 0) + 1; };
  return target[key];
}});
const canvas = {getContext:() => ctx, style:{}, addEventListener(){}, width:960, height:540};
const context = vm.createContext({document:{getElementById:() => canvas, createElement:() => canvas},
  window:{devicePixelRatio:1}, innerWidth:960, innerHeight:540, addEventListener(){}, requestAnimationFrame(){},
  performance:{now:() => 0}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);

function stateSnapshot() {
  return vm.runInContext(`JSON.stringify({phase:S.phase,wave:S.wave,gate:S.gate,credits:S.credits,time:S.time,stolen:S.stolen,
    mutations:S.mutations,enemies:S.enemies.map(e=>({type:e.type,state:e.state,hp:e.hp,x:e.x,y:e.y,dead:e.dead})),
    towers:S.towers.map(t=>({type:t.type,leeched:!!t.leeched,selling:t.selling}))})`, context);
}

// An uninitialized atlas must use the vector body fallback, and the close button must dismiss the card.
vm.runInContext(`reset();S.phase='build';S.buildTimer=12;S.report='MEMORANDUM';S.mutations=['grounding'];`, context);
vm.runInContext('evolutionCardDismissed=true;draw()', context);
calls.ellipse = 0;
vm.runInContext('evolutionCardDismissed=false;draw()', context);
assert.ok(calls.ellipse >= 2, 'the ordinary and mutated card specimens render without the atlas');
const close = vm.runInContext(`buttons.find(b=>b.x===489 && b.y===448)`, context);
assert.ok(close, 'the card exposes a compact close button');
const cardState = stateSnapshot(); close.fn(); vm.runInContext('draw()', context);
assert.equal(vm.runInContext('evolutionCardDismissed', context), true);
assert.equal(stateSnapshot(), cardState, 'drawing and dismissing the card do not alter simulation state');

// Exercise attachment through update() so the generator is genuinely drained, then kill the Leech to test recovery.
vm.runInContext(`reset();S.phase='wave';S.wave=5;S.credits=1000;build(SLOTS[0],'generator');S.selected=null;
const g=S.towers[0],e=makeEnemy('leech',5);e.x=g.x-45;e.y=g.y;S.enemies=[e];`, context);
vm.runInContext('draw()', context);
assert.equal(vm.runInContext('leechDrainVisuals.get(S.towers[0]).changedAt', context), -Infinity,
  'a newly observed healthy generator does not get a false restore pulse');
vm.runInContext(`{let i=0;while(S.enemies[0].state!=='attached'&&i++<300)update(SIM_STEP);}`, context);   // v0.11: the Leech surfaces for BUILD_WARMUP_SECONDS before the crawl to the latch
assert.equal(vm.runInContext('S.enemies[0].state', context), 'attached');
assert.equal(vm.runInContext('S.towers[0].leeched===S.enemies[0] && power().prod===40', context), true,
  'actual attachment drains the generator');
let before = stateSnapshot(); vm.runInContext('draw()', context);
assert.equal(stateSnapshot(), before, 'drain cues observe attachment without changing simulation state');
vm.runInContext('damage(S.enemies[0],1000,null)', context);
assert.equal(vm.runInContext('S.towers[0].leeched===null && power().prod===80', context), true,
  'a dead Leech releases the generator');
before = stateSnapshot(); vm.runInContext('draw()', context);
assert.equal(stateSnapshot(), before, 'the generator recovery pulse does not change simulation state');
assert.equal(vm.runInContext('leechDrainVisuals.get(S.towers[0]).drained===false && leechDrainVisuals.get(S.towers[0]).changedAt===S.time', context), true,
  'the recovery pulse starts on the actual attached-to-healthy transition');

console.log('PASS evolution fallback, dismissal, attached drain and recovery presentation parity');
