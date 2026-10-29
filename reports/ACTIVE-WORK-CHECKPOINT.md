# Flamethrower VFX PR from fresh main — checks pending (2026-10-29)

- User requested including the fire/smoke work in a PR, explicitly based on fresh `main`. Fetched `origin/main` at `3eec37f01b65fda62275f37441babeb433679052` (merged PR #69); created `codex/flamethrower-vfx` directly from it. Original `codex/level4-tower-art` remains intact at `c975659`.
- Main already contains the tower artwork, deployment/retraction and first ribbon animation. Transferred only the remaining fuel-fire changes and final source sheets. Resolved adjacent additions by retaining main's level-four artwork loading, capture material support and pinned `shellLaunchPoint(sh)` behavior.
- Runtime change: the narrow ribbon opens into expanding, rolling textured billows; distant size multiplier reaches 1.6 while retaining the narrow origin and forward visual reach. Upright billows share actor depth; adjacent texture frames crossfade. Cryojet retains its coolant effect. No simulation, combat, balance, PATH, GATE_D or platform-position edits.
- Final runtime billow atlas: `assets/hunger-flame-billows-v1.png` (eight 128px cells). Separate full-jet source: `assets/hunger-flamethrower-jet-v1.png` (four 512×256 cells; emitter `(0,128)`), explicitly approved by the user. Smoke source: `assets/hunger-flamethrower-smoke-v1.png` (six 256px cells; centre `(128,128)`), birth/growth/dissipation. The new full-jet and smoke sheets are included as assets and are NOT yet wired into gameplay. Prompts, frame/provenance metadata and packers accompany all three sheets; heavy masters/references/previews remain ignored.
- Observable criteria remain pending gameplay evidence: broad rolling silhouette with a narrow bright nozzle; continuous flow/sweep/fade; unchanged visual reach; fixed camera; readable enemies/towers in colour and grayscale. Separate rejection pass must check gaps, pops, cell edges, repetitive balls, occlusion and perspective. Source-art inspection/approval does not establish these gameplay properties.
- Prepared regression checks include known-bad ribbon-only, frozen, constant-size and narrow variants. No tests, game captures or browser checks run for this transfer. Per `AGENTS.md`, the user runs them. Historical main results below do not validate this VFX change.
- User-run commands from repository root:

  ```sh
  npm test
  node tools/capture-organic-world.cjs --flamethrower-reference --before 3eec37f01b65fda62275f37441babeb433679052
  open prototype/index.html
  ```

  The reference-board capture needs the local ignored photo `reports/generated/flamethrower/references/fire-1.png` (present in this workspace). Expected, not yet captured: `reports/generated/flamethrower-reference-fire/reference-before-after.png`, `{before,after}-{mire,ember}-fire-{base,A,B}-whole{,-gray}.png`, and full `flow/sweep/stop` game/zoom sheets. `--before` now applies to fire captures so the comparison can use this exact main base. Inspect whole and close views, full cycles and real `file://` console; second independent frame review remains required before merge.
- Next: publish a draft PR, then await user-run results and frame review. No claim of visual completion.

---
Historical checkpoint inherited from main (PR #69 is now merged):

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
