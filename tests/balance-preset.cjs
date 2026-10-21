// A balance preset is selected only by URL, changes only the declared values, is written into exported replays and
// into the rules fingerprint through those values; without it the game and the baseline replays are untouched.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(search){ const canvas={getContext:()=>({}),style:{},addEventListener(){}};
  const ctx=vm.createContext({document:{getElementById:()=>canvas,createElement:()=>({})},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search},URLSearchParams,structuredClone,
    innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(src,ctx); return ctx; }
const base=boot(''), preset=boot('?balance=parityA'), unknown=boot('?balance=nonsense');
const g=(c,e)=>vm.runInContext(e,c);
assert.equal(g(base,'BALANCE_PRESET_NAME'),null); assert.equal(g(unknown,'BALANCE_PRESET_NAME'),null,'an unknown preset name is ignored');
assert.equal(g(base,'replayRulesFingerprint()'),g(unknown,'replayRulesFingerprint()'),'unknown preset leaves the rules fingerprint as baseline');
assert.equal(g(base,'JSON.stringify([TOWER.turret.dmg,TOWER.voltaic.dmg,TOWER.cannon.dmg,ENEMY.forager.hp])'),'[7,14,45,30]','baseline values are the campaign rules');
console.log('PASS without ?balance the rules are the campaign rules');
assert.equal(g(preset,'BALANCE_PRESET_NAME'),'parityA');
assert.equal(g(preset,'JSON.stringify([TOWER.turret.dmg,TOWER.voltaic.dmg,TOWER.cannon.dmg,ENEMY.forager.hp,ENEMY.carapacid.hp])'),'[8.5,17,40,37.5,425]','parity A applies its four declared numbers');
assert.notEqual(g(preset,'replayRulesFingerprint()'),g(base,'replayRulesFingerprint()'),'the preset changes the rules fingerprint through the values');
assert.equal(g(preset,'replaySourceFingerprint()'),g(base,'replaySourceFingerprint()'),'the preset does not touch simulation function sources');
console.log('PASS ?balance=parityA applies the candidate and is visible in the fingerprint');
const fixture=JSON.parse(fs.readFileSync(path.join(ROOT,'reports/replays/human-v0.4/cannon-only.json'),'utf8'));
base.replayInput=fixture; assert.equal(g(base,'loadReplay(replayInput).mode'),'playing','baseline replays still load without a preset');
preset.replayInput=fixture; assert.throws(()=>g(preset,'loadReplay(replayInput)'),/recorded without a balance preset/,'a baseline replay refuses to load under a preset, naming the reason');
const tagged={...fixture,balancePreset:'parityA'}; base.replayInput=tagged;
assert.throws(()=>g(base,'loadReplay(replayInput)'),/recorded under balance preset parityA/,'a preset replay refuses to load without the preset, naming it');
console.log('PASS replays carry their preset and refuse to cross over');
assert.equal(g(preset,'reset(), beginReplayRecording(), performPlayerAction({kind:"wave"}), (()=>{while(S.phase!=="over"&&replay.tick<60000)update(SIM_STEP);return exportReplay().balancePreset})()'),'parityA','an exported replay records the preset it was played under');
console.log('PASS exported replays are tagged with the preset');
console.log('4 preset scenarios, 0 failures');
