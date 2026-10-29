'use strict';
const {historical}=require('./lib/history.cjs');
// User-run native pixel regression for the reported open socket / floating upper assembly.
// It uses the actual renderer and atlas; no claim of artistic acceptance follows from passing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),table=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'),'utf8'));
// Independently measured foundation sockets, in world pixels of the existing 44 x 34 foundation.
const oldTable=JSON.parse(historical('15ad9ed','assets/hunger-level4-towers-v1.frames.json'));
const yawTable=JSON.parse(historical('15ad9ed','assets/hunger-level4-yaw-v1.frames.json'));
const sockets={turret:[0,-5.5],voltaic:[0,-5.5],cannon:[0,-5.5],flamer:[0,-5.5]};
async function check(sourceHtml=null,{anchors=true}={}){
 const activeTable=sourceHtml&&!sourceHtml.includes('hunger-level4-towers-v2.png')?oldTable:table;
 const w=await loadWorld({sourceHtml});
 w.run(`const seatingDrawImage=ctx.drawImage.bind(ctx),seatingCoupling=typeof drawLevel4Coupling==='function'?drawLevel4Coupling:null;
 let seatingLayer='full',seatingDraws=[];ctx.drawImage=(image,...args)=>{
   const blended=typeof level4BlendCanvas!=='undefined'&&image===level4BlendCanvas;
   const head=image===level4Art||blended||(typeof level4YawArt!=='undefined'&&image===level4YawArt);
   if(head){const m=ctx.getTransform();seatingDraws.push({kind:blended?'blend':image===level4Art?'directional':'projected',args,matrix:[m.a,m.b,m.c,m.d,m.e,m.f]});}
   if(seatingLayer==='support'||(['upper','head','coverage'].includes(seatingLayer)&&!head))return;
   seatingDrawImage(image,...args);
 };
 for(const key of ['fill','fillRect','stroke','strokeRect']){const original=ctx[key].bind(ctx);ctx[key]=(...args)=>{if(seatingLayer!=='head')original(...args);};}
 drawLevel4Mechanism=()=>{};`);
 function paint(kind){
  w.run(`seatingLayer=${JSON.stringify(kind)};seatingDraws=[];ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';ctx.setTransform(2,0,0,2,128,160);
   if(seatingCoupling)drawLevel4Coupling=['upper','head','support'].includes(seatingLayer)?()=>{}:seatingCoupling;
   if(seatingLayer==='base'){
    lowBuildingSprite(0,-22,-17,44,34);
   }else if(seatingLayer==='bearing'){seatingCoupling(S.towers[0]);seatingCoupling(S.towers[0],true);}
   else drawLevel4Tower(S.towers[0]);`);
  return w.canvas.getContext('2d').getImageData(0,0,256,256).data;
 }
 let count=0,maxAnchorDistance=0;
 for(const e of activeTable.entries){
  w.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(e.type)});upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],${JSON.stringify(e.branch)});`);
  const socket=sockets[e.type];
  const headings=e.frames.length===1?1:Math.max(16,e.frames.length);
  for(let frame=0;frame<headings;frame++)for(const age of [0,.06,.14,.21,.5]){
   const yaw=frame*Math.PI*2/headings,angle=Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw));
   w.run(`if(typeof level4ViewStates!=='undefined')level4ViewStates.delete(S.towers[0]);S.towers[0].angle=${angle};presentationTime=${3+age};weaponFeedback.set(S.towers[0],{at:3,kind:S.towers[0].type,angle:S.towers[0].angle});`);
   // Render the actual head/support/bearing without the foundation underneath.
   // Similar olive colours can look unchanged while fully covering the socket;
   // alpha, rather than RGB distance from the base, measures physical coverage.
   const coverage=paint('coverage');let covered=0,samples=0;
   if(anchors){
    const draw=JSON.parse(w.run('JSON.stringify(seatingDraws)')).at(-1);
    assert.ok(draw,`${e.key}: actual head image must be drawn`);
    const entry=draw.kind==='projected'?yawTable.entries.find(a=>a.key===e.key):e.frames[draw.kind==='blend'?0:Math.round(draw.args[0]/256)];
    const [x,y,width,height]=draw.args.slice(-4),[a,b,c,d,tx,ty]=draw.matrix;
    const u=x+entry.bearing[0]/256*width,v=y+entry.bearing[1]/256*height;
    // Measure the atlas bearing in the ACTUAL draw matrix, not a reported pose helper.
    // Native capture renders at 2x; the 2px tolerance applies to those screen pixels.
    const px=a*u+c*v+tx,py=b*u+d*v+ty,cx=128+socket[0]*2,cy=160+socket[1]*2;
    const distance=Math.hypot(px-cx,py-cy);maxAnchorDistance=Math.max(maxAnchorDistance,distance);
    assert.ok(distance<=2+1e-6,`${e.key} heading ${frame} age ${age}: head bearing anchor ${distance.toFixed(3)}px from socket centre (max 2px)`);
   }
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const u=(x+.5-128)/2-socket[0],v=(y+.5-160)/2-socket[1];
    if((u/4.5)**2+(v/2.0)**2>1)continue;
    const i=(y*256+x)*4;
    samples++;if(coverage[i+3]>128)covered++;
   }
   assert.ok(covered/samples>=.75,`${e.key} heading ${frame} age ${age}: foundation socket remains open (${covered}/${samples} covered)`);
   if(w.run('!!seatingCoupling')){
    const upper=paint('upper'),bearing=paint('bearing');let overlap=0;
    for(let i=3;i<upper.length;i+=4)if(upper[i]>=64&&bearing[i]>=64)overlap++;
    assert.ok(overlap>=3,`${e.key} heading ${frame} age ${age}: upper bearing floats above the fixed socket (${overlap} contact pixels)`);
   }
   if(w.run("typeof level4Pose(S.towers[0]).projected!=='undefined'&&level4Pose(S.towers[0]).projected")){
    const head=paint('head'),support=paint('support');let joint=0;
    for(let i=3;i<head.length;i+=4)if(head[i]>=64&&support[i]>=64)joint++;
    assert.ok(joint>=3,`${e.key} heading ${frame} age ${age}: projected head floats above its upright support (${joint} contact pixels)`);
   }
   count++;
  }
 }
 return {count,maxAnchorDistance};
}
async function main(){
 const {count,maxAnchorDistance}=await check();
 // Exact uploaded renderer shown in the user's screenshots must fail the same socket-coverage check.
 const bad=historical('e4d136f','prototype/index.html');
 await assert.rejects(()=>check(bad,{anchors:false}),/foundation socket remains open/);
 // A closed socket alone is insufficient: deliberately raising the upper must also fail.
 const current=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
 const floating=current.replace('const mountY=socket.y,','const mountY=socket.y-10,');assert.notEqual(floating,current);
 await assert.rejects(()=>check(floating),/head bearing anchor.*socket centre|upper bearing floats above/);
 const detached=current.replace('...art.rect,p.x,p.y,p.size,p.size','...art.rect,p.x,p.y-20,p.size,p.size');assert.notEqual(detached,current);
 await assert.rejects(()=>check(detached),/head bearing anchor.*socket centre|projected head floats above/);
 const before=historical('df6f8f5','prototype/index.html');
 await assert.rejects(()=>check(before),/head bearing anchor.*socket centre/,'exact previous renderer must fail the new anchor constraint');
 const shifted=current.replace('...art.rect,p.x,p.y,p.size,p.size','...art.rect,p.x,p.y-6,p.size,p.size');assert.notEqual(shifted,current);
 await assert.rejects(()=>check(shifted),/head bearing anchor.*socket centre/,'a head shifted 6 world units toward the back must fail');
 console.log('PASS level-4 seating: '+count+' heading/recoil states (max '+maxAnchorDistance.toFixed(3)+'px), <=2px screen-space bearing anchors, filled sockets, physical upper/bearing contact; exact old, previous rearward, 6-unit rearward, raised-upper and detached-head variants rejected');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
