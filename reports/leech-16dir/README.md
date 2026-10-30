# Leech: 16 directions and baked belly contacts

Scope: Leech only; Carapacid redesign remains deferred. Continued from e6f2641 on codex/creature-16dir-atlas. The only game-code change selects 16 Leech directions instead of four in creatureCrawlPose. Simulation, speeds, collision radii, combat, PATH and GATE_D are unchanged. Replay restamping is not needed.

## Art and pipeline

- assets/art/work/enemies/leech/leech-headings-diagonal-4x4-v1.png: generated with built-in imagegen using leech-headings-4x4-v1.png as identity/camera/phase reference. Shown to the user before baking. Rows SE, SW, NW, NE; four gait phases each. Proportions/camera are similar; armor highlights are slightly brighter than the cardinal source.
- assets/runtime/enemies/leech-mire-v1.webp: 1024×4096, 256px cells, 16 clockwise headings (zero=right), four phases. Eight authored headings; eight intermediate headings use the same limited affine approximation as Forager. This is discrete 22.5-degree selection, not continuous 3D rotation.
- assets/runtime/enemies/leech-mire-v1.contacts.json: all 64 cells have a belly support polyline in cell coordinates. Master annotations exclude the raised tail; points are projected with the exact sprite transform and snapped to opaque pixels. These describe the visible support region, not a physics collision shape. The game does not consume the new JSON yet; shadows/splashes integration is outside this task.
- Archived cardinal PNG is flattened onto black. Extractor removes boundary-connected black matte while preserving enclosed dark details. Semitransparent edge colors are extended from adjacent opaque body pixels to avoid a dark/white fringe. WebP is lossless.

Rebuild both atlas and JSON:

```bash
node tools/bake-creature-crawl.cjs leech
```

Needs npm dependencies and Python with Pillow, as the Forager lossless encoder does. Uses CREATURE_PYTHON / FORAGER_PYTHON, system python3, or the installed Codex bundled Python. If none has Pillow, it stops with an explicit error.

The same tool accepts a JSON configuration path: kind, cell=256, frames=4, atlas output path, sources (file, authored row indices, normalized rowCuts, blackMatte), contactType and contactPaths. Contact paths are normalized to each extracted source frame; optionally provide four separate phase paths per heading. Future Carapacid rebuild is one command with its new source configuration; its eight visible-foot annotations must be authored against the new design first. Current Carapacid asset is byte-unchanged.

## Evidence / acceptance limits

All game frames are native captures of the actual renderer through tools/capture-organic-world.cjs, not sprites pasted over a map. No browser/device/performance playtest was performed.

- [Before route sequence](diagonal-before.webp), [after route sequence](diagonal-after.webp): same advancing body at d≈1290–1416. Old headings 1,1,1,1,0,0,0,0; new headings 4,4,3,2,2,1,0,0. The single right-angle view switch is replaced by intermediate diagonal views. Master changes remain discrete; this does not claim zero pixel discontinuity.
- [Before full frame](game-before.webp), [after full frame](game-after.webp): fixed game camera and unchanged route. Inspected at full-map and close-up scales.
- [Complete gait cycle in game](cycle-after.webp): phases 0,1,2,3,0, measured from actual simulation distance. No cadence or speed edits.
- [Grayscale route](diagonal-after-gray.webp): body silhouette remains identifiable against the road; bright ground texture still competes with small highlights.
- [Contact overview](contact-overview.png): inspected all 16 directions; front/side support tracks the lower body, rear support excludes the long raised tail. This is an authored support approximation, not recovered hidden ventral anatomy.

Independent review before merge remains pending (AGENTS.md); no remote push/merge performed.

## Validation

Full npm test: all tests passed. tests/leech-crawl-atlas.cjs verifies 16 distinct filled rows, margins, no broad neutral matte fringe, belly contacts on opaque pixels, correct row selection/wrap, presentation-only state, missing-input failure without partial writes, and byte-reproducible rebuild. Injected opaque white border is rejected. Existing creature-crawl test covers all four phases and loop transitions in every direction, distance-based cadence and stationary holds. Carapacid remains four-directional. git diff --check clean.

Capture reproduction:

```bash
node tools/capture-leech-diagonal.cjs before
node tools/capture-leech-diagonal.cjs after
node tools/capture-leech-diagonal.cjs after --cycle
npm test
```

Before capture reads e6f2641 from Git and uses that commit's atlas and renderer. It never replaces the working game asset.

## Generation prompt

Built-in imagegen; reference: assets/art/work/enemies/leech/leech-headings-4x4-v1.png. Generated source: exec-c0c0d0bd-247b-46e5-afec-63289911f209.png. Transparent background enabled.

> Production sprite sheet for the game Hunger. Use attached image as exact identity, texture, camera, lighting, physical body size and gait-phase reference. Create the SAME Leech, not a redesign: dark maroon wet segmented flesh, golden ivory jagged bone collar around circular tooth-lined mouth, tapered curled tail, low belly, no limbs. Exactly 4 rows by 4 columns (16 complete isolated sprites), square transparent canvas with truly transparent alpha; each creature fully inside its equal-sized slot with generous transparent gutters. NO text, labels, shadow ellipse, scenery, ground, mist or detached debris. Fixed elevated oblique game camera identical to reference, fixed top-left lighting across every view, one physical scale throughout. Only yaw the creature on its ground plane. Row 1 heads diagonally DOWN-RIGHT (southeast on screen, 45 degrees clockwise from right). Row 2 heads DOWN-LEFT (southwest,135 degrees). Row 3 heads UP-LEFT (northwest,225 degrees), show rear/tail nearer viewer and mouth pointing away. Row 4 heads UP-RIGHT (northeast,315 degrees), show rear/tail nearer viewer and mouth pointing away. Do NOT repeat the cardinal front/back/right/left headings from the input: these are the four missing diagonal views BETWEEN them. Within each row columns 1–4 are matching phases of the input's four-frame looping belly crawl: gentle contraction, extension, planted belly and travelling body wave, no leg movement. Consistent head size, body width and body anchor between phases; do not individually zoom sprites to fill the slots. Camera elevation must not change between rows. Preserve finely detailed glossy organic rendering and palette of the reference. Visible readable lower belly contact edge; the tail may curl but is entirely within each cell. This is an atlas source, not concept art.
