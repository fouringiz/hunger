# Infantry field trial — checkpoint

Status: implementation and automated checks complete; ready for user review.
No balance verdict. Base: main `e607abf`.

## Approved scope

Build a Barracks in an ordinary slot. Soldiers automatically walk to the nearest
point on the existing path and engage enemies in melee, one enemy per soldier.
Soldiers have health and can die. Surplus enemies pass; no path walls or manual
commands. Three-quarter soldier/Forager art is a first visual sample, not a full
roster replacement. Keep the normal game available with the experiment disabled.

## Architecture review

- Enable the trial explicitly with `prototype/index.html?infantry=1` and label it.
- Keep actual fixed-step simulation; avoid a second copied HTML simulation.
- One Barracks level and draft parameters; ordinary credits, slot and power cost.
- Walk from the structure to a deterministic nearest-path rally point; no catch
  from across the map or dragging enemies backward to that point.
- One reciprocal soldier/enemy contact. Stop `d` and set `effSpeed=0` before
  artillery aims; restore movement when released. Preserve automatic targeting.
- No replacements in a wave; heal/replace between waves. Pause does not heal.
- Sell, death, pause, reset and Leech leaving the path release contacts safely.
- Track melee separately from the existing three weapon damage ledgers. Do not
  invent an existing weapon's dominance when only infantry dealt damage.
- Measure synergy with artillery before claiming that infantry improves balance.

## Player control case

Player reports Cannon L3 ×2 plus Generator L3 on the supplied screenshot layout
clearing all ten waves at 20/20 Gate HP. Purchase timing is not recorded. Treat
the final layout as a reproducible funded snapshot, not a proved campaign buying
sequence. Do not claim equal-budget comparison from unequal unspent allowances.

## Remaining

Implementation and the first three-quarter soldier/Forager contact sample are
complete. The experimental menu is available with `?infantry=1`. Core regression,
infantry lifecycle/determinism and art/menu/fallback checks pass. The architecture
review found warmup and released-target prediction errors; both were fixed and
checked with actual simulation steps.

The controlled study compares exactly 110 additional credits for Barracks,
Cannon or Turret L2 across 24 funded snapshots. All 18 conventional/reference
snapshots and the funded final player layout match original main `e607abf`.
The player-reported final layout is inferred as Cannon slots 2/3, Generator 15;
its purchase history is not reproduced. Granting all L3 assets at wave one loses
on wave nine in both main and this branch. Do not present that as a reproduction
of the player's clean run.

Independent review reproduced all 24 study rows and all 18 trial/normal-mode
checks; no unresolved blocking findings remain. The comparison tool and report
are included with the playable implementation. Live browser/mobile playtest
remains pending.
The first art sample uses left/right mirroring, not a full 3D camera or complete
directional animation. The whole-roster/crowd redesign and tower-layer fix are
outside this bounded infantry trial. Leave merging to the user.
