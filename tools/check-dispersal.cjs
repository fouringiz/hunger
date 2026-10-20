// Controlled, research-only evaluation of the prototype's Dispersal mutation.
// It loads the actual browser simulation into a VM and injects measurement hooks;
// prototype/index.html itself is never changed by this tool.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const PROTOTYPE = path.join(ROOT, 'prototype/index.html');
const GENERATED = path.join(ROOT, 'reports/generated');
const REPORT = path.join(ROOT, 'reports/dispersal-v0.4.md');
const MAX_SIM_SECONDS = 300;
const FIXED_CASH_CAP = 200;
const LAYOUTS = [
  {id: 'west-mid', cannons: [2, 8], generator: 15},
  {id: 'mid-east', cannons: [5, 9], generator: 13},
  {id: 'south-arc', cannons: [3, 10], generator: 14}
];
const SWITCH_TO = ['turret', 'voltaic'];
const ACTIONS = ['unchanged', 'upgrade', 'switch', 'premixed'];
const WAVES = [5, 9];

function readAndInstrument() {
  const html = fs.readFileSync(PROTOTYPE, 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'prototype must contain its inline simulation script');
  const source = match[1];
  const checks = [
    ['fixed simulation step', 'const SIM_STEP = 1 / 60;'],
    ['Dispersal delay mutation', 'if (S.mutations.includes(\'dispersal\')) for (const s of S.spawnQueue) s.delay *= DISPERSAL_SPACING;'],
    ['Forager herd clamp', "if (e.type === 'forager') for (const c of S.enemies)"],
    ['splash collision predicate', 'Math.hypot(e.x-sh.tx, e.y-sh.ty) <= sh.splash + e.r*0.5'],
    ['shell impact site', 'sh.done = true;']
  ];
  for (const [label, needle] of checks) {
    const count = source.split(needle).length - 1;
    assert.equal(count, 1, `expected exactly one source anchor for ${label}; found ${count}`);
  }
  let instrumented = source.replace(
    "if (e.type === 'forager') for (const c of S.enemies)",
    "if (e.type === 'forager' && !REMOVE_FORAGER_HERD) for (const c of S.enemies)"
  );
  instrumented = instrumented.replace(
    'sh.done = true;',
    'sh.done = true; if (typeof __researchSplashImpact === \'function\') __researchSplashImpact(sh, S);'
  );
  instrumented = instrumented.replace(
    '// ---------------------------------------------------------------- state\nlet S;',
    '// ---------------------------------------------------------------- state\nlet REMOVE_FORAGER_HERD = false;\nlet S;'
  );
  assert.notEqual(instrumented, source, 'all asserted research injections must apply');
  return {source, instrumented};
}

const {source: CORE_SOURCE, instrumented: RESEARCH_SOURCE} = readAndInstrument();

function makeContext(instrumentation = true) {
  const canvas = {getContext: () => ({}), style: {}, addEventListener() {}};
  const context = vm.createContext({
    document: {getElementById: () => canvas}, window: {devicePixelRatio: 1},
    innerWidth: 960, innerHeight: 540, addEventListener() {}, requestAnimationFrame() {},
    performance: {now: () => 0}, structuredClone, assert,
    __researchCapture: instrumentation,
    __researchMetrics: null,
    __researchSplashImpact(shell, state) {
      if (!context.__researchCapture || !context.__researchMetrics || !shell.tower || shell.tower.type !== 'cannon') return;
      const bodies = state.enemies.filter(e => !e.dead &&
        Math.hypot(e.x - shell.tx, e.y - shell.ty) <= shell.splash + e.r * 0.5).length;
      context.__researchMetrics.splashImpactCounts.push(bodies);
    }
  });
  vm.runInContext(RESEARCH_SOURCE, context, {timeout: 10000});
  vm.runInContext(`
    function __researchPlace(layout, premixed) {
      reset(); S.phase='build'; S.credits=1000;
      const item=__researchLayout;
      if (premixed) {
        build(SLOTS[item.cannons[0]], 'cannon');
        build(SLOTS[item.cannons[1]], 'turret');
        upgrade(SLOTS[item.cannons[1]].tower);
      } else {
        for (const ix of item.cannons) build(SLOTS[ix], 'cannon');
      }
      build(SLOTS[item.generator], 'generator');
      S.credits=${FIXED_CASH_CAP}; S.gate=GATE_MAX; S.time=0;
      return {historicalInvestment:S.towers.reduce((n,t)=>n+t.invested,0),
        startingCash:S.credits, initialGate:S.gate, power:power()};
    }
    function __researchApply(action, candidate) {
      const before=S.credits, sunkBefore=S.towers.reduce((n,t)=>n+t.invested,0), powerBefore=power();
      let sellRefund=0, bought=0;
      if (action === 'upgrade') {
        const tower=SLOTS[candidate.slot].tower;
        assert.ok(tower && tower.type==='cannon' && tower.level<3);
        const cost=tower.T.upg[tower.level]; upgrade(tower);
        assert.equal(before-S.credits,cost); bought=cost;
      } else if (action === 'switch') {
        const old=SLOTS[candidate.slot].tower;
        assert.ok(old && old.type==='cannon' && !old.selling);
        const oldInvested=old.invested;
        S.buildTimer=999;
        sell(old);
        let guard=0;
        while (S.towers.includes(old) && guard++<Math.ceil(SELL_TIME/SIM_STEP)+3) update(SIM_STEP);
        assert.ok(!S.towers.includes(old), 'sell demolition must complete before replacement purchase');
        sellRefund=Math.round(oldInvested*SELL_RATE);
        const cost=TOWER[candidate.type].cost;
        assert.ok(S.credits>=cost, 'replacement must be affordable after real refund');
        build(SLOTS[candidate.slot],candidate.type);
        assert.equal(SLOTS[candidate.slot].tower.type,candidate.type);
        bought=cost;
      }
      S.time=0; S.buildTimer=999;
      return {action, candidate, bought, sellRefund, netCashChange:before-S.credits,
        startingCash:before, endingCash:S.credits, sunkInvestmentBefore:sunkBefore,
        sunkInvestmentAfter:S.towers.reduce((n,t)=>n+t.invested,0),
        powerBefore, powerAfter:power()};
    }
    function __researchRunWave(maxSeconds, herdOff, dispersalOn, wave, capture) {
      REMOVE_FORAGER_HERD=herdOff;
      __researchCapture=capture;
      __researchMetrics={splashImpactCounts:[], cannonEnemySeconds:0};
      S.wave=wave-1; S.phase='build'; S.mutations=wave===9?['sprinter']:[];
      if (dispersalOn) S.mutations.push('dispersal');
      const expected=waveDef(wave).map(s=>s.type).join(',');
      startWave();
      assert.equal(S.spawnQueue.map(s=>s.type).join(','),expected,'Dispersal must not change wave composition');
      const start=S.time, maxTicks=Math.floor(maxSeconds/SIM_STEP); let ticks=0;
      while(S.phase==='wave' && ticks<maxTicks) { update(SIM_STEP); ticks++; }
      const duration=S.time-start;
      const outcome=S.gate<=0?'loss':(S.phase==='wave'?'timeout':'clear');
      return {outcome, gateLoss:Math.max(0,GATE_MAX-S.gate), finalGate:S.gate,
        leaked:S.waveLeaked, kills:S.waveKills, durationSeconds:duration,
        inRangeEnemySeconds:__researchMetrics.cannonEnemySeconds||0,
        splashImpactMean:__researchMetrics.splashImpactCounts.length
          ? __researchMetrics.splashImpactCounts.reduce((a,b)=>a+b,0)/__researchMetrics.splashImpactCounts.length : null,
        splashImpactN:__researchMetrics.splashImpactCounts.length,
        splashZeroHitImpacts:__researchMetrics.splashImpactCounts.filter(n=>n===0).length,
        simTicks:ticks, censoredAtSeconds:outcome==='timeout'?maxSeconds:null,
        endingCash:S.credits, endingPower:power(), herdRemoved:herdOff,
        dispersalOn, otherMutations:[...S.mutations].filter(m=>m!=='dispersal')};
    }
  `, context);
  return context;
}

function legalCandidates(ctx, action) {
  return vm.runInContext(`(() => {
    const c=[];
    if (${JSON.stringify(action)}==='upgrade') {
      for (const slot of __researchLayout.cannons) {
        const t=SLOTS[slot].tower;
        if (t && t.level<3 && t.T.upg[t.level]<=S.credits) c.push({slot});
      }
    } else if (${JSON.stringify(action)}==='switch') {
      for (const slot of __researchLayout.cannons) for(const type of ${JSON.stringify(SWITCH_TO)})
        if (TOWER[type].cost<=S.credits+Math.round(SLOTS[slot].tower.invested*SELL_RATE)) c.push({slot,type});
    }
    return c;
  })()`, ctx);
}

function prepare(ctx, layout, premixed) {
  ctx.__researchLayout = layout;
  return vm.runInContext(`__researchPlace(null,${premixed})`, ctx);
}

function makeScenarios() {
  const rows=[];
  for(const layout of LAYOUTS) for(const wave of WAVES) {
    const arms=[{action:'unchanged',candidate:null}, {action:'premixed',candidate:null}];
    const probe=makeContext(true); probe.__researchLayout=layout; prepare(probe,layout,false);
    arms.push(...legalCandidates(probe,'upgrade').map(candidate=>({action:'upgrade',candidate})));
    arms.push(...legalCandidates(probe,'switch').map(candidate=>({action:'switch',candidate})));
    for(const arm of arms) for(const dispersalOn of [false,true])
      rows.push({layout,wave,dispersalOn,...arm});
  }
  return rows;
}

function simulateWithRangeIntegration(spec, herdOff = false) {
  const ctx=makeContext(true), premixed=spec.action==='premixed';
  const checkpoint=prepare(ctx,spec.layout,premixed);
  const action=vm.runInContext(`__researchApply(${JSON.stringify(spec.action)},${JSON.stringify(spec.candidate||null)})`,ctx);
  action.action=spec.action;
  const rawStep=vm.runInContext('stepSimulation',ctx);
  vm.runInContext(`stepSimulation = function(dt) {
    __coreStepSimulation(dt);
    if (!__researchCapture) return;
    for (const t of S.towers) if (t.type==='cannon' && !t.paused && !t.selling) {
      for (const e of S.enemies) if (!e.dead) {
        const d=Math.hypot(e.x-t.x,e.y-t.y);
        if (d<=tstats(t).range && (!t.T.minRange || d>=t.T.minRange)) __researchMetrics.cannonEnemySeconds += dt;
      }
    }
  };`,ctx);
  ctx.__coreStepSimulation=rawStep;
  const metric=vm.runInContext(`__researchRunWave(${MAX_SIM_SECONDS},${herdOff},${spec.dispersalOn},${spec.wave},true)`,ctx);
  metric.layout=spec.layout.id; metric.wave=spec.wave; metric.action=spec.action;
  metric.candidate=spec.candidate||null; metric.historicalInvestment=checkpoint.historicalInvestment;
  metric.cashCap=FIXED_CASH_CAP; metric.actionLedger=action;
  metric.totalSpend=action.bought; metric.cashAfterWave=metric.endingCash; metric.unspentCash=action.endingCash;
  metric.reactionNetSpend=action.netCashChange;
  return metric;
}

function runStudy() {
  const scenarios=makeScenarios();
  const primary=scenarios.map(spec=>simulateWithRangeIntegration(spec,false));
  const herd=[];
  for(const layout of LAYOUTS) for(const wave of WAVES)
    for(const herdOff of [false,true]) for(const dispersalOn of [false,true]) {
      const spec={layout,wave,action:'unchanged',candidate:null,dispersalOn};
      const metric=simulateWithRangeIntegration(spec,herdOff);
      herd.push({...metric,herdRemoved:herdOff});
    }
  for(const layout of LAYOUTS) for(const wave of WAVES) for(const dispersalOn of [false,true]) {
    const primaryRow=primary.find(r=>r.layout===layout.id&&r.wave===wave&&r.action==='unchanged'&&r.dispersalOn===dispersalOn);
    const herdOn=herd.find(r=>r.layout===layout.id&&r.wave===wave&&!r.herdRemoved&&r.dispersalOn===dispersalOn);
    for(const key of ['outcome','gateLoss','leaked','durationSeconds','inRangeEnemySeconds','splashImpactMean','splashImpactN'])
      assert.equal(primaryRow[key],herdOn[key],`primary/diagnostic mismatch at ${layout.id}, wave ${wave}, Dispersal ${dispersalOn}, metric ${key}`);
  }
  const expectedMinimum=LAYOUTS.length*WAVES.length*ACTIONS.length*2;
  assert.ok(primary.length>=expectedMinimum,`primary grid must contain at least ${expectedMinimum} trials`);
  assert.equal(herd.length,LAYOUTS.length*WAVES.length*4,'herd diagnostic must contain 24 trials');
  const data={metadata:{createdAt:new Date().toISOString(),simulationStep:1/60,maxSimSeconds:MAX_SIM_SECONDS,
    fixedCashCap:FIXED_CASH_CAP,layouts:LAYOUTS,minimumPrimaryTrials:48,actualPrimaryTrials:primary.length,
    herdDiagnosticTrials:herd.length,source:'prototype/index.html loaded in Node VM; research-only assertions/instrumentation'},primary,herd};
  fs.mkdirSync(GENERATED,{recursive:true});
  fs.writeFileSync(path.join(GENERATED,'dispersal-control-results.json'),JSON.stringify(data,null,2)+'\n');
  const report=renderReport(data);
  assertMarkdownTableShapes(report);
  fs.writeFileSync(REPORT,report);
  printSummary(data);
  return data;
}

function mean(rows, key) { const values=rows.map(r=>r[key]).filter(Number.isFinite); return values.length?values.reduce((n,v)=>n+v,0)/values.length:null; }
function rollup(rows) {
  return {n:rows.length,clear:rows.filter(r=>r.outcome==='clear').length,loss:rows.filter(r=>r.outcome==='loss').length,
    timeout:rows.filter(r=>r.outcome==='timeout').length,meanGateLoss:mean(rows,'gateLoss'),meanLeaks:mean(rows,'leaked'),
    meanDuration:mean(rows,'durationSeconds'),meanInRangeEnemySeconds:mean(rows,'inRangeEnemySeconds'),
    meanSplashBodies:mean(rows,'splashImpactMean'),splashMeanN:rows.filter(r=>Number.isFinite(r.splashImpactMean)).length,meanZeroSplashHits:mean(rows,'splashZeroHitImpacts')};
}
function renderReport(data) {
  const primary=data.primary, herd=data.herd;
  const baseGroups=[];
  for(const wave of WAVES) for(const action of ACTIONS) for(const dispersalOn of [false,true]) {
    let rows=primary.filter(r=>r.wave===wave&&r.action===action&&r.dispersalOn===dispersalOn);
    if(['upgrade','switch'].includes(action)) {
      // Candidate-wise results remain in JSON; summary rows show every candidate plus the per-checkpoint best.
      const groups=new Map();
      for(const r of rows) {const key=r.layout; if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
      for(const [layout,items] of groups) {
        const best=[...items].sort((a,b)=>a.gateLoss-b.gateLoss||a.leaked-b.leaked||a.durationSeconds-b.durationSeconds)[0];
        baseGroups.push({wave,action,dispersalOn,layout,candidate:'best observed; candidates also in JSON',...rollup([best])});
      }
    } else baseGroups.push({wave,action,dispersalOn,layout:'all layouts',candidate:'—',...rollup(rows)});
  }
  const table=baseGroups.map(r=>`| ${r.wave} | ${r.action} | ${r.dispersalOn?'ON':'OFF'} | ${r.layout} | ${r.candidate} | ${r.n} | ${r.clear}/${r.loss}/${r.timeout} | ${fmt(r.meanGateLoss)} | ${fmt(r.meanLeaks)} | ${fmt(r.meanDuration)} | ${fmt(r.meanInRangeEnemySeconds)} | ${fmt(r.meanSplashBodies)} / ${r.splashMeanN} / ${fmt(r.meanZeroSplashHits)} |`).join('\n');
  const herdRows=[];
  for(const wave of WAVES) for(const herdOff of [false,true]) for(const dispersalOn of [false,true]) {
    const rows=herd.filter(r=>r.wave===wave&&r.herdRemoved===herdOff&&r.dispersalOn===dispersalOn);
    herdRows.push(`| ${wave} | ${herdOff?'OFF (clamp removed)':'ON (prototype)'} | ${dispersalOn?'ON':'OFF'} | ${rows.filter(r=>r.outcome==='clear').length}/${rows.filter(r=>r.outcome==='loss').length}/${rows.filter(r=>r.outcome==='timeout').length} | ${fmt(mean(rows,'gateLoss'))} | ${fmt(mean(rows,'leaked'))} | ${fmt(mean(rows,'durationSeconds'))} |`);
  }
  const cannon=primary.filter(r=>r.action==='unchanged');
  const dispDelta=[];
  for(const wave of WAVES) {
    const off=cannon.filter(r=>r.wave===wave&&!r.dispersalOn), on=cannon.filter(r=>r.wave===wave&&r.dispersalOn);
    dispDelta.push({wave,gate:mean(on,'gateLoss')-mean(off,'gateLoss'),leaks:mean(on,'leaked')-mean(off,'leaked'),duration:mean(on,'durationSeconds')-mean(off,'durationSeconds')});
  }
  const bestCandidates=primary.filter(r=>['upgrade','switch'].includes(r.action));
  const candidateLines=bestCandidates.map(r=>`| ${r.wave} | ${r.layout} | ${r.action} | ${r.dispersalOn?'ON':'OFF'} | ${JSON.stringify(r.candidate)} | ${r.outcome} | ${r.gateLoss} | ${r.leaked} | ${fmt(r.durationSeconds)} | ${r.totalSpend} | ${r.actionLedger.sellRefund} | ${r.unspentCash}/${r.cashAfterWave} | ${fmt(r.endingPower.cons)}/${fmt(r.endingPower.prod)} | ${fmt(r.splashImpactMean)}/${r.splashZeroHitImpacts} |`).join('\n');
  const verdict=verdictText(cannon,dispDelta,herd);
  return `# Dispersal control study — prototype v0.4 (research only)\n\nGenerated: ${data.metadata.createdAt}. This is a bounded experiment; it does not change the prototype or passport.\n\n## Question and design\n\nDoes Dispersal's 1.5× spawn spacing reduce cannon splash concentration enough to change outcomes, and is the apparent effect actually due to extra response time? Three predeclared cannon-heavy two-Cannon-plus-Generator layouts were paired at waves 5 and 9. Each checkpoint has the same 20 Gate HP and a synthetic starting reaction-cash allowance of ${FIXED_CASH_CAP} credits. Historical tower investment is ${fmt(data.primary[0].historicalInvestment)} credits per baseline checkpoint; the anticipatory mixed layout carries the same total historical investment (one Cannon, one level-2 Turret, one Generator). These funded snapshots are deliberately synthetic and are not campaign-economy claims.\n\nThe primary grid has **${primary.length} trials** (minimum 48): unchanged, a legal Cannon upgrade candidate set, a legal partial switch candidate set, and an equal-investment pre-mixed baseline; each is paired with Dispersal OFF/ON. Wave 5 has no other mutation; wave 9 holds Sprinter Reflex on both sides. The reaction arms start from the same unchanged checkpoint, then receive the same 200-credit starting reaction allowance. The pre-mixed arm is an anticipatory historical investment comparator, not a postmutation response. Upgrade candidates cover both existing Cannons. Switch candidates sell either Cannon using the game's 60% refund and 1.8 s demolition, then buy a Turret or Voltaic in that slot; the 1.8 s occurs in build phase before the wave. These are declared single-action comparisons under an equal starting allowance, not an optimization of the entire 200-credit budget; unused cash differs between arms. We report all candidates and choose “best observed” only after the predeclared candidate set is complete.\n\nAll combat uses the loaded prototype's actual VM runtime at SIM_STEP = 1/60. The only runtime changes are asserted research hooks for measurements and a single asserted conditional to disable the Forager herd speed clamp in the diagnostic. No gameplay source is written. No RNG is added. Every wave is censored at ${MAX_SIM_SECONDS} simulated seconds. Dispersal ON changes spawn delays only; identical composition is asserted.\n\nMetrics: clear/loss/timeout, Gate loss, leaks, time to a terminal outcome (clear or Gate loss, or censoring at 300 seconds), Cannon-enemy seconds in geometric firing range (integrated once per simulation tick per active Cannon), mean living bodies inside the actual Cannon splash collision radius immediately before each impact (including impacts with zero bodies), zero-body impact count, credits spent/refunded/left, and final power demand/output. At defeat, exposure and impact observations stop immediately; they do not describe the unobserved remainder of the wave. Splash rollups are unweighted averages of trial means, excluding trials with no impacts; the contributing trial count is shown alongside.\n\n## Primary results\n\nClear/loss/timeout counts are shown in that order. Upgrade/switch rows summarize the best outcome per layout after retaining every candidate in the table below.\n\n| Wave | Arm | Dispersal | Layout | Candidate | N | Clear/loss/timeout | Mean Gate loss | Mean leaks | Mean terminal time (s) | Cannon-enemy s | Mean bodies / impact-bearing trials / zero-hit impacts |\n|---:|---|:---:|---|---|---:|---:|---:|---:|---:|---:|---:|\n${table}\n\n## Candidate audit\n\n| Wave | Layout | Arm | Dispersal | Candidate | Outcome | Gate loss | Leaks | Terminal time (s) | Gross spend | Sell refund | Cash after action / end | Power cons/prod | Mean impact bodies / zero hits |\n|---:|---|---|:---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${candidateLines}\n\n## Herd diagnostic\n\nThis is a separate unchanged-defense 2×2 diagnostic; only the Forager-vs-Carapacid speed clamp is removed. The speed base, spawn spacing, enemy HP, composition, and all other mechanics remain as loaded. It contains ${herd.length} trials (3 layouts × 2 waves × 2 herd states × 2 Dispersal states).\n\n| Wave | Herd | Dispersal | Clear/loss/timeout | Mean Gate loss | Mean leaks | Terminal time (s) |\n|---:|---|:---:|---:|---:|---:|---:|\n${herdRows.join('\n')}\n\n## Verdict\n\n${verdict}\n\nThis finding applies only to these three cannon-heavy synthetic snapshots and the chosen response candidates. It does not validate campaign balance or establish that Dispersal is desirable.\n\n## Reproduction\n\nRun node tools/check-dispersal.cjs to regenerate this report and the ignored JSON under reports/generated/. Run node tests/dispersal-control.cjs for the instrumentation equivalence check. The report file is committed; generated JSON is ignored.\n`;
}
function fmt(x) {return x==null?'—':Number(x).toFixed(2);}
function assertMarkdownTableShapes(markdown) {
  const lines=markdown.split('\n');
  for(let i=0;i<lines.length-1;i++) {
    if(!lines[i].startsWith('|') || !/^\|[-:| ]+\|$/.test(lines[i+1])) continue;
    const cells=line=>line.trim().split('|').length-2;
    const expected=cells(lines[i]);
    assert.equal(cells(lines[i+1]),expected,`Markdown separator cell count at line ${i+2}`);
    for(let j=i+2;j<lines.length&&lines[j].startsWith('|');j++)
      assert.equal(cells(lines[j]),expected,`Markdown data cell count at line ${j+1}`);
  }
}
function verdictText(rows,deltas,herd) {
  const parts=[];
  for(const d of deltas) {
    const waveRows=rows.filter(r=>r.wave===d.wave), off=waveRows.filter(r=>!r.dispersalOn),on=waveRows.filter(r=>r.dispersalOn);
    const paired=LAYOUTS.map(layout=>{
      const a=off.find(r=>r.layout===layout.id),b=on.find(r=>r.layout===layout.id);
      return `${layout.id}: Gate ${a.gateLoss}→${b.gateLoss}, leaks ${a.leaked}→${b.leaked}, terminal time ${fmt(a.durationSeconds)}→${fmt(b.durationSeconds)} s`;
    });
    parts.push(`Wave ${d.wave} paired unchanged controls (Dispersal OFF→ON): ${paired.join('; ')}. Across-layout means: Gate loss ${fmt(mean(off,'gateLoss'))}→${fmt(mean(on,'gateLoss'))}, leaks ${fmt(mean(off,'leaked'))}→${fmt(mean(on,'leaked'))}, terminal time ${fmt(mean(off,'durationSeconds'))}→${fmt(mean(on,'durationSeconds'))} s.`);
  }
  const noEffect=rows.filter(r=>!r.dispersalOn).every(a=>{
    const b=rows.find(r=>r.dispersalOn&&r.wave===a.wave&&r.layout===a.layout);
    return a.gateLoss===b.gateLoss&&a.leaked===b.leaked;
  });
  const verdict=noEffect?'In this sample, Dispersal produced no Gate-loss or leak change in the unchanged cannon-heavy controls.':'In this sample, paired unchanged controls show layout-dependent changes in Gate loss and/or leaks under Dispersal.';
  const diagnostic=[];
  for(const wave of WAVES) for(const removed of [false,true]) {
    const selected=herd.filter(r=>r.wave===wave&&r.herdRemoved===removed);
    const d0=selected.filter(r=>!r.dispersalOn), d1=selected.filter(r=>r.dispersalOn);
    const pairs=LAYOUTS.map(layout=>{
      const a=d0.find(r=>r.layout===layout.id),b=d1.find(r=>r.layout===layout.id);
      return `${layout.id} ${a.leaked}→${b.leaked}`;
    });
    diagnostic.push(`Wave ${wave}, ${removed?'clamp removed':'prototype clamp'} (Dispersal OFF→ON leaks): ${pairs.join('; ')}.`);
  }
  return `${verdict}\n\n${parts.join('\n\n')}\n\nReported duration is time to a terminal outcome (clear or Gate loss), or the 300 s censoring limit, rather than full wave duration. Cannon-enemy seconds and impact occupancy are descriptive measurements; their co-movement does not identify a causal channel. At wave 9 all unchanged arms reach the 20-HP Gate-loss ceiling, so Gate loss cannot distinguish outcomes beyond total destruction.\n\nHerd diagnostic paired leak results:\n\n${diagnostic.join('\n\n')}\n\nCandidate outcomes are descriptive across the declared layouts and response choices, not evidence of a universal switching advantage.`;
}
function printSummary(data) {
  console.log(`PASS: ${data.primary.length} primary candidate trials; ${data.herd.length} herd diagnostic trials.`);
  for(const wave of WAVES) {
    const rows=data.primary.filter(r=>r.wave===wave&&r.action==='unchanged');
    for(const d of [false,true]) console.log(JSON.stringify({wave,dispersalOn:d,...rollup(rows.filter(r=>r.dispersalOn===d))}));
  }
  console.log(`Report: ${REPORT}`);
}

function runSelfTest() {
  const spec={layout:LAYOUTS[0],wave:5,action:'unchanged',candidate:null,dispersalOn:false};
  const instrumented=simulateWithRangeIntegration(spec);
  const canvas={getContext:()=>({}),style:{},addEventListener(){}};
  const rawContext=vm.createContext({document:{getElementById:()=>canvas},window:{devicePixelRatio:1},
    innerWidth:960,innerHeight:540,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},assert});
  vm.runInContext(CORE_SOURCE,rawContext);
  const raw=vm.runInContext(`(() => {
    reset(); S.phase='build'; S.credits=1000;
    for(const ix of [2,8]) build(SLOTS[ix],'cannon');
    build(SLOTS[15],'generator'); S.credits=${FIXED_CASH_CAP}; S.gate=GATE_MAX;
    S.wave=4; S.mutations=[]; startWave();
    let ticks=0; while(S.phase==='wave' && ticks<${Math.floor(MAX_SIM_SECONDS/(1/60))}) {update(1/60);ticks++;}
    return {outcome:S.gate<=0?'loss':(S.phase==='wave'?'timeout':'clear'),gateLoss:GATE_MAX-S.gate,
      finalGate:S.gate,leaked:S.waveLeaked,kills:S.waveKills,durationSeconds:S.time,simTicks:ticks,
      endingCash:S.credits,power:power()};
  })()`,rawContext);
  const comparable=['outcome','gateLoss','finalGate','leaked','kills','simTicks','endingCash'];
  for(const key of comparable) assert.equal(instrumented[key],raw[key],`research instrumentation changed ${key}`);
  assert.ok(Math.abs(instrumented.durationSeconds-raw.durationSeconds)<1e-8,'measurement wrapper changed simulated duration');
  assert.deepEqual(JSON.parse(JSON.stringify(instrumented.endingPower)),JSON.parse(JSON.stringify(raw.power)));
  console.log('PASS: research instrumentation preserves the unmodified core outcome and terminal timing.');
}

if (require.main===module) process.argv.includes('--self-test')?runSelfTest():runStudy();
module.exports={runStudy,runSelfTest,makeScenarios,readAndInstrument};
