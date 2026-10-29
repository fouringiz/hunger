# Iteration 1 — branch badge

Status: implemented and checked; awaiting the user's verdict. Iterations 2 and 3
have NOT started. This report approves no head placement, perspective or rotation.
The user explicitly authorized agent-run npm/capture checks for this iteration.

## Observable requirement

At level 4, loaded specialization art is visible without the round branch-letter
badge covering its head. If that specialization's art is loading or failed, keep
the badge to identify the fallback. An unrelated missing atlas must not restore
it on an otherwise loaded head. Ready, paused and selling towers follow the rule.

Implementation: the existing branch-badge block now checks the same per-branch
readiness as the specialization renderer. No heads, anchors, art pixels, combat,
targeting, balance, PATH, GATE_D or platform positions changed.

## Tests and capture results

- `node tests/level4-branch-badge.cjs`: PASS. Eight specializations × three tower
  states × four image states = 96 cases. Both the circle and its letter are
  checked. Loaded cases must actually draw the specialization sprite; missing
  cases keep the correct initial. The exact `c00cc8e` renderer fails the new test.
- `npm test`: PASS, including `tests/leech-crawl-atlas.cjs` (part of the regular
  `tests/*.cjs` suite). Log: `reports/generated/level4-badge/npm-test.log`.
- No existing test was rewritten. The new test expresses the requested badge
  behavior; no seating or rotation criterion was changed in this iteration.
- All three matching captures PASS, against pre-iteration `c00cc8e`:

```sh
node tools/capture-organic-world.cjs --tower-base rifle --badge-review
node tools/capture-organic-world.cjs --tower-base howitzer --badge-review
node tools/capture-organic-world.cjs --tower-base prism --badge-review
```

`--badge-review` preserves the normal tower-base scenes, selects the exact
pre-badge baseline, and writes separate evidence instead of overwriting earlier
foundation captures.

| Branch | Mire | Ember | Rules/source fingerprints |
| --- | --- | --- | --- |
| Rifle | 151 identical live steps | 151 identical live steps | `9d3c412e` / `5750d1fe` |
| Howitzer | 151 identical live steps | 151 identical live steps | `9d3c412e` / `5750d1fe` |
| Prism | 151 identical live steps | 151 identical live steps | `9d3c412e` / `5750d1fe` |

An additional offline pixel audit compared 1650 before/after image pairs:
complete 151-frame attack and 55-frame construction cycles plus every saved
turn, upgrade, pause and sale sample for all three branches in both zones.
There were zero changed pixels outside the badge footprint. Results and the
reproduction script are `reports/generated/level4-badge/{audit.json,audit.cjs}`.
This establishes the scope of the delta; it does not certify the existing heads.

## Actual-game evidence

Common root: `reports/generated/level4-badge/`.

| Branch | Before close turn | After close turn |
| --- | --- | --- |
| Rifle | `rifle/before-mire-turn.png` | `rifle/after-mire-turn.png` |
| Howitzer | `howitzer/before-mire-turn.png` | `howitzer/after-mire-turn.png` |
| Prism | `prism/before-mire-turn.png` | `prism/after-mire-turn.png` |

For each branch, the directory also contains:

- `{before,after}-{mire,ember}-whole.png`: full scenes.
- `{before,after}-{mire,ember}-attack-whole{,-gray}.png`: combat and grayscale.
- `{before,after}-{mire,ember}-{turn,upgrade,attack,pause-cycle,sale}.png` and
  corresponding `-zoom.png`: motion strips, including grayscale rows.
- `{before,after}-{mire,ember}-cycle/{000..150}.png`: complete actual attack cycle.
- `{before,after}-{mire,ember}-build-cycle/{000..054}.png`: complete build cycle.
- `reference-and-game.png`: approved sheet beside actual rendering, equal
  foundation width. `results.json`: matching simulation results.

[Before/after comparison board](../generated/level4-badge/before-after.png) is
composed only from first-turn crops of those actual game captures, without
rescaling the foundations. Columns are Mire before/after and Ember before/after;
rows are Rifle, Howitzer, Prism.

Opened: the board (both zones and all three heads), Rifle/Prism Mire whole,
Howitzer Ember whole, Rifle Mire and Prism Ember combat grayscale whole frames.
The rejection pass confirms the round badge no longer hides the receiver,
barrel or Prism lens. No other pixels move in the audited pairs. Towers and
creatures are discernible in the sampled grayscale scenes, but the existing
busy ground, head perspective and overall visual hierarchy are not approved by
this narrow change. Rearward placement/visible bearing disk and flattened heads
remain the reported defects for iterations 2 and 3. Existing contact tests do
not establish the requested <=2px bearing-anchor distance; that test is pending.

Native capture does not establish real file-origin browser success. No new
runtime canvas pixel read was introduced. Real file:// console validation remains
pending. No merge; stop here and wait for the user's iteration-1 verdict.
