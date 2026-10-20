# Voltaic Tower — sprite v1

Generated with the built-in image generation tool on 2026-10-21.
Asset: `../hunger-voltaic-v1.png`. Single transparent sprite, overhead camera.
Style reference: the human towers in `../hunger-units-v1.png`.
This is presentation art, not a canon or balance revision. Lightning, charge
indicators and discharge flashes remain runtime effects; the asset is static.

## Generation prompt

Use case: stylized-concept. Create exactly ONE production game sprite: Voltaic Tower (Tesla) for THE HUNGER, a dark industrial sci-fi tower-defense game. The attached image is STYLE REFERENCE ONLY: match the bottom-row human Turret and Cannon's painted metal finish, heavy bolted machinery, olive armor and worn steel; do not reproduce the atlas or any other object. True overhead orthographic view, same camera as those tower bases, no horizon or isometric side view. A squat compact circular steel emplacement with four short anchoring feet, two large clearly readable copper coil lobes around a central ivory ceramic insulator and silver discharge crown. Strong simple silhouette distinguishable at 64 pixels, central output terminal precisely at image center so runtime lightning can originate there. Human-built military electrical equipment, bone-colored manufactured ceramic, no flesh. Copper is the main warm accent, tiny restrained pale cyan indicator lights; avoid looking like the mint-green turbine generator. Painted RTS sprite with dark contours, broad panels, subtle chips, upper-left lighting. Single square canvas, entire object centered occupying about 82 percent of image width and height, transparent padding on every side. Actual transparent alpha background; no environment, no ground plane, no backdrop, no cast shadow outside the object, no checkerboard. Static uncharged equipment only: NO lightning bolts, no glow cloud, no sparks, no smoke; those are dynamic game effects. No text, letters, numbers, labels, logo, watermark or border. Generate a single complete sprite, not a sheet or alternatives.

## Checkpoint

- Asset and generation prompt saved; original generated alpha preserved.
- Next: load as a separate image, retain the existing vector fallback, check
  rendered scale alongside Turret/Cannon and keep existing effects visible.
- Then: regression tests, focused rendering/fallback checks, independent review.
