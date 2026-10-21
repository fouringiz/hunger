# Grounded 2.5D art pass v2

Generated with the built-in image generation tool. All current creatures crawl;
flying castes are separate future units. The map remains overhead. Buildings and
creatures show raised side surfaces under a fixed elevated RTS camera.

## Assets

- `../hunger-structures-v2.png`: stationary Turret/Cannon foundations, Generator,
  Barracks and four directional upper assemblies per weapon. Explicit source
  rectangles and measured mounting pivots live in the renderer; generated cells
  are not assumed to be perfectly aligned. Foundations never turn or recoil.
- `../hunger-crawlers-v2.png`: Carapacid and Leech, two crawling poses each, shared
  scale per creature and ground anchors. Runtime mirrors left/right without
  rotating their bodies in the canvas plane.
- Existing `../hunger-infantry-trial-v1.png`: infantry and Forager now share the
  same perspective with both other creatures, including outside infantry mode.

## Reproduction prompts

### Crawlers

Production game sprite sheet. Four isolated grounded crawling creatures, 2 × 2
transparent grid. Top row: the same heavy Carapacid in two crawl poses, rust-red
flesh and overlapping ivory shield plates, multiple short load-bearing legs.
Bottom row: the same purple muscular Leech in two crawl poses, tendrils dragging
along the ground, ivory mouth teeth, restrained violet luminescence. Reference
`hunger-units-v1.png` for creature identity and `hunger-infantry-trial-v1.png` for
an elevated three-quarter RTS camera, visible side and top surfaces. Face right,
consistent scale and contact line between poses, strong readable silhouettes,
upper-left illumination. No flying, hovering, wings, scenery, platform, text,
watermark or painted backdrop. Genuine alpha transparency.

### Structures

Production modular RTS atlas, 4 columns × 3 rows. Fixed elevated three-quarter
camera. Scratched olive armor, charcoal machinery, brass trim, mint lights.
Top row: stationary twin-gun foundation only; stationary cannon foundation only;
complete upright green-energy generator; complete grounded Barracks with pitched
ribbed roof, visible front door and foundation feet. Square foundations aligned
with screen axes. Second row: the same isolated twin-gun upper assembly in world
yaw UP, RIGHT, DOWN, LEFT; no foundation. Third row: the same isolated single-barrel
cannon upper assembly UP, RIGHT, DOWN, LEFT; no foundation. Fixed camera and light,
consistent mounting pivot and scale, transparent margins between components.
References: `hunger-units-v1.png`, `hunger-voltaic-v1.png`,
`hunger-infantry-trial-v1.png`. No scenery, labels or separate painted shadows.

## Scope and limits

Soldiers have slot-seeded visual offsets around the nearest lane frontage:
stable across frames and replays, non-collinear, no simulation RNG. This changes
render placement only; physical blocking points, damage and balance stay intact.
All actors sort by rendered ground depth. Weapon art uses four yaw directions;
creatures use mirrored crawl poses, not a complete eight-direction animation set.
Missing/loading art has a fallback. Preview: `reports/generated/coherent-2-5d-preview.png`
(ignored); checks: `tests/coherent-art.cjs`, existing art and combat/replay suites.
