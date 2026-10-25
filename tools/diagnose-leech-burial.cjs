'use strict';
// User-run diagnostic. Tests candidate HTML copies; never edits the working game.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync,execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),out=path.join(root,'reports/generated/leech-burial-diagnostic');
fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8');
const replace=(s,from,to)=>{assert.ok(s.includes(from),'candidate source anchor missing: '+from);return s.replace(from,to);};
const candidates=[];
for(const depth of [3.5,4.5,5.5])for(const reach of [5,7])for(const feather of [1.5,2.5]){
 let html=replace(source,'createLinearGradient(0,p.y-3.5,0,p.y-.5)',`createLinearGradient(0,p.y-${depth},0,p.y${feather-depth})`);
 html=replace(html,"fill.addColorStop(1/3,'#fff');",'');
 html=replace(html,'fillRect(left,p.y-3.5,width,7.5)',`fillRect(left,p.y-${depth},width,${depth+4})`);
 html=replace(html,'<=5)return true;',`<=${reach})return true;`);
 candidates.push({id:`strip-depth${depth}-reach${reach}-feather${feather}`,html});
}
// A distinct geometry candidate: authored contact dabs with the same baked core protection.
const maskPattern=/function creatureMireMask\(e,pose\)\{[\s\S]*?\n\}\n(?=function drawCreatureContactShadow)/;
const rejected=execFileSync('git',['show','c01c1b9:prototype/index.html'],{cwd:root,encoding:'utf8'});
const oldMask=rejected.match(maskPattern)[0];
const protection="if(e.type==='leech'){g.globalCompositeOperation='destination-out';g.fillStyle='#fff';for(const [x,y,width]of CREATURE_MIRE_CONTACTS.leech.rows[pose.row][pose.frame].bodyCore)g.fillRect(x,y,width,1);g.globalCompositeOperation='source-over';}\n  ";
for(const reach of [5,7]){
 const mask=replace(oldMask,'creatureMireMasks.set(key,mask);return mask;',protection+'creatureMireMasks.set(key,mask);return mask;');
 const html=replace(source.replace(maskPattern,()=>mask),'<=5)return true;',`<=${reach})return true;`);
 candidates.push({id:`contact-dabs-protected-reach${reach}`,html});
}
const results=[];
for(const candidate of candidates){
 const file=path.join(out,candidate.id+'.html');fs.writeFileSync(file,candidate.html);
 const result={id:candidate.id,file,tests:[]};
 for(const test of ['creature-mire-body','creature-mire-contact']){
  const child=spawnSync(process.execPath,[path.join(root,'tests',test+'.cjs')],{
   cwd:root,env:{...process.env,CREATURE_MIRE_CANDIDATE:file},encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024
  });
  const log=(child.stdout||'')+(child.stderr||'')+(child.error?'\n'+child.error:'');
  const logfile=path.join(out,candidate.id+'-'+test+'.log');fs.writeFileSync(logfile,log);
  result.tests.push({test,pass:child.status===0,log:logfile,poseFailures:(log.match(/(?:leech|carapacid) row \d+ frame \d+: buried=/g)||[]).length});
 }
 result.pass=result.tests.every(t=>t.pass);results.push(result);
 console.log(`${candidate.id}: body=${result.tests[0].pass?'PASS':'FAIL'}, contacts=${result.tests[1].pass?'PASS':'FAIL'}${result.tests[1].poseFailures?' ('+result.tests[1].poseFailures+' poses)':''}`);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
}
const selected=results.find(r=>r.pass);
if(!selected){console.error('No candidate passed both unchanged tests. Details: '+path.join(out,'results.json'));process.exitCode=1;}
else{
 fs.writeFileSync(path.join(out,'selected.json'),JSON.stringify(selected,null,2)+'\n');
 console.log('Numerical candidate only, visual review required: '+selected.id);
 const capture=spawnSync(process.execPath,[path.join(root,'tools/capture-leech-contact-context.cjs')],{
  cwd:root,env:{...process.env,CREATURE_MIRE_CANDIDATE:selected.file,CREATURE_MIRE_CAPTURE_DIR:path.join(out,selected.id+'-captures')},stdio:'inherit'
 });
 if(capture.status!==0)process.exitCode=1;
 console.log('Working prototype/index.html was not changed. Results: '+out);
}
