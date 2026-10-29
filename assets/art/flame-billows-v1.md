# Fuel fire — four user photo references (2026-10-29)

User supplied four flamethrower photographs as direction for the existing jet. This iteration changes only that effect; tower/deployment, combat, burn and pool rules, sweep, range, route and platforms are not edited. Baseline for this iteration: `2308926` (the smooth narrow ribbon).

## Observable criteria from the photographs

| Criterion | Required gameplay evidence | Current status |
| --- | --- | --- |
| Narrow bright fuel stream at the nozzle, opening into a broad distant mass rather than a pointed ribbon | `reference-before-after.png`, whole/zoom views | Pending |
| Unequal rolling lobes with yellow-white internal heat and ragged orange/red translucent edges | Same-scale reference board and close views | Source atlas inspected; gameplay pending |
| Fuel visibly travels away from a stationary nozzle, grows, rolls and disperses | Full `*-flow-{game,zoom}.png` sequence; browser observation | Pending |
| Continuous connection through the sweep; soft final-pulse fade | Full `*-sweep-*` and `*-stop-*` sequences | Pending |
| Flame keeps the map camera and upward rise through all headings | Upright billow images placed in world depth; sweep/whole views | Code prepared; visual result pending |
| Enemy and tower silhouettes remain distinguishable, including grayscale | Whole/gray views with enemies inside and beside the plume | Pending |

Reject uniform balls, tiled repetitions, straight cell-edge cuts, needle-like tips, detached origin, popping/restarting puffs, opaque fire hiding the targets, or particles spinning with the screen-space gun angle. Do not substitute passing tests for these visual judgments.

## Implementation and assets

- Built-in ImageGen produced eight turbulent billow phases using all four supplied photos. First output rejected for tight cell spacing; one targeted edit added transparent padding. Full prompt set: [flame-billows-v1.prompt.txt](flame-billows-v1.prompt.txt).
- Selected raw source: `reports/generated/flamethrower/flame-billows-source-v1.png` (ignored). Four original references copied byte-for-byte to `reports/generated/flamethrower/references/fire-{1,2,3,4}.png` (ignored), so the review does not depend on the temporary clipboard paths.
- Final runtime atlas: `assets/hunger-flame-billows-v1.png` (512×256 RGBA, 4×2 cells of 128). Metadata/provenance: `assets/hunger-flame-billows-v1.frames.json`. Repack: `node tools/bake-flame-billows.cjs [source.png]`; common scale and centre anchor across all eight frames. The bake rejects empty cells or solid silhouettes crossing a cell boundary. No backgrounds/mattes or shadows were painted into the game.
- Ten billows advect and grow away from the nozzle; adjacent texture phases crossfade. Billow images remain upright, and their ground depth participates in the existing actor sort. The narrow bright fuel core is drawn after actors; broad textured volume is sorted beside them instead of painting all bodies over with a single bright overlay. Billow opacity is limited; actual readability remains to be judged from captures.
- Fire/Plasma use the photo-derived material. Cryojet retains its coolant appearance. Missing/loading atlas uses a widening procedural fallback. Both stop/fade using the already introduced 0.23 s presentation lifetime; simulation shot spacing remains unchanged.
- No runtime canvas pixel reads, new particle state, simulation RNG, or edits to fingerprinted simulation functions. The asset pack was generated and opened by the agent; tests/game captures/browser checks were not run.

## User-run verification from repository root

```sh
npm test
node tools/capture-organic-world.cjs --flamethrower-reference
open prototype/index.html
```

Capture outputs are expected under `reports/generated/flamethrower-reference-fire/`, not yet existing evidence:

- `reference-before-after.png`: photo 1, prior ribbon, new game plume, normalized nozzle-to-tip length, colour plus grayscale. Photo is side-on and game is elevated; use it to compare fuel expansion and texture while checking the game camera against its own platforms.
- `{before,after}-{mire,ember}-fire-{base,A,B}-whole{,-gray}.png`.
- `{before,after}-{mire,ember}-fire-{base,A,B}-{flow,sweep,stop}-{game,zoom}.png`: 1.33 s of fixed-nozzle flow (two advections and two complete texture clips), full 1.96 s sweep and last-pulse fade.

These are controlled poses rendered by the actual game via `capture-organic-world.cjs`; live combat still needs the disk-browser check. Compare whole scene and close views, then make a separate rejection pass. Check the real `file://` console for loading/drawing errors, especially tainted-canvas errors. Independent second review remains required before merging a visual PR.

`tests/flamethrower-jet-art.cjs` adds structural guards for widening textured volume, motion with fixed nozzle, upright billows, and missing-art fallback. The same guards reject ribbon-only, constant-size and frozen-billow variants. They do not establish photo correspondence or visual approval.

## Width follow-up

User requested broader fire. A smooth multiplier leaves the nozzle narrow and grows to 1.6× in the distant billows. Sprite size changes together with its centre placement, keeping the same forward reach. Core, texture, opacity, depth order and Cryojet are retained. This is a separate comparison against `c56b950`:

```sh
npm test
node tools/capture-organic-world.cjs --flamethrower-width
open prototype/index.html
```

Expected outputs are under `reports/generated/flamethrower-width/`, with the same before/after whole, grayscale, flow, sweep, stop and enlarged sheets plus a reference board. Reject a plume that is still too thin, loses its narrow origin, extends the visible range, hides enemy silhouettes or pops during a full cycle. The width regression rejects the previous narrow geometry; no user-run test or frame evidence has been supplied yet.

## PR transfer onto fresh main

The PR branch `codex/flamethrower-vfx` starts directly at fetched main `3eec37f01b65fda62275f37441babeb433679052`. Earlier iteration hashes above describe the original local branch; `c56b950` is not an ancestor of this new branch. For a reproducible PR comparison use:

```sh
npm test
node tools/capture-organic-world.cjs --flamethrower-reference --before 3eec37f01b65fda62275f37441babeb433679052
open prototype/index.html
```

This compares main's ribbon with the broad billow renderer while retaining main's level-four towers and effect anchors. The ignored photo at `reports/generated/flamethrower/references/fire-1.png` is required for the reference board and exists in the author's workspace. No new game captures or test results are claimed. The four-frame full-jet and six-stage smoke sheets are separate source assets; this runtime still uses the eight-phase billow atlas.
