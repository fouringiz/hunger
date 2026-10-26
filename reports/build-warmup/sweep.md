# Build warm-up 1.65 s — counterfactual sweep (2026-10-26)

Research mode (tools/replay-sweep.cjs, override buildWarm:1.65): the recorded player actions are replayed under their own preset with every new building holding fire for 1.65 s after it is placed. Baseline column is the recorded outcome.

| timeline | instant build | build warm-up 1.65 s |
|---|---|---|
| v04/cannon-only | W gate 20, wave 10, credits 2230, 23838 ticks | W gate 20, wave 10, credits 2230, 23838 ticks |
| v04/mixed | W gate 20, wave 10, credits 2160, 23932 ticks | W gate 20, wave 10, credits 2160, 23932 ticks |
| v04/turret-only | W gate 1, wave 10, credits 965, 30202 ticks | L gate 0, wave 6, credits 175, 17243 ticks, deferred 1 |
| v04/voltaic-only | W gate 6, wave 10, credits 1965, 25361 ticks | W gate 4, wave 10, credits 1955, 25361 ticks |
| parityA/cannon-only | L gate 0, wave 4, credits 40, 10538 ticks | L gate 0, wave 4, credits 40, 10538 ticks |
| parityA/mixed | W gate 20, wave 10, credits 1745, 23364 ticks | W gate 20, wave 10, credits 1745, 23364 ticks |
| parityA/turret-only | W gate 20, wave 10, credits 860, 30323 ticks | W gate 20, wave 10, credits 860, 30323 ticks |
| parityA/voltaic-only | W gate 20, wave 10, credits 2120, 21833 ticks | W gate 20, wave 10, credits 2120, 21833 ticks |

Reading: six of eight timelines do not change at all. The two that do were already marginal: v04/turret-only had won with Gate 1 and now falls at wave 6 (one action deferred: a build that could not be afforded at its recorded tick); v04/voltaic-only keeps the win and loses two more Gate points. The cost lands exactly where the design wants it, on buildings placed under fire with no margin.
