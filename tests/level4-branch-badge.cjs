'use strict';
// Badge visibility is a presentation contract; actual-game frames are reviewed separately.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const ROOT=path.join(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const entries=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'),'utf8')).entries;
function boot(code=source){
 const arcs=[],texts=[],draws=[];
 class Image{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=2048;}set src(v){this._src=v;this.naturalWidth=v.endsWith('hunger-level4-towers-v2.png')?4096:2048;}get src(){return this._src;}}
 const ctx=new Proxy({}, {get(o,k){
  if(k==='arc')return (...a)=>arcs.push(a);
  if(k==='fillText')return (...a)=>texts.push(a);
  if(k==='drawImage')return (...a)=>draws.push(a);
  if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});
  if(k==='measureText')return s=>({width:String(s).length*6});
  return o[k]??(o[k]=()=>{});
 }});
 const canvas={style:{},getContext:()=>ctx,addEventListener(){}};
 const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
 vm.runInContext(code,c);
 return {run:x=>vm.runInContext(x,c),arcs,texts,draws,clear(){arcs.length=texts.length=draws.length=0;}};
}
function check(code=source){
 for(const e of entries)for(const state of ['ready','paused','selling'])for(const status of ['loaded','loading','failed','unrelated-missing']){
  const r=boot(code),image='level4Art',other='flamerArt';
  r.run(`reset();S.credits=10000;build(SLOTS[2],${JSON.stringify(e.type)});upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],${JSON.stringify(e.branch)});S.towers[0].warm=0;observeConstruction();presentationTime=3;observeConstruction();S.towers[0].paused=${state==='paused'};S.towers[0].selling=${state==='selling'};S.towers[0].sellT=SELL_TIME*.5;`);
  if(status==='loading')r.run(`${image}.complete=false;`);
  if(status==='failed')r.run(`${image}.naturalWidth=0;`);
  if(status==='unrelated-missing')r.run(`${other}.complete=false;${other}.naturalWidth=0;`);
  const sig=r.run('replaySignature()');r.clear();r.run('drawTowerBody(S.towers[0]);');
  assert.equal(r.run('replaySignature()'),sig,'badge rendering must not change combat state');
  const circle=r.arcs.filter(([x,y,radius])=>x===14&&y===-14&&radius===8);
  const letter=r.texts.filter(([,x,y])=>x===14&&y===-13);
  const loaded=status==='loaded'||status==='unrelated-missing',label=`${e.key} ${state} ${status}`;
  assert.equal(circle.length,loaded?0:1,label+': only fallback draws the round branch badge');
  assert.equal(letter.length,loaded?0:1,label+': only fallback draws the branch initial');
  if(loaded){
   const file='hunger-level4-towers-v2.png';
   assert.ok(r.draws.some(([im])=>im.src.endsWith(file)),label+': specialization art must actually be drawn');
  }else{
   const initial=r.run('BRANCHES[S.towers[0].type][S.towers[0].branch].name[0]');
   assert.equal(letter[0][0],initial,label+': fallback keeps the correct branch initial');
  }
 }
}
check();
const old=execFileSync('git',['show','c00cc8e:prototype/index.html'],{cwd:ROOT,encoding:'utf8'}).match(/<script>([\s\S]*?)<\/script>/)[1];
assert.throws(()=>check(old),/only fallback draws/,'the exact pre-iteration renderer must fail the loaded-art assertion');
console.log('PASS level-4 badge: all 8 branches, ready/pause/sale, loaded/loading/failed/independent atlases, render parity; exact old renderer rejected');
