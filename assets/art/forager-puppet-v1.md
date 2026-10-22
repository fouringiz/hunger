# Forager articulated bitmap study v1

Review only, requested and approved as an experiment after the painted crawl in PR #26. No game or simulation integration.

## Files

- `studies/forager-puppet-parts-v1.webp`: true-alpha generated bitmap parts, 1536×1024, about 456 KiB. Built-in imagegen; based directly on `references/forager-approved-v1.webp`. Body and near/far proximal/distal limbs plus contact mucus are separate regions. They are generated interpretations, not pixel-identical cuts from the approved master.
- `previews/forager-puppet-cycle-v1.gif`: offscreen preview using the same renderer as the interactive page. One repeated gait cycle; the following camera's scrolling soil resets at the GIF loop seam. The live viewer continues travelling.
- `../../tools/lib/forager-puppet-study.js`: isolated bitmap puppet and cached procedural soil, no dependencies or game imports.
- `../../tools/preview-forager-puppet.cjs`: generates `reports/generated/forager-puppet-study.html` with pause, stopped/normal/faster travel, close-up/game-size sample and optional contact markers.

## Motion

Six two-bone legs reuse the near/far bitmap pieces. Each foot stays at one world-space point throughout stance, then lifts and transfers to the next contact using a continuous curve. Knee positions are solved from the hip and foot. The following camera moves the cached soil by the same distance as the body travels. All gait phases and subtle torso compression derive from distance, so zero movement freezes the pose. No independent clock advances the limbs.

Far legs render behind the torso, near legs in front. Thin mucus images and oily contact folds overlap planted claws. The generated sheet has uneven part placement; source rectangles and a torso clip isolate neighbouring pieces without flattening alpha. No per-enemy filters or image generation at runtime.

## Verification and limits

- `node tools/check-forager-puppet.cjs`: checks invariant world-space feet during stance, both limb lengths, continuous transfers including exact phase boundaries, finite poses, distance-driven freeze and faster travel.
- Viewer smoke checked with the real alpha atlas and native offscreen Canvas: playback, pause, zero speed, faster speed, small sample and contact-marker drawing.
- Offscreen poses inspected at multiple phases; generated atlas, alpha and rendered framing checked. Prototype source is untouched; combat/replay tests were not rerun for this isolated study.
- One fixed camera and straight travel only. Turns, additional directions, final terrain, deformation of the full torso and crowd/mobile performance are not implemented or validated. Browser subjective review remains for the user. The small-size option is a scale sample, not a claim about actual game integration.
- Soil is a temporary cached procedural backdrop. The detailed organic terrain from the approved palette reference remains a separate future integration task.

## Generation prompt (built-in imagegen)

```text
Use case: precise-object-edit / background-extraction.
Asset type: layered 2D game puppet parts atlas, ONE fixed three-quarter camera, facing right.
Input image: the approved Forager anatomy and material master. Preserve the same low broad crawling animal, maroon wet folded muscles, dirty ivory sharply chipped bone shell, amber eye pits, hooked jointed limbs and revolting sticky slime. This is a production separation of that exact creature, NOT a redesign.
Output one TRANSPARENT PNG atlas, landscape 3:2, EXACTLY THREE equal columns by TWO equal rows (six equal cells), generous clear alpha margins, no text or guides.
CELL row1 col1: complete horizontal head+armored torso+abdomen ONLY, all walking limbs removed and hidden body underneath reconstructed. Tail left, head right. Preserve its hunched bulky proportions, face and mandibles, extraordinarily detailed muscle and dirty perforated bone. No feet attached, no ground.
CELL row1 col2: one proximal walking leg piece, from rounded fleshy shoulder at LEFT to rounded elbow at RIGHT. Roughly horizontal, slight bend only. Chipped bone armor over maroon tendons, generously rounded overlapping joint ends for animation.
CELL row1 col3: one distal walking leg piece, from rounded elbow at LEFT to long planted hooked claw TIP at RIGHT, roughly horizontal with slight downward curve. Match the thick hooked limbs of the reference, not a thin insect stick. Both endpoints completely visible.
CELL row2 col1: corresponding FAR-SIDE proximal walking leg from left shoulder to right elbow, same anatomy slightly darker, approximately horizontal.
CELL row2 col2: FAR-SIDE distal walking leg, elbow left, claw tip right, same anatomy slightly darker.
CELL row2 col3: a small low horizontal patch of transparent sticky brown/olive contact mucus, a few stretched wet filaments only, no opaque rectangular ground.
Each piece wholly isolated inside its own cell with 10 percent empty transparent margin. Body fills its cell horizontally. All parts share the identical camera, lighting, texture quality and scale family. White bone and maroon muscle stay distinct. Absolutely no scenery, no dark matte, no cast ground shadow, no checkered background, no duplicate animal, no extra cells. True transparency. These are individual movable bitmap pieces, not six animation poses.
```
