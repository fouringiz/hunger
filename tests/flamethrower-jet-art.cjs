'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(code=source){
  const shapes=[];let points=[];
  const ctx=new Proxy({}, {get(o,k){
    if(k==='beginPath')return ()=>{points=[];};
    if(['moveTo','lineTo','ellipse'].includes(k))return (...a)=>points.push([k,...a]);
    if(k==='fill')return ()=>shapes.push({points:points.slice(),color:o.fillStyle,alpha:o.globalAlpha});
    if(k==='getImageData'||k==='toDataURL')return ()=>{throw new Error('SecurityError');};
    return o[k]??(o[k]=()=>{});
  }});
  const canvas={getContext:()=>ctx,style:{},addEventListener(){}};
  const c=vm.createContext({document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(code,c);const run=x=>vm.runInContext(x,c);
  run("reset();S.credits=1000;build(SLOTS[2],'flamer');const jetTower=S.towers[0];jetTower.angle=0;jetTower.jetAt=0;");
  return {run,shapes,frame(time){shapes.length=0;run(`S.time=${time};drawFlameJet(jetTower);`);return JSON.parse(JSON.stringify(shapes));}};
}
function flowing(r){
  const a=r.frame(.02),b=r.frame(.08);
  assert.equal(a.length,9,'three fuel ribbons plus six moving tongues');
  assert.notDeepEqual(a[0].points,b[0].points,'flame must flow even while the nozzle holds still');
  assert.ok(a[0].points.length>20,'a filled flame silhouette replaces the old straight strokes');
}
const r=boot();flowing(r);
for(const angle of [0,.4,1.8,3.2,4.9]){
  r.run(`jetTower.angle=${angle};`);const frame=r.frame(.05),m=JSON.parse(r.run('JSON.stringify(weaponMuzzle(jetTower))'));
  assert.deepEqual(frame[0].points[0],['moveTo',m.x,m.y],'the fuel ribbon begins exactly at the nozzle');
}
r.run("jetTower.branch='B';");const cryo=r.frame(.08);assert.equal(cryo[0].color,'#50b5cf','Cryojet uses coolant colors');
r.run("jetTower.branch='A';");const fire=r.frame(.08);assert.equal(fire[0].color,'#e84c0a','Plasma keeps the fuel-flame appearance');
const saved=r.run('replaySignature()');r.run('drawFlameJet(jetTower);');assert.equal(r.run('replaySignature()'),saved,'the effect never changes combat');
assert.ok(r.frame(.18)[0].alpha<r.frame(.08)[0].alpha,'fuel fades between the last pulse and disappearance');
assert.equal(r.frame(.24).length,0,'a stopped jet leaves no permanent flame');
for(const flag of ['paused','selling']){
  r.run(`jetTower.${flag}=true;`);assert.equal(r.frame(.05).length,0,flag+' immediately stops the visual jet');r.run(`jetTower.${flag}=false;`);
}
assert.throws(()=>flowing(boot(source.replace('S.time*27+SLOTS.indexOf(t.slot)*.71','0'))),/flame must flow/,'the same animation check rejects a static ribbon');
console.log('PASS flowing fuel silhouette, moving tongues, nozzle attachment, branch colors, fade/stop, render parity and known-bad frozen flow');
