# Polyp — visual development

Status: stage 1 proposed; awaiting user review. No approved Polyp design yet.

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
