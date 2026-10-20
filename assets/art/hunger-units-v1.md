# Hunger units — visual prototype

Generated with the built-in image generation tool, 2026-10-19.
This is a first playable art pass, not a canon revision or final animation sheet.

Atlas: `../hunger-units-v1.png`, 3 columns × 2 rows, equal cells.
Top row: Forager, Carapacid, Leech. Bottom row: Turret, Cannon, Generator.
Directional sprites face right; runtime rotates them to face their travel/aim direction.

## Generation prompt

Production-ready 2D sprite atlas for THE HUNGER, dark science fiction tower defense.
Exactly three columns by two rows, equal square cells, transparent background,
no borders or labels. Six isolated sprites centered with transparent padding.
Consistent overhead orthographic camera, hand-painted RTS assets, broad readable
shapes, light from upper left. Forager: headless three-lobed rusty red flesh,
ivory ceramic plates, three muscular appendages, amber sensory pores.
Carapacid: broad overlapping ivory and terracotta shields over flesh, five squat
supports, armored wedge. Leech: plum-purple siphon body, translucent lavender
energy sacs, circular feeding mouth and gripping tendrils. Turret: dark bolted
base, olive armor, cyan light, twin barrels. Cannon: heavy circular emplacement,
thick cannon, brass recoil cylinders and orange markings. Generator: industrial
base, cylindrical turbine with mint coils, brass fins, insulated conduits and
hazard markings. All directional units face right. No environment or text.

## Cutout refinement

Remove all environmental background and external shadows. Preserve the six
objects, cell positions, scale and canvas dimensions. Use actual transparent
alpha around clean edges; no gradient, checkerboard or solid backdrop.
