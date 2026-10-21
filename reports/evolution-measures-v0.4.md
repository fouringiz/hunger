# Evolution measures on recorded games — v0.4

Generated 2026-10-21 by `node tools/replay-sweep.cjs measure`. Measurement only; no mechanic or number is changed.

## Method

Eight recorded player games: the baseline set (`reports/replays/human-v0.4/`, campaign rules) and the parity A candidate set (`reports/replays/human-v0.4-parityA/`, `?balance=parityA`). Each is replayed by the counterfactual player with evolution on (as recorded) and off (`EVOLUTION_WAVES` emptied). Both sets reproduce exactly against the strict verifier with evolution on.

Measures come from wrappers around `damage`, `fireElectro` and `stepSimulation` that call the originals unchanged and only count; a test pins that every instrumented game ends in the same signature as the plain one. Measured:

- **damage share** — actual HP removed by each line over the whole game (not kills; a line that finishes wounded enemies is not credited with the work of the line that wounded them);
- **rod breaks** — Voltaic bolts whose chain ended on a lightning rod, and how many of those rods had already died from the hit (the chain stops either way);
- **estimated denied damage** — what the chain would have dealt beyond the rod under the same target rule (nearest unstruck body within hop range, not already covered by reserved damage), capped at each target's current HP, with no damage applied. It is an upper bound on damage the *bolt* lost, **not** damage the defense lost: the same enemies are hit later by other bolts;
- **bodies per shell** — living enemies damaged per resolved Cannon shell, per wave;
- **wave duration**, **brownout seconds** and **paused tower-seconds** during waves.

With evolution off the two runs diverge after wave 4, so per-wave comparisons from wave 5 compare similar, not identical, states.

## Results

### Per game

| set | timeline | evolution | outcome | ticks | damage share K/A/V % | Voltaic bolts | rod breaks (rod already dead) | Voltaic dmg dealt / est. denied (hops) | brownout s / wave s | paused tower·s |
|---|---|---|---|---|---|---|---|---|---|---|
| baseline | cannon-only | on | W g20 | 23838 | 0/100/0 | — | — | — | 14.1 / 336.8 | 13.1 |
| baseline | cannon-only | off | W g20 | 22212 | 0/100/0 | — | — | — | 14.1 / 307.8 | 13.1 |
| baseline | mixed | on | W g20 | 23932 | 5/70/25 | 294 | 0 | 7246 / 0 | 0 / 306.3 | 0 |
| baseline | mixed | off | W g20 | 22983 | 5/72/23 | 274 | 0 | 6749 / 0 | 0 / 277.6 | 0 |
| baseline | turret-only | on | W g1 | 30202 | 100/0/0 | — | — | — | 10.2 / 433.4 | 9.9 |
| baseline | turret-only | off | W g8 | 30103 | 100/0/0 | — | — | — | 7.7 / 391.3 | 9.9 |
| baseline | voltaic-only | on | W g6 | 25361 | 0/0/100 | 972 | 754 (102) | 29066 / 26555 (2451) | 9 / 372 | 16.2 |
| baseline | voltaic-only | off | W g20 | 22026 | 0/0/100 | 710 | 0 | 29490 / 0 | 9 / 315.3 | 16.2 |
| parityA | cannon-only | on = off | L w4 | 10538 | 0/100/0 | — | — | — | 19 / 163.3 | 31.3 |
| parityA | mixed | on | W g20 | 23364 | 33/47/20 | 228 | 0 | 7543 / 0 | 3.3 / 324.8 | 7.6 |
| parityA | mixed | off | W g20 | 22424 | 27/54/19 | 215 | 0 | 6856 / 0 | 3.3 / 295.8 | 7.6 |
| parityA | turret-only | on | W g20 | 30323 | 100/0/0 | — | — | — | 0 / 433.5 | 0 |
| parityA | turret-only | off | W g20 | 29456 | 100/0/0 | — | — | — | 0 / 397.4 | 0 |
| parityA | voltaic-only | on | W g20 | 21833 | 0/0/100 | 1028 | 803 (105) | 36863 / 34033 (2590) | 0 / 324.4 | 0 |
| parityA | voltaic-only | off | W g20 | 21703 | 0/0/100 | 747 | 0 | 36863 / 0 | 0 / 313.2 | 0 |

The full generated table, including every column for every row, is written to `reports/generated/replay-measures.json`.

### Bodies damaged per Cannon shell, by wave (evolution on / off)

Sprinter Reflex applies from wave 5, Dispersal from wave 9.

| set | timeline | w4 | w5 | w6 | w7 | w8 | w9 | w10 |
|---|---|---|---|---|---|---|---|---|
| baseline | cannon-only | 1.96 / 1.96 | 1.95 / 2.05 | 1.89 / 2.04 | 1.85 / 1.91 | 1.81 / 1.85 | 1.56 / 1.98 | 1.62 / 1.83 |
| baseline | mixed | 2.22 / 2.22 | 2.13 / 2.47 | 2.10 / 2.14 | 2.14 / 2.18 | 2.10 / 2.14 | 1.58 / 2.21 | 1.55 / 2.26 |
| parityA | mixed | 2.71 / 2.71 | 3.09 / 2.92 | 2.73 / 2.73 | 2.53 / 2.50 | 2.21 / 2.48 | 1.96 / 2.35 | 2.00 / 2.33 |

### Wave duration in seconds, waves 5–10 (evolution on / off)

| set | timeline | w5 | w6 | w7 | w8 | w9 | w10 |
|---|---|---|---|---|---|---|---|
| baseline | cannon-only | 26 / 25 | 29 / 30 | 32 / 31 | 42 / 40 | 53 / 37 | 56 / 44 |
| baseline | mixed | 25 / 24 | 28 / 28 | 29 / 29 | 37 / 37 | 48 / 36 | 56 / 40 |
| baseline | turret-only | 46 / 35 | 54 / 43 | 41 / 36 | 56 / 44 | 42 / 40 | 45 / 43 |
| baseline | voltaic-only | 31 / 28 | 36 / 31 | 40 / 34 | 60 / 41 | 50 / 41 | 60 / 45 |
| parityA | mixed | 25 / 26 | 28 / 28 | 31 / 31 | 38 / 38 | 52 / 38 | 57 / 42 |
| parityA | turret-only | 43 / 36 | 48 / 39 | 46 / 40 | 56 / 49 | 52 / 47 | 52 / 50 |
| parityA | voltaic-only | 30 / 28 | 33 / 31 | 35 / 34 | 43 / 41 | 41 / 40 | 46 / 44 |

Waves 1–4 are identical in every pair (no mutation yet); the full per-wave table is in the generated output.

## What the measures support

1. **Grounding works throughout the game in both sets; what differs is whether the defense has spare capacity to absorb it.** In grounded games 78% of all Voltaic bolts end on a rod (754 of 972 at campaign rules, 803 of 1028 under parity A); about one break in seven happens on a rod that the bolt already killed. Total Voltaic damage dealt is essentially unchanged by evolution (29 066 vs 29 490; 36 863 vs 36 863) because the same enemies have to die; the cost is paid in **bolts** (+37% and +38%) and **time**. At campaign rules that cost reached the Gate (g6 vs g20, waves 5–10 up to 19 s longer); under parity A the three L3 Voltaic towers had enough margin that it did not (g20, waves at most 2 s longer). This confirms the review's reading: 20/20 under parity A means the defense absorbed the restriction, not that the restriction stopped.
2. **Dispersal has two measurable effects in opposite directions.** In its waves (9–10) it lowers bodies damaged per shell by 11–31% — the anti-artillery effect is real — and lengthens those waves by 27–43%. Which effect dominates the outcome depends on how close the defense is to its limit; this explains, without contradiction, both the splash loss measured here and the earlier sightings of Dispersal helping a defense under pressure. Nothing here says the mechanic is broken; it says its net effect is not monotone.
3. **Sprinter Reflex's per-shell effect is small.** Waves 5–8 mostly show 0–7% fewer bodies per shell (outliers −14% and −11%; one wave +6% in favour of the mutated run), and wave durations within ±2 s.
4. **Keratinization's cost appears as time.** Turret-only waves 5–8 last 14–31% longer with evolution in both sets; at campaign rules that cost 7 Gate HP, under parity A none.
5. **The parity A cannon-only loss is an early power and economy failure, not evolution** (identical with evolution on and off; no mutation was ever reached). Brownout covered 19 of 163 wave seconds (12%; campaign-rule cannon game: 14 of 337, 4%) and towers stood paused for 31 tower-seconds; waves 2–4 lasted 47 / 47 / 54 s against 25 / 24 / 35 s for the same opening at campaign rules. The opening's power plan was the same in both games; ×1.25 HP turned its slow waves into leaks.
6. **Damage share, not kills, is the contribution of a line.** Parity A mixed: Turret 33%, Cannon 47%, Voltaic 20% with evolution (27 / 54 / 19 without). Campaign-rule mixed: 5 / 70 / 25.

## What they do not support

- Redesigning Grounding or Dispersal. Both act as intended on the measured axis; their outcome effect depends on defensive margin.
- A size for "denied damage" as lost damage; the estimate is per bolt and an upper bound.
- Anything about why the player kept the same composition after mutations; the replays record actions, not reasons.

## Reproduce

`node tests/replay-sweep.cjs` (fidelity and non-interference), `node tools/replay-sweep.cjs measure` (tables and `reports/generated/replay-measures.json`).
