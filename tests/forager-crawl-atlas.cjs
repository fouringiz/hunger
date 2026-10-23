const fs=require('node:fs'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(process.env.FORAGER_CANVAS_MODULE||'@napi-rs/canvas');
(async()=>{const im=await loadImage(require('node:path').join(__dirname,'../assets/hunger-forager-mire-v2.webp'));assert.equal(im.width,192*9);assert.equal(im.height,192*16);
const c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
for(let d=0;d<16;d++)for(let f=0;f<9;f++){const a=g.getImageData(f*192,d*192,192,192).data;let l=192,r=0,t=192,b=0,area=0,red=0,bone=0;for(let y=0;y<192;y++)for(let x=0;x<192;x++){const k=(y*192+x)*4;if(a[k+3]<128)continue;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);area++;if(a[k]>a[k+1]*1.25&&a[k]>a[k+2]*1.05)red++;if(a[k]>160&&a[k+1]>120&&a[k+2]>80)bone++;}assert.ok(l>0&&r<191&&t>0&&b<191,'no clipped silhouette at '+d+','+f);assert.ok(red>area*.15&&bone>area*.06,'maroon flesh and ivory bone remain visible at '+d+','+f);if([4,12].includes(d))assert.ok((r-l)/(b-t)>.45,'front/back body retains volume');}
console.log('PASS all 144 cells: clear margins, maroon/ivory visibility, volumetric north/south views.');})();
