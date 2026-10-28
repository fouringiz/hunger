'use strict';
// Offline packing only. Source is the ImageGen separation of the approved concept, kept outside Git.
// node tools/bake-flamethrower.cjs [source.png]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=256;
async function main(){
  const file=path.resolve(process.argv[2]||path.join(ROOT,'reports/generated/flamethrower/flamethrower-parts-v1.png'));
  const im=await loadImage(file),src=createCanvas(im.width,im.height),g=src.getContext('2d');g.drawImage(im,0,0);
  const pixels=g.getImageData(0,0,im.width,im.height).data;
  const columns=new Uint32Array(im.width);
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(pixels[(y*im.width+x)*4+3]>16)columns[x]++;
  // Separators are measured in normalized source coordinates, not assumed equal cells.
  const cut=(a,b)=>{let best=Math.round(a*im.width);for(let x=best;x<Math.round(b*im.width);x++)if(columns[x]<columns[best])best=x;return best;};
  const bounds=[0,cut(.36,.41),cut(.81,.85),im.width],rects=[],sources=[];
  const atlas=createCanvas(CELL*3,CELL),out=atlas.getContext('2d');
  for(let n=0;n<3;n++){
    let l=im.width,r=-1,t=im.height,b=-1;
    for(let y=0;y<im.height;y++)for(let x=bounds[n];x<bounds[n+1];x++)if(pixels[(y*im.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
    if(r<l)throw new Error('Empty component '+n);
    const w=r-l+1,h=b-t+1,s=240/Math.max(w,h),dw=Math.round(w*s),dh=Math.round(h*s),dx=n*CELL+Math.floor((CELL-dw)/2),dy=Math.floor((CELL-dh)/2);
    out.drawImage(src,l,t,w,h,dx,dy,dw,dh);rects.push([dx,dy,dw,dh]);sources.push([l,t,w,h]);
  }
  fs.writeFileSync(path.join(ROOT,'assets/hunger-flamethrower-v1.png'),atlas.toBuffer('image/png'));
  const table={source:path.relative(ROOT,file),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),cell:CELL,parts:['foundation','head','tank'],rects,sources};
  fs.writeFileSync(path.join(ROOT,'assets/hunger-flamethrower-v1.frames.json'),JSON.stringify(table,null,2)+'\n');
  console.log(JSON.stringify(table));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
