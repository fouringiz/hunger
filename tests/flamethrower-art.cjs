'use strict';
// Renderer contracts only; visual approval still needs actual-game captures and the disk-browser check.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(code=source,loaded=true){
  const draws=[],images=[],stack=[];let matrix=[1,0,0,1,0,0];
  const multiply=(a,b,c,d,e,f)=>{const [u,v,w,x,y,z]=matrix;matrix=[u*a+w*b,v*a+x*b,u*c+w*d,v*c+x*d,u*e+w*f+y,v*e+x*f+z];};
  class Image{constructor(){this.complete=loaded;this.naturalWidth=loaded?768:0;this.naturalHeight=loaded?256:0;images.push(this);}}
  const ctx=new Proxy({}, {get(o,k){
    if(k==='drawImage')return (...args)=>draws.push({args,matrix:matrix.slice()});
    if(k==='save')return ()=>stack.push(matrix.slice());if(k==='restore')return ()=>{matrix=stack.pop();};
    if(k==='translate')return (x,y)=>multiply(1,0,0,1,x,y);
    if(k==='transform')return multiply;
    if(k==='rotate')return a=>multiply(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0);
    if(k==='getImageData'||k==='toDataURL')return ()=>{throw new Error('SecurityError: file-origin canvas');};
    return o[k]??(o[k]=()=>{});
  }});
  const canvas={style:{},getContext:()=>ctx,addEventListener(){}};
  const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(code,c);
  return {run:x=>vm.runInContext(x,c),draws,images,reset(){draws.length=0;matrix=[1,0,0,1,0,0];}};
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function checkFoundation(r){
  for(const angle of [0,.7,1.9,3.4,5.8]){
    r.reset();r.run(`drawFlamethrower({angle:${angle}})`);
    const base=r.draws[0];assert.ok(base,'textured foundation must be drawn');
    assert.deepEqual(base.matrix,[1,0,0,1,0,0],'foundation must stay fixed');
    assert.deepEqual(base.args.slice(-4),[-22,-17,44,34]);
  }
}
function checkMuzzle(r){
  for(let i=0;i<64;i++){
    const a=i*Math.PI*2/64;r.reset();r.run(`drawFlamethrower({angle:${a}})`);
    const heads=r.draws.filter(d=>d.args[1]===264),tanks=r.draws.filter(d=>d.args[1]===569);
    assert.equal(heads.length,2,'projected head and shallow sides');assert.equal(tanks.length,2,'two upright fuel tanks');
    for(const d of tanks){assert.deepEqual(d.matrix,[1,0,0,1,0,0],'tank verticals never rotate or flatten');close(d.args[7],11);close(d.args[8],22);}
    const [u,v,w,x,y,z]=heads[1].matrix;
    // The head's right edge on its centreline is the nozzle exit; test the drawn geometry, not just a helper.
    const drawn={x:u*29+y,y:v*29+z},tip=JSON.parse(r.run(`JSON.stringify(weaponMuzzle({type:'flamer',x:0,y:0,angle:${a}}))`));
    close(tip.x,drawn.x);close(tip.y,drawn.y);
    close(Math.atan2(Math.sin(Math.atan2(tip.y+12,tip.x)-a),Math.cos(Math.atan2(tip.y+12,tip.x)-a)),0);
  }
}
const r=boot();checkFoundation(r);checkMuzzle(r);
function checkEmergence(r){
  for(const angle of [0,1,2,3,4,5])for(const [progress,kind]of [[.14000001,'tank'],[.30000001,'head']]){
    r.reset();r.run(`drawFlamethrower({angle:${angle}},${progress});`);
    const parts=r.draws.filter(d=>kind==='tank'?d.args[1]===569:d.args[1]>=264&&d.args[1]<504);
    assert.ok(parts.length>0,'newly lifting '+kind+' is sampled');
    for(const {args,matrix:m}of parts){
      const [x,y,w,h]=args.slice(-4),top=Math.min(...[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py])=>m[1]*px+m[3]*py+m[5]));
      assert.ok(top>=8,'newly lifting parts must start below the socket edge, not pop in half exposed');
    }
  }
}
checkEmergence(r);
const atlas=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/hunger-flamethrower-v1.frames.json'),'utf8'));
assert.deepEqual(JSON.parse(r.run('JSON.stringify(FLAMER_ART.rects)')),atlas.rects,'runtime rectangles match baked parts');
assert.ok(r.images.some(i=>i.src.endsWith('assets/hunger-flamethrower-v1.png')));
r.run("reset();S.credits=1000;build(SLOTS[2],'flamer');");
const signature=r.run('replaySignature()');
r.run("drawFlamethrower(S.towers[0]);");
assert.equal(r.run('replaySignature()'),signature,'drawing leaves combat state unchanged');
r.run("S.towers[0].branch='B';");const cryoSignature=r.run('replaySignature()');
r.run("drawFlamethrower(S.towers[0]);");assert.equal(r.run('replaySignature()'),cryoSignature,'Cryojet drawing leaves combat state unchanged');
const fallback=boot(source,false);assert.doesNotThrow(()=>fallback.run("drawFlamethrower({angle:1.1,branch:'B',paused:true});"),'failed/loading art has a pixel-free fallback');
// Known bad variants must fail the same contracts: rotating the whole foundation, old nozzle length, missing art.
function mutateOnce(before,after){
  const start=source.indexOf(before);
  assert.ok(start>=0,'negative variant must find its intended drawing operation');
  assert.equal(source.indexOf(before,start+before.length),-1,'negative variant must target exactly one drawing operation');
  return source.replace(before,after);
}
assert.throws(()=>checkFoundation(boot(mutateOnce('  drawTowerFoundation(t);\n  const lift=deploymentStep(p,.3,.78)', '  ctx.rotate(t.angle);drawTowerFoundation(t);\n  const lift=deploymentStep(p,.3,.78)'))),/foundation must stay fixed/);
assert.throws(()=>checkMuzzle(boot(mutateOnce('muzzleX:29','muzzleX:22'))));
assert.throws(()=>checkFoundation(fallback),/textured foundation must be drawn/);
assert.throws(()=>checkEmergence(boot(mutateOnce('const y=p.y+44*(1-tankLift);','const y=p.y+22*(1-tankLift);'))),/not pop in half exposed/);
// The support uses the same lift distance; mutate the head translation, not its shaft.
assert.throws(()=>checkEmergence(boot(mutateOnce('ctx.translate(0,FLAMER_ART.mountY+42*(1-lift)+z);','ctx.translate(0,FLAMER_ART.mountY+22*(1-lift)+z);'))),/not pop in half exposed/);
console.log('PASS Flamethrower atlas, planted base, upright tanks, continuous yaw, nozzle attachment, render parity, file-origin fallback and known-bad variants');
