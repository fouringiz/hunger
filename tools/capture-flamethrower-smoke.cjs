'use strict';
// User-run actual renderer capture; no ignored reference inputs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas'),{loadWorld}=require('./capture-organic-world.cjs');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'reports/generated/flamethrower-smoke');
function save(c,name){fs.writeFileSync(path.join(OUT,name+'.png'),c.toBuffer('image/png'));}
function copy(c,gray=false){const v=createCanvas(c.width,c.height),g=v.getContext('2d');g.drawImage(c,0,0);if(gray){const p=g.getImageData(0,0,v.width,v.height);for(let i=0;i<p.data.length;i+=4){const l=Math.round(.299*p.data[i]+.587*p.data[i+1]+.114*p.data[i+2]);p.data[i]=p.data[i+1]=p.data[i+2]=l;}g.putImageData(p,0,0);}return v;}
function close(c){const v=createCanvas(320,260);v.getContext('2d').drawImage(c,220,95,320,260,0,0,320,260);return v;}
function sheet(cells,name){const c=createCanvas(cells[0].width*cells.length,cells[0].height),g=c.getContext('2d');cells.forEach((v,i)=>g.drawImage(v,i*v.width,0));save(c,name);}
async function scene(zone,sourceHtml,branch,angle){
  const w=await loadWorld({zone,sourceHtml,viewport:[960,540]});
  w.run(`reset();S.credits=100000;build(SLOTS[2],'flamer');const smokeTower=S.towers[0];smokeTower.level=${branch?4:3};smokeTower.branch=${JSON.stringify(branch)};smokeTower.warm=0;smokeTower.angle=${angle};S.time=.05;S.selected=null;observeConstruction();presentationTime=3.1;observeConstruction();S.enemies=Array.from({length:6},(_,i)=>{const e=makeEnemy(i%2?'forager':'carapacid',1);e.d=420+i*40;const m=weaponMuzzle(smokeTower),r=tstats(smokeTower).range,u=.35+i*.09;e.x=m.x+(smokeTower.x+Math.cos(smokeTower.angle)*r-m.x)*u;e.y=m.y+(smokeTower.y+Math.sin(smokeTower.angle)*r-m.y)*u+24;e.hp=e.maxHp*.5;return e;});`);
  return w;
}
function draw(w,time,firing=true){const sig=w.run('replaySignature()');w.run(`presentationTime=${time};S.towers[0].jetAt=${firing?'0':'undefined'};draw();`);assert.equal(w.run('replaySignature()'),sig,'render remains simulation read-only');return copy(w.canvas);}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});const before=execFileSync('git',['show','194103f:prototype/index.html'],{cwd:ROOT,encoding:'utf8'}),verification={baseline:'194103f',zones:{}};
  for(const zone of ['mire','ember']){
    for(const branch of ['', 'A','B'])for(let n=0;n<8;n++){
      const frames=[];
      for(const [label,src]of [['before',before],['after',null]]){
        const w=await scene(zone,src,branch,n*Math.PI/4);let c;
        for(let i=0;i<=10;i++)c=draw(w,3.1+i*.1);
        const name=`${label}-${zone}-${branch||'level3'}-heading-${n}`;save(c,name+'-whole');save(copy(c,true),name+'-whole-gray');save(close(c),name+'-close');frames.push(close(c));
        verification.zones[zone]??={};verification.zones[zone][label]={rules:w.run('replayRulesFingerprint()'),source:w.run('replaySourceFingerprint()')};
      }
      sheet(frames,`${zone}-${branch||'level3'}-heading-${n}-before-after`);
    }
    assert.deepEqual(verification.zones[zone].before,verification.zones[zone].after,'both fingerprints unchanged');
    const w=await scene(zone,null,'',Math.PI/2),cycle=[];
    for(let i=0;i<=32;i++){const c=draw(w,3.1+i*.05,i<5);save(c,`${zone}-life-${String(i).padStart(2,'0')}-whole`);save(copy(c,true),`${zone}-life-${String(i).padStart(2,'0')}-gray`);cycle.push(close(c));}
    sheet(cycle,zone+'-life-cycle');
    for(const flag of ['paused','selling']){const v=await scene(zone,null,'',Math.PI/2);for(let i=0;i<8;i++)draw(v,3.1+i*.1);v.run(`S.towers[0].${flag}=true;`);save(draw(v,4),`${zone}-${flag}-whole`);assert.equal(v.run('flameSmokePuffs.length'),0);}
  }
  fs.writeFileSync(path.join(OUT,'verification.json'),JSON.stringify(verification,null,2));console.log('Wrote actual before/after whole/close/grayscale, 8 headings × level3/Plasma/Cryojet, life cycle and paused/sale captures to '+OUT+'; fingerprints unchanged.');
}
module.exports={main};
