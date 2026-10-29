'use strict';
// User-run through capture-organic-world.cjs --flamethrower. Uses that tool's actual game renderer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),CONTACT_FIRE=process.argv.includes('--flamethrower-contact'),WIDTH_FIRE=process.argv.includes('--flamethrower-width'),REF_FIRE=CONTACT_FIRE||WIDTH_FIRE||process.argv.includes('--flamethrower-reference'),OUT=path.join(ROOT,'reports/generated',CONTACT_FIRE?'flamethrower-contact':WIDTH_FIRE?'flamethrower-width':REF_FIRE?'flamethrower-reference-fire':'flamethrower');
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
  if(REF_FIRE)return approvedJetMain();
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
  console.log('Wrote '+OUT+'/{before,after}-{mire,ember}-fire-{base,A,B}-{flow,sweep,stop}-{game,zoom}.png and whole/gray views. Controlled actual-renderer poses: fixed-nozzle flow, full sweep, and final-pulse fade. Actual combat timing still needs the disk-browser check.');
}
async function approvedJetMain(){
  const arg=process.argv.indexOf('--before'),rev=arg<0?(CONTACT_FIRE?'5d8eb5fca77dd2fca4d0e24ccc39d3bdb39b0d72':'ed1b683775c1d1f2d5d6dc943c49a93c66b70de5'):process.argv[arg+1];
  assert.ok(rev,'--before requires a revision');
  const before=execFileSync('git',['show',rev+':prototype/index.html'],{cwd:ROOT,encoding:'utf8'});
  const report={before:rev,smoke:'iteration 2 not started',zones:{}};
  function grid(cells,cols=4){const w=cells[0].width,h=cells[0].height,c=createCanvas(w*cols,h*Math.ceil(cells.length/cols)),g=c.getContext('2d');cells.forEach((v,i)=>g.drawImage(v,i%cols*w,Math.floor(i/cols)*h));return c;}
  function copy(c){const d=createCanvas(c.width,c.height);d.getContext('2d').drawImage(c,0,0);return d;}
  function patch(w,at){const c=createCanvas(280,240);c.getContext('2d').drawImage(w.canvas,at.x-140,at.y-120,280,240,0,0,280,240);return c;}
  for(const zone of ['mire','ember']){
    const worlds={before:await loadWorld({zone,sourceHtml:before,assetGitRef:rev,viewport:[960,540]}),after:await loadWorld({zone,viewport:[960,540]})};
    const fingerprints={};
    for(const[label,w]of Object.entries(worlds)){
      w.run("reset();S.credits=10000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[2],'flamer');build(SLOTS[5],'turret');build(SLOTS[12],'cannon');S.selected=null;observeConstruction();presentationTime=3;observeConstruction();");
      fingerprints[label]={rules:w.run('replayRulesFingerprint()'),source:w.run('replaySourceFingerprint()')};
      const at=JSON.parse(w.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})'));
      for(const [kind,level,branch]of [['level3',3,''],['plasma',4,'A'],['cryojet',4,'B']]){
        const headings=[];
        for(let i=0;i<8;i++){
          w.run(`{const t=S.towers[0];t.level=${level};t.branch=${JSON.stringify(branch)};t.angle=${i*Math.PI/4};t.paused=false;t.selling=false;S.time=.05;t.jetAt=0;presentationTime=3.1;observeConstruction();S.enemies=['forager','carapacid','leech'].map((type,j)=>{const e=makeEnemy(type,1);e.d=420+j*40;const side=j===0?0:j===1?50:-55;e.x=t.x+Math.cos(t.angle)*(48+j*18)-Math.sin(t.angle)*side;e.y=t.y+Math.sin(t.angle)*(48+j*18)+Math.cos(t.angle)*side;return e;});}`);
          shot(w);save(w.canvas,`${label}-${zone}-${kind}-heading-${i}-whole`);save(gray(w.canvas),`${label}-${zone}-${kind}-heading-${i}-whole-gray`);
          headings.push(patch(w,at));
          if(i===0&&kind==='level3'){save(w.canvas,`${label}-${zone}-whole`);save(gray(w.canvas),`${label}-${zone}-whole-gray`);}
        }
        const headingsGrid=grid(headings);save(headingsGrid,`${label}-${zone}-${kind}-8-headings-game`);
        const z=createCanvas(headingsGrid.width*2,headingsGrid.height*2);z.getContext('2d').drawImage(headingsGrid,0,0,z.width,z.height);save(z,`${label}-${zone}-${kind}-8-headings-zoom`);
      }
      w.run("{const t=S.towers[0];t.level=3;t.branch='';t.angle=0;}");
      const cycle=[];
      // Two complete four-frame clips, including the wrap, plus consecutive firing pulses.
      for(let i=0;i<=16;i++){
        const time=i/24;
        w.run(`presentationTime=${3+time};S.time=${time};S.towers[0].jetAt=${Math.floor((time+1e-9)/.2)*.2};`);
        shot(w);cycle.push(patch(w,at));
      }
      save(grid(cycle),`${label}-${zone}-full-cycle-game`);
      const sweep=[];
      for(let i=0;i<=24;i++){
        const time=i*Math.PI*2/24/3.2;
        w.run(`S.towers[0].angle=${Math.sin(i*Math.PI*2/24)*Math.PI/4};presentationTime=${6+time};S.time=${time};S.towers[0].jetAt=${Math.floor((time+1e-9)/.2)*.2};`);
        shot(w);sweep.push(patch(w,at));
      }
      save(grid(sweep),`${label}-${zone}-full-sweep-game`);w.run('S.towers[0].angle=0;');
      const fade=[];for(const age of [0,.08,.16,.2,.22,.24,.3]){w.run(`presentationTime=${4+age};S.time=${.4+age};S.towers[0].jetAt=.4;`);shot(w);fade.push(patch(w,at));}
      save(grid(fade),`${label}-${zone}-stop-game`);
      const states=[];
      for(const state of ['paused','selling','folded']){
        w.run(`{const t=S.towers[0];t.paused=${state==='paused'};t.selling=${state==='selling'};t.sellT=SELL_TIME*.5;t.jetAt=1;S.time=1.05;presentationTime=5;constructionArt.delete(t);}`);
        if(state==='folded')w.run('S.towers[0].jetAt=undefined;constructionArt.set(S.towers[0],{at:5,done:false});');
        shot(w);save(w.canvas,`${label}-${zone}-${state}-whole`);states.push(patch(w,at));
      }
      save(grid(states,3),`${label}-${zone}-states-game`);
      if(CONTACT_FIRE){
        for(const type of ['forager','carapacid','leech','polyp']){
          w.run(`reset();S.credits=10000;S.phase='wave';S.wave=5;S.spawnQueue=[];S.streams=[];build(SLOTS[2],'flamer');S.towers[0].level=3;S.towers[0].angle=0;S.selected=null;observeConstruction();presentationTime=9;observeConstruction();S.enemies=[makeEnemy(${JSON.stringify(type)},1)];{const t=S.towers[0],e=S.enemies[0];e.x=t.x+58;e.y=t.y;e.d=420;e.burnUntil=1.4;e.burnTower=t;}`);
          const contactFrames=[];
          for(let i=0;i<=36;i++){
            const time=i/24;
            w.run(`presentationTime=${9+time};S.time=${time};S.towers[0].jetAt=${Math.floor((Math.min(time,.6)+1e-9)/.2)*.2};`);
            shot(w);const close=patch(w,at);contactFrames.push(close);
            save(close,`${label}-${zone}-${type}-contact-${String(i).padStart(3,'0')}`);
            if(i===8){save(w.canvas,`${label}-${zone}-${type}-contact-whole`);save(gray(w.canvas),`${label}-${zone}-${type}-contact-whole-gray`);}
          }
          save(grid(contactFrames,6),`${label}-${zone}-${type}-contact-full-cycle`);
          save(grid(contactFrames.filter((_,i)=>[0,4,8,14,24,36].includes(i)),3),`${label}-${zone}-${type}-contact-stages`);
        }
      }
      // Same live combat and presentation steps must leave replay state identical in both renderers.
      w.run("reset();S.credits=10000;build(SLOTS[2],'flamer');S.towers[0].level=3;S.wave=5;S.phase='wave';S.spawnQueue=[];S.enemies=[makeEnemy('carapacid',1)];S.enemies[0].d=450;Object.assign(S.enemies[0],posAt(450));");
    }
    assert.deepEqual(fingerprints.after,fingerprints.before,'simulation fingerprints unchanged');
    for(let i=0;i<151;i++){
      for(const w of Object.values(worlds)){w.run('update(SIM_STEP);presentationTime+=SIM_STEP;');shot(w);}
      assert.equal(worlds.after.run('replaySignature()'),worlds.before.run('replaySignature()'),'live simulation parity at step '+i);
    }
    report.zones[zone]={fingerprints,identicalCombatSteps:151};
    // Approved committed sheet at exactly the gameplay frame dimensions, replacing the ignored photo dependency.
    const ref=createCanvas(280,240),g=ref.getContext('2d'),w=worlds.after;
    w.run("S.towers[0].level=3;S.towers[0].branch='';S.towers[0].angle=0;");
    const geom=JSON.parse(w.run('JSON.stringify({m:weaponMuzzle(S.towers[0]),x:S.towers[0].x,y:S.towers[0].y,r:tstats(S.towers[0]).range})'));
    const dx=geom.x+geom.r-geom.m.x,dy=geom.y-geom.m.y,k=Math.hypot(dx,dy)/512;
    g.fillStyle='#292e29';g.fillRect(0,0,280,240);g.translate(65,120);g.rotate(Math.atan2(dy,dx));g.scale(k,k);g.drawImage(w.images.flameJetArt,0,0,512,256,0,-128,512,256);
    const old=await loadImage(path.join(OUT,`before-${zone}-level3-heading-0-whole.png`)),now=await loadImage(path.join(OUT,`after-${zone}-level3-heading-0-whole.png`));
    const at=JSON.parse(w.run('JSON.stringify({x:S.towers[0].x,y:S.towers[0].y})'));
    const board=grid([ref,patch({canvas:old},at),patch({canvas:now},at)],3);save(board,`${zone}-reference-before-after`);
    const wholeBoard=grid([await loadImage(path.join(OUT,`before-${zone}-whole.png`)),await loadImage(path.join(OUT,`after-${zone}-whole.png`)),await loadImage(path.join(OUT,`before-${zone}-whole-gray.png`)),await loadImage(path.join(OUT,`after-${zone}-whole-gray.png`))],2);save(wholeBoard,`${zone}-whole-before-after`);
  }
  fs.writeFileSync(path.join(OUT,'verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Wrote '+OUT+': game-size before/after Mire/Ember, 8 headings for level3/Plasma/Cryojet, full cycles, stop and paused/sale/folded states. Fingerprints and 151 live steps per zone match. Reference is the committed approved sheet; no ignored photo required.');
}

module.exports={main};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
