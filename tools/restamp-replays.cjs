// Re-stamp committed replays after a code change that alters their fingerprints but is meant to leave the game they
// recorded untouched. Each reference directory declares the balance preset its games are played under (the v0.4
// campaign games live under the legacy preset v04 once v0.5 changed the campaign numbers). A replay is re-stamped only
// if, with the new rules and source fingerprints and its directory's preset, the strict verifier reproduces every
// recorded wave checkpoint and the terminal state exactly: that is the proof that the recorded game is unchanged.
// Previous values are kept in rulesHistory / sourceHistory / presetHistory. Nothing is written unless every replay verifies.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {verifyParty}=require('./replay-party.cjs');
const ROOT=path.join(__dirname,'..');
const SETS=[{dir:'reports/replays/human-v0.4',preset:'v04'},{dir:'reports/replays/human-v0.4-parityA',preset:'parityA'}];
function fingerprints(data,preset){
  const src=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  const search='?'+[preset?'balance='+preset:'',data.infantryTrial?'infantry=1':''].filter(Boolean).join('&');
  const ctx=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
    location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(src,ctx); return {rules:vm.runInContext('replayRulesFingerprint()',ctx),source:vm.runInContext('replaySourceFingerprint()',ctx)};
}
function main(){
  const plan=[];
  for(const {dir,preset} of SETS) for(const f of fs.readdirSync(path.join(ROOT,dir)).filter(x=>x.endsWith('.json')).sort()){
    const file=path.join(ROOT,dir,f), data=JSON.parse(fs.readFileSync(file,'utf8'));
    const fp=fingerprints(data,preset), was=data.balancePreset??null;
    if(data.rules===fp.rules&&data.source===fp.source&&was===preset){ console.log(`unchanged  ${dir}/${f}`); continue; }
    const next={...data,balancePreset:preset,rules:fp.rules,source:fp.source};
    if(data.rules!==fp.rules) next.rulesHistory=[...(data.rulesHistory||[]),data.rules];
    if(data.source!==fp.source) next.sourceHistory=[...(data.sourceHistory||[]),data.source];
    if(was!==preset) next.presetHistory=[...(data.presetHistory||[]),was];
    const r=verifyParty(next);   // throws on any checkpoint or terminal mismatch
    plan.push({file,next}); console.log(`verified   ${dir}/${f}  preset ${was}->${preset} rules ${data.rules}->${fp.rules} source ${data.source}->${fp.source}  (${r.win?'W':'L'} gate ${r.gate}, ${r.ticks} ticks)`);
  }
  if(process.argv.includes('--write')){ for(const {file,next} of plan) fs.writeFileSync(file,JSON.stringify(next)); console.log(`re-stamped ${plan.length} replays`); }
  else console.log(`dry run: ${plan.length} replays would be re-stamped; pass --write to apply`);
}
if(require.main===module){ try{main();}catch(e){console.error('Re-stamp aborted, nothing written: '+e.message);process.exitCode=1;} }
