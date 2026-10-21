# Balance factors on human timelines — v0.4

Generated 2026-10-21 by `node tools/replay-sweep.cjs`. Research run; not a balance verdict and not canon.

## Method

Four recorded player games (`reports/replays/human-v0.4/`: `turret-only`, `cannon-only`, `voltaic-only`, `mixed`) are replayed tick-exactly by a counterfactual player while **one** rule is changed at a time. Declared policy: each recorded action is attempted at its recorded tick; if it cannot apply (credits, phase, tower generation) it is deferred in order to the first tick where it can; an action still pending after 3600 ticks is dropped. Actions the game never reached because it ended first are counted separately as unreached. Deferred (`d`), dropped (`x`) and unreached (`u`) counts are printed per cell as a fidelity measure: `d` and `x` say how far the counterfactual player drifted from the recorded plan while the game was alive; `u` only says how many recorded actions lay beyond the defeat.

Fidelity gate: with no overrides the counterfactual player reproduces all four timelines **exactly** (terminal signature equal to the strict verifier, zero deferrals). Rule fingerprints are deliberately not checked in this research mode.

Every factor is run with evolution on (campaign rule) and off (`EVOLUTION_WAVES` emptied) so the mutations' contribution is visible as a paired difference.

Recorded baselines: cannon-only W 20/20 (2 Cannons L3 + Generator L3, 890 invested), mixed W 20/20 (Cannon + Voltaic + Turret + Generator, 960), voltaic-only W 6/20 (3 Voltaic L3 + Generator, 1085), turret-only W 1/20 (8 Turrets L3 + 2 Generators, 2060).

## Results

Cells: `W`/`L` outcome, `g` Gate HP at the end, `w` last wave, `t` simulation ticks, `(dN/xM/uK)` deferred / dropped after waiting / unreached because the game ended.

### Evolution on vs off at recorded rules

| timeline | evolution on | evolution off | difference |
|---|---|---|---|
| cannon-only | W g20 t23838 | W g20 t22212 (d1) | 0 Gate HP; the two anti-artillery mutations lengthened the game by 1626 ticks (+7%) without producing a leak |
| mixed | W g20 t23932 | W g20 t22983 | 0 Gate HP; +949 ticks (+4%) |
| turret-only | W g1 t30202 | W g8 t30103 | 7 Gate HP — Keratinization (the second mutation, Sprinter, is irrelevant to turrets) |
| voltaic-only | W g6 t25361 | W g20 t22026 (d4/u2) | 14 Gate HP and +3335 ticks — Grounding; the whole wave-8 crisis is the mutation (the second, Keratinization, is irrelevant to Voltaic) |

### Turret damage (base 7)

| value | cannon-only | mixed | turret-only | voltaic-only |
|---|---|---|---|---|
| 7 | W g20 w10 t23838 | W g20 w10 t23932 | W g1 w10 t30202 | W g6 w10 t25361 |
| 8.5 | W g20 w10 t23838 | W g20 w10 t23932 | W g20 w10 t30116 | W g6 w10 t25361 |
| 10 | W g20 w10 t23838 | W g20 w10 t23932 | W g20 w10 t30103 | W g6 w10 t25361 |

Evolution off: turret-only W g8 w10 t30103 at 7 → W g20 w10 t28451 (d7/u1) at 8.5 → W g20 w10 t27637 (d9/u1) at 10.

### Cannon damage (base 45)

| value | cannon-only (evo on) | cannon-only (evo off) | mixed (on / off) |
|---|---|---|---|
| 45 | W g20 w10 t23838 | W g20 w10 t22212 (d1) | W g20 w10 t23932 / W g20 w10 t22983 |
| 40 | W g20 w10 t23838 (d1) | W g13 w10 t23332 (d1) | W g20 w10 t23932 / W g20 w10 t22983 |
| 36 | L g0 w9 t20189 (d2) | W g1 w10 t23722 (d1) | W g20 w10 t23932 / W g20 w10 t22983 |

At 36 the two anti-artillery mutations decide the game (loss with evolution, narrow win without). At 45 they cost no Gate HP.

### Voltaic damage (base 14)

| value | voltaic-only (evo on) | voltaic-only (evo off) |
|---|---|---|
| 14 | W g6 w10 t25361 | W g20 w10 t22026 (d4/u2) |
| 17 | W g20 w10 t24795 | W g20 w10 t21776 (d4/u2) |
| 20 | W g20 w10 t22477 (d4/u2) | W g20 w10 t21582 (d4/u2) |

Other timelines unchanged.

### Enemy HP, constant multiplier

| value | cannon-only on / off | mixed on / off | turret-only on / off | voltaic-only on / off |
|---|---|---|---|---|
| 1 | W g20 w10 t23838 / W g20 w10 t22212 (d1) | W g20 w10 t23932 / W g20 w10 t22983 | W g1 w10 t30202 / W g8 w10 t30103 | W g6 w10 t25361 / W g20 w10 t22026 (d4/u2) |
| 1.25 | L g0 w9 t20189 (d2) / W g1 w10 t23722 (d1) | W g20 w10 t23932 (d1) / W g20 w10 t23056 (d1) | L g0 w4 t11806 (d2/x1/u29) / L g0 w4 t11806 (d2/x1/u29) | L g0 w7 t16879 (d9/x1/u8) / W g14 w10 t24979 (d10/x1) |
| 1.5 | L g0 w8 t18205 (d9/u1) / L g0 w10 t25163 (d10) | W g10 w10 t25752 (d13) / L g0 w10 t26087 (d13) | L g0 w3 t7521 (u32) / L g0 w3 t7521 (u32) | L g0 w3 t8484 (d2/x3/u13) / L g0 w3 t8484 (d2/x3/u13) |

Turret-only at ×1.25: two deferrals and one real drop while alive; the other 29 recorded actions lie beyond the wave-4 defeat (`u29`). The plan did not drift, it ended early.

### Enemy HP growth per wave (base 0.08)

| value | cannon-only on / off | mixed on / off | turret-only on / off | voltaic-only on / off |
|---|---|---|---|---|
| 0.08 | W g20 w10 t23838 / W g20 w10 t22212 (d1) | W g20 w10 t23932 / W g20 w10 t22983 | W g1 w10 t30202 / W g8 w10 t30103 | W g6 w10 t25361 / W g20 w10 t22026 (d4/u2) |
| 0.10 | W g20 w10 t23788 (d1) / W g18 w10 t22711 (d1) | W g20 w10 t23932 / W g20 w10 t22983 | L g0 w5 t13840 (d1/u23) / W g3 w10 t30121 (d2) | L g0 w8 t18392 (u5) / W g20 w10 t22221 (d4/u2) |
| 0.11 | W g20 w10 t23838 (d1) / W g13 w10 t23332 (d1) | W g20 w10 t23932 / W g20 w10 t23056 | L g0 w5 t13838 (d1/u23) / W g3 w10 t30111 (d2) | L g0 w8 t18108 (d3/u6) / W g20 w10 t22311 (d4/u2) |

## What the tables support

1. **The three weapon lines are not at parity on these timelines.** Two L3 Cannons clear the campaign at every tested pressure short of ×1.25; the Turret line needs +21% damage (7 → 8.5) to clear what it barely survived, the Voltaic line needs +21% (14 → 17) to erase its wave-8 crisis. Cannon needs −20% (45 → 36) before its own timeline stops sweeping. These are single-factor magnitudes on four human plans, not tuned values.
2. **Mutation potency is uneven.** Keratinization and Grounding each cost their mono line 7–14 Gate HP at recorded rules. Sprinter Reflex and Dispersal together cost the Cannon line no Gate HP at recorded rules — their effect is measurable only as a 7% longer game — and become decisive once Cannon damage is cut to 36. The anti-artillery pair is only visible when artillery is not overkilling.
3. **Pressure alone separates the mixed timeline from the mono timelines** (×1.25: only mixed holds 20/20; ×1.5: only mixed wins), but this does **not** isolate adaptation: at ×1.5 the mixed timeline wins *with* evolution (g10) and loses *without* it — the sparser Dispersal waves appear to help the defense under heavy pressure, the effect the Dispersal study warned about. One timeline, one cell; flagged, not concluded.
4. **Growth and constant multipliers differ in profile**: growth 0.10–0.11 leaves early waves untouched and only the Turret and Voltaic timelines fail (through their mutations); a constant ×1.25 breaks the Cannon timeline too.

## Combinations (second pass)

Predeclared combinations of the single-factor parity shifts, enemy HP unchanged unless stated. `node tools/replay-sweep.cjs combos`.

| combination | evolution | cannon-only | mixed | turret-only | voltaic-only |
|---|---|---|---|---|---|
| parity A: turret 8.5 + voltaic 17 + cannon 40 | on | W g20 w10 t23838 (d1) | W g20 w10 t23859 | W g20 w10 t30116 | W g20 w10 t24795 |
| parity A: turret 8.5 + voltaic 17 + cannon 40 | off | W g13 w10 t23332 (d1) | W g20 w10 t22910 | W g20 w10 t28451 (d7/u1) | W g20 w10 t21776 (d4/u2) |
| parity B: turret 8.5 + voltaic 17 + cannon 36 | on | L g0 w9 t20189 (d2) | W g20 w10 t23859 | W g20 w10 t30116 | W g20 w10 t24795 |
| parity B: turret 8.5 + voltaic 17 + cannon 36 | off | W g1 w10 t23722 (d1) | W g20 w10 t22935 | W g20 w10 t28451 (d7/u1) | W g20 w10 t21776 (d4/u2) |
| parity A @ HP x1.25 | on | L g0 w8 t17633 (d7/u1) | W g20 w10 t23932 (d1) | L g0 w5 t13825 (d1/u22) | W g4 w10 t25437 |
| parity A @ HP x1.25 | off | L g0 w10 t24854 (d8) | W g20 w10 t22983 | W g4 w10 t30120 (d1) | W g20 w10 t22094 (d4/u2) |
| parity B @ HP x1.25 | on | L g0 w8 t18421 (d9/u1) | W g20 w10 t23932 (d1) | L g0 w5 t13825 (d1/u22) | W g4 w10 t25437 |
| parity B @ HP x1.25 | off | L g0 w9 t21692 (d10) | W g20 w10 t22987 (d1) | W g4 w10 t30120 (d1) | W g20 w10 t22094 (d4/u2) |
| parity B @ growth 0.10 | on | L g0 w8 t16938 (d5/u1) | W g20 w10 t23859 | W g17 w10 t30195 | W g15 w10 t25211 |
| parity B @ growth 0.10 | off | L g0 w10 t24170 (d4) | W g20 w10 t22983 | W g17 w10 t30039 | W g20 w10 t21864 (d4/u2) |

Reading, with the same limits as above (four plans, one per line; the plans invest differently — 890 / 960 / 1085 / 2060 credits — so a mono column compares the player's *plan*, not the line in the abstract):

- **Parity A at recorded pressure makes every timeline sweep 20/20.** Lines are closer to each other; nothing is threatened. The cannon-only timeline ends *better* with evolution (g20) than without (g13): the third sighting of Dispersal's spawn spacing helping the defense.
- **Parity B at recorded pressure turns the cannon plan into the only loser**, and only through its mutations (loss with evolution, W g1 without). The cheap two-cannon plan stops working; whether 36 under-cuts the line as a whole cannot be read from one plan.
- **Parity A at HP ×1.25 shows the structure the design asks for:** the turret plan loses with evolution and wins g4 without; the voltaic plan holds g4 with evolution and g20 without; the mixed plan is clean either way; the cannon plan loses regardless. Each mono plan is punished by its own counters and the mixed plan is not — on these four timelines only.
- **Parity B at growth 0.10** removes the cannon plan with or without evolution (the line is too weak for that plan), leaves turret unaffected by evolution (g17 / g17) and costs voltaic 5 HP.

These rows are a candidate for the next *human* playtest, not for the passport: parity A with pressure ×1.25 (constant), evolution on. The Dispersal implementation (spawn spacing) is now flagged three times as helping the defense under pressure and should be redesigned before any number is fixed.

## What they do not support

- Any specific v0.5 numbers. Combinations were run as predeclared candidates on four plans, not tuned.
- Claims about human play beyond these four plans; the players' reactive decisions under changed rules are not modelled (deferral policy is a stand-in).
- Mutation balance verdicts: the paired on/off differences come from one plan per line.

## Reproduce

`node tests/replay-sweep.cjs` (fidelity gate), `node tools/replay-sweep.cjs [turret|cannon|voltaic|hp|growth]`. Generated tables and JSON land in `reports/generated/` (ignored by git).
