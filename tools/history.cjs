'use strict';
// Reads a file as it was at an old revision: first from the pinned fixtures in tests/fixtures/history (survive shallow clones
// and rebase-and-merge), then from git history. A revision that is neither pinned nor reachable gets a clear error instead of
// a raw git failure. Pin a revision with: node tools/pin-history-fixture.cjs <rev> <file>
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),{execFileSync}=require('node:child_process');
const ROOT=path.join(__dirname,'..'),FIXTURES=path.join(ROOT,'tests','fixtures','history');
function pinnedPath(rev,file){
  const short=String(rev).slice(0,7),raw=path.join(FIXTURES,short,file),gz=raw+'.gz';
  return fs.existsSync(gz)?{file:gz,gz:true}:fs.existsSync(raw)?{file:raw,gz:false}:null;
}
function readRevision(rev,file,encoding='utf8'){
  const pinned=pinnedPath(rev,file);
  let data;
  if(pinned){data=fs.readFileSync(pinned.file);if(pinned.gz)data=zlib.gunzipSync(data);}
  else{
    try{data=execFileSync('git',['show',`${rev}:${file}`],{cwd:ROOT,maxBuffer:64*1024*1024,stdio:['ignore','pipe','ignore']});}
    catch(_){throw new Error(`Revision ${rev} (${file}) is neither pinned in tests/fixtures/history nor reachable in git. Pass an explicit baseline with --before <rev>, or pin it: node tools/pin-history-fixture.cjs <rev> ${file}`);}
  }
  return encoding?data.toString(encoding):data;
}
module.exports={readRevision,pinnedPath};
