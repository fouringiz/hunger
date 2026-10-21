// Re-stamp committed replays after a code change that alters the source fingerprint but is meant to leave campaign
// behaviour untouched. A replay is re-stamped only if, with the new fingerprint, the strict verifier reproduces every
// recorded wave checkpoint and the terminal state exactly: that is the proof of unchanged behaviour. The previous
// fingerprint is kept in sourceHistory for provenance. Nothing is written unless every replay verifies.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {verifyParty}=require('./replay-party.cjs');
const ROOT=path.join(__dirname,'..');
const DIRS=['reports/replays/human-v0.4','reports/replays/human-v0.4-parityA'].map(d=>path.join(ROOT,d));
function currentSource(){
  const src=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  const ctx=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
    location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(src,ctx); return vm.runInContext('replaySourceFingerprint()',ctx);
}
function main(){
  const source=currentSource(), plan=[];
  for(const dir of DIRS) for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort()){
    const file=path.join(dir,f), data=JSON.parse(fs.readFileSync(file,'utf8'));
    if(data.source===source){ console.log(`unchanged  ${path.relative(ROOT,file)}`); continue; }
    const next={...data,source,sourceHistory:[...(data.sourceHistory||[]),data.source]};
    const r=verifyParty(next);   // throws on any checkpoint or terminal mismatch
    plan.push({file,next}); console.log(`verified   ${path.relative(ROOT,file)}  ${data.source} -> ${source}  (${r.win?'W':'L'} gate ${r.gate}, ${r.ticks} ticks)`);
  }
  if(process.argv.includes('--write')){ for(const {file,next} of plan) fs.writeFileSync(file,JSON.stringify(next)); console.log(`re-stamped ${plan.length} replays`); }
  else console.log(`dry run: ${plan.length} replays would be re-stamped; pass --write to apply`);
}
if(require.main===module){ try{main();}catch(e){console.error('Re-stamp aborted, nothing written: '+e.message);process.exitCode=1;} }
