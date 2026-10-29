'use strict';
// User-run native pixel regression for the reported open socket / floating upper assembly.
// It uses the actual renderer and atlas; no claim of artistic acceptance follows from passing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),table=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v1.frames.json'),'utf8'));
// Independently measured foundation sockets, in world pixels of the existing 44 x 34 foundation.
const sockets={turret:[0,-5.5],voltaic:[0,-5.5],cannon:[0,-3.2],flamer:[0,-6]};
async function check(sourceHtml=null){
 const w=await loadWorld({sourceHtml});
 w.run(`const seatingDrawImage=ctx.drawImage.bind(ctx),seatingCoupling=typeof drawLevel4Coupling==='function'?drawLevel4Coupling:null;
 let seatingLayer='full';ctx.drawImage=(image,...args)=>{if(seatingLayer!=='upper'||image===level4Art)seatingDrawImage(image,...args);};
 drawLevel4Mechanism=()=>{};`);
 function paint(kind){
  w.run(`seatingLayer=${JSON.stringify(kind)};ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';ctx.setTransform(2,0,0,2,128,160);
   if(seatingCoupling)drawLevel4Coupling=seatingLayer==='upper'?()=>{}:seatingCoupling;
   if(seatingLayer==='base'){
    if(S.towers[0].type==='flamer')ctx.drawImage(flamerArt,...FLAMER_ART.rects[0],-22,-17,44,34);
    else lowBuildingSprite(S.towers[0].type==='cannon'?1:0,-22,-17,44,34);
   }else if(seatingLayer==='bearing'){seatingCoupling(S.towers[0]);seatingCoupling(S.towers[0],true);}
   else drawLevel4Tower(S.towers[0]);`);
  return w.canvas.getContext('2d').getImageData(0,0,256,256).data;
 }
 let count=0;
 for(const e of table.entries){
  w.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(e.type)});upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],${JSON.stringify(e.branch)});`);
  const base=paint('base'),socket=sockets[e.type];
  for(let frame=0;frame<e.frames.length;frame++)for(const age of [0,.06,.14,.21,.5]){
   const yaw=frame*Math.PI/4,angle=Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw));
   w.run(`S.towers[0].angle=${angle};presentationTime=${3+age};weaponFeedback.set(S.towers[0],{at:3,kind:S.towers[0].type,angle:S.towers[0].angle});`);
   const full=paint('full');let covered=0,samples=0;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const u=(x+.5-128)/2-socket[0],v=(y+.5-160)/2-socket[1];
    if((u/4.5)**2+(v/2.0)**2>1)continue;
    const i=(y*256+x)*4,diff=Math.abs(full[i]-base[i])+Math.abs(full[i+1]-base[i+1])+Math.abs(full[i+2]-base[i+2]);
    samples++;if(full[i+3]>128&&diff>=24)covered++;
   }
   assert.ok(covered/samples>=.75,`${e.key} heading ${frame} age ${age}: foundation socket remains open (${covered}/${samples} covered)`);
   if(w.run('!!seatingCoupling')){
    const upper=paint('upper'),bearing=paint('bearing');let overlap=0;
    for(let i=3;i<upper.length;i+=4)if(upper[i]>=64&&bearing[i]>=64)overlap++;
    assert.ok(overlap>=3,`${e.key} heading ${frame} age ${age}: upper bearing floats above the fixed socket (${overlap} contact pixels)`);
   }
   count++;
  }
 }
 return count;
}
async function main(){
 const count=await check();
 // Exact uploaded renderer shown in the user's screenshots must fail the same socket-coverage check.
 const bad=execFileSync('git',['show','e4d136f:prototype/index.html'],{cwd:ROOT,encoding:'utf8'});
 await assert.rejects(()=>check(bad),/foundation socket remains open/);
 // A closed socket alone is insufficient: deliberately raising the upper must also fail.
 const current=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
 const floating=current.replace('const mountY=socket.y-1,','const mountY=socket.y-11,');assert.notEqual(floating,current);
 await assert.rejects(()=>check(floating),/upper bearing floats above/);
 console.log('PASS level-4 seating: '+count+' authored view/recoil states, filled sockets, physical upper/bearing contact; exact old and raised-upper variants rejected');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
