'use strict';
// Offline packaging only. Runtime has no dependency on the Canvas library.
// Usage: WORLD_CANVAS_MODULE=/path/to/@napi-rs/canvas node tools/pack-world-materials.cjs mire.png ember.png stone.png
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
async function pack(input,name,size){
  const source=await loadImage(input),canvas=createCanvas(size,size),c=canvas.getContext('2d');
  c.drawImage(source,0,0,size,size);
  // Make opposing edges periodic without mirroring the entire material into a visible fourfold pattern.
  const image=c.getImageData(0,0,size,size),before=new Uint8ClampedArray(image.data),band=16;
  for(let y=0;y<size;y++)for(let x=0;x<band;x++)for(let k=0;k<3;k++){
    const left=(y*size+x)*4+k,right=(y*size+size-1-x)*4+k,m=(before[left]+before[right])/2,w=1-x/band;
    image.data[left]=before[left]*(1-w)+m*w;image.data[right]=before[right]*(1-w)+m*w;
  }
  before.set(image.data);
  for(let y=0;y<band;y++)for(let x=0;x<size;x++)for(let k=0;k<3;k++){
    const top=(y*size+x)*4+k,bottom=((size-1-y)*size+x)*4+k,m=(before[top]+before[bottom])/2,w=1-y/band;
    image.data[top]=before[top]*(1-w)+m*w;image.data[bottom]=before[bottom]*(1-w)+m*w;
  }
  c.putImageData(image,0,0);
  const out=path.join(__dirname,'../assets/runtime/world',name),data=canvas.encodeSync('webp',88);fs.writeFileSync(out,data);
  console.log(name+': '+size+'×'+size+', '+data.length+' bytes');
}
async function main(){
  const args=process.argv.slice(2);if(args.length!==3)throw new Error('Supply mire, ember and stone source paths.');
  await pack(args[0],'world-mire-v1.webp',512);
  await pack(args[1],'world-ember-v1.webp',512);
  await pack(args[2],'ancient-stone-v1.webp',256);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
