# Level-four authored views v2

The approved design reference remains `references/towers/level4-selected-approved-v1.png`.
The generated implementation awaits the user's iteration-3 visual verdict.

- Runtime atlas: `../hunger-level4-towers-v2.png`, 4096 × 2048, 16 columns × 8 rows,
  256px cells. Machine Gun, Rifle, Prism, Howitzer, Plasma and Cryojet each have
  16 authored world-yaw views at 22.5° intervals. Tesla/Cluster retain one fixed
  view, copied pixel-for-pixel from v1.
- Metadata: `../hunger-level4-towers-v2.frames.json`; each pose has its own bearing
  and muzzle, source measurements, source hash and rectangle. One bake scale is
  used for every pose in a family. No frame-wise bounding-box fitting at runtime.
- `../../tools/bake-level4-poses.cjs <source directory>` packs the whole sheets and
  a `manifest.json` of authored anchors. Intermediate sheets/repairs remain in
  ignored `reports/generated/level4-poses/`. Focused rear-view repairs were
  normalized against neighboring views before packing. Only final atlas/metadata
  enter Git. Prompt/provenance record: `level4-towers-v1.prompt.txt`.
- The inline `LEVEL4_ART` table matches metadata, with no JSON fetch or canvas
  pixel reads. Atlas layout changed, so the runtime filename is versioned v2.
- The former `hunger-level4-yaw-v1` PNG/metadata and runtime projection path are
  removed. General `weaponProjection` still serves levels 1–3 and Flamethrower.
- When the selected direction changes, a60ms transition blends the currently
  displayed pose into the next on a transparent additive buffer, preserving
  common opaque pixels. A held heading resolves to ONE opaque source image.
  Muzzle anchors use the same transition weights. This is sprite blending, not
  image-plane projection. Brief transitions can soften/double an outline; review
  the full timed turn and live cycles, especially Rifle/Cryojet.
- The bearing remains on TOWER_SOCKET, including the iteration-2 bounded visual
  recoil. Actual flashes use the current displayed heading, rather than a stale
  firing heading. In-flight shell launch points remain pinned.
- Common foundation geometry and placement remain unchanged. Combat, targeting,
  balance, PATH, GATE_D and all platform positions are outside this iteration.

See `../../reports/level4-review/iteration-3-rotation.md` for results and actual-game
before/after frames. File-origin browser console validation and human visual
acceptance remain separate from native tests/captures.
