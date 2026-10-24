'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../prototype/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const baseline=require('../reports/portal-teleport/baseline.json');
// Shelter movement was explicitly authorized after this visual baseline. Keep its geometry checks.
Object.assign(baseline,require('../reports/carapacid-shelter/simulation-baseline.json'));
function boot(){
 const voices=[];
 class Audio{constructor(){this.state='running';this.currentTime=0;this.destination={};}createOscillator(){const v={frequency:{setValueAtTime(n){v.startPitch=n;},exponentialRampToValueAtTime(n){v.endPitch=n;}},connect(){},disconnect(){},start(){},stop(){}};voices.push(v);return v;}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}}
 const fills=[],stack=[],drawing={globalAlpha:1,fillStyle:'',save(){stack.push({globalAlpha:this.globalAlpha,fillStyle:this.fillStyle});},restore(){Object.assign(this,stack.pop());},fill(){fills.push({alpha:this.globalAlpha,color:this.fillStyle});}};
 const ctx=new Proxy(drawing,{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 const canvas={getContext:()=>ctx,style:{},addEventListener(){}};
 const c=vm.createContext({document:{getElementById:()=>canvas,createElement:()=>canvas},window:{devicePixelRatio:1,AudioContext:Audio},location:{pathname:'/prototype/index.html',search:''},URLSearchParams,structuredClone,innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert,baseline});
 vm.runInContext(src,c);return {run:s=>vm.runInContext(s,c),voices,fills};
}
const a=boot();a.run(`
 assert.equal(replayRulesFingerprint(),baseline.rules,'all map/balance rules stay exact');
 assert.equal(replaySourceFingerprint(),baseline.source,'combat, update, reset and leak function sources stay byte-identical');
 assert.equal(JSON.stringify(PATH),JSON.stringify(baseline.path));assert.equal(GATE_D,baseline.gateD);
 assert.equal(JSON.stringify(GATE),JSON.stringify(baseline.gate));assert.equal(JSON.stringify(SLOTS.map(s=>[s.x,s.y])),JSON.stringify(baseline.slots));
 assert.ok(GATE_D-PORTAL_ENTRY_D>=15&&GATE_D-PORTAL_ENTRY_D<=20);
 reset();const e=makeEnemy('forager',1);e.state='lane';e.d=GATE_D-70;Object.assign(e,posAt(e.d));S.enemies=[e];
 const raw=d=>{const p=posAt(d+4),q=posAt(d);return Math.atan2(p.y-q.y,p.x-q.x);};
 assert.equal(enemyHeading(e),raw(e.d));const held=raw(GATE_D-PORTAL_APPROACH);
 for(const d of [GATE_D-59,GATE_D-30,PORTAL_ENTRY_D-.001]){e.d=d;Object.assign(e,posAt(d));observePortalEntries();assert.equal(portalBodyOpacity(e),1);assert.equal(enemyHeading(e),held);assert.equal(portalEntries.length,0);}
 presentationTime+=100;observePortalEntries();assert.equal(portalEntries.length,0,'time alone never starts a teleport');
 e.d=PORTAL_ENTRY_D;Object.assign(e,posAt(e.d));const body=JSON.stringify(e),state=replaySignature();observePortalEntries();
 assert.equal(portalEntries.length,1,'exact threshold creates an event');assert.equal(JSON.stringify(e),body);assert.equal(replaySignature(),state,'observer never mutates simulation');
 const event=portalEntryOf(e);assert.equal(event.d,PORTAL_ENTRY_D);assert.equal(portalBodyOpacity(e),1,'no dissolve at the threshold');
 for(let i=0;i<4;i++)observePortalEntries();assert.equal(portalSequence,1,'no duplicate per body');
 presentationTime=event.at+PORTAL_TELEPORT.stretch;const stretch=portalEntryState(event);assert.equal(stretch.alpha,1);assert.ok(stretch.length>=3&&stretch.length<=4);assert.ok(stretch.width<.3);
 presentationTime=event.at+PORTAL_TELEPORT.peak;assert.equal(portalBodyOpacity(e),0,'hard disappearance at the flash peak');assert.ok(Math.abs(portalEntryState(event).flash-1)<1e-9);
 presentationTime+=.1;assert.ok(portalEntryState(event).trail>0&&portalEntryState(event).trail<1);
 presentationTime=event.at+PORTAL_TELEPORT.peak+PORTAL_TELEPORT.trail+.01;observePortalEntries();assert.equal(portalEntries.length,0);observePortalEntries();assert.equal(portalSequence,1,'expired effects cannot restart for the same body');
 reset();observePortalEntries();assert.equal(portalSequence,0,'new scene clears presentation state');
`);
console.log('PASS opaque approach, held heading, path threshold, one-shot event, 3.8x stretch and hard flash removal');
const rendered=boot();rendered.run("reset();const body=makeEnemy('forager',1);body.d=GATE_D-30;Object.assign(body,posAt(body.d));enemyArt(body);");
const bodyColor=rendered.run('body.T.color');assert.ok(rendered.fills.some(f=>f.color===bodyColor));assert.ok(rendered.fills.filter(f=>f.color===bodyColor).every(f=>f.alpha===1),'actual renderer must not fade approaching bodies');
for(const alreadyStarted of [false,true]){
 const killed=boot();killed.run(`reset();const body=makeEnemy('forager',1);body.d=PORTAL_ENTRY_D-${alreadyStarted?0:1};S.enemies=[body];observePortalEntries();body.d=PORTAL_ENTRY_D+1;damage(body,body.hp+1,null);S.enemies=S.enemies.filter(e=>!e.dead);presentationTime+=.05;observePortalEntries();assert.equal(S.kills,1);assert.equal(S.waveLeaked,0);assert.equal(portalEntries.length,0,'combat death before the gate cancels or prevents teleport');assert.equal(portalSequence,${alreadyStarted?1:0});`);
}
console.log('PASS actual rendered approach opacity and pre-gate combat-death exclusions');
const fast=boot(),control=boot();
for(const r of [fast,control])r.run("reset();S.phase='wave';S.wave=1;S.spawnQueue=[];const e=makeEnemy('forager',1);e.d=PORTAL_ENTRY_D-1;e.dash=1;Object.assign(e,posAt(e.d));S.enemies=[e];");
fast.run('observePortalEntries();');
for(let i=0;i<16;i++){fast.run('update(SIM_STEP);presentationTime+=SIM_STEP;observePortalEntries();');control.run('update(SIM_STEP);presentationTime+=SIM_STEP;');}
assert.equal(fast.run('replaySignature()'),control.run('replaySignature()'));
fast.run(`assert.equal(S.enemies.length,0);assert.equal(S.gate,GATE_MAX-1);assert.equal(S.waveLeaked,1);assert.equal(portalEntries.length,1);assert.equal(portalEntryState(portalEntries[0]).alpha,1,'frozen body still stretches after fast enemy leaks');`);
const skip=boot();skip.run(`reset();S.phase='wave';S.wave=1;const e=makeEnemy('forager',1);e.d=PORTAL_ENTRY_D-1;e.speed=2000;Object.assign(e,posAt(e.d));S.enemies=[e];observePortalEntries();update(SIM_STEP);presentationTime+=SIM_STEP;assert.equal(S.enemies.length,0);observePortalEntries();assert.equal(portalEntries.length,1,'retained reference catches a crossing removed between render frames');assert.equal(portalEntries[0].d,PORTAL_ENTRY_D);`);
console.log('PASS effect survives removal, skipped render crossing is observed, exact leak timing/damage and combat parity');
const many=boot();many.run(`reset();audioGesture();S.enemies=Array.from({length:3},(_,seq)=>{const e=makeEnemy('forager',1);e.seq=seq;e.d=PORTAL_ENTRY_D;Object.assign(e,posAt(e.d));return e;});observePortalEntries();assert.equal(portalEntries.length,3);assert.equal(new Set(portalEntries.map(e=>e.id)).size,3);observePortalEntries();assert.equal(portalSequence,3);`);
assert.equal(many.voices.length,3);assert.ok(many.voices.every(v=>v.startPitch===240&&v.endPitch===2400));
many.run("soundEnabled=false;const muted=makeEnemy('leech',1);muted.d=PORTAL_ENTRY_D;S.enemies.push(muted);observePortalEntries();");assert.equal(many.voices.length,3);
for(const state of ['seek','attached','return']){const r=boot();r.run(`reset();const e=makeEnemy('leech',1);e.state='${state}';e.d=GATE_D-2;S.enemies=[e];observePortalEntries();assert.equal(portalEntries.length,0);assert.equal(portalBodyOpacity(e),1);`);}
console.log('PASS three independent entries/warp voices, sound mute and off-lane exclusions');
