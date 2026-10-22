# Ground-crawl bodies v4

Production file: `../hunger-crawl-bodies-v4.webp` — 768×768, WebP quality 88, 131,410 bytes. Nine 256×256 cells. Only this new compressed runtime asset is added; consolidating the older PNG atlases remains a separate optimization.

Rows: Forager, Carapacid, Leech. Columns: east-facing low side view, north/rear view, south/front view; east is mirrored for west. Each row uses one shared scale, with its largest body dimension 224 px. Body anchor: (128,236) inside each cell. Empty pixels retain alpha. The old atlases remain loading/failed-image fallbacks.

The renderer supplies 6/8/10 jointed legs respectively. Gait is driven by travelled distance: feet remain planted during stance, move forward during swing, and stop when the enemy stops. The body masks the limb roots; short near-side lower limbs are drawn over the belly. Leech body strips contract subtly with travel. These are presentation components, with no changes to movement, targeting, damage or collision bounds.

## Generation reference

Built-in image generation, referencing `hunger-ground-actors-v3.png` for identity and materials. One 3×3 sheet of compact ground-creature bodies, three castes by three views. Painted military sci-fi 2.5D, camera about 30° above ground, rusty muscular flesh, ivory armor, purple electrical sacs. Preserve creature identity across views. Bodies only, short flush sockets, no wings, tall crab stance, hovering poses, extended tendrils/cables, human soldier, scenery, labels or shadows. Transparent background and clear gutters.

The generated 1254×1254 source was inspected, cropped by measured alpha bounds, packed into fixed cells and encoded as WebP. Body bounds before normalization, by row:

- Forager: (24,154,440,242), (523,143,300,260), (922,141,297,261).
- Carapacid: (19,486,461,300), (496,476,365,317), (890,470,349,319).
- Leech: (17,927,493,231), (554,895,298,262), (914,884,325,281).

Generated source and QA frames are under ignored `reports/generated/`. Diagnostic previews are not runtime-loaded assets.
