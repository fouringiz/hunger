'use strict';
// Palette metrics over opaque pixels: mean HSV saturation, mean HSV value and the share of bright pixels (value > 0.8).
const OPAQUE=200,BRIGHT=.8;
function hsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return {s:mx?(mx-mn)/mx:0,v:mx/255};}
function paletteMetrics(data,width,rect=[0,0,width,data.length/4/width],step=1){
  const [x0,y0,w,h]=rect;let n=0,s=0,v=0,bright=0;
  for(let y=y0;y<y0+h;y+=step)for(let x=x0;x<x0+w;x+=step){
    const i=(y*width+x)*4;if(data[i+3]<OPAQUE)continue;
    const p=hsv(data[i],data[i+1],data[i+2]);n++;s+=p.s;v+=p.v;if(p.v>BRIGHT)bright++;
  }
  return n?{saturation:s/n,value:v/n,bright:bright/n,pixels:n}:{saturation:0,value:0,bright:0,pixels:0};
}
module.exports={paletteMetrics,hsv,OPAQUE,BRIGHT};
