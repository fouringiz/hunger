# Carapacid shelter: paired campaign audit

2026-10-24; game source main cb7e53a (v0.9). No game source or balance values changed.

## Method

The four human-v0.4 recorded action timelines are transferred to current campaign rules (balancePreset=null), each run with shelter ON and OFF. These are scripted historical human plans, not adaptive bots or exact v0.9 recordings. OFF replaces only planCarapacidShelter with a no-op in an isolated research VM; the pre-existing convoy speed clamp and shell shot interception remain. HP, evolution, tower stats, map, events and fixed timestep are identical across each pair.

The existing replay-sweep tool retries actions in order, drops after 3600 ticks, and counts actions unreached at defeat. Strict fingerprint checks are retained in the game; the separate counterfactual tool intentionally runs changed rules. Four original-preset fixtures first reproduced their strict signatures with zero deferred/dropped/unreached actions. Each instrumented ON run matched its uninstrumented campaign terminal signature. OFF had zero assigned shelter ticks.

## Results

| Timeline | Shelter | Outcome | Gate HP | Last wave | Kills | Ticks | Deferred/dropped/unreached | Occupied body-seconds |
|---|---|---|---:|---:|---:|---:|---|---:|
| cannon-only | off | loss | 0 | 8 | 236 | 16658 | 2/0/1 | 0.00 |
| cannon-only | on | loss | 0 | 8 | 236 | 16519 | 1/0/1 | 20.13 |
| mixed | off | win | 20 | 10 | 347 | 23859 | 0/0/0 | 0.00 |
| mixed | on | win | 20 | 10 | 347 | 23859 | 0/0/0 | 5.83 |
| turret-only | off | win | 15 | 10 | 342 | 30201 | 0/0/0 | 0.00 |
| turret-only | on | win | 15 | 10 | 342 | 30196 | 0/0/0 | 753.27 |
| voltaic-only | off | loss | 0 | 8 | 210 | 17814 | 0/0/6 | 0.00 |
| voltaic-only | on | loss | 0 | 8 | 211 | 17814 | 0/0/6 | 313.40 |

Occupied body-seconds sum living followers assigned within 10 path pixels of their berth after each simulation step; this confirms engagement, not damage prevented.

## Verdict and limits

All four pairs have the same win/loss, final Gate HP and last wave. Cannon-only loses 139 ticks (2.32 seconds) earlier with shelter; turret-only finishes 5 ticks (0.08 seconds) earlier; voltaic-only gains one kill. No large outcome effect was detected on these four plans. Shelter remains a v0.9 balance factor, not a visual-only change; its current constants remain provisional. No automatic nerf or buff is justified by this sample.

Cannon-only has different action deferrals (2 off, 1 on), so this pair follows the same attempted timeline and retry policy, not identical executed action ticks. Voltaic-only ends before six actions. Early defeat censors later waves. No adaptive human response, direct damage-prevention measurement, additional layouts or higher-pressure boundary sweep was tested. These results do not establish overall balance.

## Reproduction

Run the following from the repository root at cb7e53a or this audit branch. It uses the existing runner with asserted in-memory research hooks; no production files are modified. Raw output lives in ignored reports/generated/shelter-audit/results.json.

```bash
mkdir -p reports/generated/shelter-audit
node <<'JS'
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.cwd(),file=path.join(root,'tools/replay-sweep.cjs');
const original=require(file),fixtures=original.loadFixtures();
assert.equal(fixtures.length,4);
const fidelity=original.baselineCheck(fixtures);
let source=fs.readFileSync(file,'utf8');
const needle='    const ov=__ov;';
assert.equal(source.split(needle).length,2);
source=source.replace(needle,needle+`
    if(ov.shelter===false)planCarapacidShelter=function(){};
    let occupiedTicks=0, assignedTicks=0;
    const auditStep=stepSimulation;
    stepSimulation=function(dt){const r=auditStep(dt);for(const e of S.enemies){if(e.shelter){assignedTicks++;if(Math.abs(e.d-e.shelter.targetD)<=10)occupiedTicks++;}}return r;};
`);
const resultNeedle='ticks:tick, deferred, dropped, unreached, lateTicks,';
assert.equal(source.split(resultNeedle).length,2);
source=source.replace(resultNeedle,'occupiedTicks, assignedTicks, '+resultNeedle);
const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(source,file);
const rows=[];
for(const {name,data} of fixtures){
 const campaign={...data,balancePreset:null};
 const ordinary=original.runCounterfactual(campaign);
 for(const shelter of [false,true]){
  const r=mod.exports.runCounterfactual(campaign,{shelter});
  if(shelter)assert.equal(r.signature,ordinary.signature);
  else assert.equal(r.assignedTicks,0);
  const row={timeline:name,shelter,...r};rows.push(row);
  console.log(JSON.stringify({timeline:name,shelter,win:r.win,gate:r.gate,wave:r.wave,kills:r.kills,ticks:r.ticks,deferred:r.deferred,dropped:r.dropped,unreached:r.unreached,occupiedSeconds:r.occupiedTicks/60}));
 }
}
fs.writeFileSync(path.join(root,'reports/generated/shelter-audit/results.json'),JSON.stringify({fidelity,rows},null,2)+'\n');
JS
```
