# Forager mire runtime v1

## Shipped in the prototype

- `../hunger-forager-mire-v1.webp`: 16 projected headings × 13 poses (neutral plus 12 gait phases), 192 px cells, 2496×3072, WebP quality 85, approximately 1.64 MiB. Transparent margins; no rectangular background travels with the creature.
- `../hunger-mire-ground-v1.webp`: 256×256 mirrored-edge tile, about 10 KiB. Source ground is muted to dark peat/olive, leaving the creature's maroon flesh and bone distinct.
- The actor atlas includes low contact tissue behind the belly and foreground wet patches over claw tips. The road material is cached once with irregular fringes. This is not a full living-terrain/traffic-wear system.
- Campaign and infantry mode both use this Forager by default. Other castes retain their existing sprites. Failed/unloaded images keep the previous grounded/vector fallbacks.

## Identity and movement

The visible body and three exposed near-side limbs use RGB from `references/enemies/forager/forager-approved-v1.webp`, separated by `sources/forager-matte-v1.png` and measured limb masks in the bake tool. Image generation produced only a grayscale extraction matte; it did not paint replacement anatomy or materials. Normalization uses a shared scale and mip filtering to prevent source pores aliasing at game size. Bone, folds, face, claws and slime are sampled from the supplied master, not regenerated parts from the rejected puppet.

Offline skinning moves the separate limb regions while their roots stay on the body, with slight longitudinal contraction. Stance/transfer phases follow observed game travel, including Sprinter acceleration; stopped actors freeze. Pose sampling is discrete, not an exact continuous collision model. A presentation WeakMap observes enemies without writing their state.

Yaw uses a convex cross-section with the original texture, vertical height and a mirrored hidden surface. These are approximate projected views from one reference, not a recovered 3D model or independently approved front/back art. At corners, the observed heading turns progressively with travel. The runtime draws one atlas cell per Forager; there are no per-enemy filters, mesh draws, pixel reads or image generation.

## Rebuild and review

Run `FORAGER_CANVAS_MODULE=/absolute/path/to/@napi-rs/canvas node tools/bake-forager-mire.cjs` (or install that optional development package and run the tool directly). It rebuilds all poses from the approved source/matte, renders each heading in a bounded worker process and packs the atlas. The game has no package dependency or build step.

Run `node tools/preview-forager-puppet.cjs`, then reload `reports/generated/forager-puppet-study.html`. This page extracts the actual Forager renderer from the prototype; its controls cover travel, stop, speed, angle and game-size/enlarged inspection. It links to the playable prototype. Review media under `previews/` are not game-loaded assets.

## Validation boundaries

- 29 prototype regression scenarios; infantry, party replay and replay-sweep suites; existing construction, sale/range/touch and art checks pass.
- `tests/forager-mire.cjs` covers default integration, one draw, preservation of other castes, render-state parity, stopped/travel-driven gait, real Sprinter travel, progressive corners, 16 directions, failed-image fallback and terrain stroke isolation.
- Native offscreen capture uses the real game, images, fixed simulation steps and Canvas. Replay signatures are unchanged by rendering; snapshots cover route corners and normal placement.
- The preview's actual-game renderer was exercised offscreen with real decoded images, including pause, zero/faster speed, directional ground scrolling and size/angle controls. Atlas dimensions and all 208 transparent cell corners were checked.
- Rules/source fingerprints match main in campaign, infantry, v04 and parityA modes; recorded human timelines reproduce without restamping.
- Live browser automation could not inspect the local file: the browser security gate rejects `file:` URLs. Native Canvas verification is not a mobile/browser playtest. Subjective gait, inferred hidden views and phone performance still need user review.

## Extraction-matte prompt (built-in imagegen)

```text
Use case: background-extraction / precise-object-edit.
Produce a GRAYSCALE ALPHA MATTE of the supplied image, not artwork. The input is a 1536 by 1024 image. Output MUST have precisely the SAME full-image composition and the SAME object placement, scale, pose, and aspect ratio. Do NOT crop, move, resize, rotate, simplify, redesign or paint a different animal.
WHITE (255) = the visible actual creature ONLY: the large ivory armored maroon fleshy crawler in the center-right, its existing attached walking limbs and hooked claws, its existing head, mandibles and dangling body slime. BLACK (0) = all background earth, mud, roots on the ground, ground mucus pools, foreground mud and distant tissue not attached to the body. A thin antialiased gray edge is allowed only at the true object boundary; interior animal pixels solid white, interior ground pixels solid black.
Preserve EVERY original asymmetry, anatomical contour, inter-leg hole, claw tip and carapace spike at its exact original image coordinates. The creature tail is at left, head at right, with three large visible near walking limbs; do not add any feet. Dense hanging slime attached to the belly may be partly gray along its lower tips. Exclude the flat ground even though it shares colors with the flesh.
The result must be ONLY a binary/antialiased extraction mask, black background and white silhouette, absolutely no colors, textures, rendered anatomy, shadows, labels, frames or poster. We will apply your matte to the ORIGINAL source pixels, so changing silhouette placement would be an error. Match the source alignment exactly.
```
