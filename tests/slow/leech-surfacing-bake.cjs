'use strict';
// Slow (npm run test:slow): the Leech surfacing atlas is rebuilt by one command from the two study sheets, byte for byte,
// and a missing sheet leaves nothing behind.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {bake,config}=require('../../tools/bake-leech-surfacing.cjs');
const ROOT=path.join(__dirname,'../..'),atlas=path.join(ROOT,'assets/hunger-leech-surfacing-v1.webp');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'leech-surfacing-bake-'));
 try{
  const result=await bake({outDir:temp});
  assert.deepEqual(fs.readFileSync(result.output),fs.readFileSync(atlas),'single-command bake is reproducible');
  assert.deepEqual(fs.readFileSync(result.output.replace('.webp','.frames.json')),fs.readFileSync(atlas.replace('.webp','.frames.json')),'frame table rebuilt identically');
  for(const sheet of Object.values(config()))assert.ok(fs.existsSync(path.join(ROOT,sheet.file)),'source sheet kept: '+sheet.file);
  fs.rmSync(temp,{recursive:true,force:true});fs.mkdirSync(temp);
  const missing=config();missing.wound.file='assets/art/studies/missing-wound-sheet.png';
  await assert.rejects(()=>bake({outDir:temp,cfg:missing}),/Missing source/);
  assert.deepEqual(fs.readdirSync(temp),[],'a missing sheet cannot leave a partial atlas');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 console.log('PASS Leech surfacing bake: reproducible atlas and frame table, sources kept, no partial output');
})().catch(e=>{console.error(e);process.exitCode=1;});
