# PR #69: foundation and continuous aiming

Implementation is prepared. Tests, new in-game frames and disk-browser validation
have NOT been run by the agent, by agreement. Previous green tests and screenshots
precede these edits. Neither finding is visually verified yet.

## Iteration 1: Voltaic foundation

The `--voltaic-base` capture pins its AFTER to `acb6218` to exclude the second
iteration. It does not use the later working-tree heads.

Levels 1–3 now draw one new neutral capacitor upper on the same cell-0 foundation
and filled bearing as Tesla/Prism. Deployment, retraction and charge/shot origin
use that upper. Before baseline `a434efa`, candidate checkpoint `acb6218`.

Acceptance: the level-3 -> Tesla/Prism handoff changes only the upper. The base
must keep its exact shape, scale, position and platform perspective. No open
socket, floating upper, clipped terminal or collision with the badge; terminal
and electrical effects agree. Inspect build, pause, sale and full discharge cycle.

## Iteration 2: continuous aiming

Six aimed heads now use new overhead art and the existing continuous
`weaponProjection`, with shallow side layers and an upright support. Tesla and
vertical Cluster stay stationary. Head, recoil, muzzle and firing effects share
the transform; no 45-degree frame selection. Before baseline `acb6218` isolates
this finding from the foundation change.

Acceptance: tiny changes of target direction immediately change the head and
muzzle; no jumps at the old pose boundaries or the ±π seam. The foundation stays
fixed. Barrel/nozzle remains attached through full recoil, rotation and sale.
Check all six silhouettes against the approved sheet at equal foundation width.
Particularly look for flattened Prism petals, implausible Howitzer elevation,
lighting that turns with a flat texture, over-wide heads, and the forward-facing
barrel clipping the base. These are rejection criteria, not accepted deviations.

For BOTH iterations: inspect the whole Mire/Ember frame and close-up, full motion
cycles, and grayscale. Towers/enemies must remain the most contrasting objects;
all map objects must share platform camera perspective. Check overlap, gaps,
sliding and silhouette readability in an explicit second pass. Passing tests do
not establish any of these visual qualities.

## User-run checks

The repository checkout for this PR is `/private/tmp/hunger-level4-sprites`.
Commands below are run from its root:

```sh
node tests/voltaic-art.cjs
node tests/level4-tower-art.cjs
node tests/level4-seating.cjs
npm test
node tools/capture-organic-world.cjs --voltaic-base tesla
```

Inspect that iteration before moving to `--voltaic-base prism`. Then capture one
aimed branch at a time:

```sh
node tools/capture-organic-world.cjs --level4-yaw machine-gun
```

Repeat with `rifle`, `prism`, `howitzer`, `plasma`, `cryojet`. The dense turn cycle
has 361 PNGs (`000`–`360`, one degree per frame); the attack cycle has 151 frames.
Each command compares actual game rendering against its pinned baseline, checks
unchanged fingerprints and exact live combat parity, and writes a reference/game
pair scaled by foundation width. The contact test still rejects the known old
empty-socket renderer and a deliberately raised upper. The yaw test must reject
the same renderer with deliberately quantized projection.

Expected evidence paths, NOT yet generated or inspected:

- `reports/generated/voltaic-base/{tesla,prism}/{before,after}-{mire,ember}-level3-whole.png`
- `reports/generated/voltaic-base/{tesla,prism}/{before,after}-{mire,ember}-upgrade.png`
- `reports/generated/level4-yaw/<branch>/{before,after}-{mire,ember}-whole.png`
- `reports/generated/level4-yaw/<branch>/{before,after}-{mire,ember}-turn-cycle/{000..360}.png`
- Both directories also contain `*-whole-gray.png`, enlarged turn/upgrade/attack/
  sale sheets, attack-cycle PNGs, paused views, `reference-and-game.png`, results.

Finally open `prototype/index.html` directly from disk and inspect console and
complete cycles. Native captures do not exercise browser file-origin restrictions.
No combat or geometry changes, no replay restamp. Independent review of actual
before/after frames remains required before merging.
