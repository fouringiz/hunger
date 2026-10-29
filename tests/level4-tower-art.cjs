'use strict';
// Authored-pose presentation contracts; artistic approval requires actual-game captures.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.join(__dirname,'..'),source=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const HEAD_SCALE=Number(source.match(/const HEAD_SCALE=([0-9.]+)/)[1]);
const table=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'),'utf8'));
function boot(code=source,loaded=true){
 const draws=[],blendDraws=[],stack=[];let matrix=[1,0,0,1,0,0];
 const multiply=(a,b,c,d,e,f)=>{const[u,v,w,x,y,z]=matrix;matrix=[u*a+w*b,v*a+x*b,u*c+w*d,v*c+x*d,u*e+w*f+y,v*e+x*f+z];};
 class Image{constructor(){this.complete=loaded;this.naturalWidth=loaded?2048:0;this.naturalHeight=loaded?2048:0;}set src(v){this._src=v;if(loaded)this.naturalWidth=v.endsWith('hunger-level4-towers-v2.png')?4096:2048;}get src(){return this._src;}}
 const ctx=new Proxy({}, {get(o,k){
  if(k==='drawImage')return(...args)=>draws.push({args,matrix:matrix.slice()});
  if(k==='save')return()=>stack.push(matrix.slice());if(k==='restore')return()=>{matrix=stack.pop();};
  if(k==='translate')return(x,y)=>multiply(1,0,0,1,x,y);if(k==='transform')return multiply;
  if(k==='scale')return(x,y)=>multiply(x,0,0,y,0,0);if(k==='rotate')return a=>multiply(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0);
  if(k==='getImageData'||k==='toDataURL')return()=>{throw Error('SecurityError: file-origin canvas');};
  return o[k]??(o[k]=()=>{});
 }});
 const blendContext=new Proxy({}, {get(o,k){if(k==='clearRect')return()=>{blendDraws.length=0;};if(k==='drawImage')return(...args)=>blendDraws.push({args,alpha:o.globalAlpha,mode:o.globalCompositeOperation});if(k==='getImageData'||k==='toDataURL')return()=>{throw Error('SecurityError: file-origin canvas');};return o[k]??(o[k]=()=>{});}});
 const canvas={style:{},getContext:()=>ctx,addEventListener(){}};
 const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>({src:'level4-blend',getContext:()=>blendContext})},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
 vm.runInContext(code,c);return{run:x=>vm.runInContext(x,c),draws,blendDraws,clear(){draws.length=blendDraws.length=0;matrix=[1,0,0,1,0,0];}};
}
function setup(r,e){r.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(e.type)});upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],${JSON.stringify(e.branch)});S.towers[0].warm=0;observeConstruction();presentationTime=3;observeConstruction();`);}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),angle=yaw=>Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw));
function upperDraw(r){return r.draws.filter(d=>['level4-blend'].includes(d.args[0].src)||d.args[0].src?.endsWith('hunger-level4-towers-v2.png')).at(-1);}
function check(r){
 for(const e of table.entries){
  setup(r,e);const count=e.frames.length,selected=new Set();assert.equal(count,['tesla','cluster'].includes(e.key)?1:16);
  for(let n=0;n<count;n++){
   const yaw=n*Math.PI/8;r.run(`S.towers[0].angle=${angle(yaw)};level4Pose(S.towers[0]);presentationTime+=.08;`);
   const sig=r.run('replaySignature()');r.clear();r.run('drawLevel4Tower(S.towers[0]);');assert.equal(r.run('replaySignature()'),sig);
   const upper=upperDraw(r);assert.ok(upper,'selected branch draws its dedicated sprite');assert.deepEqual(r.draws[0].matrix,[1,0,0,1,0,0],'foundation must remain stationary');assert.deepEqual(upper.matrix,[1,0,0,1,0,0],'authored view keeps upright camera');
   assert.deepEqual(upper.args.slice(1,5),e.frames[n].rect,'correct authored source rectangle');selected.add(upper.args[1]);
   const tip=e.frames[n].muzzle,bearing=e.frames[n].bearing,muzzle=JSON.parse(r.run('JSON.stringify(weaponMuzzle(S.towers[0]))')),pos=JSON.parse(r.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})')),[x,y,w,h]=upper.args.slice(-4);
   near(muzzle.x-pos.x,x+tip[0]/256*w);near(muzzle.y-pos.y,y+tip[1]/256*h);near(x+bearing[0]/256*w,0);near(y+bearing[1]/256*h,-5.5);
  }
  assert.equal(selected.size,count,'sixteen distinct authored frames over one turn');
  for(const boundary of[0,Math.PI,-Math.PI,2*Math.PI]){const left=r.run(`level4Views(${angle(boundary-1e-7)},${count}).frame`),right=r.run(`level4Views(${angle(boundary+1e-7)},${count}).frame`);assert.equal(left,right,e.key+': pose selector has a seam at the angular wrap');}
  if(count>1){
   for(let j=0;j<16;j++){
    const y=(j+.5)*Math.PI/8,t0=20+j*.3,from=j,to=(j+1)%16;
    r.run(`level4ViewStates.delete(S.towers[0]);S.towers[0].angle=${angle(y-1e-7)};presentationTime=${t0};`);
    const before=JSON.parse(r.run('JSON.stringify(level4Muzzle(S.towers[0],S.towers[0].angle,false))'));
    r.run(`S.towers[0].angle=${angle(y+1e-7)};`);const atSwitch=JSON.parse(r.run('JSON.stringify(level4Muzzle(S.towers[0],S.towers[0].angle,false))'));
    assert.ok(Math.hypot(before.x-atSwitch.x,before.y-atSwitch.y)<.001,e.key+': muzzle jumps on pose switch');
    r.run(`presentationTime=${t0+.03};`);r.clear();r.run('drawLevel4Tower(S.towers[0]);');assert.equal(r.blendDraws.length,2);
    for(const[k,f]of[from,to].entries()){assert.deepEqual(r.blendDraws[k].args.slice(1,5),e.frames[f].rect);near(r.blendDraws[k].alpha,.5);assert.equal(r.blendDraws[k].mode,'lighter');}
    const p=JSON.parse(r.run('JSON.stringify(level4Pose(S.towers[0]))'));for(let axis=0;axis<2;axis++)near(axis?p.muzzle.y+5.5:p.muzzle.x,((e.frames[from].muzzle[axis]+e.frames[to].muzzle[axis])/2-e.frames[from].bearing[axis])*e.renderSize*HEAD_SCALE/256);
    r.run(`presentationTime=${t0+.08};`);r.clear();r.run('drawLevel4Tower(S.towers[0]);');assert.deepEqual(upperDraw(r).args.slice(1,5),e.frames[to].rect,'held head settles to one opaque authored pose');
   }
   r.run('S.towers[0].angle=.123;level4Pose(S.towers[0]);presentationTime+=1;');r.clear();r.run('drawLevel4Tower(S.towers[0]);');assert.ok(upperDraw(r).args[0].src.endsWith('hunger-level4-towers-v2.png'),'held off-centre yaw must not remain a permanent ghost blend');
  }
  r.run('S.towers[0].angle=.3;weaponFeedback.set(S.towers[0],{kind:S.towers[0].type,angle:.3,at:presentationTime});');r.clear();r.run('drawLevel4Tower(S.towers[0]);');const first=upperDraw(r);r.run('presentationTime+=.06;');r.clear();r.run('drawLevel4Tower(S.towers[0]);');assert.deepEqual(r.draws[0].matrix,[1,0,0,1,0,0]);if(['turret','cannon'].includes(e.type))assert.notDeepEqual(first.args.slice(-4),upperDraw(r).args.slice(-4),'shot animates seated recoil');
  r.run('S.towers[0].paused=true;');assert.equal(r.run('level4Pose(S.towers[0]).kick'),0);r.run('S.towers[0].paused=false;S.towers[0].selling=true;');assert.equal(r.run('level4Pose(S.towers[0]).kick'),0);
 }
}

(async()=>{
 const metadata=boot();assert.deepEqual(JSON.parse(metadata.run('JSON.stringify(LEVEL4_ART)')),table.entries.map(e=>({key:e.key,type:e.type,branch:e.branch,row:e.row,size:e.renderSize,tips:e.frames.map(f=>f.muzzle),seats:e.frames.map(f=>f.bearing)})),'embedded file-browser table matches atlas');
 check(boot());
 const dispatch=r=>{for(const e of table.entries){setup(r,e);r.clear();r.run('drawTowerBody(S.towers[0]);');assert.ok(upperDraw(r),'tower render dispatches to authored specialization');}};dispatch(boot());
 const fallback=boot(source,false);for(const e of table.entries){setup(fallback,e);assert.doesNotThrow(()=>fallback.run('drawTowerBody(S.towers[0]);weaponMuzzle(S.towers[0]);'),'pixel-free loading/failure fallback');}
 assert.throws(()=>dispatch(boot(source.replace('drawLevel4Tower(t,visibleProgress)||',''))),/dispatches/);
 assert.throws(()=>check(boot(source.replace('// Foundation and upper are independent;','ctx.rotate(t.angle); // Foundation and upper are independent;'))),/stationary/);
 assert.throws(()=>check(boot(source.replace('x:t.x+p.muzzle.x','x:t.x+p.muzzle.x+7'))));
 assert.throws(()=>check(boot(source.replaceAll('p.spec.row*LEVEL4_CELL','0*LEVEL4_CELL'))),/rectangle/);
 const eight=source.replace('level4Views(angle,spec.tips.length)','level4Views(angle,spec.tips.length===1?1:8)');assert.notEqual(eight,source);assert.throws(()=>check(boot(eight)),/rectangle|muzzle|!=|frames/,'eight-pose selector rejected');
 const seam=source.replace('Math.round(((yaw%turn+turn)%turn)*count/turn)%count','Math.min(count-1,Math.round(((yaw%turn+turn)%turn)*count/turn))');assert.notEqual(seam,source);assert.throws(()=>check(boot(seam)),/seam/,'clamped angular wrap rejected');
 const snap=source.replace('k=deploymentStep(presentationTime-e.at,0,.06)','k=1');assert.notEqual(snap,source);assert.throws(()=>check(boot(snap)),/jumps on pose switch/,'instant muzzle switch rejected');
 const permanent=source.replace('const views=foreign?[{frame,weight:1}]:level4Transition(t,frame);','const views=spec.tips.length===1?[{frame:0,weight:1}]:[{frame,weight:.5},{frame:(frame+1)%spec.tips.length,weight:.5}];');assert.notEqual(permanent,source);assert.throws(()=>check(boot(permanent)),/rectangle|!=|held/,'permanent angular crossfade rejected');

 const launch=boot();setup(launch,table.entries.find(e=>e.key==='howitzer'));launch.run('const testShell={tower:S.towers[0],sx:S.towers[0].x,sy:S.towers[0].y,tx:700,ty:200};');const firstLaunch=launch.run('JSON.stringify(shellLaunchPoint(testShell))');launch.run('S.towers[0].angle=3;presentationTime+=.2;weaponFeedback.set(S.towers[0],{at:presentationTime-.04});');assert.equal(launch.run('JSON.stringify(shellLaunchPoint(testShell))'),firstLaunch,'in-flight launch point stays pinned');
 const{createCanvas,loadImage}=require('@napi-rs/canvas'),art=await loadImage(path.join(ROOT,'assets/hunger-level4-towers-v2.png')),c=createCanvas(256,256),g=c.getContext('2d');assert.equal(art.width,4096);assert.equal(art.height,2048);
 const attached=(e,f)=>{let peak=0;const x=Math.round(f.muzzle[0]),y=Math.round(f.muzzle[1]),pixels=g.getImageData(0,0,256,256).data;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)peak=Math.max(peak,pixels[((y+dy)*256+x+dx)*4+3]||0);assert.ok(peak>=64,e.key+': muzzle detached from sprite');};
 for(const e of table.entries){const hashes=new Set();for(const[index,f]of e.frames.entries()){g.clearRect(0,0,256,256);g.drawImage(art,...f.rect,0,0,256,256);const pixels=g.getImageData(0,0,256,256).data;assert.ok(pixels.filter((v,i)=>i%4===3&&v>64).length>1000,e.key+': nonempty full sprite');hashes.add(crypto.createHash('sha256').update(pixels).digest('hex'));if(e.frames.length>1&&index<=8)attached(e,f);}assert.equal(hashes.size,e.frames.length,e.key+': no duplicated atlas cells');}
 // The initial side-facing Plasma tip was in clear air ahead of the copper collar.
 // The independent raster check must detect that defect, not just helper parity.
 const plasma=table.entries.find(e=>e.key==='plasma'),f=plasma.frames[0];g.clearRect(0,0,256,256);g.drawImage(art,...f.rect,0,0,256,256);assert.throws(()=>attached(plasma,{...f,muzzle:[f.muzzle[0]+8,f.muzzle[1]]}),/muzzle detached/);

 console.log('PASS level-4 authored16 poses, distinct raster cells, upright camera, shared muzzle/blend continuity including wrap, fixed foundations, recoil, pixel-free fallback, launch pinning, parity and bad variants');
})().catch(e=>{console.error(e);process.exitCode=1;});
