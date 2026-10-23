# Active visual work — checkpoint, 2026-10-23

IN PROGRESS. Continue this work; this checkpoint is not a claim of user visual acceptance.

## Where

- Existing PR #31: https://github.com/fouringiz/hunger/pull/31, branch codex/organic-world-runtime.
- Working copy: /Users/home/.codex/worktrees/ancient-gate-review/game. Commit here and push HEAD to the same PR branch; do not create a different PR or merge.
- Main /Users/home/github/game contains separate mechanics work; leave it alone.
- Staging scratch: /private/tmp/hunger-living-mire-v2. Current useful changes are copied into the working copy and checkpointed in Git. Scratch includes discarded experiments: do not bulk-copy it.

## User's current request and authorization

- Whole channel must enter the portal. Moving nearby build slots and changing the route are allowed.
- Forager must crawl low through interactive sludge, not walk like a raised-rear cockroach over a blurry oval. Match maroon flesh and ivory armor to the attached reference.
- Whole ground must breathe; reference motion is assets/art/previews/forager-sludge-cycle-v3.gif.
- Make intermediate checkpoints so work survives token exhaustion.

## Implemented at this checkpoint

- Same v6 Gate art, now 330 by 430 presentation units with threshold anchor (.56,.87); exit stays (930,420).
- Campaign slots (zero based): 12 now (770,260), 13 now (740,480), 15 now (800,160). All other slots and path unchanged. Legacy presets keep old grid and v4 Gate.
- Cached ground and static platform tops are separate. A shared-boundary 10 by 6 surface deformation makes the map breathe; contact texture displacements, wet ridges, temporary crawling tracks, crisp lower-body/foot occlusion and slime strands connect creatures to the ground. Tracks are presentation-only, capped at 128 and expire after 1.35 seconds.
- New Forager: eight authored side crawl poses plus eight heading masters from built-in imagegen; exact prompts and source PNGs are in assets/art/. Native normalization packs 16 headings by 9 cells (rest plus 8 gait poses) into hunger-forager-mire-v2.webp. Front/back are real source views, replacing the rejected thin-card attempt. Intermediate views/gaits are inferred; human approval still pending.
- The attached reference is RGBA-identical to references/enemies/forager/forager-approved-v1.webp. New generated poses preserve its color/identity direction but are not pixel-identical original anatomy.
- Runtime uses matching foot-contact data copied from forager-low-crawl-v2.contacts.json into FORAGER_MIRE_CONTACTS. If rebuilding the atlas changes contacts, update the inline constant too.

## Evidence already obtained

- Latest atlas: all 144 cells pass clear-margin, maroon/ivory visibility and volumetric north/south checks (tests/forager-crawl-atlas.cjs).
- Latest populated native capture: 180 actual renderer frames, drawing leaves replay state unchanged, all 16 full-height pad footprints clear, actual exit cyan.
- Both palettes and historical layout passed 90-frame native captures; empty campaign captures check the entire channel section (y +/-33 at exit), visible unoccupied ground deformation, and fixed platform tops (allow <=3 RGB levels from translucent source pixels).
- 29 combat scenarios and 6 replay-sweep groups/all 8 historical recordings passed before the final art-only heading replacement. Simulation functions have not changed since. Focused buildup and sale/range checks passed too.
- Forager travel-cycle test was updated for the larger authored cycle; rerun the final version with all current views.

## Next, in order

1. Review latest actual game/close captures, especially north/south views and planted/lifted feet. Do not claim fully simulated fluid or real recovered 3D anatomy.
2. Run final focused suites and native captures from the real working copy. Optional native Canvas module is /private/tmp/hunger-canvas/node_modules/@napi-rs/canvas. Use WORLD_CANVAS_MODULE for capture and FORAGER_CANVAS_MODULE for atlas rebuild/tests.
3. Generate current 6-second full-map and close motion media: capture-organic-world.cjs --motion --frames writes PNGs under reports/generated/organic-world-mire-motion and close/. Encode with ffmpeg. Existing living-mire-runtime-v2.mp4 in scratch is obsolete: do not deliver it.
4. Update art provenance/runtime docs and PR description around the final result; no claim of final browser/device QA. Prior file URL policy denial must not be bypassed.
5. Commit final checkpoint/update the same PR #31, show actual motion media, and clearly state what was tested.

Native captures are not browser screenshots. Current v7 viewport stills predate the final heading replacement but contain the same Gate/terrain; refresh before final delivery. No fluid simulation or gameplay mutation is intended beyond the explicitly allowed slot redistribution.
