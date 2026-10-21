# Party replay — development checkpoint

Base: main `e607abf`. Branch: `codex/party-replay`.
Status: implementation complete; ready for review. No balance change.
The infantry experiment remains separate in PR #14.

## Scope

- Save replay on victory and defeat; browser downloads a local JSON file.
- Load replay from the menu and verify the outcome using the same simulation.
- Record successful player inputs: building, upgrades, selling, tower pause and
  resume, manual wave starts and speed. Automatic wave starts remain simulation.
- Use integer simulation ticks and explicit same-tick ordering, not wall time.
- Preserve initial menu time/accumulator; identify compatible rules and source.
- Freeze the terminal result when the first winning/losing tick completes.
- Validate files before loading; reject incompatible or impossible inputs and
  display mismatch explicitly. Playback does not accept live gameplay commands.
- Headless verification: `node tools/replay-party.cjs <replay.json>`.

## Verification

- `node tests/prototype-regression.cjs`: 29 scenarios pass.
- `node tests/party-replay.cjs`: 15 scenarios pass: victory/defeat round trips,
  same-tick ordering, speed changes at 20/60/144 Hz, nonzero menu remainder,
  sale/rebuild generations, failed inputs excluded, frozen result, invalid and
  incompatible files, DOM download/file-picker controls, fresh Play again,
  tampered result header rejected.
- Existing readability, weapon-feedback, Voltaic art and Dispersal control
  checks pass. `git diff --check` passes.
- CLI verified a real starting-credit winning strategy (10 waves, Gate 20,
  19,260 ticks) and empty-defense defeat (wave 2, Gate 0, 6,284 ticks).
- Applied those exact input timelines to the original `e607abf` simulation:
  all 10 winning and 2 losing wave checkpoints and final signatures match.
- Independent code review completed; its terminal outcome-header consistency
  finding was fixed with a regression case.
- Offscreen canvas captures checked the menu and win/loss result layouts;
  corrected the Load replay/footer overlap. Browser file selection/download
  behavior is covered with DOM mocks, not a live browser end-to-end run.

Generated replay JSON files remain in ignored `reports/generated/`.
Compatibility fingerprints intentionally reject changed simulation source or
rules; this is not a promise of replay support across future game revisions.

No automatic merge. The user will play fresh games and attach exported files;
earlier playtests cannot be reconstructed without their action history.
