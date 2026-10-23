# Active visual work — checkpoint, 2026-10-23

VISUAL DEFECT CONFIRMED BY USER; WORK NOT COMPLETE. The technical checks below passed but did not establish a clear approach into the Gate. Recovery commits: dea6f70 and 8e2d03f.

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
- Campaign slots (zero based): 12 now (770,260), 13 now (540,460), 15 now (800,160). All other slots and path unchanged. Legacy presets keep old grid and v4 Gate.
- Cached ground and static platform tops are separate. A shared-boundary 10 by 6 surface deformation makes the map breathe; contact texture displacements, wet ridges, temporary crawling tracks, crisp lower-body/foot occlusion and slime strands connect creatures to the ground. Tracks are presentation-only, capped at 128 and expire after 1.35 seconds.
- New Forager: eight authored side crawl poses plus eight heading masters from built-in imagegen; exact prompts and source PNGs are in assets/art/. Native normalization packs 16 headings by 9 cells (rest plus 8 gait poses) into hunger-forager-mire-v2.webp. Front/back are real source views, replacing the rejected thin-card attempt. Intermediate views/gaits are inferred; human approval still pending.
- The attached reference is RGBA-identical to references/enemies/forager/forager-approved-v1.webp. New generated poses preserve its color/identity direction but are not pixel-identical original anatomy.
- Runtime uses matching foot-contact data copied from forager-low-crawl-v2.contacts.json into FORAGER_MIRE_CONTACTS. The bake tool now updates the inline constant automatically; a focused test checks synchronization.

## Final validation

- All 144 atlas cells pass clear-margin, maroon/ivory visibility and volumetric north/south checks.
- Current Forager tests pass every authored pose, stop/travel/Sprinter behavior, heading turns, fallback, combat-state invariance and exact baked/runtime contact synchronization.
- 29 core scenarios, 4 balance-preset scenarios, 6 replay-sweep groups/all 8 historical games, focused world/buildup/sale/range/coherent-art tests pass after final slot/art changes.
- Current native captures: 180 populated frames and 90 empty frames for each campaign palette and the historical grid. These check read-only rendering, all building footprints, cyan coverage across the full incoming channel, breathing unoccupied ground and fixed pedestal tops.
- Media: assets/art/previews/living-mire-runtime-v2.mp4 (whole map), forager-living-mire-runtime-v2.mp4 and .gif (close crop from actual game frames), and v7 WebP stills. These are native Canvas captures, not browser screenshots.

## Resume from here

The user showed that the liquid channel still meets the left stone jamb before reaching the portal; the opening lies farther right and lower than the approach. This remains unfixed. The cyan-pixel test at the exit, even across the channel section there, does not check the intervening approach through the masonry. The previous completion claim was incorrect.

Next implementation task, when requested: align the actual approach and portal so the entire channel enters through an unobstructed opening. First add a regression that fails on this known bad layout, covering the full approach width and architectural depth; then inspect the actual rendered traversal. This documentation commit does not fix the Gate. Follow the root AGENTS.md verification rules and do not merge PR #31. Browser/mobile performance and final subjective motion quality are not established by native checks. No fluid solver or recovered 3D model is claimed; non-side gaits and halfway headings are bounded interpolations from the eight generated heading masters.

Source/provenance/rebuild details: assets/art/living-mire-runtime-v2.md. Rebuild assets with FORAGER_CANVAS_MODULE=/private/tmp/hunger-canvas/node_modules/@napi-rs/canvas node tools/bake-forager-crawl-v2.cjs. Native capture uses WORLD_CANVAS_MODULE with the same module path. Prior browser file URL policy denial must not be bypassed. Do not bulk-copy scratch: it contains rejected geometry-only experiments and an obsolete early MP4.

## Gate correction — red regression checkpoint

Current task: fix the blocked approach, not change Forager art. tests/gate-approach.cjs samples the full incoming ribbon against the actual upright Gate layers. It must fail on the existing left-jamb obstruction before placement/path changes. tools/capture-organic-world.cjs now exports loadWorld for the same native renderer harness. No Gate/path correction has been applied at this checkpoint.

## Gate correction — geometry checkpoint

Campaign route now rounds the lower approach (70-unit and 50-unit bends) and enters northward at (900,420), instead of crossing the left jamb eastward. The original accepted v6 artwork remains; its box is 420×409 with threshold anchor (.51,.92). Campaign slots 12 and 15 move to (740,260) and (780,100). Preset route, gate and slots remain historical.

Verified: zero masonry intersections along the complete incoming ribbon; the same test rejects the b7b620a route/placement with 1091 hits. The actual leak position equals the rendered threshold. Empty native frames verify cyan across the incoming normal and all 16 tower footprints clear of Gate layers. Whole-map native frame inspected. Pending: actual creature traversal capture, game/replay regression checks and final visual review. Do not claim completion yet.
