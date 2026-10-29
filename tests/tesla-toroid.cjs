'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const {historical}=require('./lib/history.cjs');
const ROOT=path.join(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
async function selected(sourceHtml=html){
 const w=await loadWorld({sourceHtml}),draws=[];
 w.run("reset();S.credits=10000;build(SLOTS[2],'voltaic');upgrade(S.towers[0]);upgrade(S.towers[0]);upgrade(S.towers[0],'A');S.towers[0].warm=0;observeConstruction();presentationTime=3;observeConstruction();");
 const draw=w.canvas.getContext('2d').drawImage.bind(w.canvas.getContext('2d'));
 w.canvas.getContext('2d').drawImage=(im,...a)=>{draws.push({im,a});draw(im,...a);};
 const signature=w.run('replaySignature()');
 for(const angle of [0,1,2,3,4,5,6]){w.run(`S.towers[0].angle=${angle};drawLevel4Tower(S.towers[0]);`);}
 assert.equal(w.run('replaySignature()'),signature);
 assert.ok(draws.some(d=>d.im===w.images.teslaToroidArt),'Tesla level 4 must draw the approved toroid, not the previous three-post head');
 const p=JSON.parse(w.run('JSON.stringify(level4Pose(S.towers[0]))'));
 assert.equal(p.frame,0);assert.equal(p.spec.tips.length,1);
 assert.ok(Math.abs(p.x+p.seat[0]*p.size/256)<1e-8);
 assert.ok(Math.abs(p.y+p.seat[1]*p.size/256-(-5.5+5))<1e-8,'collar bearing remains seated');
 return w;
}
(async()=>{
 const m=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-tesla-toroid-v1.frames.json')));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,m.source))).digest('hex'),m.sourceSha256,'exact approved attachment');
 const art=await loadImage(path.join(ROOT,'assets/hunger-tesla-toroid-v1.png'));assert.equal(art.width,256);assert.equal(art.height,256);
 const c=createCanvas(256,256),g=c.getContext('2d');g.drawImage(art,0,0);const data=g.getImageData(0,0,256,256).data;
 const alpha=(x,y)=>data[(Math.round(y)*256+Math.round(x))*4+3];
 for(const point of [m.tips[0],m.seats[0]]){
  let peak=0;for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)peak=Math.max(peak,alpha(point[0]+x,point[1]+y)||0);
  assert.ok(peak>=64,'discharge and bearing must touch opaque sprite');
 }
 const w=await selected();
 const old=await loadWorld({sourceHtml:historical('1499ae5','prototype/index.html')});
 assert.equal(w.run('replayRulesFingerprint()'),old.run('replayRulesFingerprint()'));
 assert.equal(w.run('replaySourceFingerprint()'),old.run('replaySourceFingerprint()'));
 for(const expr of ['VOLTAIC_NEUTRAL',"LEVEL4_ART.find(e=>e.key==='prism')"]){assert.equal(w.run(`JSON.stringify(${expr})`),old.run(`JSON.stringify(${expr})`),'Voltaic 1–3 and Prism unchanged');}
 w.run('teslaToroidReady=()=>false;');assert.doesNotThrow(()=>w.run('drawLevel4Tower(S.towers[0]);weaponMuzzle(S.towers[0]);'));
 const bad=html.replace("if(t.type==='voltaic'&&t.branch==='A'&&teslaToroidReady())return TESLA_TOROID;",'');assert.notEqual(bad,html);
 await assert.rejects(()=>selected(bad),/must draw the approved toroid/,'old selected head is rejected by the same check');
 console.log('PASS approved Tesla selection, raster attachment, fixed seat/yaw, fallback, unchanged neutral/Prism/rules, known-bad old selection');
})().catch(e=>{console.error(e);process.exitCode=1;});
