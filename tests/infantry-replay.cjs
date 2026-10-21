// The infantry field trial is visible to replays: trial games are tagged, carry soldier state in their signatures,
// verify only under ?infantry=1, and the campaign fingerprint and signatures stay as they were without the trial.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {verifyParty}=require('../tools/replay-party.cjs');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search){ const ctx=vm.createContext({document:{getElementById:()=>({getContext:()=>({}),style:{},addEventListener(){}}),createElement:()=>({})},window:{devicePixelRatio:1},
  location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(src,ctx); return ctx; }
const g=(c,e)=>vm.runInContext(e,c);
const base=boot(''), trial=boot('?infantry=1'), legacy=boot('?balance=v04'), legacyTrial=boot('?balance=v04&infantry=1');
const reference=JSON.parse(fs.readFileSync(path.join(ROOT,'reports/replays/human-v0.4/cannon-only.json'),'utf8'));
assert.equal(g(legacy,'replayRulesFingerprint()'),reference.rules,'without the trial the rules fingerprint is the committed one for those rules');
assert.notEqual(g(legacyTrial,'replayRulesFingerprint()'),reference.rules,'the trial changes the rules fingerprint');
assert.notEqual(g(trial,'replayRulesFingerprint()'),g(base,'replayRulesFingerprint()'),'the trial changes the v0.5 rules fingerprint too');
assert.equal(g(base,"performPlayerAction({kind:'deploy'}), performPlayerAction({kind:'build',slot:2,type:'barracks'})"),false,'Barracks cannot be built outside the trial');
console.log('PASS the campaign is untouched without ?infantry=1');
const exported=JSON.parse(g(trial,`(() => {
  performPlayerAction({kind:'deploy'});
  if(!performPlayerAction({kind:'build',slot:2,type:'barracks'})) throw new Error('Barracks build failed in the trial');
  performPlayerAction({kind:'build',slot:3,type:'cannon'});
  performPlayerAction({kind:'wave'});
  let n=0; while(replay.mode==='recording' && n++<400000) update(SIM_STEP);
  return JSON.stringify(exportReplay());
})()`));
assert.equal(exported.infantryTrial,true,'a trial game is tagged');
assert.ok(exported.events.some(e=>e.kind==='build'&&e.type==='barracks'),'the Barracks build is recorded');
assert.ok(JSON.parse(exported.checkpoints[0].signature).towers.some(t=>t&&t.soldiers),'checkpoints carry soldier state');
assert.ok(verifyParty(exported).verified,'a trial replay verifies under the trial');
console.log('PASS a trial game records, tags and verifies with its soldiers');
base.replayInput=exported; assert.throws(()=>g(base,'loadReplay(replayInput)'),/infantry field trial/,'a trial replay refuses to load without the trial');
trial.replayInput=reference; assert.throws(()=>g(trial,'loadReplay(replayInput)'),/without the infantry field trial/,'a campaign replay refuses to load in the trial');
const tampered=JSON.parse(JSON.stringify(exported)); const sig=JSON.parse(tampered.checkpoints[0].signature);
const bar=sig.towers.find(t=>t&&t.soldiers); bar.soldiers[0].hp+=1; tampered.checkpoints[0].signature=JSON.stringify(sig);
assert.throws(()=>verifyParty(tampered),/did not match|checkpoint/i,'a changed soldier state fails verification');
console.log('PASS trial and campaign replays do not cross, and soldier state is verified');
console.log('3 infantry replay scenarios, 0 failures');
