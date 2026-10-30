'use strict';
// Guards the asset layout described in assets/README.md. Reads the working tree only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.join(__dirname,'..'),ASSETS=path.join(ROOT,'assets');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const rel=f=>path.relative(ROOT,f).split(path.sep).join('/');
const html=fs.readFileSync(path.join(ROOT,'prototype/index.html'),'utf8');
const IMAGE=/\.(png|webp|jpe?g|gif|svg)$/i;

// Every runtime path the prototype requests exists. World materials are named bare and resolved from runtime/world/.
const requested=new Set(html.match(/assets\/runtime\/[A-Za-z0-9_./-]+?\.(?:png|webp)/g)||[]);
for(const m of html.matchAll(/(?:worldMaterial\(|file:|\?|:)'([a-z0-9-]+-v\d+\.webp)'/g))requested.add('assets/runtime/world/'+m[1]);
assert.ok(requested.size>20,'found the prototype asset requests');
for(const p of requested)assert.ok(fs.existsSync(path.join(ROOT,p)),'prototype requests a missing file: '+p);

// Everything in runtime/ is requested by the prototype, or is a sidecar sharing the stem of a requested image beside it.
for(const f of walk(path.join(ASSETS,'runtime')).map(rel)){
  if(IMAGE.test(f)){assert.ok(requested.has(f),f+' is in assets/runtime but the prototype never loads it; move it to assets/art/work/');continue;}
  const stem=f.replace(/\.[a-z-]+\.json$/,'');
  assert.ok(f.endsWith('.json')&&[...requested].some(p=>p.replace(/\.(png|webp)$/,'')===stem),f+' is not a sidecar of a runtime image');
}

// Nothing piles up at the roots again, and evidence captures stay out of assets/.
assert.deepEqual(fs.readdirSync(ASSETS).sort(),['README.md','art','runtime'],'assets/ root holds only README.md, art/ and runtime/');
assert.deepEqual(fs.readdirSync(path.join(ASSETS,'art')).sort(),['references','work'],'assets/art/ holds only references/ and work/');
for(const f of walk(ASSETS).map(rel))assert.ok(!/\.(gif|mp4|webm|mov)$/i.test(f),f+': motion captures are evidence, put them in reports/<topic>/');
console.log('PASS asset layout: '+requested.size+' runtime requests resolve, runtime/ holds only loaded files and their sidecars');
