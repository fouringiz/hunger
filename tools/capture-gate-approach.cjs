'use strict';
// Actual native renderer and fixed-step simulation, including normal leak/removal; no actor fading.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
async function main(){
 const {canvas,run}=await loadWorld();
 const root=path.join(__dirname,'..'),dir=path.join(root,'reports/generated/gate-approach-v8');fs.mkdirSync(dir,{recursive:true});
 const full=createCanvas(960,540),g=full.getContext('2d'),close=createCanvas(1020,618),cg=close.getContext('2d');
 run("reset();S.phase='wave';S.wave=1;S.spawnQueue=[];S.enemies=Array.from({length:6},(_,i)=>{const e=makeEnemy('forager',1);e.d=GATE_D-280+i*42;Object.assign(e,posAt(e.d));return e;});const shell=makeEnemy('carapacid',1);shell.d=GATE_D-180;Object.assign(shell,posAt(shell.d));S.enemies.push(shell);");
 for(let frame=0;frame<240;frame++){
  run('update(2*SIM_STEP);presentationTime+=2*SIM_STEP;');
  const signature=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),signature,'capture is read-only');
  g.drawImage(canvas,0,0,960,540);cg.drawImage(canvas,620*2,300*2,340*2,206*2,0,0,1020,618);
  fs.writeFileSync(path.join(dir,String(frame).padStart(3,'0')+'.png'),close.toBuffer('image/png'));
  if([0,40,80,120,160,200,239].includes(frame))fs.writeFileSync(path.join(dir,'full-'+frame+'.png'),full.toBuffer('image/png'));
  if(frame===80){fs.writeFileSync(path.join(root,'assets/art/previews/gate-approach-v8.webp'),close.encodeSync('webp',92));fs.writeFileSync(path.join(root,'assets/art/previews/gate-map-v8.webp'),full.encodeSync('webp',92));}
 }
 assert.equal(run('S.waveLeaked'),7,'six Foragers and one Carapacid reach the threshold through the actual movement code');
 assert.equal(run('S.gate'),9,'normal leak damage is preserved');
 console.log('PASS 240 native frames; six Foragers and one Carapacid traverse the bend and leak normally. '+dir);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
