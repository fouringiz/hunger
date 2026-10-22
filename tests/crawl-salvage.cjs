const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(){const calls=[],images=[],handlers={};class Image{constructor(){this.complete=true;this.naturalWidth=768;images.push(this);}}const ctx=new Proxy({}, {get(o,k){if(k==='drawImage')return (...args)=>calls.push([k,...args]);if(k==='createLinearGradient')return ()=>({addColorStop(){}});if(k==='measureText')return t=>({width:String(t).length*5});return o[k]??(o[k]=(...args)=>calls.push([k,...args]));}});const canvas={getContext:()=>ctx,style:{},addEventListener(type,fn){handlers[type]=fn;},getBoundingClientRect:()=>({left:0,top:0})};const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:'?infantry=1'},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});vm.runInContext(source,c);return {run:x=>vm.runInContext(x,c),calls,images,handlers};}
const cue=boot();cue.run("reset();S.credits=1000;build(SLOTS[0],'generator');const e=makeEnemy('leech',5);e.gen=S.towers[0];");
for(const state of ['lane','seek','return']){cue.calls.length=0;cue.run(`e.state='${state}';drawLeechCue(e);`);assert.equal(cue.calls.length,0,'a moving Leech must not draw a tendril');}
cue.calls.length=0;cue.run("e.state='attached';drawLeechCue(e)");assert.ok(cue.calls.some(c=>c[0]==='lineTo'),'a real feeding connection remains visible');
for(const type of ['forager','carapacid','leech']){
 const r=boot();r.run(`reset();const e=makeEnemy('${type}',1);e.state='lane';e.d=0;e.x=0;e.y=90;`);
 const pose=()=>JSON.parse(r.run('JSON.stringify(crawlPose(e,0))'));
 const a=pose();r.run('S.time+=10');assert.deepEqual(pose(),a,'waiting without movement never cycles feet');
 r.run('e.d=.1;e.x=.1');const b=pose();let supported=0;
 for(let i=0;i<a.legs.length;i++)if(a.legs[i].stance&&b.legs[i].stance){assert.ok(Math.abs(a.legs[i].foot.x-(b.legs[i].foot.x+.1))<1e-9,'a stance foot stays planted in world space');supported++;}
 assert.ok(supported>=3);assert.notDeepEqual(b,a,'travel articulates the feet');
 r.run("e.state='seek';e.x+=.3;e.y+=.4;");const before=pose();r.run('e.x+=.3;e.y+=.4');const after=pose();assert.ok(Math.abs(after.distance-before.distance-.5)<1e-8,'free-roaming travel is measured even when path distance is frozen');
 const saved=r.run('JSON.stringify(e)');r.run('groundActorSprite(e,0);groundActorSprite(e,Math.PI/2);groundActorSprite(e,-Math.PI/2);');assert.equal(r.run('JSON.stringify(e)'),saved,'the rig never edits the enemy');
}
console.log('PASS Leech cues only while feeding, planted stance feet, stopped gait and off-path travel');
for(const type of ['turret','cannon','voltaic','generator','barracks']){
 const r=boot();r.run(`reset();S.phase='build';S.credits=10000;build(SLOTS[0],'${type}');observeConstruction();presentationTime=2;observeConstruction();S.towers[0].angle=.7;sell(S.towers[0]);observeConstruction();`);
 const saved=r.run('replaySignature()');r.run('drawTowerBody(S.towers[0]);');assert.equal(r.run('replaySignature()'),saved,'sale rendering cannot refund or remove a tower');
 const phases=[];for(const remaining of [1.8,1.2,.6,.05]){r.calls.length=0;r.run(`S.towers[0].sellT=${remaining};drawTowerBody(S.towers[0]);`);phases.push(JSON.stringify(r.calls.filter(c=>c[0]==='drawImage').map(c=>c.slice(2))));}
 assert.equal(new Set(phases).size,4,type+' visibly retracts during the existing sale countdown');
 r.run('S.towers[0].sellT=SELL_TIME;const beforeCredits=S.credits;update(SELL_TIME-SIM_STEP);');assert.equal(r.run('S.towers.length'),1,'refund remains delayed until the removal tick');assert.equal(r.run('S.credits===beforeCredits'),true);
 r.run('update(SIM_STEP*2)');assert.equal(r.run('S.towers.length'),0);assert.equal(r.run('S.credits>beforeCredits'),true);
}
console.log('PASS all five sale animations and unchanged refund/removal timing');
const coverage=boot();
for(const type of ['turret','cannon','voltaic']){
 const data=JSON.parse(coverage.run(`JSON.stringify((()=>{const t={x:420,y:270,type:'${type}',T:TOWER['${type}'],level:1};const stats=tstats(t);return {x:t.x,y:t.y,range:stats.range,min:t.T.minRange||0,parts:laneCoverage(t.x,t.y,stats.range,t.T.minRange||0)};})())`));
 assert.ok(data.parts.covered.length>0);
 for(const part of data.parts.covered)for(let i=0;i<=20;i++){const p=i/20,d=Math.hypot(part.x1+(part.x2-part.x1)*p-data.x,part.y1+(part.y2-part.y1)*p-data.y);assert.ok(d<=data.range+1e-7 && d>=data.min-1e-7,'every highlighted road point is in the actual firing annulus');}
 if(type==='cannon')assert.ok(data.parts.blind.length>0,'Cannon dead-zone road is marked separately');
 if(type==='voltaic')assert.equal(data.range,coverage.run('TOWER.voltaic.range'),'coverage uses the initial strike, without adding hop range');
}
console.log('PASS exact road coverage, Cannon dead zone and first-strike-only Voltaic range');

const touch=boot();touch.run("reset();S.phase='build';S.credits=1000;S.selected={kind:'slot',slot:SLOTS[0]};draw();");
let button=touch.run("buttons.find(b=>b.placement?.type==='cannon')");
const ev={pointerType:'touch',pointerId:1,clientX:button.x+5,clientY:button.y+5};
touch.handlers.pointerdown(ev);assert.equal(touch.run('S.towers.length'),0,'holding the choice previews without buying');
assert.equal(touch.run('firingLaneSelection().tower.type'),'cannon');touch.run('draw()');assert.equal(touch.run('buttons.some(b=>b.placement)'),false,'holding hides the menu so it cannot obscure coverage');
touch.handlers.pointerup(ev);assert.equal(touch.run('S.towers[0].type'),'cannon','release on the original button buys the previewed type');
touch.run("S.selected={kind:'slot',slot:SLOTS[1]};draw();");button=touch.run("buttons.find(b=>b.placement?.type==='voltaic')");
const cancelled={pointerType:'touch',pointerId:2,clientX:button.x+5,clientY:button.y+5};
const money=touch.run('S.credits');touch.handlers.pointerdown(cancelled);touch.handlers.pointercancel(cancelled);touch.handlers.pointerup(cancelled);assert.equal(touch.run('S.credits'),money,'cancelled touches never spend credits');
touch.handlers.pointerdown(cancelled);touch.handlers.pointerup({...cancelled,clientX:-100});assert.equal(touch.run('S.credits'),money,'sliding off the choice cancels placement');
console.log('PASS touch-hold coverage preview, release to build, cancellation and slide-off');

for(const angle of [0,Math.PI/2,-Math.PI/2,.8,-2]){
 const r=boot();r.run("reset();const e=makeEnemy('carapacid',1);e.state='seek';e.x=e.y=0;");
 const a=JSON.parse(r.run(`JSON.stringify(crawlPose(e,${angle}))`));
 r.run(`e.x+=Math.cos(${angle})*.1;e.y+=Math.sin(${angle})*.1;`);
 const b=JSON.parse(r.run(`JSON.stringify(crawlPose(e,${angle}))`));
 for(let i=0;i<a.legs.length;i++)if(a.legs[i].stance&&b.legs[i].stance){assert.ok(Math.abs(a.legs[i].foot.x-b.legs[i].foot.x-Math.cos(angle)*.1)<1e-8);assert.ok(Math.abs(a.legs[i].foot.y-b.legs[i].foot.y-Math.sin(angle)*.1)<1e-8,'stance remains planted on vertical and diagonal headings too');}
}
console.log('PASS planted stance on horizontal, vertical and diagonal movement');
