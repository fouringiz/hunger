'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const{loadWorld}=require('../tools/capture-organic-world.cjs');
const html=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8'),entries=require('../assets/hunger-level4-towers-v2.frames.json').entries;
async function check(sourceHtml=html){
 const w=await loadWorld({sourceHtml});
 w.run(`let effectArcs=[],effectMoves=[],effectJets=[];const effectDraw=ctx.drawImage.bind(ctx);ctx.drawImage=(...a)=>{if(a[0]===flameJetArt){const m=ctx.getTransform();effectJets.push({x:m.e,y:m.f});}effectDraw(...a);};const effectArc=ctx.arc.bind(ctx),effectMove=ctx.moveTo.bind(ctx);ctx.arc=(...a)=>{effectArcs.push({a,color:ctx.fillStyle,stroke:ctx.strokeStyle});effectArc(...a);};ctx.moveTo=(...a)=>{effectMoves.push(a);effectMove(...a);};terrain=()=>{};drawGateApproach=()=>{};drawFiringLane=()=>{};`);
 let count=0;
 for(const e of entries.filter(e=>e.frames.length>1)){
  w.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(e.type)});upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],${JSON.stringify(e.branch)});S.towers[0].warm=0;observeConstruction();presentationTime=3;observeConstruction();`);
  for(let j=0;j<16;j++){
   const points=[],base=3+j*.3;w.run('level4ViewStates.delete(S.towers[0]);');
   for(const [delta,dt]of[[-1e-7,0],[1e-7,0],[1e-7,.03],[1e-7,.08]]){
    const yaw=(j+.5)*Math.PI/8+delta,angle=Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw)),now=base+dt;
    w.run(`S.towers[0].angle=${angle};presentationTime=${now};weaponFeedback.set(S.towers[0],{at:${now-.02},kind:S.towers[0].type,angle:${angle+1}});S.towers[0].jetAt=S.time;presentationBursts.length=0;presentationBursts.push({kind:'cannonMuzzle',at:${now-.02},life:.2,x:S.towers[0].x,y:S.towers[0].y,angle:${angle+1}});effectArcs=[];effectMoves=[];effectJets=[];`);
    const muzzle=JSON.parse(w.run('JSON.stringify(weaponMuzzle(S.towers[0]))'));points.push(muzzle);
    if(e.type==='flamer'){
     const basis=JSON.parse(w.run('JSON.stringify({a:ctx.getTransform().a,b:ctx.getTransform().b,c:ctx.getTransform().c,d:ctx.getTransform().d,e:ctx.getTransform().e,f:ctx.getTransform().f})'));w.run('drawFlameJet(S.towers[0]);');if(e.branch==='A'){const jets=JSON.parse(w.run('JSON.stringify(effectJets)'));assert.equal(jets.length,2,'Plasma draws approved sheet and halo');for(const p of jets)assert.ok(Math.hypot(p.x-(basis.a*muzzle.x+basis.c*muzzle.y+basis.e),p.y-(basis.b*muzzle.x+basis.d*muzzle.y+basis.f))<1e-3,e.key+': stream detaches from current blended nozzle');}else{const moves=JSON.parse(w.run('JSON.stringify(effectMoves.slice(0,3))'));assert.equal(moves.length,3);for(const[x,y]of moves)assert.ok(Math.hypot(x-muzzle.x,y-muzzle.y)<1e-7,e.key+': stream detaches from current blended nozzle');}
    }else{
     w.run('draw();');const arcs=JSON.parse(w.run('JSON.stringify(effectArcs)')),colors=e.type==='turret'?['#fff0ad']:e.type==='cannon'?['#ffd27f']:[];
     if(colors.length){const flash=arcs.find(a=>colors.includes(a.color));assert.ok(flash,e.key+': actual flash path exercised');assert.ok(Math.hypot(flash.a[0]-muzzle.x,flash.a[1]-muzzle.y)<1e-7,e.key+': flash detaches to stale firing angle');}
    }
    count++;
   }
   assert.ok(Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)<.001,e.key+': effect origin jumps across pose boundary');
  }

 }
 return count;
}
(async()=>{const count=await check();const bad=html.replace('weaponMuzzle(t,level4Spec(t)&&level4Ready()?t.angle:feedback.angle)','weaponMuzzle(t,feedback.angle)');assert.notEqual(bad,html);await assert.rejects(()=>check(bad),/flash detaches to stale firing angle/);console.log('PASS level-4 effects: '+count+' boundary states; actual flash/stream origins share current interpolated muzzle; stale-angle flash rejected');})().catch(e=>{console.error(e);process.exitCode=1;});
