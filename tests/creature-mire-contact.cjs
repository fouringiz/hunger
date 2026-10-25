'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas'),{loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
 const {run,canvas,images}=await loadWorld();
 run("reset();S.phase='wave';S.spawnQueue=[];draw();const savedBurial=drawCreatureBurial;const probe=makeEnemy('leech',1);probe.x=480;probe.y=270;probe.__k=1;worldLiveArt=document.createElement('canvas');worldLiveArt.width=W*WORLD_RASTER_SCALE;worldLiveArt.height=H*WORLD_RASTER_SCALE;const flat=worldLiveArt.getContext('2d');flat.fillStyle='#b06020';flat.fillRect(0,0,worldLiveArt.width,worldLiveArt.height);");
 const ctx=canvas.getContext('2d'),pixel=()=>ctx.getImageData(0,0,256,256).data;
 const groundDistance=(p,k)=>Math.abs(p[k]-176)+Math.abs(p[k+1]-96)+Math.abs(p[k+2]-32);
 let rejectedOldLip=0;
 for(const [type,file,art]of [['carapacid','hunger-carapacid-shelter-v1',images.carapacidShelterArt],['leech','hunger-leech-mire-v1',images.leechMireArt]]){
  const table=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets',file+'.ground-contacts.json')));
  assert.deepEqual(JSON.parse(run(`JSON.stringify(CREATURE_MIRE_CONTACTS.${type})`)),table,'offline/runtime contacts agree');
  const atlas=createCanvas(art.width,art.height),a=atlas.getContext('2d');a.drawImage(art,0,0);
  for(let row=0;row<table.directions;row++)for(let frame=0;frame<4;frame++){
   const contacts=table.rows[row][frame],rgba=a.getImageData(frame*256,row*256,256,256).data;
   assert.ok(contacts.rim.length>15);
   for(const [x,y]of [...contacts.rim,...contacts.feet])assert.ok(rgba[(y*256+x)*4+3]>=128,'contact is on the actual opaque silhouette');
   assert.ok(type==='leech'?contacts.belly.length>=4:contacts.feet.length>=3);
   run(`probe.type='${type}';const pose_${type}_${row}_${frame}={row:${row},frame:${frame}};`);
   const pose=`pose_${type}_${row}_${frame}`,spec=JSON.parse(run(`JSON.stringify(CREATURE_MIRE.${type})`));
   const paint=burial=>{
    run(`ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,256,256);ctx.translate(128,128);ctx.drawImage(${type==='leech'?'leechMireArt':'carapacidShelterArt'},${frame*256},${row*256},256,208,${-spec.size/2},${-208/256*spec.size+spec.sink},${spec.size},${208/256*spec.size});${burial}`);
    return Buffer.from(pixel());
   };
   const raw=paint(''),buried=paint(`drawCreatureBurial(probe,${pose});`);
   // Negative control: the previous anchor-only lip cannot cover a raised belly or leg contour.
   const lip=paint("ctx.save();ctx.beginPath();ctx.rect(-40,-.7,80,4.7);ctx.clip();ctx.fillStyle='#b06020';ctx.fillRect(-40,-.7,80,4.7);ctx.restore();");
   let covered=0,oldCovered=0,soft=0;
   for(let y=50;y<124;y++)for(let x=85;x<172;x++){
    const k=(y*256+x)*4;if(raw[k+3]<180||groundDistance(raw,k)<70)continue;
    if(groundDistance(buried,k)<groundDistance(raw,k)*.5)covered++;
    if(groundDistance(lip,k)<groundDistance(raw,k)*.5)oldCovered++;
    const delta=groundDistance(raw,k)-groundDistance(buried,k);if(delta>10&&delta<groundDistance(raw,k)*.8)soft++;
   }
   assert.ok(covered>15,`${type} row ${row} frame ${frame}: ground must overlap actual raised underside (${covered})`);
   assert.ok(soft>10,'burial has a feathered transition');
   assert.equal(oldCovered,0,'old lip fails the same raised-underside regression');rejectedOldLip++;
  }
 }
 run("ctx.setTransform(1,0,0,1,0,0);reset();S.phase='wave';S.spawnQueue=[];const actor=makeEnemy('leech',1);actor.d=500;Object.assign(actor,posAt(actor.d));S.enemies=[actor];draw();");
 const sign=run('replaySignature()');run('draw();');assert.equal(run('replaySignature()'),sign,'draw cannot mutate simulation');
 run('actor.d+=10;Object.assign(actor,posAt(actor.d));presentationTime+=.1;draw();');
 assert.ok(run('mireTraffic.some(t=>t.contacts&&t.contacts.length>=4)'),'trail uses the belly support path');
 run('presentationTime+=2;draw();');assert.equal(run('mireTraffic.length'),0,'contact trails expire');
 assert.equal(run("creatureMireReady({type:'forager'})"),false,'Forager stays on its original pipeline');
 // A portal body must never sample ground at the snapshot's synthetic (0,0).
 for(const type of ['carapacid','leech']){
  run(`reset();const entry_${type}=makeEnemy('${type}',1);entry_${type}.d=PORTAL_ENTRY_D;Object.assign(entry_${type},posAt(PORTAL_ENTRY_D));S.enemies=[entry_${type}];observePortalEntries();`);
  run("var capturedPortalBody=null;var originalBody=drawEnemyBody;drawEnemyBody=e=>{capturedPortalBody=e;};drawPortalEntry(portalEntries[0]);drawEnemyBody=originalBody;");
  assert.equal(run('capturedPortalBody.__portalAirborne'),true,'portal renderer explicitly releases ground contact');
  assert.equal(run('capturedPortalBody.x===portalEntries[0].hit.x&&capturedPortalBody.y===portalEntries[0].hit.y'),true,'portal lighting uses the real entry position');
  run('var realGround=worldLiveArt;worldLiveArt={};ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,256,256);ctx.translate(128,128);');
  assert.doesNotThrow(()=>run('drawCreatureContactShadow(capturedPortalBody,creatureCrawlPose(capturedPortalBody,0));drawCreatureBurial(capturedPortalBody,creatureCrawlPose(capturedPortalBody,0));'),'airborne body never reads the ground texture');
  assert.ok(pixel().every(v=>v===0),'airborne body has no contact shadow or ground overlay');
  assert.throws(()=>run('drawCreatureBurial({...capturedPortalBody,__portalAirborne:false},creatureCrawlPose(capturedPortalBody,0));'),'negative control: grounded body attempts to sample the invalid ground image');
  run('worldLiveArt=realGround;');
 }
 console.log(`PASS creature mire: all ${rejectedOldLip} poses bury/feather the real underside; old lip rejected; contacts, trails and read-only drawing`);
})().catch(e=>{console.error(e);process.exitCode=1;});
