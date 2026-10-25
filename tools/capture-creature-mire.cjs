'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas'),{loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),BASE='22e4d45';
async function capture(stage='after',zone='mire',poses=false){
 assert.ok(['before','after'].includes(stage),'stage must be before or after');
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
  if(n===3){
   fs.writeFileSync(path.join(out,zone+'-'+stage+'-whole.webp'),canvas.encodeSync('webp',92));
   const gray=createCanvas(canvas.width,canvas.height),g=gray.getContext('2d');g.drawImage(canvas,0,0);
   const pixels=g.getImageData(0,0,gray.width,gray.height);
   for(let k=0;k<pixels.data.length;k+=4){const v=Math.round(.2126*pixels.data[k]+.7152*pixels.data[k+1]+.0722*pixels.data[k+2]);pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=v;}
   g.putImageData(pixels,0,0);fs.writeFileSync(path.join(out,zone+'-'+stage+'-gray.webp'),gray.encodeSync('webp',92));
  }
 }
 for(let i=0;i<3;i++)fs.writeFileSync(path.join(out,zone+'-'+['carapacid','leech','forager'][i]+'-'+stage+'.webp'),strips[i].encodeSync('webp',96));
 if(poses){
  // Controlled heading/distance probes through the real draw(), separate from the route-motion strips above.
  run('var captureHeading=0;enemyHeading=()=>captureHeading;');
  for(const type of ['carapacid','leech']){
   const directions=type==='leech'?16:4,stride=type==='leech'?24:28;
   const sheet=createCanvas(9*180,directions*180),g=sheet.getContext('2d');
   for(let row=0;row<directions;row++){
    const angle=row*2*Math.PI/directions;
    run(`reset();S.phase='wave';S.spawnQueue=[];captureHeading=${angle};var cycleActor=makeEnemy('${type}',1);cycleActor.d=0;cycleActor.x=480;cycleActor.y=270;S.enemies=[cycleActor];`);
    for(let phase=0;phase<=8;phase++){
     const d=phase*stride/8;
     run(`cycleActor.d=${d};cycleActor.x=480+${Math.cos(angle)*d};cycleActor.y=270+${Math.sin(angle)*d};presentationTime=${phase/8};draw();`);
     const p=JSON.parse(run('JSON.stringify(visualEnemy(cycleActor))'));
     g.drawImage(canvas,(p.x-45)*2,(p.y-60)*2,180,180,phase*180,row*180,180,180);
     g.fillStyle='#fff';g.font='12px sans-serif';g.fillText(`${row}: ${phase}/8`,phase*180+4,row*180+14);
    }
   }
   fs.writeFileSync(path.join(out,`${zone}-${type}-${stage}-poses.webp`),sheet.encodeSync('webp',96));
  }
 }
 console.log(zone+' '+stage);
}
if(require.main===module)capture(process.argv[2],process.argv.includes('--ember')?'ember':'mire',process.argv.includes('--poses')).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={capture};
