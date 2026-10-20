# Development checkpoint — 2026-10-20

Paused at the user's request to conserve remaining usage. No PR was merged.

## Base and branches

All three packages start from main `ffeb1542df834c13f4c261e837b8b8059d1e72ec` (PR #9 merged).
Primary checkout `/Users/home/github/game` remains on main.

- `codex/combat-readability`, worktree `/Users/home/.codex/worktrees/combat-readability/game`: commit `aa0dc10`, PR https://github.com/fouringiz/hunger/pull/10. Leech tendrils/drain/recovery, evolution comparison card with atlas-free fallback, optional `?debugHitBounds`. 29 regression cases + `tests/readability.cjs` pass. Sol checked nine campaigns for exact parity. False initial recovery pulse fixed and tested. Ready for user review.
- `codex/weapon-feedback`, worktree `/Users/home/.codex/worktrees/weapon-feedback/game`: weapon recoil/flash/casings/smoke, synthesized sound, mute button, shared generator hum. 29 regression cases + `tests/weapon-feedback.cjs` pass. Sol checked nine-campaign parity. False seeking-Leech recovery cue fixed; actual attachment death/sated release tested. Quiet hum initialization and partial-node cleanup fixed and tested. PR publication occurs with this checkpoint.
- `codex/dispersal-control`, worktree `/Users/home/.codex/worktrees/dispersal-control/game`: WIP research tool, test, report. No gameplay/canon changes. Draft PR only; not ready for conclusions or merge.

## Research status and remaining checks

Plan: three layouts × waves 5/9 × unchanged, upgrades, partial switches, anticipatory premixed defense, paired Dispersal OFF/ON. Enumerated candidates yield 96 primary trials, plus 24 herd diagnostics. Funded synthetic checkpoints, actual sale delay/refund, fixed step 1/60. Wave 9 holds Sprinter in both conditions. No campaign-economy claims.

Initial numbers reported in chat were withdrawn: the range-integration helper gained an optional herd flag, and passing it directly to Array.map accidentally used array indices as that flag. Code now explicitly uses `scenarios.map(spec=>simulateWithRangeIntegration(spec,false))`. A newer report exists, but final independent verification has NOT completed.

Sol findings to confirm on resumption:

1. Herd diagnostics must use the same range integrator; herd-ON rows must match primary unchanged rows.
2. Self-test must compare actual unmodified CORE_SOURCE against instrumented runtime, not merely instrumentation capture ON/OFF.
3. Report must describe exposure/occupancy as correlated measurements, not causal separation. Defeat truncates metrics; Gate loss has a ceiling.
4. Generated Markdown tables must have matching header/separator/data columns. Distinguish prewave cash remaining from postwave money including earnings.
5. Re-run `node tests/dispersal-control.cjs` and `node tools/check-dispersal.cjs`; verify refreshed results before clearing the report's WIP warning.

Before merging presentation PRs, combine both changes in a temporary checkout and run all presentation/core tests. They were individually based on main; combined merge and behavior have not yet been verified.

## Review and execution boundaries

User authorized descriptive commits, pushes and PRs to main for their review, not automatic merge.
Implementation used GPT-6 Luna Medium; independent review used GPT-6.1 Sol Medium. Continue with bounded context and no duplicate broad scans.
The file:// browser attempt was security-blocked; do not bypass that through another surface. Evidence used offscreen canvas and WebAudio mocks, not a live browser/audio playtest.
No passport/version bump or decision to remove Dispersal has been authorized.

## Existing local evidence

Readability: `/tmp/leech-seeking-real.png`, `/tmp/leech-draining-real.png`, `/tmp/leech-recovery-real.png`, `/tmp/evolution-grounding-card.png`, `/tmp/hit-boundaries-debug.png`.
Weapons: `/tmp/weapon-feedback-menu.png`, `/tmp/weapon-feedback-fire.png`.
Generated research JSON lives under ignored `reports/generated/`; regenerate rather than commit it. Temporary screenshots may expire and are not required for reproducing code/tests.
