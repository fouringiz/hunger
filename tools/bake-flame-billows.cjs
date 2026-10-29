'use strict';
// Offline normalization of the generated eight-phase fire volume. No runtime canvas reads are needed.
// node tools/bake-flame-billows.cjs [source.png]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=128;
async function main(){
  const file=path.resolve(process.argv[2]||path.join(ROOT,'reports/generated/flamethrower/flame-billows-source-v1.png'));
  const im=await loadImage(file),src=createCanvas(im.width,im.height),g=src.getContext('2d');g.drawImage(im,0,0);
  const pixels=g.getImageData(0,0,im.width,im.height).data,specs=[];let radius=0;
  for(let n=0;n<8;n++){
    const x0=Math.round(n%4*im.width/4),x1=Math.round((n%4+1)*im.width/4),y0=Math.round(Math.floor(n/4)*im.height/2),y1=Math.round((Math.floor(n/4)+1)*im.height/2);
    const cx=(x0+x1)/2,cy=(y0+y1)/2;let count=0,solidEdge=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const a=pixels[(y*im.width+x)*4+3];if(a<=4)continue;count++;
      radius=Math.max(radius,Math.abs(x-cx)+1,Math.abs(y-cy)+1);
      if(a>128&&(x===x0||x===x1-1||y===y0||y===y1-1))solidEdge++;
    }
    if(count<100||solidEdge>4)throw new Error('Fire phase '+n+' is empty or its solid silhouette crosses the cell boundary');
    specs.push({x0,y0,w:x1-x0,h:y1-y0,cx,cy,count});
  }
  // One scale and one cell-centre anchor for the whole clip; never resize each phase independently.
  const scale=56/radius,atlas=createCanvas(CELL*4,CELL*2),out=atlas.getContext('2d');
  specs.forEach((s,n)=>out.drawImage(src,s.x0,s.y0,s.w,s.h,n%4*CELL+64-s.w*scale/2,Math.floor(n/4)*CELL+64-s.h*scale/2,s.w*scale,s.h*scale));
  const table={cell:CELL,columns:4,frames:8,anchor:[64,64],source:path.relative(ROOT,file),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),scale,sources:specs};
  fs.writeFileSync(path.join(ROOT,'assets/hunger-flame-billows-v1.png'),atlas.toBuffer('image/png'));
  fs.writeFileSync(path.join(ROOT,'assets/hunger-flame-billows-v1.frames.json'),JSON.stringify(table,null,2)+'\n');
  console.log('Packed eight fire phases, common scale '+scale.toFixed(5)+' -> assets/hunger-flame-billows-v1.png');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
