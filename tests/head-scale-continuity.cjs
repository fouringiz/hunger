'use strict';
// A head must not change size when deployment hands over to the planted pose (no pop at the end of the build).
const assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
  const w=await loadWorld({viewport:[960,540]});
  w.run("reset();S.phase='build';S.credits=10000;build(SLOTS[2],'turret');build(SLOTS[3],'cannon');observeConstruction();presentationTime=5;observeConstruction();");
  const scale=code=>Number(w.run(`(()=>{const seen=[];const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(img,...a)=>{if(img===structureArt){const m=ctx.getTransform();seen.push(Math.sqrt(Math.abs(m.a*m.d-m.b*m.c)));}return draw(img,...a);};ctx.save();try{${code}}finally{ctx.restore();ctx.drawImage=draw;}return Math.max(...seen);})()`));
  for(const i of [0,1]){
    const planted=scale(`drawPlantedWeapon(S.towers[${i}],0);`),late=scale(`drawWeaponDeployment(S.towers[${i}],.99);`);
    assert.ok(planted>0&&late>0,'both poses draw the textured head');
    assert.ok(Math.abs(planted-late)<1e-6,`head scale must match across the deployment hand-over (${late} vs ${planted})`);
  }
  console.log('PASS turret and cannon heads keep one scale from deployment to the planted pose');
})().catch(e=>{console.error(e);process.exitCode=1;});
