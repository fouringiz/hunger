'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas'),{loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..');
async function capture(stage){
 const out=path.join(ROOT,'reports/leech-16dir'),scratch=path.join(ROOT,'reports/generated/leech-16dir');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(scratch,{recursive:true});
 const before=stage==='before',asset=path.join(scratch,'before.webp');
 if(before)fs.writeFileSync(asset,execFileSync('git',['show','e6f2641:assets/hunger-leech-mire-v1.webp'],{cwd:ROOT}));
 const {canvas,run}=await loadWorld({sourceHtml:before?execFileSync('git',['show','e6f2641:prototype/index.html'],{cwd:ROOT,encoding:'utf8'}):null,assetOverrides:before?{leechMireArt:asset}:{}});
 run("reset();S.phase='wave';S.wave=1;S.spawnQueue=[];const e=makeEnemy('leech',1);e.seq=1;e.d=1290;Object.assign(e,posAt(e.d));S.enemies=[e];");
 const strip=createCanvas(8*200,200),g=strip.getContext('2d'),records=[];let next=1290;
 for(let tick=0;tick<1000&&records.length<8;tick++){
  if(tick)run('stepSimulation(SIM_STEP);presentationTime+=SIM_STEP;');
  if(run('e.d')<next)continue;
  const sig=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),sig);
  const pos=JSON.parse(run('JSON.stringify({x:visualEnemy(e).x,y:visualEnemy(e).y,d:e.d,angle:enemyHeading(e),row:creatureCrawlPose(e,enemyHeading(e)).row,tick:replay.tick})'));
  const i=records.length;g.drawImage(canvas,(pos.x-40)*2,(pos.y-60)*2,160,160,i*200,0,200,200);
  g.fillStyle='white';g.font='13px sans-serif';g.fillText(`d=${pos.d.toFixed(0)} row=${pos.row}`,i*200+6,192);
  if(i===3)fs.writeFileSync(path.join(out,'game-'+stage+'.webp'),canvas.encodeSync('webp',92));
  records.push({...pos,simulationTick:tick});next+=18;
 }
 assert.equal(records.length,8);fs.writeFileSync(path.join(out,'diagonal-'+stage+'.webp'),strip.encodeSync('webp',96));
 fs.writeFileSync(path.join(out,'diagonal-'+stage+'.json'),JSON.stringify(records,null,2)+'\n');
 console.log(stage+': rows '+records.map(p=>p.row).join(','));
}
if(require.main===module)capture(process.argv[2]||'after').catch(e=>{console.error(e);process.exitCode=1;});
module.exports={capture};
