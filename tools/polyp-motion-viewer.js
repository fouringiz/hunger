'use strict';
// Browser-only art-study viewer. Texture is embedded by the builder: no file:// fetch or pixel reads.
(async function(){
 const R=window.PolypMotion,$=id=>document.getElementById(id),canvas=$('body'),floor=$('floor'),overlay=$('overlay'),mesh=R.mesh();
 R.config.aspect=window.POLYP_META.aspect;
 const error=$('error'),ctx=floor.getContext('2d'),fg=overlay.getContext('2d');
 const image=new Image();image.src=window.POLYP_TEXTURE;
 try{await image.decode();}catch(e){error.textContent='Не удалось загрузить исходное изображение: '+e.message;return;}
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true});
 if(!gl){error.textContent='Для этого отдельного просмотра нужен WebGL. Откройте файл в браузере с включённым аппаратным ускорением.';return;}
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 let program;
 try{
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 pos;attribute vec2 uv;uniform vec2 scale;uniform vec2 offset;varying vec2 tex;void main(){tex=uv;vec2 p=(pos-vec2(.5))*scale+offset;gl_Position=vec4(p.x,-p.y,0.,1.);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 tex;uniform sampler2D art;uniform float gray;void main(){vec4 c=texture2D(art,tex);float v=dot(c.rgb,vec3(.2126,.7152,.0722));c.rgb=mix(c.rgb,vec3(v),gray);gl_FragColor=c;}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 }catch(e){error.textContent='Ошибка подготовки изображения: '+e.message;return;}
 gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 const vertexData=new Float32Array(mesh.points.length*4),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 mesh.points.forEach((p,i)=>{vertexData[i*4]=vertexData[i*4+2]=p.x;vertexData[i*4+1]=vertexData[i*4+3]=p.y;});
 gl.bufferData(gl.ARRAY_BUFFER,vertexData,gl.DYNAMIC_DRAW);
 for(const [name,offset] of [['pos',0],['uv',8]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}
 const indices=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
 try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);}catch(e){error.textContent='Не удалось подготовить текстуру: '+e.message;return;}
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const uniforms={scale:gl.getUniformLocation(program,'scale'),offset:gl.getUniformLocation(program,'offset'),gray:gl.getUniformLocation(program,'gray')};
 let running=true,seconds=0,last=performance.now(),amplitude=1,speed=1;const timeline=$('timeline');
 $('play').onclick=()=>{running=!running;$('play').textContent=running?'Пауза':'Продолжить';last=performance.now();};
 $('speed').oninput=e=>{speed=Number(e.target.value);$('speed-value').textContent=speed.toFixed(2)+'×';};
 $('amount').oninput=e=>{amplitude=Number(e.target.value);$('amount-value').textContent=Math.round(amplitude*100)+'%';};
 timeline.oninput=e=>{seconds=Number(e.target.value)*R.config.duration;running=false;$('play').textContent='Продолжить';};
 $('reset').onclick=()=>{seconds=0;last=performance.now();};
 const deformAt=(p,st)=>$('static').checked?[p.x,p.y]:R.deformBound(p,st);
 function size(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(canvas.width!==w||canvas.height!==h)for(const c of [canvas,floor,overlay]){c.width=w;c.height=h;}return {w,h,cw:rect.width,ch:rect.height,dpr};}
 function render(now){
  const dt=Math.min((now-last)/1000,.1);last=now;if(running)seconds+=dt*speed;
  const phase=R.fract(seconds/R.config.duration),st=R.prepare(phase,amplitude),{w,h,cw,ch,dpr}=size();
  const spriteWidth=Math.min(cw*.78,760),spriteHeight=spriteWidth/R.config.aspect,center=[cw*.5,ch*.43];
  const project=p=>[center[0]+(p[0]-.5)*spriteWidth,center[1]+(p[1]-.5)*spriteHeight];
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=$('light').checked?'#d5cfc3':'#35302e';ctx.fillRect(0,0,cw,ch);
  const travel=$('travel').checked&&!$('static').checked?seconds/R.config.duration:0;
  // Ground scroll is the inverse of tracked-camera world travel, in matching source units.
  const gx=-R.config.stride[0]*travel*amplitude*spriteWidth,gy=-R.config.stride[1]*travel*amplitude*spriteHeight;
  ctx.strokeStyle=$('light').checked?'#b5ada1':'#4a4440';ctx.lineWidth=1;ctx.beginPath();
  for(let x=((gx%42)+42)%42;x<cw;x+=42){ctx.moveTo(x,0);ctx.lineTo(x,ch);}
  for(let y=((gy%30)+30)%30;y<ch;y+=30){ctx.moveTo(0,y);ctx.lineTo(cw,y);}ctx.stroke();
  fg.setTransform(dpr,0,0,dpr,0,0);fg.clearRect(0,0,cw,ch);
  for(let i=0;i<mesh.points.length;i++){const p=deformAt(mesh.points[i],st);vertexData[i*4]=p[0];vertexData[i*4+1]=p[1];}
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,vertexData);gl.uniform1f(uniforms.gray,$('gray').checked?1:0);
  function draw(sx,sy,x,y){gl.uniform2f(uniforms.scale,2*sx/cw,2*sy/ch);gl.uniform2f(uniforms.offset,2*x/cw-1,2*y/ch-1);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);}
  draw(spriteWidth,spriteHeight,...center);
  // Reference-width scale, deliberately unchanged during deformations.
  const smallWidth=50/window.POLYP_META.opaqueWidthFraction,smallY=ch-58;
  draw(smallWidth,smallWidth/R.config.aspect,70,smallY);
  fg.fillStyle=$('light').checked?'#332927':'#e3d6c9';fg.font='13px system-ui';fg.fillText('50 px в покое',26,ch-16);
  if($('mesh').checked){fg.strokeStyle='rgba(128,200,230,.38)';fg.lineWidth=.5;fg.beginPath();for(let i=0;i<mesh.indices.length;i+=3){for(let j=0;j<3;j++){const k=mesh.indices[i+j],p=project([vertexData[k*4],vertexData[k*4+1]]);j?fg.lineTo(...p):fg.moveTo(...p);}fg.closePath();}fg.stroke();}
  if($('contacts').checked){st.contacts.forEach((c,i)=>{const p=project($('static').checked?R.config.contacts[i].p:c.p);fg.beginPath();fg.arc(...p,5,0,Math.PI*2);fg.fillStyle=c.stance?'#b0ee99':'#edb165';fg.fill();fg.fillText(String(i+1),p[0]+8,p[1]-7);});}
  timeline.value=String(phase);$('phase').textContent=(seconds%R.config.duration).toFixed(2)+' / '+R.config.duration.toFixed(1)+' с';
  requestAnimationFrame(render);
 }
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();running=false;error.textContent='Графический контекст потерян. Перезагрузите страницу.';});
 requestAnimationFrame(render);
})();
