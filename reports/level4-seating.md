# Level 4 seating — reported floating upper assemblies

Status: correction prepared; user-run verification and after-images pending.

The user reports that prior tests passed. They supplied game close-ups of Tesla,
Howitzer, Machine Gun and Plasma: the upper assembly is perched on a narrow peg,
while most of its foundation socket remains visibly empty. The approved reference
shows the broad upper bearing resting on its foundation. Prior tests proved that
frame selection, base matrix and muzzle math agreed; they did not prove contact.

The existing user-run Machine Gun capture also records identical combat
fingerprints (`9d3c412e` / `5750d1fe`) and 151 live ticks in Mire and Ember. This is
pre-correction evidence only.

## One iteration: bearing/socket contact

- Find the wide bearing above the narrow insertion peg in each source pose.
- Place that bearing on the foundation socket; hide the inserted peg behind its near lip.
- Close the empty socket with a fixed metal bearing. Its near lip overlaps the
  upper's lower edge; recoil stays supported by the same stationary bearing.
- Preserve sprite scale, silhouette, authored heading, platform and combat data.
  Muzzle and emitter positions follow the corrected upper placement.
- Atlas image pixels and layout remain unchanged. Only draw-side geometry and
  anchor metadata change; no new atlas filename is required.

## Observable acceptance and current evidence

| Criterion | Evidence/current result |
| --- | --- |
| Broad upper bearing meets the foundation without a suspended peg or empty pit | Four user before-images and native Machine Gun frames establish the defect. Corrected frames pending. |
| Contact remains through every authored heading and the full recoil/recovery cycle | Per-pose seat plus stationary bearing implemented; new native contact regression and game cycles not run. |
| Near lip occludes the inserted lower part, without clipping away visible machinery | Peg inserted behind the near lip and clipped below the foundation plane; actual game inspection pending. |
| Base and platform remain planted, scale and camera stay consistent | Draw-side implementation keeps their coordinates/matrices; comparison pending. |
| Muzzle still follows the visible emitter after seating | Shared corrected pose; updated art contract and game close-ups pending. |
| Towers/enemies remain readable in grayscale and the support does not dominate | Whole/color/grayscale views prepared; review pending. |

The native regression checks changed pixels over the open socket and overlap of
the actual atlas upper with its actual fixed bearing mask. It must reject both
the exact prior renderer `e4d136f` and a raised upper over an otherwise closed
socket. Passing it is not artistic acceptance.

## Before evidence already available

User screenshots, copied without alteration into ignored generated reports:

- `reports/generated/level4-seating/user-before-tesla.png`
- `reports/generated/level4-seating/user-before-howitzer.png`
- `reports/generated/level4-seating/user-before-machine-gun.png`
- `reports/generated/level4-seating/user-before-plasma.png`

Existing actual-game capture, opened for source review:

- `reports/generated/level4/machine-gun/reference-and-game.png`
- `reports/generated/level4/machine-gun/after-mire-turn-zoom.png`

## User-run commands from this checkout's root

```sh
node tests/level4-seating.cjs
node tests/level4-tower-art.cjs
npm test
node tools/capture-organic-world.cjs --level4-seat machine-gun
```

Start with Machine Gun. Other keys: `tesla`, `howitzer`, `plasma`, `rifle`, `prism`,
`cluster`, `cryojet`. Review one branch before moving to another. The seating flag
compares only this correction against `e4d136f`, separately in Mire and Ember,
without overwriting original integration captures. Fingerprints and live-tick
combat results must still match.

Expected comparison paths — after-images do not exist yet:

- Before: `reports/generated/level4-seating/<branch>/before-mire-whole.png`
- After: `reports/generated/level4-seating/<branch>/after-mire-whole.png`
- Close turn: `reports/generated/level4-seating/<branch>/{before,after}-mire-turn-zoom.png`
- Full attack/recoil cycle: `reports/generated/level4-seating/<branch>/{before,after}-mire-cycle/000.png` through `150.png`
- Upgrade/sale: `reports/generated/level4-seating/<branch>/{before,after}-mire-{upgrade,sale}-zoom.png`
- Whole grayscale: `reports/generated/level4-seating/<branch>/{before,after}-mire-attack-whole-gray.png`

Equivalent Ember files use `ember` in place of `mire`. Inspect whole and close
views and every stage of the cycles; also look for clipping, sliding, new overlap,
lighting/camera mismatch and lost enemy readability. Open the game directly from
disk and check the browser console. Corrected behavior cannot be called verified
until these game images are generated and opened. Independent visual review is
still required before merge.
