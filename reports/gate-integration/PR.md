The Gate's hard cutout edge and green material stood apart from the surrounding terrain, especially in Ember. Blend the footing into the existing mud, carry world-texture growth onto the lower masonry, add a soft ground shadow and cyan spill on ground and enemy silhouettes within 80 game pixels.

Preserve the accepted frontal projection, art anchor, full aperture geometry and existing teleport. All changes are presentation-only; combat, balance, PATH, GATE_D and build slots are unchanged. Zone grading warms Ember masonry while preserving the cyan portal. Creature burial now samples the lit floor to avoid unlit patches over the spill.

Before/after native game captures for Mire and Ember, whole frames and grayscale close-ups are in `reports/gate-integration/README.md`. Dedicated native-render tests cover geometry/source invariants, blending, palette correction, body lighting and contact-layer consistency. Browser/device performance and final artistic approval are not claimed.

Validation: full `npm test` passed; `git diff --check` clean.
