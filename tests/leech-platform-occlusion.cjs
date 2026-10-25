'use strict';
const assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
 for(const zone of ['mire','ember']){
  const {run,canvas,images}=await loadWorld({zone});
  run("reset();S.phase='wave';S.spawnQueue=[];draw();var probe=makeEnemy('leech',1);probe.state='seek';probe.gen={x:600,y:227};probe.d=500;var originalOccluders=leechPlatformOccluders;");
  const slot=JSON.parse(run('JSON.stringify(SLOTS[2])')),g=canvas.getContext('2d');
  const plate=createCanvas(canvas.width,canvas.height),pg=plate.getContext('2d');pg.scale(2,2);
  pg.drawImage(images.platformDetailArt,0,0,192,156,slot.x-27,slot.y-23,54,41);
  const mask=pg.getImageData(0,0,plate.width,plate.height).data;
  for(const k of [.92,1,1.08])for(const [name,x,y]of [['behind',slot.x,slot.y+27],['side',slot.x-32,slot.y+27],['front',slot.x,slot.y+44]]){
   run(`probe.x=${x};probe.y=${y};probe.__k=${k};`);
   const signature=run('replaySignature()');
   const paint=enabled=>{
    run(`leechPlatformOccluders=${enabled?'originalOccluders':'()=>[]'};ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,W,H);enemyArt(probe);`);
    return Buffer.from(g.getImageData(0,0,canvas.width,canvas.height).data);
   };
   const bad=paint(false),actual=paint(true);
   assert.equal(run('replaySignature()'),signature,'occlusion cannot change combat state');
   if(name==='front'){assert.ok(actual.equals(bad),'a foreground Leech must stay in front of the platform');continue;}
   let covered=0,visibleOutside=0;
   for(let py=Math.floor((slot.y-30)*2);py<(slot.y+40)*2;py++)for(let px=Math.floor((slot.x-85)*2);px<(slot.x+65)*2;px++){
    const index=(py*canvas.width+px)*4;if(bad[index+3]<220)continue;
    let solid=true;
    for(let dy=-2;dy<=2&&solid;dy++)for(let dx=-2;dx<=2;dx++)if(mask[((py+dy)*canvas.width+px+dx)*4+3]<245){solid=false;break;}
    if(solid){covered++;assert.ok(actual[index+3]<=20,`${zone} ${name} scale ${k}: Leech remains on platform top at ${px},${py}`);}
    else if(mask[index+3]===0&&actual[index+3]>180)visibleOutside++;
   }
   assert.ok(covered>20,'negative control: previous drawing has opaque Leech pixels over the slab');
   if(name==='side')assert.ok(visibleOutside>20,'body outside the platform remains visible');
  }
 }
 console.log('PASS Leech platform depth: slab hides body behind it, side remains visible, foreground unchanged; both zones and three scales');
})().catch(e=>{console.error(e);process.exitCode=1;});
