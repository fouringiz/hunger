'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {paletteMetrics}=require('../tools/palette-metrics.cjs');
const ROOT=path.join(__dirname,'..');
// Graded rows of the level-4 atlas must sit in the palette of the shared foundation; ungraded rows are reported, not failed.
(async()=>{
  const record=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/art/level4-palette-grade.json'),'utf8'));
  const meta=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'),'utf8'));
  const load=async f=>{const i=await loadImage(path.join(ROOT,'assets',f)),c=createCanvas(i.width,i.height),g=c.getContext('2d');g.drawImage(i,0,0);return {data:g.getImageData(0,0,c.width,c.height).data,width:c.width};};
  const f=await load('hunger-low-buildings-v3.png'),target=paletteMetrics(f.data,f.width,record.foundation.rect);
  const a=await load('hunger-level4-towers-v2.png'),pending=[];
  for(const e of meta.entries){
    const m=paletteMetrics(a.data,a.width,[0,e.row*256,4096,256]);
    if(!record.rows[e.key]){pending.push(e.key);continue;}
    assert.ok(Math.abs(m.saturation-target.saturation)<=.03,`${e.key} saturation ${m.saturation.toFixed(3)} vs foundation ${target.saturation.toFixed(3)}`);
    assert.ok(Math.abs(m.value-target.value)<=.03,`${e.key} value ${m.value.toFixed(3)} vs foundation ${target.value.toFixed(3)}`);
    assert.ok(Math.abs(m.bright-target.bright)<=.02,`${e.key} bright share ${(m.bright*100).toFixed(1)}% vs foundation ${(target.bright*100).toFixed(1)}%`);
  }
  assert.ok(Object.keys(record.rows).length>0,'at least one graded row');
  console.log(`PASS level-4 palette: ${Object.keys(record.rows).join(', ')} within foundation palette`+(pending.length?`; not graded yet: ${pending.join(', ')}`:''));
})().catch(e=>{console.error(e);process.exitCode=1;});
