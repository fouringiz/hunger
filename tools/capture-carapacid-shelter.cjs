'use strict';
const {readRevision}=require('./history.cjs');
const fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..');
async function capture(){
 const zone=process.argv.includes('--ember')?'ember':'mire',dir=path.join(ROOT,'reports/carapacid-shelter'),frames=path.join(ROOT,'reports/generated/carapacid-shelter-'+zone);fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(frames,{recursive:true});
 const before=process.argv.includes('--before');
 const sourceHtml=before?readRevision('0a6d30a','prototype/index.html'):null;
 const {canvas,run}=await loadWorld({zone,sourceHtml});
 run(`reset();S.credits=10000;build(SLOTS[1],'turret');S.towers[0].cd=999;S.selected=null;observeConstruction();presentationTime=2;observeConstruction();S.phase='wave';S.wave=1;S.spawnQueue=[];
 const c=makeEnemy('carapacid',1);c.d=285;Object.assign(c,posAt(c.d));c.hp=c.maxHp=100000;
 const followers=Array.from({length:5},(_,i)=>{const e=makeEnemy('forager',1);e.seq=i;e.d=c.d-15-i*13;Object.assign(e,posAt(e.d));e.hp=e.maxHp=10000;return e;});S.enemies=[c,...followers];`);
 const crop=createCanvas(840,980),g=crop.getContext('2d'),mini=createCanvas(960,540),m=mini.getContext('2d');
 for(let i=0;i<=180;i++){
  if(i===100)run('c.dead=true;');
  run('presentationTime+=1/30;stepSimulation(1/30);');
  const key={0:'approach',60:'shelter',99:'held',100:'death',140:'release'}[i];
  if(!key&&!process.argv.includes('--frames'))continue;
  run('draw();');
  g.clearRect(0,0,840,980);g.drawImage(canvas,100*2,40*2,240*2,280*2,0,0,840,980);
  if(process.argv.includes('--frames'))fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),crop.toBuffer('image/png'));
  if(key){fs.writeFileSync(path.join(dir,zone+(before?'-before':'')+'-'+key+'.webp'),crop.encodeSync('webp',94));if(key==='shelter'){m.drawImage(canvas,0,0,960,540);fs.writeFileSync(path.join(dir,zone+(before?'-before':'')+'-whole.webp'),mini.encodeSync('webp',92));}}
 }
 console.log(dir);
}
capture().catch(e=>{console.error(e);process.exitCode=1});
