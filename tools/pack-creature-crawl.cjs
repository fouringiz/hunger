'use strict';
// Normalize a complete generated four-direction/four-frame sheet with ONE scale.
// Creative frames come from imagegen; this only finds cell gutters, crops alpha and packs.
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=256,BASE=208;
async function pack(kind,input){
 if(!['carapacid','leech'].includes(kind)||!input)throw new Error('Usage: node tools/pack-creature-crawl.cjs carapacid|leech INPUT.png');
 const im=await loadImage(input),raw=createCanvas(im.width,im.height),g=raw.getContext('2d');g.drawImage(im,0,0);const pixels=g.getImageData(0,0,im.width,im.height).data;
 // Generated rows have generous gutters, but their heights need not be equal.
 const ys=(kind==='carapacid'?[0,305,620,878,1223]:[0,278,596,835,1254]).map(y=>Math.round(y*im.height/(kind==='carapacid'?1223:1254)));
 const rects=[];
 for(let row=0;row<4;row++){
  // Whole connected silhouettes avoid chopping a tail that crosses the nominal cell grid.
  const seen=new Uint8Array(im.width*im.height),components=[];
  for(let y=ys[row];y<ys[row+1];y++)for(let x=0;x<im.width;x++){
   const first=y*im.width+x;if(seen[first]||pixels[first*4+3]<=8)continue;
   const stack=[first],members=[];seen[first]=1;let x0=x,x1=x,y0=y,y1=y;
   while(stack.length){const i=stack.pop(),xx=i%im.width,yy=Math.floor(i/im.width);members.push(i);x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);
    for(const n of [i-1,i+1,i-im.width,i+im.width]){const nx=n%im.width,ny=Math.floor(n/im.width);if(ny<ys[row]||ny>=ys[row+1]||nx<0||Math.abs(nx-xx)>1||seen[n]||pixels[n*4+3]<=8)continue;seen[n]=1;stack.push(n);}
   }
   if(members.length>100)components.push({members,r:[x0,y0,x1-x0+1,y1-y0+1]});
  }
  const main=components.sort((a,b)=>b.members.length-a.members.length).slice(0,4).sort((a,b)=>a.r[0]-b.r[0]);
  if(main.length!==4)throw new Error('Expected four disconnected complete creatures in row '+row);
  for(const part of main){const r=part.r,tile=createCanvas(r[2],r[3]),t=tile.getContext('2d'),data=t.createImageData(r[2],r[3]);
   for(const i of part.members){const k=((Math.floor(i/im.width)-r[1])*r[2]+i%im.width-r[0])*4;for(let ch=0;ch<4;ch++)data.data[k+ch]=pixels[i*4+ch];}
   t.putImageData(data,0,0);rects.push({r,tile});
  }
 }
 const scale=Math.min(224/Math.max(...rects.map(o=>o.r[2])),200/Math.max(...rects.map(o=>o.r[3]))),out=createCanvas(CELL*4,CELL*4),c=out.getContext('2d');
 rects.forEach(({r,tile},i)=>c.drawImage(tile,i%4*CELL+(CELL-r[2]*scale)/2,Math.floor(i/4)*CELL+BASE-r[3]*scale,r[2]*scale,r[3]*scale));
 const filename=kind==='carapacid'?'hunger-carapacid-shelter-v1.webp':'hunger-leech-mire-v1.webp';
 fs.writeFileSync(path.join(ROOT,'assets',filename),out.encodeSync('webp',96));
 const dir=path.join(ROOT,'reports/generated/creature-cycles');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,kind+'-packing.json'),JSON.stringify({input,scale,rects:rects.map(o=>o.r)},null,2));
 for(let row=0;row<4;row++){const strip=createCanvas(1024,256);strip.getContext('2d').drawImage(out,0,row*256,1024,256,0,0,1024,256);fs.writeFileSync(path.join(dir,kind+'-'+row+'.png'),strip.toBuffer('image/png'));}
 console.log(filename+' packed: shared scale '+scale.toFixed(4));
}
pack(process.argv[2],process.argv[3]).catch(e=>{console.error(e);process.exitCode=1});
