'use strict';
// Native offscreen capture of the actual inline game renderer. This is not a browser or a balance playthrough.
// WORLD_CANVAS_MODULE=/path/to/@napi-rs/canvas node tools/capture-organic-world.cjs [--ember] [--frames] [--viewport] [--empty]
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const root=path.join(__dirname,'..'),zone=process.argv.includes('--ember')?'ember':'mire';
async function main(){
  let source=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  const files={unitArt:'hunger-units-v1.png',voltaicArt:'hunger-voltaic-v1.png',infantryArt:'hunger-infantry-trial-v1.png',crawlerArt:'hunger-crawlers-v2.png',structureArt:'hunger-structures-v2.png',groundActorArt:'hunger-ground-actors-v3.png',lowBuildingArt:'hunger-low-buildings-v3.png',foragerMireArt:'hunger-forager-mire-v1.webp',mireGroundArt:'hunger-mire-ground-v1.webp',worldGroundArt:'hunger-world-'+zone+'-v1.webp',ancientStoneArt:'hunger-ancient-stone-v1.webp'};
  const images={};
  for(const [name,file]of Object.entries(files)){
    images[name]=await loadImage(path.join(root,'assets',file));
    source=source.replace(new RegExp('const '+name+' = [^;]+;'),'const '+name+' = images.'+name+';').replace(new RegExp('^if\\s*\\(\\s*'+name+'\\s*\\).*$','m'),'');
  }
  for(const [name,file]of Object.entries({worldLaneArt:'hunger-organic-lane-v1.webp',gateDetailArt:'hunger-ancient-gate-v4.webp',gateRuinsArt:'hunger-ancient-gate-ruins-v1.webp',platformDetailArt:'hunger-concrete-platform-v2.webp'}))images[name]=await loadImage(path.join(root,'assets',file));
  const details="const worldLaneArt=worldMaterial('hunger-organic-lane-v1.webp'),gateDetailArt=worldMaterial('hunger-ancient-gate-v4.webp'),gateRuinsArt=worldMaterial('hunger-ancient-gate-ruins-v1.webp'),platformDetailArt=worldMaterial('hunger-concrete-platform-v2.webp');";
  assert.ok(source.includes(details),'detail material declaration is still present');
  source=source.replace(details,'const worldLaneArt=images.worldLaneArt,gateDetailArt=images.gateDetailArt,gateRuinsArt=images.gateRuinsArt,platformDetailArt=images.platformDetailArt;');
  const materials="const worldGroundArt=worldMaterial(WORLD.file),ancientStoneArt=worldMaterial('hunger-ancient-stone-v1.webp');";
  assert.ok(source.includes(materials),'world material declaration is still present');
  source=source.replace(materials,'const worldGroundArt=images.worldGroundArt,ancientStoneArt=images.ancientStoneArt;');
  const viewport=process.argv.includes('--viewport')?[964,631]:[1920,1080];
  const canvas=createCanvas(...viewport);canvas.style={};canvas.addEventListener=()=>{};
  const c=vm.createContext({images,document:{getElementById:()=>canvas,createElement:()=>createCanvas(1,1)},window:{devicePixelRatio:1},innerWidth:viewport[0],innerHeight:viewport[1],
    location:{pathname:'/prototype/index.html',search:'?zone='+zone},URLSearchParams,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(source,c);const run=code=>vm.runInContext(code,c);
  run("reset();S.phase='build';S.credits=10000;S.buildTimer=999;build(SLOTS[0],'turret');build(SLOTS[1],'cannon');build(SLOTS[5],'voltaic');build(SLOTS[15],'generator');S.selected=null;observeConstruction();presentationTime=2;observeConstruction();S.wave=5;S.phase='wave';S.spawnQueue=[];S.enemies=Array.from({length:18},(_,i)=>{const e=makeEnemy('forager',1);e.d=40+i*79;Object.assign(e,posAt(e.d));e.hp=e.maxHp=10000;return e;});");
  if(process.argv.includes('--empty'))run("reset();S.phase='build';S.buildTimer=999;");
  const dir=path.join(root,'reports/generated/organic-world-'+zone+(process.argv.includes('--viewport')?'-viewport':'')+(process.argv.includes('--empty')?'-empty':''));fs.mkdirSync(dir,{recursive:true});
  const preview=createCanvas(960,540),p=preview.getContext('2d');
  for(let frame=0;frame<90;frame++){
    if(!process.argv.includes('--empty')&&(frame===18||frame===48))run('togglePause(S.towers[0]);togglePause(S.towers[2]);');
    run('update(2*SIM_STEP);presentationTime+=2*SIM_STEP;');
    const signature=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),signature,'rendering is read-only');
    p.clearRect(0,0,960,540);p.drawImage(canvas,0,0,960,540);
    if(process.argv.includes('--frames'))fs.writeFileSync(path.join(dir,String(frame).padStart(3,'0')+'.png'),preview.toBuffer('image/png'));
    if(frame===12){
      fs.writeFileSync(path.join(dir,'scene.png'),canvas.toBuffer('image/png'));
      if(process.argv.includes('--viewport')&&process.argv.includes('--empty'))fs.writeFileSync(path.join(root,'assets/art/previews/organic-world-'+zone+'-gameplay-v2.webp'),canvas.encodeSync('webp',90));
      if(!process.argv.includes('--viewport'))fs.writeFileSync(path.join(root,'assets/art/previews/organic-world-'+zone+'-v1.webp'),canvas.encodeSync('webp',90));
    }
  }
  // Native alpha checks catch architectural obstruction of a full-height tower at every actual build pad.
  // Up to 16/255 alpha is the generated cutout's faint light fringe, not opaque masonry.
  const box=JSON.parse(run('JSON.stringify(GATE_ART_BOX)')),slots=JSON.parse(run('JSON.stringify(SLOTS.map(s=>({x:s.x,y:s.y})))'));
  for(const side of ['rear','front']){
    const layer=run('gateStone().'+side),data=layer.getContext('2d').getImageData(0,0,layer.width,layer.height).data;
    for(const slot of slots)for(let y=slot.y-62;y<slot.y+18;y++)for(let x=slot.x-22;x<slot.x+22;x++){
      const ix=Math.floor((x-box.x)*2),iy=Math.floor((y-box.y)*2);
      if(ix>=0&&iy>=0&&ix<layer.width&&iy<layer.height)assert.ok(data[(iy*layer.width+ix)*4+3]<=16,'Gate '+side+' covers build slot '+JSON.stringify(slot)+' at '+x+','+y);
    }
  }
  const exit=JSON.parse(run('JSON.stringify(GATE)'));
  const pixel=canvas.getContext('2d').getImageData(Math.round(exit.x*canvas.width/960),Math.round(exit.y*canvas.height/540),1,1).data;
  assert.ok(pixel[1]>pixel[0]*1.3&&pixel[2]>pixel[0]*1.3,'the visible cyan threshold intersects the actual leak point');
  console.log('PASS '+zone+': 90 actual renderer frames, pause/resume and no stone obstruction of build slots. '+path.join(dir,'scene.png'));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
