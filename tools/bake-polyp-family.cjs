'use strict';
// Offline atlas bake for the Polyp family (Polyp, Polypoid, Zygote). Never writes the game or simulation.
// Sibling of bake-creature-crawl.cjs for one-row sheets with a variable frame count on a flat light-grey matte:
//  - the matte is flood-filled from the sheet border by colour distance to the sampled background, with a soft
//    unblended edge like the black-matte path of pack-creature-crawl.cjs;
//  - generated ground shadows are dropped: the flood continues into boundary-connected pixels that are desaturated and
//    darker than the background (the bodies are saturated violet-pink, the shadows are grey);
//  - frames are split at empty columns when the sheet has them, otherwise between the largest silhouettes, and every
//    leftover piece goes to the frame that holds its centre of mass;
//  - each family gets ONE scale and ONE ground anchor for all its frames and directions; left is the mirrored right.
// Usage: node tools/bake-polyp-family.cjs [polyp|polypoid|zygote ...]   (default: all three)
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync,spawnSync}=require('node:child_process');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=256,BASE=208,SRC='assets/art/sources/';
const DIRECTIONS=['right','down','left','up'];                  // clockwise screen angle, zero=right (as the crawl atlases)
const MATTE={tolerance:24,shadowChroma:6,shadowDepth:150,edge:60,speck:60,pocket:600};

function encoderPython(){
 const candidates=[process.env.CREATURE_PYTHON,process.env.FORAGER_PYTHON,'python3',path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3')].filter(Boolean);
 const python=candidates.find(p=>spawnSync(p,['-c','from PIL import Image'],{stdio:'ignore'}).status===0);
 if(!python)throw new Error('Lossless bake needs Python with Pillow; install Pillow or set CREATURE_PYTHON.');return python;
}
const chroma=(p,k)=>Math.max(p[k],p[k+1],p[k+2])-Math.min(p[k],p[k+1],p[k+2]);
const luma=(p,k)=>.299*p[k]+.587*p[k+1]+.114*p[k+2];

// Grey matte + shadow removal. Returns RGBA pixels with removed pixels transparent and a soft one-pixel edge.
// pocketRule(x) gives the pocket rule for the frame at source column x: {min, shadow}; shadow lets a pocket take in the
// strands' cast shade too, which is only safe where the frame has no dark creases next to matte (the burst web).
function removeMatte(pixels,w,h,pocketRule=()=>({min:MATTE.pocket,shadow:false}),shadowChroma=MATTE.shadowChroma){
 const border=[];
 for(let x=0;x<w;x+=4)border.push(x,(h-1)*w+x);for(let y=0;y<h;y+=4)border.push(y*w,y*w+w-1);
 const median=ch=>{const v=border.map(i=>pixels[i*4+ch]).sort((a,b)=>a-b);return v[v.length>>1];};
 const bg=[median(0),median(1),median(2)],bgLuma=.299*bg[0]+.587*bg[1]+.114*bg[2],bgChroma=Math.max(...bg)-Math.min(...bg);
 const removed=new Uint8Array(w*h),queue=[];   // 1 = matte, 2 = shadow
 const kind=i=>{
  const k=i*4,d=Math.hypot(pixels[k]-bg[0],pixels[k+1]-bg[1],pixels[k+2]-bg[2]);
  if(d<=MATTE.tolerance)return 1;
  const l=luma(pixels,k);
  if(l<bgLuma&&l>bgLuma-MATTE.shadowDepth&&chroma(pixels,k)<=bgChroma+shadowChroma)return 2;
  return 0;
 };
 const visit=i=>{if(removed[i])return;const t=kind(i);if(!t)return;removed[i]=t;queue.push(i);};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 for(let j=0;j<queue.length;j++){const i=queue[j],x=i%w;if(i>=w)visit(i-w);if(i<w*(h-1))visit(i+w);if(x)visit(i-1);if(x<w-1)visit(i+1);}
 // Matte enclosed by legs or bursting lobes is not boundary-connected. Remove pockets of pure matte colour (never
 // shadow-coloured pixels, which inside a body are its own dark creases) once they are larger than a speck.
 const pocket=new Uint8Array(w*h);
 for(let first=0;first<w*h;first++){
  if(removed[first]||pocket[first]||kind(first)!==1)continue;
  const rule=pocketRule(first%w),take=n=>rule.shadow?kind(n)>0:kind(n)===1;
  const members=[first];pocket[first]=1;
  for(let j=0;j<members.length;j++){const i=members[j],x=i%w;for(const n of [i>=w?i-w:-1,i<w*(h-1)?i+w:-1,x?i-1:-1,x<w-1?i+1:-1])if(n>=0&&!removed[n]&&!pocket[n]&&take(n)){pocket[n]=1;members.push(n);}}
  if(members.length>=rule.min)for(const i of members)removed[i]=1;
 }
 const out=new Uint8ClampedArray(pixels);
 for(let i=0;i<w*h;i++){
  const k=i*4;if(removed[i]){out[k]=out[k+1]=out[k+2]=out[k+3]=0;continue;}
  // Edge pixels are blended with whatever was behind them (matte or shadow): unblend against the removed neighbours.
  const x=i%w,ns=[x?i-1:-1,x<w-1?i+1:-1,i-w,i+w].filter(n=>n>=0&&n<w*h&&removed[n]);
  if(!ns.length)continue;
  const behind=[0,1,2].map(ch=>ns.reduce((s,n)=>s+pixels[n*4+ch],0)/ns.length);
  const a=Math.min(1,Math.hypot(pixels[k]-behind[0],pixels[k+1]-behind[1],pixels[k+2]-behind[2])/MATTE.edge);
  if(a<=0){out[k+3]=0;continue;}
  out[k+3]=Math.round(255*a);for(let ch=0;ch<3;ch++)out[k+ch]=Math.max(0,Math.min(255,Math.round((pixels[k+ch]-(1-a)*behind[ch])/a)));
 }
 return {pixels:out,bg,shadow:removed.reduce((n,v)=>n+(v===2),0)};
}

// 8-connected opaque components with their mass centre.
function components(p,w,h){
 const seen=new Uint8Array(w*h),list=[];
 for(let first=0;first<w*h;first++){
  if(seen[first]||p[first*4+3]<=8)continue;
  const stack=[first],members=[];seen[first]=1;let sx=0,sy=0;
  while(stack.length){const i=stack.pop(),x=i%w,y=(i-x)/w;members.push(i);sx+=x;sy+=y;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,n=ny*w+nx;if((dx||dy)&&nx>=0&&ny>=0&&nx<w&&ny<h&&!seen[n]&&p[n*4+3]>8){seen[n]=1;stack.push(n);}}}
  list.push({members,cx:sx/members.length,cy:sy/members.length});
 }
 return list;
}

// pockets: optional {frameIndex: {min, shadow}} pocket rules; the frame columns come from a first pass with the default.
// shadowChroma: a sheet whose bodies are all strongly saturated may accept shade tinted by them (the burst).
async function extractRow(file,frames,pockets=null,shadowChroma=MATTE.shadowChroma){
 const im=await loadImage(path.resolve(ROOT,file)),w=im.width,h=im.height,g=createCanvas(w,h).getContext('2d');g.drawImage(im,0,0);
 const source=g.getImageData(0,0,w,h).data;
 if(pockets){const first=await splitFrames(removeMatte(source,w,h,undefined,shadowChroma).pixels,w,h,frames,file);
  return finishRow(removeMatte(source,w,h,x=>pockets[first.cuts.filter(c=>x>c).length]||{min:MATTE.pocket,shadow:false},shadowChroma),w,h,frames,file);}
 return finishRow(removeMatte(source,w,h,undefined,shadowChroma),w,h,frames,file);
}
function splitFrames(pixels,w,h,frames,file){
 const parts=components(pixels,w,h).filter(c=>c.members.length>=MATTE.speck);
 // Prefer empty columns between frames; tentacles reach across columns on some sheets, then cut between the bodies.
 const occupied=new Uint8Array(w);for(const c of parts)for(const i of c.members)occupied[i%w]=1;
 const gaps=[];for(let x=0,s=-1;x<=w;x++){const full=x===w||occupied[x];if(!full&&s<0)s=x;if(full&&s>=0){if(s>0&&x<w)gaps.push((s+x-1)/2);s=-1;}}
 let cuts,method;
 if(gaps.length===frames-1){cuts=gaps;method='empty columns';}
 else{const seeds=[...parts].sort((a,b)=>b.members.length-a.members.length).slice(0,frames).sort((a,b)=>a.cx-b.cx);
  assert.equal(seeds.length,frames,file+': too few silhouettes');cuts=seeds.slice(1).map((s,i)=>(seeds[i].cx+s.cx)/2);method='between largest silhouettes';}
 return {parts,cuts,method};
}
function finishRow({pixels,bg,shadow},w,h,frames,file){
 const {parts,cuts,method}=splitFrames(pixels,w,h,frames,file);
 const groups=Array.from({length:frames},()=>[]);
 for(const c of parts)groups[cuts.filter(x=>c.cx>x).length].push(c);
 return {w,h,bg,shadow,method,cuts,frames:groups.map((group,index)=>{
  assert.ok(group.length,file+' frame '+(index+1)+' is empty');
  let l=w,r=-1,t=h,b=-1;for(const c of group)for(const i of c.members){const x=i%w,y=(i-x)/w;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  const tile=createCanvas(r-l+1,b-t+1),tg=tile.getContext('2d'),data=tg.createImageData(r-l+1,b-t+1);
  let mass=0,mx=0,my=0;
  for(const c of group)for(const i of c.members){const x=i%w,y=(i-x)/w,k=((y-t)*(r-l+1)+x-l)*4,a=pixels[i*4+3];
   for(let ch=0;ch<4;ch++)data.data[k+ch]=pixels[i*4+ch];mass+=a;mx+=a*(x-l);my+=a*(y-t);}
  tg.putImageData(data,0,0);
  // Solid bottom: ignore the faint unblended fringe when standing the frame on the ground.
  let solid=0;for(let y=b;y>=t&&!solid;y--)for(let x=l;x<=r;x++)if(pixels[(y*w+x)*4+3]>=128){solid=y-t;break;}
  return {index,tile,rect:[l,t,r-l+1,b-t+1],cx:mx/mass,cy:my/mass,bottom:solid,parts:group.map(c=>({size:c.members.length,cx:Math.round(c.cx),cy:Math.round(c.cy)}))};
 })};
}

// Family layouts. `use` picks source frames (0-based); `anchor` places them in the cell:
//   ground  — solid bottom on BASE, mass centre on x=128;
//   burst   — mass centre where the first frame of the same clip put its mass centre (the body stays where it died);
//   part    — like ground, but x follows the mass centre of the listed source pieces (the hatched Polypoid, not its husk).
function familyConfig(kind){
 if(kind==='polyp')return {kind,atlas:'assets/hunger-polyp-v1.webp',columns:6,clips:[
  {name:'crawl',directional:true,files:{right:'polyp-crawl-right-v1.png',down:'polyp-crawl-down-v1.png',up:'polyp-crawl-up-v1.png'},frames:6,use:[0,1,2,3,4,5],anchor:'ground',
   loop:[0,1,2,3,4],note:'frame 6 duplicates frame 1 and is skipped in the loop'},
  {name:'death',files:{burst:'polyp-death-v1.png'},frames:5,use:[0,1,2],anchor:'burst',pockets:{1:{min:60,shadow:true},2:{min:60,shadow:true}},shadowChroma:10,
   match:{clip:'crawl',sheet:'right',frame:0},
   note:'seams flare, lobes part, full burst; source frames 4-5 are reference only. The death sheet draws the Polyp 1.29x wider than the crawl sheets, so the whole clip is resized once to match its frame 1 to crawl frame 1 (no size jump at death); frames 2-3 keep their size relative to frame 1'}]};
 if(kind==='polypoid')return {kind,atlas:'assets/hunger-polypoid-v1.webp',columns:6,clips:[
  {name:'run',directional:true,files:{right:'polypoid-run-right-v1.png',down:'polypoid-run-down-v1.png',up:'polypoid-run-up-v1.png'},frames:6,use:[0,1,2,3,4,5],anchor:'ground',loop:[0,1,2,3,4,5]}]};
 if(kind==='zygote')return {kind,atlas:'assets/hunger-zygote-v1.webp',columns:5,clips:[
  {name:'hatch',files:{hatch:'zygote-hatch-v1.png'},frames:5,use:[0,1,2,3,4],anchor:'ground',part:{4:'largest-right'},
   note:'frame 1 rests (pulsed in code); frames 2-5 hatch in the last 0.15 s'}]};
 throw new Error('Expected polyp, polypoid or zygote');
}

function opaqueBounds(canvas){
 const {width:w,height:h}=canvas,p=canvas.getContext('2d').getImageData(0,0,w,h).data;let l=w,r=-1,t=h,b=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 assert.ok(r>=l,'nonempty frame');return {l,r,t,b};
}

async function bakeFamily(kind,{outDir=null}={}){
 const config=familyConfig(kind);
 for(const clip of config.clips)for(const file of Object.values(clip.files))if(!fs.existsSync(path.join(ROOT,SRC,file)))throw new Error('Missing source: '+SRC+file);
 // Extract every sheet first: the family scale must see all frames before anything is placed.
 const sheets=[];
 for(const clip of config.clips)for(const [name,file]of Object.entries(clip.files)){
  const sheet=await extractRow(SRC+file,clip.frames,clip.pockets||null,clip.shadowChroma);
  sheets.push({clip,name,file,sheet,k:1,frames:clip.use.map(i=>sheet.frames[i])});
 }
 // A clip drawn at another size in its source sheet is resized ONCE, as a whole, to match a reference frame's width.
 for(const s of sheets)if(s.clip.match){
  const ref=sheets.find(o=>o.clip.name===s.clip.match.clip&&o.name===s.clip.match.sheet).frames[s.clip.match.frame];
  s.k=ref.rect[2]/s.frames[0].rect[2];
 }
 // x anchor: the mass centre, or of the chosen pieces (the hatched juvenile stands where its Polypoid will appear).
 for(const s of sheets)for(const f of s.frames){
  const pick=s.clip.part&&s.clip.part[f.index];
  if(pick==='largest-right'){const right=[...f.parts].sort((a,b)=>b.cx-a.cx)[0];f.ax=right.cx-f.rect[0];}else f.ax=f.cx;
 }
 // ONE scale for the family: every placed frame must clear the cell with a 4 px margin.
 let scale=Infinity;
 for(const s of sheets){
  const first=s.frames[0];
  for(const f of s.frames){
   const [,,fw,fh]=f.rect,left=f.ax,right=fw-f.ax,k=s.k;scale=Math.min(scale,(CELL/2-4)/left/k,(CELL/2-4)/right/k);
   if(s.clip.anchor==='burst'&&f!==first){
    // Mass centre lands on the first frame's mass centre, which sits (bottom - cy) above BASE.
    const above=first.bottom-first.cy;scale=Math.min(scale,(BASE-4)/(above+f.cy)/k,(CELL-4-BASE)/Math.max(1e-6,fh-f.cy-above)/k);
   }else scale=Math.min(scale,(BASE-4)/f.bottom/k,(CELL-4-BASE)/Math.max(1e-6,fh-1-f.bottom)/k);
  }
 }
 const rows=[],table=[];
 const place=(f,clip,first,k)=>{
  const tile=createCanvas(CELL,CELL),g=tile.getContext('2d'),[,,fw,fh]=f.rect,sc=scale*k;
  let y=BASE-f.bottom*sc;
  if(clip.anchor==='burst'&&f!==first)y=BASE-(first.bottom-first.cy)*sc-f.cy*sc;
  g.drawImage(f.tile,CELL/2-f.ax*sc,y,fw*sc,fh*sc);return tile;
 };
 const mirror=tile=>{const c=createCanvas(CELL,CELL),g=c.getContext('2d');g.translate(CELL,0);g.scale(-1,1);g.drawImage(tile,0,0);return c;};
 for(const clip of config.clips){
  const mine=sheets.filter(s=>s.clip===clip),byName=Object.fromEntries(mine.map(s=>[s.name,s]));
  const names=clip.directional?DIRECTIONS:Object.keys(clip.files);
  for(const name of names){
   const s=byName[name==='left'?'right':name],placed=s.frames.map(f=>place(f,clip,s.frames[0],s.k)),tiles=name==='left'?placed.map(mirror):placed;
   rows.push(tiles);
   table.push({clip:clip.name,direction:clip.directional?name:undefined,row:rows.length-1,frames:tiles.length,
    source:SRC+s.file+(name==='left'?' (mirrored)':''),sourceFrames:clip.use.map(i=>i+1),loop:clip.loop,note:clip.note,
    split:s.sheet.method,clipScale:s.k===1?undefined:+s.k.toFixed(5),shadowPixelsRemoved:s.sheet.shadow,background:s.sheet.bg,
    cells:tiles.map((tile,i)=>{const b=opaqueBounds(tile);return {x:i*CELL,y:(rows.length-1)*CELL,w:CELL,h:CELL,opaque:[b.l,b.t,b.r-b.l+1,b.b-b.t+1],sourceRect:s.frames[i].rect};})});
  }
 }
 const atlas=createCanvas(CELL*config.columns,CELL*rows.length),ag=atlas.getContext('2d');
 rows.forEach((tiles,r)=>tiles.forEach((tile,c)=>ag.drawImage(tile,c*CELL,r*CELL)));
 const output=outDir?path.join(outDir,path.basename(config.atlas)):path.join(ROOT,config.atlas);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'polyp-atlas-'));
 try{const png=path.join(temp,'atlas.png'),webp=path.join(temp,'atlas.webp');fs.writeFileSync(png,atlas.toBuffer('image/png'));
  execFileSync(encoderPython(),[path.join(__dirname,'encode-creature-atlas.py'),png,webp]);fs.copyFileSync(webp,output);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 const frames={version:1,kind,atlas:path.basename(config.atlas),cell:CELL,columns:config.columns,rows:rows.length,anchor:[CELL/2,BASE],
  angleConvention:'clockwise screen angle, zero=right; left is the mirrored right',scale:+scale.toFixed(5),
  notes:'One scale and one ground anchor for the whole family (a clip with clipScale is additionally resized once as a whole, see its note). Matte and generated ground shadows removed offline; the game adds no shadow. Presentation only, not a collision shape.',
  clips:table};
 fs.writeFileSync(output.replace(/\.webp$/,'.frames.json'),JSON.stringify(frames,null,1)+'\n');
 return {output,frames,atlas};
}

async function main(){
 const kinds=process.argv.slice(2).length?process.argv.slice(2):['polyp','polypoid','zygote'];
 for(const kind of kinds){const {output,frames}=await bakeFamily(kind);
  console.log('Baked '+path.relative(ROOT,output)+': scale '+frames.scale+', '+frames.clips.map(c=>c.clip+(c.direction?':'+c.direction:'')+' ['+c.split+', shadow px '+c.shadowPixelsRemoved+']').join(', '));}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={bakeFamily,familyConfig,removeMatte,extractRow};
