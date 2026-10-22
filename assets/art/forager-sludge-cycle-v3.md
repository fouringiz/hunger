# Forager / living mire — review v3

One Forager art/motion study, before game integration. The player selected a detailed creature and a separate near-black peat/olive soil palette. The rejected thin rig is recoverable in `6129568`; earlier prompts are preserved in `eab3b8c`.

## Approved masters

- `assets/art/references/forager-approved-v1.webp`: supplied full creature image, for identity, anatomy, shell/flesh detail and mucus.
- `assets/art/references/mire-palette-approved-v1.webp`: soil color/wetness only; its animals and glowing shapes are not this Forager's design.

Both are lossless WebP conversions, with decoded RGBA pixels verified identical to the supplied images. They are not game-loaded assets. Animated poses remain generated interpretations, not pixel-identical copies of the creature reference.

## Review

Run `node tools/preview-forager.cjs`, then open/reload `reports/generated/forager-study.html`. Pause and 0.5×/1×/1.5× controls are available.

- `assets/art/previews/forager-sludge-keyframes-v3.webp`: 2×4 atlas, eight 506×378 frames, shared crop/scale, no per-frame resizing.
- `assets/art/previews/forager-sludge-cycle-v3.gif`: eight drawn poses at eight poses/second; about one second per loop.
- `assets/art/previews/forager-sludge-cycle-v3.mp4`: five repeats, 24 encoded frames/second using repeated poses.

Belly and feet partly merge into contact mud/slime. The darker ground separates the maroon muscles and stained bone. Re-centering recovers tips clipped in the preferred pose sheet. Each cell is cropped by three pixels at its edges to remove gutters. No optical-flow morphing: it ghosted the limbs and was discarded.

These include painted terrain/lighting and are review media, not transparent runtime sprites or a completed terrain renderer. The game loads none of them. Prototype source is unchanged relative to this branch's main base. No combat, pathing, economy, replay or canon changes. Anatomy, registration and movement still need human review before integration.

## Production prompts

Built-in imagegen. Ground editing starts from the preferred detailed pose sheet to limit anatomy drift. A fresh generation from the full illustration changed anatomy and was discarded.

<details><summary>Detailed creature / dark mire edit</summary>

Precise background-only material edit of an EIGHT-FRAME Forager animation sheet. INPUT 1 IS THE MASTER FOR THE CREATURE: the user specifically prefers its detailed sharp rendering over subsequent simplified versions. Retain its actual creature drawing: all dorsal plate shapes, intricate chipped bone texture, muscle fibers and folds, dark wet red flesh, amber organs, tiny grime and mucus details, claws, lighting, positions and eight poses. Do NOT repaint the animal with smoother simpler shapes, change its body proportions, reduce detail, soften it, or apply the background color grade to it. INPUT 2 IS THE SOIL PALETTE AND WETNESS REFERENCE ONLY. Ignore its creatures, shell shapes, glowing bands, horizon, camera, and composition. Apply to the GROUND ONLY the second reference's near-black peat-brown substrate with muted dirty olive and umber oily highlights, very dark wet organic biofilm. The soil should be much darker, less saturated and quieter than the creature, like a fetid living swamp: uneven folded membranes, subsiding organic mud and low pools, but no competing red-purple ground tendrils, bright golden bubbles or uniformly sparkling high-frequency highlights. Do not make a flat black backdrop; keep grounded living sludge with subtle broad oily highlights. Keep mucus bridges and mud overlapping the animal's lower belly and feet, so they partially merge physically into the ground while the carapace and red muscles stay visually distinct and richly drawn. Retain the eight DIFFERENT successive crawl poses and their moving sticky membranes. Keep the ground landmarks registered between frames, same colors and light in every panel, no camera or exposure drift. EXACT LAYOUT: TWO columns by FOUR rows, row-major sequence, equal 4:3 panels, portrait sheet aspect ratio 2:3, same gutters as input 1. Preserve creature magnification and detail. If a claw or nose touches a panel boundary, shift the WHOLE creature a few pixels LEFT within that panel to recover its full tip; do not globally shrink or zoom out. No anatomy redesign, extra limbs, extra creatures, text, labels or interface. Main priority: creature drawing from INPUT 1; soil colors and subdued oily wetness from INPUT 2. This is an animation-sheet edit, not a new concept illustration.

</details>

<details><summary>Framing repair</summary>

One precise FRAMING REPAIR, not a redesign. Input 1 is an approved eight-pose animation sheet with the right detailed creature and dark olive-brown ground. Some heads/claws are cropped by the right edge of each cell. Input 2 is the FULL creature anatomy master for reconstructing those missing tips only. Keep input1's exact TWO columns and FOUR rows, all poses, rich detailed creature drawing, colors, dirty chipped carapace, muscle texture, slimy terrain and ground landmarks. In EACH 512x384 panel, TRANSLATE the whole creature about 60 pixels LEFT at its CURRENT SCALE, without resizing or rotating it. This leaves the tail about 30 pixels inside the left edge and recovers room for the full face and hook tips on the right. Complete missing nose/jaw and claw tips accurately from input2. Do NOT zoom out, shrink, simplify, smooth, redraw the armor pattern, change muscles, add limbs or change identity. Maintain the same registered center shift for all eight frames. All head, jaws, claws and tail tips must be completely visible inside their own cell with a clear 15 pixel margin. Keep each animal physically merged into its local slime contacts; refill only local contact ground where the shift uncovers it. Current background stays near-black peat-brown living tissue with muted olive oily reflections, lower contrast than red muscles and stained pale bone. Keep precisely the eight successive hooked-foot crawling poses and cyclic abdominal compression from input1, same camera and light throughout. No text, no numbers, no new objects, no borders except existing thin gutters. Output exactly the same portrait 2:3 sheet with two equal columns and four equal rows. Preserve texture and anatomical detail as strongly as possible; this is moving an existing detailed animal left inside each frame, not making a new version.

</details>
