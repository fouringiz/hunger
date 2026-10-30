'use strict';
// Puts a standalone head sprite (outside the level-4 atlas) through the same pipeline as the atlas rows:
// shadow-only local contrast, then the palette grade against the shared foundation with the head highlight range.
// Run once on the freshly baked sprite. Usage: node tools/grade-head-sprite.cjs <key> <assets/...png>
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {paletteMetrics}=require('./palette-metrics.cjs');
const {localContrast}=require('./level4-local-contrast.cjs');
const {fit,apply,FOUNDATION_RECT,HEAD_BRIGHT,HEAD_BRIGHT_RANGE}=require('./grade-level4-atlas.cjs');
const ROOT=path.join(__dirname,'..'),RECORD=path.join(ROOT,'assets/art/work/towers/level4-palette-grade.json');
(async()=>{
  const [key,file]=process.argv.slice(2);if(!key||!file){console.error('usage: node tools/grade-head-sprite.cjs <key> <assets/...png>');process.exit(2);}
  const record=JSON.parse(fs.readFileSync(RECORD,'utf8'));record.sprites=record.sprites||{};
  if(record.sprites[key])throw new Error(key+' is already graded; re-bake the sprite and remove its record entry first');
  const fimg=await loadImage(path.join(ROOT,'assets/runtime/low-buildings-v3.png')),fc=createCanvas(fimg.width,fimg.height),fg=fc.getContext('2d');fg.drawImage(fimg,0,0);
  const foundation=paletteMetrics(fg.getImageData(0,0,fc.width,fc.height).data,fc.width,FOUNDATION_RECT),target={...foundation,bright:HEAD_BRIGHT};
  const img=await loadImage(path.join(ROOT,file)),c=createCanvas(img.width,img.height),g=c.getContext('2d');g.drawImage(img,0,0);
  const id=g.getImageData(0,0,c.width,c.height),rect=[0,0,c.width,c.height],before=paletteMetrics(id.data,c.width,rect);
  const amount=record.localContrast?record.localContrast.amount:.8,radius=record.localContrast?record.localContrast.radius:8;
  localContrast(id.data,c.width,c.height,amount,radius);
  const original=id.data.slice(),p=fit(id.data,c.width,rect,target);
  for(let pass=0;pass<3;pass++){id.data.set(original);apply(id.data,c.width,rect,p);const m=paletteMetrics(id.data,c.width,rect);if(pass<2)p.saturation=+(p.saturation*target.saturation/m.saturation).toFixed(4);}
  const after=paletteMetrics(id.data,c.width,rect);
  g.putImageData(id,0,0);fs.writeFileSync(path.join(ROOT,file),c.toBuffer('image/png'));
  record.sprites[key]={file,localContrast:{amount,radius},params:p,before,after};fs.writeFileSync(RECORD,JSON.stringify(record,null,2)+'\n');
  const f=m=>`sat ${m.saturation.toFixed(3)} value ${m.value.toFixed(3)} bright ${(m.bright*100).toFixed(1)}%`;
  console.log(key,'before',f(before),'after',f(after),'range',HEAD_BRIGHT_RANGE.map(v=>v*100).join('-')+'%');
})().catch(e=>{console.error(e);process.exitCode=1;});
