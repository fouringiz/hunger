const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function scene(withImage) {
  const images=[],draws=[];
  class FakeImage {constructor(){this.complete=false;this.naturalWidth=0;images.push(this);}}
  const ctx=new Proxy({}, {get(o,k){
    if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});
    if(k==='measureText')return value=>({width:String(value).length*6});
    if(k==='drawImage')return (...args)=>draws.push(args);
    return o[k]??(o[k]=()=>{});
  }});
  const canvas={getContext:()=>ctx,style:{},addEventListener(){}};
  const c=vm.createContext({Image:withImage?FakeImage:undefined,
    document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},
    location:{pathname:'/prototype/index.html',search:'?infantry=1'},URLSearchParams,
    innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(source,c);const run=code=>vm.runInContext(code,c);
  run("reset();S.phase='build';S.buildTimer=999;S.credits=1000;build(SLOTS[0],'barracks');S.selected=null;for(let i=0;i<120;i++)update(SIM_STEP);");
  return {run,images,draws};
}
// Select the actual runtime asset; unrelated sprite additions may change creation order.
const loaded=scene(true),art=loaded.run('infantryArt');
assert.ok(art.src.endsWith('/assets/runtime/infantry-trial-v1.png'));
art.complete=true;art.naturalWidth=1254;art.naturalHeight=1254;
const serialize="JSON.stringify(S,(key,value)=>['slot','target','blockedBy'].includes(key)?undefined:value)";
const snapshot=loaded.run(serialize);loaded.run('draw()');
assert.equal(loaded.draws.filter(d=>d[0]===art).length,3,'all three soldiers render in normal build view without an evolution card');
assert.equal(loaded.run(serialize),snapshot,'drawing preserves the simulation');
loaded.run("S.selected={kind:'slot',slot:SLOTS[1]};draw()");
assert.equal(loaded.run("buttons.filter(b=>b.w===92 && b.y===SLOTS[1].y+26).length"),6,'trial exposes all six build choices');
for(const withImage of [false,true]){
  const fallback=scene(withImage);
  if(withImage)fallback.run('infantryArt.complete=true'); // failed image: naturalWidth stays zero
  assert.doesNotThrow(()=>fallback.run('draw()'),'missing/failed sheet retains vector soldiers');
  if(withImage)assert.ok(!fallback.draws.some(d=>d[0]===fallback.run('infantryArt')),'failed sheet is never drawn');
}
console.log('PASS infantry art: actual actors render outside evolution card, draw parity, menu and sheet fallback');
