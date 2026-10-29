# Howitzer design restoration — #89

PR #69. Baseline: d022ae3. This iteration addresses only the Howitzer identity
rejected by the user after iteration 3. No artistic acceptance is implied.

## Observable criteria

1. Retain the user's second-sheet construction: compact olive riveted housing,
   thick elevated olive barrel with perforated steel collar, TWO prominent
   ivory/copper hydraulic cylinders with long exposed dark piston rods, looping
   black hoses, vented side boxes and rear hatch, short narrow steel mounting peg.
   No broad copper pedestal and no simplified box body.
2. Sixteen ordered directional poses; camera, physical size and lighting stay
   consistent. Check full turn for apparent repeated directions, sudden changes
   of barrel elevation, hardware popping and transient doubled outlines.
3. Each pose has physically measured bearing/muzzle anchors. Retain the <=2px
   seating bound through recoil and the known-bad 6-unit rear shift control.
4. Compare actual game to the exact user reference at comparable head height,
   plus the original foundation-width reference. Inspect whole/close/grayscale,
   complete turn and live attack, not only a sheet of authored art.
5. Preserve simulation rules/source fingerprints and live ticks; no combat,
   targeting, balance, PATH, GATE_D or platform-position changes.

## Authoring / regression

The user reference is archived unchanged as
`assets/art/references/towers/howitzer-selected-approved-v1.png`.
Prompts and acceptance/rejection reasons are recorded in
`assets/art/level4-towers-v1.prompt.txt`. Heavy raw sheets/guides remain ignored.

New `tests/howitzer-design.cjs` checks that the bottom 4% of every actual atlas
pose terminates in a narrow peg (<=22% of the upper assembly's overall width).
It applies the SAME check to an unmodified tile from the actual rejected d022ae3
atlas and requires rejection. This protects the narrow-peg requirement only;
it cannot approve the complete design. Its pinned raster fixture is read
without Git history. Existing tests/thresholds are not rewritten for this fix.

The dedicated capture flag loads BOTH baseline source and baseline atlas pixels
from d022ae3; using the candidate PNG with old metadata would be an invalid
before/after. Output is separate from the previous iteration's evidence.

## Prepared candidate

Only the Howitzer row and its anchors have been repacked. Atlas dimensions and
layout remain 4096x2048 / 256px cells, so the existing v2 name is retained.
The other seven metadata entries and runtime behavior are unchanged in the
source diff. The 16 views retain the compact detailed body and narrow peg.
The source sheet and annotated bearing/muzzle board were opened for authoring;
this is not a substitute for actual-game captures.

## User-run commands (not run by the agent)

From `/private/tmp/hunger-level4-sprites`:

```bash
node tests/howitzer-design.cjs
node tests/level4-seating.cjs
npm test
node tools/capture-organic-world.cjs --tower-base howitzer --howitzer-design-review
```

Also open `prototype/index.html` from disk and check the browser console while
upgrading/aiming/firing the Howitzer. Node captures do not verify file-origin
SecurityError handling.

## Expected frame paths — pending generation by user

Root: `/private/tmp/hunger-level4-sprites/reports/generated/howitzer-design-review/howitzer/`

- `user-approved-and-16-poses.png`: exact user upper reference + original
  foundation reference + all16 actual-game poses.
- `before-mire-whole.png`, `after-mire-whole.png` (also `ember`).
- `before-mire-turn-zoom.png`, `after-mire-turn-zoom.png`.
- `{before,after}-{mire,ember}-turn-cycle/000.png` through `096.png`.
- `{before,after}-{mire,ember}-cycle/000.png` through `150.png`.
- `{before,after}-{mire,ember}-attack-whole-gray.png`.
- `results.json`: rule/source fingerprints and 151 identical live ticks.

All new tests, captures, browser checks and visual criteria remain UNVERIFIED
until the user supplies their results and frames. Prior green tests/captures
belong to d022ae3 and do not establish this correction's success.
