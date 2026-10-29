'use strict';
// Export four generated steady-state jets into equal cells with the exact same left-edge emission anchor.
// Asset packing only; does not connect the sheet to gameplay or establish loop approval.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CW=512,CH=256,ANCHOR=128;
async function main(){
  const file=path.resolve(process.argv[2]||path.join(ROOT,'reports/generated/flamethrower/flame-jet-four-source-v1.png'));
  const im=await loadImage(file),src=createCanvas(im.width,im.height),g=src.getContext('2d');g.drawImage(im,0,0);
  const p=g.getImageData(0,0,im.width,im.height).data,specs=[];let span=0,up=0,down=0;
  if(p[3]!==0)throw new Error('The source must have genuine transparent alpha');
  for(let n=0;n<4;n++){
    const x0=Math.round(n*im.width/4),x1=Math.round((n+1)*im.width/4);
    let l=x1,r=x0,t=im.height,b=0;
    for(let y=0;y<im.height;y++)for(let x=x0;x<x1;x++)if(p[(y*im.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
    if(r<=l)throw new Error('Empty frame '+n);
    // Sample only the narrow emitting tip, never the bright cores farther along the flame.
    let weight=0,sy=0;
    for(let x=l;x<=Math.min(l+8,r);x++)for(let y=t;y<=b;y++){
      const k=(y*im.width+x)*4,w=p[k+3]*(p[k]+p[k+1]+p[k+2]);sy+=y*w;weight+=w;
    }
    const cy=sy/weight;span=Math.max(span,r+1-l);up=Math.max(up,cy-t);down=Math.max(down,b+1-cy);
    specs.push({source:[x0,0,x1-x0,im.height],emission:[l,cy],bounds:[l,t,r+1,b+1]});
  }
  const scale=Math.min(460/span,115/up,115/down),out=createCanvas(CW*4,CH),ctx=out.getContext('2d');
  specs.forEach((s,n)=>{const [x,y,w,h]=s.source;ctx.save();ctx.beginPath();ctx.rect(n*CW,0,CW,CH);ctx.clip();
    ctx.drawImage(src,x,y,w,h,n*CW+(x-s.emission[0])*scale,ANCHOR-s.emission[1]*scale,w*scale,h*scale);ctx.restore();});
  fs.writeFileSync(path.join(ROOT,'assets/hunger-flamethrower-jet-v1.png'),out.toBuffer('image/png'));
  fs.writeFileSync(path.join(ROOT,'assets/hunger-flamethrower-jet-v1.frames.json'),JSON.stringify({columns:4,frames:4,cell:[CW,CH],anchor:[0,ANCHOR],scale,source:path.relative(ROOT,file),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sources:specs,status:'source sheet; not integrated or loop-approved'},null,2)+'\n');
  console.log('Packed assets/hunger-flamethrower-jet-v1.png: 2048x256 RGBA, four 512x256 cells, common scale '+scale.toFixed(5)+', shared emission anchor (0,128).');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
