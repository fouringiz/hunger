// Verify a player-exported replay using the same inline controller as the browser.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const MAX_FILE_BYTES=5*1024*1024;

function verifyParty(data) {
  const html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
  const match=html.match(/<script>([\s\S]*?)<\/script>/);
  if(!match)throw new Error('Prototype inline script is missing.');
  const canvas={getContext:()=>({}),style:{},addEventListener(){}};
  const context=vm.createContext({document:{getElementById:()=>canvas},window:{devicePixelRatio:1},
    location:{pathname:'/prototype/index.html',search:''},URLSearchParams,
    innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(match[1],context,{timeout:10000});
  context.replayInput=data;
  const summary=vm.runInContext(`(() => {
    loadReplay(replayInput);
    let steps=0;
    while(replayStatus().mode==='playing'){
      if(++steps>1000000)throw new Error('Replay exceeded the verifier tick budget.');
      advanceReplayTick();
    }
    const status=replayStatus();
    if(status.mode!=='verified')throw new Error(status.error||'Replay did not finish with a verified result.');
    return {verified:true,ticks:status.tick,steps,win:S.win,wave:S.wave,gate:S.gate,
      credits:S.credits,kills:S.kills,mutations:[...S.mutations],damageLedger:{...S.dmg}};
  })()`,context,{timeout:60000});
  return JSON.parse(JSON.stringify(summary));
}

function main() {
  const args=process.argv.slice(2),json=args.includes('--json');
  const files=args.filter(a=>a!=='--json');
  if(files.length!==1){console.error('Usage: node tools/replay-party.cjs <replay.json> [--json]');process.exitCode=2;return;}
  const file=path.resolve(files[0]);
  if(fs.statSync(file).size>MAX_FILE_BYTES)throw new Error('Replay file is larger than 5 MB.');
  const result=verifyParty(JSON.parse(fs.readFileSync(file,'utf8')));
  console.log(json?JSON.stringify(result,null,2):`VERIFIED: ${result.win?'victory':'defeat'}, wave ${result.wave}, Gate ${result.gate}, credits ${result.credits}, ${result.ticks} ticks.`);
}
if(require.main===module){try{main();}catch(error){console.error(`Replay verification failed: ${error.message}`);process.exitCode=1;}}
module.exports={verifyParty};
