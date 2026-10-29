# Howitzer design restoration — candidate awaiting user verification

Checkout: `/private/tmp/hunger-level4-sprites`
Branch: `codex/level4-sprites`; PR: https://github.com/fouringiz/hunger/pull/69
Previous committed baseline: d022ae3. No merge.

## Current scope

User rejected the Howitzer redesign in iteration 3: #89
https://github.com/fouringiz/hunger/issues/89
Restore the user's second-sheet identity while retaining sixteen directional
poses: compact olive body, paired long hydraulic cylinders/pistons, looping
hoses, vented side boxes and rear hatch, short narrow steel mounting peg.
The broad copper pedestal and simplified proxy housing are rejected.

## Prepared changes

- Exact user reference archived under
  `assets/art/references/towers/howitzer-selected-approved-v1.png`.
- Only Howitzer row4 and its sixteen measured bearing/muzzle anchors repacked
  into the existing v2 atlas. Dimensions/layout unchanged. Other metadata
  entries unchanged in source diff. Inline LEVEL4_ART updated to match.
- Selected raw source: exec-84d8655f-2fc0-4fbd-9e72-30feed66270d.png;
  prompts/provenance in `assets/art/level4-towers-v1.prompt.txt`.
- New narrow-peg test includes the actual rejected raster as a pinned fixture;
  no Git history reads in this new test. Existing tests are not rewritten.
- New --howitzer-design-review capture compares baseline source AND baseline
  atlas pixels from d022ae3, with separate output and exact user reference.
- Raw sheet and annotated anchor board opened during authoring. Offline atlas
  packing completed. No combat/targeting/balance/PATH/GATE_D/platform edits.

## Verification boundary

Prior d022ae3 tests/captures passed, but DO NOT validate this correction or its
art fidelity. User runs all tests, actual-game captures and file-origin browser
console checks. NONE run by the agent in this iteration. Pose spacing, camera,
seating, grayscale readability, effect attachment and complete cycles await
actual-game evidence and the user's visual verdict. Issue #89 remains open.

## Next user-run commands

From `/private/tmp/hunger-level4-sprites`:

    node tests/howitzer-design.cjs
    node tests/level4-seating.cjs
    npm test
    node tools/capture-organic-world.cjs --tower-base howitzer --howitzer-design-review

Expected root:
`/private/tmp/hunger-level4-sprites/reports/generated/howitzer-design-review/howitzer/`
Compare `user-approved-and-16-poses.png`, before/after Mire/Ember whole and
turn-zoom images, turn-cycle/000..096, live cycle/000..150, whole grayscale,
results.json. Open prototype/index.html from disk and inspect browser console.
Full criteria, expected paths and verification limits:
`reports/level4-review/howitzer-design-restoration.md`.

Then inspect user-supplied outputs/frames and address any failure. Do not claim
visual completion or merge before actual evidence and a second visual review.
