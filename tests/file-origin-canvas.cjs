// Opened from disk (file://), images taint the canvas and getImageData throws a SecurityError. The game must still draw.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(){
  class Image{constructor(){this.complete=true;}set src(value){this.url=value;this.naturalWidth=value.includes('forager-mire')?2496:value.includes('leech-mire')?1024:256;this.naturalHeight=value.includes('forager-mire')?3072:value.includes('leech-mire')?4096:256;}get src(){return this.url;}}
  let reads=0;
  const drawing=new Proxy({globalAlpha:1,globalCompositeOperation:'source-over'},{get(o,k){
    if(k==='getImageData')return ()=>{reads++;const e=new Error('The operation is insecure.');e.name='SecurityError';throw e;};
    if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createPattern')return ()=>({addColorStop(){}});
    if(k==='measureText')return t=>({width:String(t).length*5});
    return o[k]??(o[k]=()=>{}); },set(o,k,v){o[k]=v;return true;}});
  const canvas={getContext:()=>drawing,style:{},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0})};
  const ctx=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(source,ctx); return {run:c=>vm.runInContext(c,ctx),reads:()=>reads};
}
for(const zone of ['','?zone=ember']){
  const r=boot();
  r.run("reset();S.phase='build';S.credits=600;S.buildTimer=999;build(SLOTS[2],'turret');startWave();for(let i=0;i<300;i++)update(SIM_STEP);");
  assert.doesNotThrow(()=>r.run('draw();draw()'),'draw() must survive a tainted canvas');
  assert.ok(r.reads()>0,'the Gate surface did attempt a pixel read, which was refused');
}
console.log('PASS the game draws when getImageData is refused (opened from disk)');
console.log('1 file-origin scenario, 0 failures');
