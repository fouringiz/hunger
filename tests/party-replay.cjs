const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../prototype/index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const {experiment} = require('../tools/check-balance.cjs');

function makeContext() {
  const canvas = {getContext:()=>({}),style:{},getBoundingClientRect:()=>({left:0,top:0}),addEventListener(name,fn){if(name==='pointerdown') this.pointerDown=fn;}};
  const document = {getElementById:()=>canvas};
  const ctx=vm.createContext({document,window:{devicePixelRatio:1},innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},setTimeout(){}});
  ctx.canvas=canvas;return ctx;
}
function makeUiContext() {
  let input=null, downloadCount=0;
  const gradient={addColorStop(){}};
  const drawing=new Proxy({}, {get(_t,key){if(key==='createLinearGradient')return ()=>gradient;if(key==='measureText')return value=>({width:String(value).length*6});return ()=>{};},set(){return true;}});
  const canvas={width:960,height:540,style:{},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0}),addEventListener(name,fn){if(name==='pointerdown')this.pointerDown=fn;}};
  const document={hidden:false,body:{appendChild(el){if(el.type==='file')input=el;}},getElementById:()=>canvas,createElement(tag){
    if(tag==='canvas')return {width:0,height:0,getContext:()=>drawing};
    if(tag==='input')return {type:'',style:{},files:[],value:'',addEventListener(name,fn){if(name==='change')this.change=fn;},click(){this.clicked=true;}};
    return {click(){downloadCount++;},set href(v){},set download(v){}};
  }};
  const ctx=vm.createContext({document,window:{devicePixelRatio:1},innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},setTimeout(fn){fn();},Blob:class{constructor(parts){this.parts=parts;}},URL:{createObjectURL:()=>"blob:test",revokeObjectURL(){}}});
  ctx.canvas=canvas;Object.defineProperty(ctx,'downloadCount',{get:()=>downloadCount});Object.defineProperty(ctx,'fileInput',{get:()=>input});return ctx;
}
function run(ctx, code) { return vm.runInContext(code,ctx,{timeout:30000}); }
function makeWinningRecording() {
  const ctx=makeContext(); vm.runInContext(source,ctx);
  const adapted=experiment
    .replace(/const baseMakeEnemy = makeEnemy;[\s\S]*?\n};\n/,'')
    .replace('reset(); S.phase = \'build\';','reset(); update(0.017); performPlayerAction({kind:\'deploy\'});')
    .replaceAll('go:()=>build(slot,type)','go:()=>performPlayerAction({kind:\'build\',slot:SLOTS.indexOf(slot),type})')
    .replaceAll('go:()=>upgrade(t)',"go:()=>performPlayerAction({kind:'upgrade',slot:SLOTS.indexOf(t.slot),type:t.type,generation:replay.generations[SLOTS.indexOf(t.slot)]})")
    .replaceAll("build(slot,'generator')","performPlayerAction({kind:'build',slot:SLOTS.indexOf(slot),type:'generator'})")
    .replaceAll('upgrade(gen)','performPlayerAction({kind:\'upgrade\',slot:SLOTS.indexOf(gen.slot),type:gen.type,generation:replay.generations[SLOTS.indexOf(gen.slot)]})')
    .replaceAll('startWave();','performPlayerAction({kind:\'wave\'});');
  vm.runInContext(adapted,ctx,{timeout:30000});
  const result=run(ctx,"runTrial('turret','natural',0,1/60)");
  assert.equal(result.win,true,'the real starting-credit strategy should produce a win fixture');
  return {ctx,json:run(ctx,'JSON.stringify(exportReplay())')};
}

const cases=[];
function test(name,fn){try{fn();cases.push('PASS '+name);}catch(err){cases.push('FAIL '+name+'\n'+(err.stack||err));}}

test('real winning run exports and verifies from a fresh game',()=>{
  const {json}=makeWinningRecording(), fresh=makeContext();vm.runInContext(source,fresh);
  fresh.replayInput=json;
  run(fresh,"loadReplay(JSON.parse(replayInput)); while(replayStatus().mode==='playing') advanceReplayTick();");
  assert.equal(run(fresh,'replayStatus().mode'),'verified',run(fresh,'replayStatus().error'));assert.equal(run(fresh,'S.win'),true);
  assert.equal(run(fresh,'exportReplay().checkpoints.length'),10);
});

test('empty defense records and verifies a loss with manual wave start',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'update(0.037); performPlayerAction({kind:"deploy"}); performPlayerAction({kind:"wave"});');
  run(ctx,'while(S.phase!=="over") update(SIM_STEP);');
  const json=run(ctx,'JSON.stringify(exportReplay())'),fresh=makeContext();vm.runInContext(source,fresh);fresh.replayInput=json;
  run(fresh,"loadReplay(JSON.parse(replayInput)); while(replayStatus().mode==='playing') advanceReplayTick();");
  assert.equal(run(fresh,'replayStatus().mode'),'verified');assert.equal(run(fresh,'S.win'),false);
  const replayed=JSON.parse(run(fresh,'JSON.stringify(S)'));
  assert.ok(replayed.gate<20);
});

test('same-tick actions are ordered and unsuccessful actions are omitted',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"}); performPlayerAction({kind:"build",slot:0,type:"turret"}); performPlayerAction({kind:"wave"});');
  assert.equal(run(ctx,'performPlayerAction({kind:"build",slot:1,type:"not-a-tower"})'),false);
  assert.equal(run(ctx,'replay.events.length'),2);
  assert.equal(run(ctx,'replay.events[0].tick'),0);assert.equal(run(ctx,'replay.events[1].tick'),0);
  assert.deepEqual(JSON.parse(run(ctx,'JSON.stringify(replay.events.map(e=>e.kind))')),['build','wave']);
  assert.equal(run(ctx,'replay.events[0].seq'),0);assert.equal(run(ctx,'replay.events[1].seq'),1);
});

test('insufficient credits and occupied slots do not enter the replay',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"});performPlayerAction({kind:"build",slot:0,type:"cannon"});');
  assert.equal(run(ctx,'performPlayerAction({kind:"build",slot:1,type:"cannon"})'),false);
  assert.equal(run(ctx,'performPlayerAction({kind:"build",slot:0,type:"turret"})'),false);
  assert.equal(run(ctx,'replay.events.length'),1);
  run(ctx,'reset();performPlayerAction({kind:"deploy"});performPlayerAction({kind:"build",slot:0,type:"turret"});performPlayerAction({kind:"upgrade",slot:0,type:"turret",generation:1});performPlayerAction({kind:"upgrade",slot:0,type:"turret",generation:1});');
  assert.equal(run(ctx,'SLOTS[0].tower.level'),3);
  assert.equal(run(ctx,'performPlayerAction({kind:"upgrade",slot:0,type:"turret",generation:1})'),false);
  assert.equal(run(ctx,'replay.events.length'),3);
});

test('generation references reject stale towers after sale and rebuild',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"});performPlayerAction({kind:"build",slot:0,type:"turret"});');
  const gen1=run(ctx,'replay.generations[0]');
  run(ctx,'performPlayerAction({kind:"sell",slot:0,type:"turret",generation:1});while(S.towers.length)update(SIM_STEP);performPlayerAction({kind:"build",slot:0,type:"turret"});');
  assert.equal(run(ctx,'replay.generations[0]'),gen1+1);
  assert.equal(run(ctx,'performPlayerAction({kind:"upgrade",slot:0,type:"turret",generation:1})'),false);
});

test('invalid replay input leaves the current game untouched',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"});');
  const phase=run(ctx,'S.phase'), tick=run(ctx,'replay.tick');
  assert.throws(()=>run(ctx,'loadReplay({protocol:999})'),/incompatible/);
  assert.equal(run(ctx,'S.phase'),phase);assert.equal(run(ctx,'replay.tick'),tick);
});

test('wrong fingerprints and oversized payloads reject before changing state',()=>{
  const {json}=makeWinningRecording(),data=JSON.parse(json),ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"});');const before=run(ctx,'JSON.stringify({phase:S.phase,time:S.time,tick:replay.tick})');
  data.rules='00000000';assert.throws(()=>ctx.loadReplay(data),/incompatible/);
  data.rules=JSON.parse(json).rules;data.extra='x'.repeat(5*1024*1024);assert.throws(()=>ctx.loadReplay(data),/5 MB/);
  assert.equal(run(ctx,'JSON.stringify({phase:S.phase,time:S.time,tick:replay.tick})'),before);
});

test('a well-formed impossible action fails playback explicitly',()=>{
  const {json}=makeWinningRecording(), data=JSON.parse(json);
  data.events[0]={tick:0,seq:0,kind:'upgrade',slot:0,type:'turret',generation:1,wave:0,time:0};
  const ctx=makeContext();vm.runInContext(source,ctx);ctx.replayInput=JSON.stringify(data);
  run(ctx,"loadReplay(JSON.parse(replayInput)); advanceReplayTick();");
  assert.equal(run(ctx,'replayStatus().mode'),'error');
});

test('speed changes inside a frame batch stay exact at 20, 60, and 144 Hz',()=>{
  const recording=makeContext();vm.runInContext(source,recording);
  run(recording,'update(0.037);performPlayerAction({kind:"deploy"});performPlayerAction({kind:"wave"});update(SIM_STEP);performPlayerAction({kind:"speed",value:2});');
  run(recording,'while(S.phase!=="over") update(SIM_STEP*S.speed);');
  const json=run(recording,'JSON.stringify(exportReplay())');
  for(const fps of [20,60,144]){
    const ctx=makeContext();vm.runInContext(source,ctx);ctx.replayInput=json;
    run(ctx,"loadReplay(JSON.parse(replayInput));draw=()=>{};last=0;");
    for(let frame=1;frame<20000&&run(ctx,"replayStatus().mode==='playing'");frame++) run(ctx,`frame(${frame*1000/fps})`);
    assert.equal(run(ctx,'replayStatus().mode'),'verified','playback at '+fps+' Hz: '+run(ctx,'replayStatus().error'));
    assert.equal(run(ctx,'S.time'),JSON.parse(JSON.parse(json).terminal.signature).time);
  }
});

test('playback controls reject player actions and tower selection',()=>{
  const {json}=makeWinningRecording(),ctx=makeContext();vm.runInContext(source,ctx);ctx.replayInput=json;
  run(ctx,"loadReplay(JSON.parse(replayInput));draw=()=>{};");
  assert.equal(run(ctx,'performPlayerAction({kind:"wave"})'),false);
  ctx.canvas.pointerDown({clientX:110,clientY:160});
  assert.equal(run(ctx,'S.selected'),null);
});

test('automatic build-timer wave start is replayed without a manual wave event',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"});while(S.wave===0) update(SIM_STEP);');
  assert.equal(run(ctx,'S.phase'),'wave');assert.equal(run(ctx,'replay.events.length'),0);
});

test('completed replay export and result stay frozen after later idle updates',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"});performPlayerAction({kind:"wave"});while(S.phase!=="over")update(SIM_STEP);');
  const saved=run(ctx,'JSON.stringify(exportReplay())'),terminalTime=run(ctx,'S.time');
  run(ctx,'for(let i=0;i<100;i++)update(SIM_STEP);');
  assert.equal(run(ctx,'S.time'),terminalTime);assert.equal(run(ctx,'JSON.stringify(exportReplay())'),saved);
});

test('stale generation in an imported timeline reports a playback error',()=>{
  const {json}=makeWinningRecording(),data=JSON.parse(json),upgrade=data.events.find(e=>e.kind==='upgrade');
  assert.ok(upgrade);upgrade.generation=upgrade.generation+1;
  const ctx=makeContext();vm.runInContext(source,ctx);ctx.replayInput=JSON.stringify(data);
  run(ctx,"loadReplay(JSON.parse(replayInput));while(replayStatus().mode==='playing')advanceReplayTick();");
  assert.equal(run(ctx,'replayStatus().mode'),'error');assert.match(run(ctx,'replayStatus().error'),/generation/);
});

test('menu Load replay opens the file picker and completed results download JSON',()=>{
  const ctx=makeUiContext();vm.runInContext(source,ctx);
  run(ctx,'draw();');
  const load=run(ctx,'buttons.find(b=>b.label==="Load replay")');
  ctx.canvas.pointerDown({clientX:load.x+load.w/2,clientY:load.y+load.h/2});
  assert.equal(ctx.fileInput.clicked,true);
  run(ctx,'performPlayerAction({kind:"deploy"});performPlayerAction({kind:"wave"});while(S.phase!=="over")update(SIM_STEP);draw();');
  const save=run(ctx,'buttons.find(b=>b.label==="Save replay")'),play=run(ctx,'buttons.find(b=>b.label==="Play again")');
  assert.ok(save&&play);assert.ok(save.x+save.w<=play.x,'result buttons must not overlap');
  ctx.canvas.pointerDown({clientX:save.x+save.w/2,clientY:save.y+save.h/2});
  assert.equal(ctx.downloadCount,1);assert.equal(run(ctx,'replayUiMessage'),'Replay saved.');
  run(ctx,'S.win=true;draw();');
  const winSave=run(ctx,'buttons.find(b=>b.label==="Save replay")'),winPlay=run(ctx,'buttons.find(b=>b.label==="Play again")');
  assert.ok(winSave&&winPlay);assert.ok(winSave.x+winSave.w<=winPlay.x,'win result buttons must not overlap');
  run(ctx,'S.win=false;draw();');
  const restart=run(ctx,'buttons.find(b=>b.label==="Play again")');
  ctx.canvas.pointerDown({clientX:restart.x+restart.w/2,clientY:restart.y+restart.h/2});
  assert.equal(run(ctx,'replayStatus().mode'),'recording');assert.equal(run(ctx,'S.phase'),'build');
  assert.equal(run(ctx,'replay.events.length'),0);assert.equal(run(ctx,'replay.terminal'),null);
});

test('a tampered terminal win header fails verification',()=>{
  const ctx=makeContext();vm.runInContext(source,ctx);
  run(ctx,'performPlayerAction({kind:"deploy"});performPlayerAction({kind:"wave"});while(S.phase!=="over")update(SIM_STEP);');
  const data=JSON.parse(run(ctx,'JSON.stringify(exportReplay())'));data.terminal.win=!data.terminal.win;
  const fresh=makeContext();vm.runInContext(source,fresh);fresh.replayInput=data;
  run(fresh,"loadReplay(replayInput);while(replayStatus().mode==='playing')advanceReplayTick();");
  assert.equal(run(fresh,'replayStatus().mode'),'error');
  assert.match(run(fresh,'replayStatus().error'),/result did not match/);
});

console.log(cases.join('\n'));
const failures=cases.filter(s=>s.startsWith('FAIL')).length;
console.log(cases.length+' replay scenarios, '+failures+' failures');
if(failures) process.exitCode=1;
