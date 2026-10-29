'use strict';
// Actual head alpha: the seated placement must not introduce a deployment pop.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
const entries=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'),'utf8')).entries.filter(e=>e.frames.length>1);
async function check(sourceHtml=html){
 const w=await loadWorld({sourceHtml});
 w.run(`const clipDraw=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...args)=>{if(im===level4Art||(typeof level4BlendCanvas!=='undefined'&&im===level4BlendCanvas)||(typeof level4YawArt!=='undefined'&&im===level4YawArt))clipDraw(im,...args);};
 ctx.fill=ctx.fillRect=ctx.stroke=ctx.strokeRect=()=>{};drawLevel4Mechanism=()=>{};`);
 const paint=p=>{
  w.run(`ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;ctx.filter='none';ctx.setTransform(2,0,0,2,128,160);drawLevel4Tower(S.towers[0],${p});`);
  return w.canvas.getContext('2d').getImageData(0,0,256,256).data;
 };
 let cases=0;
 for(const e of entries){
  w.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(e.type)});upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],${JSON.stringify(e.branch)});`);
  for(let h=0;h<16;h++){
   const yaw=h*Math.PI/8,angle=Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw));w.run(`if(typeof level4ViewStates!=='undefined')level4ViewStates.delete(S.towers[0]);S.towers[0].angle=${angle};`);
   const early=paint(.84);
   for(let y=158;y<256;y++)for(let x=0;x<256;x++)assert.ok(early[(y*256+x)*4+3]<=16,`${e.key} heading ${h}: head appears on front panel before seating`);
   const ready=paint(1),almost=paint(.999999);let full=0,retained=0;
   for(let i=3;i<ready.length;i+=4)if(ready[i]>=64){full++;if(almost[i]>=64)retained++;}
   assert.ok(full>100,`${e.key}: complete visible head required`);
   assert.ok(retained/full>=.995,`${e.key} heading ${h}: near half pops in on final deployment frame (${retained}/${full})`);
   cases++;
  }
 }
 return cases;
}
(async()=>{
 const count=await check(),target='front=near+(20-near)*deploymentStep(open,.85,1)';
 const wide=html.replace(target,'front=20');
 // The narrow boundary was visibly bad for the former overhead art. Upright
 // authored art mostly ends above it; keep that historical negative on its
 // actual renderer instead of inventing a new failure or loosening the limit.
 const previous=execFileSync('git',['show','15ad9ed:prototype/index.html'],{cwd:ROOT,encoding:'utf8'}),narrow=previous.replace(target,'front=near');
 assert.notEqual(wide,html);assert.notEqual(narrow,previous);
 await assert.rejects(()=>check(wide),/front panel before seating/);
 await assert.rejects(()=>check(narrow),/near half pops in/);
 console.log('PASS seated deployment: '+count+' heading states, socket-only early emergence, continuous ready handoff; wide clip and historical flat-head narrow clip regressions rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
