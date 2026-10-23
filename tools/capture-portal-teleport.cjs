'use strict';
// Actual game frame/update/draw through the shared native renderer. No pasted sprites or mocked effects.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const root=path.join(__dirname,'..'),out=path.join(root,'reports/portal-teleport');
async function capture(multiple=false){
 const {canvas,run}=await loadWorld(),dir=path.join(root,'reports/generated/portal-teleport',multiple?'multiple':'single');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(out,{recursive:true});
 run(`reset();S.phase='wave';S.wave=1;S.spawnQueue=[];S.enemies=Array.from({length:${multiple?3:1}},(_,i)=>{const e=makeEnemy('forager',1);e.seq=i+1;e.d=GATE_D-28-i*15;Object.assign(e,posAt(e.d));return e;});`);
 const crop=createCanvas(1020,738),cg=crop.getContext('2d'),timeline=[],seen=new Map();
 const names={0:'01-approach',12:'02-threshold',27:'stretch',32:'03-peak',40:'04-trail'};
 for(let n=0;n<=90;n++){
  run('frame('+n*1000/60+')');
  const sig=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),sig,'capture drawing cannot change simulation');
  cg.clearRect(0,0,crop.width,crop.height);cg.drawImage(canvas,620*2,260*2,340*2,246*2,0,0,crop.width,crop.height);
  fs.writeFileSync(path.join(dir,String(n).padStart(3,'0')+'.png'),crop.toBuffer('image/png'));
  const state=JSON.parse(run('JSON.stringify({time:presentationTime,count:portalSequence,alive:S.enemies.length,gate:S.gate,entries:portalEntries.map(e=>({id:e.id,at:e.at,d:e.d,hit:e.hit,...portalEntryState(e)}))})'));
  for(const e of state.entries)if(!seen.has(e.id))seen.set(e.id,{id:e.id,at:e.at,d:e.d,hit:e.hit});
  if(!multiple&&names[n]){fs.writeFileSync(path.join(out,names[n]+'.webp'),crop.encodeSync('webp',94));timeline.push({stage:names[n],frame:n,...state});}
  if(multiple&&n===38){fs.writeFileSync(path.join(out,'multiple.webp'),crop.encodeSync('webp',94));timeline.push({stage:'multiple',frame:n,...state});}
  if(!multiple&&n===27)fs.writeFileSync(path.join(out,'whole-map.webp'),canvas.encodeSync('webp',92));
 }
 assert.equal(run('portalSequence'),multiple?3:1);assert.equal(run('S.waveLeaked'),multiple?3:1);assert.equal(run('S.gate'),multiple?17:19);
 if(!multiple){assert.equal(timeline.find(s=>s.stage==='01-approach').count,0);assert.equal(timeline.find(s=>s.stage==='02-threshold').count,1);assert.equal(timeline.find(s=>s.stage==='03-peak').entries[0].alpha,0);assert.equal(timeline.find(s=>s.stage==='04-trail').alive,0);assert.ok(timeline.find(s=>s.stage==='04-trail').entries[0].trail>0);}
 fs.writeFileSync(path.join(out,multiple?'multiple-timeline.json':'single-timeline.json'),JSON.stringify({threshold:run('PORTAL_ENTRY_D'),entries:[...seen.values()],stages:timeline},null,2)+'\n');
 console.log('PASS '+(multiple?'three separate entries':'single-body approach/threshold/stretch/peak/trail')+'; normal leak damage; '+dir);
}
(async()=>{await capture();await capture(true);})().catch(e=>{console.error(e);process.exitCode=1;});
