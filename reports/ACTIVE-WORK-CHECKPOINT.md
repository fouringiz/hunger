# Active visual work — checkpoint, 2026-10-23

Gate approach correction implemented and verified in the native renderer. User approval of the final appearance and browser/mobile verification remain pending. No merge.

## Working copy and destination

- Existing PR #31: https://github.com/fouringiz/hunger/pull/31, branch codex/organic-world-runtime.
- Work in /Users/home/.codex/worktrees/ancient-gate-review/game (detached HEAD); push HEAD:refs/heads/codex/organic-world-runtime. Do not create another PR.
- Leave main /Users/home/github/game alone: it contains separate mechanics work.
- Checkpoints: dea6f70 / 8e2d03f (living mire), 2033f08 (verification rules), b7b620a (known failing approach regression), c5d703c (first clear geometry). The final follow-up adds clearance for the breathing banks and actual traversal media.

## Current user intent and accepted scope

Preserve the accepted monumental Gate art. Make the whole channel enter the actual opening. User permits moving build slots and changing the route, wants intermediate commits, and supplied a further image showing a broad continuous liquid approach. No new Forager or ground redesign was requested for this fix.

## Gate result

- Same accepted v6 image; campaign projection 420×409, anchor (.50,.92), actual leak point (900,420).
- Campaign approach rounds from (660,400) to (730,470) with radius 70, then from (850,470) to (900,420) with radius 50; enemies enter northward through the footing. The terminal path continues 70 units beyond the leak as before.
- Campaign slot 12: (740,260); slot 13: (540,460); slot 15: (780,100). All 16 slots remain available. Presets retain their historical route, Gate and slots.
- tests/gate-approach.cjs samples the complete incoming ribbon against actual upright masonry at half-width 36 (lane irregularity plus breathing). Zero intersections now; the same check restores the old b7b620a placement/route and detects 1131 obstructions. Actual posAt(GATE_D) equals GATE.
- No artwork cutting, added enemy fade or changed floor clipping was used to hide the obstruction.

## Verification and evidence

- 29 core scenarios; 4 preset scenarios; 6 replay-sweep groups including all 8 historical recordings pass.
- Focused organic-world, Forager, buildup, sale/range and coherent-art checks pass.
- Empty native renderer captures pass for mire, ember and historical layout: all 16 tower footprints clear, fixed slab tops, breathing ground, read-only rendering. Campaign exit-section check follows the incoming normal, including the 36-unit margin.
- tools/capture-gate-approach.cjs records 240 frames / 8 seconds with normal simulation movement: six Foragers and one Carapacid traverse the bend, leak and cause the expected 11 damage. Whole frame and sequential close frames were inspected for wall crossing, floor continuity, lower-HUD clipping and entry/removal.
- Current evidence: assets/art/previews/gate-approach-v8.mp4, gate-approach-v8.webp, gate-map-v8.webp. The older living-mire-runtime-v2 videos predate this route correction.
- Native Canvas evidence is not browser/device performance evidence. Do not bypass the prior browser file-URL policy denial via a server or alternate route.

## Preserved living-mire work / limits

The ground uses bounded shared-boundary deformation, traffic marks (max128, lifetime1.35s), texture displacement and crisp body/foot occlusion. Platform fronts remain22, tops fixed. No fluid solver is claimed.

Forager atlas: 16 headings × 9 cells (rest+8 gait phases),1728×3072; eight generated heading masters and eight authored side poses. Intermediate headings and non-side gait contraction are interpretations, not recovered3D anatomy. Final subjective motion/art acceptance is pending. Other creature skins are unchanged. Baked/runtime contact synchronization is tested. Provenance and rebuild: assets/art/living-mire-runtime-v2.md.

## Resume

Review the v8 evidence with the user. If further changes are requested, use observable acceptance criteria and full-cycle visual review from AGENTS.md. Do not treat a passing endpoint color test alone as a clear passage. Do not bulk-copy /private/tmp/hunger-living-mire-v2: it contains discarded experiments.

Native checks use WORLD_CANVAS_MODULE=/private/tmp/hunger-canvas/node_modules/@napi-rs/canvas. Forager rebuild uses FORAGER_CANVAS_MODULE with that path and tools/bake-forager-crawl-v2.cjs.
