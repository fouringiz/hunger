'use strict';
// Pack a generated six-stage lifecycle with one common scale; growth must not be normalized away.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=256;
async function main(){
  const file=path.resolve(process.argv[2]||path.join(ROOT,'reports/generated/flamethrower/smoke-six-source-v1.png'));
  const im=await loadImage(file),src=createCanvas(im.width,im.height),g=src.getContext('2d');g.drawImage(im,0,0);
  const data=g.getImageData(0,0,im.width,im.height),p=data.data,columns=new Uint32Array(im.width);
  if(p[3]!==0)throw new Error('Smoke source requires real transparent alpha');
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(p[(y*im.width+x)*4+3]>4)columns[x]++;
  // The generator laid the growing stages at unequal centres. Cut in the measured transparent gaps.
  const windows=[[.09,.16,.115],[.23,.3,.26],[.41,.48,.445],[.61,.69,.64],[.81,.87,.84]],cuts=[0];
  for(const [a,b,target]of windows){
    let best=Math.round(target*im.width),cost=Infinity;
    for(let x=Math.round(a*im.width);x<Math.round(b*im.width);x++){
      const occupied=(columns[x-1]||0)+columns[x]+(columns[x+1]||0),score=occupied*1000+Math.abs(x-target*im.width);
      if(score<cost){cost=score;best=x;}
    }
    if(columns[best]>0)throw new Error('Smoke stages must be separated by transparent columns');cuts.push(best);
  }
  cuts.push(im.width);const specs=[];let radius=0;
  // Export density falls during dissipation; preserve soft source alpha rather than replacing it with a mask.
  const caps=[255,255,255,220,150,64];
  for(let n=0;n<6;n++){
    let l=im.width,r=-1,t=im.height,b=-1;const alphas=[];
    for(let y=0;y<im.height;y++)for(let x=cuts[n];x<cuts[n+1];x++)if(p[(y*im.width+x)*4+3]>4){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);alphas.push(p[(y*im.width+x)*4+3]);}
    if(r<l)throw new Error('Empty smoke frame '+n);
    alphas.sort((a,b)=>a-b);const coreAlpha=alphas[Math.floor(alphas.length*.9)],opacity=Math.min(1,caps[n]/coreAlpha);
    const w=r-l+1,h=b-t+1;radius=Math.max(radius,w/2,h/2);
    specs.push({rect:[l,t,w,h],centre:[l+w/2,t+h/2],coreAlpha,opacity});
  }
  const scale=112/radius,out=createCanvas(CELL*6,CELL),ctx=out.getContext('2d');
  specs.forEach((s,n)=>{const [x,y,w,h]=s.rect;ctx.save();ctx.beginPath();ctx.rect(n*CELL,0,CELL,CELL);ctx.clip();ctx.globalAlpha=s.opacity;
    ctx.drawImage(src,x,y,w,h,n*CELL+128-w*scale/2,128-h*scale/2,w*scale,h*scale);ctx.restore();});
  fs.writeFileSync(path.join(ROOT,'assets/runtime/towers/flamethrower-smoke-v1.png'),out.toBuffer('image/png'));
  fs.writeFileSync(path.join(ROOT,'assets/runtime/towers/flamethrower-smoke-v1.frames.json'),JSON.stringify({columns:6,frames:6,cell:[CELL,CELL],anchor:[128,128],lifecycle:'birth-growth-dissipation; not a looping clip',scale,source:path.relative(ROOT,file),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),cuts,sources:specs,status:'source sheet; runtime integration and motion review pending'},null,2)+'\n');
  const preview=createCanvas(out.width,out.height),v=preview.getContext('2d');v.fillStyle='#8a929a';v.fillRect(0,0,out.width,out.height);v.drawImage(out,0,0);
  fs.writeFileSync(path.join(ROOT,'reports/generated/flamethrower/smoke-six-preview-v1.png'),preview.toBuffer('image/png'));
  console.log('Packed six 256x256 smoke stages at a common scale '+scale.toFixed(5)+', shared centre (128,128). Export alpha multipliers: '+specs.map(s=>s.opacity.toFixed(3)).join(', '));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
