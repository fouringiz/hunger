'use strict';
// Real game renderer via the shared capture harness; never an atlas pasted over a map.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
async function capture(stage){
 const out=path.join(__dirname,'../reports/forager-vertical-gait'),{canvas,run}=await loadWorld();fs.mkdirSync(out,{recursive:true});
 run("reset();S.phase='wave';S.wave=1;S.spawnQueue=[];S.enemies=[675,1100].map((d,i)=>{const e=makeEnemy('forager',1);e.seq=i;e.wave=1;e.d=d;Object.assign(e,posAt(d));e.hp=e.maxHp=10000;return e;});");
 const strips=[createCanvas(9*160,160),createCanvas(9*160,160)],frames=[0,3,6,9,12,15,18,21,24];
 for(let tick=0;tick<=48;tick++){
  if(tick)run('update(SIM_STEP);presentationTime+=SIM_STEP;');
  const signature=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),signature);
  if(frames.includes(tick/2)){
   const n=frames.indexOf(tick/2),enemies=JSON.parse(run('JSON.stringify(S.enemies.map(e=>{const v=visualEnemy(e);return {x:v.x,y:v.y};}))'));
   enemies.forEach((e,i)=>strips[i].getContext('2d').drawImage(canvas,(e.x-20)*2,(e.y-27)*2,40*2,40*2,n*160,0,160,160));
   if(n===4)fs.writeFileSync(path.join(out,'game-'+stage+'.png'),canvas.toBuffer('image/png'));
  }
 }
 strips.forEach((strip,i)=>fs.writeFileSync(path.join(out,'game-row-'+[12,4][i]+'-'+stage+'.png'),strip.toBuffer('image/png')));
 console.log('Captured '+stage+' from tools/capture-organic-world.cjs loadWorld, full frame and both vertical cycles.');
}
if(require.main===module)capture(process.argv[2]||'after').catch(e=>{console.error(e);process.exitCode=1;});
module.exports={capture};
