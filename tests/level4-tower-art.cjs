'use strict';
// User-run renderer contracts. These do not establish artistic acceptance in the game.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.join(__dirname,'..'),source=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const table=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v1.frames.json'),'utf8'));
function boot(code=source,loaded=true){
 const draws=[],stack=[];let matrix=[1,0,0,1,0,0];
 const multiply=(a,b,c,d,e,f)=>{const [u,v,w,x,y,z]=matrix;matrix=[u*a+w*b,v*a+x*b,u*c+w*d,v*c+x*d,u*e+w*f+y,v*e+x*f+z];};
 class Image{constructor(){this.complete=loaded;this.naturalWidth=loaded?2048:0;this.naturalHeight=loaded?2048:0;}}
 const ctx=new Proxy({}, {get(o,k){
  if(k==='drawImage')return (...args)=>draws.push({args,matrix:matrix.slice()});
  if(k==='save')return ()=>stack.push(matrix.slice());if(k==='restore')return ()=>{matrix=stack.pop();};
  if(k==='translate')return (x,y)=>multiply(1,0,0,1,x,y);if(k==='transform')return multiply;
  if(k==='scale')return (x,y)=>multiply(x,0,0,y,0,0);if(k==='rotate')return a=>multiply(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0);
  if(k==='getImageData'||k==='toDataURL')return ()=>{throw Error('SecurityError: file-origin canvas');};
  return o[k]??(o[k]=()=>{});
 }});
 const canvas={style:{},getContext:()=>ctx,addEventListener(){}};
 const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
 vm.runInContext(code,c);
 return {run:x=>vm.runInContext(x,c),draws,clear(){draws.length=0;matrix=[1,0,0,1,0,0];}};
}
function setup(r,e){r.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(e.type)});upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],${JSON.stringify(e.branch)});S.towers[0].warm=0;observeConstruction();presentationTime=3;observeConstruction();`);}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function check(r){
 for(const e of table.entries){
  setup(r,e);
  for(let i=0;i<8;i++){
   const yaw=i*Math.PI/4,angle=Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw));
   r.run(`S.towers[0].angle=${angle};`);const sig=r.run('replaySignature()');r.clear();r.run('drawLevel4Tower(S.towers[0]);');
   assert.equal(r.run('replaySignature()'),sig,'specialized drawing changes no simulation state');
   const base=r.draws[0],upper=r.draws.find(d=>d.args[0].src.endsWith('hunger-level4-towers-v1.png'));
   assert.ok(upper,'selected branch must draw its dedicated sprite');
   assert.deepEqual(base.matrix,[1,0,0,1,0,0],'foundation must remain stationary');
   assert.deepEqual(upper.matrix,[1,0,0,1,0,0],'upright assembly must keep the map camera');
   assert.deepEqual(upper.args.slice(1,5),[(e.frames.length===1?0:i)*256,e.row*256,256,256],'each heading must select the correct authored view');
   const f=e.frames[e.frames.length===1?0:i],tip=JSON.parse(r.run('JSON.stringify(weaponMuzzle(S.towers[0]))')),pos=JSON.parse(r.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})'));
   const [x,y,w,h]=upper.args.slice(-4);near(tip.x-pos.x,x+f.muzzle[0]/256*w);near(tip.y-pos.y,y+f.muzzle[1]/256*h);
  }
  r.run("S.towers[0].angle=.3;weaponFeedback.set(S.towers[0],{kind:S.towers[0].type,angle:.3,at:presentationTime});");
  r.clear();r.run('drawLevel4Tower(S.towers[0]);');const first=r.draws.find(d=>d.args[0].src.endsWith('hunger-level4-towers-v1.png')).args.slice(-4);
  r.run('presentationTime+=.06;');r.clear();r.run('drawLevel4Tower(S.towers[0]);');
  assert.deepEqual(r.draws[0].matrix,[1,0,0,1,0,0],'recoil must not move the foundation');
  const second=r.draws.find(d=>d.args[0].src.endsWith('hunger-level4-towers-v1.png')).args.slice(-4);
  if(['turret','cannon'].includes(e.type))assert.notDeepEqual(first,second,'actual shot must animate recoil');
  r.run('S.towers[0].paused=true;');assert.equal(r.run('level4Pose(S.towers[0]).kick'),0,'paused weapons do not recoil');
  r.run('S.towers[0].paused=false;S.towers[0].selling=true;');assert.equal(r.run('level4Pose(S.towers[0]).kick'),0,'selling weapons do not recoil');
 }
}
const metadata=boot();
assert.deepEqual(JSON.parse(metadata.run('JSON.stringify(LEVEL4_ART)')),table.entries.map(e=>({key:e.key,type:e.type,branch:e.branch,row:e.row,size:e.renderSize,tips:e.frames.map(f=>f.muzzle),seats:e.frames.map(f=>f.bearing)})),'embedded disk-browser table must match the baked atlas');
check(boot());
function checkDispatch(r){for(const e of table.entries){setup(r,e);r.clear();r.run('drawTowerBody(S.towers[0]);');assert.ok(r.draws.some(d=>d.args[0].src.endsWith('hunger-level4-towers-v1.png')),'tower render must actually dispatch to its branch sprite');}}
checkDispatch(boot());
const fallback=boot(source,false);for(const e of table.entries){setup(fallback,e);assert.doesNotThrow(()=>fallback.run('drawTowerBody(S.towers[0]);weaponMuzzle(S.towers[0]);'),'loading/failure fallback must work without pixel reads');}
// Same contracts reject known bad states, rather than permitting the old level-3 artwork to pass.
assert.throws(()=>checkDispatch(boot(source.replace('drawLevel4Tower(t,visibleProgress)||',''))),/dedicated|dispatch/);
assert.throws(()=>check(boot(source.replace('// Foundation and upper are independent;', 'ctx.rotate(t.angle); // Foundation and upper are independent;'))),/foundation must remain stationary/);
assert.throws(()=>check(boot(source.replace('x:t.x+p.muzzle.x','x:t.x+p.muzzle.x+7'))));
assert.throws(()=>check(boot(source.replace('p.spec.row*LEVEL4_CELL','0*LEVEL4_CELL'))),/correct authored view/);
const launch=boot();setup(launch,table.entries.find(e=>e.key==='howitzer'));
launch.run('const testShell={tower:S.towers[0],sx:S.towers[0].x,sy:S.towers[0].y,tx:700,ty:200};');
const firstLaunch=launch.run('JSON.stringify(shellLaunchPoint(testShell))');
launch.run('S.towers[0].angle=3;presentationTime+=.2;weaponFeedback.set(S.towers[0],{at:presentationTime-.04});');
assert.equal(launch.run('JSON.stringify(shellLaunchPoint(testShell))'),firstLaunch,'in-flight shells keep their original launch position during later turns and recoil');
console.log('PASS level-4 branch dispatch, eight-view yaw, planted foundations, muzzle attachment, recoil, pixel-free fallback, render parity and known-bad variants');
