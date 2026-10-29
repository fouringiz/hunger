# Flamethrower iteration 1 follow-up — flowing fuel and body contact

2026-10-29; branch `codex/flamethrower-vfx`, PR #71. Baseline `5d8eb5fca77dd2fca4d0e24ccc39d3bdb39b0d72`.

The user confirmed **all tests passed** for the preceding sheet integration, then requested a more natural stream of burning liquid that touches, flows around and burns enemies. This is a refinement of iteration 1. Smoke remains on hold; stop after the new frames for the user's verdict.

## Observable criteria and evidence

| Criterion | Implemented appearance / evidence / limit |
| --- | --- |
| Fuel visibly travels from the nozzle rather than only changing a stationary texture | Four narrow elongated highlights advect along the ray using presentation time. The approved full sheet, uniform transform, nozzle anchor, four-phase loop and pulse mirror remain. Contact GIFs and frame sequences show the stream before, during and after firing. |
| A hit visibly meets the drawn body and bends around its edges | Active contact reads the existing `segHitsCircle` geometry used by firing. A mask stamps the current creature atlas frame, pose and own scale. An outer rim uses sprite alpha subtraction; scrolling approved fire texture breaks up that rim. It follows the Forager/Carapacid/Leech/Polyp silhouette instead of a circular halo. See matched before/after contact stages and 37-frame sequences. |
| Body surface heats up without becoming an opaque flame rectangle | A directional warm film is masked inside the body, alpha at most .17. The larger fuel plume stays behind actors; edge wisps are outside the opaque body core. Native whole grayscale frames and contact boards were opened. New tests inspect the actual alpha mask and reject the blanket variant; they are not yet run. |
| Wet burning fuel can remain after the stream moves away or stops | Residual film is driven exclusively by existing `burnUntil` and `burnTower`. It fades toward the actual burn expiry; no new burn, damage or lifetime is written. The former single triangular burn marker is replaced only when this textured film is available. Inactive/missing art retains the old marker. |
| Clear targets and consistent camera | Same fixed camera/current creature pose; original full jet stays below actors. Body details remain visible in the inspected native grayscale frames. The bright flame is intentionally luminous; no quantitative whole-scene contrast hierarchy is claimed. Platforms/actors can still occlude the underlying jet. |

## Presentation boundary

No changes to simulation, damage, target selection, collateral pass, range, sweep, burn/pool rules, RNG, `PATH`, `GATE_D`, platform positions or replay stamps. Contacts are recomputed into a separate Map every draw, capped at24 visible bodies globally; only the strongest current jet is shown per body. No particle or contact field is added to `S`. No smoke, new source image or resurrection of the billow atlas.

The new body film uses two reused 256px canvases with drawing/compositing only: no runtime canvas pixel reads or JSON fetches. Missing jet art keeps the old vector and burning-marker fallback. Direct contact is suppressed for paused/selling/unassembled towers, Cryojet, dead/air/submerged/portal bodies and a Leech still playing its separate emergence sheet and geometric misses. An existing simulation burn may continue glowing after its source stops firing; this is not an additional hit.

This is an artistic approximation of wet fuel contact, not a physical fluid simulation. The jet's combat ray is unchanged. The rim does not model individual plate collisions or sliding droplets; how naturally it reads remains the user's visual judgment.

## Actual game frames

Capture command (already run for this follow-up):

```sh
node tools/capture-organic-world.cjs --flamethrower-contact
```

Ignored evidence root: `/Users/home/github/game/reports/generated/flamethrower-contact/`.

Matched native before/after:

- `before-mire-carapacid-contact-whole.png`, `after-mire-carapacid-contact-whole.png` and matching `-whole-gray.png`.
- `before-ember-carapacid-contact-whole.png`, `after-ember-carapacid-contact-whole.png` and matching `-whole-gray.png`.
- `{before,after}-{mire,ember}-{forager,carapacid,leech,polyp}-contact-stages.png`: six stages, left to right then down: 0/.167/.333/.583/1.0/1.5s.
- `{before,after}-{mire,ember}-{forager,carapacid,leech,polyp}-contact-{000..036}.png`: all37 actual renderer crops at24fps, 280×240 native game pixels. Controlled capture gives both versions the same existing burn status, fires through0.6s, then allows the last pulse to fade and the burn to expire at1.4s. No new runtime state is inferred from these controlled inputs.
- `after-{mire,ember}-{forager,carapacid,leech,polyp}-contact-full-cycle.png`: complete 37-frame contact lifecycle sheets. The committed capture tool produces these for both labels; this workspace's after grids were also assembled from the exact saved frames without rerendering.
- `mire-carapacid-before-after.gif`, `ember-carapacid-before-after.gif`, `mire-forager-before-after.gif`: paired native crops, before left / after right, encoded from the original PNG sequences. These GIFs are ignored review artifacts, not runtime assets.
- The usual `{before,after}-{mire,ember}-{level3,plasma,cryojet}-8-headings-{game,zoom}.png`, whole/grayscale frames, full cycle/sweep/stop and paused/sale/folded sheets are also present.

Opened: source/before/after board, Mire level3 and Ember Plasma heading boards, contact stage boards for Carapacid/Forager/Leech/Polyp, full37-frame Mire Carapacid and Ember Leech contact lifecycles, both native Carapacid grayscale whole frames, inactive states and Cryojet. Body core stays visible, surface warmth fades, and no full opaque rectangular or circular contact shape was observed in those samples. The subjective naturalness/strength of the bright edge still needs user approval. No new independent second review claimed.

Capture `verification.json` confirms unchanged fingerprints **rules `9d3c412e`, source `5750d1fe`**, plus **151 identical live combat steps per zone** with rendering read-only checks. This is capture evidence, not a full test-suite result.

## Tests and remaining review

The user's preceding `all tests passed` applies to `5d8eb5f`, not this new refinement. No tests were run by the agent for this follow-up. Prepared `tests/flamethrower-contact.cjs`: directional flow, sixteen-heading contacts, misses, inactive/Cryojet filtering, actual burn lifetime, global cap, exact mask rim/core, read-only state and the same checks rejecting frozen flow and blanket-over-body variants.

User-run from repository root:

```sh
node tests/flamethrower-contact.cjs
npm test
open prototype/index.html
```

Disk-browser firing/console verification remains incomplete from the prior URL block; no browser workaround attempted. New effects do not read canvas pixels, but that does not establish browser correctness.

Next: user test output and visual verdict on this contact refinement. No smoke implementation or merge until approval.
