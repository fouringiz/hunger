'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(code=source,withAtlas=false){
  const shapes=[],draws=[],rotations=[];let points=[];
  const ctx=new Proxy({}, {get(o,k){
    if(k==='beginPath')return ()=>{points=[];};
    if(['moveTo','lineTo','ellipse'].includes(k))return (...a)=>points.push([k,...a]);
    if(k==='fill')return ()=>shapes.push({points:points.slice(),color:o.fillStyle,alpha:o.globalAlpha});
    if(k==='drawImage')return (...args)=>draws.push({args,alpha:o.globalAlpha});
    if(k==='rotate'||k==='transform')return (...args)=>rotations.push(args);
    if(k==='getImageData'||k==='toDataURL')return ()=>{throw new Error('SecurityError');};
    return o[k]??(o[k]=()=>{});
  }});
  const canvas={getContext:()=>ctx,style:{},addEventListener(){}};
  class Image{constructor(){this.complete=true;this.naturalWidth=512;this.naturalHeight=256;}}
  const c=vm.createContext({Image:withAtlas?Image:undefined,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(code,c);const run=x=>vm.runInContext(x,c);
  run("reset();S.credits=1000;build(SLOTS[2],'flamer');const jetTower=S.towers[0];jetTower.angle=0;jetTower.jetAt=0;");
  return {run,shapes,draws,rotations,frame(time){shapes.length=0;draws.length=0;run(`S.time=${time};drawFlameJet(jetTower);`);return JSON.parse(JSON.stringify(shapes));}};
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
function fuelVolume(r){
  r.frame(.07);
  const samples=r.draws.map(d=>({x:d.args[5]+d.args[7]/2,width:d.args[7]})).sort((a,b)=>a.x-b.x);
  assert.ok(samples.length>=10,'fuel must use textured turbulent volume instead of just smooth ribbons');
  const mean=a=>a.reduce((s,p)=>s+p.width,0)/a.length;
  assert.ok(mean(samples.slice(-6))>mean(samples.slice(0,6))*2,'fire grows into broad distant lobes rather than tapering to a needle');
  const first=JSON.stringify(r.draws.map(d=>d.args.slice(1)));r.frame(.13);
  assert.notEqual(JSON.stringify(r.draws.map(d=>d.args.slice(1))),first,'billows travel and roll with the nozzle held still');
  assert.equal(r.rotations.length,0,'billows keep the fixed camera and vertical rise at every heading');
}
const fuel=boot(source,true);fuelVolume(fuel);
const frames=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/hunger-flame-billows-v1.frames.json'),'utf8'));
assert.equal(frames.cell,128);assert.equal(frames.columns,4);assert.equal(frames.frames,8);
for(const angle of [0,1.5,3.1,4.7]){fuel.run(`jetTower.angle=${angle}`);fuel.frame(.07);}
assert.equal(fuel.rotations.length,0,'turning the nozzle never spins the billow image in the screen plane');
fuel.run("jetTower.angle=0;S.time=.07;");const sig=fuel.run('replaySignature()');fuel.run('drawFlameJet(jetTower);');assert.equal(fuel.run('replaySignature()'),sig);
assert.equal(fuel.frame(.24).length,0);assert.equal(fuel.draws.length,0,'expired fuel has no lingering opaque cloud');
fuel.run("jetTower.branch='B';");fuel.frame(.07);assert.equal(fuel.draws.length,0,'Cryojet keeps its coolant effect rather than orange fire textures');
assert.throws(()=>fuelVolume(boot(source.replace("if(t.branch==='B'||!fuelFireReady())return drawRibbonJet(t);","if(true)return drawRibbonJet(t);"),true)),/textured turbulent volume/,'the same check rejects the previous ribbon-only appearance');
assert.throws(()=>fuelVolume(boot(source.replace('5+30*Math.pow(u,1.1)','5+0*Math.pow(u,1.1)'),true)),/broad distant lobes/);
assert.throws(()=>fuelVolume(boot(source.replace('function fuelBillowPoses(t,time=S.time)','function fuelBillowPoses(t,time=0)'),true)),/billows travel and roll/);
const narrowSource=source.replace('return 1+.6*deploymentStep(u,.1,.72);','return 1;');
function widerFlame(r){
  const old=boot(narrowSource,true);old.frame(.07);r.frame(.07);
  const sizes=v=>v.draws.map(d=>d.args[7]).sort((a,b)=>a-b),a=sizes(r),b=sizes(old);
  const mean=v=>v.reduce((s,x)=>s+x,0)/v.length;
  assert.ok(mean(a.slice(-6))>=mean(b.slice(-6))*1.5,'the distant flame must be visibly wider than the previous narrow version');
  assert.ok(mean(a.slice(0,6))<=mean(b.slice(0,6))*1.1,'the nozzle end remains a narrow fuel stream');
}
const expanded=boot(source,true);widerFlame(expanded);
for(const angle of [0,.7,1.5,2.4,3.1,4,4.7,5.6]){
  expanded.run(`jetTower.angle=${angle};`);expanded.frame(.07);
  const ray=JSON.parse(expanded.run('JSON.stringify({m:weaponMuzzle(jetTower),x:jetTower.x+Math.cos(jetTower.angle)*tstats(jetTower).range,y:jetTower.y+Math.sin(jetTower.angle)*tstats(jetTower).range})'));
  const dx=ray.x-ray.m.x,dy=ray.y-ray.m.y,len=Math.hypot(dx,dy);
  for(const {args}of expanded.draws){
    const [x,y,w,h]=args.slice(-4);
    for(const [px,py]of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]])assert.ok(((px-ray.m.x)*dx+(py-ray.m.y)*dy)/len<=len+1e-8,'wider billows must not extend the forward visual reach');
  }
}
assert.throws(()=>widerFlame(boot(narrowSource,true)),/wider than the previous narrow version/,'the same width check rejects the known narrow variant');
console.log('PASS flowing fuel silhouette, moving tongues, nozzle attachment, branch colors, fade/stop, render parity and known-bad frozen flow');
