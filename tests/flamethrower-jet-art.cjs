'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/hunger-flamethrower-jet-v1.frames.json'),'utf8'));
const FLAME_REACH=meta.sources.reduce((a,f)=>a+(f.bounds[2]-f.emission[0])*meta.scale,0)/meta.sources.length;
assert.ok(Math.abs(FLAME_REACH-382)<1,'FLAME_JET.reach matches the frames JSON bounds');
function boot(code=source,art=true){
  let matrix=[1,0,0,1,0,0],stack=[],points=[];const draws=[],fills=[];
  const mul=n=>{const[a,b,c,d,e,f]=matrix,[g,h,i,j,k,l]=n;matrix=[a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f];};
  const state={globalAlpha:1,globalCompositeOperation:'source-over',shadowBlur:0};
  const ctx=new Proxy(state,{get(o,k){
    if(k==='save')return ()=>stack.push({matrix:matrix.slice(),state:{...state}});
    if(k==='restore')return ()=>{const v=stack.pop();matrix=v.matrix;Object.assign(state,v.state);};
    if(k==='translate')return(x,y)=>mul([1,0,0,1,x,y]);
    if(k==='rotate')return a=>mul([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);
    if(k==='scale')return(x,y)=>mul([x,0,0,y,0,0]);
    if(k==='transform')return(...a)=>mul(a);
    if(k==='beginPath')return()=>{points=[];};
    if(['moveTo','lineTo','ellipse'].includes(k))return(...a)=>points.push([k,...a]);
    if(k==='fill')return()=>fills.push({points:points.slice(),color:o.fillStyle,alpha:o.globalAlpha});
    if(k==='drawImage')return(...a)=>draws.push({args:a,matrix:matrix.slice(),alpha:o.globalAlpha,blend:o.globalCompositeOperation,blur:o.shadowBlur});
    if(k==='getImageData'||k==='toDataURL')return()=>{throw Error('SecurityError');};
    return o[k]??(()=>{});
  }});
  class Image{constructor(){this.complete=true;this.naturalWidth=0;this.naturalHeight=0;}set src(v){this.url=v;const jet=v.includes('flamethrower-jet');this.naturalWidth=jet?(art?2048:0):v.includes('level4-towers')?4096:v.includes('flamethrower-v1')?768:0;this.naturalHeight=jet?256:v.includes('level4-towers')?2048:256;}get src(){return this.url;}}
  const canvas={getContext:()=>ctx,style:{},addEventListener(){}};
  const c=vm.createContext({Image,document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0}});
  vm.runInContext(code,c);const run=s=>vm.runInContext(s,c);
  run("reset();S.credits=10000;build(SLOTS[2],'flamer');const jetTower=S.towers[0];jetTower.angle=0;jetTower.level=3;jetTower.jetAt=0;S.time=.05;presentationTime=3;");
  return {run,draws,fills,frame(p=3){draws.length=0;fills.length=0;run(`presentationTime=${p};drawFlameJet(jetTower);`);return draws.filter(d=>d.args[0].src.includes('flamethrower-jet'));}};
}
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-8,`${msg}: ${a} != ${b}`);
function sheetContract(r){
  const draws=r.frame();assert.equal(draws.length,2,'sheet plus soft halo must draw');
  const d=draws[1],a=d.args,m=d.matrix;
  const spec=JSON.parse(r.run('JSON.stringify({m:weaponMuzzle(jetTower),t:{x:jetTower.x,y:jetTower.y,angle:jetTower.angle},range:tstats(jetTower).range})'));
  const length=Math.hypot(spec.t.x+Math.cos(spec.t.angle)*spec.range-spec.m.x,spec.t.y+Math.sin(spec.t.angle)*spec.range-spec.m.y);
  assert.deepEqual(a.slice(3,5),meta.cell);assert.deepEqual(a.slice(5),[-meta.anchor[0],-meta.anchor[1],...meta.cell]);
  const sx=Math.hypot(m[0],m[1]),sy=Math.hypot(m[2],m[3]);near(sx,sy,'uniform scale');near(sx*382,length,'visible flame tip (FLAME_JET.reach 382) reaches the range end');
  near(m[4],spec.m.x,'anchor x');near(m[5],spec.m.y,'anchor y');
  near(m[0]*382+m[4],spec.t.x+Math.cos(spec.t.angle)*spec.range,'visible tip x at range end');near(m[1]*382+m[5],spec.t.y+Math.sin(spec.t.angle)*spec.range,'visible tip y at range end');
  assert.equal(d.blend,'lighter');assert.ok(draws[0].blur>0&&draws[0].alpha<d.alpha,'soft halo underneath');
}
const r=boot();assert.deepEqual(meta.cell,[512,256]);assert.deepEqual(meta.anchor,[0,128]);assert.equal(meta.frames,4);
for(const [level,branch]of [[1,''],[2,''],[3,''],[4,'A']])for(let i=0;i<16;i++){
  r.run(`jetTower.level=${level};jetTower.branch=${JSON.stringify(branch)};jetTower.angle=${i*Math.PI/8};`);sheetContract(r);
}
const phases=[0,.09,.18,.27,.34].map(p=>r.frame(p)[1].args[1]);assert.deepEqual(phases,[0,512,1024,1536,0],'four frames loop by presentation time while simulation time is held');
r.run('jetTower.jetAt=0;S.time=.05;');const first=r.frame()[1].matrix;
r.run('jetTower.jetAt=.2;S.time=.25;');const second=r.frame()[1].matrix;
near(first[0],second[0],'mirror preserves forward x');near(first[1],second[1],'mirror preserves forward y');near(first[2],-second[2],'alternate pulse mirror x');near(first[3],-second[3],'alternate pulse mirror y');
r.run('jetTower.jetAt=.55;S.time=.60;');const irregular=r.frame()[1].matrix;near(first[2],irregular[2],'third pulse mirrors back even with irregular firing interval');near(first[3],irregular[3],'third pulse Y mirrors back');r.run('jetTower.jetAt=.2;S.time=.25;');
r.run('S.time=.38;');const faded=r.frame()[1].alpha;r.run('S.time=.25;');assert.ok(faded<r.frame()[1].alpha,'existing pulse fade');
for(const flag of ['paused','selling']){r.run(`jetTower.${flag}=true;`);assert.equal(r.frame().length,0);assert.equal(r.fills.length,0);r.run(`jetTower.${flag}=false;`);}
r.run("constructionArt.set(jetTower,{at:3,done:false});");assert.equal(r.frame().length,0,'folded assembly has no jet');r.run('constructionArt.delete(jetTower);');
r.run('S.time=.44;');assert.equal(r.frame().length,0,'pulse ends at .23 s');
r.run("S.time=.25;jetTower.branch='B';");assert.equal(r.frame().length,0,'Cryojet must not use sheet');assert.equal(r.fills[0].color,'#50b5cf');
const fallback=boot(source,false);assert.equal(fallback.frame().length,0);assert.equal(fallback.fills.length,9,'missing art retains current vector jet');
const a=fallback.frame(.02);const shape=JSON.stringify(fallback.fills);fallback.run('S.time=.08;');fallback.frame(.08);assert.notEqual(JSON.stringify(fallback.fills),shape,'vector fallback still flows');
const sig=r.run('replaySignature()');r.frame();assert.equal(r.run('replaySignature()'),sig);
function badContract(from,to,pattern){const bad=source.replace(from,to);assert.notEqual(bad,source);assert.throws(()=>sheetContract(boot(bad)),pattern);}
badContract('ctx.scale(scale,scale*mirror)','ctx.scale(scale,1*mirror)',/uniform scale/);
badContract('ctx.translate(m.x,m.y);ctx.rotate','ctx.translate(m.x,m.y+2);ctx.rotate',/anchor y/);
badContract("if(t.branch==='B'||!flameJetReady())return drawRibbonJet(t,ctx);","if(true)return drawRibbonJet(t,ctx);",/sheet plus soft halo/);
console.log('PASS approved jet sheet: 64 level/heading anchors, uniform scale (bad stretch rejected), presentation loop, alternating mirror, halo, fade, folded/paused/sale, Cryojet and fallback');
