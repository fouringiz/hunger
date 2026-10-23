// Preview the exact renderer used by the game, rather than a separate motion mockup.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function buildPreview(){
 const source=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8');
 const start=source.indexOf('const FORAGER_MIRE='),end=source.indexOf('const GROUND_ACTOR_RECTS',start);
 if(start<0||end<0)throw new Error('Forager runtime renderer is missing.');
 const renderer=source.slice(start,end);
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Forager / in-game crawl</title><style>:root{color-scheme:dark;font:16px system-ui;background:#141710;color:#ddd8be}*{box-sizing:border-box}body{margin:0;padding:20px}main{max-width:1100px;margin:auto}h1{font-size:20px;letter-spacing:.05em}p{color:#aaa78e;line-height:1.5}canvas{display:block;width:100%;height:auto;background:#23281a;border:1px solid #4b5036}nav{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:16px 0}button,select,a{font:inherit;color:#e1d9b7}button,select{background:#30351f;border:1px solid #696b46;min-height:44px;padding:9px}label{display:flex;align-items:center;gap:8px}output{font-size:13px;color:#b4b196}details img{display:block;max-width:100%;height:auto}details{margin:24px 0}</style>
<main><h1>FORAGER / IN-GAME CRAWL</h1><p>The game renderer, enlarged for inspection. Original creature pixels, separately moving legs and wet contact tissue.</p>
<canvas id="study" width="960" height="480" aria-label="The implemented Forager crawl on organic ground"></canvas>
<nav><button id="toggle">Pause</button><label>Speed<select id="speed"><option value="0">Stopped</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.7">1.7×</option></select></label><label>View<select id="angle"><option value="auto">Turning</option>${Array.from({length:16},(_,i)=>'<option value="'+i*Math.PI/8+'"'+(i===0?' selected':'')+'>'+i*22.5+'°</option>').join('')}</select></label><label>Size<select id="zoom"><option value="1">Game size</option><option value="5" selected>5× inspection</option><option value="8">8× inspection</option></select></label><output id="status">Loading…</output></nav>
<p><a href="../../prototype/index.html">Play the actual game</a> · <a href="forager-study.html">Earlier painted motion reference</a></p>
<details><summary>Approved original anatomy</summary><img src="../../assets/art/references/enemies/forager/forager-approved-v1.webp" alt="Unchanged original creature anatomy and material reference"></details>
<p>Sixteen projected views reuse the original surface texture; unseen anatomy is approximated by projection, not a new 3D model. The other castes retain their existing art.</p></main><script>
'use strict';const canvas=document.getElementById('study'),ctx=canvas.getContext('2d'),S={};
const foragerMireArt=new Image(),soil=new Image(),toggle=document.getElementById('toggle'),speed=document.getElementById('speed'),angle=document.getElementById('angle'),zoom=document.getElementById('zoom'),status=document.getElementById('status');
${renderer}
const e={type:'forager',state:'lane',x:0,y:0,d:0};let playing=true,last=performance.now(),pattern=null;
soil.onload=()=>{pattern=ctx.createPattern(soil,'repeat');};soil.src='../../assets/hunger-mire-ground-v1.webp';
foragerMireArt.onerror=()=>{status.textContent='Atlas unavailable. Rebuild art before previewing.';};foragerMireArt.src='../../assets/hunger-forager-mire-v1.webp';
toggle.onclick=()=>{playing=!playing;toggle.textContent=playing?'Pause':'Play';};angle.onchange=()=>{foragerMireMotion=new WeakMap();};
function frame(now){const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(foragerMireReady()){
 const heading=angle.value==='auto'?e.d/95:Number(angle.value);
 if(playing){const travel=dt*52*Number(speed.value);e.d+=travel;e.x+=travel*Math.cos(heading);e.y+=travel*Math.sin(heading);}
 const z=Number(zoom.value);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#272b1b';ctx.fillRect(0,0,960,480);
 if(pattern){ctx.save();ctx.scale(z,z);ctx.translate(-e.x,-e.y);ctx.fillStyle=pattern;ctx.fillRect(e.x,e.y,960/z,480/z);ctx.restore();}
 ctx.save();ctx.translate(480,280);ctx.scale(z,z);foragerMireSprite(e,heading);ctx.restore();
 status.textContent='Game renderer · '+(playing&&Number(speed.value)>0?'crawling':'stopped');}
 requestAnimationFrame(frame);}requestAnimationFrame(frame);
</script></html>`;
}
if(require.main===module){const out=path.join(root,'reports/generated/forager-puppet-study.html');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,buildPreview());console.log(out);}
module.exports={buildPreview};
