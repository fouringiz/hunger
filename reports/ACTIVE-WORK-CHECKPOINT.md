# Howitzer rotation #91 — source-design verdict pending

2026-10-30. Working branch codex/howitzer-yaw-poses, based on accepted PR #90 head 7fe0f25. PR #90 is unchanged by this branch.

- Previous #89 appearance accepted by user ("сойдет"); previous user tests passed and captures reviewed as recorded in reports/level4-review/howitzer-design-restoration.md. Accepted source/runtime art is unchanged.
- Criteria for #91: distinct equally spaced directions around a full turn; no doubled silhouettes; same accepted construction/palette and direct seating; continuous muzzle/flash/stream attachment; unchanged simulation. None is declared fixed.
- Diagnosed independent causes: authored poses repeat/skip depicted angles; 60ms silhouette crossfade creates a transient double contour. A simple hard sprite switch was considered and REJECTED before implementation because it violates the continuous muzzle requirement. Existing tests are untouched, including continuity tests.
- Three generated sheets rejected: repeated yaw, missing long twin hydraulics, simplified rear mechanism. New local Blender guide fixes all16 yaw angles physically; ImageGen style transfer produces an unconnected candidate retaining long twin rods and rear hatch. It changes housing and hose routing, so user must judge the concrete design comparison before replacing accepted art.
- Candidate: reports/generated/howitzer-yaw-review/source/howitzer-candidate.png. Comparison: reports/generated/howitzer-yaw-review/source/design-comparison.png. These are SOURCE ART, not actual-game captures. Prompts/provenance recorded in assets/art/level4-towers-v1.prompt.txt. Heavy models/drafts remain ignored.
- Runtime source, atlas, anchors, tests and capture tools have NOT changed. No tests, game captures or browser checks run in this iteration. No request to rerun unchanged tests yet. #91 remains open.
- Next: user source-design verdict. If accepted, measure all16 bearing/muzzle anchors, normalize one shared scale, replace only Howitzer row with grading preserved, prepare independent yaw/known-bad checks, and solve transition ghosting without dropping muzzle continuity. Then hand user exact tests/capture commands and stop for actual-game verdict.

## User correction and new source — 2026-10-30

User selected the attached design (archived exactly as assets/art/references/towers/howitzer-design-approved-v2.png) but rejected its repeated depicted headings. This does NOT approve the previous model-style candidate. Preserve the selected short-tube / long paired piston construction.

Created a more compact model guide with exact 16 root rotations, reduced perimeter hose loop and olive receiver instead of bare black cushion. Built-in ImageGen style transfer output exec-9518bb91-f67f-48c9-8877-8e643dc50247.png is saved at reports/generated/howitzer-yaw-review/source/howitzer.png. Its headings visually progress more clearly than the selected repeating sheet, but exact spacing and rigid component consistency are NOT established. It remains unconnected source art.

An exploratory pack and palette grade were performed as offline authoring, then all runtime atlas/metadata/renderer/grader-record changes and baker/capture edits were restored to HEAD: no new game candidate shipped, no test expectations changed. The normalized draft was retained only in ignored source/unconnected-* files. No tests, actual-game captures or browser checks run. Do not reuse an earlier test result for this draft.

Next: resolve the actual pose geometry, not merely distinct raster hashes; verify physical bearing/muzzle/body-axis annotations against the geometric camera and the real repeating negative reference. #91 remains incomplete, including ghost transition contours. Do not ask the user to repeat source-design approval; it is supplied by their attached image.
