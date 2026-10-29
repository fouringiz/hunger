'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const html=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8');
async function check(sourceHtml){
  const w=await loadWorld({sourceHtml,viewport:[960,540]});
  w.run("const layerEvents=[],jetDraw=drawFlameJet,bodyDraw=drawEnemyBody;drawFlameJet=t=>{if(t.branch!=='B')layerEvents.push('jet');return jetDraw(t);};drawEnemyBody=(...a)=>{layerEvents.push('enemy');return bodyDraw(...a);};reset();S.credits=10000;build(SLOTS[2],'flamer');S.towers[0].level=3;S.enemies=[makeEnemy('forager',1)];S.enemies[0].d=420;Object.assign(S.enemies[0],posAt(420));S.selected=null;observeConstruction();presentationTime=3;observeConstruction();");
  for(let i=0;i<16;i++){
    w.run(`S.towers[0].angle=${i*Math.PI/8};S.towers[0].jetAt=S.time;layerEvents.length=0;draw();`);
    const events=JSON.parse(w.run('JSON.stringify(layerEvents)'));
    assert.ok(events.includes('jet')&&events.includes('enemy'),'actual fire and enemy layers exercised');
    assert.ok(events.lastIndexOf('jet')<events.indexOf('enemy'),'incandescent jet must not overlay enemy bodies');
  }
}
(async()=>{
  await check(html);
  const layer="  for(const t of S.towers)if(t.type==='flamer'&&t.branch!=='B')drawFlameJet(t);\n";
  const after="  for (const t of S.towers) if (t.type === 'flamer'&&t.branch==='B') drawFlameJet(t);";
  assert.ok(html.includes(layer)&&html.includes(after));
  const bad=html.replace(layer,'').replace(after,layer+after);
  await assert.rejects(()=>check(bad),/must not overlay enemy bodies/,'same check rejects the observed enemy-erasing overlay');
  console.log('PASS fire stays beneath enemy bodies in 16 headings; observed overlay variant rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
