'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function buildPreview(){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/art/studies/forager-source-layers-v1.json'),'utf8'));
  return `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Forager / approved reference</title>
<style>:root{color-scheme:dark;font:16px system-ui;background:#141510;color:#ded8bf}*{box-sizing:border-box}body{margin:0;padding:24px}main{max-width:1400px;margin:auto}h1,h2{font-size:20px;letter-spacing:.04em}p{color:#a9a58f;max-width:900px;line-height:1.5}.motion{display:block;width:min(100%,760px);height:auto;background:#1c1b12}section{margin:36px 0}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px}.comparison img,.comparison canvas{display:block;width:100%;height:auto;aspect-ratio:3/2;background:repeating-conic-gradient(#262820 0 25%,#1d2019 0 50%) 0/16px 16px}figcaption{margin:8px 0;color:#bbb59d}figure{margin:0}nav{display:flex;gap:18px;flex-wrap:wrap;margin:16px 0}label{display:flex;gap:7px;align-items:center;min-height:44px}output{font-size:14px;color:#b5b397}@media(max-width:800px){body{padding:12px}.comparison{grid-template-columns:1fr}}a{color:#c9c196}</style>
<main><h1>FORAGER / APPROVED VISUAL</h1>
<p>The articulated puppet was rejected: it changed the creature and lost its immersion in the mire. The approved motion remains the visual reference.</p>
<video class="motion" src="../../assets/art/previews/forager-sludge-cycle-v3.mp4" poster="../../assets/art/previews/forager-sludge-cycle-v3.gif" autoplay loop muted playsinline controls aria-label="Approved Forager crawling partly submerged in organic mire"></video>
<section><h2>SOURCE-LAYER ALIGNMENT / STILL FRAME</h2>
<p>These layers use pixels from the original image, with no regenerated creature or replacement ground. At rest, their complete assembly matches the source. This is a preliminary separation check; movement and hidden surfaces are not ready.</p>
<div class="comparison"><figure><img src="../../assets/art/references/forager-approved-v1.webp" alt="Original approved Forager anatomy and slime contact"><figcaption>Original reference</figcaption></figure>
<figure><canvas id="layers" width="1536" height="1024" aria-label="Source pixels reassembled from separate torso, leg and ground regions"></canvas><figcaption>Reassembled source layers</figcaption></figure></div>
<nav id="controls"></nav><output id="status">Loading source layers…</output>
<p>The front contact layer retains the source's occluding mud and slime. The masks are preliminary: animating them still requires clean hidden surfaces and more precise contact boundaries. This frame is not presented as a finished articulated walk.</p></section>
<a href="forager-study.html">Painted motion viewer</a></main>
<script>
'use strict';const manifest=${JSON.stringify(manifest)},canvas=document.getElementById('layers'),ctx=canvas.getContext('2d'),controls=document.getElementById('controls'),status=document.getElementById('status');
const labels={ground:'Ground',torso:'Torso',rearLeg:'Rear leg region',middleLeg:'Middle leg region',frontLeg:'Front leg region',foreground:'Front mud / contact'};
const enabled=manifest.parts.map(()=>true),atlas=new Image();let ready=false;
function draw(){if(!ready)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;manifest.parts.forEach((part,i)=>{if(enabled[i])ctx.drawImage(atlas,...part.atlas,...part.source);});status.textContent=enabled.every(Boolean)?'All source layers assembled · static alignment check':'Layer inspection · movement not implemented';}
manifest.parts.forEach((part,i)=>{const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;check.addEventListener('change',()=>{enabled[i]=check.checked;draw();});label.append(check,document.createTextNode(labels[part.name]));controls.append(label);});
atlas.onload=()=>{ready=true;draw();};atlas.onerror=()=>{status.textContent='Source layers unavailable. Rebuild this page from the project checkout.';};atlas.src='../../assets/art/studies/forager-source-layers-v1.webp';
</script></html>`;
}
if(require.main===module){const out=path.join(root,'reports/generated/forager-puppet-study.html');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,buildPreview());console.log(out);}
module.exports={buildPreview};
