# Shared foundation for all weapons

Approved by the user: all four weapon families, levels 1–3 and every level-four
branch use the exact square Turret foundation, same size/height/position and
central bearing. Head silhouettes remain distinct. This implementation is a
separate visual iteration after `528cb0b`; earlier verification does not cover it.

The runtime reuses low-buildings cell 0 at (-22,-17), size 44×34, with one socket
centre at (0,-5.5). Basic Cannon/Flamethrower and level-four Cannon/Flamethrower
stop drawing their separate bases. Head seating and muzzle share the new socket.
The foundation stays whole and stationary during assembly/retraction; the upper
still rises/retracts. Existing art pixels and layout stay byte-unchanged. The old
Flamethrower base tile remains available for historical before-captures.

## Acceptance and current evidence

| Observable criterion | Current status |
| --- | --- |
| Same foundation silhouette, scale, height and placement across all families and levels | Shared drawing path prepared; game frames pending |
| Same central mounting ring, no holes or floating heads during turn/recoil/build/pause/sale | Shared socket and supports prepared; contact regression and complete cycles pending |
| Foundations stay planted while heads move | Shared fixed base through all animation paths; test/captures pending |
| All heads remain recognizable at game scale and share platform camera | Sprites unchanged; whole/close comparison pending |
| Towers and enemies stay dominant in grayscale | Grayscale captures prepared, not generated |
| Combat and disk-browser operation remain intact | Simulation unchanged; parity tests and file-origin console check pending |

No tests, captures or browser checks were run by the agent, per the agreement.
User results on 2026-10-29: full suite failed at the Flamethrower negative
head-emergence case (the mutation targeted the new support instead of the head).
A precise unique-target mutation is prepared; its rerun and full suite are pending.

The user's Howitzer capture completed: identical rules `9d3c412e`, source
`5750d1fe` and 151 live combat steps in Mire and Ember. Opened the reference/game
pair, Mire whole before/after and after-upgrade strip. The square base is present;
the projected Howitzer head appears much flatter than the approved elevated gun.
No visual acceptance: full cycles, Ember/grayscale and other branches are still
pending review. The correction to the test does not change these game frames.

Opened evidence (actual game, captured by the user):

- [Before Mire whole](generated/common-tower-base/howitzer/before-mire-whole.png)
- [After Mire whole](generated/common-tower-base/howitzer/after-mire-whole.png)
- [Reference and game](generated/common-tower-base/howitzer/reference-and-game.png)
- [After upgrade and grayscale strip](generated/common-tower-base/howitzer/after-mire-upgrade.png)

Do not call this visually verified without completing the remaining checks.

## User-run checks from the PR checkout root

```sh
node tests/common-tower-foundation.cjs
node tests/level4-seating.cjs
npm test
node tools/capture-organic-world.cjs --tower-base howitzer
```

Inspect that branch first; repeat with `cluster`, `plasma`, `cryojet`,
`machine-gun`, `rifle`, `tesla`, `prism`, one at a time. These captures compare the
actual game renderer against `528cb0b`, isolating the common-foundation change.
They include levels 1–3, a full construction cycle, turn/upgrade/attack/pause/sale,
whole views, close-ups and grayscale, with exact live combat parity checks.

Evidence paths (Howitzer generated; only the views listed above inspected; other branches pending):

- `reports/generated/common-tower-base/<branch>/{before,after}-{mire,ember}-whole.png`
- Same directory: `*-level{1,2,3}-whole.png`, `*-whole-gray.png`, `*-levels1to3.png`
- Same directory: `*-{build,turn,upgrade,attack,pause-cycle,sale}.png` and `*-zoom.png`
- Same directory: `{before,after}-{mire,ember}-build-cycle/{000..054}.png`
- Same directory: `{before,after}-{mire,ember}-cycle/{000..150}.png`
- Same directory: `reference-and-game.png` and `results.json`

Compare reference/game at equal foundation width. In a separate rejection pass,
look for open sockets, detached supports, tank/base overlaps, clipping as a head
emerges, a pop at assembly completion, excessive head size, weak grayscale
contrast and mismatched perspective. Open `prototype/index.html` from disk and
inspect the console and full cycles. Independent review remains required before
merging PR #69.
