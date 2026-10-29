# Tesla toroid — integration awaiting user verification

2026-10-30. User selected the attached compact five-stud image and explicitly authorized connecting it. Scope is Tesla level 4 only; Voltaic 1–3 retains the old three-electrode head and Prism remains unchanged.

- Selected original archived at `assets/art/references/towers/tesla-level4-approved-v2.png`; decision recorded in the passport.
- Offline packing completed: `assets/hunger-tesla-toroid-v1.png` and inline-compatible annotations. New presentation image selection, socket bearing and toroid discharge/charge annotations are prepared. Existing atlas, simulation, balance, PATH, GATE_D and platform positions unchanged by the patch.
- Prepared native regression rejects the previous three-post selection; existing socket-coverage regression recognizes the dedicated image without changing coverage/anchor tolerances. Before renderer pinned at `1499ae5`.
- NO agent-run tests, game captures or browser checks. Art approval is confirmed; runtime visual quality and combat parity are pending. No confirmed new runtime defect or related issue number yet.
- Criteria, commands and expected before/after paths: `reports/tesla-toroid-integration.md`.
- Next: user runs `node tests/tesla-toroid.cjs`, `node tests/level4-seating.cjs`, `npm test`, `node tools/capture-organic-world.cjs --tesla-toroid`, then opens `prototype/index.html` from disk and checks console/full cycles. Inspect actual before/after frames and obtain a second visual review before merge.

Previous smoke/jet work is outside this iteration; its prior checkpoint remains in the pre-change commit `1499ae5`.
