'use strict';
const assert=require('node:assert/strict');
const {createCanvas}=require(process.env.WORLD_CANVAS_MODULE||'@napi-rs/canvas');
const {loadWorld}=require('../tools/capture-organic-world.cjs');
function inspectApproach(scene,{path=null,exitD=null}={}){
  const {run}=scene;
  const box=JSON.parse(run('JSON.stringify(GATE_ART_BOX)'));
  const c=createCanvas(1080,540),g=c.getContext('2d');
  for(const side of ['rear','front'])g.drawImage(run('gateStone().'+side),box.x,box.y,box.width,box.height);
  const data=g.getImageData(0,0,c.width,c.height).data;
  // Warm/neutral opaque masonry in the actual upright layers. Cyan vortex and the
  // separately rendered horizontal floor are traversable; no sampled endpoint can hide an upstream wall.
  const stone=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=c.width||y>=c.height)return false;const k=(y*c.width+x)*4;return data[k+3]>=192&&data[k+2]<data[k]*1.10&&data[k+2]<data[k+1]*1.10;};
  const points=path||JSON.parse(run('JSON.stringify(PATH)'));
  const limit=exitD===null?run('GATE_D'):exitD;
  const seg=[];let total=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);seg.push({a,b,length,start:total});total+=length;}
  const hits=[];
  for(const s of seg){
    const nx=-(s.b[1]-s.a[1])/s.length,ny=(s.b[0]-s.a[0])/s.length;
    for(let along=0;along<=s.length&&s.start+along<=limit;along+=2){
      const t=along/s.length,x=s.a[0]+(s.b[0]-s.a[0])*t,y=s.a[1]+(s.b[1]-s.a[1])*t;
      if(x<box.x-36||y<box.y-36)continue;
      for(let offset=-33;offset<=33;offset+=2){
        const px=x+nx*offset,py=y+ny*offset;let covered=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(stone(px+dx,py+dy))covered++;
        if(covered>=7)hits.push({x:+px.toFixed(1),y:+py.toFixed(1),d:+(s.start+along).toFixed(1),offset});
      }
    }
  }
  return {hits,canvas:c};
}
async function main(){
  const scene=await loadWorld();const result=inspectApproach(scene);
  assert.equal(result.hits.length,0,'upright Gate masonry intersects the full-width incoming channel: '+JSON.stringify(result.hits.slice(0,8)));
  console.log('PASS unobstructed full-width channel through the complete Gate approach');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={inspectApproach};
