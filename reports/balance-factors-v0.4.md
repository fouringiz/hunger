# Balance factors on human timelines — v0.4

Generated 2026-10-21 by `node tools/replay-sweep.cjs`. Research run; not a balance verdict and not canon.

## Method

Four recorded player games (`reports/replays/human-v0.4/`: `turret-only`, `cannon-only`, `voltaic-only`, `mixed`) are replayed tick-exactly by a counterfactual player while **one** rule is changed at a time. Declared policy: each recorded action is attempted at its recorded tick; if it cannot apply (credits, phase, tower generation) it is deferred in order to the first tick where it can; an action still pending after 3600 ticks is dropped. Deferred (`d`) and dropped (`x`) counts are printed per cell as a fidelity measure — a cell with many dropped actions means the player's plan became impossible under the changed rule, and says little beyond that.

Fidelity gate: with no overrides the counterfactual player reproduces all four timelines **exactly** (terminal signature equal to the strict verifier, zero deferrals). Rule fingerprints are deliberately not checked in this research mode.

Every factor is run with evolution on (campaign rule) and off (`EVOLUTION_WAVES` emptied) so the mutations' contribution is visible as a paired difference.

Recorded baselines: cannon-only W 20/20 (2 Cannons L3 + Generator L3, 890 invested), mixed W 20/20 (Cannon + Voltaic + Turret + Generator, 960), voltaic-only W 6/20 (3 Voltaic L3 + Generator, 1085), turret-only W 1/20 (8 Turrets L3 + 2 Generators, 2060).

## Results

Cells: `W`/`L` outcome, `g` Gate HP at the end, `w` last wave, `(dN/xM)` deferred/dropped actions.

### Evolution on vs off at recorded rules

| timeline | evolution on | evolution off | mutations' cost |
|---|---|---|---|
| cannon-only | W g20 | W g20 (d1) | 0 HP — Sprinter + Dispersal did nothing to two L3 Cannons |
| mixed | W g20 | W g20 | 0 HP |
| turret-only | W g1 | W g8 | 7 HP — Keratinization (+ an unrelated Sprinter) |
| voltaic-only | W g6 | W g20 (d4/x2) | 14 HP — Grounding (+ an unrelated Keratinization); the whole wave-8 crisis is the mutation |

### Turret damage (base 7)

| value | cannon-only | mixed | turret-only | voltaic-only |
|---|---|---|---|---|
| 7 | W g20 | W g20 | W g1 | W g6 |
| 8.5 | W g20 | W g20 | W g20 | W g6 |
| 10 | W g20 | W g20 | W g20 | W g6 |

Evolution off: turret-only W g8 → g20 at 8.5 (d7/x1) → g20 at 10 (d9/x1).

### Cannon damage (base 45)

| value | cannon-only (evo on) | cannon-only (evo off) | mixed (on/off) |
|---|---|---|---|
| 45 | W g20 | W g20 (d1) | W g20 / W g20 |
| 40 | W g20 (d1) | W g13 (d1) | W g20 / W g20 |
| 36 | **L g0 w9** (d2) | W g1 (d1) | W g20 / W g20 |

At 36 the two anti-artillery mutations decide the game (loss with evolution, narrow win without). At 45 they are invisible.

### Voltaic damage (base 14)

| value | voltaic-only (evo on) |
|---|---|
| 14 | W g6 |
| 17 | W g20 |
| 20 | W g20 (d4/x2) |

Other timelines unchanged.

### Enemy HP, constant multiplier

| value | cannon-only on/off | mixed on/off | turret-only on/off | voltaic-only on/off |
|---|---|---|---|---|
| 1 | W g20 / W g20 | W g20 / W g20 | W g1 / W g8 | W g6 / W g20 |
| 1.25 | L w9 (d2) / W g1 | W g20 (d1) / W g20 (d1) | L w4 (x30) / L w4 (x30) | L w7 (d9/x9) / W g14 (d10/x1) |
| 1.5 | L w8 (d9/x1) / L w10 (d10) | W g10 (d13) / **L g0 w10** (d13) | L w3 (x32) / L w3 (x32) | L w3 (x16) / L w3 (x16) |

Turret-only cells at ×1.25+ are low fidelity (30+ dropped actions): the recorded plan collapses in wave 3–4 before most purchases.

### Enemy HP growth per wave (base 0.08)

| value | cannon-only on/off | mixed on/off | turret-only on/off | voltaic-only on/off |
|---|---|---|---|---|
| 0.08 | W g20 / W g20 | W g20 / W g20 | W g1 / W g8 | W g6 / W g20 |
| 0.10 | W g20 (d1) / W g18 (d1) | W g20 / W g20 | L w5 (x23) / W g3 (d2) | L w8 (x5) / W g20 |
| 0.11 | W g20 (d1) / W g13 (d1) | W g20 / W g20 | L w5 (x23) / W g3 (d2) | L w8 (d3/x6) / W g20 |

## What the tables support

1. **The three weapon lines are not at parity on these timelines.** Two L3 Cannons clear the campaign at every tested pressure short of ×1.25; the Turret line needs +21% damage (7 → 8.5) to clear what it barely survived, the Voltaic line needs +21% (14 → 17) to erase its wave-8 crisis. Cannon needs −20% (45 → 36) before its own timeline stops sweeping. These are single-factor magnitudes on four human plans, not tuned values.
2. **Mutation potency is uneven.** Keratinization and Grounding each cost their mono line 7–14 Gate HP at recorded rules. Sprinter Reflex and Dispersal together cost the Cannon line nothing until Cannon damage is cut to 36, where they decide the game. The anti-artillery pair is only visible when artillery is not overkilling.
3. **Pressure alone separates the mixed timeline from the mono timelines** (×1.25: only mixed holds 20/20; ×1.5: only mixed wins), but this does **not** isolate adaptation: at ×1.5 the mixed timeline wins *with* evolution (g10) and loses *without* it — the sparser Dispersal waves appear to help the defense under heavy pressure, the effect the Dispersal study warned about. One timeline, one cell; flagged, not concluded.
4. **Growth and constant multipliers differ in profile**: growth 0.10–0.11 leaves early waves untouched and only the Turret and Voltaic timelines fail (through their mutations); a constant ×1.25 breaks the Cannon timeline too.

## What they do not support

- Any specific v0.5 numbers. Each factor was moved alone; combinations were not run.
- Claims about human play beyond these four plans; the players' reactive decisions under changed rules are not modelled (deferral policy is a stand-in).
- Mutation balance verdicts: the paired on/off differences come from one plan per line.

## Reproduce

`node tests/replay-sweep.cjs` (fidelity gate), `node tools/replay-sweep.cjs [turret|cannon|voltaic|hp|growth]`. Generated tables and JSON land in `reports/generated/` (ignored by git).
