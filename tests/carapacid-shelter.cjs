'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search=''){
 const canvas={getContext:()=>({}),style:{},addEventListener(){}};
 const c=vm.createContext({document:{getElementById:()=>canvas},window:{devicePixelRatio:1},innerWidth:960,innerHeight:540,location:{search,pathname:'/prototype/index.html'},URLSearchParams,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
 vm.runInContext(source,c);return code=>vm.runInContext(code,c);
}
const setup=`reset();S.phase='wave';S.wave=1;S.spawnQueue=[];S.credits=10000;
const c=makeEnemy('carapacid',1);c.d=110;Object.assign(c,posAt(c.d));c.hp=c.maxHp=100000;
const fs=Array.from({length:4},(_,i)=>{const e=makeEnemy('forager',1);e.seq=i;e.d=c.d-15-i*13;Object.assign(e,posAt(e.d));e.hp=e.maxHp=10000;return e;});S.enemies=[c,...fs];`;
let run=boot();run(setup+`
planCarapacidShelter(SIM_STEP,1);assert.ok(fs.every(e=>!e.shelter),'no threat, no gathering');
build(SLOTS[0],'generator');planCarapacidShelter(SIM_STEP,1);assert.ok(fs.every(e=>!e.shelter),'generator is not a threat');
sell(S.towers[0]);finishSell(S.towers[0]);build(SLOTS[0],'turret');const t=S.towers[0];t.cd=999;
planCarapacidShelter(SIM_STEP,1);assert.equal(fs.filter(e=>e.shelter).length,3,'three separate berths, no unlimited pile');
assert.equal(new Set(fs.filter(e=>e.shelter).map(e=>e.shelter.slot)).size,3);
for(let k=0;k<70;k++){
 const old=fs.map(e=>({d:e.d,x:e.x,y:e.y}));stepSimulation(SIM_STEP);
 for(let i=0;i<fs.length;i++){const e=fs[i];assert.ok(e.d>=old[i].d,'never walks backward');assert.ok(e.d-old[i].d<=e.speed*SIM_STEP+1e-6,'no catchup teleport or speed buff');assert.ok(Math.hypot(e.x-old[i].x,e.y-old[i].y)<1.4,'continuous approach');assert.ok(Math.hypot(e.x-posAt(e.d).x,e.y-posAt(e.d).y)<=23.001,'inside lane');}
}
assert.ok(fs[0].shelter&&Math.abs(c.d-fs[0].d-6)<1,'nearest Forager reaches front berth');
assert.ok(fs[0].y<c.y-8,'takes lee side away from southern tower');
const hp=fs[0].hp,chp=c.hp;fireFlat(t,tstats(t),fs[0]);assert.equal(fs[0].hp,hp,'direct shot physically intercepted');assert.ok(c.hp<chp);
const shot=S.shots.at(-1);assert.equal(shot.to,c);
const oldD=fs[0].d;c.dead=true;stepSimulation(SIM_STEP);assert.ok(fs.every(e=>!e.shelter),'death releases followers');assert.ok(fs[0].d>oldD,'released follower keeps moving');
for(let i=0;i<60;i++)stepSimulation(SIM_STEP);assert.ok(fs.every(e=>e.shelterOffset<1e-6),'release returns smoothly to route');
`);
console.log('PASS threat-based gathering, finite berths, smooth movement, real interception and death release');
run=boot();run(setup+`build(SLOTS[0],'turret');S.towers[0].cd=999;planCarapacidShelter(SIM_STEP,1);assert.ok(fs[0].shelter);
c.slowUntil=S.time+10;c.slowMul=.4;planCarapacidShelter(SIM_STEP,1);assert.ok(fs.every(e=>!e.shelter),'Cryo releases flock');
c.slowUntil=0;S.towers[0].paused=true;planCarapacidShelter(SIM_STEP,1);assert.ok(fs.every(e=>!e.shelter),'paused tower does not trigger gathering');
S.towers[0].paused=false;S.towers[0].selling=true;planCarapacidShelter(SIM_STEP,1);assert.ok(fs.every(e=>!e.shelter),'demolishing tower is not a threat');
S.towers[0].selling=false;c.d=GATE_D-70;planCarapacidShelter(SIM_STEP,1);assert.ok(fs.every(e=>!e.shelter),'portal approach stays free');
`);
console.log('PASS Cryo, inactive towers and portal release');
run=boot();run(setup+`build(SLOTS[0],'cannon');const t=S.towers[0];t.cd=999;for(let i=0;i<70;i++)stepSimulation(SIM_STEP);
const f=fs[0],hp=f.hp;S.shells=[{sx:t.x,sy:t.y,tx:f.x,ty:f.y,t:.64,flight:.65,tower:t,dmg:20,splash:40,prime:null}];advanceShells(.02);assert.ok(f.hp<hp,'shelter is not artillery immunity');`);
console.log('PASS artillery still damages sheltered bodies');
// Presentation calls may not influence following positions or the resulting game.
const a=boot(),b=boot();for(const f of [a,b])f(setup+`build(SLOTS[0],'turret');S.towers[0].cd=999;`);
for(let i=0;i<120;i++){a('stepSimulation(SIM_STEP)');b('stepSimulation(SIM_STEP);S.enemies.forEach(visualEnemy);presentationTime+=.17;');}
const snapshot='JSON.stringify(S.enemies.map(e=>[e.d,e.x,e.y,e.hp,e.shelter?.slot,e.shelterOffset]))';assert.equal(a(snapshot),b(snapshot));
run=boot('?balance=v04');run(setup+`build(SLOTS[0],'turret');planCarapacidShelter(SIM_STEP,1);assert.ok(fs.every(e=>!e.shelter),'historical preset retains original behavior');`);
console.log('PASS deterministic simulation independent of render cadence; historical preset preserved');
