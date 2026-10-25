'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas'),{loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),BASE='aa9ed15';
async function capture(stage='after',zone='mire'){
 const {canvas,run}=await loadWorld({zone,sourceHtml:stage==='before'?execFileSync('git',['show',BASE+':prototype/index.html'],{cwd:ROOT,encoding:'utf8'}):null});
 const out=path.join(ROOT,'reports/creature-mire-contact');fs.mkdirSync(out,{recursive:true});
 run("reset();S.phase='wave';S.wave=1;S.spawnQueue=[];S.enemies=['carapacid','leech','forager'].map((type,i)=>{const e=makeEnemy(type,1);e.seq=i;e.d=[420,550,70][i];Object.assign(e,posAt(e.d));return e;});");
 const strips=Array.from({length:3},()=>createCanvas(8*240,240));
 for(let t=0;t<=56;t++){
  if(t)run('stepSimulation(SIM_STEP);presentationTime+=SIM_STEP;');
  const sign=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),sign);
  if(t%8)continue;const n=t/8;
  const positions=JSON.parse(run('JSON.stringify(S.enemies.map(e=>{const v=visualEnemy(e);return {x:v.x,y:v.y};}))'));
  positions.forEach((p,i)=>strips[i].getContext('2d').drawImage(canvas,(p.x-40)*2,(p.y-50)*2,160,160,n*240,0,240,240));
  if(n===3)fs.writeFileSync(path.join(out,zone+'-'+stage+'-whole.webp'),canvas.encodeSync('webp',92));
 }
 for(let i=0;i<3;i++)fs.writeFileSync(path.join(out,zone+'-'+['carapacid','leech','forager'][i]+'-'+stage+'.webp'),strips[i].encodeSync('webp',96));
 console.log(zone+' '+stage);
}
if(require.main===module)capture(process.argv[2],process.argv.includes('--ember')?'ember':'mire').catch(e=>{console.error(e);process.exitCode=1;});
module.exports={capture};
