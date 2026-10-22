# Forager motion study v1

Opt-in, rendering-only sample for one caste. This is not a roster or terrain rollout.

- Runtime seed: `assets/hunger-forager-wave-v1.webp`, 280×80, transparent, about 14 KiB.
- Seven transverse slices follow delayed positions on the existing simulation path; the entity's position is the nose anchor.
- Six pairs of legs use distance-driven metachronal phases. Stance contacts are fixed on the path; the body does not bob.
- Belly alpha and wet-contact/vein stamp are cached once. The contact layer expires after one second and stores at most 256 stamps.
- `?foragerWave=1` enables this Forager renderer during play. Other castes and the usual terrain retain their existing rendering. Missing art uses the legacy fallback.
- `node tools/preview-forager.cjs` builds `reports/generated/forager-study.html`: exactly one actual simulated Forager, normal/Sprinter/stop/resume/two corners. The organic ground in that review page is a static, seeded local sample, not the final animated terrain implementation.
- Review movie: `assets/art/previews/forager-wave-v1.mp4`; no movie is loaded by the game.

## Seed generation

Built-in image generation; reference: the upper-left Forager in `assets/hunger-ground-actors-v3.png`.
The selected transparent image was normalized to one shared body canvas; there are no generated animation frames.

Prompt:

> Production game sprite seed for procedural animation. Keep the Forager's red flesh, ivory cracked chitin and orange sensory organs. One isolated horizontal body facing east, tapered tail at left and compact pointed ivory head at right. Low flexible centipede anatomy, seven overlapping dorsal plates, red muscular abdomen. Orthographic 2.5D camera looking down about 45 degrees, back and both sides visible, not a side profile. Belly near the ground. Short leg attachment stubs only; long jointed legs are drawn by code. No wings, fins, raised tusks, detached appendages, cast shadow, floor, scenery, labels or glow. Transparent background, full body with margins. Detailed painted RTS materials, readable at game scale.

## Validation boundary

Motion reviewed in native offscreen captures at 1× and enlarged. No browser/mobile performance or subjective feel claim is made from those captures. Tests cover bends, stopped motion, fixed stance contacts, Sprinter acceleration, bounded traces, missing-art fallback and rendered/headless state equivalence. Combat functions and replay fingerprints are unchanged.
