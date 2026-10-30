'use strict';
// Offline packing only. Whole-sheet ImageGen drafts remain under ignored reports/generated.
// node tools/bake-level4-poses.cjs <source directory with manifest.json and six PNGs>
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=256,BEARING=[128,220];
function largest(p,w,h){
 const seen=new Uint8Array(w*h);let best=[];
 for(let n=0;n<w*h;n++){
  if(seen[n]||p[n*4+3]<64)continue;
  const stack=[n],pixels=[];seen[n]=1;
  while(stack.length){const q=stack.pop(),x=q%w,y=Math.floor(q/w);pixels.push(q);
   for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,j=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[j]&&p[j*4+3]>=64){seen[j]=1;stack.push(j);}}}
  if(pixels.length>best.length)best=pixels;
 }
 if(best.length<1000)throw Error('Missing isolated sprite');
 let l=w,r=0,t=h,b=0;for(const n of best){const x=n%w,y=Math.floor(n/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 return{pixels:best,l,r,t,b};
}
async function bake(dir){
 const old=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/art/work/towers/level4-towers-v1.frames.json'))),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),oldImage=await loadImage(path.join(ROOT,'assets/art/work/towers/level4-towers-v1.png'));
 const atlas=createCanvas(4096,2048),g=atlas.getContext('2d'),entries=[];
 for(const e of old.entries){
  if(e.frames.length===1){const f=e.frames[0],rect=[0,e.row*CELL,CELL,CELL];g.drawImage(oldImage,...f.rect,...rect);entries.push({...e,frames:[{...f,rect}],provenance:'Unchanged fixed Tesla/Cluster pixels from v1'});continue;}
  const spec=manifest[e.key];if(!spec||spec.frames.length!==16)throw Error(e.key+': 16 authored bearing/muzzle anchors required');
  const file=path.join(dir,e.key+'.png'),im=await loadImage(file),sw=im.width/4,sh=im.height/4,cw=Math.round(sw),ch=Math.round(sh);
  const parts=[];
  for(let i=0;i<16;i++){
   const c=createCanvas(cw,ch),q=c.getContext('2d');q.drawImage(im,i%4*sw,Math.floor(i/4)*sh,sw,sh,0,0,cw,ch);
   const data=q.getImageData(0,0,cw,ch),part=largest(data.data,cw,ch),anchors=spec.frames[i];
   if(!anchors.bearing||!anchors.muzzle)throw Error(e.key+' '+i+': missing authored anchors');
   // Keep the largest connected silhouette and a one-pixel alpha skirt, not background debris.
   const keep=new Uint8Array(cw*ch);for(const n of part.pixels){keep[n]=1;for(const d of[-cw,-1,1,cw])if(n+d>=0&&n+d<keep.length)keep[n+d]=1;}
   for(let n=0;n<keep.length;n++)if(!keep[n])data.data[n*4+3]=0;
   q.putImageData(data,0,0);parts.push({...part,c,...anchors});
  }
  // One physical scale for the whole turntable; no frame-wise bounding-box resizing.
  const scale=Math.min(...parts.map(p=>Math.min(120/Math.max(1,p.bearing[0]-p.l),120/Math.max(1,p.r-p.bearing[0]),208/Math.max(1,p.bearing[1]-p.t),28/Math.max(1,p.b-p.bearing[1]))));
  const maxHeight=Math.max(...parts.map(p=>p.bearing[1]-p.t)),renderSize=spec.height/maxHeight/scale*CELL;
  const frames=parts.map((p,i)=>{const rect=[i*CELL,e.row*CELL,CELL,CELL],x=BEARING[0]-p.bearing[0]*scale,y=BEARING[1]-p.bearing[1]*scale;
   g.drawImage(p.c,rect[0]+x,rect[1]+y,cw*scale,ch*scale);
   return{rect,bearing:BEARING.slice(),anchor:BEARING.slice(),muzzle:p.muzzle.map((v,k)=>+(BEARING[k]+(v-p.bearing[k])*scale).toFixed(5)),sourceBearing:p.bearing,sourceMuzzle:p.muzzle,sourceBox:[p.l,p.t,p.r-p.l+1,p.b-p.t+1],yaw:i*Math.PI/8};});
  entries.push({...e,renderSize,frames,source:path.relative(ROOT,file),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
 }
 const table={cell:CELL,width:4096,height:2048,headings:Array.from({length:16},(_,i)=>i*22.5),entries};
 fs.writeFileSync(path.join(ROOT,'assets/runtime/towers/level4-towers-v2.png'),atlas.toBuffer('image/png'));
 fs.writeFileSync(path.join(ROOT,'assets/runtime/towers/level4-towers-v2.frames.json'),JSON.stringify(table,null,2)+'\n');
 const runtime=entries.map(e=>({key:e.key,type:e.type,branch:e.branch,row:e.row,size:e.renderSize,tips:e.frames.map(f=>f.muzzle),seats:e.frames.map(f=>f.bearing)}));
 fs.writeFileSync(path.join(dir,'runtime-table.json'),JSON.stringify(runtime));
 console.log('Packed 98 poses into v2 4096x2048; generated art still requires actual-game review.');
}
if(require.main===module)bake(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={bake,largest};
