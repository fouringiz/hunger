'use strict';
// Real renderer/simulation: follow a Leech past an empty pad to a generator.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas'),{loadWorld}=require('./capture-organic-world.cjs');
const root=path.join(__dirname,'..'),out=path.join(root,'reports/generated/leech-body-contact');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const rejected=execFileSync('git',['show','c01c1b9:prototype/index.html'],{cwd:root,encoding:'utf8'});
 for(const zone of ['mire','ember'])for(const stage of ['before','after']){
  const {run,canvas}=await loadWorld({zone,sourceHtml:stage==='before'?rejected:null});
  run("reset();S.credits=10000;build(SLOTS[5],'generator');S.selected=null;observeConstruction();presentationTime=2;observeConstruction();S.phase='wave';S.wave=5;S.spawnQueue=[];var actor=makeEnemy('leech',5);actor.d=500;actor.x=SLOTS[2].x-70;actor.y=SLOTS[2].y+27;actor.state='seek';actor.gen=S.towers[0];actor.gen.leeched=actor;S.enemies=[actor];");
  const sheet=createCanvas(1200,1000),g=sheet.getContext('2d');
  for(let frame=0;frame<25;frame++){
   if(frame)run('for(let tick=0;tick<8;tick++){stepSimulation(SIM_STEP);presentationTime+=SIM_STEP;}');
   const signature=run('replaySignature()');run('draw()');assert.equal(run('replaySignature()'),signature);
   const p=JSON.parse(run('JSON.stringify({x:visualEnemy(actor).x,y:visualEnemy(actor).y,state:actor.state,time:S.time})'));
   const x=(frame%5)*240,y=Math.floor(frame/5)*200;
   g.drawImage(canvas,(p.x-60)*2,(p.y-65)*2,240,200,x,y,240,200);
   g.fillStyle='#101820';g.fillRect(x,y,240,18);g.fillStyle='#fff';g.font='12px sans-serif';g.fillText(`${frame}: ${p.time.toFixed(2)}s ${p.state}`,x+4,y+13);
   if(frame===12)fs.writeFileSync(path.join(out,`${zone}-${stage}-whole.webp`),canvas.encodeSync('webp',94));
  }
  fs.writeFileSync(path.join(out,`${zone}-${stage}-context.webp`),sheet.encodeSync('webp',96));
  console.log(`${zone} ${stage}: ${out}`);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
