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
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({addColorStop(){}});
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
  assert.ok(rt.calls.images.some(im=>im.src===`${prefix}assets/hunger-voltaic-neutral-v1.png`), 'neutral art resolves in both page contexts');
}
for (const image of [true,false]) {
  const rt=runtime({image});
  assert.doesNotThrow(()=>rt.run('drawNeutralVoltaic(S.towers[0]);weaponMuzzle(S.towers[0]);'), 'missing assets keep the neutral fallback visible');
  assert.ok(rt.calls.arcs.some(([, ,r])=>r===3.5),'fallback keeps the neutral discharge terminal');
}
const loaded=runtime();
loaded.run('voltaicNeutralArt.complete=true;voltaicNeutralArt.naturalWidth=256;lowBuildingArt.complete=true;lowBuildingArt.naturalWidth=1024;level4YawArt.complete=true;level4YawArt.naturalWidth=768;level4YawArt.naturalHeight=512;level4Art.complete=true;level4Art.naturalWidth=level4Art.naturalHeight=2048;');
const neutral=loaded.calls.images.find(im=>im.src.endsWith('hunger-voltaic-neutral-v1.png'));
const low=loaded.calls.images.find(im=>im.src.endsWith('hunger-low-buildings-v3.png'));
let foundation;
for(const [level,branch] of [[1,null],[2,null],[3,null],[4,'A'],[4,'B']]){
  loaded.run(`S.towers[0].level=${level};S.towers[0].branch=${JSON.stringify(branch)};`);
  loaded.calls.drawImages.length=0;
  const sig=loaded.run('replaySignature()');
  loaded.run("S.towers[0].level===4?drawLevel4Tower(S.towers[0]):drawNeutralVoltaic(S.towers[0]);");
  const base=loaded.calls.drawImages.find(a=>a[0]===low);
  assert.ok(base,'every level must draw the square foundation');
  if(!foundation)foundation=base.slice(1);
  assert.deepEqual(base.slice(1),foundation,'the exact source cell, size and position stay unchanged across the branch');
  if(level<4){
    assert.ok(loaded.calls.drawImages.some(a=>a[0]===neutral),'levels 1–3 use the new neutral upper');
    const tip=JSON.parse(loaded.run('JSON.stringify(neutralVoltaicMuzzle())'));
    const actual=JSON.parse(loaded.run('JSON.stringify(weaponMuzzle(S.towers[0]))'));
    const pos=JSON.parse(loaded.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})'));
    assert.equal(actual.x-pos.x,tip.x);assert.ok(Math.abs(actual.y-pos.y-tip.y)<1e-9,'charge and shot origin stay at the new terminal');
  }
  assert.equal(loaded.run('replaySignature()'),sig,'drawing leaves combat unchanged');
}
// This requirement specifically rejects the old cell-4 complete column.
assert.deepEqual(foundation.slice(0,4),[59,137,429,321]);
for(const progress of [0,.3,.65,.94,1])assert.doesNotThrow(()=>loaded.run(`drawNeutralVoltaic(S.towers[0],${progress})`));
console.log('voltaic art: common square foundation at levels 1–4, neutral upper, terminal origin, fallback and draw parity passed');
