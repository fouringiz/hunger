'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function buildPreview(){return `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Forager / planted feet study</title>
<style>:root{color-scheme:dark;font:16px system-ui;background:#141810;color:#ded8bf}*{box-sizing:border-box}body{margin:0;padding:20px}main{max-width:1000px;margin:auto}h1{font-size:20px;letter-spacing:.08em}p{color:#a5a58b}canvas{width:100%;height:auto;display:block;border:1px solid #444a35}nav{display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:15px 0}button,select{font:inherit;color:inherit;background:#303321;border:1px solid #65664a;padding:9px;min-height:44px}label{display:flex;gap:8px;align-items:center}output{font-size:13px;color:#a5a58b}.note{font-size:13px}a{color:#cfc694}</style>
<main><h1>FORAGER / PLANTED FEET</h1><p>Separate torso and articulated legs · one fixed view · review only</p>
<canvas id="study" width="960" height="480" aria-label="Forager with separately articulated legs gripping organic ground"></canvas>
<nav><button id="toggle">Pause</button><label>Travel <select id="speed"><option value="0">Stopped</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.7">1.7×</option></select></label>
<label>Size <select id="zoom"><option value="1" selected>Close-up</option><option value="0.24">Game-size sample</option></select></label><label><input id="debug" type="checkbox">Contact markers</label><output id="status">Loading parts…</output></nav>
<p class="note">Green feet are planted; amber feet are transferring. Pausing travel freezes the whole gait. Background scrolls with the following camera. This is a bitmap puppet study, not the game simulation. Ground here is a cached procedural backdrop.</p>
<a href="forager-study.html">Earlier painted motion study</a></main>
<script src="../../tools/lib/forager-puppet-study.js"></script><script>
'use strict';const rig=ForagerPuppetStudy,canvas=document.getElementById('study'),ctx=canvas.getContext('2d');
const toggle=document.getElementById('toggle'),speed=document.getElementById('speed'),zoom=document.getElementById('zoom'),debug=document.getElementById('debug'),status=document.getElementById('status');
const tile=document.createElement('canvas');tile.width=960;tile.height=480;rig.ground(tile.getContext('2d'),960,480);
const atlas=new Image();let loaded=false,playing=true,distance=0,last=performance.now();
atlas.onload=()=>{loaded=true;};atlas.onerror=()=>{status.textContent='Parts unavailable; rebuild the preview from the project checkout.';};atlas.src='../../assets/art/studies/forager-puppet-parts-v1.webp';
toggle.onclick=()=>{playing=!playing;toggle.textContent=playing?'Pause':'Play';};
function frame(now){const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
if(loaded){if(playing)distance+=dt*40*Number(speed.value);const z=Number(zoom.value);rig.drawGround(ctx,tile,distance,1);rig.draw(ctx,atlas,distance,{zoom:z,centerX:480,centerY:240,debug:debug.checked});status.textContent='Travel '+distance.toFixed(0)+' px · '+(playing&&Number(speed.value)>0?'crawling':'still');}
requestAnimationFrame(frame);}requestAnimationFrame(frame);
</script></html>`;}
if(require.main===module){const out=path.join(root,'reports/generated/forager-puppet-study.html');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,buildPreview());console.log(out);}
module.exports={buildPreview};
