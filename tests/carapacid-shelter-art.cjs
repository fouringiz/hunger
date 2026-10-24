'use strict';
const assert=require('node:assert/strict'),{loadWorld}=require('../tools/capture-organic-world.cjs');
(async()=>{
 const {canvas,run,images}=await loadWorld({viewport:[960,540]});
 assert.equal(images.carapacidShelterArt.width,1024);assert.equal(images.carapacidShelterArt.height,256);
 run(`reset();S.phase='wave';S.wave=1;S.spawnQueue=[];S.credits=1000;build(SLOTS[1],'turret');S.towers[0].cd=999;
 const c=makeEnemy('carapacid',1);c.d=285;Object.assign(c,posAt(c.d));c.hp=100000;
 const fs=Array.from({length:3},(_,i)=>{const e=makeEnemy('forager',1);e.seq=i;e.d=c.d-15-i*18;Object.assign(e,posAt(e.d));return e;});S.enemies=[c,...fs];
 for(let i=0;i<60;i++)stepSimulation(1/30);`);
 const pixels=()=>canvas.getContext('2d').getImageData(0,0,960,540).data;
 run('ctx.clearRect(0,0,W,H);enemyArt(visualEnemy(c));');const shell=Buffer.from(pixels());
 for(let i=0;i<3;i++){
  assert.equal(run(`shelteredBy(fs[${i}])===c`),true);
  run(`ctx.clearRect(0,0,W,H);enemyArt(visualEnemy(fs[${i}]));`);const body=pixels();let total=0,covered=0;
  for(let k=3;k<body.length;k+=4)if(body[k]>180){total++;if(shell[k]>180)covered++;}
  const ratio=covered/total;
  assert.ok(total>100,'Forager has a visible silhouette');
  assert.ok(ratio>.06&&ratio<.88,`berth ${i}: shell must cover part of the body but leave it recognizable (${ratio.toFixed(2)})`);
 }
 const signature=run('replaySignature()');run('draw();draw();');assert.equal(run('replaySignature()'),signature);
 run('c.dead=true;');assert.equal(run('fs.some(e=>shelteredBy(e))'),false,'dead shell cannot occlude the group');
 console.log('PASS actual sprite alpha: every sheltered Forager is partly covered and partly visible; rendering is read-only');
})().catch(e=>{console.error(e);process.exitCode=1});
