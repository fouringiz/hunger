# Flamethrower — approved concept, runtime integration pending verification

User approved the concept in this chat (2026-10-29) and requested integration.
The approval covers the concept, not the assembled gameplay appearance.

- Approved image: `reports/generated/flamethrower/flamethrower-concept-v1.png`.
- Built-in ImageGen separated the same design into foundation, overhead head/nozzle and one upright tank; prompt in `flamethrower-v1.prompt.txt`.
- Generated source: `reports/generated/flamethrower/flamethrower-parts-v1.png` (2172×724, ignored). Source hash and measured rectangles are in `../hunger-flamethrower-v1.frames.json`.
- Offline pack: `node tools/bake-flamethrower.cjs [source.png]` → `assets/hunger-flamethrower-v1.png` (768×256 RGBA) and the frame table. Only the final atlas is committed; studies stay outside Git.
- Foundation: 44×34 game units, same planted footprint as the other guns. Head: 42×28 in the projected ground plane, pivot (13,13), mounting height 12. Two tanks: 11×22, mounted at head-plane offsets (-8,±13); each stays upright, sorted behind/in front of the head by its projected depth.
- Exact continuous yaw uses existing `weaponProjection`, not discrete directional frames. Muzzle is 29 units along the projected head centreline. Pilot is orange for base/Plasma, cyan for Cryojet, dimmed when paused/selling.
- Loading/failed images retain a vector fallback. New rendering never reads canvas pixels.
- Scope: presentation only. Combat, balance, sweep, warmup, route, Gate distance and platform positions were not edited. Existing flamer construction/pause/sale behavior is retained; no new deployment animation.

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
open prototype/index.html
```

The capture command uses `loadWorld` from `capture-organic-world.cjs`, compares against pre-integration revision `58c1e8eeb350927ec16a2723eecb91171a71f718`, and checks both simulation fingerprints. It writes actual-game before/after colour, grayscale, full-turn and full-sweep images for Mire and Ember under `reports/generated/flamethrower/`. It needs the local ignored approved reference only for `reference-and-game.png`.

In the disk browser, build a Flamethrower, let it fire, pause/resume, and check Plasma/Cryojet with the console open. No `SecurityError`, missing image or drawing exception should appear. Node captures and mocked canvas errors do not establish this browser result.

Tests and game capture have NOT been run by the agent. No before/after gameplay images exist yet. Inspect the actual frames before claiming visual completion; a second independent review is required before merging a visual PR.
