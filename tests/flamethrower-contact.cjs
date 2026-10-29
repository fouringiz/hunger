'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
const html=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8');
async function boot(sourceHtml=html){
  const w=await loadWorld({sourceHtml,viewport:[960,540]});
  w.run("reset();S.credits=10000;build(SLOTS[2],'flamer');S.towers[0].level=3;S.towers[0].angle=0;S.towers[0].jetAt=0;S.time=.05;presentationTime=3.1;observeConstruction();S.enemies=[makeEnemy('carapacid',1)];S.enemies[0].d=420;S.enemies[0].x=S.towers[0].x+58;S.enemies[0].y=S.towers[0].y;");
  return w;
}
async function flow(w){
  w.run('presentationTime=1.01;');const a=JSON.parse(w.run('JSON.stringify(fuelFlowSamples(S.towers[0]))'));
  w.run('presentationTime=1.03;');const b=JSON.parse(w.run('JSON.stringify(fuelFlowSamples(S.towers[0]))'));
  assert.ok(a.filter((p,i)=>b[i].u>p.u+.05).length>=3,'liquid highlights must travel outward with presentation time');
  const sig=w.run('replaySignature()');w.run('fuelFlowSamples(S.towers[0]);prepareFuelContacts();');assert.equal(w.run('replaySignature()'),sig);
}
async function rim(w){
  const signature=w.run('replaySignature()');w.run('prepareFuelContacts();drawFuelContact(visualEnemy(S.enemies[0]));');assert.equal(w.run('replaySignature()'),signature,'body fuel rendering is read-only');
  const pixels=JSON.parse(w.run(`JSON.stringify((()=>{const m=fuelBodyMask.getContext('2d').getImageData(0,0,256,256).data,r=fuelBodyFilm.getContext('2d').getImageData(0,0,256,256).data;let core=0,covered=0,edge=0;for(let i=3;i<m.length;i+=4){if(m[i]>250){core++;if(r[i]>8)covered++;}if(m[i]<8&&r[i]>8)edge++;}return {core,covered,edge};})())`));
  assert.ok(pixels.core>100,'actual opaque body alpha exercised');
  assert.ok(pixels.edge>5,'fuel wraps outside actual sprite silhouette');
  assert.ok(pixels.covered/pixels.core<.01,'edge fuel must not paint over the opaque body core');
}
(async()=>{
  const w=await boot();await flow(w);
  for(let i=0;i<16;i++){
    w.run(`{const t=S.towers[0],e=S.enemies[0];t.angle=${i*Math.PI/8};e.x=t.x+Math.cos(t.angle)*58;e.y=t.y+Math.sin(t.angle)*58;}`);
    assert.equal(w.run('!!fuelContactFor(S.towers[0],S.enemies[0])'),true,'contact in heading '+i);
  }
  w.run("S.towers[0].angle=0;S.enemies[0].x=S.towers[0].x+58;S.enemies[0].y=S.towers[0].y+70;");assert.equal(w.run('fuelContactFor(S.towers[0],S.enemies[0])'),null,'misses cannot acquire a visual burn');
  w.run('S.enemies[0].y=S.towers[0].y;');
  for(const flag of ['paused','selling']){w.run(`S.towers[0].${flag}=true;prepareFuelContacts();`);assert.equal(w.run('fuelContactFrame.size'),0);w.run(`S.towers[0].${flag}=false;`);}
  w.run("S.towers[0].branch='B';prepareFuelContacts();");assert.equal(w.run('fuelContactFrame.size'),0,'Cryojet has no burning fuel coating');
  w.run("S.towers[0].branch='';S.time=.5;prepareFuelContacts();");assert.equal(w.run('fuelContactFrame.size'),0,'no invented burn after the jet expires');
  w.run('S.enemies[0].burnUntil=1;S.enemies[0].burnTower=S.towers[0];prepareFuelContacts();');assert.equal(w.run('fuelContactFrame.size'),1,'retained film follows authoritative burn');
  w.run('S.time=1.1;prepareFuelContacts();');assert.equal(w.run('fuelContactFrame.size'),0,'film stops when actual burn ends');
  const r=await boot();await rim(r);
  r.run("S.enemies=Array.from({length:40},(_,i)=>{const e=makeEnemy('forager',1);e.x=S.towers[0].x+48;e.y=S.towers[0].y;e.d=420+i;return e;});prepareFuelContacts();");assert.equal(r.run('fuelContactFrame.size'),r.run('FUEL_CONTACT_CAP'),'global presentation contact cap');assert.equal(r.run('FUEL_CONTACT_CAP'),8);
  r.run("S.enemies=Array.from({length:30},(_,i)=>{const e=makeEnemy('forager',1);const near=i>=20;e.x=S.towers[0].x+48;e.y=S.towers[0].y+(near?0:200);e.d=420+i;if(!near){e.burnUntil=S.time+1;e.burnTower=S.towers[0];}return e;});prepareFuelContacts();");
  assert.equal(r.run('[...fuelContactFrame.values()].every(c=>c.active!==false)'),true,'live jet contacts take cap slots before retained films');
  const frozen=html.replace('presentationTime*3.4','0');assert.notEqual(frozen,html);
  // Run the same checks against the two known bad appearances, not weaker alternate assertions.
  await assert.rejects(async()=>flow(await boot(frozen)),/must travel outward/);
  const blanket=html.replace("g.globalCompositeOperation='destination-out';g.drawImage(fuelBodyMask,0,0);","g.globalCompositeOperation='source-over';g.drawImage(fuelBodyMask,0,0);");assert.notEqual(blanket,html);
  await assert.rejects(async()=>rim(await boot(blanket)),/opaque body core/);
  console.log('PASS directional fuel flow, 16-heading contact, misses/inactive/Cryojet, real burn lifetime, 8-contact cap with live contacts first, actual sprite-alpha rim and frozen/blanket negatives');
})().catch(e=>{console.error(e);process.exitCode=1;});
