const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(){const calls=[],images=[],handlers={};class Image{constructor(){this.complete=true;this.naturalWidth=768;images.push(this);}}const ctx=new Proxy({}, {get(o,k){if(k==='drawImage')return (...args)=>calls.push([k,...args]);if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});if(k==='measureText')return t=>({width:String(t).length*5});return o[k]??(o[k]=(...args)=>calls.push([k,...args]));}});const canvas={getContext:()=>ctx,style:{},addEventListener(type,fn){handlers[type]=fn;},getBoundingClientRect:()=>({left:0,top:0})};const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:'?infantry=1'},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});vm.runInContext(source,c);return {run:x=>vm.runInContext(x,c),calls,images,handlers};}
const cue=boot();cue.run("reset();S.credits=1000;build(SLOTS[0],'generator');const e=makeEnemy('leech',5);e.gen=S.towers[0];");
for(const state of ['lane','seek','return']){cue.calls.length=0;cue.run(`e.state='${state}';drawLeechCue(e);`);assert.equal(cue.calls.length,0,'a moving Leech must not draw a tendril');}
cue.calls.length=0;cue.run("e.state='attached';drawLeechCue(e)");assert.ok(cue.calls.some(c=>c[0]==='lineTo'),'a real feeding connection remains visible');
console.log('PASS Leech cues only while feeding');
for(const type of ['turret','cannon','voltaic','generator','barracks']){
 const r=boot();r.run(`reset();S.phase='build';S.credits=10000;build(SLOTS[0],'${type}');observeConstruction();presentationTime=2;observeConstruction();S.towers[0].angle=.7;sell(S.towers[0]);observeConstruction();`);
 const saved=r.run('replaySignature()');r.run('drawTowerBody(S.towers[0]);');assert.equal(r.run('replaySignature()'),saved,'sale rendering cannot refund or remove a tower');
 const phases=[];for(const remaining of [1.8,1.2,.6,.05]){r.calls.length=0;r.run(`S.towers[0].sellT=${remaining};drawTowerBody(S.towers[0]);`);phases.push(JSON.stringify(r.calls.filter(c=>c[0]==='drawImage').map(c=>c.slice(2))));}
 assert.equal(new Set(phases).size,4,type+' visibly retracts during the existing sale countdown');
 r.run('S.towers[0].sellT=SELL_TIME;const beforeCredits=S.credits;update(SELL_TIME-SIM_STEP);');assert.equal(r.run('S.towers.length'),1,'refund remains delayed until the removal tick');assert.equal(r.run('S.credits===beforeCredits'),true);
 r.run('update(SIM_STEP*2)');assert.equal(r.run('S.towers.length'),0);assert.equal(r.run('S.credits>beforeCredits'),true);
}
console.log('PASS all five sale animations and unchanged refund/removal timing');
for(const type of ['turret','cannon','voltaic'])for(const level of [1,3]){
 const ranges=boot();
 ranges.run(`reset();S.phase='build';const t={...SLOTS[0],type:'${type}',T:TOWER['${type}'],level:${level}};S.selected={kind:'tower',tower:t};`);
 const stats=JSON.parse(ranges.run('JSON.stringify(tstats(t))'));
 ranges.calls.length=0;ranges.run('drawFiringLane()');
 const arcs=ranges.calls.filter(c=>c[0]==='arc');
 assert.deepEqual(arcs.map(c=>c[3]),type==='cannon'?[stats.range,ranges.run('TOWER.cannon.minRange')]:[stats.range],'only actual firing range and Cannon dead zone get circles');
 assert.ok(arcs.every(c=>c[1]===ranges.run('t.x')&&c[2]===ranges.run('t.y')&&c[4]===0&&c[5]===Math.PI*2),'range circles are centered on the selected tower');
 assert.ok(ranges.calls.some(c=>c[0]==='setLineDash'&&JSON.stringify(c[1])==='[4,4]'),'range circles stay dashed');
 assert.equal(ranges.calls.filter(c=>['moveTo','lineTo','fill','fillRect','fillText'].includes(c[0])).length,0,'range preview must never highlight the road or add coverage labels');
}
for(const type of ['generator','barracks']){
 const ranges=boot();ranges.run(`reset();S.phase='build';S.selected={kind:'tower',tower:{...SLOTS[0],type:'${type}',T:TOWER['${type}'],level:1}}`);ranges.calls.length=0;ranges.run('drawFiringLane()');assert.equal(ranges.calls.length,0,'non-firing buildings get no range ring');
}
console.log('PASS dashed range circles only, upgraded ranges, Cannon dead zone and first-strike Voltaic range');

const touch=boot();touch.run("reset();S.phase='build';S.credits=1000;S.selected={kind:'slot',slot:SLOTS[0]};draw();");
let button=touch.run("buttons.find(b=>b.placement?.type==='cannon')");
const ev={pointerType:'touch',pointerId:1,clientX:button.x+5,clientY:button.y+5};
touch.handlers.pointerdown(ev);assert.equal(touch.run('S.towers.length'),0,'holding the choice previews without buying');
assert.equal(touch.run('firingLaneSelection().tower.type'),'cannon');touch.run('draw()');assert.equal(touch.run('buttons.some(b=>b.placement)'),false,'holding hides the menu so it cannot obscure range circles');
touch.handlers.pointerup(ev);assert.equal(touch.run('S.towers[0].type'),'cannon','release on the original button buys the previewed type');
touch.run("S.selected={kind:'slot',slot:SLOTS[1]};draw();");button=touch.run("buttons.find(b=>b.placement?.type==='voltaic')");
const cancelled={pointerType:'touch',pointerId:2,clientX:button.x+5,clientY:button.y+5};
const money=touch.run('S.credits');touch.handlers.pointerdown(cancelled);touch.handlers.pointercancel(cancelled);touch.handlers.pointerup(cancelled);assert.equal(touch.run('S.credits'),money,'cancelled touches never spend credits');
touch.handlers.pointerdown(cancelled);touch.handlers.pointerup({...cancelled,clientX:-100});assert.equal(touch.run('S.credits'),money,'sliding off the choice cancels placement');
console.log('PASS touch-hold range preview, release to build, cancellation and slide-off');
