# Active: Leech 16 directions — implementation checkpoint

Branch codex/creature-16dir-atlas, continued from e6f2641. User authorizes only Leech now, including presentation row selection. Carapacid redesign deferred. Requested diagonal source was absent locally/remotely; user explicitly authorized generating it, showing before baking, and row-by-row retries if needed. Generated full 4x4 sheet via built-in imagegen, displayed and inspected, saved assets/art/sources/leech-headings-diagonal-4x4-v1.png. Camera/proportions similar; diagonal armor highlights slightly brighter. Source path: /Users/home/.codex/generated_images/01a16884-8faf-76b2-a01b-4265786ba173/exec-c0c0d0bd-247b-46e5-afec-63289911f209.png.

Implemented configurable bake-creature-crawl.cjs: 8 authored + 8 affine intermediate headings, four phases, annotated belly support paths projected into contacts JSON; new sources can be configured for future Carapacid. Original cardinal source is opaque black (archived flattening), so extractor removes connected matte and protects dark interiors. Added edge decontamination and lossless WebP encoding via Pillow (system Python lacks Pillow; bundled runtime found automatically, or CREATURE_PYTHON override). Runtime change is ONLY Leech row count 4 -> 16 in creatureCrawlPose. No contacts rendering integration requested. Simulation untouched, no restamp required.

Before/after native game captures in reports/leech-16dir; first curve changes rows 1,1,1,1,0,0,0,0 -> 4,4,3,2,2,1,0,0. Opened both strips and after full frame. Must refresh captures after final bake. Existing gait test passed initial atlas. New matte test caught dark source fringes; cleanup and lossless rebuild under validation. Next: finish atlas/contact tests, inspect contact overlay + final route series/full cycle, full npm test, final report/checkpoint. Do not mark complete yet.

---
Historical checkpoint follows.

# Active: Creature 16-direction source audit — 2026-10-24

Branch codex/creature-16dir-atlas from freshly fetched origin/main. User limits work to assets/baking tools and explicitly requires stopping if diagonal masters are missing. Visually inspected both 4x4 source sheets; missing SE/SW/NW/NE cycles for both castes. Stopped before baking. Exact two generation prompts and resume checklist: reports/creature-16dir-master-request.md. No game files/assets changed; contact JSON and 16-row tests remain pending. Separate scope conflict: renderer hardcodes four rows, so live diagonal-route acceptance requires authorization for a presentation-only row-selection change. Full baseline npm test passed (all tests passed); git diff --check clean. Older notes below are historical.

Branch codex/shelter-balance-audit from main cb7e53a. Main already removes the stale replay fingerprint exception and restamps all eight reference games. Added the explicit AGENTS rule. Completed paired on/off runs on four human-v0.4 timelines under v0.9 campaign rules. Same outcomes/Gate HP in all pairs; real occupancy verified. Report: reports/carapacid-shelter-balance-v0.9.md (results, caveats, reproducible command). Original fixture fidelity and instrumented ON equivalence passed. Restamp command reports zero changes. Next: user review/push; broader balance playtest remains open. No game balance changes authorized by the audit. Earlier notes below are historical.

## Latest verification correction

The final crawl-atlas integration is saved in 863d111 and origin/main reference additions have been merged into this branch. That integration shortened shelter gaps from [6,24,42] to [6,22,36], but left the previous simulation-baseline rules hash. Reproduced both hashes directly: previous gaps yield 1f5e7d0d; current gaps yield acedc780. Source hash stays 5dbb50a9. Corrected only the expected rules hash; retained all geometry, behavior and visual assertions. Full npm test passed (all tests passed) and git diff --check is clean after the correction. No push or merge into main performed. Older progress notes below predate the integrated animation atlases.

Branch codex/carapacid-shelter from fresh origin/main 0a6d30a. User confirms Gate work completed. Approved Leech concept and broad Carapacid shell; new request adds Foragers gathering beneath shell arches near a tower. See reports/carapacid-shelter-plan.md. Preserve untracked reports/NEW-CHAT-HANDOFF.md. Building readiness belongs to a later PR.

Implementation checkpoint: real deterministic gathering into three provisional lee-side berths, natural forward speed with a berth cap and bounded lateral movement. Inactive towers do not trigger it. Dead, frozen or infantry-blocked carriers release it; portal approach excludes grouping. Existing damage and interception functions are unchanged. Historical balance presets retain original movement and accept only the known previous source fingerprint; campaign replays have new movement/rules and version v0.9.

New generated four-view Carapacid art is in assets/hunger-carapacid-shelter-v1.webp. Render depth puts the shell over sheltered bodies. Initial capture hid the entire group; adjusted berth separation and lateral offsets, now actual alpha tests confirm each of three bodies is partly visible and partly covered. Read-only native captures for Mire/Ember, before/after and full 6-second approach/shelter/death/release movie are in reports/carapacid-shelter/. Full npm test passed after behavior changes; an added native occlusion test passed separately. Final suite/review still pending after latest marker-height adjustment.

Known scope boundary: these are four static directional Carapacid poses, not a new authored leg-cycle atlas. Accepted Leech art has not been integrated. No browser/device or balance playtest yet; no push/PR/merge. Next: finish checks/report, save commits and give user branch/push commands. Do not claim the entire two-creature animation task is complete.

# Previous: Gate integration — 2026-10-24

Repo /Users/home/github/game, branch codex/gate-ground-integration from fresh origin/main 284f3c2. Main contains portal teleport and local ground life. Preserve untracked reports/NEW-CHAT-HANDOFF.md.

Current explicit task authorizes intermediate commits and asks for npm test green before final report. Scope is rendering only: keep accepted frontal Gate art, source geometry/anchor, PATH, GATE_D, slots, combat and balance. Integration criteria: irregular mud/route overlap at base, matching organic growth climbing lower stone, soft ground shadow, cyan spill on nearby ground and bodies within ~80px, zone grading for Mire and Ember.

Baseline captures prepared with tools/capture-gate-integration.cjs (loadWorld from actual native game renderer), both zones. Next: cached Gate surface grading and irregular footing/ground growth, shadow/spill and body-only light. Preserve the full lane width and the teleport effect. Save intermediate code, inspect actual close/whole shots for both zones, add focused tests and run npm test. No push/merge requested.

## Implementation in progress

Baseline committed as 3e7e28f. Implemented cached display-only Gate grading (warm stone/moss in Ember, muted olive in Mire; cyan aperture preserved), irregular feathering of bottom alpha, six narrow world-texture roots on lower masonry, soft forward shadow and 80px cyan ground/body spill. Sprite lighting uses one reusable 128px alpha mask and preserves body transparency/texture. Projection, source assets, all Gate geometry and combat unchanged.

Focused portal-entry, organic-world and forager-mire tests passed for the first implementation. Visual inspection caught an unlit brown burial patch pasted over the new ground light beneath Foragers. Now paintGateApproach paints the same floor/shadow/light into the creature contact surface; recapturing to inspect correction. Need dedicated gate tests, whole/close/grayscale review and final npm test. No final approval yet.

## Integrated render checkpoint

Brown burial artifact corrected and final Mire/Ember captures regenerated. Opened both close-ups, Ember whole scene and Mire grayscale; accepted frontal silhouette and broad approach retained. tests/gate-integration.cjs passes both zones: exact baseline rules/combat/geometry, unchanged upper silhouette, cyan preservation, feathered bottom, warm Ember grading, 80px range, actual body lighting for all three castes and matching lit-floor samples. Tests account for the original image's 249–253 interior alpha. Final npm test pending. No push or merge.

## Completed implementation / awaiting user visual review

Full npm test passed on b67293d (all tests passed); subsequent changes are documentation only. git diff --check clean. Intermediate commits: 3e7e28f baseline, b67293d implementation and native visual tests. Final report/PR text in reports/gate-integration/README.md and PR.md; before/after full and close images for Mire/Ember plus grayscale views included. Source art files untouched. Native rendering validated; browser/device performance not assessed. Final artistic approval remains with the user.

No push, PR creation or merge performed. User can checkout codex/gate-ground-integration, inspect, push and create PR using the report's commands. A three-commit git-am delivery patch is saved after the final documentation commit at reports/generated/gate-ground-integration.patch; do not reapply it to this already-completed branch. Preserve untracked user reports/NEW-CHAT-HANDOFF.md. No remaining implementation task unless user feedback requests changes.
