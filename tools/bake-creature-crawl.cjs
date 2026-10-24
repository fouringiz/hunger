'use strict';
// Offline atlas/visible contact export. Never writes the game or simulation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync,spawnSync}=require('node:child_process');
function encoderPython(){
 const candidates=[process.env.CREATURE_PYTHON,process.env.FORAGER_PYTHON,'python3',path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3')].filter(Boolean);
 const python=candidates.find(p=>spawnSync(p,['-c','from PIL import Image'],{stdio:'ignore'}).status===0);
 if(!python)throw new Error('Lossless bake needs Python with Pillow; install Pillow or set CREATURE_PYTHON.');return python;
}
const {createCanvas}=require('@napi-rs/canvas');
const {extractFrames}=require('./pack-creature-crawl.cjs');
const ROOT=path.join(__dirname,'..'),CELL=256,BASE=208,DEPTH=.42;
function defaultConfig(kind){
 if(!['leech','carapacid'].includes(kind))throw new Error('Expected leech or carapacid');
 return {kind,cell:CELL,frames:4,contactType:kind==='leech'?'belly':'feet',
  contactPaths:kind==='leech'?{
   0:[[.30,.75],[.42,.88],[.57,.95],[.73,.95],[.85,.87],[.93,.75]],
   2:[[.25,.62],[.38,.79],[.52,.91],[.69,.95],[.83,.90],[.93,.78]],
   4:[[.18,.72],[.25,.86],[.40,.94],[.60,.94],[.75,.86],[.82,.72]],
   6:[[.07,.78],[.17,.90],[.31,.95],[.48,.91],[.62,.79],[.75,.62]],
   8:[[.07,.75],[.15,.87],[.27,.95],[.43,.95],[.58,.88],[.70,.75]],
   10:[[.15,.30],[.22,.47],[.38,.62],[.55,.70],[.72,.72]],
   12:[[.13,.38],[.20,.53],[.32,.67],[.53,.74],[.70,.61],[.80,.45]],
   14:[[.28,.72],[.45,.70],[.62,.62],[.78,.47],[.85,.30]]
  }:null,
  atlas:`assets/hunger-${kind==='leech'?'leech-mire':'carapacid-shelter'}-v1.webp`,
  sources:[{file:`assets/art/sources/${kind}-headings-4x4-v1.png`,rows:[0,4,8,12],blackMatte:true},
   {file:`assets/art/sources/${kind}-headings-diagonal-4x4-v1.png`,rows:[2,6,10,14],rowCuts:[0,.25,.5,.75,1]}]};
}
function bounds(canvas){
 const {width:w,height:h}=canvas,p=canvas.getContext('2d').getImageData(0,0,w,h).data;
 let l=w,r=-1,t=h,b=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>8){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 assert.ok(r>=l,'nonempty silhouette');return {l,r,t,b};
}
function cleanMatteEdge(canvas){
 const g=canvas.getContext('2d'),image=g.getImageData(0,0,CELL,CELL),p=image.data,source=new Uint8ClampedArray(p);
 for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){
  const k=(y*CELL+x)*4,a=source[k+3];if(a===0){p[k]=p[k+1]=p[k+2]=0;continue;}if(a>=240)continue;
  const hi=Math.max(source[k],source[k+1],source[k+2]),lo=Math.min(source[k],source[k+1],source[k+2]);
  if(hi>=40&&!(lo>225&&hi-lo<10))continue;
  let nearest=null;
  for(let yy=Math.max(0,y-6);yy<=Math.min(CELL-1,y+6);yy++)for(let xx=Math.max(0,x-6);xx<=Math.min(CELL-1,x+6);xx++){
   const n=(yy*CELL+xx)*4,d=(xx-x)**2+(yy-y)**2;
   if(source[n+3]>=240&&Math.max(source[n],source[n+1],source[n+2])>=45&&(!nearest||d<nearest.d))nearest={n,d};
  }
  if(nearest)for(let ch=0;ch<3;ch++)p[k+ch]=source[nearest.n+ch];else p[k]=p[k+1]=p[k+2]=p[k+3]=0;
 }
 g.putImageData(image,0,0);return canvas;
}
function snapContact(canvas,point){
 const p=canvas.getContext('2d').getImageData(0,0,CELL,CELL).data;
 const [x,y]=point.map(Math.round);let best=null;
 for(let yy=Math.max(0,y-24);yy<=Math.min(CELL-1,y+24);yy++)for(let xx=Math.max(0,x-24);xx<=Math.min(CELL-1,x+24);xx++){
  const d=(xx-x)**2+(yy-y)**2;if(p[(yy*CELL+xx)*4+3]>=128&&(!best||d<best.d))best={x:xx,y:yy,d};
 }
 assert.ok(best,'authored contact must meet visible body');return [best.x,best.y];
}
async function bake(config,{root=ROOT,outDir=null}={}){
 assert.equal(config.cell,CELL);assert.equal(config.frames,4);
 // Resolve ALL required inputs before extracting or replacing any output.
 for(const source of config.sources)if(!fs.existsSync(path.resolve(root,source.file)))throw new Error('Missing source: '+source.file);
 assert.ok(['belly','feet'].includes(config.contactType));
 assert.ok(config.contactPaths,'New design requires authored contactPaths for eight master headings');
 const masters=new Map();
 for(const source of config.sources){
  const sheet=await extractFrames(config.kind,path.resolve(root,source.file),{rowCuts:source.rowCuts,blackMatte:!!source.blackMatte});
  assert.equal(source.rows.length,4);
  source.rows.forEach((row,i)=>{
   assert.ok(Number.isInteger(row)&&row>=0&&row<16&&row%2===0&&!masters.has(row),'unique authored even row');
   // Normalize source resolution, not individual creature bounding boxes.
   masters.set(row,sheet.rects.slice(i*4,i*4+4).map(({r,tile})=>({tile,w:r[2]*1024/sheet.width,h:r[3]*1024/sheet.width})));
  });
 }
 assert.equal(masters.size,8,'eight authored headings required');
 const masterScale=Math.min(224/Math.max(...[...masters.values()].flat().map(f=>f.w)),200/Math.max(...[...masters.values()].flat().map(f=>f.h)));
 const rows=[],contactRows=[];
 for(let row=0;row<16;row++){
  const master=row%2?(row+1)%16:row,delta=row%2?-Math.PI/8:0,ca=Math.cos(delta),sa=Math.sin(delta);
  // Same limited affine yaw approximation as Forager; authored diagonal rows supply missing views.
  const A=ca,B=DEPTH*sa,C=-.45*sa,D=1+.45*DEPTH*(ca-1);
  const projected=[];
  const frames=masters.get(master).map((f,index)=>{
   const tile=createCanvas(CELL,CELL),g=tile.getContext('2d');
   g.setTransform(A,B,C,D,128-A*128-C*BASE,BASE-B*128-D*BASE);
   g.drawImage(f.tile,128-f.w*masterScale/2,BASE-f.h*masterScale,f.w*masterScale,f.h*masterScale);
   const paths=config.contactPaths[master];assert.ok(paths,'contacts for master '+master);
   const points=Array.isArray(paths[0][0])?paths[index]:paths;
   projected.push(points.map(([u,v])=>{const x=(u-.5)*f.w*masterScale,y=(v-1)*f.h*masterScale;return [128+A*x+C*y,BASE+B*x+D*y];}));
   return tile;
  });
  // One translation for the WHOLE cycle, never a per-frame resize or re-anchor.
  const bottom=Math.max(...frames.map(f=>bounds(f).b)),shift=BASE-1-bottom;
  const aligned=frames.map(f=>{const c=createCanvas(CELL,CELL);c.getContext('2d').drawImage(f,0,shift);return cleanMatteEdge(c);});
  rows.push(aligned);contactRows.push(projected.map((points,i)=>points.map(([x,y])=>(()=>{try{return snapContact(aligned[i],[x,y+shift]);}catch(e){throw new Error('row '+row+' frame '+i+' point '+[x,y+shift]+': '+e.message);}})())));
 }
 const atlas=createCanvas(CELL*4,CELL*16),g=atlas.getContext('2d');
 const contacts={version:1,kind:config.kind,atlas:path.basename(config.atlas),cell:CELL,frames:4,directions:16,
  angleConvention:'clockwise screen angle, zero=right',anchor:[128,BASE],contactType:config.contactType==='belly'?'belly-support-polyline':'visible-foot-points',
  notes:'Authored visible belly support region, projected with each frame and snapped to opaque body pixels. Raised tail excluded. Not a simulation collision shape.',rows:[]};
 for(let row=0;row<16;row++){
  const entries=[];
  for(let frame=0;frame<4;frame++){
   const tile=rows[row][frame],b=bounds(tile);assert.ok(b.l>2&&b.r<CELL-3&&b.t>2&&b.b<BASE,'clear silhouette margins');
   entries.push({[config.contactType]:contactRows[row][frame]});g.drawImage(tile,frame*CELL,row*CELL);
  }
  contacts.rows.push(entries);
 }
 const output=outDir?path.join(outDir,path.basename(config.atlas)):path.resolve(root,config.atlas);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'creature-atlas-'));
 try{const png=path.join(temp,'atlas.png'),webp=path.join(temp,'atlas.webp');fs.writeFileSync(png,atlas.toBuffer('image/png'));
  execFileSync(encoderPython(),[path.join(__dirname,'encode-creature-atlas.py'),png,webp]);fs.copyFileSync(webp,output);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 fs.writeFileSync(output.replace(/\.webp$/,'.contacts.json'),JSON.stringify(contacts,null,2)+'\n');
 return {output,contacts,rows,masterScale};
}
async function main(){
 const arg=process.argv[2]||'leech';
 const config=arg.endsWith('.json')?JSON.parse(fs.readFileSync(path.resolve(arg),'utf8')):defaultConfig(arg);
 const result=await bake(config);console.log('Baked '+result.output+' (16 headings x 4 phases + belly contacts)');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={bake,defaultConfig,bounds,snapContact};
