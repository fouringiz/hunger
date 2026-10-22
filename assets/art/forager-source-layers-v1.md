# Forager source-layer alignment v1

The anatomy master is `references/forager-approved-v1.webp`. It was compared against the player's latest attached reference and has identical decoded RGBA pixels. No new creature was generated for this revision.

`studies/forager-source-layers-v1.webp` packs six non-overlapping regions cut directly from that master: ground, torso, three visible leg regions and front mud/contact. Source/atlas rectangles are in the adjacent JSON manifest. The atlas is lossless WebP with alpha. At rest, compositing every region at its original position reconstructs the complete master exactly, including the original mud/slime occlusion; decoded RGBA equality was checked with native offscreen Canvas after WebP encoding.

These are preliminary region masks, not finished animation cutouts. The foreground region still includes pixels at the animal/mud boundary; refining those boundaries and restoring hidden surfaces is required before moving the limbs. No new walk is claimed complete.

Run `node tools/preview-forager-puppet.cjs` and open `reports/generated/forager-puppet-study.html`. The existing filename is preserved so the current tab can simply be reloaded. The page shows the approved motion reference and the static source/assembly comparison. Region checkboxes inspect the preliminary separation. It uses no simulation code.

The previous puppet was rejected, not accepted as a substitute; details remain in `forager-puppet-v1.md` and commit `36dcffd`. Browser/mobile subjective animation and performance have not been newly validated.
