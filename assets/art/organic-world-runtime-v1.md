# Organic world in the game — v1

World presentation from the merged art checkpoint #28 is implemented over prototype v0.7. The selected v1 platform height and dense organic material treatment are retained. Palette is a zone property: default `mire` is green–umber–brown; `?zone=ember` is the retained red–yellow alternative. No new game menu is added.

- Entire terrain uses a cached wet organic material, with a depressed lane through the same tissue and a single slowly pulsing vein layer.
- Concrete tops retain actual tower anchors. Sixteen-unit front walls stand below them, with wet tissue obscuring the footings. Front walls participate in actor depth order.
- The Gate uses projected stone blocks and a segmented extruded ring. Vertical edges rise above grounded foundations; top faces and thickness establish the overhead view. The mouth projects into the map and the inner energy barrier crosses the lane at the unchanged leak point. Static stone is cached in two depth layers. Ruins avoid actual building footprints.
- Pausing retracts Turret/Cannon barrels and the Tesla upper section over 0.5 presentation seconds; resuming reverses the pose. Pause, warm-up and firing rules are unchanged.
- Forager master, runtime atlas and gait are unchanged. Location-concept specimens are not used as replacement creatures.

## Materials and provenance

Built-in imagegen produced three material-only inputs; [ground prompt](organic-world-runtime-v1.prompt.txt), [alternate palette prompt](organic-world-ember-v1.prompt.txt), [stone prompt](ancient-stone-runtime-v1.prompt.txt). Normalization uses `tools/pack-world-materials.cjs` with the optional `@napi-rs/canvas` offline dependency. Runtime needs only the WebP files:

| File | Dimensions | Bytes |
| --- | --- | --- |
| `assets/hunger-world-mire-v1.webp` | 512×512 | 145478 |
| `assets/hunger-world-ember-v1.webp` | 512×512 | 143250 |
| `assets/hunger-ancient-stone-v1.webp` | 256×256 | 35156 |

Only the active ground palette loads; both alternatives are preserved in Git. Opposite tile edges are blended offline. Stone and terrain have procedural missing-image fallbacks. The gameplay renderer has no new library dependency.

## Verification and viewing

- [Actual green-zone renderer capture](previews/organic-world-mire-v1.webp).
- [Actual red-zone renderer capture](previews/organic-world-ember-v1.webp).
- [Green-zone pause/resume clip](previews/organic-world-mire-v1.mp4).
- `node tests/organic-world.cjs` checks palette-independent simulation, caching, vertical projection, exact barrier/lane intersection, reversible pause poses and loading/failure fallback.
- `tools/capture-organic-world.cjs` uses native Canvas to run 90 frames from the real inline renderer per palette, including pause/resume. It checks read-only drawing and tests native stone-layer alpha against all sixteen full-height building footprints. The scene uses extra credits and durable placed Foragers for visual inspection; it is not a balance playthrough. Browser/device performance remains unmeasured.
- Rules and simulation source fingerprints match the main baseline for campaign, infantry and both legacy balance presets. All eight historical human replay fixtures verify unchanged.

## Remaining packages from the checkpoint

Real 1.65-second construction readiness is still pending as a simulation/replay change. Current construction retains its prior combat activation behavior. Leech and Carapacid need separate source-art and motion review before their sprites are replaced. These are not implemented by the world-presentation pass.
