# Forager vertical atlas gait — 2026-10-23

Work in /Users/home/github/game, branch codex/forager-vertical-gait from freshly fetched origin/main 74235d75. Do not resume the old Gate PR workflow. Existing untracked reports/NEW-CHAT-HANDOFF.md belongs to the user; leave it alone.

User clarified the target is the current assets/hunger-forager-mire-v2.webp (not retired v1). Rebake vertical rows and immediate neighbours only: 3,4,5,11,12,13. Preserve all other rows byte-for-byte after decoding; show alternating visible supporting legs, not just whole-body warping. Compare the nine-frame strips and actual game rendering. No combat, balance, route or slot changes.

Baseline full atlas and contacts are in /private/tmp/forager-vertical-before.webp and .contacts.json. reports/forager-vertical-gait/baseline.json pins original decoded row hashes. Before strips for rows4/12 and actual game full/cycle frames are captured using tools/capture-organic-world.cjs loadWorld through tools/capture-forager-vertical.cjs. Do not commit heavy intermediate renders.

Red regression tests/forager-vertical-gait.cjs fails on the existing atlas: row3 visible premultiplied RGB MAD1.952 versus side row7.930. The user's numeric range uses a different/unspecified difference metric; ours compares visible RGB over identical192px cells and cannot be boosted by colors stored under transparent pixels. Acceptance is still relative to the unchanged side rows.

Next: articulate separate legs in tools/bake-forager-crawl-v2.cjs; preserve unaffected rows by lossless exact WebP patching (Pillow encoder required, bundled Python available). Keep body anchor, scale, palette and identity. Then run atlas, gait/preservation and contacts tests; inspect after strips and in-game full cycles and grayscale readability. Record any remaining discrepancy. No merge without second visual review per AGENTS.md.
