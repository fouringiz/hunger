const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../prototype/index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function runtime(withAudio = false) {
  const made = {voices: [], contexts: [], failStart: false, targets: [], frequencies: [], audioOps: [], pointerHandler: null, visibilityHandler: null, resumes: 0, suspends: 0, stops: 0};
  class AudioContextMock {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; made.contexts.push(this); }
    createOscillator() {
      const osc = {frequency: {setValueAtTime(value) { made.frequencies.push(value); }}, connect() {}, disconnect() {}, start() { made.audioOps.push('start'); if (made.failStart) throw new Error('mock output failure'); }, stop() { made.stops++; }};
      made.voices.push(osc); return osc;
    }
    createGain() { return {gain: {setValueAtTime(value) { made.audioOps.push(['gain-set',value]); }, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(value) { made.targets.push(value); }}, connect() {}, disconnect() {}}; }
    resume() { made.resumes++; this.state = 'running'; return Promise.resolve(); }
    suspend() { made.suspends++; this.state = 'suspended'; return Promise.resolve(); }
  }
  const canvas = {getContext: () => ({}), style: {}, addEventListener(type, handler) { if (type === 'pointerdown') made.pointerHandler = handler; }, getBoundingClientRect: () => ({left:0,top:0})};
  const document = {hidden: false, getElementById: () => canvas, addEventListener(type, handler) { if (type === 'visibilitychange') made.visibilityHandler = handler; }};
  const window = {devicePixelRatio: 1};
  if (withAudio) window.AudioContext = AudioContextMock;
  const context = vm.createContext({document, window, innerWidth: 960, innerHeight: 540,
    addEventListener() {}, requestAnimationFrame() {}, performance: {now: () => 0}, assert});
  vm.runInContext(source, context);
  return {context, made, run: code => vm.runInContext(code, context)};
}
function combatSnapshot(enabled) {
  const {run} = runtime(true);
  return JSON.parse(run(`soundEnabled=${enabled}; audioGesture(); reset(); S.credits=1000; build(SLOTS[0],'turret'); build(SLOTS[1],'cannon'); build(SLOTS[2],'voltaic');
    S.phase='wave'; S.wave=2; const e=makeEnemy('carapacid',2); e.d=250; Object.assign(e,posAt(e.d)); S.enemies=[e]; update(4.5);
    JSON.stringify({gate:S.gate,credits:S.credits,kills:S.kills,wave:S.wave,damage:S.dmg,
    towers:S.towers.map(t=>[t.type,t.cd,t.kills]),enemies:S.enemies.map(x=>[x.type,x.hp,x.d]),shells:S.shells.length})`));
}
assert.deepEqual(combatSnapshot(false), combatSnapshot(true), 'muting presentation does not change combat outcomes');
const {run, made} = runtime(true);
run(`audioGesture(); for(let i=0;i<10;i++) playCue('test-'+i,180+i,0.1)`);
assert.equal(made.contexts.length, 1, 'audio context is created only when requested by a gesture');
assert.equal(made.voices.length, 6, 'simultaneous synthesized voices stay capped');
run(`soundEnabled=false; playCue('muted',200,0.1)`);
assert.equal(made.voices.length, 6, 'muting prevents new voices');
const unsupported = runtime(false);
assert.doesNotThrow(() => unsupported.run(`audioGesture(); playWeaponCue('cannon'); playCue('unsupported',100,0.1)`), 'missing WebAudio stays silent');
const hum = runtime(true);
hum.run(`reset(); build(SLOTS[0],'generator'); audioGesture(); syncGeneratorHum(); const firstHum=generatorHum;
  S.towers[0].leeched={dead:false,state:'attached'}; syncGeneratorHum(); const drainedLevel=humMode;
  S.towers[0].leeched=null; syncGeneratorHum(); const restoredLevel=humMode;
  S.towers.length=0; syncGeneratorHum()`);
assert.equal(hum.made.voices.length, 1, 'generator uses one shared hum oscillator');
assert.deepEqual(hum.made.audioOps.slice(0,2), [['gain-set',0.0001], 'start'], 'generator hum begins at near-silence before its oscillator starts');
assert.deepEqual(hum.made.targets, [0.007, 0.0001, 0.007], 'Leech attachment interrupts and release restores the shared hum');
const muteHum = runtime(true);
muteHum.run(`build(SLOTS[0],'generator'); audioGesture(); syncGeneratorHum(); soundEnabled=false;
  generatorHum.stop(); generatorHum.disconnect(); generatorHumGain.disconnect(); generatorHum=generatorHumGain=null; humMode='';
  soundEnabled=true; audioGesture(); syncGeneratorHum()`);
assert.equal(muteHum.made.voices.length, 2, 'generator hum restarts after unmuting');
const seekingDeath = runtime(true);
seekingDeath.run(`audioGesture(); reset(); build(SLOTS[0],'generator'); const seeker=makeEnemy('leech',1); seeker.gen=S.towers[0]; seeker.state='seek'; S.towers[0].leeched=seeker; damage(seeker,10000,null)`);
assert.equal(seekingDeath.made.frequencies.filter(f => f === 430).length, 0, 'killing a seeking Leech does not play a false recovery cue');
const attachedDeath = runtime(true);
attachedDeath.run(`audioGesture(); reset(); build(SLOTS[0],'generator'); const feeder=makeEnemy('leech',1); feeder.gen=S.towers[0]; feeder.state='attached'; S.towers[0].leeched=feeder; damage(feeder,10000,null)`);
assert.equal(attachedDeath.made.frequencies.filter(f => f === 430).length, 1, 'killing an attached Leech plays one recovery cue');
const satedRelease = runtime(true);
satedRelease.run(`audioGesture(); reset(); build(SLOTS[0],'generator'); S.phase='wave'; S.wave=1;
  const feeder=makeEnemy('leech',1); feeder.gen=S.towers[0]; feeder.state='attached'; feeder.fedTotal=9.99; S.towers[0].leeched=feeder; S.enemies=[feeder];
  update(SIM_STEP); update(SIM_STEP)`);
assert.equal(satedRelease.made.frequencies.filter(f => f === 430).length, 1, 'sated detachment plays one recovery cue');
const ui = runtime(true);
ui.run(`audioGesture()`);
ui.made.documentHidden = ui.run('document');
ui.made.documentHidden.hidden = true; ui.made.visibilityHandler();
assert.equal(ui.made.suspends, 1, 'hidden tab suspends audio');
ui.made.documentHidden.hidden = false; ui.made.visibilityHandler();
assert.equal(ui.made.resumes, 0, 'visibility alone does not resume audio outside a user gesture');
ui.run(`S.phase='build'; buttons=[{x:850,y:7,w:54,h:26,enabled:true,fn:toggleSound}];`);
ui.made.pointerHandler({clientX:100,clientY:100});
assert.equal(ui.made.resumes, 1, 'an actual canvas pointer gesture resumes suspended audio');
ui.made.pointerHandler({clientX:860,clientY:15});
assert.equal(ui.run('soundEnabled'), false);
assert.equal(ui.made.resumes, 1, 'muting does not resume audio from the pointer handler');
assert.equal(ui.made.suspends, 2, 'muting suspends audio');
ui.made.pointerHandler({clientX:860,clientY:15});
assert.equal(ui.run('soundEnabled'), true);
assert.equal(ui.made.resumes, 2, 'unmuting resumes audio inside its user gesture');
const failed = runtime(true);
failed.made.failStart = true;
failed.run(`audioGesture(); playCue('failure',200,0.1)`);
assert.equal(failed.run('activeVoices'), 0, 'failed audio start releases its voice slot');
const failedHum = runtime(true);
failedHum.made.failStart = true;
failedHum.run(`build(SLOTS[0],'generator'); audioGesture()`);
assert.equal(failedHum.run('generatorHum'), null, 'failed generator hum startup clears the partial oscillator');
assert.equal(failedHum.made.stops, 1, 'failed generator hum startup stops its partial oscillator');
console.log('weapon feedback: combat parity, voice cap, mute, and unsupported audio passed');
