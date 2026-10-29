'use strict';
const {historical}=require('./lib/history.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
 const rejectedHtml=historical('c01c1b9','prototype/index.html');
 const rejectedMask=rejectedHtml.match(/function creatureMireMask\(e,pose\)\{[\s\S]*?\n\}\n(?=function drawCreatureContactShadow)/)[0];
 const sourceHtml=process.env.CREATURE_MIRE_CANDIDATE?fs.readFileSync(process.env.CREATURE_MIRE_CANDIDATE,'utf8'):null;
 const {run,canvas}=await loadWorld({sourceHtml});
 run(`var rejectedMask=${rejectedMask};var currentMask=creatureMireMask;`);
 run("reset();var probe=makeEnemy('leech',1);probe.x=480;probe.y=270;probe.__k=1;worldLiveArt=document.createElement('canvas');worldLiveArt.width=W*WORLD_RASTER_SCALE;worldLiveArt.height=H*WORLD_RASTER_SCALE;var flat=worldLiveArt.getContext('2d');flat.fillStyle='#b06020';flat.fillRect(0,0,worldLiveArt.width,worldLiveArt.height);");
 const ctx=canvas.getContext('2d');let protectedPixels=0,rejectedDamage=0;
 for(let row=0;row<16;row++)for(let frame=0;frame<4;frame++){
  const paint=mode=>{
   run(`ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,256,256);ctx.translate(128,128);ctx.drawImage(leechMireArt,${frame*256},${row*256},256,208,-40,-61,80,65);`);
   if(mode)run(`creatureMireMask=${mode};creatureMireMasks.clear();drawCreatureBurial(probe,{row:${row},frame:${frame}});`);
   return Buffer.from(ctx.getImageData(0,0,256,256).data);
  };
  const raw=paint(null),actual=paint('currentMask'),bad=paint('rejectedMask');
  // Independently erode the rendered silhouette by 4 px. These opaque interior pixels
  // belong to the body/mouth, not its submerged edge, and must not become ground.
  for(let y=60;y<136;y++)for(let x=85;x<172;x++){
   let core=true;
   for(let dy=-4;dy<=4&&core;dy++)for(let dx=-4;dx<=4;dx++){
    if(dx*dx+dy*dy<=16&&raw[((y+dy)*256+x+dx)*4+3]<220){core=false;break;}
   }
   if(!core)continue;
   const k=(y*256+x)*4,delta=p=>Math.max(...[0,1,2,3].map(c=>Math.abs(p[k+c]-raw[k+c])));
   protectedPixels++;
   assert.ok(delta(actual)<=3,`Leech ${row}/${frame}: ground erases body interior at ${x},${y}`);
   if(delta(bad)>10)rejectedDamage++;
  }
 }
 assert.ok(protectedPixels>500,'body preservation covers substantial opaque interior across all poses');
 assert.ok(rejectedDamage>30,'negative control rejects the reported broad-belly mask');
 console.log(`PASS Leech body: ${protectedPixels} interior pixels preserved across 64 poses; rejected mask damages ${rejectedDamage}`);
})().catch(e=>{console.error(e);process.exitCode=1;});
