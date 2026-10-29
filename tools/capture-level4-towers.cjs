'use strict';
// User-run only: one branch per invocation, through the actual game renderer.
// node tools/capture-organic-world.cjs --level4 machine-gun
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),{loadWorld}=require('./capture-organic-world.cjs');
const HOWITZER_DESIGN=process.argv.includes('--howitzer-design-review');
const ROOT=path.join(__dirname,'..'),SEATING=process.argv.includes('--level4-seat'),NEUTRAL=process.argv.includes('--voltaic-base'),YAW=process.argv.includes('--level4-yaw'),COMMON=process.argv.includes('--tower-base'),BADGE=process.argv.includes('--badge-review'),ANCHOR=process.argv.includes('--anchor-review'),POSE=HOWITZER_DESIGN||process.argv.includes('--pose-review'),BASE=HOWITZER_DESIGN?'d022ae3':POSE?'15ad9ed':ANCHOR?'df6f8f5':BADGE?'c00cc8e':COMMON?'528cb0b':YAW?'acb6218':NEUTRAL?'a434efa':SEATING?'e4d136f':'2308926',TABLE=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'),'utf8'));
const REFERENCES=[[30,94,354,337],[424,98,346,336],[804,75,329,360],[1174,90,346,344],[28,491,359,391],[427,553,342,331],[794,510,365,378],[1170,505,352,383]];
function gray(canvas){const c=createCanvas(canvas.width,canvas.height),g=c.getContext('2d');g.drawImage(canvas,0,0);const p=g.getImageData(0,0,c.width,c.height);for(let i=0;i<p.data.length;i+=4){const l=Math.round(.299*p.data[i]+.587*p.data[i+1]+.114*p.data[i+2]);p.data[i]=p.data[i+1]=p.data[i+2]=l;}g.putImageData(p,0,0);return c;}
function save(c,file){fs.writeFileSync(file+'.png',c.toBuffer('image/png'));}
function shot(w){const sig=w.run('replaySignature()');w.run('draw()');assert.equal(w.run('replaySignature()'),sig,'drawing must leave combat unchanged');return w.canvas;}
function crop(w){const p=JSON.parse(w.run('JSON.stringify({x:SLOTS[2].x,y:SLOTS[2].y})')),c=createCanvas(224,224);c.getContext('2d').drawImage(w.canvas,(p.x-56)*2,(p.y-86)*2,224,224,0,0,224,224);return c;}
function sheet(cells,file){const columns=Math.min(8,cells.length),rows=Math.ceil(cells.length/columns),c=createCanvas(columns*224,rows*448),g=c.getContext('2d');cells.forEach((cell,i)=>{const x=i%columns*224,y=Math.floor(i/columns)*448;g.drawImage(cell,x,y);g.drawImage(gray(cell),x,y+224);});save(c,file);const z=createCanvas(c.width*2,c.height*2);z.getContext('2d').drawImage(c,0,0,z.width,z.height);save(z,file+'-zoom');}
function setup(w,spec,level4=true){
 const target=level4===true?4:level4===false?3:level4;
 w.run(`reset();S.credits=10000;S.phase='build';S.buildTimer=999;build(SLOTS[2],${JSON.stringify(spec.type)});for(let l=1;l<${target};l++)upgrade(S.towers[0],l===3?${JSON.stringify(spec.branch)}:undefined);build(SLOTS[15],'generator');S.selected=null;S.towers.forEach(t=>t.warm=0);observeConstruction();presentationTime=3;observeConstruction();`);
}

async function capture(spec,zone,label,sourceHtml,out){
 // The pre-fix source uses the same atlas layout/name: load its actual pixels,
 // rather than accidentally comparing old metadata against the candidate art.
 const assetOverrides=HOWITZER_DESIGN&&label==='before'?{level4Art:execFileSync('git',['show',BASE+':assets/hunger-level4-towers-v2.png'],{cwd:ROOT,maxBuffer:32*1024*1024})}:{};
 const w=await loadWorld({zone,sourceHtml,assetGitRef:BASE,assetOverrides}),prefix=path.join(out,label+'-'+zone);
 assert.ok(w.images.worldGroundArt&&w.images.worldGroundArt.width>0,'actual zone ground material must load');
 const fingerprint={rules:w.run('replayRulesFingerprint()'),source:w.run('replaySourceFingerprint()')};
 if(COMMON){
  const levels=[];
  for(const level of [1,2,3]){setup(w,spec,level);shot(w);levels.push(crop(w));save(w.canvas,prefix+'-level'+level+'-whole');save(gray(w.canvas),prefix+'-level'+level+'-whole-gray');}
  sheet(levels,prefix+'-levels1to3');
  setup(w,spec,1);w.run('presentationTime=0;constructionArt=new WeakMap();observeConstruction();');
  const build=[],frames=path.join(out,label+'-'+zone+'-build-cycle');fs.mkdirSync(frames,{recursive:true});
  for(let i=0;i<=54;i++){w.run(`presentationTime=${i/30};`);shot(w);const cell=crop(w);save(cell,path.join(frames,String(i).padStart(3,'0')));if(i%3===0)build.push(cell);}
  sheet(build,prefix+'-build');
 }
 setup(w,spec);const turn=[],turnFrames=path.join(out,label+'-'+zone+'-turn-cycle'),steps=POSE?96:YAW?360:32;if(YAW||POSE)fs.mkdirSync(turnFrames,{recursive:true});
 for(let i=0;i<=steps;i++){const yaw=i*Math.PI*2/steps,a=POSE?Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw)):yaw;w.run(`S.towers[0].angle=${a};${POSE?'presentationTime='+String(3+i/30)+';':''}`);shot(w);const cell=crop(w);if(POSE?i%3===0:!YAW||i%10===0)turn.push(cell);if(YAW||POSE)save(cell,path.join(turnFrames,String(i).padStart(3,'0')));if(i===0){save(w.canvas,prefix+'-whole');save(gray(w.canvas),prefix+'-whole-gray');}}

 sheet(turn,prefix+'-turn');
 // A real level-3 -> level-4 action, observed by consecutive draws, exposes the upgrade handoff.
 setup(w,spec,false);shot(w);save(w.canvas,prefix+'-level3-whole');save(gray(w.canvas),prefix+'-level3-whole-gray');const level3=crop(w);w.run(`upgrade(S.towers[0],${JSON.stringify(spec.branch)});`);const upgrade=[level3];
 for(const dt of [0,.04,.08,.12,.2,.28,.36,.44,.48,.56]){w.run(`presentationTime=${3+dt};`);shot(w);upgrade.push(crop(w));}sheet(upgrade,prefix+'-upgrade');
 // Fire automatically in the real simulation. Stationary durable creatures make a repeatable full cycle.
 setup(w,spec);w.run("S.phase='wave';S.wave=5;S.streams=[];S.spawnQueue=[];S.enemies=['forager','carapacid','leech'].map((type,i)=>{const e=makeEnemy(type,1);e.d=nearestPathD(S.towers[0].x+85,S.towers[0].y)+i*24;Object.assign(e,posAt(e.d));e.hp=e.maxHp=100000;e.speed=e.effSpeed=0;return e;});S.towers[0].cd=0;");
 const attack=[],signatures=[],frames=path.join(out,label+'-'+zone+'-cycle');fs.mkdirSync(frames,{recursive:true});
 // 2.5 seconds includes a full Howitzer firing interval as well as recoil, charge and repeated streams.
 for(let i=0;i<=150;i++){
  if(i)w.run('update(SIM_STEP);presentationTime+=SIM_STEP;');shot(w);signatures.push(w.run('replaySignature()'));
  save(crop(w),path.join(frames,String(i).padStart(3,'0')));
  if(i%6===0)attack.push(crop(w));
  if(i===12){save(w.canvas,prefix+'-attack-whole');save(gray(w.canvas),prefix+'-attack-whole-gray');}
 }
 assert.ok(w.run('weaponFeedback.has(S.towers[0])||S.towers[0].jetAt!==undefined'),'capture must exercise at least one real attack for '+spec.key);
 sheet(attack,prefix+'-attack');
 w.run('S.towers[0].paused=true;');shot(w);save(w.canvas,prefix+'-paused');
 if(COMMON){const paused=[],start=w.run('presentationTime');for(let i=0;i<=18;i++){w.run(`presentationTime=${start+i/30};`);shot(w);paused.push(crop(w));}sheet(paused,prefix+'-pause-cycle');}
 w.run('S.towers[0].paused=false;sell(S.towers[0]);observeConstruction();');const sale=[];
 for(const k of [1,.8,.6,.4,.2,0]){w.run(`S.towers[0].sellT=SELL_TIME*${k};`);shot(w);sale.push(crop(w));}sheet(sale,prefix+'-sale');
 return {fingerprint,signatures};
}
async function main(){
 const arg=process.argv.indexOf(COMMON?'--tower-base':YAW?'--level4-yaw':NEUTRAL?'--voltaic-base':SEATING?'--level4-seat':'--level4'),key=process.argv[arg+1]||(NEUTRAL?'tesla':'machine-gun'),spec=TABLE.entries.find(e=>e.key===key);
 if(!spec)throw Error('Choose one branch: '+TABLE.entries.map(e=>e.key).join(', '));
 if(HOWITZER_DESIGN&&key!=='howitzer')throw Error('--howitzer-design-review is limited to howitzer');
 const out=path.join(ROOT,HOWITZER_DESIGN?'reports/generated/howitzer-design-review':POSE?'reports/generated/level4-poses/game':ANCHOR?'reports/generated/level4-seat-anchor':BADGE?'reports/generated/level4-badge':COMMON?'reports/generated/common-tower-base':YAW?'reports/generated/level4-yaw':NEUTRAL?'reports/generated/voltaic-base':SEATING?'reports/generated/level4-seating':'reports/generated/level4',key);fs.mkdirSync(out,{recursive:true});
 const before=execFileSync('git',['show',BASE+':prototype/index.html'],{cwd:ROOT,encoding:'utf8'}),candidate=NEUTRAL?execFileSync('git',['show','acb6218:prototype/index.html'],{cwd:ROOT,encoding:'utf8'}):null,results={};
 for(const zone of ['mire','ember']){
  const a=await capture(spec,zone,'before',before,out),b=await capture(spec,zone,'after',candidate,out);
  assert.deepEqual(b.fingerprint,a.fingerprint,'simulation rules/source must match the baseline');
  assert.deepEqual(b.signatures,a.signatures,'same scene and live ticks must produce identical combat with new art');results[zone]={fingerprint:b.fingerprint,ticks:b.signatures.length};
 }
 const reference=await loadImage(path.join(ROOT,'assets/art/references/towers/level4-selected-approved-v1.png'));
 const w=await loadWorld({sourceHtml:candidate});setup(w,spec);w.run('S.towers[0].angle=0;');shot(w);
 const c=createCanvas(448,224),g=c.getContext('2d'),box=REFERENCES[TABLE.entries.indexOf(spec)];
 g.fillStyle='#252a23';g.fillRect(0,0,448,224);
 // Same foundation width: the approved sheet's foundation occupies approximately 330 source pixels.
 const scale=88/330;g.drawImage(reference,...box,112-box[2]*scale/2,190-box[3]*scale,box[2]*scale,box[3]*scale);g.drawImage(crop(w),224,0);save(c,path.join(out,'reference-and-game'));
 if(COMMON||POSE){
  // Every authored view is drawn by the actual renderer beside the approved design,
  // keeping both foundations 88 native pixels wide. Midway transitions live in turn sheets.
  const board=createCanvas(2016,528),bg=board.getContext('2d');bg.fillStyle='#202823';bg.fillRect(0,0,board.width,board.height);bg.fillStyle='#eee8d9';bg.font='16px sans-serif';bg.fillText('Approved / '+spec.key,8,22);bg.drawImage(c,0,0,224,224,0,40,224,224);
  for(let frame=0;frame<16;frame++){
   const yaw=frame*Math.PI/8,a=Math.atan2(Math.sin(yaw)*.56,Math.cos(yaw));w.run(`S.towers[0].angle=${a};`);shot(w);w.run('presentationTime+=.08;');shot(w);
   const x=224+frame%8*224,y=Math.floor(frame/8)*264;bg.fillStyle='#eee8d9';bg.fillText(frame*22.5+' degrees',x+8,y+22);bg.drawImage(crop(w),x,y+40);
  }
  save(board,path.join(out,'approved-and-16-poses'));
  if(HOWITZER_DESIGN){
   // Supplement the original foundation reference with the exact user-approved
   // upper assembly. Its source has no foundation: normalize its visible height
   // to 37 world units (74 capture pixels), the unchanged Howitzer height.
   const approved=await loadImage(path.join(ROOT,'assets/art/references/towers/howitzer-selected-approved-v1.png'));
   const sw=approved.width/4,sh=approved.height/4,refScale=74/(sh*.84);
   bg.fillStyle='#eee8d9';bg.fillText('User-approved head',8,286);
   bg.drawImage(approved,0,0,sw,sh,112-sw*.5*refScale,425-sh*.94*refScale,sw*refScale,sh*refScale);
   save(board,path.join(out,'user-approved-and-16-poses'));
  }
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({branch:key,baseline:BASE,candidate:NEUTRAL?'acb6218':'working-tree',results,limits:'Controlled native capture, not file-origin browser validation or artistic approval. Reference crop is scaled by foundation width; review perspective, silhouette, occlusion, full cycles and grayscale manually.'},null,2)+'\n');
 console.log('Wrote '+out+'/{before,after}-{mire,ember}-{whole,whole-gray,turn,upgrade,attack,sale}*.png, full cycles and reference-and-game.png. Inspect before/after and whole/close views before marking visual work verified.');
}
module.exports={main};
