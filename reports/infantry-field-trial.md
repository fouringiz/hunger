# Melee infantry field trial — exact-spend control

Generated: 2026-10-21T11:46:33.358Z. Experimental, not a campaign balance verdict.

## Method

Three predeclared layouts × waves 5/9 × four arms = 24 fixed-step trials. The unchanged reference invests 310 credits in two L1 Cannons and an L1 Generator and leaves 110 unused. Each active response spends exactly that remaining 110: one Barracks, one L1 Cannon, or one L2 Turret (60 + 50). Total active investment is 420; leftover prewave cash is zero in every active arm. No selling, refunds, bonus resources or later purchases. All arms receive the same five-second build phase, with real soldier march. All start with 20 Gate HP. Wave 5 carries Sprinter; wave 9 carries Sprinter and Dispersal, identical within every comparison. Layouts are recorded in the generated JSON. These are funded synthetic snapshots, not reachable campaign purchase sequences.

Outcomes are clear/loss/timeout, observed Gate HP/leaks and terminal time (not full wave length after defeat). Measurements stop at defeat; a destroyed Gate censors remaining pressure. Melee damage is actual HP removed, not reserved damage; blocked seconds sum across contact pairs. Infantry costs, HP, damage and power are draft constants. Melee damage is separate from the three weapon ledgers; the trial skips counter selection at a scheduled checkpoint if no conventional weapon dealt damage, rather than inventing a dominance cause. That policy is experimental and not adopted campaign evolution. Normal/trial mode with no Barracks is compared exactly for all 18 conventional/reference snapshots.

## Results

| Layout | Wave | Arm | Added spend | Outcome | Gate HP | Leaks | Terminal s | Melee damage | Casualties | Blocked pair s |
|---|---:|---|---:|---|---:|---:|---:|---:|---:|---:|
| player-loop | 5 | unchanged | 0 | clear | 8 | 3 | 45.27 | 0.00 | 0 | 0.00 |
| player-loop | 5 | barracks | 110 | clear | 13 | 2 | 46.08 | 48.00 | 3 | 3.00 |
| player-loop | 5 | cannon | 110 | clear | 18 | 1 | 35.52 | 0.00 | 0 | 0.00 |
| player-loop | 5 | turret-upgrade | 110 | clear | 18 | 1 | 35.52 | 0.00 | 0 | 0.00 |
| player-loop | 9 | unchanged | 0 | loss | 0 | 6 | 60.32 | 0.00 | 0 | 0.00 |
| player-loop | 9 | barracks | 110 | loss | 0 | 6 | 55.87 | 48.00 | 3 | 3.00 |
| player-loop | 9 | cannon | 110 | clear | 2 | 5 | 59.82 | 0.00 | 0 | 0.00 |
| player-loop | 9 | turret-upgrade | 110 | loss | 0 | 5 | 60.58 | 0.00 | 0 | 0.00 |
| west-mid | 5 | unchanged | 0 | clear | 18 | 1 | 36.62 | 0.00 | 0 | 0.00 |
| west-mid | 5 | barracks | 110 | clear | 20 | 0 | 35.77 | 71.60 | 3 | 6.00 |
| west-mid | 5 | cannon | 110 | clear | 20 | 0 | 27.48 | 0.00 | 0 | 0.00 |
| west-mid | 5 | turret-upgrade | 110 | clear | 20 | 0 | 27.38 | 0.00 | 0 | 0.00 |
| west-mid | 9 | unchanged | 0 | loss | 0 | 6 | 56.33 | 0.00 | 0 | 0.00 |
| west-mid | 9 | barracks | 110 | loss | 0 | 6 | 60.50 | 81.20 | 3 | 7.00 |
| west-mid | 9 | cannon | 110 | clear | 3 | 4 | 60.10 | 0.00 | 0 | 0.00 |
| west-mid | 9 | turret-upgrade | 110 | clear | 10 | 2 | 67.37 | 0.00 | 0 | 0.00 |
| east-turn | 5 | unchanged | 0 | clear | 10 | 2 | 48.88 | 0.00 | 0 | 0.00 |
| east-turn | 5 | barracks | 110 | clear | 15 | 1 | 49.95 | 48.00 | 3 | 3.00 |
| east-turn | 5 | cannon | 110 | clear | 20 | 0 | 38.88 | 0.00 | 0 | 0.00 |
| east-turn | 5 | turret-upgrade | 110 | clear | 20 | 0 | 39.92 | 0.00 | 0 | 0.00 |
| east-turn | 9 | unchanged | 0 | loss | 0 | 4 | 65.70 | 0.00 | 0 | 0.00 |
| east-turn | 9 | barracks | 110 | loss | 0 | 4 | 61.62 | 24.00 | 3 | 3.00 |
| east-turn | 9 | cannon | 110 | clear | 10 | 2 | 65.65 | 0.00 | 0 | 0.00 |
| east-turn | 9 | turret-upgrade | 110 | clear | 15 | 1 | 67.83 | 0.00 | 0 | 0.00 |

## Bounded comparison

- player-loop, wave 5: Barracks Gate 13, leaks 2; best declared conventional arm (cannon) Gate 18, leaks 1.
- player-loop, wave 9: Barracks Gate 0, leaks 6; best declared conventional arm (cannon) Gate 2, leaks 5.
- west-mid, wave 5: Barracks Gate 20, leaks 0; best declared conventional arm (turret-upgrade) Gate 20, leaks 0.
- west-mid, wave 9: Barracks Gate 0, leaks 6; best declared conventional arm (turret-upgrade) Gate 10, leaks 2.
- east-turn, wave 5: Barracks Gate 15, leaks 1; best declared conventional arm (cannon) Gate 20, leaks 0.
- east-turn, wave 9: Barracks Gate 0, leaks 4; best declared conventional arm (turret-upgrade) Gate 15, leaks 1.

This compares the declared purchases and placements, not optimized spending or a universal advantage for infantry. Holding enemies can amplify artillery; these results do not separate damage from holding time and do not justify nerfing a weapon.

## Player-reported build

Screenshot-inferred Cannons at slots 2/3 and Generator at slot 15, all L3, total investment 890. Player reports all ten waves and 20 HP. The reproduction grants the complete final build at wave one; purchase timing was not supplied, so this only checks the funded final layout, not the player's economy. Measured result: Gate 0, win false, 9 observed waves.

## Verdict

On observed Gate HP and leaks, Barracks is better than the best declared conventional response in 0 of six paired checkpoints, tied in 1, and worse in 5. This draft does not establish a gameplay advantage for infantry. The implementation is ready for bounded gameplay/visual review; it is not a tuned balance release. No adoption into campaign canon and no balance change is inferred from this small snapshot study. A stronger whole-campaign comparison needs recorded purchase timing and matched investment schedules.

## Reproduce

Run `node tests/infantry-trial.cjs` and `node tools/check-infantry.cjs`. Play `prototype/index.html?infantry=1`; Barracks is an experimental option. Generated JSON is ignored by git.
