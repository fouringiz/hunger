'use strict';
// A narrow mounting peg is an observable approved-design requirement. This does
// not establish full art fidelity: body, pistons, materials and yaw need review.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.join(__dirname,'..');
function narrowPeg(canvas,label){
 const p=canvas.getContext('2d').getImageData(0,0,256,256).data,points=[];
 for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(p[(y*256+x)*4+3]>=96)points.push([x,y]);
 assert.ok(points.length>1000,label+': missing upper assembly');
 const left=Math.min(...points.map(p=>p[0])),right=Math.max(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
 const band=Math.max(3,Math.round((bottom-top+1)*.04)),foot=points.filter(p=>p[1]>bottom-band);
 const width=Math.max(...foot.map(p=>p[0]))-Math.min(...foot.map(p=>p[0]))+1;
 assert.ok(width/(right-left+1)<=.22,`${label}: broad pedestal replaces narrow steel peg (${width}/${right-left+1})`);
}
(async()=>{
 const table=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/hunger-level4-towers-v2.frames.json'))),head=table.entries.find(e=>e.key==='howitzer');
 assert.equal(head.frames.length,16);const im=await loadImage(path.join(ROOT,'assets/hunger-level4-towers-v2.png'));
 for(const[i,f]of head.frames.entries()){const c=createCanvas(256,256);c.getContext('2d').drawImage(im,...f.rect,0,0,256,256);narrowPeg(c,'howitzer pose '+i);}
 // Pinned raster of the rejected d022ae3 Howitzer, cell 0. Tests never read Git.
 const bad=await loadImage(path.join(__dirname,'fixtures/howitzer-design/rejected-copper-pedestal-v1.png')),c=createCanvas(256,256);c.getContext('2d').drawImage(bad,0,0);
 assert.throws(()=>narrowPeg(c,'rejected Howitzer'),/broad pedestal/,'the real rejected pedestal must fail the same check');
 console.log('PASS Howitzer narrow mounting peg in 16 views; actual rejected copper pedestal detected. Full identity still requires visual review.');
})().catch(e=>{console.error(e);process.exitCode=1;});
