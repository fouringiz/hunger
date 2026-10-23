# PR #31 — checkpoint, 2026-10-23

## Resume here

This checkpoint was resumed on 2026-10-23. Gate, muddy-path and concrete-platform corrections are now implemented in the existing PR: https://github.com/fouringiz/hunger/pull/31 (`codex/organic-world-runtime`). See `assets/art/organic-world-runtime-v1.md` for the current implementation, actual renderer previews and verification. The diagnosis and verdicts below preserve the original handoff; they are not new pending work. Visual acceptance by the user remains open.

## Latest correction, 2026-10-23

- The previous v3 result was rejected again: the lane disappeared into terrain microtexture, the visible threshold missed the incoming lane, and the ruined silhouette had been shortened too far.
- Current correction: a broad brown fluid core with recessed banks; v4 cyan entrance anchored at the real leak point; an additional tall ruined-citadel layer kept visible above slot 15; separate flat threshold/vertical masonry layers; duplicate Gate plaque removed.
- All actual slots and the leak point remain unchanged. The alternative designer blockout with an x=890 presentation entrance, fading enemies and a relocated slot 15 remains an unadopted separate experiment. Its old-replay success would not prove the new slot layout gameplay-neutral.
- Native captures cover both palettes and the 964px-wide empty scene. All 16 full-height tower footprints remain clear of opaque architecture, and the visible cyan threshold is sampled at (930,420). Core regression: 29 pass; replay sweep: 6 groups, all 8 human fixtures exact. Focused world, buildup, sale/range and Forager tests pass.
- Work continues in the attached `ancient-gate-review` worktree because the primary checkout is being used for v0.8 mechanics. Earlier in-progress edits were preserved in `wip/ancient-gate-v4`; they were not lost.
- User visual acceptance remains pending. See `assets/art/previews/organic-world-mire-gameplay-v2.webp` for the actual game-sized result.

## Earlier checkpoint and diagnosis

## User verdicts

- The current procedural Gate is rejected: coarse stone blocks, an oblique segmented hoop and a flat cyan grid do not match the agreed monumental ancient portal.
- The pathway is dull/blurry compared with the approved concept. It needs vivid, detailed, glossy fluid sludge, folds and wet glints, rather than a broad darkened band over the ground tile.
- Concrete platforms also fail to match the approved sketch: correct their rendered appearance to the reference, including material, volume and contact with the mire. Keep the already approved platform height and actual tower anchors; this is a visual correction, not a request to change their height or placement. Added at the user's request before stopping (4% usage remaining).
- Keep the approved whole-map texture density, raised platforms and green–umber–brown palette. Red–yellow remains an alternate zone palette, not a discarded direction.
- Preserve approved Forager appearance and mire animation. Do not replace it with the different creatures depicted in environment concept art.

## Durable references

- Approved scene/material: `assets/art/studies/organic-world-direction-v3.png` (also the image attached to the latest path complaint).
- Ancient monumental portal reference: `assets/art/references/world/gate/ancient-gate-user-v1.png`.
- Rejected in-game Gate: `assets/art/references/world/gate/gate-runtime-rejected-v1.png`.
- Source for the integrated wet-path material: `assets/art/studies/organic-lane-material-v1.png`.
- Exact candidate prompt: `assets/art/organic-lane-material-v1.prompt.txt`.

The lane source was produced with built-in imagegen before stopping and has now been integrated and inspected at gameplay scale. New Gate sources are `assets/art/studies/ancient-gate-runtime-v2.png` (first pass) and `ancient-gate-runtime-v3.png` (subsequently rejected silhouette); platform source is `concrete-platform-runtime-v2.png`. Exact prompts and packaging instructions are linked in the runtime document. User approval of the new in-game appearance remains pending.

## Diagnosis and next work

1. `worldPattern()` in `prototype/index.html` downsamples the 512px source to a 288px offscreen tile before rendering into a 2× terrain cache. This loses detail before enlargement. Preserve sufficient source detail in cached patterns; avoid the intermediate low-resolution raster.
2. `terrain()` currently creates the channel only with overlapping translucent wide strokes (`WORLD.shade` and `WORLD.wet`). It has no separate liquid-path material. Clip a detailed sludge material to the actual route with organic margins; retain readable channel boundaries and avoid a dull opaque wash. Check both `mire` and `ember` palettes.
3. Replace the rejected procedural Gate with detailed artwork faithful to the approved reference: weathered concentric ancient architecture, visible thickness and a deep turbulent cyan opening. Adapt it to the overhead 2.5D camera; vertical architecture must stand upright. Generate/inspect actual art with imagegen, not another coarse primitive approximation. Keep a missing-image fallback.
4. Check the real game composition before declaring a match. Maintain depth ordering with enemies and structures. All sixteen build pads must remain usable and unobscured by opaque Gate architecture.

## Geometry and compatibility constraints

- World: 960×540; Gate leak point `(930,420)`; final path segment travels horizontally right.
- The route must enter the visible aperture at the unchanged leak point. `gatePoint(0,0,GATE_MOUTH_DEPTH)` currently equals the simulation Gate position.
- Especially protect slot 15 `(890,300)`, including its full tower height (x±22, y−62 through y+18). Gate mass may extend beyond the map, but the entrance must remain legible.
- Current cached Gate layers: `GATE_ART_BOX`, `buildGateStone()`, `gateStone()`, `drawGateJamb()`, `drawGateField()`; rear/field/front actors are depth sorted.
- **Presentation only:** do not change combat, movement, economy, replay rules or source fingerprints. Preserve existing pause/retraction animation and platforms.

## Existing implementation and checks

`assets/art/organic-world-runtime-v1.md` describes what PR #31 already implements and its limits. Before this checkpoint, all 18 test scripts passed, including the 29 core regression cases and eight strict human replay fixtures. Native capture covered 90 renderer frames per palette and all sixteen tower footprints. These are prior results for `ef6fba9`, not validation of the unintegrated lane candidate.

After actual renderer changes: run focused world tests, mandatory `node tests/prototype-regression.cjs`, and strict replay checks. Update `tools/capture-organic-world.cjs` when adding material images; it replaces declarations with native decoded assets. Capture both palettes and inspect the actual Gate/path. Optional native Canvas dependency is supplied via `WORLD_CANVAS_MODULE`; see the tool header. Browser/mobile performance has not been measured.

Do not bypass a prior browser URL-policy denial by switching access routes. Native offscreen Canvas captures independently validate the local renderer and must be described as such.

## Other authorized work still pending

- Actual 1.65 simulation-second construction readiness for every building, with replay compatibility handled explicitly. Current visual construction can still skip into firing; PR #31 has not fixed that behavior.
- Separate Leech and Carapacid source-art/motion review, matching the supplied slimy references and sinking into organic mire.

Update the existing PR after verified corrections; do not merge it on the user's behalf.
