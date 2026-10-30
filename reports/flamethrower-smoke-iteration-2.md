# Flamethrower smoke — iteration 2, awaiting verification

Approved jet baseline: `194103f`; user confirmed all tests passed. Smoke authorized next, with intermediate commits due to remaining usage. Jet/source art/combat are unchanged by this iteration.

## Implementation and observable acceptance criteria

- Approved `assets/runtime/towers/flamethrower-smoke-v1.png` uses metadata's six256×256 cells and128,128 anchor. Lifecycle1→2→3→4→6; frame5 is excluded,4→6 crossfades. Natural sheet growth is retained at a uniform64px cell footprint. No rotation with the jet.
- Presentation-only pool outside S, reset on scene identity; emissions occur only while firing. Spawn coordinates follow the jet, then each puff rises up screen22px/s with a slight deterministic horizontal drift, independently of heading. Lifetime1.2s, fade-in/out, at most6 per tower and96 globally. No historical catch-up burst or simulation RNG.
- Smoke composites above enemies/jet. A single reusable canvas is composited at0.45 so aggregate overlapping opacity cannot exceed0.45 (below the0.55 requirement). Health bars are excluded. This cap is an implementation bound, not proof that enemies remain visually readable.
- Paused, selling, under-construction, removed and Cryojet towers cannot retain or emit smoke. Missing art suppresses smoke safely. No runtime pixel reads; source PNG/layout unchanged.

## Status and user-run checks

Implementation saved as `75d8bd6`; focused tests and capture scenario saved separately. No tests, captures or browser checks run by agent. Previous green status applies only to the jet baseline. No claim of visual acceptance.

```sh
node tests/flamethrower-smoke.cjs
npm test
node tools/capture-organic-world.cjs --flamethrower-smoke
open prototype/index.html
```

The smoke test exercises all16 headings, deterministic/read-only emission, sheet metadata, skipped ring frame, lifecycle/crossfade,6/96 caps, no inactive/Cryojet smoke, missing art and aggregate opacity of overlapping puffs. The same rise/frame assertions must reject known-bad heading-aligned rise and ring-frame variants.

Capture output directory (ignored, not yet generated): `/Users/home/github/game/reports/generated/flamethrower-smoke/`. No ignored source-photo dependency. The command goes through `tools/capture-organic-world.cjs` and draws the real game.

Expected before/after review paths:

- `before-mire-level3-heading-2-whole.png`, `after-mire-level3-heading-2-whole.png`, matching `-whole-gray.png` and `-close.png`; paired `mire-level3-heading-2-before-after.png`. Same paths for Ember.
- All8 headings for level3, Plasma (`A`) and Cryojet (`B`), whole/gray/close plus paired crops.
- `mire-life-cycle.png`, `ember-life-cycle.png`: full1.6s sampled cycle, including disappearance of the final puff; corresponding individual `*-life-00-whole.png` through `*-life-32-whole.png` and grayscale frames.
- `mire/ember-paused-whole.png`, `mire/ember-selling-whole.png`; `verification.json` checks both simulation fingerprints against194103f.

After capture, open full frames and crops at matching scale, inspect the entire lifecycle and4→6 transition. Independently try to reject: obscured enemies/towers in grayscale, bar holes, abrupt stage changes, ring silhouette, sliding or jet-aligned rise, disembodied smoke, overly dark/large smoke. All these visual criteria remain pending until actual frames are reviewed. Browser from disk must fire/pause/sell both fuel branches and Cryojet with console open. Tests/captures do not substitute for browser verification or independent visual review. PR remains draft, unmerged.
