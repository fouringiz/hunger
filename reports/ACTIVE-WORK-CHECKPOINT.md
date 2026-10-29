# Iteration 3 — awaiting the user's visual verdict

Checkout: `/private/tmp/hunger-level4-sprites`
Branch: `codex/level4-sprites`; PR: https://github.com/fouringiz/hunger/pull/69
No merge. Iteration1 (df6f8f5) and iteration2 (15ad9ed) accepted before proceeding.
Pipeline preparation saved as f433911; integration and evidence report are committed
on this branch. Exact final commit/push identity is reported in the session/PR.

## Current implementation

- New `assets/hunger-level4-towers-v2.png` / `.frames.json`: 4096x2048,
  six16-view families at22.5-degree world-yaw steps; fixed Tesla/Cluster copied
  exactly. Each pose has measured bearing and muzzle anchors. One family scale.
- Old overhead yaw PNG/metadata and runtime path removed. General projection
  remains for levels1–3/Flamethrower. No new runtime pixel reads or JSON fetch.
- A60ms presentation transition shares head/muzzle weights; held aim uses ONE
  opaque source image. Persistent angular blending was rejected during cycle
  inspection. Flashes use displayed heading; shell launch points remain pinned.
- Iteration2 bearing/recoil bounds retained. No combat, targeting, balance, PATH,
  GATE_D, platform-position or replay changes.
- Prompts and final source identities: `assets/art/level4-towers-v1.prompt.txt`.
  Whole-sheet generation plus focused rear-view repairs used built-in ImageGen.
  Draft sheets/guides/manifests are ignored, not committed.

## Verified on final temporal-transition source

- Full npm test PASS, including leech-crawl-atlas.
- Art contracts:16 distinct raster/source cells, upright camera, shared temporal
  muzzle, wrap, held opacity, recoil, pixel-free fallback, launch pinning; known
  bad eight-pose/row/matrix/wrap/snap/permanent-blend/air-anchor variants rejected.
- Seating:490 authored heading/recoil states; <=2 native px, max1.800px. Coverage
  and physical-contact thresholds retained; exact previous and6-unit rear shift
  negatives rejected. Transition/effect tests separately exercise384 states.
- Deployment:96 headings, old flat narrow-clip pop and early wide-clip emergence
  rejected. Badge/foundation/fallback contracts retained with new image mocks.
- All8 matching captures in Mire/Ember against15ad9ed: rules9d3c412e,
  source5750d1fe,151 identical live combat steps per scene. Timed full-turn97
  frames and complete firing151 frames before/after are present for each scene.
- Offline audit:928 lower-level/build-state pairs identical; fixed Tesla/Cluster
  RGBA exact. Capture material regression rejects silently omitted zone textures.
- Opened actual before/after board, approved/reference16-view boards, full-cycle
  contact sheets, key timed turn and upgrade/pause/sale sheets, whole grayscale.

## Evidence and acceptance boundary

Final local ignored root: `reports/generated/level4-poses/game/`.
`before-after.png`, `reference-and-game-all.png`, per-branch
`approved-and-16-poses.png`, `all151-review.png`, `all97-turn-review.png`,
`states-review.png`, before/after whole/grayscale/close frames and full cycles.
All exact paths, criteria and test-change explanations:
`reports/level4-review/iteration-3-rotation.md`.

Known review limits: a short transition can soften/double an outline for60ms;
generated hardware details vary slightly. Busy terrain is unchanged. No artistic
approval inferred. File-origin browser console check NOT performed.

Next action: present iteration3 results/frames and WAIT for user's verdict.
Do not merge or start other visual changes. Keep generated heavy captures/drafts
out of Git. Historical iterations are documented in the iteration1/2 reports.
