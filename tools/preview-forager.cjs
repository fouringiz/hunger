// Build a local art/motion review page. This does not load or alter the game simulation.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function buildPreview(){return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forager — living mire motion study</title>
<style>
:root{color-scheme:dark;font:16px system-ui,sans-serif;color:#d9d2bb;background:#151812}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px}
main{width:min(100%,860px)}h1{font-size:20px;letter-spacing:.08em;margin:0 0 6px}p{color:#a7a38e;margin:6px 0 18px}
canvas{display:block;width:100%;height:auto;max-height:72vh;object-fit:contain;background:#211e16;border:1px solid #494936}
nav{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px}button,select,a{font:inherit;color:#ded6bb}
button,select{background:#292b20;border:1px solid #61604a;padding:8px 14px;border-radius:4px;min-height:42px}
a{margin-left:auto}output{font-variant-numeric:tabular-nums;color:#a7a38e;font-size:13px}.note{font-size:12px;margin-top:18px}
</style></head><body><main>
<h1>FORAGER / LIVING MIRE</h1>
<p>One creature · fixed camera · dark peat-brown organic ground</p>
<canvas id="study" width="506" height="378" aria-label="Forager dragging its abdomen through living organic mud"></canvas>
<nav><button id="toggle" type="button">Pause</button>
<label>Speed <select id="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></label>
<output id="status">Loading…</output><a href="../../assets/art/previews/forager-sludge-cycle-v3.mp4">Open video</a></nav>
<p class="note">Eight drawn poses at eight frames per second. Motion and material study; game integration pending.</p>
</main><script>
'use strict';
const canvas=document.getElementById('study'),ctx=canvas.getContext('2d');
const status=document.getElementById('status'),toggle=document.getElementById('toggle'),speed=document.getElementById('speed');
const image=new Image();let ready=false,playing=true,phase=0,last=performance.now();
image.onload=()=>{ready=true;canvas.width=image.naturalWidth/2;canvas.height=image.naturalHeight/4;};
image.onerror=()=>{status.textContent='Preview unavailable.';};
image.src='../../assets/art/previews/forager-sludge-keyframes-v3.webp';
toggle.addEventListener('click',()=>{playing=!playing;toggle.textContent=playing?'Pause':'Play';});
function frame(now){
  const dt=Math.max(0,Math.min(.25,(now-last)/1000));last=now;
  if(ready){
    if(playing)phase=(phase+dt*8*Number(speed.value))%8;
    const i=Math.floor(phase),w=canvas.width,h=canvas.height;
    ctx.drawImage(image,(i%2)*w,Math.floor(i/2)*h,w,h,0,0,w,h);
    status.textContent='Frame '+(i+1)+' / 8';
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script></body></html>`;}
if(require.main===module){
  const out=path.join(root,'reports/generated/forager-study.html');
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,buildPreview());console.log(out);
}
module.exports={buildPreview};
