'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const ROOT=path.join(__dirname,'..','fixtures','history');
// Old repository versions are pinned as committed fixtures, so tests survive shallow clones and rebase-and-merge.
function historical(rev,file){
  const p=path.join(ROOT,rev,file+'.gz');
  if(!fs.existsSync(p))throw new Error(`Missing history fixture ${rev}:${file}. Pin it with: node tools/pin-history-fixture.cjs ${rev} ${file}`);
  return zlib.gunzipSync(fs.readFileSync(p)).toString('utf8');
}
module.exports={historical};
