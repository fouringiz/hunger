'use strict';
// Offline normalization of one generated eight-pose sheet; no runtime dependency.
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require(process.env.FORAGER_CANVAS_MODULE||'@napi-rs/canvas');
const ROOT=path.join(__dirname,'..'),CELL=192,FRAMES=9,DIRECTIONS=16,BASE=130,DEPTH=.42;
async function extract(file,baselineMode=false){
  const source=await loadImage(path.join(ROOT,file));
  const scan=createCanvas(source.width,source.height),g=scan.getContext('2d');g.drawImage(source,0,0);
  const rgba=g.getImageData(0,0,source.width,source.height).data,W=source.width,H=source.height;
  const labels=new Int16Array(W*H),queue=new Int32Array(W*H),parts=[];let id=0;
  // Components, rather than a guessed grid, recover claw tips extending over nominal cell boundaries.
  for(let k=0;k<W*H;k++){
    if(labels[k]||rgba[k*4+3]<40)continue;
    id++;let head=0,tail=1;queue[0]=k;labels[k]=id;
    let left=W,right=0,top=H,bottom=0,count=0;
    while(head<tail){
      const p=queue[head++],x=p%W,y=Math.floor(p/W);count++;
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(const n of [x>0?p-1:-1,x<W-1?p+1:-1,y>0?p-W:-1,y<H-1?p+W:-1])if(n>=0&&!labels[n]&&rgba[n*4+3]>=40){labels[n]=id;queue[tail++]=n;}
    }
    if(count>6000)parts.push({id,left,right,top,bottom,count});
  }
  // The first pair touch at one slime strand. Split that connected pair at the measured gutter.
  const joined=parts.find(p=>p.right-p.left>W*.8);
  if(joined){
    parts.splice(parts.indexOf(joined),1);
    const ids=[joined.id,++id],boxes=ids.map(id=>({id,left:W,right:0,top:H,bottom:0,count:0}));
    for(let y=joined.top;y<=joined.bottom;y++)for(let x=joined.left;x<=joined.right;x++){
      const k=y*W+x;if(labels[k]!==joined.id)continue;
      const n=x<=530?0:1,p=boxes[n];labels[k]=p.id;p.left=Math.min(p.left,x);p.right=Math.max(p.right,x);p.top=Math.min(p.top,y);p.bottom=Math.max(p.bottom,y);p.count++;
    }
    parts.push(...boxes);
  }
  parts.sort((a,b)=>Math.round((a.top-b.top)/160)||a.left-b.left);
  if(parts.length!==8)throw new Error('Expected eight separated creature poses, got '+parts.length+' '+JSON.stringify(parts));
  const maxWidth=Math.max(...parts.map(p=>p.right-p.left+1)),scale=156/maxWidth;
  const normalized=[],contacts=[];
  for(const p of parts){
    const w=p.right-p.left+1,h=p.bottom-p.top+1,piece=createCanvas(w,h),c=piece.getContext('2d'),d=c.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const k=(p.top+y)*W+p.left+x;
      if(labels[k]!==p.id)continue;
      const at=(y*w+x)*4;d.data.set(rgba.subarray(k*4,k*4+4),at);
    }
    c.putImageData(d,0,0);
    // One scale for all poses. The underside of the abdomen, not the highest recovered hook,
    // sets the shared body anchor so a lifted claw cannot make the entire creature hop.
    const belly=[];
    for(let x=Math.floor(w*.2);x<Math.floor(w*.55);x++){
      let bottom=0;for(let y=0;y<h;y++)if(d.data[(y*w+x)*4+3]>64)bottom=y;
      belly.push(bottom);
    }
    belly.sort((a,b)=>a-b);const baseline=baselineMode?h*.9:belly[Math.floor(belly.length*.55)],cx=w*.5;
    const out=createCanvas(CELL,CELL),o=out.getContext('2d');o.imageSmoothingQuality='high';
    o.drawImage(piece,CELL/2-cx*scale,BASE-baseline*scale,w*scale,h*scale);normalized.push(out);
    const feet=[];
    for(const [a,b]of [[.3,.47],[.49,.71],[.75,.99]]){
      let fx=0,fy=0;
      for(let x=Math.floor(w*a);x<Math.floor(w*b);x++)for(let y=Math.floor(h*.4);y<h;y++)if(d.data[(y*w+x)*4+3]>90&&y>fy){fx=x;fy=y;}
      feet.push([+(96+(fx-cx)*scale).toFixed(3),+(BASE+(fy-baseline)*scale).toFixed(3)]);
    }
    contacts.push(feet);
  }
  return {normalized,contacts,parts};
}
function triangle(c,texture,src,dst){
  const [p,q,r]=src,[a,b,f]=dst,det=(q[0]-p[0])*(r[1]-p[1])-(r[0]-p[0])*(q[1]-p[1]);
  if(Math.abs(det)<1e-6)return;
  const A=((b[0]-a[0])*(r[1]-p[1])-(f[0]-a[0])*(q[1]-p[1]))/det;
  const C=((f[0]-a[0])*(q[0]-p[0])-(b[0]-a[0])*(r[0]-p[0]))/det;
  const B=((b[1]-a[1])*(r[1]-p[1])-(f[1]-a[1])*(q[1]-p[1]))/det;
  const D=((f[1]-a[1])*(q[0]-p[0])-(b[1]-a[1])*(r[0]-p[0]))/det;
  c.save();c.beginPath();const center=[(a[0]+b[0]+f[0])/3,(a[1]+b[1]+f[1])/3];
  const clip=dst.map(p=>{const dx=p[0]-center[0],dy=p[1]-center[1],n=Math.hypot(dx,dy)||1;return [p[0]+dx/n*.3,p[1]+dy/n*.3];});
  c.moveTo(...clip[0]);c.lineTo(...clip[1]);c.lineTo(...clip[2]);c.closePath();c.clip();
  c.transform(A,B,C,D,a[0]-A*p[0]-C*p[1],a[1]-B*p[0]-D*p[1]);c.drawImage(texture,0,0);c.restore();
}
async function bake(){
  const poses=await extract('assets/art/studies/forager-low-crawl-v2.png');
  const views=await extract('assets/art/studies/forager-low-crawl-directions-v2.png',true);
  const atlas=createCanvas(CELL*FRAMES,CELL*DIRECTIONS),a=atlas.getContext('2d'),contacts=[];
  const sheet=createCanvas(768,768),s=sheet.getContext('2d');s.fillStyle='#25291d';s.fillRect(0,0,768,768);
  for(let direction=0;direction<DIRECTIONS;direction++){
    const base=Math.round(direction/2)%8,delta=(direction-(Math.round(direction/2)) *2)*Math.PI/8;
    const ca=Math.cos(delta),sa=Math.sin(delta),A=ca,C=-.45*sa,B=DEPTH*sa,D=1+.45*DEPTH*(ca-1),heading=base*Math.PI/4;
    const row=[];
    for(let frame=0;frame<FRAMES;frame++){
      const authored=base===0||base===4,pose=frame===0?0:frame-1;
      const texture=authored?poses.normalized[pose]:views.normalized[base];
      const rawFeet=authored?poses.contacts[pose]:views.contacts[base];
      const phase=frame===0?0:(frame-1)/8*Math.PI*2;
      function point(x,y){
        if(base===4)x=CELL-x;
        if(!authored&&frame!==0){
          const low=Math.max(0,Math.min(1,(y-50)/135)),wave=Math.sin(phase+(x-96)*.035);
          x+=Math.cos(heading)*wave*3.5*low;
          y+=Math.sin(heading)*wave*2*low+Math.sin(phase+Math.PI*.4)*.8*(1-low);
        }
        const u=x-96,v=y-BASE;return [96+A*u+C*v,BASE+B*u+D*v];
      }
      const cell=createCanvas(CELL,CELL),c=cell.getContext('2d');
      for(let j=0;j<12;j++)for(let i=0;i<12;i++){
        const x=i*16,y=j*16,p=[[x,y],[x+16,y],[x+16,y+16],[x,y+16]],d=p.map(v=>point(...v));
        triangle(c,texture,[p[0],p[1],p[2]],[d[0],d[1],d[2]]);triangle(c,texture,[p[0],p[2],p[3]],[d[0],d[2],d[3]]);
      }
      row.push(rawFeet.map(p=>point(...p).map(v=>+v.toFixed(3))));
      a.drawImage(cell,frame*CELL,direction*CELL);
      if(direction%2===0&&frame===3){const k=direction/2;s.drawImage(cell,k%4*192,Math.floor(k/4)*384+30);s.fillStyle='#e8dcc0';s.font='15px sans-serif';s.fillText(direction*22.5+'°',k%4*192+8,Math.floor(k/4)*384+240);}
    }
    contacts.push(row);
  }
  fs.writeFileSync(path.join(ROOT,'assets/hunger-forager-mire-v2.webp'),await atlas.encode('webp',94));
  fs.writeFileSync(path.join(ROOT,'assets/art/studies/forager-low-crawl-v2.contacts.json'),JSON.stringify(contacts));
  fs.mkdirSync(path.join(ROOT,'reports/generated'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'reports/generated/forager-runtime-v2-directions.png'),sheet.toBuffer('image/png'));
  fs.writeFileSync(path.join(ROOT,'reports/generated/forager-runtime-v2-atlas.png'),atlas.toBuffer('image/png'));
  console.log('Packed eight authored side poses and eight volumetric heading masters into sixteen upright headings.');
}
if(require.main===module)bake().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={bake};
