'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(process.env.FORAGER_CANVAS_MODULE||'@napi-rs/canvas');
const ROWS=[3,4,5,11,12,13],CELL=192;
async function loadCycles(root){
 const cycles=[];
 for(const view of ['front','rear']){
  const im=await loadImage(path.join(root,'assets/art/work/enemies/forager/forager-vertical-'+view+'-cycle-v1.webp'));
  assert.equal(im.width%3,0);assert.equal(im.height%3,0);
  const size=im.width/3,frames=[];
  for(let frame=0;frame<9;frame++){
   const c=createCanvas(size,size),g=c.getContext('2d');g.drawImage(im,frame%3*size,Math.floor(frame/3)*size,size,size,0,0,size,size);
   const pixels=g.getImageData(0,0,size,size).data;
   let l=size,r=0,t=size,b=0,coreTop=size;
   for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(pixels[(y*size+x)*4+3]>128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);if(Math.abs(x-size/2)<size*.14)coreTop=Math.min(coreTop,y);}
   assert.ok(l>1&&r<size-2&&t>1&&b<size-2,'source silhouette stays inside cell '+view+'/'+frame);
   // Center on the upper carapace, not a swinging claw or the changing full bounding box.
   let center=0,samples=0;
   for(let y=coreTop+8;y<coreTop+48;y++){
    let a=size,z=0;for(let x=0;x<size;x++)if(pixels[(y*size+x)*4+3]>160){a=Math.min(a,x);z=Math.max(z,x);}
    if(z>a){center+=(a+z)/2;samples++;}
   }
   frames.push({image:c,left:l,right:r,top:t,bottom:b,anchorX:center/samples,anchorY:coreTop});
  }
  cycles.push(frames);
 }
 // One scale for all eighteen cells. Never inflate individual frames to fill a slot.
 const all=cycles.flat(),scale=Math.min(154/Math.max(...all.map(f=>f.right-f.left+1)),148/Math.max(...all.map(f=>f.bottom-f.top+1)));
 return cycles.map((frames,view)=>frames.map(f=>{
  const out=createCanvas(CELL,CELL),g=out.getContext('2d');g.imageSmoothingQuality='high';
  g.drawImage(f.image,96-f.anchorX*scale,(view===0?32:28)-f.anchorY*scale,f.image.width*scale,f.image.height*scale);
  return out;
 }));
}
function contacts(cell){
 const data=cell.getContext('2d').getImageData(0,0,CELL,CELL).data,feet=[];
 // Two visible claw tips per side in these foreshortened views; occluded roots are not fake contacts.
 for(const [lo,hi]of [[5,72],[120,187]])for(const [top,bottom]of [[60,111],[112,183]]){
  let best=null;
  for(let y=top;y<=bottom;y++)for(let x=lo;x<=hi;x++)if(data[(y*CELL+x)*4+3]>128){
   if(!best||y>best[1]||y===best[1]&&Math.abs(x-96)>Math.abs(best[0]-96))best=[x,y];
  }
  assert.ok(best,'visible claw in each contact band');feet.push(best);
 }
 return feet;
}
module.exports={ROWS,loadCycles,contacts};
