'use strict';
// Adds back shading volume before the palette grade: an asymmetric unsharp mask on the value channel (shadows deepen more
// than highlights brighten), weighted by alpha so the transparent background leaves no halo. Hue, saturation and alpha are
// untouched. Run it on the ungraded atlas, then tools/grade-level4-atlas.cjs. Usage: node tools/level4-local-contrast.cjs [amount] [radius]
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),ATLAS=path.join(ROOT,'assets/hunger-level4-towers-v2.png'),RECORD=path.join(ROOT,'assets/art/level4-palette-grade.json');
function boxBlur(src,w,h,r){const tmp=new Float32Array(w*h),out=new Float32Array(w*h);
  for(let y=0;y<h;y++){let s=0;for(let x=-r;x<=r;x++)s+=src[y*w+Math.min(w-1,Math.max(0,x))];
    for(let x=0;x<w;x++){tmp[y*w+x]=s/(2*r+1);s+=src[y*w+Math.min(w-1,x+r+1)]-src[y*w+Math.max(0,x-r)];}}
  for(let x=0;x<w;x++){let s=0;for(let y=-r;y<=r;y++)s+=tmp[Math.min(h-1,Math.max(0,y))*w+x];
    for(let y=0;y<h;y++){out[y*w+x]=s/(2*r+1);s+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.max(0,y-r)*w+x];}}
  return out;}
(async()=>{
  const amount=Number(process.argv[2]||.8),radius=Number(process.argv[3]||8);
  const record=fs.existsSync(RECORD)?JSON.parse(fs.readFileSync(RECORD,'utf8')):{foundation:null,rows:{}};
  if(record.localContrast||Object.keys(record.rows||{}).length)throw new Error('run on the ungraded atlas: restore it from git and clear the grade record first');
  const img=await loadImage(ATLAS),c=createCanvas(img.width,img.height),g=c.getContext('2d');g.drawImage(img,0,0);
  const id=g.getImageData(0,0,c.width,c.height),d=id.data,w=c.width,h=c.height,n=w*h,va=new Float32Array(n),a=new Float32Array(n);
  for(let i=0;i<n;i++){const k=i*4,al=d[k+3]/255;a[i]=al;va[i]=Math.max(d[k],d[k+1],d[k+2])/255*al;}
  const bva=boxBlur(boxBlur(va,w,h,radius),w,h,radius),ba=boxBlur(boxBlur(a,w,h,radius),w,h,radius);
  for(let i=0;i<n;i++){const k=i*4;if(!d[k+3])continue;const mx=Math.max(d[k],d[k+1],d[k+2]);if(!mx)continue;
    const v=mx/255,local=ba[i]>1e-4?bva[i]/ba[i]:v,diff=v-local,nv=Math.max(.02,Math.min(1,v+(diff<0?amount*diff:0))),f=nv/v;
    for(let j=0;j<3;j++)d[k+j]=Math.min(255,Math.round(d[k+j]*f));}
  g.putImageData(id,0,0);fs.writeFileSync(ATLAS,c.toBuffer('image/png'));
  record.localContrast={amount,radius,order:'before the palette grade'};record.rows={};fs.mkdirSync(path.dirname(RECORD),{recursive:true});fs.writeFileSync(RECORD,JSON.stringify(record,null,2)+'\n');
  console.log('local contrast applied: amount',amount,'radius',radius);
})().catch(e=>{console.error(e);process.exitCode=1;});
