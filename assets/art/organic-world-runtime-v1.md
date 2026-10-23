# Organic world in the game — current presentation

World presentation from the merged art checkpoint #28 is implemented over prototype v0.7. The dense organic material treatment is retained; on 2026-10-23 the user requested slightly taller concrete pedestals. Palette is a zone property: default `mire` is green–umber–brown; `?zone=ember` is the retained red–yellow alternative. No new game menu is added.

- Entire terrain uses a cached wet organic material and a single slowly pulsing vein layer. The liquid lane follows uneven sampled banks around the simulation path (the campaign Gate approach was subsequently rounded below its near jamb), with a roughly 60-unit warm-brown liquid core, wet glints and narrow contact shadows. Organic ground forms use a larger 512-unit texture repeat, closer to the approved reference. A 20% dark glaze quiets the lane highlights so the maroon/ivory Foragers separate from it. The lane stays distinct from the olive terrain in a 964px-wide game capture. Patterns retain detail at the 2× terrain-cache resolution instead of first reducing the source to a low-resolution tile. The ember zone warms the lane material while preserving its luminance detail.
- Concrete tops retain actual tower anchors. Detailed chipped rims, metal mounting surfaces, yellow corner markers, cracks, roots and wet wall stains replace the simple material rectangles. Front walls increase from 16 to 22 presentation units, with unchanged platform tops and tower anchors, and participate in actor depth order; the platform top and front use separate regions of one compact sprite.
- A single connected Gate/ruin sprite replaces the detached upper citadel and small arch in the campaign. A tall layered stone arch, deep cyan vortex, slime and attached ruin towers follow `studies/organic-world-direction-v3.png`. The user accepted the Gate art; its campaign projection is now 420×409 to receive the full channel. The cyan threshold remains at the actual exit (900,420); its shallow floor draws below actors, with separate rear/front architectural layers. All sixteen building footprints remain clear. On 2026-10-23 the user authorized further redistribution near the Gate: campaign slots 12, 13 and 15 now sit at (740,260), (540,460) and (780,100). The campaign route now curves below the near jamb and enters the portal northward. Historical balance presets retain the former slot geometry and v4 Gate/ruin art so existing recordings stay verifiable and playable. Stone geometry remains the missing-image fallback. Health remains in the HUD.
- Pausing retracts Turret/Cannon barrels and the Tesla upper section over 0.5 presentation seconds; resuming reverses the pose. Pause, warm-up and firing rules are unchanged.
- Forager uses the new maroon/ivory low-crawl atlas and authored directional masters; see [living mire runtime v2](living-mire-runtime-v2.md). Other creature skins stay unchanged. The ground now deforms physically in presentation, with fixed platform tops, transient traffic marks, texture displacement, crisp body/foot occlusion and slime strands.

## Materials and provenance

Built-in imagegen produced three material-only inputs; [ground prompt](organic-world-runtime-v1.prompt.txt), [alternate palette prompt](organic-world-ember-v1.prompt.txt), [stone prompt](ancient-stone-runtime-v1.prompt.txt). Normalization uses `tools/pack-world-materials.cjs` with the optional `@napi-rs/canvas` offline dependency. Runtime needs only the WebP files:

| File | Dimensions | Bytes |
| --- | --- | --- |
| `assets/hunger-world-mire-v1.webp` | 512×512 | 145478 |
| `assets/hunger-world-ember-v1.webp` | 512×512 | 143250 |
| `assets/hunger-ancient-stone-v1.webp` | 256×256 | 35156 |
| `assets/hunger-organic-lane-v1.webp` | 768×768 | 283822 |
| `assets/hunger-ancient-gate-v6.webp` | 768×1152 | 431200 |
| `assets/hunger-concrete-platform-v2.webp` | 192×224 | 37408 |

Correction assets also use built-in imagegen: [liquid lane prompt](organic-lane-material-v1.prompt.txt), [connected Gate and attached ruins prompt](ancient-gate-runtime-v6.prompt.txt), [platform prompt](concrete-platform-runtime-v2.prompt.txt). Their source PNGs are in `studies/`; `tools/pack-world-details.cjs` normalizes them into runtime WebP assets. Earlier Gate sources and v4 runtime art remain for historical presets. Active campaign world materials total 1076314 bytes across both palettes, or 933064 bytes loaded for the default zone (excluding creature/weapon atlases). The new source is `studies/ancient-gate-runtime-v6.png`; it was generated with the built-in image tool from the user's approved map reference.

Only the active ground palette loads; both alternatives are preserved in Git. Opposite tile edges are blended offline. Stone and terrain have procedural missing-image fallbacks. The gameplay renderer has no new library dependency.

## Verification and viewing

- [964px-wide game capture](previews/organic-world-mire-gameplay-v7.webp).
- [Actual green-zone renderer capture](previews/organic-world-mire-v7.webp).
- [Actual red-zone renderer capture](previews/organic-world-ember-gameplay-v7.webp).
- The older v1 pause/resume clip remains historical; v6 native captures exercise the same pause/resume behavior.
- `node tests/organic-world.cjs` checks palette-independent simulation, caching, vertical projection, exact barrier/lane intersection, reversible pause poses and loading/failure fallback.
- `tools/capture-organic-world.cjs` uses native Canvas to run 90 frames from the real inline renderer per palette, including pause/resume. It checks read-only drawing and tests native Gate-layer alpha against all sixteen full-height building footprints, allowing only a faint generated light fringe (at most 16/255 alpha). The scene uses extra credits and durable placed Foragers for visual inspection; it is not a balance playthrough. Both final palettes were captured and inspected after the Gate/path/platform corrections. `--legacy --viewport --empty` also checks the historical layout and former Gate. `--viewport --empty` captures the real 964×631 viewport configuration (the game canvas itself fits to 964×542). A native cyan-pixel assertion at the actual Gate leak point catches artwork-anchor drift; the old fallback-projection assertion alone could not catch that error. Browser/device performance remains unmeasured.
- The approved campaign slot relocation changes its rules fingerprint; simulation function sources are unchanged. Both legacy balance presets retain their previous rules fingerprints. All eight historical human replay fixtures verify unchanged. This comparison is to the PR presentation baseline `bab6999`, before the separately developed v0.8 mechanics.

## Remaining packages from the checkpoint

Real 1.65-second construction readiness is still pending as a simulation/replay change. Current construction retains its prior combat activation behavior. Leech and Carapacid need separate source-art and motion review before their sprites are replaced. These are not implemented by the world-presentation pass.

## Current living-ground update

The surface is cached separately from platform tops and deformed on a 10×6 grid with shared boundaries; all per-frame canvases are reused. Traffic tracks are presentation-only, capped at 128, and close after 1.35 seconds. Native empty captures verify breathing pixels, fixed slab tops (with at most 3 RGB levels of source-alpha background bleed), and cyan portal coverage across the full incoming y ±33 channel section. Native recordings and limits: [living-mire-runtime-v2.md](living-mire-runtime-v2.md).

The endpoint-only check was insufficient for the earlier Gate approach. Current full-width/depth regression and v8 traversal evidence are documented in [living mire runtime v2](living-mire-runtime-v2.md#gate-approach-correction-v8).
