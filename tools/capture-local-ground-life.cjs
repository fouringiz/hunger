'use strict';
// Fixed simulation, actual renderer: only presentation time advances between captures.
const fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const out=path.join(__dirname,'../reports/local-ground-life');
(async()=>{
 const before=process.argv.includes('--before'),label=before?'before':'after';
 const {canvas,run}=await loadWorld();fs.mkdirSync(out,{recursive:true});
 run("reset();S.phase='build';S.credits=10000;S.buildTimer=999;build(SLOTS[0],'turret');build(SLOTS[5],'cannon');build(SLOTS[15],'generator');observeConstruction();presentationTime=2;observeConstruction();S.selected=null;");
 const baseline=JSON.parse(run('JSON.stringify({rules:replayRulesFingerprint(),source:replaySourceFingerprint(),path:PATH,gateD:GATE_D,slots:SLOTS.map(s=>[s.x,s.y]),platformHeight:PLATFORM_HEIGHT})'));
 if(before)fs.writeFileSync(path.join(out,'baseline.json'),JSON.stringify(baseline,null,2)+'\n');
 const close=createCanvas(900,650),c=close.getContext('2d');
 for(let i=0;i<3;i++){
  run('presentationTime='+(2+i)+';draw();');
  fs.writeFileSync(path.join(out,label+'-'+i+'s.webp'),canvas.encodeSync('webp',94));
  // Empty pad at (250,160), plus neighbouring mud: same crop and camera for all stages.
  c.clearRect(0,0,900,650);c.drawImage(canvas,175*2,110*2,180*2,130*2,0,0,900,650);
  fs.writeFileSync(path.join(out,label+'-pad-'+i+'s.webp'),close.encodeSync('webp',94));
 }
 if(!before)fs.writeFileSync(path.join(out,'hotspots.json'),run('JSON.stringify(groundLifeSites(),null,2)')+'\n');
 if(process.argv.includes('--cycle')){
  const frames=path.join(__dirname,'../reports/generated/local-ground-life/cycle');fs.mkdirSync(frames,{recursive:true});
  for(let i=0;i<90;i++){
   run('presentationTime='+(2+i/10)+';draw();');
   c.clearRect(0,0,900,650);c.drawImage(canvas,175*2,110*2,180*2,130*2,0,0,900,650);
   fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),close.toBuffer('image/png'));
  }
 }
 if(!before){
  const gray=createCanvas(canvas.width,canvas.height),g=gray.getContext('2d');g.drawImage(canvas,0,0);
  const data=g.getImageData(0,0,gray.width,gray.height);
  for(let i=0;i<data.data.length;i+=4){const v=Math.round(.2126*data.data[i]+.7152*data.data[i+1]+.0722*data.data[i+2]);data.data[i]=data.data[i+1]=data.data[i+2]=v;}
  g.putImageData(data,0,0);fs.writeFileSync(path.join(out,'after-gray.webp'),gray.encodeSync('webp',92));
 }
 console.log('Saved '+label+' game frames at 2, 3 and 4 seconds in '+out);
})().catch(e=>{console.error(e);process.exitCode=1;});
