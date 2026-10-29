# Iteration 3 — sixteen authored views

Status: implementation prepared for the user's visual verdict. Iterations 1 and 2
were accepted before proceeding. This report concerns iteration 3 only. No merge.

## Result and observable criteria

| Criterion | Evidence and boundary |
| --- | --- |
| Machine Gun, Rifle, Prism, Howitzer, Plasma, Cryojet have 16 directional poses | Final v2 atlas has 16 different raster cells per moving family, selected in 22.5° world-yaw steps. `approved-and-16-poses.png` in each branch directory shows every authored view beside the approved reference at the same 88px foundation width. |
| Howitzer stays elevated; Prism petals stay upright and substantial | Authored volume replaces the flattened overhead projection. Compare Howitzer/Rifle/Prism reference boards and before/after close views. These are generated interpretations, not newly approved designs. |
| Camera, scale and light follow the approved sheet | Fixed elevated orthographic camera and upper-left lighting were specified in every whole-sheet generation. A shared bake scale is used per family. Reference boards permit direct comparison; small material/detail differences across generated views remain for human review. |
| Tesla/Cluster keep one fixed view | One frame each; offline audit confirms exact RGBA equality with their v1 cells. |
| Bearing stays on TOWER_SOCKET for all 16 poses/recoil | Seating test measures actual draw matrices: 490 authored heading/recoil states, max 1.800 native screen px against 2px. The actual 6-world-unit rearward shift is rejected; original coverage/contact thresholds retained. |
| Effects stay with the displayed head during switches | 60ms presentation transition shares its weighted pose/muzzle across head, flash, bloom and stream. Held headings resolve to one opaque authored image. Source-level muzzle anchors are independently checked against visible front/side sprite alpha. Actual flash/stream tests exercise 384 pre-switch/switch/midpoint/settled states and reject stale firing-angle origins. |
| No angular wrap seam | Selector checks cover 0/2π and ±π; all 16 actual pose switches preserve the initial muzzle position and converge to the next authored pose. Clamped wrap and instantaneous attachment switches are rejected. |
| No persistent translucent head while holding aim | A first angular-crossfade candidate was rejected after full-cycle inspection. Final renderer blends only during the 60ms pose change; an off-centre held heading must render one opaque sprite. A permanently blended negative is rejected. |
| No assembly gaps/pop, pause/sale break or foundation movement | Actual upgrade/pause/sale strips and full firing/turn cycles are provided. Deployment test covers 96 headings; early front-panel exposure and the historical flat-head final-frame pop remain rejected. |
| Combat/rules/map placement unchanged | All eight branches in Mire/Ember compare against `15ad9ed`; rules `9d3c412e`, source `5750d1fe`, 151 identical live steps per scene. Offline audit checks 928 unchanged lower-level/build-state pairs. No combat, targeting, balance, PATH, GATE_D or platform-position edits. |
| Readability in color/grayscale | Whole and combat-grayscale scenes are supplied. Bright ceramic/copper details and silhouettes can be compared against the same ground. Terrain remains busy, and brief transition softening should receive a second visual review. |

## Assets and renderer

- `assets/hunger-level4-towers-v2.png`: new 4096×2048 atlas, 256px cells, 98 poses
  (six ×16 plus two fixed). Filename changed because dimensions/layout changed.
- `assets/hunger-level4-towers-v2.frames.json`: own bearing/muzzle and source
  measurements for every pose, source hashes, rectangles and one family scale.
- Built-in `image_gen` used the approved
  `assets/art/references/towers/level4-selected-approved-v1.png`. Whole sheets were
  generated first, then narrowly corrected rear-view cells were normalized back
  into their sheets. Raw drafts remain ignored. Exact prompts, trial records and
  final output identities are in `assets/art/level4-towers-v1.prompt.txt`.
- `tools/bake-level4-poses.cjs` packs final art and emits the embedded table. No
  runtime JSON fetch, canvas pixel reads, image-plane projection or overhead
  extrusion remains for these heads.
- `hunger-level4-yaw-v1.png` and its metadata are deleted. `weaponProjection`
  remains for levels 1–3 and the existing Flamethrower, where it is still used.
- The 60ms transition uses a presentation WeakMap, not combat state. It does not
  delay attacks. Current displayed headings supply flash origins; in-flight
  shell launch points stay pinned. The iteration-2 recoil bound is preserved.

## Tests and legitimate changes to existing contracts

`npm test`: PASS, including `leech-crawl-atlas`.

- `level4-tower-art.cjs` formerly required overhead projection matrices and
  explicitly rejected quantized views. Those assertions contradicted the user's
  new 16-pose requirement. They are replaced with 16 selected/distinct source
  cells, upright camera, settled opacity, temporal attachment continuity, wrap,
  recoil, render parity, fallback and launch-pinning checks. Wrong rows, eight
  poses, rotating foundations, clamped wrap, instant muzzle switches, permanent
  blending and displaced muzzle helpers remain negative controls. An independent
  native-alpha check rejects a Plasma nozzle point displaced into clear air.
- `level4-seating.cjs` uses v2 for current rendering and archived metadata for
  historical negatives. Every authored heading is initialized independently;
  temporal transitions are exercised separately. The 2px, 75% coverage and
  physical-contact thresholds are unchanged. The former projected-support-only
  subcheck still runs for historical projected renderers, not a removed shaft.
- `level4-deployment-clip.cjs` filters the new atlas/blend image. Its narrow-clip
  negative applies to the exact previous flat renderer: the same narrow boundary
  is no longer a visible failure for upright art. The measured 99.5% handoff
  retention limit is unchanged; the original bad flat rendering still fails it.
- Badge and neutral-Voltaic tests update image names/dimensions and loading mocks
  for one v2 atlas. Existing foundation/badge/fallback assertions remain.
- New `level4-effect-anchors.cjs` checks actual draw paths, not only helper parity.
- New `capture-materials.cjs` rejects the overbroad declaration filter that omitted
  zone textures and silently showed vector terrain in an initial draft capture.
  Final captures require real zone art. Those draft frames are excluded below.

Native test/capture logs are local ignored files under:
`/private/tmp/hunger-level4-sprites/reports/generated/level4-poses/`

## Actual-game frames

Final evidence root (absolute):
`/private/tmp/hunger-level4-sprites/reports/generated/level4-poses/game/`

Branch directories: `machine-gun`, `rifle`, `tesla`, `prism`, `howitzer`, `cluster`,
`plasma`, `cryojet`. Zones: `mire`, `ember`.

| Evidence | Exact path below the absolute evidence root |
| --- | --- |
| Before/after board, both zones/all eight heads | `before-after.png` |
| Approved reference beside game, all eight heads | `reference-and-game-all.png` |
| Every authored pose beside approved sheet | `<branch>/approved-and-16-poses.png` |
| Whole scene before/after | `<branch>/{before,after}-<zone>-whole.png` |
| Combat whole scene in grayscale | `<branch>/{before,after}-<zone>-attack-whole-gray.png` |
| Full-turn samples and enlarged views | `<branch>/{before,after}-<zone>-turn{,-zoom}.png` |
| Complete timed turn, 97 consecutive frames | `<branch>/{before,after}-<zone>-turn-cycle/000.png` through `096.png` |
| Upgrade/pause/sale, enlarged | `<branch>/{before,after}-<zone>-{upgrade,pause-cycle,sale}-zoom.png` |
| Complete live firing cycle, 151 consecutive frames | `<branch>/{before,after}-<zone>-cycle/000.png` through `150.png` |
| All timed turn frames on one inspection sheet | `<branch>/all97-turn-review.png` |
| All firing frames on one inspection sheet | `<branch>/all151-review.png` |
| All upgrade/pause/sale samples on one inspection sheet | `<branch>/states-review.png` |
| Baseline, fingerprints and tick counts | `<branch>/results.json` |
| Lower-level/static-art audit | `audit.json` |

These are local ignored artifacts, not hosted PR images. Final atlas and measured
metadata are committed; exploratory sheets and heavy game captures are not.

From `/private/tmp/hunger-level4-sprites`:

```sh
npm test
for branch in machine-gun rifle tesla prism howitzer cluster plasma cryojet
do
  node tools/capture-organic-world.cjs --tower-base "$branch" --pose-review
done
```

`--tower-base` also produces the authored-pose/reference board without the review
flag. `--pose-review` chooses iteration-2 baseline `15ad9ed` and timed full-turn
capture instead of the older foundation-review baseline.

## Acceptance boundary

A short crossfade can still produce a soft doubled outline during its 60ms
transition. It is absent once aim is held. Generated hardware/petal details vary
slightly between views; the reference/pose boards are provided for that judgement.
Native tests establish selection, attachments, seating and simulation invariance,
not artistic acceptance or a real-browser playthrough.

The `file://` browser console check is NOT performed for this iteration. Open
`/private/tmp/hunger-level4-sprites/prototype/index.html` directly from disk, then
inspect all branches and the console before merge. Await the user's visual verdict;
do not merge automatically.
