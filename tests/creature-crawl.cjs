'use strict';
const assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas'),{loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
 const {run,images}=await loadWorld();
 for(const [type,art]of [['carapacid',images.carapacidShelterArt],['leech',images.leechMireArt]]){
  const directions=type==='leech'?16:4;assert.equal(art.width,1024);assert.equal(art.height,256*directions);
  const c=createCanvas(1024,256*directions),g=c.getContext('2d');g.drawImage(art,0,0);const data=g.getImageData(0,0,1024,256*directions).data;
  for(let row=0;row<directions;row++)for(let f=0;f<4;f++){
   let diff=0,count=0,opaque=0;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const a=((row*256+y)*1024+f*256+x)*4,b=((row*256+y)*1024+(f+1)%4*256+x)*4;
    if(data[a+3]>100)opaque++;
    assert.ok(y<210||data[a+3]<20,'ground anchor has no opaque pixels below the feet/belly');
    if(y>=145&&(data[a+3]>100||data[b+3]>100)){diff+=Math.abs(data[a+3]-data[b+3])+Math.abs(data[a]-data[b]);count++;}
   }
   assert.ok(opaque>5000,'complete creature in every frame');assert.ok(diff/count>8,`${type} direction ${row}, frame ${f}: real foot/belly motion, not duplicate poses`);
  }
  run(`reset();const e_${type}=makeEnemy('${type}',1);e_${type}.d=0;e_${type}.x=100;e_${type}.y=100;`);
  const obj='e_'+type,first=run(`JSON.stringify(creatureCrawlPose(${obj},0))`);
  run('presentationTime+=100;');assert.equal(run(`JSON.stringify(creatureCrawlPose(${obj},0))`),first,'elapsed time does not walk a stationary body');
  const frames=new Set();for(let d=0;d<28;d+=2){run(`${obj}.d=${d};`);frames.add(run(`creatureCrawlPose(${obj},0).frame`));}assert.equal(frames.size,4,'distance plays every cycle frame');
  const still=run(`creatureCrawlPose(${obj},0).frame`);for(let i=0;i<10;i++)assert.equal(run(`creatureCrawlPose(${obj},0).frame`),still,'extra redraws do not advance feet');
  if(type==='leech'){
   run(`${obj}.state='seek';creatureCrawlPose(${obj},0);`);const before=run(`creatureCrawlPose(${obj},0).distance`);
   run(`${obj}.x+=6;`);assert.equal(run(`creatureCrawlPose(${obj},0).distance`)-before,6,'off-route hunting uses actual travel');
  }
 }
 console.log('PASS creature atlases (Carapacid 4 directions, Leech 16): real motion in every direction, fixed ground baseline, distance-driven cycles and stationary holds');
})().catch(e=>{console.error(e);process.exitCode=1});
