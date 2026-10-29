'use strict';
// User-run through capture-organic-world.cjs --flamethrower. Uses that tool's actual game renderer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),WIDTH_FIRE=process.argv.includes('--flamethrower-width'),REF_FIRE=WIDTH_FIRE||process.argv.includes('--flamethrower-reference'),OUT=path.join(ROOT,'reports/generated',WIDTH_FIRE?'flamethrower-width':REF_FIRE?'flamethrower-reference-fire':'flamethrower');
const BASE='58c1e8eeb350927ec16a2723eecb91171a71f718';
function save(canvas,name){fs.writeFileSync(path.join(OUT,name+'.png'),canvas.toBuffer('image/png'));}
function gray(canvas){const c=createCanvas(canvas.width,canvas.height),g=c.getContext('2d');g.drawImage(canvas,0,0);const p=g.getImageData(0,0,c.width,c.height);for(let i=0;i<p.data.length;i+=4){const l=Math.round(.299*p.data[i]+.587*p.data[i+1]+.114*p.data[i+2]);p.data[i]=p.data[i+1]=p.data[i+2]=l;}g.putImageData(p,0,0);return c;}
function shot(w){const sig=w.run('replaySignature()');w.run('draw()');assert.equal(w.run('replaySignature()'),sig,'rendering leaves combat unchanged');return w.canvas;}
function crop(canvas,x,y,wide=false){const w=wide?300:160,h=wide?320:160,c=createCanvas(w,h);c.getContext('2d').drawImage(canvas,(x-40)*2,(y-(wide?80:52))*2,w,h,0,0,w,h);return c;}
function sheet(cells,name){
  const w=cells[0].width,h=cells[0].height,c=createCanvas(w*cells.length,h*2),g=c.getContext('2d');cells.forEach((v,i)=>{g.drawImage(v,i*w,0);g.drawImage(gray(v),i*w,h);});save(c,name+'-game');
  const z=createCanvas(c.width*3,c.height*3);z.getContext('2d').drawImage(c,0,0,z.width,z.height);save(z,name+'-zoom');
}
async function capture(zone,label,sourceHtml){
  const w=await loadWorld({zone,sourceHtml});
  w.run("reset();S.credits=10000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[2],'flamer');build(SLOTS[5],'turret');build(SLOTS[12],'cannon');S.selected=null;observeConstruction();presentationTime=3;observeConstruction();S.enemies=[makeEnemy('forager',1),makeEnemy('carapacid',1)];S.enemies.forEach((e,i)=>{e.d=420+i*80;Object.assign(e,posAt(e.d));});");
  const at=JSON.parse(w.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})'));
  save(shot(w),`${label}-${zone}-whole`);save(gray(w.canvas),`${label}-${zone}-whole-gray`);
  const turn=[];
  // Includes every 22.5-degree direction and the duplicate start frame, for the complete turn seam.
  for(let i=0;i<=16;i++){w.run(`S.towers[0].angle=${i*Math.PI/8};S.towers[0].jetAt=undefined;`);turn.push(crop(shot(w),at.x,at.y));}
  sheet(turn,`${label}-${zone}-turn`);
  for(const branch of ['', 'A','B']){
    const sweep=[];
    // One full 1.96-second sinusoidal sweep: centre -> right -> centre -> left -> centre.
    for(let i=0;i<=16;i++){
      w.run(`S.time=${i*Math.PI*2/16/3.2};S.towers[0].angle=Math.sin(${i*Math.PI*2/16})*Math.PI/4;S.towers[0].branch=${JSON.stringify(branch)};S.towers[0].jetAt=S.time;`);
      sweep.push(crop(shot(w),at.x,at.y,true));
    }
    sheet(sweep,`${label}-${zone}-sweep-${branch||'base'}`);
  }
  const states=[];
  for(const state of ["t.paused=false;t.selling=false;t.branch='';t.level=1;","t.paused=true;","t.paused=false;t.branch='A';t.level=4;","t.branch='B';","t.selling=true;t.sellT=.5;"]){
    w.run(`{const t=S.towers[0];t.angle=0;t.jetAt=undefined;${state}}`);states.push(crop(shot(w),at.x,at.y));
  }
  sheet(states,`${label}-${zone}-states`);
  return {rules:w.run('replayRulesFingerprint()'),source:w.run('replaySourceFingerprint()')};
}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});
  if(process.argv.includes('--flamethrower-deployment'))return deploymentMain();
  if(REF_FIRE)return fireMain();
  if(process.argv.includes('--flamethrower-fire'))return fireMain();
  const arg=process.argv.indexOf('--before'),rev=arg<0?BASE:process.argv[arg+1];
  const before=execFileSync('git',['show',rev+':prototype/index.html'],{cwd:ROOT,encoding:'utf8'});
  for(const zone of ['mire','ember']){
    const old=await capture(zone,'before',before),current=await capture(zone,'after',null);
    assert.deepEqual(current,old,'presentation integration must preserve both simulation fingerprints');
  }
  // Put the approved reference at the same footprint scale beside the actual right-facing game crop.
  const reference=await loadImage(path.join(OUT,'flamethrower-concept-v1.png'));
  const c=createCanvas(320,160),g=c.getContext('2d');g.fillStyle='#252a23';g.fillRect(0,0,320,160);
  g.drawImage(reference,272,126,996,833,36,28,100,84);
  const world=await loadWorld();world.run("reset();S.credits=1000;build(SLOTS[2],'flamer');S.towers[0].angle=0;S.selected=null;observeConstruction();presentationTime=3;observeConstruction();");
  const p=JSON.parse(world.run('JSON.stringify({x:SLOTS[2].x,y:SLOTS[2].y})'));
  g.drawImage(crop(shot(world),p.x,p.y),160,0);save(c,'reference-and-game');
  console.log('Wrote '+OUT+'/{before,after}-{mire,ember}-{whole,whole-gray,turn-game,turn-zoom,sweep-*-game,sweep-*-zoom,states-game,states-zoom}.png and reference-and-game.png; simulation fingerprints unchanged.');
}
async function deploymentMain(){
  const before=execFileSync('git',['show','9ea29bb:prototype/index.html'],{cwd:ROOT,encoding:'utf8'});
  for(const zone of ['mire','ember'])for(const label of ['before','after']){
    const w=await loadWorld({zone,sourceHtml:label==='before'?before:null});
    w.run("reset();S.phase='build';S.credits=1000;build(SLOTS[2],'flamer');S.selected=null;S.towers[0].angle=0;observeConstruction();");
    const at=JSON.parse(w.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})')),cells=[];
    for(const time of [0,.1,.25,.4,.6,.8,1,1.2,1.4,1.6,1.65,1.8]){
      w.run(`presentationTime=${time};`);cells.push(crop(shot(w),at.x,at.y));
      if([0,.8,1.8].includes(time)){save(w.canvas,`${label}-${zone}-deploy-whole-${time}`);save(gray(w.canvas),`${label}-${zone}-deploy-whole-gray-${time}`);}
    }
    sheet(cells,`${label}-${zone}-deploy`);
    w.run('sell(S.towers[0]);observeConstruction();');const sale=[];
    for(const q of [1,.85,.7,.55,.4,.25,.1,0]){w.run(`S.towers[0].sellT=SELL_TIME*${q};`);sale.push(crop(shot(w),at.x,at.y));}
    sheet(sale,`${label}-${zone}-retract`);
  }
  console.log('Wrote '+OUT+'/{before,after}-{mire,ember}-{deploy,retract}-{game,zoom}.png and deployment whole/gray views. Review full assembly and retraction independently of the fire effect.');
}
async function fireMain(){
  const arg=process.argv.indexOf('--before');
  const rev=arg<0?(WIDTH_FIRE?'c56b950':REF_FIRE?'2308926':'198ef68'):process.argv[arg+1];
  assert.ok(rev,'--before requires a Git revision');
  const before=execFileSync('git',['show',rev+':prototype/index.html'],{cwd:ROOT,encoding:'utf8'}),fingerprints={};
  for(const zone of ['mire','ember'])for(const label of ['before','after']){
    const w=await loadWorld({zone,sourceHtml:label==='before'?before:null});
    fingerprints[label]={rules:w.run('replayRulesFingerprint()'),source:w.run('replaySourceFingerprint()')};
    for(const branch of ['', 'A','B']){
      w.run(`reset();S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];S.credits=1000;build(SLOTS[2],'flamer');S.selected=null;S.towers[0].angle=0;S.towers[0].branch=${JSON.stringify(branch)};observeConstruction();presentationTime=3;observeConstruction();S.enemies=[makeEnemy('forager',1),makeEnemy('carapacid',1)];S.enemies.forEach((e,i)=>{e.x=S.towers[0].x+65+i*18;e.y=S.towers[0].y+(i?18:0);});`);
      const at=JSON.parse(w.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})')),flow=[],sweep=[],stop=[],name=`${label}-${zone}-fire-${branch||'base'}`;
      // Reference pass spans two complete billow advections and two full eight-phase texture clips (1.33 s).
      for(let i=0;i<=(REF_FIRE?20:12);i++){
        const time=i/(REF_FIRE?15:30);w.run(`S.time=${time};S.towers[0].angle=0;S.towers[0].jetAt=${Math.floor((time+1e-9)/.2)*.2};`);
        flow.push(crop(shot(w),at.x,at.y,true));
        if(i===3){save(w.canvas,name+'-whole');save(gray(w.canvas),name+'-whole-gray');}
      }
      sheet(flow,name+'-flow');
      for(let i=0;i<=24;i++){
        const time=i*Math.PI*2/24/3.2;
        w.run(`S.time=${time};S.towers[0].angle=${Math.sin(i*Math.PI*2/24)*Math.PI/4};S.towers[0].jetAt=${Math.floor((time+1e-9)/.2)*.2};`);
        sweep.push(crop(shot(w),at.x,at.y,true));
      }
      sheet(sweep,name+'-sweep');
      for(const age of [0,.08,.16,.2,.22,.24,.3]){
        w.run(`S.time=${.4+age};S.towers[0].angle=0;S.towers[0].jetAt=.4;`);stop.push(crop(shot(w),at.x,at.y,true));
      }
      sheet(stop,name+'-stop');
    }
    if(label==='after')assert.deepEqual(fingerprints.after,fingerprints.before,'fire presentation leaves simulation fingerprints unchanged');
  }
  if(REF_FIRE)await fireReferenceBoard(before);
  console.log('Wrote '+OUT+'/{before,after}-{mire,ember}-fire-{base,A,B}-{flow,sweep,stop}-{game,zoom}.png and whole/gray views. Controlled actual-renderer poses: fixed-nozzle flow, full sweep, and final-pulse fade. Actual combat timing still needs the disk-browser check.');
}
async function fireReferenceBoard(before){
  const photo=await loadImage(path.join(ROOT,'reports/generated/flamethrower/references/fire-1.png'));
  const board=createCanvas(600,320),g=board.getContext('2d');g.fillStyle='#292e29';g.fillRect(0,0,600,320);
  // Photo 1's nozzle-to-tip crop is ~600 source pixels; scale to the game's 66-unit visible jet (132 screen px).
  g.drawImage(photo,267,30,600,280,16,39.4,132,61.6);
  for(const [i,sourceHtml]of [before,null].entries()){
    const w=await loadWorld({sourceHtml});
    w.run("reset();S.phase='wave';S.wave=1;S.spawnQueue=[];S.streams=[];S.credits=1000;build(SLOTS[2],'flamer');S.selected=null;S.towers[0].angle=0;observeConstruction();presentationTime=3;observeConstruction();S.time=.2;S.towers[0].jetAt=.2;");
    const m=JSON.parse(w.run('JSON.stringify(weaponMuzzle(S.towers[0]))'));shot(w);
    g.drawImage(w.canvas,(m.x-8)*2,(m.y-45)*2,200,160,200*(i+1),0,200,160);
  }
  g.drawImage(gray(board),0,160);g.fillStyle='#fff';g.font='12px sans-serif';['REFERENCE','BEFORE','AFTER'].forEach((s,i)=>g.fillText(s,i*200+8,15));
  save(board,'reference-before-after');
}
module.exports={main};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
