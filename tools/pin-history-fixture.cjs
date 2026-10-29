'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),{execFileSync}=require('node:child_process');
const [rev,file]=process.argv.slice(2);
if(!rev||!file){console.error('usage: node tools/pin-history-fixture.cjs <rev> <repo-relative-file>');process.exit(2);}
const ROOT=path.join(__dirname,'..'),short=execFileSync('git',['rev-parse','--short=7',rev],{cwd:ROOT,encoding:'utf8'}).trim();
const out=path.join(ROOT,'tests','fixtures','history',short,file+'.gz');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,zlib.gzipSync(execFileSync('git',['show',`${short}:${file}`],{cwd:ROOT,maxBuffer:64*1024*1024}),{level:9}));
console.log('pinned',path.relative(ROOT,out),'— use historical(\''+short+'\',\''+file+'\') in tests');
