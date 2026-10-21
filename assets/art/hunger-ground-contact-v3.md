# Ground contact and lower camera — v3

Built-in image generation/edit tool; local transparent assets, no build or external URLs.

- `../hunger-ground-actors-v3.png`: Forager, Carapacid, Leech, infantry.
- `../hunger-low-buildings-v3.png`: Turret foundation, Cannon foundation,
  Generator, Barracks, tall Voltaic, Gate.

Explicit source rectangles in the renderer follow measured material silhouettes,
not nominal grid cells. Each actor's underside/feet sits at ground y = 0. The
shadow shares that baseline. A single pose contracts continuously with travelled
distance; no timed pose replacement or vertical bob. The lower-angle soldier
uses the same ready pose during combat with the existing strike cue.

Weapon yaw is continuous: the existing east-facing textured upper assembly is
projected onto a shallow plane at the exact aim angle, with an extruded underside.
Only the upper assembly recoils; the new low-angle foundation stays planted.
This is a 2.5D textured render, not a new 3D engine or a direction-frame atlas.
The Voltaic has no facing ray; charge and bolt origin are at its raised cap.

Leech approach/feeding cues start at its rendered body and the Generator's port.
Copper Grounding veins sit on the rendered shield/body rather than below it.
Combat coordinates, movement rules and all simulation fingerprints are unchanged.

## Reproduction prompts

### Ground actors

Four isolated assets, 2 × 2 transparent atlas, fixed low elevated three-quarter
camera approximately 30 degrees above ground. Reference original unit atlas for
identity and palette; previous crawler and infantry sheets for painted finish.
Top left Forager: low trilobed rust-red belly, ivory chitin, amber pores, six short
splayed hooked crawling limbs on a common ground line; no raised winglike sickles,
wings, tall legs, hover or airborne pose. Top right Carapacid: low armored slug-tank,
overlapping ivory shield plates, belly barely above ground, tiny gripping limbs,
no raised knees or high crab stance. Bottom left Leech: flattened purple slug,
underside dragging, gripping tendrils on ground, ivory mouth, restrained glow.
Bottom right infantry: olive armored human, sealed mint-visor helmet, ivory
shoulder plates, boots planted, brass baton and guard, right-facing ready stance.
One pose each, consistent low camera/light, readable at game scale. No ground
patch, external shadow, backdrop, text, watermark or glow aura. Genuine alpha.

### Low buildings

Six isolated objects, 2 columns × 3 rows, low elevated three-quarter camera at
about 30 degrees, much more front/side wall and less roof. Scratched olive metal,
charcoal, brass, mint indicators, upper-left light, square screen-aligned feet.
First row: empty Turret and Cannon foundations, circular mounting sockets, no guns.
Second row: upright green Generator and armored pitched-roof Barracks with front
door. Third row: tall copper/ivory Voltaic column with spherical silver discharge
cap, no directional pointer; two armored Gate pylons with mint containment field.
No floor, shadow, scene, labels or extra objects. Genuine alpha transparency.
Reference the v2 structure atlas and original Voltaic art. A second extraction
pass removed ambient backdrop/glow around physical silhouettes while preserving
all six buildings and the field inside the Gate.

## Verification

`tests/coherent-art.cjs` covers continuous yaw and exact projected aim, stationary
foundations/recoil, fixed ground contact, model/presentation state parity,
non-collinear formations, tall Voltaic cap and asset fallbacks. Existing combat,
infantry, replay and presentation checks also pass. Simulation fingerprints match
main under v0.5, infantry, v04 and parityA; no replay restamping needed.

Motion QA: 96 offscreen canvas frames at 16 fps (6 seconds), continuous complete
weapon turn, fixed-step creature movement, Leech approach/attachment, and a static
six-frame contact sheet inspected. Generated evidence is ignored:
`reports/generated/ground-motion-preview.gif` and `ground-motion-contact-sheet.png`.
This is renderer QA, not a live-browser control or full campaign playtest.
