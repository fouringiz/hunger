'use strict';
const {readRevision}=require('./history.cjs');
// Run by the user. Frames of the Leech's surfacing from the actual inline game renderer (loadWorld), not a browser session.
// node tools/capture-leech-surfacing.cjs [--before REV]   (default REV: HEAD; "before" exists only for the pad scene)
// Writes reports/generated/leech-surfacing/<label>-<scene>-{game,zoom}.png: per scene one colour row and one greyscale row,
// each cell a crop around the Leech or its wound at game size (1920x1080 viewport, 2 px per lane unit); zoom = x3.
//   after-under     the hunt beneath the skin, six samples 0.1 s apart (loop + dissolve);
//   after-surfacing emergence frames 1-8, then the crawl 1, 10 and 30 ticks after frame 8 (hand-off 8 -> crawl);
//   after-wound     the decal 0, 0.2, 0.4, 1.0, 2.0, 2.8, 5.0, 7.0, 7.5 s after it is left (hand-off 8 -> wound);
//   {before,after}-pad  a hunting Leech on, half on, beside and in front of a pad (the known over-pad defect).
// The generator stands on slot GEN; the pad scene holds the Leech on slot 3's platform.
// Rendering is asserted read-only on every frame.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'reports/generated/leech-surfacing');
const CROP=[110,110],PX=2,ZOOM=3;
// Generator on slot 12: the hunt surfaces mid-field at about (621,254) heading right (3 deg), clear of the HUD.
const GEN=12;
const SCENE="reset();S.credits=5000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS["+GEN+"],'generator');S.selected=null;observeConstruction();presentationTime=3;observeConstruction();var leech=makeEnemy('leech',5);S.enemies=[leech];";

function crop(canvas,at,above=.65){
 const w=CROP[0]*PX,h=CROP[1]*PX,c=createCanvas(w,h);
 c.getContext('2d').drawImage(canvas,Math.round((at.x-CROP[0]/2)*PX),Math.round((at.y-CROP[1]*above)*PX),w,h,0,0,w,h);return c;
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

function stepper(world){
 const {run}=world;
 return {
  tick(n=1){for(let i=0;i<n;i++)run('update(SIM_STEP);presentationTime+=SIM_STEP;');},
  frame(){const before=run('replaySignature()');run('draw();');assert.equal(run('replaySignature()'),before,'rendering is read-only');return world.canvas;},
  at(code){return JSON.parse(run(`JSON.stringify((()=>{${code}})())`));}
 };
}

// A hunting Leech held on and around a pad: slot 3's platform, the generator on slot GEN as its goal.
function padScene(world){
 const {run}=world,s=stepper(world),cells=[];
 const slot=s.at('return {x:SLOTS[3].x,y:SLOTS[3].y};');
 for(const [dx,dy]of [[0,0],[0,10],[-34,4],[0,30]]){
  run(SCENE+`for(let i=0;i<2;i++)update(SIM_STEP);leech.x=${slot.x+dx};leech.y=${slot.y+dy};leech.route=[{x:SLOTS[${GEN}].x,y:SLOTS[${GEN}].y}];`);
  assert.ok(s.at('return leech.submerged;'),'the Leech hunts beneath the skin');
  cells.push(crop(s.frame(),slot,.55));
 }
 return cells;
}

async function after(world){
 const {run}=world,s=stepper(world),rows={};
 // Under the skin, on open ground shortly after the hunt starts.
 run(SCENE);s.tick(480);                                      // ~8 s into the hunt: mid-field, clear of the map edge and HUD
 rows.under=[];for(let i=0;i<6;i++){s.tick(6);rows.under.push(crop(s.frame(),s.at('return {x:leech.x,y:leech.y};')));}
 // Surfacing frames 1-8 at their middles, then the crawl after frame 8.
 run(SCENE);while(s.at("return leech.state;")!=='surfacing')s.tick();
 const wound=s.at('return {x:leech.x,y:leech.y};');rows.surfacing=[];
 for(let f=0;f<8;f++){while(s.at('return leechEmergenceFrame(leech);')<f||s.at(`return leech.surfaceT>BUILD_WARMUP_SECONDS*(1-(${f}+.5)/8);`))s.tick();rows.surfacing.push(crop(s.frame(),wound));}
 while(s.at("return leech.state;")==='surfacing')s.tick();
 const left=s.at('return S.time;');
 let crawled=1;for(const n of [1,10,30]){s.tick(n-crawled);crawled=n;rows.surfacing.push(crop(s.frame(),wound));}
 // The wound decal over its life, from the moment frame 8 left it.
 rows.wound=[];
 for(const t of [0,.2,.4,1.0,2.0,2.8,5.0,7.0,7.5]){while(s.at('return S.time;')<left+t-1e-9)s.tick();rows.wound.push(crop(s.frame(),wound,.5));}
 rows.pad=padScene(world);
 return rows;
}

async function main(){
 const rev=process.argv.includes('--before')?process.argv[process.argv.indexOf('--before')+1]:'HEAD';
 fs.mkdirSync(OUT,{recursive:true});
 const before=readRevision(rev,'prototype/index.html');
 sheet(padScene(await loadWorld({zone:'mire',sourceHtml:before})),path.join(OUT,'before-pad'));
 const rows=await after(await loadWorld({zone:'mire'}));
 for(const [scene,cells]of Object.entries(rows))sheet(cells,path.join(OUT,'after-'+scene));
 console.log('Wrote '+path.relative(ROOT,OUT)+'/{before-pad,after-under,after-surfacing,after-wound,after-pad}-{game,zoom}.png');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
