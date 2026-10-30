'use strict';
// Offline atlas bake for the Leech surfacing (emergence) and its wound decal. Never writes the game or simulation.
// Sources stay separate one-row sheets on a flat light-grey matte (assets/art/work/enemies/leech/):
//   leech-emergence-sheet-v1.png     8 frames: 1-2 bulge under the skin, 3-4 pierce and star tear, 5-6 rising,
//                                    7 toppling right, 8 lying right of the open wound;
//   leech-wound-closing-sheet-v1.png 4 frames: open wound, drawing in, knotted seam, pale scar.
// Matte and drawn ground shadows are removed with the Polyp family's removeMatte (bake-polyp-family.cjs). The sheets are
// not split into equal cells: frames are cut at the sheet's empty columns, and the one join (frame 7's head touches
// frame 8's wound) is cut at the emptiest column of a declared window. Every frame is anchored at its wound centre,
// measured once on the source sheet (below), so the wound never slides between frames; one scale per row.
// Atlas: leech-surfacing-v1.webp, 256 px cells, 9 columns x 2 rows:
//   row 0: emergence frames 1-8, then column 8 = frame 8's wound alone (the worm masked out), the start of the decal;
//   row 1: wound frames 1-4.
// The frame table (.frames.json beside the atlas) gives each row's anchor and source-to-cell scale and the frame-8 worm
// extents the game needs to hand the lying worm over to the crawl atlas without a jump.
// Usage: node tools/bake-leech-surfacing.cjs
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {removeMatte,encoderPython}=require('./bake-polyp-family.cjs');
const ROOT=path.join(__dirname,'..'),CELL=256,MARGIN=4,SPECK=60,SHADOW_CHROMA=24;
const ATLAS='assets/runtime/enemies/leech-surfacing-v1.webp';

// Wound centres in source pixels. Emergence 1-6: midpoint of the skirt's opaque extent on the rows 40-80 px above its
// solid bottom (the skirt is symmetric there); 7: the worm's base column over the torn skirt; 8: the open pit. All on one
// ground line (y 478): the sheet keeps one camera. Wound sheet: the pit (1-2), the seam knot (3), the scar's pale centre (4).
function config(){
 return {
  emergence:{file:'assets/art/work/enemies/leech/leech-emergence-sheet-v1.png',frames:8,joins:[[1700,1950]],
   centres:[137,391,648,895,1145,1378,1610,1897],y:478,
   // Frame 8's wound alone: an ellipse around the pit with a feathered edge, clear of the lying worm's body.
   woundMask:{cx:1897,cy:490,rx:78,ry:58,feather:12}},
  wound:{file:'assets/art/work/enemies/leech/leech-wound-closing-sheet-v1.png',frames:4,joins:[],centres:[228,803,1340,1878],y:367}
 };
}

async function cutSheet(spec){
 const file=path.join(ROOT,spec.file);if(!fs.existsSync(file))throw new Error('Missing source: '+spec.file);
 const im=await loadImage(file),w=im.width,h=im.height,g=createCanvas(w,h).getContext('2d');g.drawImage(im,0,0);
 const {pixels,bg,shadow}=removeMatte(g.getImageData(0,0,w,h).data,w,h,undefined,SHADOW_CHROMA);
 // Drop specks: 8-connected opaque pieces smaller than SPECK pixels.
 const seen=new Uint8Array(w*h);
 for(let first=0;first<w*h;first++){
  if(seen[first]||pixels[first*4+3]<=8)continue;
  const stack=[first],members=[];seen[first]=1;
  while(stack.length){const i=stack.pop(),x=i%w,y=(i-x)/w;members.push(i);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,n=ny*w+nx;if((dx||dy)&&nx>=0&&ny>=0&&nx<w&&ny<h&&!seen[n]&&pixels[n*4+3]>8){seen[n]=1;stack.push(n);}}}
  if(members.length<SPECK)for(const i of members)pixels[i*4+3]=0;
 }
 const occupied=new Uint32Array(w);for(let i=0;i<w*h;i++)if(pixels[i*4+3]>8)occupied[i%w]++;
 const cuts=[];for(let x=1,s=-1;x<w;x++){if(!occupied[x]&&s<0)s=x;if(occupied[x]&&s>=0){cuts.push((s+x-1)/2);s=-1;}}
 // Sheet-edge debris: a cut within EDGE px of the border only fences off scraps; clear them and drop the cut.
 const EDGE=24;
 for(const c of cuts.filter(c=>c<EDGE||c>w-EDGE)){for(let x=0;x<w;x++)if(c<EDGE?x<c:x>c)for(let y=0;y<h;y++)pixels[(y*w+x)*4+3]=0;cuts.splice(cuts.indexOf(c),1);}
 // A stray strand inside one gap splits it in two; gaps closer than a frame's spike are one gap.
 for(let i=cuts.length-1;i>0;i--)if(cuts[i]-cuts[i-1]<24)cuts.splice(i-1,2,(cuts[i-1]+cuts[i])/2);
 for(const [a,b]of spec.joins){let best=a;for(let x=a;x<=b;x++)if(occupied[x]<occupied[best])best=x;cuts.push(best);}
 cuts.sort((a,b)=>a-b);
 assert.equal(cuts.length,spec.frames-1,spec.file+': expected '+(spec.frames-1)+' cuts, found '+cuts.length);
 const bounds=[0,...cuts.map(Math.ceil),w];
 spec.centres.forEach((cx,i)=>assert.ok(cx>bounds[i]&&cx<bounds[i+1],spec.file+' frame '+(i+1)+': wound centre outside its frame'));
 return {w,h,pixels,bg,shadow,bounds};
}

// Opaque extent of source pixels [x0,x1) x [0,h) that pass keep(x,y), relative to a centre point.
function extent(sheet,x0,x1,cx,cy,keep=()=>true){
 const {w,h,pixels}=sheet;let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;
 for(let y=0;y<h;y++)for(let x=x0;x<x1;x++)if(pixels[(y*w+x)*4+3]>8&&keep(x,y)){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 assert.ok(r>=l,'nonempty frame');return {left:cx-l,right:r+1-cx,up:cy-t,down:b+1-cy,l,r,t,b};
}
function maskAlpha(m,x,y){
 const d=Math.hypot((x-m.cx)/m.rx,(y-m.cy)/m.ry),edge=m.feather/Math.min(m.rx,m.ry);
 return d<=1-edge?1:d>=1?0:(1-d)/edge;
}
// A frame's pixels as a canvas tile: source columns [x0,x1), optionally weighted by a mask.
function tileOf(sheet,x0,x1,weight=null){
 const {w,h,pixels}=sheet,c=createCanvas(x1-x0,h),g=c.getContext('2d'),data=g.createImageData(x1-x0,h);
 for(let y=0;y<h;y++)for(let x=x0;x<x1;x++){const k=(y*w+x)*4,o=(y*(x1-x0)+x-x0)*4;
  for(let ch=0;ch<3;ch++)data.data[o+ch]=pixels[k+ch];data.data[o+3]=Math.round(pixels[k+3]*(weight?weight(x,y):1));}
 g.putImageData(data,0,0);return c;
}
// One scale per row: every frame, placed by its wound centre on the row anchor, clears the cell by MARGIN.
function rowFit(extents){
 const L=Math.max(...extents.map(e=>e.left)),R=Math.max(...extents.map(e=>e.right)),U=Math.max(...extents.map(e=>e.up)),D=Math.max(...extents.map(e=>e.down));
 const scale=Math.min((CELL-2*MARGIN)/(L+R),(CELL-2*MARGIN)/(U+D));
 return {scale,anchor:[Math.round(MARGIN+L*scale),Math.round(MARGIN+U*scale)]};
}
function opaqueBounds(canvas,threshold=128){
 const {width:w,height:h}=canvas,p=canvas.getContext('2d').getImageData(0,0,w,h).data;let l=w,r=-1,t=h,b=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>=threshold){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 assert.ok(r>=l,'nonempty cell');return [l,t,r-l+1,b-t+1];
}

async function bake({outDir=null,cfg=config()}={}){
 const em=await cutSheet(cfg.emergence),wo=await cutSheet(cfg.wound);
 const E=cfg.emergence,Wd=cfg.wound,mask=E.woundMask;
 const emFrames=E.centres.map((cx,i)=>({x0:em.bounds[i],x1:em.bounds[i+1],cx,cy:E.y}));
 const emExt=emFrames.map(f=>extent(em,f.x0,f.x1,f.cx,f.cy));
 const last=emFrames[7],woundOnly={...last,weight:(x,y)=>maskAlpha(mask,x,y)};
 const woundOnlyExt=extent(em,last.x0,last.x1,last.cx,last.cy,(x,y)=>maskAlpha(mask,x,y)>0);
 const row0=rowFit([...emExt,woundOnlyExt]);
 const woFrames=Wd.centres.map((cx,i)=>({x0:wo.bounds[i],x1:wo.bounds[i+1],cx,cy:Wd.y}));
 const row1=rowFit(woFrames.map(f=>extent(wo,f.x0,f.x1,f.cx,f.cy)));
 const place=(sheet,f,fit)=>{
  const tile=tileOf(sheet,f.x0,f.x1,f.weight),c=createCanvas(CELL,CELL),g=c.getContext('2d');
  g.drawImage(tile,fit.anchor[0]-(f.cx-f.x0)*fit.scale,fit.anchor[1]-f.cy*fit.scale,tile.width*fit.scale,tile.height*fit.scale);return c;
 };
 const rows=[[...emFrames.map(f=>place(em,f,row0)),place(em,woundOnly,row0)],woFrames.map(f=>place(wo,f,row1))];
 const atlas=createCanvas(CELL*9,CELL*2),ag=atlas.getContext('2d');
 rows.forEach((tiles,r)=>tiles.forEach((tile,c)=>ag.drawImage(tile,c*CELL,r*CELL)));
 // The lying worm of frame 8 (outside the wound mask), in cell pixels: the game matches it to the crawl atlas.
 const toCell=(x,y)=>[row0.anchor[0]+(x-last.cx)*row0.scale,row0.anchor[1]+(y-last.cy)*row0.scale];
 const worm=extent(em,last.x0,last.x1,last.cx,last.cy,(x,y)=>maskAlpha(mask,x,y)===0&&em.pixels[(y*em.w+x)*4+3]>=128);
 const [wl,wt]=toCell(worm.l,worm.t),[wr,wb]=toCell(worm.r+1,worm.b+1);
 const wm=toCell(mask.cx-mask.rx,mask.cy-mask.ry),wM=toCell(mask.cx+mask.rx,mask.cy+mask.ry);
 const output=outDir?path.join(outDir,path.basename(ATLAS)):path.join(ROOT,ATLAS);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'leech-surfacing-'));
 try{const png=path.join(temp,'atlas.png'),webp=path.join(temp,'atlas.webp');fs.writeFileSync(png,atlas.toBuffer('image/png'));
  execFileSync(encoderPython(),[path.join(__dirname,'encode-creature-atlas.py'),png,webp]);fs.copyFileSync(webp,output);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 const r5=v=>+v.toFixed(5),r1=v=>+v.toFixed(1);
 const frames={version:1,kind:'leech-surfacing',atlas:path.basename(ATLAS),cell:CELL,columns:9,rows:2,
  notes:'Every cell is anchored at its wound centre (row anchor, cell px); one source-to-cell scale per row. Matte and drawn ground shadows removed offline (removeMatte, shadow chroma '+SHADOW_CHROMA+'); the game adds no shadow. Presentation only, not a collision shape.',
  clips:[
   {clip:'emergence',row:0,frames:8,anchor:row0.anchor,scale:r5(row0.scale),source:E.file,woundCentres:E.centres.map(x=>[x,E.y]),split:'empty columns; frame 7|8 join cut at the emptiest column of '+E.joins.map(j=>j.join('-')).join(', '),
    shadowPixelsRemoved:em.shadow,background:em.bg,
    cells:rows[0].slice(0,8).map((tile,i)=>({x:i*CELL,y:0,opaque:opaqueBounds(tile),sourceColumns:[emFrames[i].x0,emFrames[i].x1]})),
    worm:{frame:8,left:r1(wl),right:r1(wr),top:r1(wt),bottom:r1(wb),note:'opaque (alpha>=128) extent of the lying worm outside the wound mask, cell px'}},
   {clip:'wound-start',row:0,column:8,frames:1,anchor:row0.anchor,scale:r5(row0.scale),source:E.file+' frame 8, masked',
    mask:{...mask,cell:[r1(wm[0]),r1(wm[1]),r1(wM[0]-wm[0]),r1(wM[1]-wm[1])]},opaque:opaqueBounds(rows[0][8])},
   {clip:'wound',row:1,frames:4,anchor:row1.anchor,scale:r5(row1.scale),source:Wd.file,woundCentres:Wd.centres.map(x=>[x,Wd.y]),split:'empty columns',
    shadowPixelsRemoved:wo.shadow,background:wo.bg,
    cells:rows[1].map((tile,i)=>({x:i*CELL,y:CELL,opaque:opaqueBounds(tile),sourceColumns:[woFrames[i].x0,woFrames[i].x1]}))}
  ]};
 fs.writeFileSync(output.replace(/\.webp$/,'.frames.json'),JSON.stringify(frames,null,1)+'\n');
 return {output,frames,atlas};
}

if(require.main===module)bake().then(({output,frames})=>{
 console.log('Baked '+path.relative(ROOT,output)+': '+frames.clips.map(c=>c.clip+' scale '+c.scale+' anchor '+c.anchor.join(',')).join('; '));
}).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={bake,config};
