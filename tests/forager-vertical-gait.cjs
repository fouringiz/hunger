'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require(process.env.FORAGER_CANVAS_MODULE||'@napi-rs/canvas');
const root=path.join(__dirname,'..'),baseline=require('../reports/forager-vertical-gait/baseline.json');
function difference(row){
 let sum=0;const width=192*9;
 for(let f=1;f<9;f++)for(let y=0;y<192;y++)for(let x=0;x<192;x++){
  const a=(y*width+(f-1)*192+x)*4,b=a+192*4;
  // Visible RGB: transparent storage colors cannot inflate the movement score.
  for(let k=0;k<3;k++)sum+=Math.abs(row[a+k]*row[a+3]/255-row[b+k]*row[b+3]/255);
 }
 return sum/(8*192*192*3);
}
function supportSilhouette(row){
 const changed=[0,0],width=192*9;
 for(let y=60;y<184;y++)for(let x=0;x<192;x++)if(x<70||x>122){
  const a=(y*width+192+x)*4+3,b=(y*width+5*192+x)*4+3;
  if((row[a]>128)!==(row[b]>128))changed[x<70?0:1]++;
 }
 return changed;
}
async function inspect(file){
 const im=await loadImage(file),c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
 return Array.from({length:16},(_,d)=>{const rgba=g.getImageData(0,d*192,192*9,192).data;return {row:d,mad:difference(rgba),supportSilhouette:supportSilhouette(rgba),sha256:crypto.createHash('sha256').update(rgba).digest('hex')};});
}
async function main(){
 const rows=await inspect(path.join(root,'assets/hunger-forager-mire-v2.webp'));
 const horizontal=Math.max(rows[0].mad,rows[8].mad);
 for(const row of rows){
  if(baseline.rows.includes(row.row))assert.ok(row.mad>=horizontal,'row '+row.row+': visible RGB MAD '+row.mad.toFixed(3)+' must match side-row '+horizontal.toFixed(3));
  else assert.equal(row.sha256,baseline.decodedCanvasSHA256[row.row],'untouched row '+row.row+' must remain byte-identical');
  if([4,12].includes(row.row))assert.ok(row.supportSilhouette.every(n=>n>=256),'both outer leg silhouettes must change between opposing poses, not only their texture: row '+row.row);
 }
 console.log('PASS vertical gait: visible differences >= side rows; all other decoded rows byte-identical.');
 console.log(JSON.stringify(rows.map(r=>({row:r.row,mad:+r.mad.toFixed(3)}))));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={inspect,difference};
