'use strict';
// Articulate the approved creature's three real limbs, mirrored into two alternating tripods.
// The heading master stays above their roots; no generated anatomy or new runtime effect.
const {createCanvas,loadImage}=require(process.env.FORAGER_CANVAS_MODULE||'@napi-rs/canvas');
const {LEGS}=require('./bake-forager-mire.cjs');
const path=require('node:path');
const ROWS=[3,4,5,11,12,13];
const clamp=x=>Math.max(0,Math.min(1,x));
function footPose(phase){
 const q=(phase%1+1)%1,duty=.625;
 if(q<duty)return {advance:72*(.5-q/duty),lift:0,planted:true};
 const t=(q-duty)/(1-duty);
 return {advance:72*(-.5+t*t*(3-2*t)),lift:16*Math.sin(Math.PI*t),planted:false};
}
async function loadLimbs(root){
 const source=await loadImage(path.join(root,'assets/art/references/enemies/forager/forager-approved-v1.webp'));
 return LEGS.map(leg=>{
  const xs=leg.polygon.map(p=>p[0]),ys=leg.polygon.map(p=>p[1]);
  const box={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs)+1,h:Math.max(...ys)-Math.min(...ys)+1};
  const texture=createCanvas(box.w,box.h),c=texture.getContext('2d');
  c.beginPath();leg.polygon.forEach(([x,y],i)=>i?c.lineTo(x-box.x,y-box.y):c.moveTo(x-box.x,y-box.y));c.closePath();c.clip();
  c.drawImage(source,-box.x,-box.y);
  return {...leg,box,texture};
 });
}
function drawLimbs(c,limbs,{frame,heading,point,triangle}){
 const contacts=[],phase=frame===0?0:(frame-1)/8;
 for(const side of [-1,1])for(let index=0;index<3;index++){
  const leg=limbs[index],pose=frame===0?{advance:0,lift:0}:footPose(phase+(index===1?.5:0)+(side>0?.5:0));
  const root=[96+side*(34-index*2),72+index*21];
  const foot=[96+side*[60,66,58][index],[86,112,138][index]];
  const shift=[Math.cos(heading)*pose.advance*.5,Math.sin(heading)*pose.advance-pose.lift];
  const [rx,ry]=leg.root,[fx,fy]=leg.foot,dx=fx-rx,dy=fy-ry,L=Math.hypot(dx,dy);
  const targetLength=Math.hypot(foot[0]-root[0],foot[1]-root[1]);
  const normal=[-(foot[1]-root[1])/targetLength,(foot[0]-root[0])/targetLength];
  const project=(x,y)=>{
   const px=x+leg.box.x-rx,py=y+leg.box.y-ry;
   const t=(px*dx+py*dy)/(L*L),perp=(-px*dy+py*dx)/L;
   const weight=clamp(t)**2*(3-2*clamp(t));
   return point(root[0]+(foot[0]-root[0])*t+normal[0]*perp*.215+shift[0]*weight+side*Math.sin(Math.PI*clamp(t))*pose.lift*.25,
    root[1]+(foot[1]-root[1])*t+normal[1]*perp*.215+shift[1]*weight);
  };
  for(let j=0;j<8;j++)for(let i=0;i<6;i++){
   const x=i*leg.box.w/6,y=j*leg.box.h/8,w=leg.box.w/6,h=leg.box.h/8;
   const src=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],dst=src.map(p=>project(...p));
   triangle(c,leg.texture,[src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);
   triangle(c,leg.texture,[src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);
  }
  contacts.push(point(foot[0]+shift[0],foot[1]+shift[1]).map(v=>+v.toFixed(3)));
 }
 return contacts;
}
function torso(texture,back){
 const core=back?[[96,22],[122,40],[137,62],[140,80],[135,103],[125,116],[114,132],[96,143],[78,132],[66,116],[57,103],[52,80],[55,62],[69,40]]:
  [[96,30],[124,44],[143,62],[146,85],[135,100],[127,116],[126,147],[107,144],[96,131],[78,147],[72,122],[57,106],[47,85],[47,62],[63,45]];
 const out=createCanvas(192,192),c=out.getContext('2d');c.beginPath();core.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.drawImage(texture,0,0);return out;
}
module.exports={ROWS,footPose,loadLimbs,drawLimbs,torso};
