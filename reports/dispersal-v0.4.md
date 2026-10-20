# Dispersal control study — prototype v0.4 (research only)

> **WIP CHECKPOINT — NOT READY FOR DESIGN CONCLUSIONS OR MERGE.** An earlier run accidentally changed the herd setting via an Array.map callback argument. The tool has been corrected and this report regenerated, but final independent validation was interrupted at the user's request. See `development-checkpoint-2026-10-20.md` for the remaining checks. Earlier figures in chat were withdrawn.

Generated: 2026-10-20T16:02:34.279Z. This is a bounded experiment; it does not change the prototype or passport.

## Question and design

Does Dispersal's 1.5× spawn spacing reduce cannon splash concentration enough to change outcomes, and is the apparent effect actually due to extra response time? Three predeclared cannon-heavy two-Cannon-plus-Generator layouts were paired at waves 5 and 9. Each checkpoint has the same 20 Gate HP and a synthetic starting reaction-cash allowance of 200 credits. Historical tower investment is 310.00 credits per baseline checkpoint; the anticipatory mixed layout carries the same total historical investment (one Cannon, one level-2 Turret, one Generator). These funded snapshots are deliberately synthetic and are not campaign-economy claims.

The primary grid has **96 trials** (minimum 48): unchanged, a legal Cannon upgrade candidate set, a legal partial switch candidate set, and an equal-investment pre-mixed baseline; each is paired with Dispersal OFF/ON. Wave 5 has no other mutation; wave 9 holds Sprinter Reflex on both sides. The reaction arms start from the same unchanged checkpoint, then receive the same 200-credit starting reaction allowance. The pre-mixed arm is an anticipatory historical investment comparator, not a postmutation response. Upgrade candidates cover both existing Cannons. Switch candidates sell either Cannon using the game's 60% refund and 1.8 s demolition, then buy a Turret or Voltaic in that slot; the 1.8 s occurs in build phase before the wave. We report all candidates and choose “best observed” only after the predeclared candidate set is complete.

All combat uses the loaded prototype's actual VM runtime at SIM_STEP = 1/60. The only runtime changes are asserted research hooks for measurements and a single asserted conditional to disable the Forager herd speed clamp in the diagnostic. No gameplay source is written. No RNG is added. Every wave is censored at 300 simulated seconds. Dispersal ON changes spawn delays only; identical composition is asserted.

Metrics: clear/loss/timeout, Gate loss, leaks, wave duration, Cannon-enemy seconds in geometric firing range (integrated once per simulation tick per active Cannon), mean living bodies inside the actual Cannon splash collision radius immediately before each impact (including impacts with zero bodies), zero-body impact count, credits spent/refunded/left, and final power demand/output.

## Primary results

Clear/loss/timeout counts are shown in that order. Upgrade/switch rows summarize the best outcome per layout after retaining every candidate in the table below.

| Wave | Arm | Dispersal | Layout | Candidate | N | Clear/loss/timeout | Mean Gate loss | Mean leaks | Mean duration (s) | Cannon-enemy s | Mean bodies / zero-hit impacts |
|---:|---|:---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| 5 | unchanged | OFF | all layouts | — | 3 | 3/0/0 | 4.00 | 1.00 | 40.94 | 72.75 | 1.95 / 0.00 |
| 5 | unchanged | ON | all layouts | — | 3 | 3/0/0 | 5.00 | 1.67 | 45.21 | 106.59 | 1.70 / 0.00 |
| 5 | upgrade | OFF | west-mid | best observed; candidates also in JSON | 1 | 1/0/0 | 0.00 | 0.00 | 32.33 | 90.62 | 1.85 / 0.00 |
| 5 | upgrade | OFF | mid-east | best observed; candidates also in JSON | 1 | 1/0/0 | 0.00 | 0.00 | 38.87 | 63.32 | 2.00 / 0.00 |
| 5 | upgrade | OFF | south-arc | best observed; candidates also in JSON | 1 | 1/0/0 | 10.00 | 2.00 | 45.63 | 72.45 | 2.47 / 0.00 |
| 5 | upgrade | ON | west-mid | best observed; candidates also in JSON | 1 | 1/0/0 | 2.00 | 1.00 | 41.98 | 106.77 | 1.71 / 0.00 |
| 5 | upgrade | ON | mid-east | best observed; candidates also in JSON | 1 | 1/0/0 | 0.00 | 0.00 | 43.28 | 77.40 | 1.79 / 0.00 |
| 5 | upgrade | ON | south-arc | best observed; candidates also in JSON | 1 | 1/0/0 | 8.00 | 3.00 | 48.77 | 116.82 | 1.76 / 0.00 |
| 5 | switch | OFF | west-mid | best observed; candidates also in JSON | 1 | 1/0/0 | 0.00 | 0.00 | 42.00 | 47.28 | 2.47 / 0.00 |
| 5 | switch | OFF | mid-east | best observed; candidates also in JSON | 1 | 1/0/0 | 5.00 | 1.00 | 52.55 | 72.85 | 2.20 / 0.00 |
| 5 | switch | OFF | south-arc | best observed; candidates also in JSON | 1 | 1/0/0 | 12.00 | 3.00 | 45.63 | 41.50 | 4.00 / 0.00 |
| 5 | switch | ON | west-mid | best observed; candidates also in JSON | 1 | 1/0/0 | 0.00 | 0.00 | 40.95 | 27.03 | 1.63 / 0.00 |
| 5 | switch | ON | mid-east | best observed; candidates also in JSON | 1 | 1/0/0 | 0.00 | 0.00 | 47.50 | 20.53 | 2.00 / 0.00 |
| 5 | switch | ON | south-arc | best observed; candidates also in JSON | 1 | 1/0/0 | 12.00 | 3.00 | 47.90 | 47.32 | 1.77 / 0.00 |
| 5 | premixed | OFF | all layouts | — | 3 | 3/0/0 | 4.00 | 1.00 | 42.62 | 57.63 | 2.63 / 0.00 |
| 5 | premixed | ON | all layouts | — | 3 | 3/0/0 | 4.00 | 1.00 | 46.32 | 79.86 | 2.17 / 0.00 |
| 9 | unchanged | OFF | all layouts | — | 3 | 0/3/0 | 20.00 | 5.67 | 52.84 | 328.48 | 2.93 / 0.33 |
| 9 | unchanged | ON | all layouts | — | 3 | 0/3/0 | 20.00 | 5.67 | 56.91 | 383.98 | 2.13 / 0.67 |
| 9 | upgrade | OFF | west-mid | best observed; candidates also in JSON | 1 | 1/0/0 | 19.00 | 5.00 | 54.67 | 286.58 | 2.24 / 1.00 |
| 9 | upgrade | OFF | mid-east | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 6.00 | 54.27 | 345.18 | 2.84 / 2.00 |
| 9 | upgrade | OFF | south-arc | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 6.00 | 51.90 | 362.80 | 3.85 / 0.00 |
| 9 | upgrade | ON | west-mid | best observed; candidates also in JSON | 1 | 1/0/0 | 19.00 | 5.00 | 61.67 | 385.75 | 1.55 / 1.00 |
| 9 | upgrade | ON | mid-east | best observed; candidates also in JSON | 1 | 1/0/0 | 15.00 | 3.00 | 67.37 | 183.22 | 1.73 / 0.00 |
| 9 | upgrade | ON | south-arc | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 6.00 | 58.78 | 375.30 | 2.46 / 0.00 |
| 9 | switch | OFF | west-mid | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 6.00 | 51.90 | 311.83 | 3.88 / 0.00 |
| 9 | switch | OFF | mid-east | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 5.00 | 57.02 | 249.73 | 4.00 / 0.00 |
| 9 | switch | OFF | south-arc | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 6.00 | 49.73 | 121.43 | 3.75 / 0.00 |
| 9 | switch | ON | west-mid | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 5.00 | 62.67 | 348.00 | 2.73 / 0.00 |
| 9 | switch | ON | mid-east | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 5.00 | 60.92 | 83.42 | 2.13 / 0.00 |
| 9 | switch | ON | south-arc | best observed; candidates also in JSON | 1 | 0/1/0 | 20.00 | 6.00 | 54.17 | 216.52 | 2.81 / 0.00 |
| 9 | premixed | OFF | all layouts | — | 3 | 0/3/0 | 20.00 | 5.33 | 56.39 | 258.41 | 4.02 / 0.00 |
| 9 | premixed | ON | all layouts | — | 3 | 0/3/0 | 20.00 | 5.33 | 59.71 | 284.11 | 2.90 / 0.00 |

## Candidate audit

| Wave | Layout | Arm | Dispersal | Candidate | Outcome | Gate loss | Leaks | Duration (s) | Gross spend | Sell refund | Cash after action / end | Power cons/prod | Mean impact bodies / zero hits |
|---:|---|---|:---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | west-mid | upgrade | OFF | {"slot":2} | clear | 0 | 0 | 32.33 | 80 | 0 | 120/365 | 45.00/80.00 | 1.85/0 |
| 5 | west-mid | upgrade | ON | {"slot":2} | clear | 7 | 2 | 50.27 | 80 | 0 | 120/300 | 45.00/80.00 | 1.69/0 |
| 5 | west-mid | upgrade | OFF | {"slot":8} | clear | 0 | 0 | 33.58 | 80 | 0 | 120/365 | 45.00/80.00 | 1.79/0 |
| 5 | west-mid | upgrade | ON | {"slot":8} | clear | 2 | 1 | 41.98 | 80 | 0 | 120/340 | 45.00/80.00 | 1.71/0 |
| 5 | west-mid | switch | OFF | {"slot":2,"type":"turret"} | clear | 0 | 0 | 42.00 | 60 | 66 | 206/451 | 30.00/80.00 | 2.47/0 |
| 5 | west-mid | switch | ON | {"slot":2,"type":"turret"} | clear | 0 | 0 | 45.27 | 60 | 66 | 206/451 | 30.00/80.00 | 2.16/0 |
| 5 | west-mid | switch | OFF | {"slot":2,"type":"voltaic"} | clear | 0 | 0 | 42.00 | 95 | 66 | 171/416 | 38.00/80.00 | 2.29/0 |
| 5 | west-mid | switch | ON | {"slot":2,"type":"voltaic"} | clear | 0 | 0 | 40.95 | 95 | 66 | 171/416 | 38.00/80.00 | 1.63/0 |
| 5 | west-mid | switch | OFF | {"slot":8,"type":"turret"} | clear | 5 | 1 | 52.55 | 60 | 66 | 206/411 | 30.00/80.00 | 2.29/0 |
| 5 | west-mid | switch | ON | {"slot":8,"type":"turret"} | clear | 5 | 1 | 55.08 | 60 | 66 | 206/411 | 30.00/80.00 | 2.06/0 |
| 5 | west-mid | switch | OFF | {"slot":8,"type":"voltaic"} | clear | 12 | 3 | 48.02 | 95 | 66 | 171/311 | 38.00/80.00 | 2.38/0 |
| 5 | west-mid | switch | ON | {"slot":8,"type":"voltaic"} | clear | 7 | 2 | 50.27 | 95 | 66 | 171/351 | 38.00/80.00 | 2.12/0 |
| 9 | west-mid | upgrade | OFF | {"slot":2} | clear | 19 | 5 | 54.67 | 80 | 0 | 120/405 | 45.00/80.00 | 2.24/1 |
| 9 | west-mid | upgrade | ON | {"slot":2} | clear | 19 | 5 | 61.67 | 80 | 0 | 120/405 | 45.00/80.00 | 1.55/1 |
| 9 | west-mid | upgrade | OFF | {"slot":8} | loss | 20 | 6 | 51.45 | 80 | 0 | 120/355 | 45.00/80.00 | 3.03/0 |
| 9 | west-mid | upgrade | ON | {"slot":8} | loss | 20 | 6 | 61.32 | 80 | 0 | 120/385 | 45.00/80.00 | 2.04/0 |
| 9 | west-mid | switch | OFF | {"slot":2,"type":"turret"} | loss | 20 | 6 | 55.40 | 60 | 66 | 206/451 | 30.00/80.00 | 4.09/0 |
| 9 | west-mid | switch | ON | {"slot":2,"type":"turret"} | loss | 20 | 6 | 56.37 | 60 | 66 | 206/381 | 30.00/80.00 | 3.24/0 |
| 9 | west-mid | switch | OFF | {"slot":2,"type":"voltaic"} | loss | 20 | 6 | 55.88 | 95 | 66 | 171/416 | 38.00/80.00 | 3.00/0 |
| 9 | west-mid | switch | ON | {"slot":2,"type":"voltaic"} | loss | 20 | 6 | 61.38 | 95 | 66 | 171/411 | 38.00/80.00 | 1.96/0 |
| 9 | west-mid | switch | OFF | {"slot":8,"type":"turret"} | loss | 20 | 6 | 51.90 | 60 | 66 | 206/416 | 30.00/80.00 | 3.88/0 |
| 9 | west-mid | switch | ON | {"slot":8,"type":"turret"} | loss | 20 | 5 | 62.67 | 60 | 66 | 206/476 | 30.00/80.00 | 2.73/0 |
| 9 | west-mid | switch | OFF | {"slot":8,"type":"voltaic"} | loss | 20 | 6 | 51.90 | 95 | 66 | 171/391 | 38.00/80.00 | 3.88/0 |
| 9 | west-mid | switch | ON | {"slot":8,"type":"voltaic"} | loss | 20 | 5 | 62.67 | 95 | 66 | 171/441 | 38.00/80.00 | 2.73/0 |
| 5 | mid-east | upgrade | OFF | {"slot":5} | clear | 0 | 0 | 38.87 | 80 | 0 | 120/365 | 45.00/80.00 | 2.00/0 |
| 5 | mid-east | upgrade | ON | {"slot":5} | clear | 0 | 0 | 43.28 | 80 | 0 | 120/365 | 45.00/80.00 | 1.79/0 |
| 5 | mid-east | upgrade | OFF | {"slot":9} | clear | 0 | 0 | 39.30 | 80 | 0 | 120/365 | 45.00/80.00 | 1.92/0 |
| 5 | mid-east | upgrade | ON | {"slot":9} | clear | 0 | 0 | 43.48 | 80 | 0 | 120/365 | 45.00/80.00 | 1.79/0 |
| 5 | mid-east | switch | OFF | {"slot":5,"type":"turret"} | clear | 7 | 2 | 48.00 | 60 | 66 | 206/386 | 30.00/80.00 | 2.47/0 |
| 5 | mid-east | switch | ON | {"slot":5,"type":"turret"} | clear | 5 | 1 | 55.08 | 60 | 66 | 206/411 | 30.00/80.00 | 2.05/0 |
| 5 | mid-east | switch | OFF | {"slot":5,"type":"voltaic"} | clear | 7 | 2 | 48.00 | 95 | 66 | 171/351 | 38.00/80.00 | 2.41/0 |
| 5 | mid-east | switch | ON | {"slot":5,"type":"voltaic"} | clear | 0 | 0 | 47.50 | 95 | 66 | 171/416 | 38.00/80.00 | 2.00/0 |
| 5 | mid-east | switch | OFF | {"slot":9,"type":"turret"} | clear | 5 | 1 | 52.55 | 60 | 66 | 206/411 | 30.00/80.00 | 2.20/0 |
| 5 | mid-east | switch | ON | {"slot":9,"type":"turret"} | clear | 10 | 2 | 55.08 | 60 | 66 | 206/371 | 30.00/80.00 | 2.16/0 |
| 5 | mid-east | switch | OFF | {"slot":9,"type":"voltaic"} | clear | 5 | 1 | 52.55 | 95 | 66 | 171/376 | 38.00/80.00 | 2.20/0 |
| 5 | mid-east | switch | ON | {"slot":9,"type":"voltaic"} | clear | 10 | 2 | 55.08 | 95 | 66 | 171/336 | 38.00/80.00 | 2.16/0 |
| 9 | mid-east | upgrade | OFF | {"slot":5} | loss | 20 | 6 | 54.87 | 80 | 0 | 120/365 | 45.00/80.00 | 2.08/0 |
| 9 | mid-east | upgrade | ON | {"slot":5} | clear | 15 | 3 | 67.37 | 80 | 0 | 120/455 | 45.00/80.00 | 1.73/0 |
| 9 | mid-east | upgrade | OFF | {"slot":9} | loss | 20 | 6 | 54.27 | 80 | 0 | 120/365 | 45.00/80.00 | 2.84/2 |
| 9 | mid-east | upgrade | ON | {"slot":9} | loss | 20 | 5 | 60.90 | 80 | 0 | 120/385 | 45.00/80.00 | 2.17/0 |
| 9 | mid-east | switch | OFF | {"slot":5,"type":"turret"} | loss | 20 | 9 | 51.65 | 60 | 66 | 206/406 | 30.00/80.00 | 4.15/0 |
| 9 | mid-east | switch | ON | {"slot":5,"type":"turret"} | loss | 20 | 6 | 55.90 | 60 | 66 | 206/366 | 30.00/80.00 | 3.36/0 |
| 9 | mid-east | switch | OFF | {"slot":5,"type":"voltaic"} | loss | 20 | 6 | 54.57 | 95 | 66 | 171/416 | 38.00/80.00 | 3.10/0 |
| 9 | mid-east | switch | ON | {"slot":5,"type":"voltaic"} | loss | 20 | 5 | 60.92 | 95 | 66 | 171/386 | 38.00/80.00 | 2.13/0 |
| 9 | mid-east | switch | OFF | {"slot":9,"type":"turret"} | loss | 20 | 5 | 57.02 | 60 | 66 | 206/476 | 30.00/80.00 | 4.00/0 |
| 9 | mid-east | switch | ON | {"slot":9,"type":"turret"} | loss | 20 | 5 | 62.30 | 60 | 66 | 206/456 | 30.00/80.00 | 3.06/0 |
| 9 | mid-east | switch | OFF | {"slot":9,"type":"voltaic"} | loss | 20 | 5 | 57.10 | 95 | 66 | 171/441 | 38.00/80.00 | 4.00/0 |
| 9 | mid-east | switch | ON | {"slot":9,"type":"voltaic"} | loss | 20 | 5 | 62.30 | 95 | 66 | 171/421 | 38.00/80.00 | 3.06/0 |
| 5 | south-arc | upgrade | OFF | {"slot":3} | clear | 12 | 3 | 45.63 | 80 | 0 | 120/260 | 45.00/80.00 | 2.33/0 |
| 5 | south-arc | upgrade | ON | {"slot":3} | clear | 8 | 3 | 48.77 | 80 | 0 | 120/295 | 45.00/80.00 | 1.76/0 |
| 5 | south-arc | upgrade | OFF | {"slot":10} | clear | 10 | 2 | 45.63 | 80 | 0 | 120/285 | 45.00/80.00 | 2.47/0 |
| 5 | south-arc | upgrade | ON | {"slot":10} | clear | 11 | 3 | 50.03 | 80 | 0 | 120/280 | 45.00/80.00 | 1.75/0 |
| 5 | south-arc | switch | OFF | {"slot":3,"type":"turret"} | clear | 12 | 3 | 45.63 | 60 | 66 | 206/346 | 30.00/80.00 | 4.00/0 |
| 5 | south-arc | switch | ON | {"slot":3,"type":"turret"} | clear | 13 | 4 | 48.83 | 60 | 66 | 206/341 | 30.00/80.00 | 2.50/0 |
| 5 | south-arc | switch | OFF | {"slot":3,"type":"voltaic"} | clear | 12 | 3 | 45.63 | 95 | 66 | 171/311 | 38.00/80.00 | 3.11/0 |
| 5 | south-arc | switch | ON | {"slot":3,"type":"voltaic"} | clear | 12 | 3 | 47.90 | 95 | 66 | 171/311 | 38.00/80.00 | 1.77/0 |
| 5 | south-arc | switch | OFF | {"slot":10,"type":"turret"} | clear | 12 | 3 | 45.63 | 60 | 66 | 206/346 | 30.00/80.00 | 3.40/0 |
| 5 | south-arc | switch | ON | {"slot":10,"type":"turret"} | clear | 12 | 3 | 47.90 | 60 | 66 | 206/346 | 30.00/80.00 | 2.29/0 |
| 5 | south-arc | switch | OFF | {"slot":10,"type":"voltaic"} | clear | 12 | 3 | 45.63 | 95 | 66 | 171/311 | 38.00/80.00 | 3.40/0 |
| 5 | south-arc | switch | ON | {"slot":10,"type":"voltaic"} | clear | 12 | 3 | 47.90 | 95 | 66 | 171/311 | 38.00/80.00 | 2.29/0 |
| 9 | south-arc | upgrade | OFF | {"slot":3} | loss | 20 | 6 | 52.82 | 80 | 0 | 120/355 | 45.00/80.00 | 2.68/0 |
| 9 | south-arc | upgrade | ON | {"slot":3} | loss | 20 | 7 | 54.17 | 80 | 0 | 120/280 | 45.00/80.00 | 2.09/0 |
| 9 | south-arc | upgrade | OFF | {"slot":10} | loss | 20 | 6 | 51.90 | 80 | 0 | 120/310 | 45.00/80.00 | 3.85/0 |
| 9 | south-arc | upgrade | ON | {"slot":10} | loss | 20 | 6 | 58.78 | 80 | 0 | 120/280 | 45.00/80.00 | 2.46/0 |
| 9 | south-arc | switch | OFF | {"slot":3,"type":"turret"} | loss | 20 | 6 | 52.82 | 60 | 66 | 206/406 | 30.00/80.00 | 4.94/0 |
| 9 | south-arc | switch | ON | {"slot":3,"type":"turret"} | loss | 20 | 6 | 60.13 | 60 | 66 | 206/381 | 30.00/80.00 | 3.27/0 |
| 9 | south-arc | switch | OFF | {"slot":3,"type":"voltaic"} | loss | 20 | 6 | 49.73 | 95 | 66 | 171/381 | 38.00/80.00 | 3.75/0 |
| 9 | south-arc | switch | ON | {"slot":3,"type":"voltaic"} | loss | 20 | 6 | 59.68 | 95 | 66 | 171/361 | 38.00/80.00 | 2.14/0 |
| 9 | south-arc | switch | OFF | {"slot":10,"type":"turret"} | loss | 20 | 6 | 52.82 | 60 | 66 | 206/376 | 30.00/80.00 | 4.20/0 |
| 9 | south-arc | switch | ON | {"slot":10,"type":"turret"} | loss | 20 | 6 | 54.17 | 60 | 66 | 206/381 | 30.00/80.00 | 2.81/0 |
| 9 | south-arc | switch | OFF | {"slot":10,"type":"voltaic"} | loss | 20 | 6 | 52.82 | 95 | 66 | 171/391 | 38.00/80.00 | 4.20/0 |
| 9 | south-arc | switch | ON | {"slot":10,"type":"voltaic"} | loss | 20 | 6 | 59.68 | 95 | 66 | 171/386 | 38.00/80.00 | 2.62/0 |

## Herd diagnostic

This is a separate unchanged-defense 2×2 diagnostic; only the Forager-vs-Carapacid speed clamp is removed. The speed base, spawn spacing, enemy HP, composition, and all other mechanics remain as loaded. It contains 24 trials (3 layouts × 2 waves × 2 herd states × 2 Dispersal states).

| Wave | Herd | Dispersal | Clear/loss/timeout | Mean Gate loss | Mean leaks | Duration (s) |
|---:|---|:---:|---:|---:|---:|---:|
| 5 | ON (prototype) | OFF | 3/0/0 | 4.00 | 1.00 | 40.94 |
| 5 | ON (prototype) | ON | 3/0/0 | 5.00 | 1.67 | 45.21 |
| 5 | OFF (clamp removed) | OFF | 3/0/0 | 4.00 | 1.00 | 41.50 |
| 5 | OFF (clamp removed) | ON | 3/0/0 | 5.00 | 1.67 | 44.45 |
| 9 | ON (prototype) | OFF | 0/3/0 | 20.00 | 5.67 | 52.84 |
| 9 | ON (prototype) | ON | 0/3/0 | 20.00 | 5.67 | 56.91 |
| 9 | OFF (clamp removed) | OFF | 0/3/0 | 20.00 | 8.33 | 51.10 |
| 9 | OFF (clamp removed) | ON | 0/3/0 | 20.00 | 7.00 | 57.09 |

## Verdict

In this sample, Dispersal changed Gate loss and/or leaks in the unchanged cannon-heavy controls. Wave 5: unchanged-control mean Gate loss 4.00→5.00 (Δ 1.00), leaks 1.00→1.67 (Δ 0.67), and duration 40.94→45.21 s (Δ 4.27 s). Wave 9: unchanged-control mean Gate loss 20.00→20.00 (Δ 0.00), leaks 5.67→5.67 (Δ 0.00), and duration 52.84→56.91 s (Δ 4.07 s). The longer duration and higher in-range exposure co-occurred here with lower occupancy per impact; these measurements are descriptive and do not isolate causal channels. At wave 9 all unchanged arms hit the 20-HP Gate-loss ceiling, so Gate loss cannot show differences beyond total destruction. The herd diagnostic tests whether the unchanged clamp-off diagnostic has more leaks: 8.33/7.00 versus 5.67/5.67 per wave in waves 5/9; removing only that speed clamp therefore does not erase the measured Dispersal pattern, and it leaves Carapacid shadow intact. Candidate results are descriptive across the declared set and are not evidence of a universal switching advantage.

This finding applies only to these three cannon-heavy synthetic snapshots and the chosen response candidates. It does not validate campaign balance or establish that Dispersal is desirable.

## Reproduction

Run node tools/check-dispersal.cjs to regenerate this report and the ignored JSON under reports/generated/. Run node tests/dispersal-control.cjs for the instrumentation equivalence check. The report file is committed; generated JSON is ignored.
