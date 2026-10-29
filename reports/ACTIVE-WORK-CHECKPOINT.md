# PR #71 — Flamethrower iteration 1, awaiting user verdict

2026-10-29. Branch `codex/flamethrower-vfx`; PR https://github.com/fouringiz/hunger/pull/71.
Fresh `origin/main` `a06bc68` merged as `a00699c`. No merge of PR #71.

- Current change: approved four-cell full jet wired for levels1–3 and Plasma; shared 512×256 cell/0,128 anchor, muzzle transform and uniform scale, presentation-time loop, alternate observed pulses mirrored, lighter + halo, existing .23s fade. Pause/sale/folded construction suppress fire; Cryojet and vector fallback retained.
- Removed unused eight-phase billow PNG/metadata/prompt/notes/bake and live renderer. Historical capture alone recovers its old PNG from Git for before frames.
- Rejected the bright-over-enemies candidate; final jet is below actors, coolant retains its previous layer. Occluding objects can interrupt the silhouette; user visual verdict is pending, not called complete. Smoke source remains unused; iteration2 explicitly on hold.
- Full report, criteria, source/provenance and before/after paths: `reports/flamethrower-iteration-1.md`. Actual captures under ignored `reports/generated/flamethrower-reference-fire/`: Mire/Ember, level3/Plasma/Cryojet ×8 headings, whole/grayscale/close, complete cycle/sweep/stop and pause/sale/folded states. Final boards opened as listed in the report. Capture no longer needs ignored `fire-1.png`; uses the committed approved jet as reference.
- Capture confirmed unchanged rules/source `9d3c412e` / `5750d1fe` and151 identical live simulation steps per zone. No simulation edits or restamp.
- Tests now belong to the user per latest instruction. Earlier focused jet test passed before final edits; earlier full suite failed on the former vector-only level4-effect test. Test updated to use the real sprite transform and current canvas basis; not rerun after the final correction. Final tests/full suite pending. Do not call green.
- Firefox loaded the real disk page; initial console empty. Computer Use subsequently blocked the file URL, so final interactive firing/asset/console verification is incomplete. No bypass attempted.
- Next: user runs `node tests/flamethrower-jet-art.cjs`, `node tests/flamethrower-readability.cjs`, `node tests/level4-effect-anchors.cjs`, `npm test`, and disk-browser checks; provides iteration1 verdict. STOP before smoke. Second independent frame review remains required before merge.
