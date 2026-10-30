# Assets

```
runtime/                 files the prototype loads (prototype/index.html), nothing else
  enemies/               creature atlases
  towers/                tower atlases; a tower's weapon and its effects belong here
  world/                 terrain, lane, Gate, platforms
  <atlas>                an atlas that mixes groups (units-v1.png: creatures and towers) stays at the root
art/
  references/            user-supplied, approved and rejected looks (see references/README.md)
  work/                  generated sources, studies, prompts and notes behind the art, same layout as references/:
    style/  world/<object>/  enemies/<caste>/  towers/<type>/  ui/
```

Captures that show how art moves or reads in the game (GIF, MP4, gameplay screenshots) are evidence, not assets: they go to `reports/<topic>/` next to the write-up that cites them. Scratch output goes to the ignored `reports/generated/`. Design documents (the campaign map) live in `docs/`.

## Rules

- **Runtime is what the game loads.** A file belongs in `runtime/` only if `prototype/index.html` requests it, or it is the sidecar of such a file. Retired atlases move to `art/work/`. `tests/asset-layout.cjs` enforces this.
- **Sidecars sit beside their image and share its stem**: `polyp-v1.webp` + `polyp-v1.frames.json`; `ancient-gate-runtime-v6.png` + `ancient-gate-runtime-v6.prompt.txt`. A frame table names its atlas by file name only, resolved from the table's own folder.
- **Names carry the object**: `<object>-<aspect>-v<N>.<ext>`. No project prefix — the folder says it is ours, the object name keeps the context when a file is dragged into a chat or an editor.
- **Weight.** The repository is public and Git keeps every version, so a file added once costs its full size forever.
  - Concept studies, references and report captures: WebP or JPEG, at most 1600 px on the long side.
  - Sheets that a `tools/` script cuts by pixel coordinates: keep the pixel size (shrinking them silently breaks the bake); save as lossless WebP rather than PNG.
  - Runtime atlases: whatever the bake tool writes.
  - Existing files are not recompressed: rewriting them adds bytes to history instead of removing them.

Old revisions and the fixtures in `tests/fixtures/history/` still use the pre-2026-10-30 layout, `assets/hunger-<name>`; tools that read history map names back to it.
