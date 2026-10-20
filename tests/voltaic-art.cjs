const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '../prototype/index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function runtime({image = true, pathname = '/prototype/'} = {}) {
  const calls = {images: [], drawImages: [], arcs: []};
  class ImageMock {
    constructor() { this.complete = false; this.naturalWidth = 0; calls.images.push(this); }
  }
  const canvas = {width:960,height:540,style:{},getContext:() => ctx,
    addEventListener(){},getBoundingClientRect:() => ({left:0,top:0})};
  const ctx = new Proxy({}, {get(target, key) {
    if (key === 'canvas') return canvas;
    if (key === 'createLinearGradient') return () => ({addColorStop(){}});
    if (key === 'measureText') return value => ({width:String(value).length * 6});
    if (key === 'drawImage') return (...args) => calls.drawImages.push(args);
    if (key === 'arc') return (...args) => calls.arcs.push(args);
    if (!(key in target)) target[key] = () => {};
    return target[key];
  }});
  canvas.getContext = () => ctx;
  const document = {hidden:false,getElementById:() => canvas,createElement:() => canvas,addEventListener(){}};
  const context = vm.createContext({document,window:{devicePixelRatio:1},innerWidth:960,innerHeight:540,
    location:{pathname,search:''},URLSearchParams,Image:image?ImageMock:undefined,addEventListener(){},requestAnimationFrame(){},performance:{now:() => 0}});
  vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  run("reset(); S.credits=1000; build(SLOTS[0], 'voltaic'); S.towers[0].angle=0.7;");
  return {calls,run};
}

for (const [pathname, prefix] of [['/prototype/','../'],['/reports/generated/case/','../../']]) {
  const rt = runtime({pathname});
  assert.equal(rt.calls.images[1].src, `${prefix}assets/hunger-voltaic-v1.png`, 'Voltaic art uses the local asset path in both page contexts');
}

for (const state of ['loading','failed']) {
  const rt = runtime();
  if (state === 'failed') rt.run('voltaicArt.complete=true; voltaicArt.naturalWidth=0');
  assert.doesNotThrow(() => rt.run('draw()'), `${state} sprite state falls back without throwing`);
  assert.ok(rt.calls.arcs.some(([x,y,r]) => x===0 && y===0 && r===13), 'vector coil fallback remains visible');
}

const noImage = runtime({image:false});
assert.doesNotThrow(() => noImage.run('draw()'), 'headless runtime keeps the vector fallback');
assert.ok(noImage.calls.arcs.some(([x,y,r]) => x===0 && y===0 && r===13));

const loaded = runtime();
loaded.run('voltaicArt.complete=true; voltaicArt.naturalWidth=1254');
const beforeDraw = loaded.run('JSON.stringify({phase:S.phase,wave:S.wave,gate:S.gate,credits:S.credits,time:S.time,towers:S.towers.map(t=>[t.type,t.x,t.y,t.angle,t.level,t.cd])})');
loaded.run('draw()');
assert.ok(loaded.calls.drawImages.some(args => args[0] === loaded.calls.images[1] && args[1] === -34 && args[2] === -25.5 && args[3] === 68 && args[4] === 68), 'loaded sprite draws at 68px with its discharge tip over the tower center');
assert.ok(loaded.calls.arcs.some(([x,y,r]) => x===0 && y===0 && r===4), 'dynamic charge dot remains over the sprite');
assert.equal(loaded.run('JSON.stringify({phase:S.phase,wave:S.wave,gate:S.gate,credits:S.credits,time:S.time,towers:S.towers.map(t=>[t.type,t.x,t.y,t.angle,t.level,t.cd])})'), beforeDraw, 'draw does not change the game state');
console.log('voltaic art: paths, fallbacks, sprite sizing, charge cue, and draw parity passed');
