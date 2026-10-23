# Gate — reference notes

## Take
- `ancient-gate-user-v1.png`: a free-standing **ring**, not an arch; massive thickness; concentric stepped bands; weathered mineral stone; a deep turbulent cyan opening; the base sunk into liquid.

## Do not take
- From `ancient-gate-user-v1.png`: the gothic cathedral towers and spires on both sides.
- Medieval castle masonry, pointed windows, turrets, brick coursing. The Gate is ancient unknown mineral technology, not a fortress.

## Rejected
- `gate-runtime-rejected-v1.png` — procedural v1: coarse blocks, oblique segmented hoop, flat cyan grid (verdict 2026-10-23).
- `../../../studies/ancient-gate-runtime-v3.png` — imagegen v3: gothic castle arch instead of a ring; a single flat sprite with no rear/front layers, so creatures cannot pass through it with correct depth; cropped by the map edge (verdict 2026-10-23).

## Runtime constraints
- Projection: `gatePoint(across, height, depth)` in `prototype/index.html`.
- The barrier crosses the lane exactly at the leak point `(930,420)`.
- No opaque Gate pixel over any of the sixteen build footprints, especially slot 15 `(890,300)`.
