'use strict';
// User-run actual game capture, using the committed pinned pre-change renderer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {historical}=require('../tests/lib/history.cjs');
const {capture,crop,setup,shot}=require('./capture-level4-towers.cjs');
const {loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..');
async function main(){
 const out=path.join(ROOT,'reports/generated/tesla-toroid');fs.mkdirSync(out,{recursive:true});
 const spec={key:'tesla',type:'voltaic',branch:'A'},before=historical('1499ae5','prototype/index.html'),results={};
 for(const zone of ['mire','ember']){
  const a=await capture(spec,zone,'before',before,out),b=await capture(spec,zone,'after',null,out);
  assert.deepEqual(a.fingerprint,b.fingerprint,'rules/source unchanged');assert.deepEqual(a.signatures,b.signatures,'identical live combat ticks');results[zone]=b.fingerprint;
 }
 const w=await loadWorld();setup(w,spec);shot(w);
 const ref=await loadImage(path.join(ROOT,'assets/art/references/towers/tesla-level4-approved-v2.png'));
 const m=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/runtime/towers/tesla-toroid-v1.frames.json'))),[x,y,sw,sh]=m.sourceBox;
 // Reference and in-game head use the same native source-pixel scale, displayed at 2x.
 const scale=224/Math.max(sw,sh)*m.size*1.15/256*2;
 const c=createCanvas(448,224),g=c.getContext('2d');g.fillStyle='#27312b';g.fillRect(0,0,448,224);
 g.drawImage(ref,x,y,sw,sh,112-sw*scale/2,120-sh*scale/2,sw*scale,sh*scale);g.drawImage(crop(w),224,0);
 fs.writeFileSync(path.join(out,'approved-and-game.png'),c.toBuffer('image/png'));
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({baseline:'1499ae5',results,limits:'Native renderer only; browser console and artistic acceptance remain user checks.'},null,2)+'\n');
 console.log('Wrote '+out+' — before/after Mire/Ember whole, gray, turn, upgrade, attack, sale, 151-frame firing cycles and approved-and-game.png');
}
module.exports={main};
