'use strict';
const {historical}=require('./lib/history.cjs');
// User-run contracts for one shared foundation. These do not establish visual approval.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.join(__dirname,'..'),source=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
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

const types=['turret','cannon','voltaic','flamer'];
function setup(r,type,level,branch){r.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(type)});for(let l=1;l<${level};l++)upgrade(S.towers[0],l===3?${JSON.stringify(branch)}:undefined);S.towers[0].warm=0;`);}
function expectBase(r,world=false){
 const first=r.draws[0];assert.ok(first,'a textured common foundation must be visible');
 assert.ok(first.args[0].src.endsWith('hunger-low-buildings-v3.png'),'every weapon must use the shared foundation atlas');
 assert.deepEqual(first.args.slice(1),[59,137,429,321,-22,-17,44,34],'every weapon must use the exact Turret base crop, size and placement');
 const pos=world?JSON.parse(r.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})')):{x:0,y:0};
 assert.deepEqual(first.matrix,[1,0,0,1,pos.x,pos.y],'the complete base stays planted throughout the animation');
}
function check(r){
 const sockets=JSON.parse(r.run('JSON.stringify(LEVEL4_SOCKETS)'));
 for(const type of types){
  assert.deepEqual(sockets[type],{x:0,y:-5.5},'all four families use the same central attachment');
  for(const [level,branch] of [[1,null],[2,null],[3,null],[4,'A'],[4,'B']]){
   setup(r,type,level,branch);
   for(const angle of [0,.7,2,3.4,5.8])for(const state of ['ready','paused','selling']){
    r.run(`S.towers[0].angle=${angle};S.towers[0].paused=${state==='paused'};S.towers[0].selling=${state==='selling'};S.towers[0].sellT=SELL_TIME*.5;`);
    const sig=r.run('replaySignature()');r.clear();r.run('drawTowerBody(S.towers[0]);');expectBase(r,true);
    assert.equal(r.run('replaySignature()'),sig,'rendering the shared base changes no combat state');
   }
   if(level===1)for(const p of [0,.1,.3,.6,.8,.99]){
    r.clear();r.run(`drawBuildingDeployment(S.towers[0],${p});`);expectBase(r);
   }
  }
 }
}
check(boot());
// The known old split bases and a moving foundation must fail the SAME contract.
const {execFileSync}=require('node:child_process');
const old=historical('528cb0b','prototype/index.html').match(/<script>([\s\S]*?)<\/script>/)[1];
assert.throws(()=>check(boot(old)),/shared foundation|exact Turret|same central attachment|planted/);
const moved=source.replace('function drawTowerFoundation(t){','function drawTowerFoundation(t){ctx.translate(2,0);');assert.notEqual(moved,source);
assert.throws(()=>check(boot(moved)),/planted/);
const failed=boot(source,false);
for(const type of types){setup(failed,type,1,null);assert.doesNotThrow(()=>failed.run('drawTowerBody(S.towers[0]);'),'missing images keep the shared vector fallback');}
console.log('PASS shared Turret base and attachment across all four families, levels, yaw, build/pause/sale; old split bases and moving-base variants rejected');
