# Organic world in the game — v1

World presentation from the merged art checkpoint #28 is implemented over prototype v0.7. The selected v1 platform height and dense organic material treatment are retained. Palette is a zone property: default `mire` is green–umber–brown; `?zone=ember` is the retained red–yellow alternative. No new game menu is added.

- Entire terrain uses a cached wet organic material and a single slowly pulsing vein layer. The liquid lane has a 57-unit warm-brown core with wet folds/glints, dark contact creases and irregular raised tissue margins outside the core. It stays distinct from the fine olive terrain in a 964px-wide game capture. Patterns retain detail at the 2× terrain-cache resolution instead of first reducing the source to a low-resolution tile. The ember zone warms the lane material while preserving its luminance detail.
- Concrete tops retain actual tower anchors. Detailed chipped rims, metal mounting surfaces, yellow corner markers, cracks, roots and wet wall stains replace the simple material rectangles. Sixteen-unit front walls retain their agreed height and participate in actor depth order; the platform top and front use separate regions of one compact sprite.
- Detailed weathered concentric masonry, a deep cyan vortex and grounded buttresses replace the rejected coarse geometric Gate. The nearest foundation is cached separately for actor depth order. The visible cyan threshold is anchored to the unchanged Gate exit (930,420); the horizontal lane enters it directly. A separate tall ruined citadel layer restores a visible monumental silhouette above the neighboring pad. The threshold floor draws below actors, while upright masonry retains rear/front depth layers; architectural placement avoids every actual building footprint. Stone geometry remains only as the missing-image fallback. The duplicate Gate plaque is removed; health remains in the HUD.
- Pausing retracts Turret/Cannon barrels and the Tesla upper section over 0.5 presentation seconds; resuming reverses the pose. Pause, warm-up and firing rules are unchanged.
- Forager master, runtime atlas and gait are unchanged. Location-concept specimens are not used as replacement creatures.

## Materials and provenance

Built-in imagegen produced three material-only inputs; [ground prompt](organic-world-runtime-v1.prompt.txt), [alternate palette prompt](organic-world-ember-v1.prompt.txt), [stone prompt](ancient-stone-runtime-v1.prompt.txt). Normalization uses `tools/pack-world-materials.cjs` with the optional `@napi-rs/canvas` offline dependency. Runtime needs only the WebP files:

| File | Dimensions | Bytes |
| --- | --- | --- |
| `assets/hunger-world-mire-v1.webp` | 512×512 | 145478 |
| `assets/hunger-world-ember-v1.webp` | 512×512 | 143250 |
| `assets/hunger-ancient-stone-v1.webp` | 256×256 | 35156 |
| `assets/hunger-organic-lane-v1.webp` | 768×768 | 283822 |
| `assets/hunger-ancient-gate-v4.webp` | 512×768 | 184656 |
| `assets/hunger-ancient-gate-ruins-v1.webp` | 384×384 | 78340 |
| `assets/hunger-concrete-platform-v2.webp` | 192×224 | 37408 |

Correction assets also use built-in imagegen: [liquid lane prompt](organic-lane-material-v1.prompt.txt), [Gate first pass](ancient-gate-runtime-v2.prompt.txt), [Gate entrance and tall masonry](ancient-gate-runtime-v4.prompt.txt), [ruined citadel](ancient-gate-ruins-v1.prompt.txt), [platform prompt](concrete-platform-runtime-v2.prompt.txt). Their source PNGs are in `studies/`; `tools/pack-world-details.cjs` normalizes them into compact runtime WebP assets. Earlier v2/v3 Gate sources are retained as historical iterations and are not loaded by the game. World materials total 908110 bytes across both palettes, or 764860 bytes loaded for the default zone (not including the pre-existing creature/weapon atlases).

Only the active ground palette loads; both alternatives are preserved in Git. Opposite tile edges are blended offline. Stone and terrain have procedural missing-image fallbacks. The gameplay renderer has no new library dependency.

## Verification and viewing

- [964px-wide game capture](previews/organic-world-mire-gameplay-v2.webp).
- [Actual green-zone renderer capture](previews/organic-world-mire-v1.webp).
- [Actual red-zone renderer capture](previews/organic-world-ember-v1.webp).
- [Green-zone pause/resume clip](previews/organic-world-mire-v1.mp4).
- `node tests/organic-world.cjs` checks palette-independent simulation, caching, vertical projection, exact barrier/lane intersection, reversible pause poses and loading/failure fallback.
- `tools/capture-organic-world.cjs` uses native Canvas to run 90 frames from the real inline renderer per palette, including pause/resume. It checks read-only drawing and tests native Gate-layer alpha against all sixteen full-height building footprints, allowing only a faint generated light fringe (at most 16/255 alpha). The scene uses extra credits and durable placed Foragers for visual inspection; it is not a balance playthrough. Both final palettes were captured and inspected after the Gate/path/platform corrections. `--viewport --empty` also captures the real 964×631 viewport configuration (the game canvas itself fits to 964×542). A native cyan-pixel assertion at the actual Gate leak point catches artwork-anchor drift; the old fallback-projection assertion alone could not catch that error. Browser/device performance remains unmeasured.
- Rules and simulation source fingerprints match the main baseline for campaign, infantry and both legacy balance presets. All eight historical human replay fixtures verify unchanged. This comparison is to the PR presentation baseline `bab6999`, before the separately developed v0.8 mechanics.

## Remaining packages from the checkpoint

Real 1.65-second construction readiness is still pending as a simulation/replay change. Current construction retains its prior combat activation behavior. Leech and Carapacid need separate source-art and motion review before their sprites are replaced. These are not implemented by the world-presentation pass.
