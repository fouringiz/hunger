'use strict';
// Offline asset packing only; does not run the game or verification.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..');
(async()=>{
 const file='assets/art/references/towers/tesla-level4-approved-v2.png',im=await loadImage(path.join(ROOT,file));
 const c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
 const data=g.getImageData(0,0,c.width,c.height).data;
 let l=c.width,t=c.height,r=0,b=0;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>=64){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 const w=r-l+1,h=b-t+1,k=Math.min(224/w,224/h),x=128-w*k/2,y=240-h*k;
 const out=createCanvas(256,256);out.getContext('2d').drawImage(im,l,t,w,h,x,y,w*k,h*k);
 const point=(u,v)=>[+(x+u*w*k).toFixed(4),+(y+v*h*k).toFixed(4)];
 const spec={key:'tesla',type:'voltaic',branch:'A',row:0,size:48,tips:[point(.67,.27)],seats:[[128,235]],
   source:file,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex'),sourceBox:[l,t,w,h],rect:[0,0,256,256],
   rings:[point(.5,.51),point(.5,.62)],rim:[point(.3,.19),point(.7,.24)]};
 fs.writeFileSync(path.join(ROOT,'assets/runtime/towers/tesla-toroid-v1.png'),out.toBuffer('image/png'));
 fs.writeFileSync(path.join(ROOT,'assets/runtime/towers/tesla-toroid-v1.frames.json'),JSON.stringify(spec,null,2)+'\n');
 console.log(JSON.stringify(spec));
})().catch(e=>{console.error(e);process.exitCode=1;});
