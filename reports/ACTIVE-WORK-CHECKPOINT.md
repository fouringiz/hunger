# Local ground life — 2026-10-24

Repository /Users/home/github/game; branch codex/local-ground-life originally from origin/main 9298dd2, now fast-forwarded to origin/main 72248f5 after user merged portal teleport PR #43. Both portal teleport and uncommitted local-ground changes are present. User owns tests, commits, push and merge; do not perform those operations. Preserve untracked reports/NEW-CHAT-HANDOFF.md.

Goal: replace whole-map deformation with 10–20 independent local mud/fauna movements, 20–60 logical pixels each. Terrain outside them and under architecture must stay fixed. Add fixed contact shadows and a thin mud overlap at platform footings. Preserve texture density, platform height, art perspective, combat functions, balance, PATH, GATE_D and slot coordinates.

Diagnosis: drawLivingSurface stretches a 10×6 grid every frame; worldPulseArt also pulses all veins in sync. platformFront returns early for the production image, skipping its existing procedural muddy footing. Fix these presentation paths only.

Next: save actual baseline captures and invariants; replace the grid with a fixed terrain copy plus independent bounded local effects and protected foundations; restore platform contact in the image path. Capture before/after, close-up and t/t+1/t+2. Add regression tests for the user, without running them. Keep this file updated after each substantial step; deliver a patch and exact user commands. No verification/completion claims without evidence.

## Implementation saved

Baseline and first after captures exist in reports/local-ground-life. The base now copies unchanged terrain; 16 seeded patches (diameter 24–52 logical px, independent 4.5–8.4s clocks) draw bubbles, buried-animal ridges and ripples. Global veins are static. All activity, including creature contact textures/trails, is removed from protected foundation rectangles. Platform image path now draws static terrain overlap at its bottom; cached shadows sit at the actual footing. Height/coordinates unchanged.

Opened whole scene and platform close-up. First bubbles looked too flat; refined shading/highlights, reduced ridge brightness. Need recapture final frames, inspect a full local cycle and grayscale, prepare regression test and delivery patch. User will run tests/commit; none run in this task.

## Ready for user verification

Final full frames and pad close-ups captured at t=2,3,4s. Nine-second native pad cycle saved as MP4; reviewed sampled cycle phases, whole before/after, close-ups and grayscale. README links evidence and exact user commands. New tests/local-ground-life.cjs covers pixel stability outside patches, every patch moving, protected ground during creature contact, both palettes and baseline combat/geometry fingerprints. tools/capture-organic-world.cjs no longer expects the whole ground to breathe. Tests were deliberately NOT run. git diff --check is clean. No commit, push or merge performed.

Changes are in the current working tree. Delivery patch reports/generated/local-ground-life.patch will contain all intended tracked changes plus new test/tool/report files; apply with git apply only to a clean matching base, not to this already-edited tree. Current user-owned untracked reports/NEW-CHAT-HANDOFF.md remains untouched. Next session: read this checkpoint, inspect git status, wait for user test/visual feedback or help with reported failure; do not repeat full test work without a new request.

## PR #43 integration

Confirmed PR #43 merged on GitHub; fetched origin/main 72248f5 and fast-forwarded this branch. Temporarily saved the three tracked local edits, restored them; renderer merged automatically. Resolved only ACTIVE-WORK-CHECKPOINT.md by retaining this ground-task checkpoint and recording the new main. No task commit or tests run. Baseline captures remain from pre-teleport main; their stationary scenes contain no entering bodies. Recovery copies are in reports/generated/local-ground-life/pre-main-update. Delivery patch regenerated against 72248f5 and includes only the ground task; teleport is now inherited from main.
