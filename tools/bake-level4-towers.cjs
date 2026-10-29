'use strict';
// Offline packing of ImageGen alpha sources. No renderer execution or gameplay validation.
// node tools/bake-level4-towers.cjs [source directory]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=256,ANCHOR=[128,240];
// Muzzle centres measured on the visible source silhouettes, in bounding-box fractions.
const SPECS=[
 {key:'machine-gun',type:'turret',branch:'A',height:31,tips:[[.92,.40],[.88,.59],[.51,.73],[.12,.64],[.05,.30],[.24,.08],[.50,.05],[.86,.11]]},
 {key:'rifle',type:'turret',branch:'B',height:32,tips:[[.98,.57],[.96,.84],[.50,.91],[.04,.82],[.02,.56],[.04,.06],[.50,.04],[.97,.05]]},
 {key:'tesla',type:'voltaic',branch:'A',height:46,tips:[[.5,.06]]},
 {key:'prism',type:'voltaic',branch:'B',height:35,tips:[[.68,.33],[.67,.34],[.5,.36],[.30,.36],[.25,.37],[.28,.10],[.5,.05],[.75,.11]]},
 {key:'howitzer',type:'cannon',branch:'A',height:37,tips:[[.85,.11],[.86,.30],[.5,.10],[.14,.11],[.12,.12],[.28,.04],[.5,.04],[.76,.05]]},
 {key:'cluster',type:'cannon',branch:'B',height:29,tips:[[.41,.08]]},
 {key:'plasma',type:'flamer',branch:'A',height:31,tips:[[.89,.46],[.82,.55],[.5,.60],[.17,.55],[.13,.45],[.27,.07],[.5,.06],[.83,.08]]},
 {key:'cryojet',type:'flamer',branch:'B',height:33,tips:[[.88,.50],[.82,.60],[.53,.75],[.19,.61],[.08,.59],[.27,.06],[.5,.05],[.77,.05]]}
];
function components(p,w,h){
 const seen=new Uint8Array(w*h),parts=[];
 for(let first=0;first<w*h;first++){
  if(seen[first]||p[first*4+3]<64)continue;
  const stack=[first],pixels=[];seen[first]=1;let l=w,t=h,r=0,b=0;
  while(stack.length){const n=stack.pop(),x=n%w,y=(n-x)/w;pixels.push(n);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,i=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[i]&&p[i*4+3]>=64){seen[i]=1;stack.push(i);}}}
  if(pixels.length>2000)parts.push({l,t,r,b,pixels});
 }
 return parts.sort((a,b)=>Math.abs(a.t-b.t)>h/3?a.t-b.t:a.l-b.l);
}
async function bake(dir=path.join(ROOT,'reports/generated/level4/sources')){
 const atlas=createCanvas(CELL*8,CELL*8),out=atlas.getContext('2d'),entries=[];
 for(let row=0;row<SPECS.length;row++){
  const spec=SPECS[row],file=path.join(dir,spec.key+'.png'),im=await loadImage(file),src=createCanvas(im.width,im.height),g=src.getContext('2d');g.drawImage(im,0,0);
  const p=g.getImageData(0,0,im.width,im.height).data,parts=components(p,im.width,im.height);
  if(parts.length!==spec.tips.length)throw Error(spec.key+': expected '+spec.tips.length+' isolated objects, found '+parts.length+' '+JSON.stringify(parts.map(a=>[a.l,a.t,a.r,a.b])));
  for(const a of parts){
   // Bottom peg is narrower than the upper assembly. Its bottom strip locates the mount, not silhouette midpoint.
   const strip=a.b-Math.max(3,Math.round((a.b-a.t)*.025)),xs=a.pixels.filter(n=>Math.floor(n/im.width)>=strip).map(n=>n%im.width);
   a.pivot=[(Math.min(...xs)+Math.max(...xs))/2,a.b];
   // The peg is inserted into the socket, not an exposed load-bearing post.
   // Locate the first persistent widening above its narrow lower shaft: the bearing's underside.
   const rows=new Uint32Array(a.b-a.t+1);for(const n of a.pixels)rows[Math.floor(n/im.width)-a.t]++;
   const shaft=[];for(let y=a.b-Math.round((a.b-a.t)*.055);y<=a.b-Math.round((a.b-a.t)*.02);y++)shaft.push(rows[y-a.t]);
   shaft.sort((x,y)=>x-y);const shaftWidth=shaft[Math.floor(shaft.length/2)];let bearingY=null;
   for(let y=a.b-Math.round((a.b-a.t)*.055);y>a.b-(a.b-a.t)*.3;y--){
    if(rows[y-a.t]>=shaftWidth*1.5&&rows[y-a.t-1]>=shaftWidth*1.5){bearingY=y;break;}
   }
   if(bearingY===null)throw Error(spec.key+': cannot locate a bearing above the mounting peg');
   a.bearing=[a.pivot[0],bearingY];
  }
  const h=Math.max(...parts.map(a=>a.b-a.t+1));
  let scale=Math.min(224/h,...parts.map(a=>Math.min(120/Math.max(1,a.pivot[0]-a.l),120/Math.max(1,a.r-a.pivot[0]))));
  const renderSize=spec.height/(h*scale)*CELL,frames=[];
  for(let col=0;col<parts.length;col++){
   const a=parts[col],tw=a.r-a.l+1,th=a.b-a.t+1,tile=createCanvas(tw,th),tg=tile.getContext('2d'),data=tg.createImageData(tw,th);
   // Copy only this connected object. Drop disconnected source artefacts, retain a one-pixel antialias skirt.
   const keep=new Set(a.pixels);for(const n of a.pixels)for(const d of [-im.width,-1,1,im.width]){const j=n+d;if(j>=0&&j<im.width*im.height&&p[j*4+3]>0)keep.add(j);}
   for(const n of keep){const x=n%im.width,y=Math.floor(n/im.width);if(x<a.l||x>a.r||y<a.t||y>a.b)continue;const j=((y-a.t)*tw+x-a.l)*4;for(let k=0;k<4;k++)data.data[j+k]=p[n*4+k];}
   tg.putImageData(data,0,0);
   const x=ANCHOR[0]-(a.pivot[0]-a.l)*scale,y=ANCHOR[1]-(a.pivot[1]-a.t)*scale;
   out.drawImage(tile,col*CELL+x,row*CELL+y,tw*scale,th*scale);
   const tip=spec.tips[col],muzzle=[x+tip[0]*tw*scale,y+tip[1]*th*scale];
   frames.push({rect:[col*CELL,row*CELL,CELL,CELL],anchor:ANCHOR,bearing:[ANCHOR[0],+(y+(a.bearing[1]-a.t)*scale).toFixed(3)],muzzle:muzzle.map(v=>+v.toFixed(3)),sourceBox:[a.l,a.t,tw,th],sourcePivot:a.pivot});
  }
  entries.push({...spec,row,renderSize:+renderSize.toFixed(4),frames,source:path.relative(ROOT,file),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
 }
 const table={cell:CELL,headings:['E','SE','S','SW','W','NW','N','NE'],entries};
 fs.writeFileSync(path.join(ROOT,'assets/hunger-level4-towers-v1.png'),atlas.toBuffer('image/png'));
 fs.writeFileSync(path.join(ROOT,'assets/hunger-level4-towers-v1.frames.json'),JSON.stringify(table,null,2)+'\n');
 // Small inline table: file:// requires no fetch of JSON or pixels from cross-origin canvases.
 const runtime=entries.map(e=>({key:e.key,type:e.type,branch:e.branch,row:e.row,size:e.renderSize,tips:e.frames.map(f=>f.muzzle),seats:e.frames.map(f=>f.bearing)}));
 fs.writeFileSync(path.join(ROOT,'reports/generated/level4/runtime-table.json'),JSON.stringify(runtime));
 console.log('Packed '+entries.length+' families; '+entries.reduce((n,e)=>n+e.frames.length,0)+' poses into 2048 x 2048.');
}
if(require.main===module)bake(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={bake,SPECS};
