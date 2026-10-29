# Approved Tesla toroid — integration prepared, not visually verified

2026-10-30. Only Tesla level 4 / Voltaic branch A changes. Exact user attachment: `assets/art/references/towers/tesla-level4-approved-v2.png`. Its five visible studs, lower cream band and original shading are intentional: the user explicitly selected this version instead of the subsequent correction.

The offline bake trims transparent margins and downsamples to a new 256px sprite, preserving the selected design. No repaint, palette grade or layout change to any existing atlas. Source hash and crop are recorded beside the sprite. `node tools/bake-tesla-head.cjs` reproduces it without running the game. Runtime uses inline annotations; no fetch or canvas pixel reads. Loading/failure retains the prior head. Voltaic 1–3 and Prism keep the old atlas. Presentation charge arcs attach to the new toroid instead of the former side posts. Simulation, balance, route, gate and platform positions are untouched by the patch; fingerprint/live-tick parity is pending.

| Observable criterion | Current evidence |
| --- | --- |
| Exact selected design, not the later six-stud version | User approved the attached original; archived unchanged; bake metadata records its hash. Runtime-scale comparison pending. |
| Heavy collar sits in the shared socket without a gap or exposed shaft | Annotated bearing prepared. Native socket coverage and game close-up pending. |
| Toroid and studs keep upright camera through a full turn | One fixed authored view selected; actual turn strip pending. |
| Discharge and charge remain on the visible coil/toroid | Inline image-space annotations; actual complete firing cycle pending. |
| Upgrade/pause/sale do not float, pop or detach | Existing deployment path reused; cycle inspection pending. |
| Towers/enemies remain readable in color and grayscale at map scale | Whole-scene Mire/Ember captures pending. |
| Browser opened from disk has no SecurityError | No runtime pixel reads added; actual browser/console check pending. |

User-run commands from repository root:

```sh
node tests/tesla-toroid.cjs
node tests/level4-seating.cjs
npm test
node tools/capture-organic-world.cjs --tesla-toroid
open prototype/index.html
```

Capture output under `reports/generated/tesla-toroid/`: `before-{mire,ember}-whole.png`, `after-{mire,ember}-whole.png`, corresponding `whole-gray`, `turn`, `upgrade`, `attack`, `sale` sheets (including zooms), `{before,after}-{mire,ember}-cycle/000.png` through `150.png`, plus `approved-and-game.png` and `results.json`. Before renderer is pinned at `1499ae5`; no tests require reachable git history. Comparison reuses identical live combat scenes and fingerprints.

Inspect both whole frames and close-ups, complete firing/upgrade/sale cycles, and deliberate rejection cases: floating collar, toroid glow dominating enemies, stud/beam detachment, incorrect map camera. No tests, game captures or browser checks were run by the agent. A second visual review remains required before merge.

## Review of user-produced captures, 2026-10-30

Opened `approved-and-game.png`, `before-mire-whole.png`, `after-mire-whole.png`, `after-ember-attack-whole-gray.png`, `after-mire-attack.png`, `after-mire-upgrade.png`, `after-mire-sale.png` under `reports/generated/tesla-toroid/`.

- Approved silhouette/materials preserved at comparable scale. In these frames the collar overlaps the shared socket; no floating gap or camera tilt observed. Mire attack contact sheet shows discharge connected to the toroid and no whole-body sliding in its sampled frames. Sale strip retracts into the foundation. Whole grayscale Ember scene retains visible tower/enemy silhouettes, although terrain detail remains busy; no claim that every background contrast requirement is proven by this scene.
- `results.json` was written after capture's before/after fingerprint and 151-live-tick assertions passed in both zones: rules `388d2ac9`, source `48035e01`. This confirms that controlled comparison, not full-suite or browser success.
- The generated upgrade strip does NOT cover the upgrade: every cell shows the old head because the capture advanced only presentation time while branch change follows simulation warm. Corrected the capture to advance real simulation ticks through the 0.9-second swap and another 30 ticks, save every upgrade frame and require warm to expire. No game/art change in this follow-up. User rerun required: `node tools/capture-organic-world.cjs --tesla-toroid`.
- Full-cycle individual frames and all second-zone close-ups have not yet been inspected. Test-suite and file-browser console outcomes have not been supplied explicitly; confirmation requested. No overall visual completion or independent second review claimed.

### Fresh upgrade capture

User supplied the successful capture output after the tooling correction. Opened fresh `before-mire-upgrade.png`, `after-mire-upgrade.png` and `after-ember-upgrade.png`: strips now cover old-head retraction, empty socket, toroid emergence and completed seated new head. No lateral drift or floating gap observed in these sampled strips. Individual frames between strip samples remain unreviewed. The submitted output confirms capture only; test-suite and file-browser console status remain unconfirmed.
