# Flamethrower iteration 1 — approved jet wired, awaiting verdict

2026-10-29. Branch `codex/flamethrower-vfx`, PR [#71](https://github.com/fouringiz/hunger/pull/71).
Fresh main `a06bc68` was fetched and merged as `a00699c`. This iteration changes presentation only. Smoke integration is deliberately not started; stop here for the user's verdict.

## Result and criteria

| Observable criterion | Evidence / boundary |
| --- | --- |
| Approved four-frame silhouette replaces the runtime billows for levels 1–3 and Plasma | Runtime loads `flamethrower-jet-v1.png`. Metadata contract is 4 × 512×256, anchor 0,128. Level-3/Plasma game-size eight-heading boards below were opened; levels 1–3 and Plasma have a prepared 64 heading/level regression. |
| Nozzle-anchored frame, uniform scale, rotation to the muzzle-to-range heading | One shared length/512 scale on both axes, after translation to `weaponMuzzle(t)`. No per-axis stretch. Prepared tests reject length-only scaling and a shifted anchor. Initial focused jet test passed before the final pulse-observer/layer changes; final suite remains user-run. |
| Four phases loop without simulation-time animation lock; alternating pulses reflect local Y | Presentation-time 12 fps sampling. A WeakMap observes new `jetAt` values and flips the next visible pulse, including irregular intervals; no new fields in `S`. Full-cycle sheets include two complete four-frame cycles plus wraps and multiple pulses. Contact sheets were opened; real-time perceptual approval remains pending. |
| Existing 0.23 s pulse fade; nothing on pause, sale or folded assembly | `after-*-stop-game.png` and `after-*-states-game.png` opened; the latter orders pause, sale, folded construction. A real firing event still completes cosmetic assembly per main's existing observer. The capture's folded pose has no firing event. |
| Current coolant and vector failure path | Cryojet eight-heading sheets opened; its rendering stays after actors as before. Missing/loading or failed jet drawing falls back to the previous vector jet. Prepared tests exercise missing art and Cryojet. |
| Enemy bodies remain readable under fire | First overlay candidate was rejected: it erased bodies in the bright core. Final full jet draws before actors, preserving their opaque silhouettes. Mire/Ember whole grayscale and close boards were opened. Prepared layer regression rejects the exact overlay placement. Terrain remains busy and fire is intentionally luminous: no claim of a measured global contrast ranking. |
| One camera and no sliding/detachment across headings | Eight world headings on Mire/Ember, level3/Plasma/Cryojet, plus full sweep opened. The requested 2D frame rotates as a whole; hardware and terrain retain their existing camera. No source clipping rectangle is visible. Occluding actors/platforms can interrupt the fire silhouette; this layering tradeoff is explicitly for the user's verdict. |

## Removal and source fidelity

Removed `assets/hunger-flame-billows-v1.png`, its `.frames.json`, `assets/art/flame-billows-v1.{md,prompt.txt}`, `tools/bake-flame-billows.cjs` and all live billow loading, poses, depth actors and drawing. The capture loader retains historical-only recovery of that PNG from the baseline Git revision so a clean clone can render the old PR version. The removed atlas is not shipped or used by the current game.

The approved full-jet PNG bytes/layout are unchanged; only its status metadata and notes were updated. The six-stage smoke source remains committed and unused until iteration 2. No balance, targeting, route, `PATH`, `GATE_D`, platform positions, fingerprinted simulation function or replay stamps changed.

## Game evidence

All paths below are under `/Users/home/github/game/reports/generated/flamethrower-reference-fire/` (ignored). Capture entry point:

```sh
node tools/capture-organic-world.cjs --flamethrower-reference
```

Baseline defaults to previous PR head `ed1b683775c1d1f2d5d6dc943c49a93c66b70de5`; `--before <ref>` overrides it. This no longer depends on an ignored photograph: the reference board uses the committed approved sheet at the gameplay frame scale.

- `mire-reference-before-after.png`, `ember-reference-before-after.png`: approved source / before / after, game-size close comparison.
- `before-mire-whole.png`, `after-mire-whole.png`; `before-ember-whole.png`, `after-ember-whole.png`: actual 960×540 game frames.
- `mire-whole-before-after.png`, `ember-whole-before-after.png`: matching whole views, before left / after right, colour above / grayscale below.
- `{before,after}-{mire,ember}-{level3,plasma,cryojet}-8-headings-{game,zoom}.png`: whole set of close views, native size and 2× inspection. Headings run clockwise in world screen coordinates, four per row.
- `{before,after}-{mire,ember}-{level3,plasma,cryojet}-heading-{0..7}-whole{,-gray}.png`: native whole frames for every direction/branch.
- `{before,after}-{mire,ember}-full-cycle-game.png`: full four-phase loops, wrap and repeated pulses, read left to right then down.
- `{before,after}-{mire,ember}-full-sweep-game.png`: full sinusoidal sweep, 25 samples.
- `{before,after}-{mire,ember}-stop-game.png`, `*-states-game.png`: pulse fade and pause/sale/folded poses.
- `rejected-overlay-{mire,ember}-whole-gray.png`: rejected candidate with the bright core over enemy bodies; composition is the earlier crowded stress scene, so do not treat it as a matched before/after board.
- `verification.json`: rules/source fingerprints both remain `9d3c412e` / `5750d1fe`; **151 identical live simulation steps per zone**, with rendering read-only assertions in every capture.

Opened final source/before/after boards, whole colour/grayscale, all six after heading grids, both cycle sheets, stop/states, and the Mire full sweep; expanded zooms/remaining before/full-sweep sheets are available for the user. Source and gameplay appearance approval remain separate.

## Test and browser status

The user's latest instruction delegates test runs back to the user. No tests were started after that instruction.

- Earlier focused `tests/flamethrower-jet-art.cjs` passed on the first uniform-sheet implementation.
- Earlier full `npm test` stopped at `tests/level4-effect-anchors.cjs`: it expected the former three vector paths instead of a sheet. Updated it to inspect real sprite transforms. A targeted run then exposed canvas-device vs world-coordinate comparison in that updated test; the test now compares in the existing canvas basis with subpixel tolerance. **Not rerun after that fix.**
- The final jet/pulse tests, updated level-four effect test, new layer regression and full suite are all pending user-run results. Capture parity above is evidence from the capture command, not an npm-test pass.
- Opened the actual `file:///Users/home/github/game/prototype/index.html` in Firefox. The game's page loaded and the initial web console showed no entries. Subsequent interaction was stopped by the Computer Use tool because this URL is disallowed. No workaround was attempted. Final interactive firing/asset-readiness/console verification is incomplete and must be done by the user; no file-origin rendering success is inferred from Node captures.

From the repository root, the user runs:

```sh
node tests/flamethrower-jet-art.cjs
node tests/flamethrower-readability.cjs
node tests/level4-effect-anchors.cjs
npm test
open prototype/index.html
```

In the disk browser: place a Flamethrower, observe firing/sweep, upgrade to Plasma and Cryojet, pause/sell, and inspect the console for asset-loading/draw errors and `SecurityError`. The new rendering path reads no runtime canvas pixels.

Next: user test results and iteration-1 visual verdict. No merge, no smoke integration, no iteration 2 before that verdict.
