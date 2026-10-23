'use strict';
// Offline reference of the actual scheduled cue. Browser hardware output is not recorded here.
const fs=require('node:fs'),path=require('node:path');
const {loadWorld}=require('./capture-organic-world.cjs');
(async()=>{
 const {run}=await loadWorld();
 run(`const cueRecipe={gains:[]};audioContext={state:'running',currentTime:0,destination:{},
  createOscillator(){return {frequency:{setValueAtTime(v,t){cueRecipe.startHz=v;},exponentialRampToValueAtTime(v,t){cueRecipe.endHz=v;cueRecipe.ramp=t;}},connect(){},disconnect(){},start(){cueRecipe.wave=this.type;},stop(t){cueRecipe.end=t;}};},
  createGain(){return {gain:{setValueAtTime(v,t){cueRecipe.gains.push([t,v]);},exponentialRampToValueAtTime(v,t){cueRecipe.gains.push([t,v]);}},connect(){},disconnect(){}};}};
  reset();const body=makeEnemy('forager',1);body.d=PORTAL_ENTRY_D;S.enemies=[body];observePortalEntries();`);
 const recipe=JSON.parse(run('JSON.stringify(cueRecipe)')),rate=48000,count=Math.ceil(recipe.end*rate),pcm=Buffer.alloc(count*2);
 const k=Math.log(recipe.endHz/recipe.startHz)/recipe.ramp;
 for(let i=0;i<count;i++){
  const t=i/rate,r=Math.min(t,recipe.ramp),phase=2*Math.PI*(recipe.startHz*Math.expm1(k*r)/k+Math.max(0,t-recipe.ramp)*recipe.endHz);
  let gain=0;
  for(let j=1;j<recipe.gains.length;j++){
   const [a,g0]=recipe.gains[j-1],[b,g1]=recipe.gains[j];if(t>=a&&t<=b)gain=g0*Math.pow(g1/g0,(t-a)/(b-a));
  }
  const wave=recipe.wave==='triangle'?2/Math.PI*Math.asin(Math.sin(phase)):Math.sin(phase);
  pcm.writeInt16LE(Math.round(wave*gain*32767),i*2);
 }
 const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
 const out=path.join(__dirname,'../reports/portal-teleport');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'portal-cue.wav'),Buffer.concat([header,pcm]));fs.writeFileSync(path.join(out,'cue-recipe.json'),JSON.stringify(recipe,null,2)+'\n');
 console.log('Rendered reference cue from actual WebAudio schedules: '+recipe.startHz+'→'+recipe.endHz+'Hz.');
})().catch(e=>{console.error(e);process.exitCode=1;});
