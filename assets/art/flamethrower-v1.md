# Flamethrower — approved concept, runtime integration pending verification

User approved the concept in this chat (2026-10-29) and requested integration.
The approval covers the concept, not the assembled gameplay appearance.

- Approved image: `reports/generated/flamethrower/flamethrower-concept-v1.png`.
- Built-in ImageGen separated the same design into foundation, overhead head/nozzle and one upright tank; prompt in `flamethrower-v1.prompt.txt`.
- Generated source: `reports/generated/flamethrower/flamethrower-parts-v1.png` (2172×724, ignored). Source hash and measured rectangles are in `../hunger-flamethrower-v1.frames.json`.
- Offline pack: `node tools/bake-flamethrower.cjs [source.png]` → `assets/hunger-flamethrower-v1.png` (768×256 RGBA) and the frame table. Only the final atlas is committed; studies stay outside Git.
- Foundation: the shared Turret cell from `hunger-low-buildings-v3.png`, 44×34 game units, with the common filled bearing. The old foundation tile in the Flamethrower atlas is retained for historical captures but no longer drawn. Head: 42×28 in the projected ground plane, pivot (13,13), mounting height 12. Two tanks: 11×22, mounted at head-plane offsets (-8,±13); each stays upright, sorted behind/in front of the head by its projected depth.
- Exact continuous yaw uses existing `weaponProjection`, not discrete directional frames. Muzzle is 29 units along the projected head centreline. Pilot is orange for base/Plasma, cyan for Cryojet, dimmed when paused/selling.
- Loading/failed images retain a vector fallback. New rendering never reads canvas pixels.
- Scope: presentation only. Combat, balance, sweep, warmup, route, Gate distance and platform positions were not edited.
- Deployment follow-up: the initial integration omitted the common deployment observer. Flamer now registers placement; upright tanks emerge and spread, the head rises behind the socket edge and the nozzle telescopes out at constant scale. It uses the existing 1.65 s presentation duration and shared construction sounds. Sale runs the same pose backwards from its current progress; the first actual jet forces the final assembled pose if the view clock lags. No new pause animation.

## Observable acceptance criteria

All gameplay evidence is pending user execution and frame review.

| Criterion | Evidence to inspect |
| --- | --- |
| Approved olive/brass housing, two orange tanks and short nozzle are recognizable at game scale | `reference-and-game.png`, `after-*-whole.png`, turn strips |
| Foundation remains planted through a complete turn | before/after `*-turn-game.png` and `*-turn-zoom.png`; first/last cells close the cycle |
| Camera matches platforms; tanks remain vertical | whole views and all 17 turn samples |
| Fire/coolant starts at the nozzle throughout its sweep | `*-sweep-{base,A,B}-{game,zoom}.png`; 17 samples over a complete sinusoidal cycle |
| Enemy/tower readability survives grayscale | whole-gray views and lower grayscale rows of every strip |
| No tank/head disconnections, overlap jumps, sliding or loss of silhouette | independent rejection pass across all turn/sweep samples, especially rear headings |
| Loading fallback and real disk-browser operation | focused test plus real browser console at `file://` |

## User-run verification from repository root

```sh
npm test
node tools/capture-organic-world.cjs --flamethrower
node tools/capture-organic-world.cjs --flamethrower-deployment
node tools/capture-organic-world.cjs --flamethrower-fire
open prototype/index.html
```

The capture command uses `loadWorld` from `capture-organic-world.cjs`, compares against pre-integration revision `58c1e8eeb350927ec16a2723eecb91171a71f718`, and checks both simulation fingerprints. It writes actual-game before/after colour, grayscale, full-turn and full-sweep images for Mire and Ember under `reports/generated/flamethrower/`. It needs the local ignored approved reference only for `reference-and-game.png`.

In the disk browser, build a Flamethrower, let it fire, pause/resume, and check Plasma/Cryojet with the console open. No `SecurityError`, missing image or drawing exception should appear. Node captures and mocked canvas errors do not establish this browser result.

Tests and game capture have NOT been run by the agent. No before/after gameplay images exist yet. Inspect the actual frames before claiming visual completion; a second independent review is required before merging a visual PR.

Deployment is a separate iteration: compare `before/after-*-deploy-{game,zoom}.png`, `*-retract-{game,zoom}.png`, plus whole colour/grayscale views. Baseline `9ea29bb` is the known bad static model. Reject popping at assembly completion, detached parts, ground sliding, inconsistent camera or lost readability; an early sale must retract from the partial assembly without first flashing the complete tower. The expanded building/salvage tests are prepared, not run.

## Flowing fire — separate visual iteration

`drawFlameJet` replaces the three straight strokes with three filled turbulent ribbons and six advecting tongues. Shape and motion use simulation time without particle state or RNG. The centreline starts at the same muzzle and ends at the existing ground aim point. The fuel silhouette narrows at its source and tip; a 0.23 s visual lifetime with a final fade bridges the existing 0.2 s shot spacing. This extends only the visible tail of the effect; hit timing, range, contact damage, burns and pools stay unchanged. Pausing or selling immediately hides the jet. Base/Plasma use warm fire colors; Cryojet uses the same moving flow in coolant colors.

Evidence pending: `--flamethrower-fire` compares against deployment commit `198ef68`, so that iteration changes only the stream. It captures a fixed nozzle across two firing intervals, a full sweep and the final-pulse fade on Mire/Ember for base/Plasma/Cryojet, with whole colour/grayscale and zoom. Inspect `before/after-*-fire-*-{flow,sweep,stop}-{game,zoom}.png`. These are controlled actual-renderer poses; browser combat still needs checking. Reject a static ribbon, detached origin, harsh pulse gaps, large opaque blobs hiding enemies, or bright trails left after stopping. `tests/flamethrower-jet-art.cjs` rejects frozen flow using the same motion contract. Neither tests nor captures have been run by the agent.
