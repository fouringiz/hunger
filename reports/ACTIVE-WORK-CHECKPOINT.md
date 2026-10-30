# PR #90 — Howitzer art restoration rebased; user verification pending

2026-10-30. Rebuilt `codex/howitzer-design-restoration` on current main `0c78db1` with only #89 restoration and its supporting fixtures/capture workflow. Old branch, including unpushed capture work, preserved at `codex/howitzer-pre-rebase-20261030` (`94d45e2`).

- #92 is already done on main via #93: HEAD_SEAT_DROP=5, no drawLevel4Coupling. No seating implementation, seating tests or passport change added here.
- Main atlas retained; only row 4 rebuilt from SHA-verified raw Howitzer source and graded. Other seven rows and LEVEL4_ART entries retained from main; Howitzer frames/anchors retained from the restoration branch. No simulation, balance, PATH, GATE_D or platform changes.
- Requested grading executed: before sat 0.529 / value 0.381 / bright 12.9%; after sat 0.340 / value 0.339 / bright 9.0%; target 0.345 / 0.340 / 9.0%. Before is after local contrast, before palette grading.
- Known defect #91 remains open: nonuniform depicted Howitzer yaw; existing brief blend may show a doubled contour. This PR does not resolve it.
- Static construction comparison confirmed identical decoded RGBA for all seven non-Howitzer rows and no renderer changes outside the Howitzer LEVEL4_ART entry. This does not establish visual quality.
- NO new agent-run tests, game captures or browser checks. Earlier results do not validate this rebased candidate; no visual completion claim.
- Next, user runs from the repository root:
  `node tests/howitzer-design.cjs`
  `node tests/level4-seating.cjs`
  `npm test`
  `node tools/capture-organic-world.cjs --tower-base howitzer --howitzer-design-review`
- Open `prototype/index.html` from disk and check console through upgrade/aim/fire. Inspect actual before/after whole/close/grayscale, full turn/attack/upgrade/sale cycles and reference at comparable scale, including consistent camera and enemy/tower contrast. Obtain independent second review before merge.
- Expected before/after evidence: `reports/generated/howitzer-design-review/howitzer/{before,after}-{mire,ember}-{whole,whole-gray,turn-zoom,upgrade-zoom,attack-zoom,sale-zoom}.png`, full cycle directories and `results.json`. These frames have not been regenerated for this rebase.
- Details: `reports/level4-review/howitzer-design-restoration.md`.
