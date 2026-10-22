// Generate a local, one-Forager review page from the real prototype renderer and simulation.
// No browser, build tool or third-party dependency is required to generate the page.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const demo=String.raw`
let studyTick=0,studyAccumulator=0,studyGround=null,studyPrevious=performance.now();
function resetForagerStudy(){
  reset();S.phase='wave';S.wave=1;S.spawnQueue=[];
  const e=makeEnemy('forager',1);e.d=140;Object.assign(e,posAt(e.d));S.enemies=[e];studyTick=0;
}
function advanceForagerStudy(dt){
  studyAccumulator+=dt;
  while(studyAccumulator+1e-9>=SIM_STEP){
    studyAccumulator-=SIM_STEP;if(studyTick>=480)resetForagerStudy();
    const t=studyTick*SIM_STEP,e=S.enemies[0];e.speed=t>=2.2&&t<3.3?0:e.T.speed;
    e.dash=t>=1.2&&t<2.2||t>=6&&t<7.2?1:0;
    update(SIM_STEP);studyTick++;
  }
}
function createStudyGround(){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle='#27372e';g.fillRect(0,0,W,H);
  const path=()=>{g.beginPath();g.moveTo(...PATH[0]);for(const p of PATH)g.lineTo(...p);};
  g.lineJoin='round';g.lineCap='round';
  for(const [width,color]of [[68,'#2c352e'],[62,'#30342e'],[56,'#34322c'],[48,'#34292a'],[36,'#39292b']]){g.strokeStyle=color;g.lineWidth=width;path();g.stroke();}
  let seed=2281;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let n=0;n<4500;n++){
    const d=rnd()*GATE_D,p=posAt(d),q=posAt(d+1),angle=Math.atan2(q.y-p.y,q.x-p.x),side=(rnd()-.5)*65;
    const x=p.x-Math.sin(angle)*side,y=p.y+Math.cos(angle)*side;
    g.fillStyle=['#9454550d','#101f1c22','#9c8f6910'][n%3];g.beginPath();g.ellipse(x,y,1+rnd()*3,.5+rnd()*1.5,rnd()*Math.PI,0,Math.PI*2);g.fill();
    if(n%18===0){g.lineWidth=.45;g.strokeStyle=n%36?'#8a555250':'#b49d7444';g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+7,y-6,x-8,y+11,x+4,y+15);g.stroke();}
  }
  return c;
}
function drawForagerStudy(){
  if(!studyGround)studyGround=createStudyGround();
  const e=S.enemies[0],t=studyTick*SIM_STEP,phase=e.effSpeed===0?'STOP · FEET AND BODY HOLD':e.dash>0?'SPRINTER · 1.7× TRAVEL':'CRAWL · NORMAL SPEED';
  ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0);ctx.fillStyle='#101b19';ctx.fillRect(0,0,W,H);
  text('FORAGER / MOTION STUDY',26,32,18,'#d5d8bd','left','700');text(phase,W-26,32,12,'#b9b98a','right','700');
  const panels=[{x:20,y:58,w:600,h:410,zoom:4.4,label:'BODY WAVE / 4.4×'},{x:640,y:58,w:300,h:250,zoom:1,label:'ACTUAL GAME SCALE / 1×'}];
  for(const p of panels){
    ctx.save();ctx.beginPath();ctx.rect(p.x,p.y,p.w,p.h);ctx.clip();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.scale(p.zoom,p.zoom);ctx.translate(-e.x+12,-e.y+1);
    ctx.drawImage(studyGround,0,0);drawForagerGround();enemyArt(e);ctx.restore();
    ctx.strokeStyle='#4c5b49';ctx.lineWidth=1;ctx.strokeRect(p.x,p.y,p.w,p.h);text(p.label,p.x+12,p.y+18,10,'#a8b491','left','700');
  }
  text('ONE CREATURE',654,345,13,'#d5d8bd','left','700');
  for(const [i,line]of ['7 body slices follow the lane','12 legs: planted stance, then swing','Phase follows distance, not a timer','Contact veins fade after one second','Organic ground is a local visual sample'].entries())text(line,654,374+i*18,11,'#a6b49e');
  text('NORMAL → SPRINT → STOP → RESUME → TURN',26,497,13,'#d5d8bd','left','600');
  text('Simulation unchanged · Other castes unchanged · Loop: 8 seconds',26,523,11,'#889b85');
}
function foragerStudyFrame(now){const dt=Math.max(0,Math.min(.1,(now-studyPrevious)/1000));studyPrevious=now;advanceForagerStudy(dt);drawForagerStudy();requestAnimationFrame(foragerStudyFrame);}
resetForagerStudy();requestAnimationFrame(foragerStudyFrame);
`;
function buildPreview(){
  let html=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8');
  html=html.replace("const FORAGER_WAVE_STUDY = typeof location!=='undefined' && new URLSearchParams(location.search).get('foragerWave')==='1';",'const FORAGER_WAVE_STUDY = true;');
  html=html.replace(/requestAnimationFrame\(frame\);\s*<\/script>/,demo+'\n</script>');
  return html.replace('<title>Ultimate TD — core loop prototype v0.5</title>','<title>Forager — motion study</title>');
}
if(require.main===module){const out=path.join(root,'reports/generated/forager-study.html');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,buildPreview());console.log(out);}
module.exports={buildPreview};
