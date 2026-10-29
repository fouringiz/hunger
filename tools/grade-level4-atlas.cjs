'use strict';
// Colour-grades rows of the level-4 head atlas into the palette of the shared tower foundation.
// Hue and alpha are untouched: saturation is scaled, value goes through scale*v^gamma (gamma > 1 compresses highlights).
// Usage: node tools/grade-level4-atlas.cjs machine-gun [rifle ...]   (or: all = every row not graded yet)
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {paletteMetrics}=require('./palette-metrics.cjs');
const ROOT=path.join(__dirname,'..'),ATLAS=path.join(ROOT,'assets/hunger-level4-towers-v2.png');
const META=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'),'utf8'));
const RECORD=path.join(ROOT,'assets/art/level4-palette-grade.json');
const FOUNDATION_RECT=[59,137,429,321],HEAD_BRIGHT=.09,HEAD_BRIGHT_RANGE=[.05,.15];
function rgb2hsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;
  if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;if(h<0)h+=1;}
  return [h,mx?d/mx:0,mx/255];}
function hsv2rgb(h,s,v){const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
  const [r,g,b]=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][((i%6)+6)%6];return [r*255,g*255,b*255];}
function fit(data,width,rect,target){
  const px=[];const [x0,y0,w,h]=rect;
  for(let y=y0;y<y0+h;y+=2)for(let x=x0;x<x0+w;x+=2){const i=(y*width+x)*4;if(data[i+3]<200)continue;px.push(rgb2hsv(data[i],data[i+1],data[i+2]));}
  const meanS=px.reduce((a,p)=>a+p[1],0)/px.length,sat=Math.min(1,target.saturation/meanS);
  // Joint fit of mean value and bright share, evaluated with clipping so a scale above 1 cannot cheat.
  const vs=px.filter((_,k)=>k%2===0).map(p=>p[2]);let best=null;
  for(let gamma=.8;gamma<=2.6;gamma+=.02){
    const pw=vs.map(v=>Math.pow(v,gamma));
    for(let scale=.5;scale<=1.8;scale+=.01){
      let sum=0,bright=0;for(const x of pw){const v=Math.min(1,scale*x);sum+=v;if(v>.8)bright++;}
      // Mean value must match; the bright share must land inside HEAD_BRIGHT_RANGE, as close to HEAD_BRIGHT as the art allows
      // (flat ivory panels sit at full white, so some rows can only jump between a low and a high share).
      const share=bright/pw.length,outside=share<HEAD_BRIGHT_RANGE[0]?HEAD_BRIGHT_RANGE[0]-share:share>HEAD_BRIGHT_RANGE[1]?share-HEAD_BRIGHT_RANGE[1]:0;
      const err=Math.abs(sum/pw.length-target.value)/.03+outside*100+Math.abs(share-target.bright);
      if(!best||err<best.err)best={gamma:+gamma.toFixed(2),scale:+scale.toFixed(3),err};
    }
  }
  return {saturation:+sat.toFixed(4),gamma:best.gamma,scale:best.scale};
}
function apply(data,width,rect,p){const [x0,y0,w,h]=rect;
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=(y*width+x)*4;if(!data[i+3])continue;
    const [hh,s,v]=rgb2hsv(data[i],data[i+1],data[i+2]);const [r,g,b]=hsv2rgb(hh,Math.min(1,s*p.saturation),Math.min(1,p.scale*Math.pow(v,p.gamma)));
    data[i]=Math.round(r);data[i+1]=Math.round(g);data[i+2]=Math.round(b);}}
async function main(){
  const keys=process.argv.slice(2);if(!keys.length){console.error('usage: node tools/grade-level4-atlas.cjs <row-key ...|all>');process.exit(2);}
  const record=fs.existsSync(RECORD)?JSON.parse(fs.readFileSync(RECORD,'utf8')):{foundation:null,rows:{}};
  // 'all' grades every row that is not graded yet; naming an already graded row is an error.
  const rows=META.entries.filter(e=>keys.includes('all')?!record.rows[e.key]:keys.includes(e.key));
  if(!rows.length)throw new Error(keys.includes('all')?'every row is already graded':'no such rows: '+keys.join(','));
  const fimg=await loadImage(path.join(ROOT,'assets/hunger-low-buildings-v3.png')),fc=createCanvas(fimg.width,fimg.height),fg=fc.getContext('2d');fg.drawImage(fimg,0,0);
  const foundation=paletteMetrics(fg.getImageData(0,0,fc.width,fc.height).data,fc.width,FOUNDATION_RECT);record.foundation={rect:FOUNDATION_RECT,...foundation};
  // Heads match the foundation's saturation and mean value, but keep more highlights than the flat-lit foundation:
  // with only its ~5% bright pixels a head loses its volume (decided 2026-10-30).
  const target={...foundation,bright:HEAD_BRIGHT};record.target={saturation:target.saturation,value:target.value,bright:HEAD_BRIGHT,brightRange:HEAD_BRIGHT_RANGE};
  const img=await loadImage(ATLAS),c=createCanvas(img.width,img.height),g=c.getContext('2d');g.drawImage(img,0,0);
  const id=g.getImageData(0,0,c.width,c.height);
  for(const e of rows){
    if(record.rows[e.key])throw new Error(e.key+' is already graded; restore the atlas from git before grading it again');
    const rect=[0,e.row*256,4096,256],before=paletteMetrics(id.data,c.width,rect),p=fit(id.data,c.width,rect,target);
    // Rounding of dark pixels shifts the measured saturation; correct the factor on the real result (twice is enough).
    const original=id.data.slice(rect[1]*c.width*4,(rect[1]+rect[3])*c.width*4);
    for(let pass=0;pass<3;pass++){
      id.data.set(original,rect[1]*c.width*4);apply(id.data,c.width,rect,p);
      const m=paletteMetrics(id.data,c.width,rect);if(pass<2)p.saturation=+(p.saturation*target.saturation/m.saturation).toFixed(4);
    }
    const after=paletteMetrics(id.data,c.width,rect);
    record.rows[e.key]={row:e.row,params:p,before,after};
    console.log(e.key,'before',fmt(before),'after',fmt(after),'target',fmt(target),'params',JSON.stringify(p));
  }
  g.putImageData(id,0,0);fs.writeFileSync(ATLAS,c.toBuffer('image/png'));fs.writeFileSync(RECORD,JSON.stringify(record,null,2)+'\n');
}
const fmt=m=>`sat ${m.saturation.toFixed(3)} value ${m.value.toFixed(3)} bright ${(m.bright*100).toFixed(1)}%`;
main().catch(e=>{console.error(e);process.exitCode=1;});
