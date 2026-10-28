'use strict';
// Run by the user. Frames of the Polyp family from the actual inline game renderer (loadWorld), not a browser session.
// node tools/capture-polyp-family.cjs [--before REV]   (default REV: HEAD; the "before" strips use that commit's prototype)
// Writes reports/generated/polyp-family/{before,after}-<scene>-{game,zoom}.png: per scene one colour row and one greyscale
// row, each cell a crop around the body. game = rendered pixels at a 1920x1080 viewport (2 px per lane unit, as the
// other captures); zoom = the same crop x3 for review. Rendering is asserted read-only on every frame.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'reports/generated/polyp-family');
const CROP=[110,110],PX=2,ZOOM=3;   // crop in lane units around the body; device px per lane unit at 1920x1080

async function scenes(world){
 const {canvas,run}=world,rows={},step=dt=>{run(`update(${dt});presentationTime+=${dt};`);const before=run('replaySignature()');run('draw();');assert.equal(run('replaySignature()'),before,'rendering is read-only');};
 const shoot=(scene,at,size,above)=>{(rows[scene]||(rows[scene]=[])).push(crop(canvas,at,size,above));};
 const where=code=>JSON.parse(run(`JSON.stringify((()=>{${code}})())`));
 // Lane points whose tangent is closest to each screen direction, away from the lane ends and the Gate.
 const lanes=where(`const best={};for(let d=60;d<GATE_D-120;d+=2){const p=posAt(d+4),q=posAt(d),a=Math.atan2(p.y-q.y,p.x-q.x);
   for(const [name,t] of [['right',0],['down',Math.PI/2],['left',Math.PI],['up',-Math.PI/2]]){const e=Math.abs(Math.atan2(Math.sin(a-t),Math.cos(a-t)));
    if(!best[name]||e<best[name].e)best[name]={d,e};}}return best;`);
 const field=`reset();S.phase='wave';S.wave=6;S.spawnQueue=[];S.streams=[];S.credits=0;S.gate=GATE_MAX;`;
 const body=(type,d,seq)=>`(()=>{const b=makeEnemy('${type}',6);b.wave=6;b.seq=${seq};b.d=${d};Object.assign(b,posAt(b.d));b.hp=b.maxHp=1e9;return b;})()`;
 // This map's lane has no leftward stretch. For 'left' the capture walks the 'right' stretch with the drawn heading
 // forced to face left (a capture-only override of enemyHeading in this VM), so the mirrored row is still exercised.
 run('var laneHeading=enemyHeading;');
 if(lanes.left.e>Math.PI/4)lanes.left={...lanes.right,forced:true};
 for(const [name,{d,forced}] of Object.entries(lanes)){
  run(forced?'enemyHeading=e=>laneHeading(e)+Math.PI;':'enemyHeading=laneHeading;');
  // A live Polyp crawling: six samples over one ~1.75 s loop.
  run(field+`S.enemies=[${body('polyp',d,3)}];draw();`);
  for(let i=0;i<6;i++){for(let k=0;k<17;k++)step(1/60);shoot('polyp-'+name,where('return visualEnemy(S.enemies[0]);'));}
  // A Polypoid running: six samples over one ~0.5 s loop.
  run(field+`S.enemies=[${body('polypoid',d,5)}];draw();`);
  for(let i=0;i<6;i++){for(let k=0;k<5;k++)step(1/60);shoot('polypoid-'+name,where('return visualEnemy(S.enemies[0]);'));}
 }
 run('enemyHeading=laneHeading;');
 // The death burst, the resting zygotes and the first hatch, all at the Polyp's drawn death point.
 // Mid-lane, clear of the HUD: the right-facing lane point furthest from both lane ends.
 const d=where(`let best=null;for(let d=300;d<GATE_D-150;d+=2){const p=posAt(d+4),q=posAt(d),e=Math.abs(Math.atan2(p.y-q.y,p.x-q.x));if(!best||e<best.e)best={d,e};}return best.d;`);
 run(field+`S.enemies=[${body('polyp',d,3)}];S.enemies[0].hp=1;draw();`);
 const at=where('return visualEnemy(S.enemies[0]);');
 shoot('death',at);
 run('damage(S.enemies[0],10,null);');
 for(let i=0;i<4;i++){step(i?.1:1/60);shoot('death',at);}                       // ~0, 0.1, 0.2, 0.3 s after the death
 const first=where('return Math.min(...S.zygotes.map(z=>z.t));');
 for(let t=where('return Math.min(...S.zygotes.map(z=>z.t));');t>.16;t-=.1)step(Math.min(.1,t-.16));
 shoot('zygotes',at);
 const z=where('const z=S.zygotes.reduce((a,b)=>a.t<b.t?a:b);return zygotePose(z);');
 for(let i=0;i<4;i++){step(.15/4);shoot('hatch',z);}                              // frames 2-5 of the first hatch
 step(2/60);shoot('hatch',z);                                                      // the Polypoid has replaced it
 assert.ok(first>0.15,'the first hatch leaves a resting phase');
 // Crowd: two Polyps and a Forager stream overtaking them on the same stretch, wide crop, six samples 0.25 s apart.
 run(field+`S.enemies=[${body('polyp',d-20,4)},${body('polyp',d+25,5)},`+Array.from({length:18},(_,i)=>body('forager',d-110+i*13,20+i)).join(',')+'];draw();');
 const centre=where(`return posAt(${d});`);
 for(let i=0;i<6;i++){for(let k=0;k<15;k++)step(1/60);shoot('crowd',centre,[250,130],.55);}
 return {rows,lanes};
}
function crop(canvas,at,size=CROP,above=.72){
 const w=size[0]*PX,h=size[1]*PX,c=createCanvas(w,h);
 c.getContext('2d').drawImage(canvas,Math.round((at.x-size[0]/2)*PX),Math.round((at.y-size[1]*above)*PX),w,h,0,0,w,h);return c;
}
function sheet(cells,file){
 const w=cells[0].width,h=cells[0].height,out=createCanvas(w*cells.length,h*2),g=out.getContext('2d');
 cells.forEach((c,i)=>{g.drawImage(c,i*w,0);g.drawImage(c,i*w,h);});
 const img=g.getImageData(0,h,out.width,h),p=img.data;
 for(let k=0;k<p.length;k+=4){const l=Math.round(.299*p[k]+.587*p[k+1]+.114*p[k+2]);p[k]=p[k+1]=p[k+2]=l;}
 g.putImageData(img,0,h);g.strokeStyle='#000';for(let i=1;i<cells.length;i++){g.beginPath();g.moveTo(i*w+.5,0);g.lineTo(i*w+.5,h*2);g.stroke();}
 fs.writeFileSync(file+'-game.png',out.toBuffer('image/png'));
 const z=createCanvas(out.width*ZOOM,out.height*ZOOM);z.getContext('2d').drawImage(out,0,0,z.width,z.height);fs.writeFileSync(file+'-zoom.png',z.toBuffer('image/png'));
}
async function main(){
 const rev=process.argv.includes('--before')?process.argv[process.argv.indexOf('--before')+1]:'HEAD';
 fs.mkdirSync(OUT,{recursive:true});
 const before=execFileSync('git',['show',rev+':prototype/index.html'],{cwd:ROOT,encoding:'utf8'});
 for(const [label,sourceHtml] of [['before',before],['after',null]]){
  const world=await loadWorld({zone:'mire',sourceHtml});
  const {rows,lanes}=await scenes(world);
  for(const [scene,cells] of Object.entries(rows))sheet(cells,path.join(OUT,label+'-'+scene));
  if(label==='after')console.log('lane points: '+Object.entries(lanes).map(([n,v])=>n+' d='+v.d+(v.forced?' (right stretch, heading forced left)':' (off '+(v.e*180/Math.PI).toFixed(0)+' deg)')).join(', '));
 }
 console.log('Wrote '+path.relative(ROOT,OUT)+'/{before,after}-*-{game,zoom}.png');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
