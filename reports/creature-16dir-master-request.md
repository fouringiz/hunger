# Creature 16-direction atlas: source audit

Status: stopped before baking, as requested when diagonal masters are missing.
Branch: codex/creature-16dir-atlas, from freshly fetched origin/main.

Inspected both assets/art/sources/*-headings-4x4-v1.png visually. Each has four cardinal views with four gait phases. Missing for EACH creature: southeast (45 degrees, screen down-right), southwest (135 degrees, down-left), northwest (225 degrees, up-left), northeast (315 degrees, up-right). Angles increase clockwise from screen right. Need four phases for each new view, not one still image.

tools/bake-forager-crawl-v2.cjs currently rebuilds only rows 3,4,5,11,12,13 from authored front/rear cycles. It applies a small affine offset to adjacent rows and inherits all other rows from the existing atlas. It is not a general reconstruction of unseen anatomy from four flat views. Applying a 45-degree warp to these sources cannot reliably reveal the missing shell/leg occlusions or belly silhouette.

## Carapacid prompt

Attach assets/art/sources/carapacid-headings-4x4-v1.png as the identity and phase reference.

> Create one production sprite sheet of the exact same temporary Carapacid from the attached reference. Preserve its broad low shell, arched side overhangs, existing legs, head, proportions, texture, colors and fixed elevated game camera; do not redesign it. Transparent background, no scenery, text, labels, cast shadow or detached mud. Exactly 4 rows by 4 columns, 16 complete isolated creatures with generous transparent gutters and no clipped limbs. Row 1 travels diagonally DOWN-RIGHT on screen (45 degrees from right); row 2 DOWN-LEFT (135); row 3 UP-LEFT (225); row 4 UP-RIGHT (315). Rotate the creature around its upright axis on the ground, never rotate the camera or tilt the whole image. Show the physically correct visible side, head, rear and occlusion of legs for each heading. In each row the four columns form one looping crawl: match the gait phases of columns 1–4 in the reference, with alternating planted and lifted feet, clear foot tips and believable weight. Keep one shared scale, body anchor and lighting across all 16 cells. Planted feet must meet the same ground plane; lifted feet must visibly clear it. Make the silhouette readable at 70 pixels wide. Deliver the whole sheet in one image.

## Leech prompt

Attach assets/art/sources/leech-headings-4x4-v1.png as the identity and phase reference.

> Create one production sprite sheet of the exact same Leech from the attached reference. Preserve its maroon segmented flesh, bone mouth armor, toothed opening, tapered tail, proportions, texture, colors and fixed elevated game camera. Transparent background, no scenery, text, labels, cast shadow or detached mud. Exactly 4 rows by 4 columns, 16 complete isolated creatures with generous transparent gutters and no clipped tails. Row 1 travels diagonally DOWN-RIGHT on screen (45 degrees from right); row 2 DOWN-LEFT (135); row 3 UP-LEFT (225); row 4 UP-RIGHT (315). Rotate the creature around its upright axis on the ground, never rotate the camera or tilt the whole image. Show correct mouth visibility and body overlap for each heading, including the rear views. In each row the four columns form one looping belly crawl: match the contraction/extension phases of columns 1–4 in the reference. The belly stays low on the ground with a clearly readable underside contact contour, no legs and no hovering. Keep one shared scale, body anchor and lighting across all 16 cells. Make the silhouette readable at 55 pixels wide. Deliver the whole sheet in one image.

## Resume

1. Inspect and approve the two diagonal cycle sheets; store the reproducible inputs under assets/art/sources/.
2. Bake eight authored headings plus eight intermediate 22.5-degree headings with consistent scale and anchors; carry contact coordinates through the same transforms. Export per-frame foot contacts for Carapacid and belly contact polylines for Leech to JSON beside each atlas. Contacts must distinguish visible/planted support from raised or occluded anatomy.
3. One rebuild command must generate both atlases and contact files from committed inputs; no manually prepared temporary paths.
4. Add tests for all 16 rows, margins/alpha fringes, contact bounds and meaningful gait variation.
5. Runtime integration needs explicit scope expansion: prototype/index.html creatureCrawlPose currently quantizes angles by PI/2 modulo 4. Asset replacement alone cannot make it select 16 directions. Keep simulation untouched; do not silently edit renderer under an assets/tools-only request.
6. Once renderer integration is authorized, capture actual diagonal-route motion before/after with tools/capture-organic-world.cjs, inspect the sequence and run npm test.

No atlases, contact JSON, renderer, simulation or balance values changed during this audit. No after images or completion claim: baking is blocked on source views. Baseline test result is recorded in ACTIVE-WORK-CHECKPOINT.md.
