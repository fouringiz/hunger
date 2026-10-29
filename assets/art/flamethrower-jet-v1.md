# Four-frame full fuel jet — source asset (2026-10-29)

Explicit user brief: four full steady-state jets in one row, shared left-edge emission point, short white/yellow stem, broad rolling orange/red flame with internal hot cores, fixed elevated 3/4 camera about 30 degrees, no smoke and genuine alpha. User approved this source artwork on 2026-10-29: “отлично оставляем”. This does not establish gameplay use or temporal loop verification.

- Final sheet: `assets/hunger-flamethrower-jet-v1.png`, 2048×256 RGBA, four 512×256 cells in one row.
- Each cell's emission anchor is `(0,128)`. Frame rectangles: `(0,0,512,256)`, `(512,0,512,256)`, `(1024,0,512,256)`, `(1536,0,512,256)`.
- Built-in ImageGen generated the strip, then corrected layout/loop consistency. Prompt set: `assets/art/flamethrower-jet-v1.prompt.txt`.
- Selected master: `reports/generated/flamethrower/flame-jet-four-source-v1.png` (ignored). `tools/bake-flamethrower-jet.cjs` measures the emitting tip, applies one common scale, and packs four equal cells with the exact shared anchor. Source hash, rectangles and measurements: `assets/hunger-flamethrower-jet-v1.frames.json`.
- Packed image opened by the agent: four isolated full jets, orange/red rolling lobes and white/yellow cores, no smoke/scenery/text. Alpha confirmed by the packing input check. Generated envelopes remain organic; the export aligns the source and keeps one physical scale rather than stretching each phase independently.
- Not established: a perceptually seamless 4→1 cycle, exact in-game camera/scale/readability or actual game use. Source artistic acceptance is confirmed by the user. No tests, gameplay captures or browser checks run. No runtime/simulation functions or existing tower assets changed for this source-sheet request.
