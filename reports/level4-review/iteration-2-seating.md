# Iteration 2 — head placement on the socket

Status: implementation and native captures prepared for the user's verdict. Iteration 1 (`df6f8f5`) was approved. Iteration 3 has not started. Do not merge this visual PR before the second review and file-origin browser check.

## Observable criteria and implementation

- The head sits on the centre of the foundation socket throughout rotation and firing, rather than touching it from the rear edge. The actual drawn bearing is now centred at `TOWER_SOCKET`; the projected renderer's additional 7-unit rear offset and shared 1-unit offset were removed. The short support is centred beneath the head.
- Whole-carrier recoil is limited to 0.9 world units (1.8 native screen pixels at the game's 2x capture scale), so recoil cannot drag the bearing out of its seat. This deliberately reduces visible whole-head recoil, especially Howitzer/Cluster. It does not change shot timing, damage, targeting, projectile rules or simulation. Muzzle presentation follows the same pose.
- Assembly still emerges through the socket. Centring exposed an existing clip boundary that cut off the near half until the ready frame. The boundary now opens smoothly during the final 15% of emergence. The rejected constant-wide boundary exposed the head too early on the foundation's front panel; those draft frames remain separate from final evidence.
- No atlas dimensions/layout, asset pixels, combat, targeting, balance, PATH, GATE_D or platform positions changed. No replay restamp was needed.

## Tests and why the existing seating test changed

`npm test`: PASS, including `leech-crawl-atlas`.

`level4-seating.cjs`: PASS, 490 heading/recoil states, maximum bearing distance **1.800 native screen px**, limit **2px**. Six projected families use 16 sampled headings; Tesla/Cluster use their fixed pose; each uses five recoil ages. This samples the present continuous renderer; exhaustive authored-pose coverage belongs to iteration 3.

The old test measured socket alpha coverage and physical contact. A filled cup could satisfy coverage even when the head was rearward; three contact pixels only established touch. Those original thresholds remain unchanged. The added assertion transforms the atlas bearing through the **actual image draw matrix**, independently of the pose helper. The exact previous renderer fails at 16.000px. A deliberately rearward-shifted actual head draw by 6 world units also fails. Raised and detached heads remain rejected; their expected errors now allow the stricter anchor assertion to fire first. The historical open-socket negative still runs its original coverage assertion with only the newly added anchor assertion disabled for that negative.

New `level4-deployment-clip.cjs`: PASS, 96 heading states. Actual head alpha stays off the front panel during early emergence and retains at least 99.5% of ready pixels immediately before completion. Both known bad masks are rejected: constant-wide (front-panel emergence) and constant-narrow (final-frame pop).

Logs (local, ignored):
- `/private/tmp/hunger-level4-sprites/reports/generated/level4-seat-anchor/npm-test.log`
- `/private/tmp/hunger-level4-sprites/reports/generated/level4-seat-anchor/seating-test.log`
- `/private/tmp/hunger-level4-sprites/reports/generated/level4-seat-anchor/deployment-test.log`

## Actual-game evidence

Baseline: `df6f8f5` (approved badge iteration). Final output root:
`/private/tmp/hunger-level4-sprites/reports/generated/level4-seat-anchor/`

Run from `/private/tmp/hunger-level4-sprites`:

```sh
npm test
for branch in machine-gun rifle tesla prism howitzer cluster plasma cryojet
do
  node tools/capture-organic-world.cjs --tower-base "$branch" --anchor-review
done
```

Every branch directory contains Mire and Ember before/after whole views, grayscale views, 33-angle turns, upgrade sequences, 151-frame live firing cycles, pause and sale sequences, and the approved reference scaled to the same foundation width. All eight branches completed in both zones: rules `9d3c412e`, source `5750d1fe`, 151 identical live steps per scene. The capture asserts identical rule/source fingerprints and live signatures against the baseline.

For each `<branch>` and `<zone>` (`mire`, `ember`), exact paths are:

| Evidence | Before | After |
|---|---|---|
| Whole scene | `<branch>/before-<zone>-whole.png` | `<branch>/after-<zone>-whole.png` |
| Rotation / socket close view | `<branch>/before-<zone>-turn-zoom.png` | `<branch>/after-<zone>-turn-zoom.png` |
| Upgrade / emergence | `<branch>/before-<zone>-upgrade-zoom.png` | `<branch>/after-<zone>-upgrade-zoom.png` |
| Combat grayscale | `<branch>/before-<zone>-attack-whole-gray.png` | `<branch>/after-<zone>-attack-whole-gray.png` |
| Full firing cycle | `<branch>/before-<zone>-cycle/000.png` through `150.png` | `<branch>/after-<zone>-cycle/000.png` through `150.png` |
| Sale | `<branch>/before-<zone>-sale-zoom.png` | `<branch>/after-<zone>-sale-zoom.png` |

All paths in the table are relative to the absolute output root above. In particular, the user's problem cases are `rifle`, `howitzer` and `prism`. Comparison boards: `before-after.png` and `reference-and-game-all.png` in that root. Generated evidence is kept out of Git; these local paths are not hosted PR images.

## Boundaries

The current overhead projection still flattens Howitzer and Prism and weakens their identity against the approved sheet. That is explicitly unresolved iteration 3, not visual approval of these designs. Terrain remains visually busy; native grayscale screenshots establish inspectable evidence, not a claim that every scene meets final contrast/art direction. No file-origin browser console check has been performed for this iteration. The user verdict is pending.
