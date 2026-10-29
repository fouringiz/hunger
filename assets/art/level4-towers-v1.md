# Level 4 towers — sprite integration v1

User-selected designs, approved 2026-10-29: Machine Gun C, Rifle C, Tesla C,
Prism A, Howitzer A, Cluster A, Plasma C, Cryojet C. The corrected combined sheet
is preserved at `references/towers/level4-selected-approved-v1.png`.

## Assets and reproduction

- `../hunger-level4-towers-v1.png`: final 2048 × 2048 transparent atlas, 8 rows,
  8 cells per row, 256 px per cell. Rows follow the selection order above.
- `../hunger-level4-towers-v1.frames.json`: source hashes, source bounds, per-family
  scale, mount pivots and annotated muzzle points.
- Six directional families have eight poses E / SE / S / SW / W / NW / N / NE.
  Tesla and the vertical Cluster mortar each have one fixed-camera pose.
- `../../tools/bake-level4-towers.cjs`: connected alpha-object packing; ignores
  disconnected debris, locates the bottom peg, uses one scale per family, keeps
  a common mount at cell (128, 240). No game renderer is executed by the bake.
  Source PNGs are under ignored `reports/generated/level4/sources/` in the authoring
  checkout. Exploratory sheets are excluded from Git.
- Rebuild with `node tools/bake-level4-towers.cjs [source directory]`. The tool
  writes an inline-table candidate at `reports/generated/level4/runtime-table.json`;
  when changing the bake, copy it into `LEVEL4_ART` in `prototype/index.html`.
  The user-run art contract checks the embedded table against the atlas metadata.
- Generation: built-in ImageGen, using the approved sheet as a design reference.
  Exact prompt set and output identities are in `level4-towers-v1.prompt.txt`.

## Implemented presentation

Level 4 selects a dedicated upper assembly by its existing specialization. The
44 × 34 foundation remains stationary; authored views turn around a common mount
without rotating upright parts in the canvas plane. Existing levels 1–3 retain
their rendering. Loading/failed-image states retain the previous fallback.

Machine Gun: rapid shallow recoil and animated barrel-face marks. Rifle: slower,
deeper recoil. Howitzer: heavy recoil and recovery. Cluster: vertical recoil and
side-drum indexing marks, with the existing one-carrier/five-bomblet flight.
Tesla: successive charge bands and a brief electrode arc on an actual discharge.
Prism: lens pulse and a straight gold single-target flash. Plasma/Cryojet: active
emitter glow and the existing animated fuel/coolant stream, now starting at the
selected sprite's nozzle.

The upper rises through the socket when the branch changes and retracts during
sale; the first real shot takes precedence over cosmetic assembly. All timing
is presentation state. No new combat delay or gameplay state is introduced.
Shells retain their launch point while the tower later turns or recoils.

No combat, targeting, balance, PATH, GATE_D or platform-position edits. No runtime
canvas pixel reads or JSON fetch. No simulation restamp is required by the
intended scope; actual fingerprint parity is part of the user-run capture.

## Observable criteria and evidence status

| Criterion | Evidence/status |
| --- | --- |
| Each branch preserves the selected design and a distinct silhouette | Approved concept; final atlas opened and inspected. In-game scale/perspective/readability pending. |
| Fixed base and upright axes throughout a complete turn | Implemented with separate base and directional upper sprites; user-run art contract and full-turn capture pending. |
| Muzzle, flash, beam and stream attached throughout turn/recoil | Per-frame annotations and shared pose; contract and close-up game frames pending. |
| Complete attack, upgrade, pause and sale cycles have no gaps/pops/sliding | Implemented; actual-game cycles pending. |
| Towers/enemies remain the most contrasting elements, including grayscale | Whole-frame and grayscale capture prepared; no gameplay evidence yet. |
| Combat remains identical | Only draw-side code changed by diff inspection; fingerprints and live-tick parity not yet run. |
| Disk-browser game opens without SecurityError | Pixel-free path prepared; actual `file://` console check pending. |

Known limitations to inspect critically: eight discrete headings may visibly step;
generated views can have small shape/lighting differences; the source peg and
muzzle annotations need close-up confirmation; rear-view emitters may be occluded
by their housing; the golden Prism lens may dominate nearby enemies in grayscale.
Mechanical motion is layered over static directional sprites, not an authored
frame-by-frame animation of every piston or armor plate.

## User-run checks (from repository root)

```sh
node tests/level4-tower-art.cjs
npm test
node tools/capture-organic-world.cjs --level4 machine-gun
```

Run one branch at a time, inspect it, then move to the next. Replace `machine-gun`
with `rifle`, `tesla`, `prism`, `howitzer`, `cluster`, `plasma`, or `cryojet`.
The actual-game capture compares against commit `2308926`, independently in Mire
and Ember, and checks unchanged rules/source fingerprints and identical live-tick
combat signatures. It writes whole color/grayscale frames, full-turn close-ups,
upgrade/sale strips, a 2.5-second attack cycle (151 close-up frames), paused scenes
and reference/game comparison. This is not browser validation or artistic approval.

Expected evidence paths (not yet generated):

- `reports/generated/level4/<branch>/before-{mire,ember}-whole.png`
- `reports/generated/level4/<branch>/after-{mire,ember}-whole.png`
- `reports/generated/level4/<branch>/{before,after}-{mire,ember}-{turn,upgrade,attack,sale}.png`
- `reports/generated/level4/<branch>/after-{mire,ember}-attack-whole-gray.png`
- `reports/generated/level4/<branch>/{before,after}-{mire,ember}-cycle/000.png` through `150.png`
- `reports/generated/level4/<branch>/reference-and-game.png` and `results.json`

Finally open `prototype/index.html` directly from disk and inspect the console,
all eight branches, a full turn and full firing/upgrade/sale cycles. Do not call
visual work verified without opening the user-run before/after game frames. A
second visual review remains required before merge.
