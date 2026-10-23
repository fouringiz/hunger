# Living mire / Forager runtime v2

The user requested full-width portal entry, a low planted Forager crawl with red/burgundy flesh and ivory armor matching the supplied image, active contact with sludge, and breathing terrain. Slot redistribution and route edits were authorized; the campaign approach now curves below the near jamb and enters northward at (900,420). Historical preset routes stay unchanged.

## World

- Same accepted Gate v6 source, projected at 420×409 presentation units, threshold anchor (.50,.92), exit (900,420). The approach uses 70-unit and 50-unit rounded bends below the left foundation.
- Campaign slots 12, 13, 15: (740,260), (540,460), (780,100). Historical balance presets keep their original grid and previous Gate art. Pedestal front height remains 22.
- Separate cached static platform tops and breathing ground. Shared-boundary 10×6 deformation moves wet texture without moving structures. Local contact displaces the actual map texture. Short paired tracks use observed creature movement, are capped at 128, and fade in 1.35 seconds.
- The lower belly and planted claw tips are covered by crisp samples of the live surface, not a brown translucent oval baked into the animal. Recovering claws stretch short slime lines. This is presentation deformation and occlusion, not a fluid solver or collision-system change.

## Art and normalization

Built-in imagegen produced two source sheets, based on the supplied creature and existing sludge-cycle reference:

- studies/forager-low-crawl-v2.png: eight low-crawl poses; prompt forager-low-crawl-v2.prompt.txt.
- studies/forager-low-crawl-directions-v2.png: eight volumetric heading masters, including real front/back source views; prompt forager-low-crawl-directions-v2.prompt.txt.

The supplied image is RGBA-identical to references/enemies/forager/forager-approved-v1.webp. Generated sheets are interpretations of that identity and color reference, not pixel-identical copies of its anatomy. Human acceptance is pending.

Rebuild with `FORAGER_CANVAS_MODULE=/path/to/@napi-rs/canvas node tools/bake-forager-crawl-v2.cjs`. Component extraction recovers protruding tips from the uneven source grid; a measured gutter separates the first pair's touching slime strand. All side poses share one scale and belly anchor; heading masters share a scale and ground anchor. The runtime atlas is hunger-forager-mire-v2.webp, 1728×3072: 16 headings × 9 cells (rest + 8 phases). Side-facing movement uses the eight authored poses. Other main headings use their volumetric masters with bounded mesh contraction; halfway views are shallow interpolations, not independently painted frames or recovered 3D anatomy.

`studies/forager-low-crawl-v2.contacts.json` contains matching projected contact landmarks. The same data is embedded in prototype/index.html as FORAGER_MIRE_CONTACTS; the bake tool updates the inline declaration automatically, and a focused test checks synchronization. Runtime gait follows observed actual travel and freezes when stopped. Canvas drawing leaves combat/replay state unchanged. Other creature skins remain unchanged, though the ground reacts to their motion too.

## Actual renderer captures and checks

- previews/organic-world-mire-gameplay-v7.webp and organic-world-ember-gameplay-v7.webp: empty maps.
- previews/organic-world-mire-v7.webp: populated map.
- previews/living-mire-runtime-v2.mp4: six seconds of actual full-map rendering.
- previews/forager-living-mire-runtime-v2.mp4 and forager-living-mire-runtime-v2.gif: close tracking crop from the same real frames.
- previews/forager-living-mire-close-v2.webp: close still.

Capture: `WORLD_CANVAS_MODULE=/path/to/@napi-rs/canvas node tools/capture-organic-world.cjs --motion --frames`; ffmpeg encodes the generated full-map and close PNG sequences at 30 fps. Empty capture modes check the complete channel cross-section at the portal, living-ground pixel changes, fixed slab tops, all 16 full-height building footprints, and read-only rendering. Atlas checks cover transparent margins, maroon/ivory visibility and non-flat front/back proportions in all 144 cells.

These are native Canvas captures, not browser screenshots. Final art/motion acceptance and browser/mobile performance are not established by these checks. No combat functions, timing, economy or creature stats are changed; the campaign rules fingerprint changes through the explicitly authorized build-slot redistribution. Historical recordings remain checked under their preserved presets.

## Gate approach correction, v8

The earlier endpoint-only cyan check missed a route crossing the left jamb. `tests/gate-approach.cjs` now samples the complete incoming route ribbon against the actual upright Gate layers, with a 36-unit half-width including surface motion. It rejects the known old placement/route with 1131 masonry samples and finds zero in the new approach. Floor clipping and the accepted v6 source artwork are unchanged. Empty captures additionally check the cyan section perpendicular to the incoming direction and clear full-height tower footprints at all 16 slots.

`tools/capture-gate-approach.cjs` records 240 frames / 8 seconds of actual fixed-step movement and rendering: six Foragers and one Carapacid reach the threshold and cause normal leak damage. [Traversal video](previews/gate-approach-v8.mp4), [close still](previews/gate-approach-v8.webp), [whole map](previews/gate-map-v8.webp). Whole map and sequential close frames were visually inspected. These are native Canvas captures; browser/mobile verification remains unperformed. The earlier living-mire-v2 videos predate this route correction.
