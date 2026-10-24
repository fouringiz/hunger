'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const out=path.join(__dirname,'../reports/gate-integration');
(async()=>{
 const zone=process.argv.includes('--ember')?'ember':'mire',before=process.argv.includes('--before'),stage=before?'before':'after';
 const {canvas,run}=await loadWorld({zone});fs.mkdirSync(out,{recursive:true});
 run("reset();S.phase='build';S.credits=10000;S.buildTimer=999;build(SLOTS[15],'generator');observeConstruction();presentationTime=2;observeConstruction();S.selected=null;S.phase='wave';S.wave=1;S.spawnQueue=[];S.enemies=[140,95,60,28].map((gap,i)=>{const e=makeEnemy(i===1?'carapacid':'forager',1);e.seq=i+1;e.d=GATE_D-gap;Object.assign(e,posAt(e.d));return e;});draw();");
 fs.writeFileSync(path.join(out,zone+'-'+stage+'.webp'),canvas.encodeSync('webp',94));
 const crop=createCanvas(1020,780),g=crop.getContext('2d');g.drawImage(canvas,620*2,240*2,340*2,260*2,0,0,1020,780);
 fs.writeFileSync(path.join(out,zone+'-'+stage+'-close.webp'),crop.encodeSync('webp',95));
 if(before&&zone==='mire')fs.writeFileSync(path.join(out,'baseline.json'),run('JSON.stringify({rules:replayRulesFingerprint(),source:replaySourceFingerprint(),path:PATH,gateD:GATE_D,slots:SLOTS.map(s=>[s.x,s.y]),box:GATE_DETAIL_BOX,floor:GATE_FLOOR},null,2)')+'\n');
 if(!before){
  const pixels=g.getImageData(0,0,crop.width,crop.height);
  for(let i=0;i<pixels.data.length;i+=4){const v=Math.round(.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2]);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;}
  g.putImageData(pixels,0,0);fs.writeFileSync(path.join(out,zone+'-gray.webp'),crop.encodeSync('webp',92));
 }
 console.log(zone+' '+stage+' captures saved to '+out);
})().catch(e=>{console.error(e);process.exitCode=1;});
