/* Review-only bitmap puppet. No game imports, state writes or combat hooks. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ForagerPuppetStudy=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STRIDE=65,STANCE=.68,ORIGIN=330,BASE_Y=205;
  const PARTS={
    body:{rect:[8,90,710,408]},
    upper:{rect:[700,164,410,273],a:[65,111],b:[344,188]},
    lower:{rect:[1113,185,417,319],a:[77,107],b:[376,300]},
    farUpper:{rect:[58,606,488,283],a:[100,128],b:[414,183]},
    farLower:{rect:[552,608,470,359],a:[92,109],b:[426,326]},
    slime:{rect:[1040,736,481,141]}
  };
  const LEGS=[
    {hip:-88,hy:9,fy:74,phase:.52,far:true,bend:1},
    {hip:-10,hy:15,fy:68,phase:.18,far:true,bend:1},
    {hip:66,hy:20,fy:65,phase:.85,far:true,bend:-1},
    {hip:-80,hy:39,fy:118,phase:.02,far:false,bend:1},
    {hip:0,hy:48,fy:123,phase:.69,far:false,bend:1},
    {hip:79,hy:42,fy:114,phase:.35,far:false,bend:-1}
  ];
  const smooth=x=>x*x*(3-2*x);
  function solveKnee(hip,foot,l1,l2,bend){
    const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.hypot(dx,dy)||1;
    const reach=Math.min(d,l1+l2-.001),along=(l1*l1-l2*l2+reach*reach)/(2*reach);
    const across=Math.sqrt(Math.max(0,l1*l1-along*along));
    return {x:hip.x+dx/d*along-dy/d*across*bend,y:hip.y+dy/d*along+dx/d*across*bend};
  }
  // Distance is supplied by the viewer. A stopped body cannot advance its gait.
  function pose(distance){
    const wave=distance/STRIDE*Math.PI*2;
    const body={x:ORIGIN+distance,y:BASE_Y,sx:1+.012*Math.sin(wave),sy:1-.008*Math.sin(wave)};
    const legs=LEGS.map((spec,id)=>{
      const cycle=distance/STRIDE+spec.phase,n=Math.floor(cycle),phase=cycle-n;
      const planted=phase<STANCE;
      const start=ORIGIN+spec.hip+STRIDE*(n-spec.phase)+19;
      const swing=planted?0:(phase-STANCE)/(1-STANCE);
      const foot={x:start+(planted?0:STRIDE*smooth(swing)),y:BASE_Y+spec.fy-(planted?0:15*Math.sin(Math.PI*swing))};
      const hip={x:body.x+spec.hip*body.sx,y:BASE_Y+spec.hy};
      const knee=solveKnee(hip,foot,53,72,spec.bend);
      return {id,far:spec.far,phase,planted,foot,hip,knee,groundY:BASE_Y+spec.fy};
    });
    return {distance,body,legs};
  }
  function piece(ctx,atlas,key,start,end){
    const p=PARTS[key],r=p.rect,dx=p.b[0]-p.a[0],dy=p.b[1]-p.a[1];
    const scale=Math.hypot(end.x-start.x,end.y-start.y)/Math.hypot(dx,dy);
    ctx.save();ctx.translate(start.x,start.y);
    ctx.rotate(Math.atan2(end.y-start.y,end.x-start.x)-Math.atan2(dy,dx));
    ctx.scale(scale,scale);ctx.drawImage(atlas,...r,-p.a[0],-p.a[1],r[2],r[3]);ctx.restore();
  }
  function leg(ctx,atlas,l){
    piece(ctx,atlas,l.far?'farUpper':'upper',l.hip,l.knee);
    piece(ctx,atlas,l.far?'farLower':'lower',l.knee,l.foot);
  }
  function contact(ctx,atlas,l){
    const r=PARTS.slime.rect;
    ctx.save();ctx.globalAlpha=l.planted?.65:.25;
    ctx.drawImage(atlas,...r,l.foot.x-17,l.groundY-4,34,10);
    if(!l.planted){
      ctx.strokeStyle='rgba(124,111,41,.48)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(l.foot.x,l.groundY);ctx.quadraticCurveTo(l.foot.x-4,l.foot.y+7,l.foot.x,l.foot.y);ctx.stroke();
    }
    ctx.restore();
  }
  function draw(ctx,atlas,distance,options={}){
    const p=pose(distance),zoom=options.zoom||1,centerX=options.centerX||440,centerY=options.centerY||240;
    ctx.save();ctx.translate(centerX,centerY);ctx.scale(zoom,zoom);ctx.translate(-p.body.x,-BASE_Y-33);
    // Contact stain is a translucent local layer, never a hard hovering shadow.
    ctx.fillStyle='rgba(56,43,16,.45)';ctx.beginPath();ctx.ellipse(p.body.x,BASE_Y+83,171,20,0,0,Math.PI*2);ctx.fill();
    for(const l of p.legs)if(l.far){contact(ctx,atlas,l);leg(ctx,atlas,l);}
    const r=PARTS.body.rect;
    ctx.save();ctx.translate(p.body.x,BASE_Y);ctx.scale(p.body.sx,p.body.sy);
    // Isolate the torso from a neighbouring part in the generated parts sheet.
    // Keep the forward mandible tip below the seam; exclude the upper-leg sliver.
    ctx.beginPath();ctx.moveTo(-183,-100);ctx.lineTo(172,-100);ctx.lineTo(172,31);
    ctx.lineTo(183,55);ctx.lineTo(183,110);ctx.lineTo(-183,110);ctx.closePath();ctx.clip();
    ctx.drawImage(atlas,...r,-183,-100,366,210);ctx.restore();
    for(const l of p.legs)if(!l.far){leg(ctx,atlas,l);contact(ctx,atlas,l);}
    // Thin oily contact folds overlap the lower feet; no per-creature filters.
    ctx.strokeStyle='rgba(60,52,23,.65)';ctx.lineWidth=3;
    for(const l of p.legs)if(l.planted){ctx.beginPath();ctx.moveTo(l.foot.x-6,l.foot.y+1);ctx.quadraticCurveTo(l.foot.x,l.foot.y-2,l.foot.x+6,l.foot.y+1);ctx.stroke();}
    if(options.debug){
      ctx.lineWidth=1.2;
      for(const l of p.legs){
        ctx.strokeStyle=l.planted?'#89d69c':'#dba75e';ctx.fillStyle=ctx.strokeStyle;
        ctx.beginPath();ctx.moveTo(l.hip.x,l.hip.y);ctx.lineTo(l.knee.x,l.knee.y);ctx.lineTo(l.foot.x,l.foot.y);ctx.stroke();
        ctx.beginPath();ctx.arc(l.foot.x,l.foot.y,3.3,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();return p;
  }
  function ground(ctx,w,h){
    let seed=61423;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    ctx.fillStyle='#1b1e15';ctx.fillRect(0,0,w,h);ctx.globalAlpha=.32;
    for(let i=0;i<14000;i++){
      const x=rand()*w,y=rand()*h,r=1+rand()*6;
      ctx.fillStyle=['#181b13','#292b1c','#363321','#131811','#23271a'][Math.floor(rand()*5)];
      ctx.beginPath();ctx.ellipse(x,y,r*1.6,r*.65,rand(),0,Math.PI*2);ctx.fill();
      if(i%7===0){ctx.fillStyle='rgba(139,132,69,.12)';ctx.fillRect(x,y,r*.8,.7);}
    }
    ctx.globalAlpha=1;
    for(let i=0;i<85;i++){
      const x=rand()*w,y=rand()*h;ctx.strokeStyle=i%3?'rgba(64,53,30,.65)':'rgba(82,66,35,.5)';ctx.lineWidth=1+rand()*4;
      ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+rand()*90,y-25,x-50,y+40,x+rand()*120,y+55);ctx.stroke();
    }
    for(let i=0;i<90;i++){
      const x=rand()*w,y=rand()*h,r=8+rand()*18;
      const sheen=ctx.createRadialGradient(x,y,0,x,y,r);
      sheen.addColorStop(0,'rgba(119,106,49,.11)');sheen.addColorStop(1,'rgba(65,63,26,0)');
      ctx.fillStyle=sheen;ctx.beginPath();ctx.ellipse(x,y,r,r*.35,0,0,Math.PI*2);ctx.fill();
    }
  }
  function drawGround(ctx,tile,distance,zoom=1){
    // Camera follows the creature; ground translates by exactly its world travel.
    const width=tile.width*zoom,height=tile.height*zoom,shift=((distance*zoom)%width+width)%width;
    for(let x=-shift-width;x<ctx.canvas.width;x+=width)ctx.drawImage(tile,x,0,width,height);
  }
  return {STRIDE,STANCE,PARTS,pose,solveKnee,draw,ground,drawGround};
});
