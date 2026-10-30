'use strict';
// Offline size/atlas normalization of generated sources. No runtime dependencies.
// WORLD_CANVAS_MODULE=/path/to/@napi-rs/canvas node tools/pack-world-details.cjs
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const root=path.join(__dirname,'..');
async function pack(input,output,width,height,crop){
  const source=await loadImage(path.join(root,input)),canvas=createCanvas(width,height),c=canvas.getContext('2d');
  c.drawImage(source,...(crop||[0,0,source.width,source.height]),0,0,width,height);
  const data=canvas.encodeSync('webp',94);fs.writeFileSync(path.join(root,output),data);
  console.log(output+': '+width+'×'+height+', '+data.length+' bytes');
}
(async()=>{
  await pack('assets/art/work/world/lane/organic-lane-material-v1.png','assets/runtime/world/organic-lane-v1.webp',768,768);
  await pack('assets/art/work/world/gate/ancient-gate-ruins-v1.png','assets/runtime/world/ancient-gate-ruins-v1.webp',384,384);
  await pack('assets/art/work/world/gate/ancient-gate-runtime-v6.png','assets/runtime/world/ancient-gate-v6.webp',768,1152);
  await pack('assets/art/work/world/gate/ancient-gate-runtime-v4.png','assets/runtime/world/ancient-gate-v4.webp',512,768);
  await pack('assets/art/work/world/platforms/concrete-platform-runtime-v2.png','assets/runtime/world/concrete-platform-v2.webp',192,224,[150,80,960,1100]);
})().catch(e=>{console.error(e);process.exitCode=1;});
