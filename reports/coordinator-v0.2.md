# Coordinator control study — v0.2

Date: 2026-09-16  
Status: rerun after the fixed-step simulation fix; balance values remain draft.

## Question

Does an escaped Coordinator cause measurable damage on the next wave, and
which affordable responses prevent that damage?

## Method

Run `node tools/check-coordinator.cjs`. Results are written to
`reports/generated/coordinator-results.json`.

The tool reproduces one known layout, using the actual prototype with fixed
1/60-second simulation ticks. It compares five cases at 30, 60 and 120 frames
per second and game speeds ×1 and ×2: 30 trials with identical results for each
case. It replaces the earlier coarse layout search; there is no 0.25-second
simulation step or candidate rejection heuristic in this tool now.

Start with 200 credits and a healthy Gate. Build a **Turret** in slot 8 and a
**Cannon** in slot 9 (slot indices are zero-based). Begin wave 4 directly;
waves 1–3 are outside this control. The build costs 170 credits, leaving 30.
After wave 4 the Gate has 15 HP, the Coordinator has escaped, Sprinter Reflex
has been granted, and 250 credits are available. All later purchases use that
balance; the experiment grants no extra money.

## Results

Every case starts wave 5 with 15 Gate HP. All upgrades and additions remain
within the base 40 power supply. Costs below are current draft balance values.

| Wave-5 condition | Purchase cost | Leaks | Gate HP after wave 5 |
| --- | ---: | ---: | ---: |
| Mutation removed for comparison; no purchase | 0 | 0 | 15 |
| Sprinter Reflex 1.7×; no purchase | 0 | 1 | 10 |
| Sprinter Reflex; add a Turret in slot 0 | 60 | 0 | 15 |
| Sprinter Reflex; upgrade existing Cannon to level 2 | 80 | 0 | 15 |
| Sprinter Reflex; upgrade existing Turret to level 2 | 50 | 0 | 15 |

The mutation causes an extra leak in this scenario. Both an additional tower
and an ordinary upgrade prevent it. In particular, upgrading the existing
Turret costs less than the tested addition and achieves the same result.

## Limits and next step

This proves the mutation has a measurable effect and that reinforcing the
existing defense can compensate. It does **not** prove a need to change weapon
composition. The control skips waves 1–3; it is not a full campaign playthrough.
The [full mission study](adaptation-v0.2.md) still finds clean wins for both
single-weapon strategies, including with forced mutations.

Next, compare composition changes with ordinary upgrades at comparable cost
and power, then verify useful cases in the full mission. The regression suite
also compares real frame updates at 20–144 fps, uneven frame intervals and
both speed settings, so this evidence no longer depends on a 60 fps display.

## Verdict (2026-10-19, final)

**Verdict: Coordinator removed, background evolution adopted (passport v2.11).**
The escape loop proved self-extinguishing — across 36 ordinary runs in the
[full mission study](adaptation-v0.2.md) every Coordinator died and no mutation
ever appeared. Evolution now runs on a schedule with no organism on the lane.
This study is kept as history; its control case survives as
`tools/check-evolution-response.cjs`, which reproduces the same wave-4/5
numbers with the scheduled mutation in place of the escape.

## Verdict (2026-09-16, clarified after audit)

The approved campaign `SPRINTER_DASH_MULT = 1.7` remains; the `2.6×` candidate
remains rejected. The earlier statement that this study forces a rebuild was
too strong: ordinary upgrades work as well. The in-prototype lab remains
removed. The fixed-multiplier test, control study and broader regression suite
preserve the decision and the limits of its evidence.
