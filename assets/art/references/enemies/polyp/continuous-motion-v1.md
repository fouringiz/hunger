# Polyp continuous deformation study v1

## Exact extraction prompt (built-in image_gen)

Precise background extraction of the approved POLYP creature on the LEFT of this image. Output ONLY that exact LEFT creature as a clean reusable 2D animation source on a genuinely transparent alpha background. REMOVE the floor, ground cast shadow, grey backdrop, BOTH text labels, and the entire right-hand Polypoid. Keep ALL pixels and details of the left creature's appearance as faithfully as possible: identical pose, camera, overall proportions, silhouette, every appendage, ribbed plum tissue upper left, smooth blue-grey sac on right, broad folded membrane lower left, two bronze perforated plate groups, thick raised pale-pink scar bridges. Do not redraw, redesign, smooth, recolor, relight, change anatomy or change its contour. No newly exposed hidden anatomy. Leave clear transparent holes between its appendages. Center the full creature with about 12 percent transparent padding on all sides so no extremity is clipped. Absolutely no checkerboard painted into the image, no grey drop shadow, no floor, no extra creatures or text. This is a CUTOUT of the accepted artwork for mesh animation, not a new concept.

User authorized the next continuous-animation stage after accepting the shape and motion references. This is a one-view procedural animation study, not a final multi-direction sprite atlas. Final cell/frame/direction layout remains undecided.

## Criteria before implementation

- Different tissue regions extend, compress and recover out of phase; the entire body must not behave as one uniformly scaled/bobbing sprite.
- Retain the accepted ribbed mass, membrane, smooth sac, plates and pale scars throughout the cycle. The isolated source must not be confused with an approved final runtime sprite.
- Plates follow rigid transforms, soft tissue blends around them.
- While a marked ground contact is in stance, its world position stays fixed; during recovery it lifts and returns. The tracked-camera ground scroll makes slipping visible.
- Cycle position and velocity join continuously at the boundary. Adjustable pause/scrub and a static-source comparison expose rather than hide jumps.
- Inspect full loop at large and 50 px scale, then actual game/background/projection/grayscale in a later integration stage. No claim follows from mathematical properties alone.

## Approach

Use the approved image's extracted Polyp as one texture on a continuous deformable mesh. Local displacement fields redistribute tissue; rigid islands protect two plate groups; contact constraints override only the relevant soft tip regions. Phase envelopes overlap. No cross-fades between separately generated poses, no optical-flow invention of anatomy, no simulation changes.

This cannot invent previously hidden anatomical surfaces or truly change mesh topology. It can extend/retract existing folds and protrusions from several regions. If the resulting motion reads as rubber-sheet stretching rather than crawling flesh, reject it and revise the source/rig; do not call the technique itself proof of success.

## Source

Built-in image_gen background extraction from `polyp-shape-approved-v1.webp`; local draft `reports/generated/polyp-continuous-motion/cutout-v1.png`. Source alpha is present; large-image inspection retains recognizable parts. Extraction may subtly alter painted detail and is not a byte-identical cutout. Full motion and browser verification are user-run under AGENTS.md.


## Prepared delivery — 2026-10-28

- Viewer: `reports/generated/polyp-continuous-motion/review.html`, self-contained texture/rig/controller. Optional accepted-reference images use relative local links.
- Sources: `tools/polyp-motion-rig.cjs` (continuous fields, rigid patches, contact gait), `tools/polyp-motion-viewer.js` (WebGL preview and neutral scrolling ground), `tools/build-polyp-motion-preview.cjs` (offline source metadata and HTML assembly).
- One view, provisional 5.2-second loop; no final atlas format/direction count committed. Four marked contacts are included as actual mesh vertices, so overlay markers cannot independently satisfy a different gait from the rendered anchor. Plate rotations account for the non-square source image.
- Source PNG is embedded as a data URL for texture upload. Browser code uses no pixel reads; offline alpha measurement establishes reference-width display scale. Actual file-origin browser behavior has not been verified.
- Controls: pause/scrub, speed, amplitude, ground movement, contacts, mesh, grayscale, light/dark neutral background, original-source pose. 50 px display keeps one shared source scale; extended silhouette can become wider.
- Builder ran successfully to write the HTML. This is artifact creation, not an animation/browser test. No math checks, screenshots, game captures or browser checks were run by the agent.

## User-run checks from repository root

```sh
node --check tools/polyp-motion-viewer.js
node tools/check-polyp-motion.cjs
open reports/generated/polyp-continuous-motion/review.html
```

To rebuild after edits:

```sh
node tools/build-polyp-motion-preview.cjs
```

The checker covers period/velocity continuity, planted world contacts including renderer vertices, rigid internal plate distances, local shape change, and sampled mesh folding. Known-bad whole-body scaling/bobbing, static slipping, and six-pose stepping must be rejected. Any failing check remains a defect to resolve; thresholds are not visual acceptance.

Observe at least three full loops, then slow down: compare against the accepted source; check the material/shape, apparent rubber stretching, plate rigidity, pointed extremities, 06→01 transition and green contact markers against grid intersections. Toggle the original pose to judge source extraction drift. Inspect 50 px and grayscale on both neutral backgrounds. Report console errors or the phase of visible defects.

## Still unverified / not implemented

- The extracted image has subtle detail differences; it is not newly artistically accepted.
- True emergence of entirely new anatomy is not possible with this single-mesh source; existing folds stretch/retract. Judge whether that realizes the desired amorphous motion.
- User results on initial rig: continuity, planted/rendered anchors, local proportions and rigid interior lengths passed; mesh sweep failed at phase .1 / triangle 5445 (area ratio .0056545352650638515). Browser render/performance and visual ground-contact mapping remain unverified. Revised rig has not yet been tested.
- No runtime asset, multi-heading animation, gameplay, paths, collision, balance or replay changes. No game-level comparison to actual lane/camera/actors yet. No claim that the requested game behavior is fixed or fully verified.

## Contact-collapse revision — 2026-10-28

User-reported fold/collapse is a real failure; >.02 area threshold remains unchanged. Contact supports now extend .180 UV instead of .075–.110, spreading the same tip correction across adjacent tissue. No gait/lift/stride or body-motion amplitude reduction. Added a regression at the reported phase/triangle that rebinds the old widths and must reject that known-bad configuration before accepting the revised one. The full sweep and all previous criteria still apply.

Candidate correction only: tests and full-loop visual comparison are user-run and pending. Compare regenerated `review.html` with retained `review-before-contact-support.html`; these standalone previews are not game captures. Reload the browser tab after rebuilding because rig code is embedded.
