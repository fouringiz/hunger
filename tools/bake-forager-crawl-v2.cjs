'use strict';
// Partial, exact atlas rebuild: authored vertical cycles only; existing side/diagonal rows are immutable.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {createCanvas,loadImage}=require(process.env.FORAGER_CANVAS_MODULE||'@napi-rs/canvas');
const {ROWS,loadCycles,contacts:clawTips}=require('./forager-vertical-cycles.cjs');
const ROOT=path.join(__dirname,'..'),CELL=192,FRAMES=9,BASE=130,DEPTH=.42;
async function bake(){
 const cycles=await loadCycles(ROOT),output=path.join(ROOT,'assets/hunger-forager-mire-v2.webp');
 const atlas=createCanvas(CELL*FRAMES,CELL*16),a=atlas.getContext('2d');a.drawImage(await loadImage(output),0,0);
 const contactsPath=path.join(ROOT,'assets/art/studies/forager-low-crawl-v2.contacts.json');
 const contacts=JSON.parse(fs.readFileSync(contactsPath,'utf8'));
 const htmlPath=path.join(ROOT,'prototype/index.html'),html=fs.readFileSync(htmlPath,'utf8'),pattern=/const FORAGER_MIRE_CONTACTS=[^\n]+;/;
 if(!pattern.test(html))throw new Error('Forager runtime contact declaration is missing');
 for(const direction of ROWS){
  const master=direction<8?4:12,delta=(direction-master)*Math.PI/8,ca=Math.cos(delta),sa=Math.sin(delta);
  const A=ca,C=-.45*sa,B=DEPTH*sa,D=1+.45*DEPTH*(ca-1);
  const point=([x,y])=>[96+A*(x-96)+C*(y-BASE),BASE+B*(x-96)+D*(y-BASE)];
  const row=[];
  for(let frame=0;frame<FRAMES;frame++){
   const texture=cycles[direction<8?0:1][frame],cell=createCanvas(CELL,CELL),c=cell.getContext('2d');
   // One affine draw per cell: no triangle mesh overlaps, background scraps, or separate floating limbs.
   c.setTransform(A,B,C,D,96-A*96-C*BASE,BASE-B*96-D*BASE);c.drawImage(texture,0,0);
   row.push(clawTips(texture).map(p=>point(p).map(v=>+v.toFixed(3))));
   a.putImageData(c.getImageData(0,0,CELL,CELL),frame*CELL,direction*CELL);
  }
  contacts[direction]=row;
 }
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'forager-vertical-'));
 try{
  const patch=path.join(tmp,'patch.png');fs.writeFileSync(patch,atlas.toBuffer('image/png'));
  execFileSync(process.env.FORAGER_PYTHON||'python3',[path.join(__dirname,'encode-forager-patch.py'),output,patch,output,JSON.stringify(ROWS)],{stdio:'inherit'});
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
 fs.writeFileSync(contactsPath,JSON.stringify(contacts));
 fs.writeFileSync(htmlPath,html.replace(pattern,'const FORAGER_MIRE_CONTACTS='+JSON.stringify(contacts)+';'));
 const dir=path.join(ROOT,'reports/generated/forager-vertical');fs.mkdirSync(dir,{recursive:true});
 const finished=await loadImage(output);
 for(const direction of ROWS){
  const strip=createCanvas(CELL*FRAMES,CELL);strip.getContext('2d').drawImage(finished,0,direction*CELL,CELL*FRAMES,CELL,0,0,CELL*FRAMES,CELL);
  fs.writeFileSync(path.join(dir,'row-'+direction+'.png'),strip.toBuffer('image/png'));
 }
 console.log('Rebaked authored vertical rows '+ROWS.join(',')+'; all other rows retained exactly.');
}
if(require.main===module)bake().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={bake};
