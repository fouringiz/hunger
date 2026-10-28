'use strict';
// Isolated art study. No game/simulation imports. Coordinates are source-texture UVs.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PolypMotion=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const TAU=Math.PI*2;
 const config={duration:5.2,aspect:1.5,stride:[-.065,.014],duty:.66,
  contacts:[{p:[.174,.874],phase:0,r:.095,lift:.025},{p:[.390,.918],phase:.51,r:.085,lift:.020},{p:[.810,.970],phase:.25,r:.110,lift:.032},{p:[.873,.758],phase:.75,r:.075,lift:.025}],
  plates:[{center:[.660,.235],polygon:[[.534,.047],[.650,.059],[.737,.165],[.785,.302],[.756,.418],[.691,.359],[.608,.274],[.566,.151]],feather:.050},
   {center:[.489,.720],polygon:[[.453,.604],[.544,.646],[.550,.738],[.518,.843],[.462,.843],[.411,.751],[.430,.660]],feather:.040}]};
 const fract=x=>x-Math.floor(x),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
 const pulse=(phase,offset)=>(1-Math.cos(TAU*(phase-offset)))/2;
 const gaussian=(x,y,cx,cy,rx,ry)=>Math.exp(-.5*(((x-cx)/rx)**2+((y-cy)/ry)**2));
 function raw(x,y,t,amount=1){
  const a=pulse(t,.08),b=pulse(t,.52),c=pulse(t,.76),s=Math.sin(TAU*t);
  const front=gaussian(x,y,.275,.665,.17,.18),side=gaussian(x,y,.715,.61,.18,.18),back=gaussian(x,y,.43,.29,.20,.19);
  // Amplitudes move different tissue regions; no whole-body translation or scale.
  return [x+amount*(-.074*a*front+.047*b*side-.020*c*back+.009*s*gaussian(x,y,.54,.48,.25,.22)),
   y+amount*(.048*a*front-.025*b*side-.031*c*back+.008*Math.sin(TAU*(t+.27))*gaussian(x,y,.52,.70,.22,.13))];
 }
 function contactState(index,t,amount=1){
  const c=config.contacts[index],p=fract(t+c.phase),d=config.duty,v=config.stride;
  let k,lift=0;
  if(p<d)k=d/2-p;
  else{const u=(p-d)/(1-d),u2=u*u,u3=u2*u;
   // Hermite recovery: position and derivative match the linear stance at both ends.
   k=(2*u3-3*u2+1)*(-d/2)+(u3-2*u2+u)*(-(1-d))+(-2*u3+3*u2)*(d/2)+(u3-u2)*(-(1-d));
   lift=c.lift*Math.sin(Math.PI*u)**2;
  }
  return {p:[c.p[0]+amount*v[0]*k,c.p[1]+amount*(v[1]*k-lift)],stance:p<d,phase:p};
 }
 function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],u=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy);}
 function plateWeight(x,y,plate){let inside=false,d=Infinity;const p=plate.polygon;
  for(let i=0,j=p.length-1;i<p.length;j=i++){
   if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;
   d=Math.min(d,segmentDistance(x,y,p[j],p[i]));
  }return inside?1:1-smooth(d/plate.feather);
 }
 function bindPoint(x,y){const plate=config.plates.map(p=>plateWeight(x,y,p));
  return {x,y,plate,contacts:config.contacts.map(c=>1-smooth((Math.hypot(x-c.p[0],y-c.p[1])-.012)/(c.r-.012)))};
 }
 function prepare(t,amount=1){
  t=fract(t);return {t,amount,contacts:config.contacts.map((_,i)=>contactState(i,t,amount)),plates:config.plates.map((p,i)=>{
   const center=raw(...p.center,t,amount),angle=amount*.034*Math.sin(TAU*(t+i*.32));return {center,cos:Math.cos(angle),sin:Math.sin(angle)};
  })};
 }
 function deformBound(q,state){
  const {t,amount}=state;let [x,y]=raw(q.x,q.y,t,amount);let rigid=0;
  for(let i=0;i<config.plates.length;i++){
   const w=q.plate[i];if(w<=0)continue;
   const p=config.plates[i],s=state.plates[i],dx=q.x-p.center[0],dy=q.y-p.center[1];
   x=x*(1-w)+(s.center[0]+s.cos*dx-s.sin*dy/config.aspect)*w;y=y*(1-w)+(s.center[1]+s.sin*dx*config.aspect+s.cos*dy)*w;rigid=Math.max(rigid,w);
  }
  // Contact corrections use the same deformation as their anchors. Exact at the marked tip.
  let sum=0,dx=0,dy=0;
  for(let i=0;i<config.contacts.length;i++){
   const w=q.contacts[i]*(1-rigid);if(w<=0)continue;
   const c=config.contacts[i],r=raw(...c.p,t,amount),target=state.contacts[i].p;
   dx+=(target[0]-r[0])*w;dy+=(target[1]-r[1])*w;sum+=w;
  }
  const divisor=Math.max(1,sum);return [x+dx/divisor,y+dy/divisor];
 }
 function deform(x,y,t,amount=1){return deformBound(bindPoint(x,y),prepare(t,amount));}
 function mesh(columns=72,rows=48){const points=[],indices=[];
  // Put every authored contact ON a mesh vertex: the visible texture anchor must obey the same constraint as its marker.
  const xs=[...new Set([...Array.from({length:columns+1},(_,i)=>i/columns),...config.contacts.map(c=>c.p[0])])].sort((a,b)=>a-b);
  const ys=[...new Set([...Array.from({length:rows+1},(_,i)=>i/rows),...config.contacts.map(c=>c.p[1])])].sort((a,b)=>a-b);
  columns=xs.length-1;rows=ys.length-1;
  for(const y of ys)for(const x of xs)points.push(bindPoint(x,y));
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+1,c=a+columns+1,d=c+1;indices.push(a,b,c,b,d,c);}
  return {points,indices:new Uint16Array(indices),columns,rows};
 }
 return {config,fract,pulse,raw,bindPoint,prepare,deformBound,deform,contactState,mesh};
});
