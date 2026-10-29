'use strict';
// Offline asset packing only. Source drafts stay in ignored reports/generated/.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),DIR=path.join(ROOT,'reports/generated/level4-review/sources');
async function main(){
 // The former overhead level-four atlas is retired. Only the neutral coil remains.
 if(!process.argv.includes('--neutral'))throw Error('Use --neutral, or bake-level4-poses.cjs for directional level-four art');
 const neutral=true,name='voltaic-neutral',file=path.join(DIR,name+'.png');
 const im=await loadImage(file),canvas=createCanvas(256,256),g=canvas.getContext('2d');
 const specs=[{key:'voltaic-neutral',box:[350,120,620,954],width:32*620/954,pivot:[660,950],tip:[660,215]}];
 const entries=specs.map((s,i)=>{
  const [x,y,w,h]=s.box,scale=Math.min(224/w,224/h,120/(s.pivot[0]-x),120/(x+w-s.pivot[0]),...(neutral?[]:[112/(s.pivot[1]-y),112/(y+h-s.pivot[1])])),dx=128-(s.pivot[0]-x)*scale,dy=neutral?8:128-(s.pivot[1]-y)*scale;
  const rect=[i%3*256,Math.floor(i/3)*256,256,256];
  g.drawImage(im,x,y,w,h,rect[0]+dx,rect[1]+dy,w*scale,h*scale);
  const bearing=neutral?[128,dy+(s.pivot[1]-y)*scale]:[128,128];
  return {key:s.key,rect,size:s.width/(w*scale)*256,bearing,muzzle:[dx+(s.tip[0]-x)*scale,dy+(s.tip[1]-y)*scale],sourceBox:s.box,sourcePivot:s.pivot};
 });
 const target=path.join(ROOT,'assets/hunger-'+name+'-v1');
 fs.writeFileSync(target+'.png',canvas.toBuffer('image/png'));
 fs.writeFileSync(target+'.frames.json',JSON.stringify({width:canvas.width,height:canvas.height,cell:256,sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),entries},null,2)+'\n');
 console.log('Packed '+target+'.png');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
