'use strict';
// v0.14 — the Leech's surfacing in art (presentation only). Relational checks on the actual inline renderer (loadWorld):
// the draw layer at every stage of a hunt (under the skin -> surfacing -> crawl -> attach -> leave), measured as the order
// of the Leech's draws against the platform layer; exactly one wound decal per surfacing, untouched by the Leech, removed
// after the summed durations; both hand-offs without a jump; collateral darkening; rendering is read-only and timed by the
// simulation. Known-bad controls: the ground layer drawn after the platforms, and the hand-off offset removed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadImage,createCanvas}=require('@napi-rs/canvas');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),ATLAS=path.join(ROOT,'assets/runtime/enemies/leech-surfacing-v1.webp');
const scene=slot=>`reset();S.credits=5000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[${slot}],'generator');S.selected=null;var leech=makeEnemy('leech',5);S.enemies=[leech];`;
// Installed once per world: tags every drawImage of the Leech's art and of the platform layer, in draw order.
const LOG="if(!globalThis.drawLog){globalThis.drawLog=[];const plainDrawImage=ctx.drawImage;ctx.drawImage=function(img,...a){drawLog.push(img===leechSurfacingArt?'surf':img===leechBlendLayer?'blend':img===worldPlatformArt?'platform':img===leechMireArt||img===leechPlatformLayer?'crawl':'');return plainDrawImage.call(this,img,...a);};}";

// Which layer the Leech is drawn on in one frame: tags before / after the platform layer.
function layerOf(run){
 run('drawLog=[];');const sig=run('replaySignature()');run('draw();');assert.equal(run('replaySignature()'),sig,'rendering is read-only');
 const log=JSON.parse(run('JSON.stringify(drawLog)')).filter(Boolean),at=log.indexOf('platform');
 assert.ok(at>=0,'the platform layer was drawn');
 return {ground:log.slice(0,at),unit:log.slice(at+1)};
}
function silhouette(canvas){
 const g=canvas.getContext('2d'),{width:w,height:h}=canvas,p=g.getImageData(0,0,w,h).data;let m=0,sx=0,sy=0,l=w,r=-1,t=h,b=-1,lum=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4;if(p[k+3]<128)continue;m++;sx+=x;sy+=y;lum+=.299*p[k]+.587*p[k+1]+.114*p[k+2];
  l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 assert.ok(m>40,'something was drawn');return {cx:sx/m/2,cy:sy/m/2,l:l/2,r:(r+1)/2,t:t/2,b:(b+1)/2,lum:lum/m};
}
function isolated(world,code){paint(world,code);return silhouette(world.canvas);}
function paint(world,code){world.run(`ctx.setTransform(2,0,0,2,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);${code}`);}
const alphas=canvas=>{const p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,a=new Uint8Array(p.length/4);for(let i=0;i<a.length;i++)a[i]=p[i*4+3];return a;};

async function walk(world,slot){
 const {run}=world,stages={};
 run(scene(slot)+LOG);
 const step=()=>{run('update(SIM_STEP);');return run('leech.state+(leech.submerged?"/sub":"")');};
 let state=step(),ticks=0,frames=new Set(),wounds=0;
 const note=(name,extra={})=>{if(!stages[name])stages[name]={...layerOf(run),...extra};};
 while(ticks++<60*120){
  if(state==='seek/sub')note('under');
  if(state==='surfacing'){const f=run('leechEmergenceFrame(leech)');frames.add(f);note('surfacing-'+(f<2?'ground':'unit'),{frame:f});}
  if(state==='seek'){note('crawl');}
  if(state==='attached'){note('attach');break;}
  run('observeLeechSurfacing();');wounds=Math.max(wounds,run('leechWounds.length'));state=step();
 }
 assert.ok(stages.attach,`slot ${slot}: the Leech attached`);
 assert.deepEqual([...frames].sort(),[0,1,2,3,4,5,6,7],'surfacing plays all eight frames');
 run('sell(SLOTS['+slot+'].tower);');for(let i=0;i<3;i++)step();note('leave');
 assert.equal(run('leech.state'),'return','selling the generator sends the Leech back to the lane');
 return {stages,wounds};
}

(async()=>{
 // Atlas and frame table.
 const table=JSON.parse(fs.readFileSync(ATLAS.replace('.webp','.frames.json'),'utf8')),im=await loadImage(ATLAS);
 assert.equal(im.width,256*9);assert.equal(im.height,256*2);
 const c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
 for(const [row,cols]of [[0,9],[1,4]])for(let col=0;col<9;col++){
  const p=g.getImageData(col*256,row*256,256,256).data;let filled=0,rim=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=p[(y*256+x)*4+3];if(a>=128)filled++;if(a>8&&(x<2||y<2||x>253||y>253))rim++;}
  if(col<cols){assert.ok(filled>1500,`cell ${row},${col} is filled`);assert.equal(rim,0,`cell ${row},${col} is not clipped by the cell edge`);}
  else assert.equal(filled,0,`cell ${row},${col} is empty`);
 }
 const world=await loadWorld(),{run}=world;
 const spec=JSON.parse(run('JSON.stringify(LEECH_SURFACING)'));
 assert.deepEqual(spec.anchor,table.clips[0].anchor,'game anchor = baked emergence anchor');
 assert.deepEqual(spec.woundAnchor,table.clips[2].anchor,'game anchor = baked wound anchor');
 const worm=table.clips[0].worm;
 assert.ok(Math.abs(spec.px*(worm.right-worm.left)-160*80/256)<.5,'frame 8 worm drawn as long as the crawl atlas body');
 assert.ok(run('leechSurfacingReady()'),'atlas loaded in the renderer');

 // Stages and layers on three generators (different headings), and the leftward (mirrored) hunt.
 for(const slot of [7,2,12]){
  const {stages,wounds}=await walk(world,slot);
  const has=(list,tag)=>list.includes(tag);
  assert.ok(has(stages.under.ground,'blend')&&!has(stages.under.unit,'surf')&&!has(stages.under.unit,'crawl')&&!has(stages.under.unit,'blend'),`slot ${slot}: under the skin on the ground layer only`);
  assert.ok(has(stages['surfacing-ground'].ground,'surf')&&!has(stages['surfacing-ground'].unit,'surf'),`slot ${slot}: surfacing frames 1-2 on the ground layer`);
  assert.ok(has(stages['surfacing-unit'].unit,'surf')&&!has(stages['surfacing-unit'].ground,'surf'),`slot ${slot}: surfacing frames 3-8 on the unit layer`);
  for(const name of ['crawl','attach','leave']){
   assert.ok(has(stages[name].unit,'crawl')&&!has(stages[name].unit,'surf'),`slot ${slot}: ${name} draws the crawl atlas on the unit layer`);
   assert.deepEqual(stages[name].ground,['blend'],`slot ${slot}: during ${name} the ground layer holds only the wound decal`);
  }
  assert.equal(wounds,1,`slot ${slot}: exactly one wound decal per surfacing`);
 }

 // The wound decal outlives attach and leave, ignores the Leech's death, and goes after the summed durations.
 run(scene(7));
 for(let i=0;i<60*60&&(run('leech.state')!=='seek'||run('leech.submerged'));i++)run('update(SIM_STEP);observeLeechSurfacing();');
 const wound=JSON.parse(run('JSON.stringify(leechWounds)'));assert.equal(wound.length,1,'one decal when the crawl starts');
 const life=run('leechWoundLife()');
 assert.ok(Math.abs(life-(2.0+.8+2.2+2.0+1.0))<1e-9,'life = frame durations + final fade');
 run('damage(leech,1e9,null);');
 while(run('S.time')<wound[0].at+life-.05){run('update(SIM_STEP);observeLeechSurfacing();');}
 assert.equal(run('leechWounds.length'),1,'the decal stays after the Leech dies');
 assert.deepEqual(JSON.parse(run('JSON.stringify(leechWounds[0])')),wound[0],'and does not move');
 while(run('S.time')<wound[0].at+life+.05){run('update(SIM_STEP);observeLeechSurfacing();');}
 assert.equal(run('leechWounds.length'),0,'removed after the summed durations');

 // Hand-off 8 -> crawl without a jump (head end and centre), for a rightward and a leftward hunt; the known-bad variant
 // (no hand-off offset) must jump.
 const handoff=(setup,offset)=>{
  run(scene(7)+setup+`LEECH_SURFACING.handoff=${JSON.stringify(offset)};`);let last=null;
  for(let i=0;i<60*60;i++){run('update(SIM_STEP);observeLeechSurfacing();');
   if(run('leech.state')==='surfacing'){if(run('leechEmergenceFrame(leech)')===7)last=isolated(world,'drawLeechEmergence(visualEnemy(leech));');}   // frames 1-2 lie on the ground layer
   else if(last)return {f8:last,crawl:isolated(world,'enemyArt(visualEnemy(leech));'),left:run('leechWounds[0].left')};}
  throw new Error('no hand-off');
 };
 const leftward="leech.x=SLOTS[7].x+150;leech.y=SLOTS[7].y+10;leech.d=0;";
 for(const [name,setup]of [['right',''],['left',leftward]]){
  const good=handoff(setup,spec.handoff),bad=handoff(setup,{dx:0,dy:0}),head=s=>good.left?s.l:s.r,headBad=s=>bad.left?s.l:s.r;
  assert.equal(good.left,name==='left',name+' hunt faces '+name);
  const jump=Math.abs(head(good.crawl)-head(good.f8)),centre=Math.hypot(good.crawl.cx-good.f8.cx,good.crawl.cy-good.f8.cy);
  assert.ok(jump<=3&&centre<=4,`${name}: no jump at 8 -> crawl (head ${jump.toFixed(1)}, centre ${centre.toFixed(1)} px)`);
  assert.ok(Math.abs(headBad(bad.crawl)-headBad(bad.f8))>8,`${name}: known bad (no offset) jumps`);
  run(`LEECH_SURFACING.handoff=${JSON.stringify(spec.handoff)};`);
 }

 // Hand-off 8 -> wound: the decal starts as frame 8's own wound and wound frame 1 matches its size.
 run(scene(7)+'observeLeechSurfacing();');   // a new scene clears the previous scene's decals
 for(let i=0;i<60*60&&!run('leechWounds.length');i++)run('update(SIM_STEP);observeLeechSurfacing();');
 const decal=t=>isolated(world,`drawLeechWound({...leechWounds[0],at:S.time-${t}});`);
 const start=decal(0),startA=alphas(world.canvas),first=decal(spec.woundStart),firstA=alphas(world.canvas);
 paint(world,`drawLeechWound({...leechWounds[0],at:S.time-${spec.woundStart/2}});`);const midA=alphas(world.canvas);
 const w=s=>s.r-s.l,h=s=>s.b-s.t;
 assert.ok(Math.abs(w(first)/w(start)-1)<.3&&Math.abs(h(first)/h(start)-1)<.35,`wound frame 1 matches frame 8's wound (${w(start).toFixed(1)}x${h(start).toFixed(1)} -> ${w(first).toFixed(1)}x${h(first).toFixed(1)})`);
 // Both cells sit on the pit; their silhouettes are not centred on it alike (the wound sheet's pit lies left of its skirt).
 assert.ok(Math.hypot(first.cx-start.cx,first.cy-start.cy)<5,'the wound does not slide');
 // Wound frame 1 is drawn toned (woundTone opacity), so "opaque" is relative to each cell's own full value.
 const full=Math.round(255*spec.woundTone[0][0]);
 let both=0,solid=0;for(let i=0;i<midA.length;i++)if(startA[i]>=200&&firstA[i]>=full-10){both++;if(midA[i]>=firstA[i]-5)solid++;}
 assert.ok(both>100&&solid/both>.95,'where both cells are opaque the dissolve is no more transparent than either (no see-through dip)');

 // Readability: after the start dissolve the decal never outshines a crawling Leech in greyscale — mean |Δ luminance| of
 // the pixels each one changes against the same frame without it — yet stays visible. Known bad: the untoned decal.
 const frameLum=()=>{run('draw();');const p=world.canvas.getContext('2d').getImageData(0,0,world.canvas.width,world.canvas.height).data,l=new Float32Array(p.length/4);
  for(let i=0;i<l.length;i++)l[i]=.299*p[i*4]+.587*p[i*4+1]+.114*p[i*4+2];return l;};
 const contrast=(a,b)=>{let n=0,sum=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d>4){n++;sum+=d;}}return n?sum/n:0;};
 run(scene(12)+'observeLeechSurfacing();');
 for(let i=0;i<60*60&&!run('leechWounds.length');i++)run('update(SIM_STEP);observeLeechSurfacing();');
 for(let i=0;i<40;i++)run('update(SIM_STEP);');
 const withLeech=frameLum();run('var kept=S.enemies;S.enemies=[];');const noLeech=frameLum();
 const leechContrast=contrast(withLeech,noLeech);
 run('var keptWounds=leechWounds,keptObserve=observeLeechSurfacing;observeLeechSurfacing=()=>{};');
 const woundContrast=t=>{run(`leechWounds=keptWounds;leechWounds[0].at=S.time-${t};`);const a=frameLum();run('leechWounds=[];');return contrast(a,frameLum());};
 const samples=[spec.woundStart,1,2.4,3.5,4.6,5.5,6.5];
 const toned=samples.map(woundContrast);
 assert.ok(toned.every(c=>c<=leechContrast*.85),`decal stays below the Leech's greyscale contrast (${toned.map(c=>c.toFixed(1)).join(', ')} vs ${leechContrast.toFixed(1)})`);
 assert.ok(toned.every(c=>c>8),'and stays visible');
 run('var keptTone=LEECH_SURFACING.woundTone;LEECH_SURFACING.woundTone=keptTone.map(()=>[1,0]);');
 assert.ok(samples.map(woundContrast).some(c=>c>leechContrast),'known bad: the untoned scar outshines the Leech');
 run('LEECH_SURFACING.woundTone=keptTone;leechWounds=keptWounds;observeLeechSurfacing=keptObserve;S.enemies=kept;');

 // Under the skin: collateral darkens the bulge for LEECH_SURFACING.flash seconds of simulation time, nothing else does.
 run(scene(7)+'for(let i=0;i<30;i++)update(SIM_STEP);observeLeechSurfacing();');
 assert.ok(run('leech.submerged'),'still under the skin');
 const plain=isolated(world,'drawLeechUnderSkin(leech);');
 run('presentationTime+=5;');assert.ok(Math.abs(isolated(world,'drawLeechUnderSkin(leech);').lum-plain.lum)<1,'wall clock does not animate it');
 run('oozeCollateral(leech.x,leech.y,30,40,null,null);observeLeechSurfacing();');
 const hit=isolated(world,'drawLeechUnderSkin(leech);');
 assert.ok(hit.lum<plain.lum*.8,'a collateral hit darkens the bulge');
 run(`for(let i=0;i<Math.ceil(${spec.flash}/SIM_STEP)+1;i++)update(SIM_STEP);observeLeechSurfacing();`);
 assert.ok(isolated(world,'drawLeechUnderSkin(leech);').lum>hit.lum*1.1,'the darkening ends');

 // Known bad: the ground layer drawn after the platforms puts the hunt over the pads; the layer check must catch it.
 const html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8'),good="  drawLeechGround();\n  if(worldPlatformArt)ctx.drawImage(worldPlatformArt,0,0,W,H);";
 assert.ok(html.includes(good),'ground layer call precedes the platforms');
 const badWorld=await loadWorld({sourceHtml:html.replace(good,"  if(worldPlatformArt)ctx.drawImage(worldPlatformArt,0,0,W,H);\n  drawLeechGround();")});
 badWorld.run(scene(7)+LOG+'for(let i=0;i<30;i++)update(SIM_STEP);');
 assert.ok(layerOf(badWorld.run).unit.includes('blend'),'known bad: the hunt is drawn over the pads');

 console.log('PASS Leech surfacing art: layers under skin/surfacing/crawl/attach/leave on 3 generators, one decal removed after '+life+' s, hand-offs 8->crawl (right, left) and 8->wound, collateral darkening, read-only; decal below the Leech in greyscale; known-bad layer, hand-off and untoned scar fail');
})().catch(e=>{console.error(e);process.exitCode=1;});
