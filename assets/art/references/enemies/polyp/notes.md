# Polyp — visual development

Status: user supplied seven primary fusion references after the initial moodboard. Proceeding to provisional silhouette studies using this selected direction; no finished silhouette or anatomy approved yet.

Source: user brief `/Users/home/Downloads/polyp-designer-brief.pdf`, 6 pages, dated 2026-10-27. Text extracted and all six pages visually inspected. User clarified that the PDF is the task; intermediate saves are part of carrying it out.

## Delivery stages from the brief

1. Moodboard: 15–25 references. Delivered proposal: 16 annotated references in `moodboard-v1.html`; provenance in `moodboard-v1.json`. Standalone offline copy with embedded images: `reports/generated/polyp-moodboard-v1/polyp-moodboard-v1.html` from repository root.
2. Three black Polyp silhouettes, each large and at 50 px.
3. Shared-scale concept sheet: Polyp, Zygote, Polypoid, plus Polyp death with six falling zygotes.
4. All three at game size on the actual ooze lane, color and grayscale.
5. Transparent WebP sprites/atlases, direction count and cell/frame layout agreed before production.

The brief explicitly requires each stage to be approved before the next. The first concrete approval item is the completed moodboard, not permission to start research.

## Observable criteria, before implementation

- Polyp: six distinguishable folded bodies around a seventh carrier; reads as a forced colony rather than one animal. Thick raised pale-pink fusion seams separate the lobes at 40–50 px on a 960×540 canvas.
- Lobes: folded discs held to the carrier by their own tentacles, sewn/interwoven with neighbours. Unequal volume and orientation, no face/head/paired eyes or bilateral animal layout.
- Recognisable inclusions: fragments of existing Forager limbs, Carapacid plates and Polypoid envelopes. No human remains, new glass-ceramic growths, mechanical parts or blood splashes.
- Zygote: torn living lobe with a seam remnant, about 9×16 px. Six pieces can be counted separately; a twitching/pulsing threat rather than an inert corpse.
- Polypoid: low flat disc with five or six soft radial tentacles, about 34 px, paler and more translucent than its parent; torn seam on disc edge. No facehugger tail/fingers/bilateral form.
- Camera: same top/side projection as tower platforms. All three distinguishable against the brown ooze and in grayscale; enemies/towers remain the highest-contrast scene elements.
- Motion targets from brief: rolling heavy Polyp with unsynchronised lobes; seams flare then tear during ~0.3 s death; first/last zygote hatch at 0.5/3 s with accelerating pulse; ~0.15 s unfold; fast low Polypoid scuttle; short death pop. Four headings proposed by brief, final direction/frame counts pending.

## Critical review of reference selection

- Colony and tunicate references provide modular anatomy, but risk producing a pretty flower or smooth bunch of tubes. Use irregular folded lobes, not repeated rosettes.
- Coral references supply broad raised boundaries only; do not import a stone shell or fine brain texture.
- Brittle-star references supply a low disc and radial stance only; articulated calcified arms/spines are excluded. Static photos do not establish a running cycle.
- The Thing sculpture references supply tissue tension and mismatched fused volume only. Human parts, teeth and gore shown in those references are explicitly excluded from Polyp.
- Existing game references anchor recognisable fragments and palette. They are not new game captures or evidence of Polyp readability.

## Source discrepancy to resolve before integration

Passport v2.15 still says two offspring. Current implementation at `538832e` immediately spawns six Polypoids. The supplied brief instead describes six invulnerable zygotes hatching sequentially. Visual research follows the supplied six-lobe design; gameplay, passport and replay files have not been changed. Resolve the gameplay/document alignment explicitly at integration, not by silently changing simulation during concept work.

## Validation boundary

No game changes, tests, captures or browser game checks in this stage. No claim of visual compliance in-game. User runs the future checks under AGENTS.md. Game comparisons must use actual `tools/capture-organic-world.cjs` before/after images, full frame and close views; animation requires a full cycle. Independent visual review remains required before a visual PR merge.

Reference images and previews are stored under ignored `reports/generated/`; only the lightweight board, manifest and notes are committed. External references are not runtime assets or licensed source art for shipping.

Moodboard visual review: all selected images opened in a contact sheet. Removed two weak search results: a distant aquarium shot and a branching basket-star image mislabelled by search metadata. Retained IDs preserve provenance; gaps 08 and 13 are intentional. The final selection contains 16 references.

## User reference direction — 2026-10-27

Primary board: `user-references-v1.html`; provenance: `user-references-v1.json`. Seven supplied JPEGs are preserved without image edits. Together with the 16 secondary references, the collection contains 23 references. User-supplied means reference selection, not approval of human anatomy for Polyp.

U5/U6 anchor recognizable individual bodies and interlocking restraints; U1 anchors stretched tissue bridges; U4/U7 anchor conflicting outward pulls. U2/U3 inform mismatched axes and a low heavy mass. Preserve PDF restrictions: no humans, head/face/paired eyes, joints as primary locomotion, blood or mechanics.

Silhouette candidates (proposed): A compact knot with six folded lobes; B low spread colony with interwoven hydrostatic tentacles; C skewed tumbling mass with unevenly stacked lobes. All at the same top/side game camera. Black fill must read as several joined bodies, even before pale seams are added. Each needs an exact 50-pixel-width view; illustration thumbnails alone do not prove scale.

## Silhouette study result

Built-in image_gen produced a three-option sheet, now saved under ignored `reports/generated/polyp-silhouettes/polyp-silhouettes-v3.png`. `review.html` shows the sheet and each measured black-body bound at exactly 50 CSS px width using SVG viewports into the original raster (no image edits by code). Browser inspection of these small views remains pending/user-run; no game screenshots taken.

Pass 1 rejected for stalks, flower-like lobes and large separations; pass 2 compresses the bodies; pass 3 changes fill to solid black. Large-sheet review confirms the obvious stalk failure is reduced and no recognizable human heads/hands/faces remain. Provisional preference B for low heavy stance. A risks regular rosette; C risks too much height. Exact six-body readability and separation from a generic tentacled lump remain unresolved, particularly at game scale. Do not mark the concept accepted or move to final colored art/atlases until user selection and refinement.

## Selected B and color concept — 2026-10-27

User explicitly selected B (`б`); do not re-ask A/B/C. B's low wide direction is accepted as the basis for the next concept stage, not final asset/art acceptance. B refinement v1 still showed five main lobes. V2 split the rear mass, producing two rear, two flank and two front lobes in the large view. Files in `reports/generated/polyp-silhouettes/`; no runtime changes.

Stage 3 proposal: `reports/generated/polyp-concept/polyp-concept-b-v2.png`, viewable with the refined B and 50 CSS px silhouette in `reports/generated/polyp-concept/review.html`. Built-in image_gen; exact prompts in `selected-b-prompts.md`. V1 retained for provenance; v2 corrects the Polypoid/parent display-size relationship. This is approximate illustrated proportion, not calibrated runtime sprite scaling.

Observed in large sheet: six surrounding parent lobes; pale raised tissue bridges; headless soft violet anatomy; lighter unfolded radial Polypoid; six detached pieces surrounding a collapsed central carrier in the separation panel. Selection B remains low/wide. No exact projection or game-scale compliance claimed.

Reasons to reject/refine: Polypoid's six tentacles are still quite regular and the disc may read as a starfish; some seams are thin membranous webs rather than thick raised scar tissue; old Forager/Carapacid inclusions are not clearly identifiable at this scale. Review these with the user before declaring the anatomy final. Pure-black silhouette still hides some body boundaries at small size. Movement, living zygote pulse, continuous hatch sequence, actual lane contrast/grayscale and shared camera with platforms are pending. User owns game checks.

Next: user acceptance or corrections to this COLOR concept, then the separate game-size context stage. Do not start animation/atlases or alter simulation yet.
