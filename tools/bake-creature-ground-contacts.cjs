'use strict';
// Derive contact/rim geometry OFFLINE. Runtime never reads canvas pixels (file:// safe).
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadImage,createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'..');
async function bake(){
 const tables={};
 for(const kind of ['carapacid','leech']){
  const name=kind==='carapacid'?'hunger-carapacid-shelter-v1':'hunger-leech-mire-v1',im=await loadImage(path.join(root,'assets',name+'.webp'));
  const c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
  const old=kind==='leech'?JSON.parse(fs.readFileSync(path.join(root,'assets',name+'.contacts.json'),'utf8')):null;
  const rows=[];
  for(let r=0;r<im.height/256;r++){
   const frames=[];
   for(let f=0;f<4;f++){
    const p=g.getImageData(f*256,r*256,256,256).data,rim=[];
    for(let x=4;x<252;x+=4){let y=207;while(y>4&&p[(y*256+x)*4+3]<128)y--;if(y>4)rim.push([x,y]);}
    let feet=[];
    if(kind==='carapacid'){
     // Side view: three visible supports. Front/rear: two leg tips on each side.
     const bands=r%2===0?[[20,88,120,207],[89,151,140,207],[152,235,120,207]]:[[20,95,105,163],[20,95,164,207],[160,235,105,163],[160,235,164,207]];
     feet=bands.map(([a,b,t,z])=>{let best=null;for(let y=t;y<=z;y++)for(let x=a;x<=b;x++)if(p[(y*256+x)*4+3]>=160&&(!best||y>best[1]))best=[x,y];assert.ok(best,'visible foot in band');return best;});
    }
    frames.push({rim,feet,belly:old?old.rows[r][f].belly:[]});
   }
   rows.push(frames);
  }
  const table={cell:256,anchor:[128,208],frames:4,directions:rows.length,rows};tables[kind]=table;
  fs.writeFileSync(path.join(root,'assets',name+'.ground-contacts.json'),JSON.stringify(table)+'\n');
 }
 const html=path.join(root,'prototype/index.html'),s=fs.readFileSync(html,'utf8');
 const declaration='const CREATURE_MIRE_CONTACTS='+JSON.stringify(tables)+';';
 assert.ok(/const CREATURE_MIRE_CONTACTS=[^\n]*;/.test(s),'runtime contact marker');
 fs.writeFileSync(html,s.replace(/const CREATURE_MIRE_CONTACTS=[^\n]*;/,declaration));
 console.log('Baked creature ground-contact tables and synchronized runtime embedding.');
}
if(require.main===module)bake().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={bake};
