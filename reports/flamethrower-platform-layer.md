# Flamethrower nozzle/platform occlusion — iteration 1 correction

2026-10-29. PR #71, `codex/flamethrower-vfx`. Reported reference: the user's downward-facing Flamethrower screenshot, with a detached fireball below the platform. Before implementation: `6c66c10168309f6d51a805a94416fd41afcfb927` (same renderer as documentation-only `dd62837`).

## Criteria and result

| Observable criterion | Actual evidence / boundary |
| --- | --- |
| A continuous stream starts at the drawn nozzle and crosses the front platform edge; no detached lower fireball | Opened matched `before/after-{mire,ember}-down-close.png` and paired zooms. Before: platform cuts the stem. After: stem remains visible over the platform from the muzzle down to the first body. |
| Enemy bodies remain readable without hiding the jet under the whole map | A transparent foreground jet layer subtracts the current creature sprite alpha before compositing. It is above foundations/platforms, with body-shaped holes for enemies. The existing faint body film/edge contact remains separate. Opened native crowded colour/grayscale scenes, level3/Plasma heading boards and sweep sheets. |
| Health bars remain above the effect | Matching downward crowd captures use six damaged enemies and their actual bars. Both body silhouettes and bar fills/backgrounds remain visible; protected bar rectangles include a1px margin. |
| No new orientation, scale or cycle regression | Original cell, anchor, uniform scale, presentation loop, pulse reflection and fade unchanged. Mire/Ember eight-heading boards, complete cycle/sweep/stop and inactive states captured. No new source art or atlas layout. |

## Implementation

Previously the whole jet was drawn before the actor list. That protected enemies but also put the platform and foundation over the nozzle connection: the exact user's defect. The old ordering-only regression enforced that faulty solution.

The full fuel jet now renders into one reusable viewport-sized transparent canvas after the map actors. Current enemy sprite alpha is removed from that canvas using drawing/compositing only, then the remaining fire is laid over foundations/platforms. Health-bar rectangles are removed as well. Mask geometry follows current atlas pose, visual position and own scale; the existing emergence sheet is used for a surfacing Leech, and air bodies use their existing vector drawing. Cryojet keeps its original coolant pass. Missing-art vector fallback can draw into the same layer.

`drawFlameJet`, vector fallback and directional highlights accept an explicit drawing context; direct callers still default to the main canvas. No runtime pixel reads, new JSON fetch, source-image changes or simulation fields. No changes to damage, range, sweep, burn/pool rules, RNG, route, platform positions, `PATH` or `GATE_D`.

## Actual game frames

Already captured through the actual renderer:

```sh
node tools/capture-organic-world.cjs --flamethrower-layer
```

Ignored root: `/Users/home/github/game/reports/generated/flamethrower-layer/`.

- `before-mire-down-whole.png`, `after-mire-down-whole.png`, matching `-whole-gray.png`; same four files for Ember.
- `before-mire-down-close.png`, `after-mire-down-close.png`; same pair for Ember. These native280×240 crops match the problematic downward heading.
- `mire-down-before-after.png`, `ember-down-before-after.png`: before left / after right, native size. `*-before-after-zoom.png` enlarges both by2× equally.
- `before/after-{mire,ember}-down-crowd-{whole,whole-gray,close}.png`; `mire/ember-down-crowd-before-after.png` and matching zooms: six damaged enemies plus health bars.
- `before/after-{mire,ember}-{level3,plasma,cryojet}-8-headings-{game,zoom}.png`, individual whole/grayscale views, full-cycle/sweep/stop and pause/sale/folded sheets.

Opened the downward before/after close pairs and zoom, native crowd/grayscale views, Mire Plasma/Ember level3 eight-heading boards and complete Ember sweep. Comparison uses the same game scene and native scale; it reproduces the user's heading and occluding platform, not the exact population in their screenshot. Self-rejection pass: no platform cut at the emitter, no full bright overlay across enemy cores or bars in these samples, no new camera rotation. Dense crowd bars still legitimately cover the jet as UI; enemy bodies can interrupt its silhouette. Subjective presentation approval remains with the user.

`verification.json`: both versions have rules/source `9d3c412e` / `5750d1fe`; **151 identical live combat steps per zone** and rendering read-only checks. No replay restamp.

## Regression and remaining verification

No test runs by the agent. Replaced the old call-order test with Node-only actual-pixel checks: nozzle-to-platform bridge on Mire/Ember, opaque enemy core and health-bar preservation across16 headings. The same checks must reject (1) moving the whole layer back under platforms, and (2) removing the body mask and painting a blanket jet over enemies. Updated the existing jet test's fallback mutation to forward the explicit context; uniform-scale/anchor negatives are retained.

The first user run failed at the heading-0 overlap precondition. The body atlas contains only 17 pixels at alpha255 across the full1024×1024 image; most dense body pixels have alpha253. Requiring exact255 after resampling excluded the actual body core. The corrected fixture samples alpha≥250 and still requires at least12 pixels actually hit by the unmasked jet in every heading. Its permitted residual is bounded by `3*(255-bodyAlpha)` summed over RGB, matching `destination-out`; the existing mean excess-error limit of3 and exact health-bar equality remain. The known-bad blanket variant must still fail the same core/bar checks. Runtime and assets are unchanged. This correction has not yet been run.

User reruns:

```sh
node tests/flamethrower-readability.cjs
npm test
open prototype/index.html
```

Prior user-confirmed full pass applies to `6c66c10`, not this correction. Disk-browser firing/console check remains user-owned and unconfirmed after the previous Computer Use file-URL block. Captures are not browser verification. No smoke or merge; wait for the user's verdict on this one correction.
