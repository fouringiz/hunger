# PR #71 — iteration 1 follow-up: liquid fuel contact

2026-10-29. `codex/flamethrower-vfx`; https://github.com/fouringiz/hunger/pull/71 remains draft, not merged.

- User confirmed `all tests passed` for preceding `5d8eb5f`, then requested a more natural burning liquid that contacts, flows around and burns bodies. This is the current single visual problem; smoke iteration2 remains on hold.
- Added directional moving fuel highlights without changing the approved jet transform/PNG. Current atlas-frame alpha masks create broken fire edges around a body and a faint directional surface film. Contact reads existing hit geometry; retained film reads real `burnUntil`/`burnTower`. Replaces the old triangular burn marker only where the textured effect is available.
- No simulation, damage, range, sweep, collateral, burn/pool, RNG, route or platform edits. No state added to `S`, no runtime pixel reads, two reused mask buffers;24 visible contacts globally. Old vector/burn-marker fallback retained. It is a visual approximation; combat still uses the original ray.
- Actual game captures: `reports/generated/flamethrower-contact/` (ignored), baseline `5d8eb5f`. Mire/Ember native before/after whole/grayscale, eight headings ×level3/Plasma/Cryojet, complete cycles/states, and37-frame contact lifecycles for Forager/Carapacid/Leech/Polyp. Paired GIFs show before left / after right. Frames were opened as listed in `reports/flamethrower-liquid-contact.md`.
- Capture confirmed unchanged rules/source fingerprints `9d3c412e` / `5750d1fe` and151 identical live combat steps per zone. No new npm/individual test run: latest instruction delegates tests to the user.
- Prepared `tests/flamethrower-contact.cjs` rejects frozen advection and blanket body coverage; also covers sixteen headings, misses/inactive/Cryojet, authoritative burn lifetime, cap and read-only rendering. Existing sheet/layer tests retained.
- Remaining boundaries: subjective naturalness/brightness of the edge film needs the user's verdict; this is not fluid collision physics. Disk-browser firing/console still incomplete after the prior Computer Use file-URL block. Independent frame review and final test output are pending; not declared visually complete.
- Next user commands: `node tests/flamethrower-contact.cjs`, `npm test`, `open prototype/index.html`. STOP for the verdict before smoke or merge.
