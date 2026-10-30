'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {loadImage,createCanvas}=require('@napi-rs/canvas'),{bake,defaultConfig}=require('../tools/bake-creature-crawl.cjs'),{loadWorld}=require('../tools/capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),atlas=path.join(ROOT,'assets/runtime/enemies/leech-mire-v1.webp');
function checkCell(p){
 let area=0,fringe=0,edge=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const k=(y*256+x)*4,a=p[k+3];if(a<=8)continue;
  assert.ok(x>2&&x<253&&y>2&&y<208,'no clipped body or rectangular border');
  if(a>=128)area++;
  if(a<240){edge++;const rgb=[p[k],p[k+1],p[k+2]],hi=Math.max(...rgb),lo=Math.min(...rgb);
   if(hi<30||(lo>225&&hi-lo<10))fringe++;
  }
 }
 assert.ok(area>5000,'filled body');assert.ok(fringe/Math.max(1,edge)<.03,'no broad black/white matte fringe');
}
(async()=>{
 const im=await loadImage(atlas);assert.equal(im.width,1024);assert.equal(im.height,4096);
 const c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
 const contacts=JSON.parse(fs.readFileSync(atlas.replace('.webp','.contacts.json'),'utf8'));
 assert.equal(contacts.directions,16);assert.equal(contacts.frames,4);assert.equal(contacts.rows.length,16);
 const rowHashes=new Set();
 for(let row=0;row<16;row++){
  rowHashes.add(crypto.createHash('sha256').update(g.getImageData(0,row*256,1024,256).data).digest('hex'));
  assert.equal(contacts.rows[row].length,4);
  for(let f=0;f<4;f++){
   const p=g.getImageData(f*256,row*256,256,256).data;checkCell(p);
   const line=contacts.rows[row][f].belly;assert.ok(line.length>=5);
   for(const [x,y]of line){assert.ok(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<256&&y>=0&&y<208);assert.ok(p[(y*256+x)*4+3]>=128,'contact meets opaque body');}
  }
 }
 assert.equal(rowHashes.size,16,'all headings have distinct authored or transformed views');
 const bad=g.getImageData(0,0,256,256).data;for(let x=0;x<256;x++){bad[x*4]=bad[x*4+1]=bad[x*4+2]=bad[x*4+3]=255;}
 assert.throws(()=>checkCell(bad),/border/,'known bad white frame must fail');
 const {run}=await loadWorld();run("reset();const leech=makeEnemy('leech',1),shell=makeEnemy('carapacid',1);");
 for(let row=0;row<16;row++)assert.equal(run(`creatureCrawlPose(leech,${row*Math.PI/8}).row`),row);
 for(let row=0;row<4;row++)assert.equal(run(`creatureCrawlPose(shell,${row*Math.PI/2}).row`),row);
 assert.equal(run('creatureCrawlPose(leech,-Math.PI/8).row'),15,'negative heading wraps');
 const sig=run('replaySignature()');for(let i=0;i<64;i++)run(`creatureCrawlPose(leech,${i});`);assert.equal(run('replaySignature()'),sig,'presentation is read-only');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'leech-bake-'));
 try{
  const invalid=defaultConfig('leech');invalid.sources[1].file='missing-diagonal-master.png';
  await assert.rejects(()=>bake(invalid,{outDir:temp}),/Missing source/);assert.deepEqual(fs.readdirSync(temp),[],'missing masters cannot leave a partial atlas');
  const result=await bake(defaultConfig('leech'),{outDir:temp});
  assert.deepEqual(fs.readFileSync(result.output),fs.readFileSync(atlas),'single-command bake is reproducible');
  assert.deepEqual(result.contacts,contacts,'contacts rebuilt from the same transforms');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 console.log('PASS Leech 16x4: filled distinct rows, clean margins/matte, belly contacts, row selection, reproducible bake');
})().catch(e=>{console.error(e);process.exitCode=1;});
