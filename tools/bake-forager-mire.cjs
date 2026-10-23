// Offline bitmap normalization/animation only; no dependency is loaded by the game.
'use strict';
const fs=require('node:fs'),path=require('node:path');
let canvasModule;try{canvasModule=require(process.env.FORAGER_CANVAS_MODULE||'@napi-rs/canvas');}
catch(_){throw new Error('Provide @napi-rs/canvas through FORAGER_CANVAS_MODULE to rebuild art. The game needs no package.');}
const {createCanvas,loadImage}=canvasModule,ROOT=path.join(__dirname,'..');
const CELL=192,DIRECTIONS=16,FRAMES=13,SCALE=.07,ORIGIN=[910,710],STRIDE=280,DUTY=.72,DEPTH=.42;
// Coordinates in the unchanged 1536×1024 approved anatomy master.
const LEGS=[
 {root:[799,407],foot:[550,636],offset:0,polygon:[[793,380],[816,416],[789,452],[743,490],[733,521],[738,560],[766,609],[786,646],[759,655],[727,630],[708,601],[681,586],[647,595],[619,607],[592,620],[565,641],[540,655],[509,679],[477,668],[455,647],[461,619],[468,580],[488,561],[518,549],[551,550],[584,531],[608,485],[623,463],[645,450],[681,443],[712,424],[750,402]]},
 {root:[1008,486],foot:[1020,810],offset:.67,polygon:[[1018,470],[1042,490],[1037,515],[1004,558],[966,590],[955,629],[964,659],[994,700],[1025,750],[1040,791],[1035,828],[1020,824],[1001,796],[976,773],[944,758],[920,739],[885,734],[858,717],[826,697],[805,677],[795,651],[803,626],[832,604],[847,577],[871,554],[906,532],[956,510],[991,491]]},
 {root:[1170,530],foot:[1300,910],offset:.33,polygon:[[1200,511],[1228,534],[1219,564],[1205,592],[1204,627],[1223,659],[1247,684],[1276,706],[1294,730],[1312,767],[1325,809],[1328,854],[1322,892],[1310,929],[1295,949],[1283,942],[1282,918],[1264,894],[1241,874],[1214,855],[1187,839],[1164,823],[1137,814],[1111,797],[1093,779],[1088,748],[1100,722],[1112,707],[1098,685],[1070,668],[1048,646],[1028,615],[1022,581],[1037,548],[1062,526],[1107,514],[1155,520]]}
];
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function inside(x,y,p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function footPose(phase){const q=(phase%1+1)%1;if(q<DUTY)return {x:STRIDE*(.5-q/DUTY),lift:0,planted:true};const t=(q-DUTY)/(1-DUTY);return {x:STRIDE*(-.5+t*t*(3-2*t)),lift:18*Math.sin(Math.PI*t),planted:false};}
function triangle(c,texture,s,d){
 const [p,q,r]=s,[a,b,f]=d,det=(q[0]-p[0])*(r[1]-p[1])-(r[0]-p[0])*(q[1]-p[1]);if(Math.abs(det)<1e-8)return;
 const A=((b[0]-a[0])*(r[1]-p[1])-(f[0]-a[0])*(q[1]-p[1]))/det;
 const C=((f[0]-a[0])*(q[0]-p[0])-(b[0]-a[0])*(r[0]-p[0]))/det;
 const B=((b[1]-a[1])*(r[1]-p[1])-(f[1]-a[1])*(q[1]-p[1]))/det;
 const D=((f[1]-a[1])*(q[0]-p[0])-(b[1]-a[1])*(r[0]-p[0]))/det;
 // Overlap adjacent triangle clips slightly so antialiasing does not open seams.
 const center=[(a[0]+b[0]+f[0])/3,(a[1]+b[1]+f[1])/3];
 const clip=d.map(v=>{const dx=v[0]-center[0],dy=v[1]-center[1],n=Math.hypot(dx,dy)||1;return [v[0]+dx/n*.65,v[1]+dy/n*.65];});
 c.save();c.beginPath();c.moveTo(...clip[0]);c.lineTo(...clip[1]);c.lineTo(...clip[2]);c.closePath();c.clip();
 c.transform(A,B,C,D,a[0]-A*p[0]-C*p[1],a[1]-B*p[0]-D*p[1]);c.drawImage(texture,0,0,1536,1024);c.restore();
}
function mesh(c,texture,bounds,project,nx=12,ny=8,reverse=false){
 const [x,y,w,h]=bounds;const columns=Array.from({length:nx},(_,i)=>reverse?nx-1-i:i);
 for(const i of columns)for(let j=0;j<ny;j++){
   const s=[[x+i*w/nx,y+j*h/ny],[x+(i+1)*w/nx,y+j*h/ny],[x+(i+1)*w/nx,y+(j+1)*h/ny],[x+i*w/nx,y+(j+1)*h/ny]],d=s.map(p=>project(...p));
   triangle(c,texture,[s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle(c,texture,[s[0],s[2],s[3]],[d[0],d[2],d[3]]);
 }
}
async function bake(){
 const index=process.argv.indexOf('--direction'),onlyDirection=index<0?null:Number(process.argv[index+1]);
 const rows=path.join(ROOT,'reports/generated/forager-mire-rows');fs.mkdirSync(rows,{recursive:true});
 if(onlyDirection===null){
   // Isolate the native rasterizer's temporary mesh allocations by direction.
   // This bounds rebuild memory; the runtime still loads one ordinary WebP atlas.
   const {execFileSync}=require('node:child_process');
   for(let d=0;d<DIRECTIONS;d++)execFileSync(process.execPath,['--expose-gc',__filename,'--direction',String(d)],{stdio:'inherit',env:process.env});
   const packed=createCanvas(CELL*FRAMES,CELL*DIRECTIONS),p=packed.getContext('2d'),sheet=createCanvas(512,512),s=sheet.getContext('2d');s.fillStyle='#24291b';s.fillRect(0,0,512,512);
   for(let d=0;d<DIRECTIONS;d++){const row=await loadImage(path.join(rows,d+'.png'));p.drawImage(row,0,d*CELL);if(d%2===0){const j=d/2;s.drawImage(row,4*CELL,0,CELL,CELL,j%4*128,Math.floor(j/4)*256+38,128,128);s.fillStyle='#d5cfaf';s.font='12px sans-serif';s.fillText(d*22.5+'°',j%4*128+5,Math.floor(j/4)*256+184);}}
   fs.writeFileSync(path.join(ROOT,'assets/hunger-forager-mire-v1.webp'),await packed.encode('webp',85));
   fs.writeFileSync(path.join(ROOT,'reports/generated/forager-runtime-atlas.png'),packed.toBuffer('image/png'));
   fs.writeFileSync(path.join(ROOT,'reports/generated/forager-runtime-directions.png'),sheet.toBuffer('image/png'));
   console.log(`Packed ${DIRECTIONS} directions × ${FRAMES} poses from original source pixels.`);return;
 }
 const source=await loadImage(path.join(ROOT,'assets/art/references/enemies/forager/forager-approved-v1.webp'));
 const matte=await loadImage(path.join(ROOT,'assets/art/sources/forager-matte-v1.png'));
 const W=source.width,H=source.height;const src=createCanvas(W,H),sc=src.getContext('2d');sc.drawImage(source,0,0);
 const pixels=sc.getImageData(0,0,W,H),mc=createCanvas(W,H),mx=mc.getContext('2d');mx.drawImage(matte,0,0,W,H);const mask=mx.getImageData(0,0,W,H).data;
 const images=Array.from({length:4},()=>createCanvas(W,H)),data=images.map(im=>im.getContext('2d').createImageData(W,H));
 const tops=Array(W).fill(H),bottoms=Array(W).fill(0);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const k=(y*W+x)*4,alpha=clamp((mask[k]-85)/100)*255;if(alpha<1)continue;
   let id=0;for(let l=0;l<LEGS.length;l++)if(inside(x+.5,y+.5,LEGS[l].polygon))id=l+1;
   const dst=data[id].data;dst[k]=pixels.data[k];dst[k+1]=pixels.data[k+1];dst[k+2]=pixels.data[k+2];dst[k+3]=alpha;
   if(id===0){tops[x]=Math.min(tops[x],y);bottoms[x]=Math.max(bottoms[x],y);}
 }
 images.forEach((im,i)=>im.getContext('2d').putImageData(data[i],0,0));
 // Shared mip scale prevents high-frequency source pores from aliasing into white noise.
 const textures=images.map(im=>{let current=im;for(const width of [768,384]){const mip=createCanvas(width,width*2/3),m=mip.getContext('2d');m.imageSmoothingEnabled=true;m.imageSmoothingQuality='high';m.drawImage(current,0,0,mip.width,mip.height);current=mip;}return current;});
 function section(x){let top=H,bottom=0;for(let i=Math.max(0,Math.round(x)-35);i<Math.min(W,Math.round(x)+36);i++){if(bottoms[i]>tops[i]){top=Math.min(top,tops[i]);bottom=Math.max(bottom,bottoms[i]);}}
   if(bottom<=top){top=250;bottom=600;}const h=bottom-top,radius=h*.9,height=h*Math.sqrt(1-1.8*DEPTH),base=bottom-radius*DEPTH;return {x,top,bottom,radius,height,base};}
 function surface(sec,y){const target=clamp((y-sec.top)/(sec.bottom-sec.top))*(sec.bottom-sec.top)+sec.top-sec.base;let lo=-Math.atan(sec.radius*DEPTH/sec.height),hi=Math.PI/2;
   for(let i=0;i<16;i++){const mid=(lo+hi)/2,v=sec.radius*Math.sin(mid)*DEPTH-sec.height*Math.cos(mid);if(v<target)lo=mid;else hi=mid;}
   const phi=(lo+hi)/2;return {v:sec.radius*Math.sin(phi),z:sec.height*Math.cos(phi)};}
 function bodyPoint(sec,y,angle,sign,wave=0){const q=surface(sec,y),u=sec.x-ORIGIN[0]+wave,ca=Math.cos(angle),sa=Math.sin(angle),offset=sec.base-ORIGIN[1]-(sec.x-ORIGIN[0])*.25;
   return [64+SCALE*(u*ca-sign*q.v*sa),87+SCALE*(u*.25*ca+u*sa*DEPTH+offset+sign*q.v*ca*DEPTH-q.z)];}
 const sections=Array.from({length:17},(_,i)=>section(300+i*1230/16));
 const wet=createCanvas(256,256),wc=wet.getContext('2d'),tile=createCanvas(128,128),tc=tile.getContext('2d');
 tc.drawImage(source,40,340,240,180,0,0,128,128);
 const wd=tc.getImageData(0,0,128,128);for(let k=0;k<wd.data.length;k+=4){const r=wd.data[k],g=wd.data[k+1],b=wd.data[k+2],l=.25*r+.6*g+.15*b;wd.data[k]=18+l*.20+r*.02;wd.data[k+1]=20+l*.20+g*.02;wd.data[k+2]=12+l*.13+b*.02;}tc.putImageData(wd,0,0);
 // Mirrored quadrants have matching opposing edges; the low contrast avoids a tiled checker look.
 for(let y=0;y<2;y++)for(let x=0;x<2;x++){wc.save();wc.translate(x?256:0,y?256:0);wc.scale(x?-1:1,y?-1:1);wc.drawImage(tile,0,0);wc.restore();}
 if(onlyDirection===0)fs.writeFileSync(path.join(ROOT,'assets/hunger-mire-ground-v1.webp'),await wet.encode('webp',88));
 function project(x,y,angle,v,dx=0,lift=0){
   const u=x-ORIGIN[0],ca=Math.cos(angle),sa=Math.sin(angle);
   // Height is an upright billboard coordinate. Applying lateral depth to that
   // same coordinate again would invert the painted surface when facing west.
   return [64+SCALE*(u*ca-v*sa+dx*ca),87+SCALE*(y-ORIGIN[1]+u*sa*DEPTH-u*.25*(1-ca)+dx*sa-lift)];
 }
 function mud(c,x,y,w,h,opacity){
   const patch=createCanvas(Math.ceil(w),Math.ceil(h)),p=patch.getContext('2d');p.globalAlpha=opacity;p.drawImage(wet,0,0,w,h);p.globalAlpha=1;
   const mask=createCanvas(patch.width,patch.height),m=mask.getContext('2d');m.translate(w/2,h/2);m.scale(w/2,h/2);
   const g=m.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'#fff');g.addColorStop(.38,'#ffffffcc');g.addColorStop(1,'#ffffff00');m.fillStyle=g;m.fillRect(-1,-1,2,2);
   p.globalCompositeOperation='destination-in';p.drawImage(mask,0,0);c.drawImage(patch,x-w/2,y-h/2);
 }
 const atlas=createCanvas(CELL*FRAMES,CELL),ac=atlas.getContext('2d');
 for(let direction=onlyDirection;direction<=onlyDirection;direction++)for(let frame=0;frame<FRAMES;frame++){
   const angle=direction*Math.PI*2/DIRECTIONS,phase=(frame-1)/(FRAMES-1),out=createCanvas(CELL,CELL),c=out.getContext('2d');c.scale(CELL/128,CELL/128);c.imageSmoothingQuality='high';
   mud(c,64,91,100,28,.65);
   // A convex cross-section retains body volume at every yaw. Duplicate the
   // source surface behind it for hidden-side coverage; never flatten the skin
   // into an edge-on card or regenerate the creature's texture.
   const columns=Array.from({length:16},(_,i)=>Math.sin(angle)<0?15-i:i),near=Math.cos(angle)>=0?1:-1;
   for(const i of columns)for(const side of [-near,near])for(let j=0;j<9;j++){
     const a=sections[i],b=sections[i+1],s=[[a.x,a.top+(a.bottom-a.top)*j/9],[b.x,b.top+(b.bottom-b.top)*j/9],[b.x,b.top+(b.bottom-b.top)*(j+1)/9],[a.x,a.top+(a.bottom-a.top)*(j+1)/9]];
     const d=s.map((p,k)=>{const sec=k===0||k===3?a:b,wave=frame===0?0:Math.sin(phase*Math.PI*2-(p[0]-ORIGIN[0])*.006)*8;return bodyPoint(sec,p[1],angle,side,wave);});
     triangle(c,textures[0],[s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle(c,textures[0],[s[0],s[2],s[3]],[d[0],d[2],d[3]]);
   }
   const order=Math.sin(angle)>0?[0,1,2]:[2,1,0];
   for(const index of order){const l=LEGS[index],fp=frame===0?{x:0,lift:0,planted:true}:footPose(phase+l.offset),[rx,ry]=l.root,[fx,fy]=l.foot,den=(fx-rx)**2+(fy-ry)**2;
     const xs=l.polygon.map(p=>p[0]),ys=l.polygon.map(p=>p[1]),bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];
     const v=(fy-ORIGIN[1]-(fx-ORIGIN[0])*.25)/DEPTH+150;
     mesh(c,textures[index+1],bounds,(x,y)=>{const t=clamp(((x-rx)*(fx-rx)+(y-ry)*(fy-ry))/den),weight=t*t*(3-2*t);return project(x,y,angle,v,fp.x*weight,fp.lift*weight);},5,6);
     const foot=project(fx,fy,angle,v,fp.x,fp.lift);
     // The foreground is actual wet tissue texture, overlapping the buried claw tips.
     mud(c,foot[0],foot[1]+1.2,21,8,fp.planted?.92:.4);
   }
   // The belly also sinks into the mire. Foot-only spots leave the torso looking
   // suspended above a clean floor, even when the kinematic contacts are correct.
   const swell=frame===0?0:Math.sin(phase*Math.PI*2)*1.2;
   mud(c,64,87+swell,112,32,.82);
   // Flush each cell before packing: retaining a chain of recorded mesh canvases
   // otherwise keeps hundreds of large source-image snapshots alive in native memory.
   ac.putImageData(c.getImageData(0,0,CELL,CELL),frame*CELL,0);
   if(typeof global.gc==='function')global.gc();
   if(frame===FRAMES-1)console.log('Baked direction '+(direction+1)+'/'+DIRECTIONS);
 }
 fs.writeFileSync(path.join(rows,onlyDirection+'.png'),atlas.toBuffer('image/png'));
}
if(require.main===module)bake().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={footPose,STRIDE,DUTY,CELL,DIRECTIONS,FRAMES};
