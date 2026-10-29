// Construction is a view of tower identities: no replay event or combat mutation. The simulation's own build warm-up
// (BUILD_WARMUP) lasts exactly as long as the drawn deployment, so the first shot lands as the deployment ends.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(type='turret'){
 const draws=[],cues=[];class Image{constructor(){this.complete=true;this.naturalWidth=1448;this.naturalHeight=1086;}}
 const ctx=new Proxy({}, {get(o,k){if(k==='drawImage')return (...a)=>draws.push(a);if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});if(k==='measureText')return t=>({width:String(t).length*6});return o[k]??(o[k]=()=>{});}});
 const canvas={style:{},getContext:()=>ctx,addEventListener(){}};
 const c=vm.createContext({Image,cues,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:'?infantry=1'},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
 vm.runInContext(source,c);const run=x=>vm.runInContext(x,c);
 run("playCue=(...a)=>cues.push(a);reset();S.phase='build';S.credits=10000;S.buildTimer=999;build(SLOTS[0],'"+type+"');");return{run,draws,cues};
}
const r=boot();r.run('observeConstruction()');assert.equal(r.run('constructionProgress(S.towers[0])'),0);
const before=r.run('replaySignature()');
for(let i=0;i<=120;i++)r.run(`presentationTime=${i/60};draw();`);
assert.equal(r.run('replaySignature()'),before,'animation and sounds never write combat/replay state');
assert.equal(r.run('constructionProgress(S.towers[0])'),1);
assert.deepEqual(r.cues.map(c=>c[0]),['turret-deploy-1','turret-deploy-2','turret-deploy-3'],'mechanical cues occur once, despite repeated redraws');
r.run('upgrade(S.towers[0]);draw();');assert.equal(r.run('constructionProgress(S.towers[0])'),1,'an upgrade must not replay placement');
r.run('const oldTower=S.towers[0];sell(oldTower);finishSell(oldTower);build(SLOTS[0],"turret");draw();');
assert.equal(r.run('constructionProgress(SLOTS[0].tower)'),0,'a newly purchased tower in the same slot deploys again');
r.run('reset();S.phase="build";build(SLOTS[0],"turret");draw();');assert.equal(r.run('constructionProgress(S.towers[0])'),0,'a new run cannot inherit construction state');
console.log('PASS presentation parity, one-shot cues, upgrades, sell/rebuild and reset');
const immediate=boot();immediate.run("observeConstruction();S.phase='wave';S.wave=1;const enemy=makeEnemy('carapacid',1);enemy.d=180;Object.assign(enemy,posAt(enemy.d));S.enemies=[enemy];update(SIM_STEP);draw();");
assert.ok(!immediate.run('weaponFeedback.has(S.towers[0])'),'a deploying tower holds fire');
immediate.run("while(S.towers[0].warm>0)update(SIM_STEP);update(SIM_STEP);draw();");
assert.ok(immediate.run('weaponFeedback.has(S.towers[0])'),'control tower fires once deployed');
assert.equal(immediate.run('constructionProgress(S.towers[0])'),1,'the first actual shot reveals the fully deployed weapon');
const selling=boot();selling.run('observeConstruction();sell(S.towers[0]);draw();');assert.equal(selling.run('constructionProgress(S.towers[0])'),1,'demolition does not continue deployment');
console.log('PASS combat starts with the deployment done and demolition interrupts deployment');
function combat(render){const r=boot();r.run("S.phase='wave';S.wave=1;S.spawnQueue=[];const enemy=makeEnemy('carapacid',1);enemy.d=180;Object.assign(enemy,posAt(enemy.d));S.enemies=[enemy];");for(let i=0;i<300;i++)r.run(`update(SIM_STEP);presentationTime+=SIM_STEP;${render?'draw();':''}`);return r.run('replaySignature()');}
assert.equal(combat(true),combat(false),'rendering construction must preserve exact combat outcomes');
const fallback=boot();fallback.run('lowBuildingArt.complete=false;structureArt.complete=false;');for(const t of [0,.3,.8,1.2,1.65,2])assert.doesNotThrow(()=>fallback.run(`presentationTime=${t};draw();`),'deployment and final pose work with missing art');
const final=boot();final.run('observeConstruction();presentationTime=BUILDING_DEPLOY_SECONDS;observeConstruction();');
final.draws.length=0;final.run('drawTowerBody(S.towers[0]);');const animatedEnd=final.draws.slice();
final.draws.length=0;final.run('constructionArt=new WeakMap();drawTowerBody(S.towers[0]);');assert.deepEqual(final.draws,animatedEnd,'completed construction uses exactly the normal sprite draws');
console.log('PASS rendered/headless combat equivalence, missing-asset fallback and exact normal-pose handoff');

for(const type of ['turret','cannon','voltaic','generator','barracks','flamer']){
 const b=boot(type);b.run('observeConstruction()');assert.equal(b.run('constructionProgress(S.towers[0])'),0,type+' registers placement');
 const snapshot=b.run('replaySignature()');
 for(const time of [.2,.6,1,1.4,2])b.run(`presentationTime=${time};draw();`);
 assert.equal(b.run('replaySignature()'),snapshot,type+' deployment never edits simulation state');
 assert.deepEqual(b.cues.map(c=>c[0]).filter(c=>c.includes('-deploy-')),[1,2,3].map(i=>type+'-deploy-'+i));
 b.draws.length=0;b.run('drawTowerBody(S.towers[0])');const final=b.draws.slice();
 b.draws.length=0;b.run('constructionArt=new WeakMap();drawTowerBody(S.towers[0])');assert.deepEqual(b.draws,final,type+' hands off to normal artwork');
 const absent=boot(type);absent.run('lowBuildingArt.complete=false;structureArt.complete=false;voltaicArt.complete=false;level4Art.complete=false;flamerArt.complete=false;');
 for(const time of [0,.3,.8,1.3,2])assert.doesNotThrow(()=>absent.run(`presentationTime=${time};draw();`),type+' has a missing-art fallback');
 if(['cannon','voltaic'].includes(type)){
   const battle=boot(type);battle.run("observeConstruction();S.phase='wave';S.wave=1;const e=makeEnemy('carapacid',1);e.d=180;Object.assign(e,posAt(e.d));S.enemies=[e];update(SIM_STEP);draw();");
   assert.ok(!battle.run('weaponFeedback.has(S.towers[0])'),type+' holds fire while deploying');
   battle.run("while(S.towers[0].warm>0)update(SIM_STEP);update(SIM_STEP);draw();");
   assert.ok(battle.run('weaponFeedback.has(S.towers[0])'),type+' control fires once deployed');assert.equal(battle.run('constructionProgress(S.towers[0])'),1,type+' first shot reveals the assembled model');
 }
}
const drained=boot('generator');drained.run("observeConstruction();const leech=makeEnemy('leech',1);leech.gen=S.towers[0];leech.state='attached';S.towers[0].leeched=leech;observeConstruction();");assert.equal(drained.run('constructionProgress(S.towers[0])'),1,'draining displays the functional generator immediately');
const troops=boot('barracks');troops.run('observeConstruction();presentationTime=.4;');
assert.equal(troops.run('soldierPresentationPoint(S.towers[0].soldiers[0],S.towers[0]).visible'),false,'soldiers wait behind the closed entrance visually');
const troopsState=troops.run('replaySignature()');troops.run('presentationTime=1.6;');assert.equal(troops.run('soldierPresentationPoint(S.towers[0].soldiers[0],S.towers[0]).visible'),true,'the open entrance releases soldiers');
assert.equal(troops.run('replaySignature()'),troopsState,'entrance animation never moves physical soldiers');
troops.run("S.towers[0].soldiers[0].target=makeEnemy('forager',1);observeConstruction();");assert.equal(troops.run('constructionProgress(S.towers[0])'),1,'engaged infantry reveals the ready Barracks immediately');
console.log('PASS all six deployments, exact final poses, missing art, combat/drain interruption and Barracks exit parity');
const flamer=boot('flamer');flamer.run('observeConstruction();');
const stages=[];
for(const time of [0,.3,.7,1.1,1.5,1.65]){
 flamer.draws.length=0;flamer.run(`presentationTime=${time};observeConstruction();drawTowerBody(S.towers[0]);`);
 stages.push(JSON.stringify(flamer.draws));
}
assert.equal(new Set(stages).size,6,'Flamethrower must visibly assemble, not show the finished sprite throughout');
const fired=boot('flamer');fired.run("observeConstruction();S.phase='wave';S.wave=1;const target=makeEnemy('carapacid',1);target.x=S.towers[0].x+50;target.y=S.towers[0].y;S.time=.3;fireFlame(S.towers[0],tstats(S.towers[0]),target);observeConstruction();");
assert.equal(fired.run('constructionProgress(S.towers[0])'),1,'a real fuel jet reveals the assembled nozzle even if the presentation clock lags');
const interrupted=boot('flamer');interrupted.run('observeConstruction();presentationTime=.6;observeConstruction();const partial=constructionProgress(S.towers[0]);sell(S.towers[0]);observeConstruction();');
assert.equal(interrupted.run('constructionArt.get(S.towers[0]).saleFrom'),interrupted.run('partial'),'early sale retracts from the current pose');
console.log('PASS Flamethrower distinct assembly stages, first-jet handoff and early-sale continuity');
const route=boot('barracks');route.run("reset();S.phase='build';S.credits=10000;build(SLOTS[3],'barracks');while(S.towers[0].warm>0)update(SIM_STEP);for(let i=0;i<120;i++)update(SIM_STEP);observeConstruction();");
const routeState=route.run('replaySignature()');
for(let i=0;i<=100;i++){
 route.run(`presentationTime=${1.32+1.25*i/100};`);
 const point=JSON.parse(route.run('JSON.stringify(soldierPresentationPoint(S.towers[0].soldiers[0],S.towers[0]))'));
 if(point.visible)assert.ok(point.y>=348||point.y<=308||Math.abs(point.x-350)>=25,'the exit route never crosses the Barracks ground footprint');
}
assert.equal(route.run('replaySignature()'),routeState,'walking around the hull is presentation-only');
console.log('PASS the northbound garrison exits around the hull instead of through its footprint');
