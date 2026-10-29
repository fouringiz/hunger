# Sale animation test follow-up — 2026-10-29

- User reran `node tests/level4-seating.cjs`: PASS for all 250 heading/recoil
  samples, including exact old empty-socket, raised-upper and detached-head
  negative variants. This confirms the native contact regression, not art approval.
- User reran `npm test`: FAILED later at `tests/salvage-and-ranges.cjs`, Voltaic
  sale pose count 1 rather than 4. Full suite is not green.
- Cause: the sale test serialized only local drawImage arguments. The neutral
  upper retracts through `ctx.translate(0,drop)`; its local image rectangle stays
  constant. The mock now tracks canvas save/restore and affine transformations,
  and sale snapshots include each image's actual drawing matrix.
- Preserved four distinct sale samples for all six building types and existing
  refund/removal timing assertions. Added explicit neutral-upper downward motion,
  stationary-foundation assertions and a frozen-upper negative using the same
  motion check. No runtime/assets changed; no test/capture run by agent.
- User next: `node tests/salvage-and-ranges.cjs`, then `npm test`. Existing game
  captures do not need regenerating for this test-only correction. Full visual
  review/browser check and independent review of PR #69 remain pending.

---
Previous checkpoint:

# Socket coverage test follow-up — 2026-10-29

- User reran `node tests/infantry-art.cjs`: PASS. `npm test` FAILED later at
  `tests/level4-seating.cjs`, Rifle heading 1, age 0: 83/112 colour-change samples.
  Full suite remains unverified/failed; earlier focused Flamethrower test passed.
- The coverage test inferred occlusion from RGB distance against the underlying
  foundation. That is invalid when an opaque olive upper matches the foundation
  colour. The actual filled bearing includes an opaque rectangle enclosing the
  entire sampled ellipse; the user result is not proof of a physical hole.
- Replaced RGB distance with alpha of the actual head/support/bearing rendering
  with the foundation image omitted. Same sample ellipse, >128 alpha threshold
  and >=75% coverage remain. No padding, recolouring, geometry changes or lowered
  pass threshold. Exact old empty-socket renderer, raised-upper and detached-head
  negatives still use the same checks. Upper/bearing and head/support contact
  requirements are unchanged.
- No runtime/assets modified. No tests/captures run by agent. User must rerun
  `node tests/level4-seating.cjs` and `npm test`; existing game frames remain valid.
- Howitzer native combat parity and incomplete visual-review status from earlier
  checkpoints remain unchanged. Do not call the full suite or visual work passed.

---
Previous checkpoint:

# Infantry art test follow-up — 2026-10-29

- User reran `node tests/flamethrower-art.cjs`: PASS, including negative variants.
- User reran `npm test`: FAILED later at `tests/infantry-art.cjs:22` on the
  asset path assertion. Full suite is not green.
- Cause: the test selected `images[2]`; the newly inserted neutral Voltaic image
  occupies that slot. Both loaded and failed-image cases now select the actual
  `infantryArt` runtime binding. Keep the same asset-path, three-soldier drawing,
  draw-parity and six-build-choice requirements; assert failed sheets aren't drawn.
- Searched tests for numeric image-array indexing and `.at()` selections; no
  other matches after this correction. No runtime/assets changed.
- Agent did not run tests/captures. Next user commands:
  `node tests/infantry-art.cjs` then `npm test`.
- Howitzer capture evidence and incomplete visual-review status from the prior
  checkpoint remain unchanged; no recapture needed for this test-only correction.

---
Previous checkpoint:

# Shared foundation verification follow-up — 2026-10-29

- User ran `npm test`: FAILED at the negative head-emergence case in
  `tests/flamethrower-art.cjs` (line 73 before this correction), missing expected
  exception. This is not a green full suite.
- Cause: bare `42*(1-lift)` replacement now matched the support introduced before
  the head translation. It altered the support, while the head under test stayed
  correct. Corrected the mutation to the exact head translation; all source
  mutations in that test now require a unique matching target. The unchanged
  emergence threshold must still reject the too-short head/tank lift variants.
- No runtime/assets changed in this correction. Agent did not run tests/captures.
  User must rerun `node tests/flamethrower-art.cjs` and `npm test`.
- User-run `--tower-base howitzer` COMPLETED. Its results.json confirms the
  `528cb0b` before/current after rules `9d3c412e`, source `5750d1fe`, and exact 151
  live-step combat parity in both Mire and Ember.
- Opened Howitzer reference/game pair, Mire before/after whole frames and after
  upgrade strip. The common square base is visible, but the head is noticeably
  flatter than the approved elevated-barrel reference. This is a review risk,
  not visual approval. Full turn/attack/build/pause/sale and Ember/grayscale
  inspection remains incomplete; other branches and file:// check pending.
- Before/after evidence and remaining criteria updated in
  `reports/common-tower-foundation.md`. Next: user reruns focused/full tests;
  then continue visual review without merging PR #69 or claiming acceptance.

---
Previous checkpoint:

# Shared weapon foundation — implementation prepared, verification pending

- User approved one identical Turret foundation for all four weapon families and
  levels. Same low-buildings cell 0, 44×34 placement and central bearing at (0,-5.5).
- Rendering now routes basic Turret/Cannon, Voltaic, Flamethrower and all eight
  level-four heads through the shared foundation. Cannon/Flamethrower level-four
  bearing centres follow the common socket; upper and muzzle move together.
- Construction/retraction keeps the complete base fixed; only upper parts move.
  Basic weapon supports fill the shared socket. No source asset pixels/layout,
  combat, balance, PATH/GATE_D or platform positions changed; no restamp needed.
- Prepared `tests/common-tower-foundation.cjs`: all types, levels/branches,
  aim/build/pause/sale states and fallbacks; rejects exact old split-base source
  `528cb0b` and a deliberately shifted base. Existing contact/flamer/coherent-art
  tests adapted to the approved shared-base and neutral-upper requirements.
- Prepared `--tower-base <branch>` capture against `528cb0b`, isolating this visual
  issue. It includes levels 1–3, construction, level-4 turn/upgrade, full attack,
  pause/retraction, whole/close/grayscale for Mire/Ember and exact combat parity.
- No tests, captures or disk-browser checks run by agent. No current before/after
  frames exist; visual acceptance and contrast/perspective/contact are pending.
- Criteria and exact commands: `reports/common-tower-foundation.md`. Next: user
  runs checks and supplies frames; inspect them before claiming success. PR #69
  stays open for independent visual review; no merge performed.

---
Previous checkpoint:

# PR #69 review follow-up — implementation prepared, verification pending

- Separate base-change iteration saved in `acb6218`: one neutral upper for
  Voltaic levels 1–3, exact shared square base and fixed bearing through Tesla/Prism.
- Separate rotation iteration: six new overhead upper sprites, continuously
  projected through `weaponProjection`; no discrete yaw selection. Upright support
  and layered side depth retain seating. Tesla/Cluster remain stationary. The
  muzzle uses the head transform; artillery launch points remain pinned in flight.
- Sprites packed/opened as isolated assets, no runtime pixel reads introduced.
  No changes to combat/balance/PATH/GATE_D/platform positions or simulation.
- Prepared tests: Voltaic shared foundation/origin/fallback, level-4 projected
  geometry/muzzle/recoil and negative quantized-yaw case, existing native contact
  regression adapted for both atlases. NONE RUN by agent, per user agreement.
- Prepared actual-game captures, one issue per command: `--voltaic-base tesla`
  (`a434efa` baseline) and `--level4-yaw machine-gun` (`acb6218` baseline).
  Yaw captures save 361 frames for a complete turn plus full attack/upgrade/sale
  cycles, whole views and grayscale. No new captures exist yet.
- Observable criteria, exact commands, expected before/after paths and review
  risks: `reports/level4-review-followup.md`. Tests and actual file:// browser
  console check belong to user. No visual success or art acceptance claimed.
- Next: user runs checks and supplies game frames; inspect before/after whole and
  close, full cycles, contrast/grayscale and perspective. Independent second
  visual review required before merge. PR remains open for the user's review.

---
Previous checkpoint:

# Voltaic base review finding — prepared, checks pending (2026-10-29)

- PR #69: user requests one neutral upper for Voltaic levels 1–3 on the exact
  square foundation used by Tesla/Prism. Added `hunger-voltaic-neutral-v1.png`.
- Common foundation and filled coupling are shared across all four levels.
  Neutral assembly, deployment, pause/sale and shot/charge origin use the new terminal.
- Observable criterion: the base source cell, placement and scale never change at
  the level-3 -> Tesla/Prism handoff. Neutral head must sit on its bearing, retain
  platform perspective and remain legible in the whole scene and grayscale.
- Prepared `tests/voltaic-art.cjs` and `--voltaic-base tesla` / `prism` captures
  against `a434efa`. No tests, game captures or browser checks run by the agent.
- Before/after expected at `reports/generated/voltaic-base/<branch>/`; none yet.
  User must run and supply whole/close/upgrade/pause/sale views for inspection.
- No simulation, balance or route/platform changes. Next separate iteration:
  continuous level-4 aiming. Do not call either visual issue verified.

---
Previous checkpoint:

# Level 4 seating follow-up — prepared, verification pending (2026-10-29)

- User reports the previously requested tests passed. Original Machine Gun native
  capture results exist for Mire/Ember: rules `9d3c412e`, source `5750d1fe`, 151 live
  ticks matched. These results precede this correction and do not validate it.
- User supplied Tesla, Howitzer, Machine Gun and Plasma close-ups showing a narrow
  exposed peg over a visibly empty socket. Opened the existing native Machine Gun
  reference/game comparison and turn/gray strip; they show the same attachment issue.
  Previous coordinate-only contracts missed physical bearing contact.
- Prepared one visual iteration: seat the upper by its wide bearing rather than
  the insertion-peg end; hide the inserted peg behind the near lip; fill the socket with a
  stationary bearing and draw its near lip over the junction. The wide support
  overlaps the recoiling upper. Sizes, headings, platforms and combat are unchanged.
- Per-pose bearing coordinates are added to metadata/inline table and the bake.
  Atlas PNG pixels/layout are unchanged (no PNG diff); no asset cache rename needed.
  Existing shot origins use the adjusted upper pose automatically.
- Prepared, NOT RUN: `node tests/level4-seating.cjs`, updated `node tests/level4-tower-art.cjs`,
  `npm test`. Native seating check covers all 50 views at five recoil ages and must
  reject the exact uploaded bad renderer (`e4d136f`) plus a deliberately raised upper.
- Prepared actual-game comparison from the bad uploaded renderer, one branch at
  a time: `node tools/capture-organic-world.cjs --level4-seat machine-gun` (also
  rifle/tesla/prism/howitzer/cluster/plasma/cryojet). Output is separate from the
  original capture at `reports/generated/level4-seating/<branch>/`.
- Source before-evidence and review criteria: `reports/level4-seating.md`.
  No corrected game frames or browser evidence exist yet. Do not mark this fixed
  or visually verified. Next: user runs the prepared checks after upload,
  then inspect complete turn/attack/upgrade/sale cycles, whole and close views,
  grayscale hierarchy and disk-browser console. Letter badges are unchanged.

---
Previous checkpoint:

# Level 4 tower sprites — integration prepared, checks pending (2026-10-29)

- User selected Machine Gun C, Rifle C, Tesla C, Prism A, Howitzer A, Cluster A,
  Plasma C, Cryojet C; approved the second corrected sheet, then requested game
  integration and upload. Concept reference remains archived verbatim.
- Work isolated at `/private/tmp/hunger-level4-sprites`, branch `codex/level4-sprites`,
  baseline `2308926` from the existing Flamethrower work. Concurrent edits in the
  primary checkout are excluded. This branch includes the pre-existing Flamethrower
  integration/deployment/stream commits, whose checks were still pending.
- Atlas/provenance checkpoint saved in `3cfb29b`; integration saved in `2ccc072`.
  Both commits uploaded to `origin/codex/level4-sprites`. Prepared final `assets/hunger-level4-towers-v1.png` (2048 × 2048) and frame table:
  50 upper-assembly poses, six eight-direction families plus static Tesla/Cluster.
  Built with `tools/bake-level4-towers.cjs`; final atlas opened and inspected.
- Draw-side integration: branch selection, separate fixed foundations, common peg
  pivot, per-view muzzle, shot-driven recoil/charge/emitter animation, upgrade rise
  and sale retraction, pixel-free fallback and pinned shell launch points. Prism
  has a straight gold pulse for its existing single-target damage event.
- No intentional simulation/targeting/balance/PATH/GATE_D/platform edits; no restamp.
  Rules/source and actual live-tick parity are prepared checks, not confirmed results.
- Prepared, NOT RUN: `node tests/level4-tower-art.cjs`, `npm test`, and one branch at
  a time via `node tools/capture-organic-world.cjs --level4 machine-gun` (replace
  with rifle/tesla/prism/howitzer/cluster/plasma/cryojet). Capture baseline is 2308926;
  each invocation writes before/after whole, close, grayscale, turn, attack,
  upgrade/sale and complete 2.5-second cycle frames for Mire and Ember.
- No actual-game before/after frames or browser evidence exist for this integration.
  Do not claim visual verification. Eight-heading steps, source pose variation,
  mounting/muzzle annotations, rear emitter occlusion and Prism contrast remain
  explicit review risks. Disk-browser console and independent second review pending.
- Criteria, expected frame paths, exact commands and current limits:
  `assets/art/level4-towers-v1.md`. Next: user runs checks and supplies before/after game frames; resolve any findings
  one branch at a time before independent visual review and merge.

---
Previous checkpoint:

# Flamethrower follow-up — deployment and fire requested, checks pending (2026-10-29)

- User reported the missing deployment animation. This was an omission in the initial integration, not a verified visual success. Added registration in the shared observer and constant-scale assembly/reverse sale poses; first real jet ends the presentation build if needed. Static model baseline: `9ea29bb`.
- Deployment criteria: fixed foundation, vertical tanks emerging/spreading, head rising from the socket, nozzle telescoping, exact ready-pose handoff, reverse sale from partial progress. Modified only drawing/observer code; no combat or balance changes.
- Expanded existing building/salvage checks and prepared `node tools/capture-organic-world.cjs --flamethrower-deployment` (Mire/Ember, full assembly/retraction, whole colour/grayscale and zoom). None run. No deployment captures exist yet; visual completion is pending user output and frame inspection.
- Deployment saved separately in `71b5735`, initial hidden depth refined in `198ef68` so tanks/head start entirely behind the socket edge. Added an unrun regression for that boundary, with known-bad shallow starts. User additionally requested animated flame: implemented a second iteration with three flowing filled ribbons, six travelling tongues, fading tip/tail, branch colors and immediate visual stop on pause/sale. Uses simulation time and the same muzzle; no particle/simulation state or RNG. Effect life .23 s (visual only) bridges the unchanged .2 s firing interval.
- Prepared, NOT run: `tests/flamethrower-jet-art.cjs` (flow with fixed nozzle, origin, colors, fade/stop, render parity; frozen turbulence must fail). `node tools/capture-organic-world.cjs --flamethrower-fire` compares only the fire against `198ef68`: fixed-nozzle flow, full sweep, stopping, whole colour/grayscale and enlarged strips, all three branches on Mire/Ember. Expected paths `reports/generated/flamethrower/{before,after}-*-fire-*.png`; no captures exist yet. Controlled renderer scenes do not verify live combat timing.
- Next: user runs `npm test`, the deployment and fire capture commands separately, and disk-browser console/visual checks. Review each iteration separately for silhouette/camera, gaps, overlap pops, ready-pose handoff, muzzle attachment and grayscale enemy readability. No tests or visual acceptance claimed.

Previous integration state:

- Branch `codex/flamethrower-art`, baseline `58c1e8eeb350927ec16a2723eecb91171a71f718`. User approved the concept in this chat, then explicitly requested integration. Approval of the resulting gameplay appearance remains pending.
- Implementation saved in `7a57198`; no tests, gameplay captures or browser checks have been run for it.
- `assets/hunger-flamethrower-v1.png` (768×256 RGBA) + `.frames.json`: stationary foundation, overhead weapon head/nozzle, upright tank. Generated separation and approved concept remain in ignored `reports/generated/flamethrower/`; only the final atlas is committed. Reproduction: `tools/bake-flamethrower.cjs`; design/provenance and review criteria in `assets/art/flamethrower-v1.md`.
- Renderer: fixed 44×34 foundation, continuous projected upper yaw, two upright tanks sorted around the head; orange/cyan pilot; muzzle follows the drawn nozzle. Vector loading/failure fallback, no new runtime pixel reads. Existing flamer deployment/pause/sale behavior retained. No combat/balance/route/platform edits; simulation fingerprints are to be compared by the user-run capture, no restamp claimed or performed.
- Agent completed: generated/packed final atlas, opened and inspected that asset, reviewed source diff. This does NOT establish gameplay appearance or test success.
- Prepared, NOT run: `tests/flamethrower-art.cjs` (planted foundation, upright tanks, 64 yaw/muzzle samples, atlas mapping, render parity, pixel-free fallback; known-bad rotated foundation/old muzzle/missing atlas must fail the same checks). Full `npm test` includes it.
- Prepared, NOT run: `node tools/capture-organic-world.cjs --flamethrower` compares the baseline/current actual renderer on Mire/Ember, with whole colour/grayscale images, 17-sample complete turns and complete fire/Plasma/Cryojet sweeps, paused/branch/sale states, reference comparison and simulation fingerprint parity. Output paths are expectations, not existing evidence: `reports/generated/flamethrower/{before,after}-{mire,ember}-*.png`.
- Still unverified: all tests, real game scale/readability/camera, head/tank overlap and depth handoffs during turns, nozzle attachment throughout firing, complete sweep cycles, `file://` console and independent second review. No claim of visual completion.
- Next: user runs the three commands in `assets/art/flamethrower-v1.md`, supplies output/captures; inspect whole and enlarged before/after views and the full cycles, record actual findings, then fix any mismatch before PR/merge.

---
Previous checkpoint:

# Leech surfacing art — prototype v0.14 (2026-10-28)

- Branch `codex/leech-surfacing-art`, nothing committed yet. Presentation only: no change to `update`, `stepSimulation`, targeting, `LEECH_OOZE` or `BUILD_WARMUP_SECONDS`; no function in `replaySourceFingerprint` was edited. Export tag `prototype-v0.14` (accepted on import; `tests/overlapping-waves.cjs` pin moved).
- Bake: `tools/bake-leech-surfacing.cjs` -> `assets/hunger-leech-surfacing-v1.webp` (2304x512, 9x2 cells of 256) + `.frames.json`. Sources stay separate in `assets/art/studies/` (emergence 8 frames, wound-closing 4). Matte and drawn shadows via the Polyp `removeMatte` at shadow chroma 24. The emergence sheet is not 8 equal cells: frames cut at empty columns, the 7|8 join (frame 7's head touches frame 8's wound) at the emptiest column of 1700-1950. Each cell anchored at its wound centre, measured once on the sheet (constants in the tool). Row 0: frames 1-8 + col 8 = frame 8's wound alone (ellipse mask); row 1: wound 1-4. Not packed into `hunger-leech-mire-v1`: its packer (`bake-creature-crawl`) has no multi-clip support (the Polyp packer does, but the Leech atlas is not made by it), and changing that atlas would require a `-v2` rename.
- Game (`LEECH_SURFACING` next to `groundActorMetrics`): ground layer `drawLeechGround()` inside `terrain()` between the living surface and the platform layer — wound decals, under-skin loop (frames 1-2, 0.35 s each, last 0.15 s dissolving, mirrored for leftward hunts, ground-plane turn clamped to ±0.5 rad), surfacing frames 1-2. Frames 3-8 on the unit layer (`drawLeechEmergence`). Frame = floor(elapsed of e.surfaceT / 1.65 * 8). Hand-off to crawl: presentation offset (14.1, 8.2)·k in `visualEnemy`, mirrored, fading over 30 units of crawl (sim point untouched). Wound decal from `observeLeechSurfacing()` (draw-side observer): spawned when surfacing ends with the body alive, at the surfacing point, timed by S.time; 0.4 s dissolve from frame 8's wound, 2.0/0.8/2.2/2.0 s with 0.5 s dissolves inside each segment's end, 1.0 s fade; removed at 8.0 s. Collateral darkening exists because under-skin damage exists (`oozeCollateral`).
- Interpretations to confirm: the 0.4 s start dissolve lies inside wound frame 1's 2.0 s (total life 8.0 s); a surfacing cut short by selling the generator also leaves a wound; a Leech killed during surfacing leaves none; the clip only topples right/left — up/down hunts change pose at the 8 -> crawl hand-off (position still continuous); full rotation of the under-skin bulge to the heading was clamped (one camera for the map).
- Tests written, NOT run by the agent (project rule): `tests/leech-surfacing-art.cjs` (layers per stage on slots 7/2/12, one decal and its removal at 8.0 s, hand-offs right+left with no-offset known-bad, 8 -> wound size/position and no see-through dip, collateral darkening on sim time, known-bad ground layer after platforms); `tests/slow/leech-surfacing-bake.cjs` via new `npm run test:slow`. Agent ran only the bake and a smoke hunt: all eight frames ~12-13 ticks each, one wound at the crawl start, centre shift at hand-off <= 3.3 px on slots 7/2/12.
- User-run (2026-10-28): `tests/leech-surfacing-art.cjs` PASS (after two fixes in the test itself: slot placeholder, frame-8-only silhouette), `npm test` all passed, `npm run test:slow` all passed, capture written.
- Agent review of user-run frames (`reports/generated/leech-surfacing/`, generator moved to slot 12 — slot 7 surfaced under the HUD): `after-surfacing-game.png` frames 1-8 stay on one wound point; 8 -> crawl keeps head and length, but the crawl atlas is darker/browner than the emergence sheet, so the body visibly changes colour at the hand-off (source-art mismatch, not position). `after-wound-game.png`: 8 -> wound frame 1 no size jump; heals in place; the pale scar (frames 3-4) is a bright pink disk that in greyscale is lighter than the Leech itself — possible conflict with the rule that enemies are the most contrasting element. `before/after-pad-game.png`: before = ripple drawn on the slab; after = bulge hidden under the slab, visible beside it; in front of the wall hidden in both (correct occlusion by the wall). `after-under-game.png` was captured too early (clipped by the map edge); capture moved to ~8 s into the hunt, recapture pending.
- Scar toned down at the user's request (2026-10-28): `LEECH_SURFACING.woundTone` per wound frame [opacity, darkening] = [.62,.25] [.6,.28] [.55,.32] [.42,.38], blended by the frames' shares; frame 8's own wound starts untoned so the hand-off does not flicker. Agent-measured greyscale contrast (mean |Δlum| of the pixels each element changes): crawling Leech 33-38; decal before toning 49-65 over its life (scar worst), after 11-25 (<= 0.68x the Leech) in mire and ember on slots 3/12/13. New relational check in `tests/leech-surfacing-art.cjs` (<= 0.85x the Leech, > 8 visible; known bad untoned must exceed); dissolve-dip check made relative to the toned frame. Test not yet re-run by the user.
- User-run after toning: `tests/leech-surfacing-art.cjs` PASS (after a test fix: a new scene must call the observer before waiting for its own decal), capture rewritten. Agent review: `after-wound-game.png` — hand-off frames 0-0.4 s continuous; from 2.0 s the toned wound reads as a muted reddish patch, the scar (5.0-7.5 s) is barely visible in colour and almost gone in greyscale — no longer competes with the Leech, possibly over-damped (woundTone is the knob). User verdict 2026-10-28: keep the scar toning as is. `after-under-game.png` (mid-field now) — bulge loop readable in colour; in greyscale a light textured mound, distinguishable from the ground but lower contrast than the crawling body; no pops between loop frames visible in six samples.
- User-run on f87bbe8 (PR #68): full `npm test` all passed. Agent-run: `prototype-regression` 30/0.
- Not verified: `file://` browser console check; second independent review of frames; leftward hunt frames (covered only numerically by the test — no map generator gives a leftward surfacing).
- Known: frame 7 keeps a pale painted ground highlight under the arch; frame 8 keeps some warm shadow under the worm (not grey, so the matte pass keeps it).

---
Previous checkpoint:

# Follow-up on PR #67: Polyp gait de-sync and lateral flow-around (2026-10-28)

- Presentation only, same branch. Polyp/Polypoid gait phase and tempo (0.9-1.1x cycle length) from replayHash(wave:seq) passed through a murmur3 finalizer: raw FNV of `6:0`/`6:1` differs only by the FNV prime, which put neighbouring phases 0.006 apart (measured 30% differing frames; 0 lockstep pairs of 60 after the fix).
- `laneOffset(e)`: Carapacid, Polyp and Leech on the lane are drawn on the centre line; small ground bodies inside a large body's footprint (`LANE_LARGE_BODY` along/across, lane units) are pushed out on their own hash side with a smooth falloff, capped at LANE_HALF_VISUAL - r/2; air bodies and sheltering Foragers are not pushed. Portal entry uses the same offset. Depth sort is unchanged (it already used the drawn foot y).
- Verified by the agent: `npm test` all passed incl. new `tests/lane-flow-stagger.cjs` (fails on the pre-fix hash and on no-push); fingerprints 9d3c412e / 5750d1fe at baseline; restamp dry run 0. Crowd frames (2 Polyps + 18 Foragers): `reports/generated/polyp-family/{before,after}-crowd-*`.
- Known limitation: Foragers pushed to the far side are drawn behind the ~40 px tall Polyp and are mostly hidden by it; the lane is narrower than the Polyp sprite, so there is no room to clear it fully.
- Still not verified: `file://` browser console check; independent second review of the frames.

---
Previous checkpoint:

# Polyp family atlases integrated — prototype v0.13 (2026-10-28)

- Branch `codex/polyp-family-atlases`. Presentation only. `tools/bake-polyp-family.cjs` (sibling of the crawl bake for one-row, variable-frame sheets on grey matte) bakes `assets/hunger-{polyp,polypoid,zygote}-v1.webp` + `.frames.json`: border flood by colour distance with a soft unblended edge, boundary-connected desaturated-darker shadow removal, enclosed matte pockets >=600 px, one scale + ground anchor (128,208) per family, left = mirrored right, lossless WebP via `encode-creature-atlas.py`.
- Documented exceptions (tool + frame table): death clip resized once x0.7725 so its frame 1 matches crawl frame 1 (the source draws it 1.29x wider); burst frames 2-3 use smaller shadow-inclusive pockets and shadow chroma 10; zygote frame 5 anchored on the juvenile, not the husk.
- Game: atlas draw for Polyp (distance-driven, loop frames 1-5, 1.75 s at base speed, 48 px), Polypoid (0.5 s, 34 px), zygote (14 px at rest, pulse 1±0.05 with rising rate; frames 2-5 over the last 0.15 s, growing to Polypoid scale); death = frozen 3-frame snapshot over 0.3 s at the drawn death point, generic Polyp death ring hidden; no code shadow. Vector bodies remain the fallback without atlases. Replay exports tagged prototype-v0.13 (validator accepts it; test updated).
- Verified by the agent (user asked for these checks): `npm test` all passed incl. new `tests/polyp-family-art.cjs`; rules 9d3c412e / source 5750d1fe equal `reports/carapacid-shelter/simulation-baseline.json`; `tools/restamp-replays.cjs` dry run: 0 to re-stamp. Frames from `node tools/capture-polyp-family.cjs` -> `reports/generated/polyp-family/{before,after}-*` (colour + greyscale), reviewed by the agent.
- Known defects: small notch in the lavender lobe and faint grey traces under two lobes in burst frame 3; tiny dark contact dots under some Polypoid feet (down row); hatch->Polypoid hand-over shifts sideways ~7 lane units (zygote side offset vs Polypoid lane stagger) and the husk vanishes; zygotes are visible under the 0.3 s burst; the map has no leftward lane, so the left crawl was captured with a forced heading.
- Not verified: game opened from disk (`file://`) in a real browser with a console check; independent second review of the frames (required before merge).
- Next: user review of frames, browser check from disk, second-look review, PR.

---
Previous checkpoint:

# Polyp family — eight selected source sheets archived (2026-10-28)

- User explicitly requested eight named PNGs in `assets/art/sources/`. Copied the latest selected versions byte-for-byte; PNG headers/dimensions read and destination SHA-256 matched each source. No resizing, repainting, slicing, background removal or runtime integration.
- Set contains 8 sheets / 46 illustrated frames: 3 parent crawl directions, parent death, zygote hatch, 3 juvenile run directions. Early radial living-crawl concept and superseded image versions excluded.
- Archival copy integrity confirmed only. All previously documented artistic, animation, game-camera/readability and runtime limitations remain; copying does not validate them. No tests/browser checks/game captures run. No simulation change or replay restamp required.
- Unrelated modified `assets/art/previews/organic-world-mire-v7.webp` remains untouched.
- Latest user message ends with `затем:` and contains no subsequent instruction. Save request is complete; await the missing continuation. Do not infer conversion, integration, publishing or other next steps.

## Saved files and provenance

| Destination in assets/art/sources | Source in reports/generated | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `polyp-crawl-right-v1.png` | `polyp-directional-crawl/sheet-v1.png` | 2172×724 | `748bb0fd6cd471eac7c1d9a526ecdba1ea6ea2fa8ffc0380dab824cefcb61299` |
| `polyp-crawl-up-v1.png` | `polyp-away-crawl/sheet-v1.png` | 2172×724 | `acdb868139a4400dc5e8201df540c2f276fb4ca1c42513b165ad7ad528e5bb56` |
| `polyp-crawl-down-v1.png` | `polyp-toward-crawl/sheet-v1.png` | 2172×724 | `b5d70011218cca15e2d15852ce4370a75ef4f5acb70f307e9eeaf5397523f003` |
| `polyp-death-v1.png` | `polyp-death/sheet-v2.png` | 2172×724 | `d32a01869090da57415222b7de4ddf4b9e2810f79152572ab9adeafda7bea448` |
| `zygote-hatch-v1.png` | `zygote-emergence/sheet-v2.png` | 2172×724 | `13532b17c53b2b7e7ecb7c39ab221de561b45dff303ec5db1c767d0a9471ca20` |
| `polypoid-run-right-v1.png` | `polypoid-run-right/sheet-v3.png` | 2172×724 | `37658fd1b3e35010dfa9f368119c3238048675df1ae2ce9298ef3e40b7d08039` |
| `polypoid-run-up-v1.png` | `polypoid-run-away/sheet-v2.png` | 2172×724 | `50134a49db2d34efcce40aa9664bfd9cb8fb3f8cd7ecc45bab666e5142e3c1f6` |
| `polypoid-run-down-v1.png` | `polypoid-run-toward/sheet-v3.png` | 2172×724 | `315fa2d5240df4a539bf43ec563717a3e9f8c999a34fb1f1881d9b2220a2eeff` |

---
Previous checkpoint:

# Polyp — five-frame death/disassembly sheet prepared (2026-10-28)

- Latest request: exact rest/material reference + exact open-pose reference as FRAME3. Five stages: limp seam flash → strand/seam rupture → radial opening of six lobes/carrier collapse → six curled live pieces fall → six separate zygote-like ragged glowing-seam chunks at unequal distances around dark dead carrier. Elevated three-quarter camera, same scale/overhead light, grey/no labels, no eggs/blood/metal/body parts. Radial opening explicitly belongs to DEATH; remains forbidden for living crawl.
- Selected output: `reports/generated/polyp-death/sheet-v2.png`; v1/two refs archived beside it. Built-in image_gen two passes: full sequence, then curl/scatter4–5. Exact prompts/limits: `assets/art/references/enemies/polyp/polyp-death-sheet-v1.md`.
- Tool-output illustration shows five scenes, first bright seam network, reference-corresponding third open composition, six detached live seam-lit chunks plus one dark flat central carrier in4–5. Final positions have different offsets/distances but preserve broad lobe ordering; irregular-scatter and zygote-likeness still require user judgment. User acceptance pending.
- No pixel-exact reference copy or verified camera/light/scale/phase continuity. No tests/browser/game captures/50 px/grayscale/runtime spawning or animation verification run. No runtime/simulation/balance changes. Prior mesh-rig candidate still awaits user rerun.
- Heavy draft PNGs ignored; small prompt/checkpoint tracked. Preserve prior heading/zygote sheets and unrelated organic-world-mire-v7.webp modification.
- Next: user reviews death stages, especially frame3/reference, six living zygote counts vs one dead carrier, curled/ragged form and irregular scatter. Later integration needs actual-game captures, complete timed animation, camera/grayscale/readability and independent visual review.

---
Previous checkpoint:

# Polypoid — toward-viewer run sheet prepared (2026-10-28)

- Latest request: FRONT+ABOVE, run toward viewer/DOWN, six poses. Both required in EACH: raised arm closer/larger tip overhanging front rim, never away; long/large near catching arms vs short/small far pushing arms. Flat disk leans viewerward, six jointless/no-hook tentacles, changed heights/arm curves in adjacent phases. Same elevated camera/scale/overhead light, grey/no labels.
- Selected output: `reports/generated/polypoid-run-toward/sheet-v3.png`; v1/v2/input archived beside it. Built-in image_gen three passes: direction, raised foreground placement, add missing sixth support. Exact prompts/limits: `assets/art/references/enemies/polyp/polypoid-run-toward-sheet-v1.md`.
- Final tool-output illustration: two small far arms + three large near supports + one raised foreground arm in each pose; all raised tips closer/lower/overhanging, no rear antenna; low/high clearance and stance changes. Same pale disk/seam/material, no faces evident. User acceptance pending; soft curled tip/no-hook interpretation and speed/asynchrony remain artistic review items.
- No tests/browser/game captures/thumbnail/grayscale/registered full-loop/contact checks run. Static sheet does not establish smooth run/no sliding or exact camera/light/scale/identity. No runtime/simulation/balance changes. Previous mesh-rig candidate still awaits user rerun.
- Heavy PNGs ignored, small notes/checkpoint tracked. Older headings and unrelated organic-world-mire-v7.webp modification preserved.
- Next: user reviews both direction cues/anatomy/running-readability. Later integration needs actual-game before/after captures, full cycle/contact, camera/grayscale/scale/readability checks and independent visual review.

---
Previous checkpoint:

# Polypoid — away-running perspective revision v2 prepared (2026-10-28)

- Latest user clarification: BEHIND+ABOVE, flee UP. BOTH cues mandatory each pose: raised arm bows away with far tip partly self-occluded, NEVER back at viewer; far/up arms visibly short/small vs near/down pushing arms. Same scale/camera, six smooth tentacles, flat disk, overhead material/light, no labels. Adjacent poses need varied all-arm positions/height and away-leaning disk.
- Output version: `reports/generated/polypoid-run-away/sheet-v2.png`; v1 preserved. New reference archived beside it. Built-in image_gen three passes: depth cues, anatomy, targeted residual-stub cleanup. Exact prompts/limits: `assets/art/references/enemies/polyp/polypoid-run-away-sheet-v2.md`.
- Final tool-output illustration shows one upper raised arm + two small far arms + three larger near arms in each pose; extra underside stubs from earlier passes removed visually. Stronger near/far size cue; small far tip partly obscured behind raised shaft, no exposed C-shaped curl; low/high disk changes and arm winding differences. User acceptance pending; speed/asynchrony and forward-away perception still review items, some high poses similar.
- No tests/browser/game captures/50 px/grayscale/registered loop/contact checks run. Static painting does not establish exact perspective/anatomical identity or full motion behavior. No runtime/simulation/balance changes. Previous mesh-rig candidate still awaits user rerun.
- Heavy PNG ignored; small notes/checkpoint tracked. Preserve older heading sheets, v1 and unrelated organic-world-mire-v7.webp modification.
- Next: user reviews both mandatory direction cues in this version and running-readability. Later integration requires actual-game captures, complete cycle/contact, camera/grayscale/scale/readability checks and independent visual review.

---
Previous checkpoint:

# Polypoid — away-from-camera run sheet prepared (2026-10-28)

- Latest user request: attached rightward runner as appearance/cycle reference, same six-frame row but running AWAY / SCREEN UP. Flat disk, six smooth jointless tentacles/one raised bending into depth, asynchronous scurry/bounce, far front reaches top/near rear below. Fixed elevated three-quarter camera/scale, overhead light, grey/no labels, no hooks.
- Output: `reports/generated/polypoid-run-away/sheet-v1.png`; input archived beside it. Built-in image_gen one pass. Exact prompt/limits: `assets/art/references/enemies/polyp/polypoid-run-away-sheet-v1.md`.
- Illustration visible in tool output: six poses, flat pale disk/seam, upper/far raised appendage, near/lower rear supports, low/high clearance and changing soft arm windings. Exact six-path tracing near foreshortened roots, away-heading/raised-arm forward bend and surface smoothness remain user review items. User acceptance pending.
- Static sheet does not prove running speed/asynchronous timing, no sliding/loop, strict scale/camera/light or game readability. No tests/browser/game captures/thumbnail/grayscale/continuous-cycle checks run. No runtime/simulation/balance changes.
- Heavy PNG ignored, small prompts/checkpoint tracked. Rightward run and older sheets preserved; previous mesh-rig candidate still awaits user rerun. Unrelated organic-world-mire-v7.webp modification untouched.
- Next: user reviews away-heading run sheet and provides specific feedback. Later game integration requires actual-game before/after captures, full cycle, camera/grayscale/readability checks and independent visual review.

---
Previous checkpoint:

# Polypoid — rightward running sheet prepared (2026-10-28)

- Latest user request: exact pale juvenile reference, six-frame one-row RUN to RIGHT, fast/nervous/asynchronous smooth jointless arms, disk bounces/rocks, raised arm bends forward. Exactly six tentacles, flat disk/ragged pink seam, same elevated three-quarter camera/scale/overhead light, grey/no text, no spider/crab/joints/hooks/faces/blood/metal.
- Selected output: `reports/generated/polypoid-run-right/sheet-v3.png`; source and v1/v2 archived beside it. Built-in image_gen three passes: run poses, far-arm exposure, then count correction only in2/5. Exact prompts/limits: `assets/art/references/enemies/polyp/polypoid-run-right-sheet-v1.md`.
- Visible tool-output illustration: six full unlabelled poses, flat pale disks, low/high clearances and varied support/recovery curves, raised arms oriented right, no source discarded skin. Final count intended as five locomotor arms plus raised sixth; foreshortened far roots/tips and soft curled tip interpretation still need human review. User acceptance pending.
- Static sheet does not prove running speed, nervous asynchronous timing, no sliding, registered cycle/loop, strict camera/scale/light or game readability. No tests/browser/game captures/thumbnail/grayscale/full-cycle checks run. No runtime/simulation/balance changes.
- Heavy draft PNGs ignored; small prompt/checkpoint tracked. Existing parent/zygote sheets preserved; previous mesh-rig candidate still awaits user rerun. Unrelated organic-world-mire-v7.webp modification untouched.
- Next: user reviews running sheet. Apply specific feedback; later runtime integration requires actual-game before/after captures, complete motion cycle, camera/grayscale/readability checks and second visual review.

---
Previous checkpoint:

# Zygote — five-frame emergence sheet prepared (2026-10-28)

- Latest user request: use attached parent sheet as MATERIAL ONLY. Draw five frames of torn living zygote fragment: rest/glowing seam → tense swelling/coiled body under skin → seam rupture/first tentacles → pale translucent flat disk raised over opened skin on six jointless arching tentacles (one raised) → free juvenile beside empty collapsed skin. One row, same elevated three-quarter camera/scale, overhead light, light grey, no labels. No egg/capsule/shell, faces/eyes/teeth/body parts/claws/hooks/pincers/blood/glass/metal.
- Output: `reports/generated/zygote-emergence/sheet-v2.png`. Input and v1 retained beside it. Built-in image_gen, two passes; second only requested removal of skin/left-tip contact in frame5. Exact prompts/criteria and limitations: `assets/art/references/enemies/polyp/zygote-emergence-sheet-v1.md`.
- Generated illustration shows five stages, raw irregular violet chunk/pink seam glow, swollen under-skin folds, rupture, lighter disk lifted on arching smooth tentacles, raised appendage. Final frame visibly separates empty skin from juvenile with grey ground. Five supports plus one raised tentacle depicted in4–5; occluded small-scale count and soft-tip interpretation still subject to review. User acceptance pending.
- Exact source-material likeness, strict light/camera/scale, physical fist-size, frame registration and smooth motion not measured. No tests/browser/game captures/thumbnail/grayscale/full-loop checks run. Static concept not runtime verification.
- Heavy draft images ignored; small prompt/checkpoint tracked. No runtime/simulation/balance changes. Parent directional sheets and unrelated organic-world-mire-v7.webp modification preserved. Previous contact-rig widening candidate still awaits user rerun.
- Next: user reviews emergence sheet. Apply specific feedback. Later game integration still requires actual-game before/after captures, camera/readability/grayscale/full-cycle evidence and second visual review.

---
Previous checkpoint:

# Polyp — toward-camera crawl sheet prepared (2026-10-28)

- Latest user request: six frames in ONE horizontal row, same supplied appearance and flowing cycle, now TOWARD CAMERA / DOWN SCREEN; far rear stays upper screen. Fixed elevated three-quarter camera, strictly overhead light, constant scale, light grey, no text. Radial flower/explosion remains prohibited.
- Output: `reports/generated/polyp-toward-crawl/sheet-v1.png`; supplied input archived beside it. Built-in image_gen one pass. Exact prompt/limits: `assets/art/references/enemies/polyp/toward-crawl-sheet-v1.md`.
- Tool-output illustration: six complete poses, near/lower pseudopod reach in 2–3, stretched leading flesh/seams in 3, far/upper trailing tissue in 4, compact 5–6. Recognizable palette/parts, no radial open hub. User acceptance pending.
- Straight down-screen readability (some lateral asymmetry), precise overhead illumination, fixed scale/camera, hidden six-lobe identity/count, <=1.5 envelope and registered displacement remain unverified/review items. No tests/browser/game captures/thumbnail/grayscale/continuous-cycle checks run. Static illustration does not prove runtime motion.
- Draft heavy PNG ignored; small checkpoint/prompt tracked. No runtime/simulation/balance changes; prior contact-rig candidate still awaits user rerun. Preserve away/rightward sheets and unrelated organic-world-mire-v7.webp modification.
- Next: user reviews toward-camera variant; apply specific feedback. Later integration still requires actual-game before/after captures, camera/grayscale/readability/full-loop evidence and second visual review.

---
Previous checkpoint:

# Polyp — away-from-camera crawl sheet prepared (2026-10-28)

- Latest user request: same six-phase sheet and creature, now crawls AWAY into depth toward SCREEN UP. Layout remains six frames in ONE horizontal row. Same elevated three-quarter camera/scale, strictly overhead light, light grey, no text; no radial spreading.
- Output: `reports/generated/polyp-away-crawl/sheet-v1.png`; input archived alongside. Built-in image_gen, one pass from user-attached rightward cycle. Exact prompt and limits: `assets/art/references/enemies/polyp/away-crawl-sheet-v1.md`.
- Generated illustration shows upward leading reach in 2–3, stretched lengthwise body, lower-screen trailing tissue in 4 and compact 5–6. Six complete poses, recognizable pink seams/blue sac/folds/amber pieces, no radial flower hub. User acceptance pending.
- Strict overhead illumination, camera/scale consistency, hidden six-lobe identity, <=1.5 envelope and registered displacement remain review/unmeasured items. No tests/browser/game captures/50 px/grayscale/continuous animation checks run. No claim of game readiness or verified motion.
- Heavy draft PNG ignored; small notes/checkpoint tracked. No runtime/simulation/balance changes; prior rig correction still awaiting user rerun. Unrelated organic-world-mire-v7.webp untouched.
- Next: user reviews away-heading sheet; follow specific feedback. Preserve heading distinction and overhead light. Runtime integration later still needs game captures, full-cycle/camera/grayscale/readability evidence and independent visual review.

---
Previous checkpoint:

# Polyp — directional amoeba crawl sheet prepared (2026-10-28)

- Latest direct request: six painted frames, ONE row, creature flows RIGHT via pseudopod planting and whole-body pull. Front/rear always asymmetric; radial flower/explosion is explicitly prohibited for living motion (user says it signifies death). This overrides the prior open radial colony sheet for living crawl. Keep older artifact as history only, not accepted locomotion.
- Output: `reports/generated/polyp-directional-crawl/sheet-v1.png`; supplied reference archived beside it. Built-in image_gen, one pass using only the latest appearance reference. Exact prompt and criterion-by-criterion limits: `assets/art/references/enemies/polyp/directional-crawl-sheet-v1.md`.
- Visible illustration: six unlabelled poses on grey, recognizable flesh/seams/sac/amber fragments, rightward reach in 2–3, lengthwise stretched flesh in 3, rightward mass transfer and rear trailing in 4, gathered 5–6; no radial open hub. User acceptance pending.
- Exact <=1.5 envelope, 50 px-high whole-sheet silhouette readability, occluded six-lobe identity/count, shared anchor registration and smooth-cycle continuity remain unverified. No tests/browser/game captures run. Static drawing does not establish runtime behavior.
- Source PNG stays ignored as an unapproved heavy concept. Small prompt/checkpoint files tracked. No runtime/simulation/balance changes. Prior rig revision still awaits user rerun; no new PASS claim. Unrelated organic-world-mire-v7.webp untouched.
- Next: user reviews directional sheet and supplies specific feedback/acceptance. If integrated later, follow actual-game before/after captures, camera/grayscale/50 px/full-cycle checks and second visual review. Do not reintroduce radial flower spreading as a living crawl.

---
Previous checkpoint:

# Polyp — painted six-frame colony crawl sheet prepared (2026-10-28)

- Latest direct request: draw a horizontal six-frame sheet using supplied appearance and spreading-silhouette references. Persistent six heterogeneous lobes, pink seams, amber organic shell; colony spreads and gathers, no walking, same camera/light/scale, <=1.5 resting envelope, light grey background, no text. This turn produces that image, not a further mesh-rig patch.
- Output: `reports/generated/polyp-six-frame-colony/sheet-v4.png`. Inputs archived in that folder. Built-in image_gen, four sequential passes; final shorter-bridge revision keeps six clearly separated masses in fourth pose, earlier passes had excessive central mound/spread. Exact prompts and limitations in `assets/art/references/enemies/polyp/six-frame-colony-sheet-v1.md`.
- Sheet visible in image-tool output: six poses in one row, grey background, no text, compact/spread/gather shapes, recognizable pink seams/blue sac/amber plates. This is illustration review only. Exact size cap, occluded lobe count/identity, exact source likeness, animation continuity and user acceptance remain unconfirmed. No tests, browser checks or game captures run.
- Keep heavy draft image ignored, small prompt/decision notes tracked. No runtime/simulation/balance changes. Prior contact-support candidate remains awaiting user check; do not carry older PASS results over to it. Unrelated modified organic-world-mire-v7.webp preserved.
- Next: user reviews this sheet. Apply specific feedback; approval of older art does not automatically approve this sheet. Actual game integration, if later requested, still requires actual game captures, camera/readability/grayscale/full motion cycle evidence and second visual review.

---
Previous checkpoint:

# Polyp — contact-transition collapse revision, awaiting user rerun (2026-10-28)

- User ran syntax and motion checks on commit `840f458`: viewer syntax returned no error; continuity, planted contacts/rendered vertices, local proportions and rigid plate distances reported PASS. Mesh check FAILED at phase 12/120, triangle 5445, area ratio 0.0056545352650638515 against unchanged >0.02 criterion. Later negative controls were not reached.
- Source diagnosis: short contact-support falloffs (.075–.110 UV) concentrate the tip correction gradient. Prepared wider .180 supports for all four tips, keeping gait, travel, lift, tissue fields and plate transforms unchanged. This is a candidate correction, not a verified fix; interactions near rigid plates and between supports still need the full sweep.
- Observable criterion: tissue remains continuous without collapsed/inverted patches across the whole loop; planted tips stay anchored and plates stay rigid. Existing full-cycle threshold is unchanged. Added explicit regression at the reported triangle/phase with the old four radii as a known-bad negative control.
- Preserved prior standalone preview at `reports/generated/polyp-continuous-motion/review-before-contact-support.html`; regenerated `review.html` with revised rig. These are preview artifacts, NOT actual-game before/after captures.
- Agent did not run tests, browser checks or captures. Prior PASS results belong to the old rig only; revised checks and visual comparison remain pending. No runtime/simulation/path/balance change. Unrelated `assets/art/previews/organic-world-mire-v7.webp` remains untouched.

## Next step — user runs from repository root

```sh
node tools/check-polyp-motion.cjs
open reports/generated/polyp-continuous-motion/review.html
```

Reload an already-open preview to load the embedded revised rig. Inspect full cycles with the mesh enabled, including phase 0.10, at large and 50 px scale. Watch for displaced seams, rigid-plate transitions and contact sliding. Return the complete checker output and any visible defects. Actual-game captures/readability/perspective verification remain a later integration requirement.

---
Previous checkpoint:

# Polyp — continuous-motion preview prepared, user checks pending (2026-10-28)

## Current work

- User authorized continuous animation after accepting the still and six-phase motion direction, then asked to continue. Built a separate single-view mesh-deformation study; game code untouched.
- Output: `reports/generated/polyp-continuous-motion/review.html`. Source cutout `cutout-v1.png` was generated with built-in image_gen from the accepted image, inspected as a large still and found to have alpha; subtle painted detail changes remain possible. Draft raster/HTML are ignored.
- Implementation: `tools/polyp-motion-rig.cjs`, `tools/polyp-motion-viewer.js`, `tools/build-polyp-motion-preview.cjs`. Local tissue fields, two rigid plate patches, four staggered contacts, provisional 5.2 s loop. Contacts lie on actual mesh vertices. Body uses one texture, no cross-faded keyframe slideshow. Neutral ground scroll reveals traction; pause/scrub/speed, original pose, mesh, contacts, grayscale and 50 px view included.
- Builder executed successfully to create the HTML. NO math tests, browser checks, screenshots or game captures run by the agent. User-run agreement remains in force. No claim of verified smoothness, no slipping or game readiness.
- Check script: `tools/check-polyp-motion.cjs`; covers loop position/velocity, stance world points, rendered anchors, rigid patch distances, local proportion changes and sampled mesh foldovers. Negative controls must catch whole-body breathing, slipping static art and six-pose stepping.
- Known limits: single-mesh deformation cannot invent hidden/new anatomy; source may drift from accepted paint; actual contact placement, rubber-like distortion, runtime readability/camera and performance unverified. Final multi-direction atlas layout still not agreed. No simulation/restamp needed.
- Notes and exact source-extraction prompt: `assets/art/references/enemies/polyp/continuous-motion-v1.md`. Preserve pre-existing modified `assets/art/previews/organic-world-mire-v7.webp`.

## Next step — user verification

From repository root:

```sh
node --check tools/polyp-motion-viewer.js
node tools/check-polyp-motion.cjs
open reports/generated/polyp-continuous-motion/review.html
```

User watches complete cycles and reports output/errors or visual defects. Analyze and fix without weakening criteria. Rebuild with `node tools/build-polyp-motion-preview.cjs` after edits. Only after motion acceptance and source agreement proceed toward final sprites/actual game integration, with the required real before/after game captures, camera/grayscale checks and independent review.

---
Previous checkpoint (accepted artistic direction; implementation remains separate):

# Polyp — revised silhouette and motion concept ACCEPTED (2026-10-27)

## Latest direct request and progress

- User explicitly replied `принимаю` to the revised silhouette and six-keyframe motion study. ARTISTIC DIRECTION ACCEPTED. Do not ask to approve these same images again; this does not certify smooth/runtime animation.
- Durable lossless accepted references now tracked: `assets/art/references/enemies/polyp/polyp-shape-approved-v1.webp` and `polyp-motion-approved-v1.webp`. Source provenance/hashes: `approved-v1.json`. No resizing or artistic changes during archival conversion.

- User resumed work after stopping, explicitly approved the attached heterogeneous Polyp/Polypoid concept (`тут прекрасно все`) and requested a small shift toward the attached silhouette sheet plus continuously changing shape while moving: protrusions emerge, body stretches. Use the attached mixed-part image as the approved source; do not replace it with another concurrent six-identical-lobe concept. A is the previously selected silhouette guide.
- Source and shape reference preserved in ignored `reports/generated/polyp-approved-shape-motion/{approved-before.png,silhouette-reference.png}`. New still: `shape-after-v1.png`. Modest contour change: projecting upper ribbed section, wider front fold/extension, stronger irregular outline. Material, recognizable parts, thick seams and juvenile appearance retained visually. New still and motion direction accepted by user.
- New six-phase motion concept: `motion-keyframes-v1.png`; `review.html` shows before/after, full sheet and a stepped/playable storyboard. This is NOT smooth animation or game implementation. Steps: compact → front extension → stretch → gather → opposite-side extension → recover. Exact prompts/criteria/inspection: `assets/art/references/enemies/polyp/approved-shape-motion.md`.
- Inspected generated full sheets. Body-envelope changes and different extension origins are visible. Pending: registration, interpolated continuity, exact 06→01 match, stable ground contacts, apparent extra sac during stretch, actual 40–50 px/grayscale/camera checks. No tests, game captures or browser game verification run. The player itself has not been browser-verified.
- Intermediate shape checkpoint `1cc488b`. No runtime, simulation, collision, PATH/GATE_D or balance change. Pre-existing modified `assets/art/previews/organic-world-mire-v7.webp` preserved. Heavy drafts remain ignored.

## Next step

- Next production stage: prepare continuous deformation/animation using the accepted body parts and motion direction; local extension/retraction rhythms should overlap, not just whole-body bob/scale. Preserve approximate mass and rigid shell fragments, ensure planted contacts do not slide. Agree atlas direction/frame/cell layout before sprite production under the original brief. No animation or runtime change was made in this approval-recording turn.
- User performs real-game capture/testing under AGENTS.md. Concept approval does not establish runtime readability or a complete animation cycle. Keep intermediate saves.

---
Earlier checkpoint (historical; latest direct request above governs):

# Polyp — latest four corrections, amorphous protrusions (2026-10-27)

- Latest direct user feedback accepts palette/material, pale seams, Carapacid inclusions, radial flat pale juvenile and grayscale contrast ON THE PREVIOUS CONCEPT. Requests: six distinct body parts at 50 px; parent protrusions must extend/retract from DIFFERENT body locations, not fixed tentacles; visible torn juvenile seam; identifiable detached Zygote.
- Reused previously saved `reports/generated/polyp-feedback/02-six-lobes.png` as six-part baseline. This prior work was inspected, not newly generated in this turn. New sequential image_gen passes in `reports/generated/polyp-amorphous-feedback/`: `01-parent-protrusions.png`, `02-juvenile-seam.png`, `03-three-forms.png`.
- Large-image inspection: six broad parent regions, greatly reduced fixed thin fringe with two broad continuous protrusions; juvenile pink ragged flap is visible; zygote is a detached kidney-shaped blue-violet body part with a matching torn pale fringe. Six-part 50 px readability and new grayscale have NOT been confirmed; prior user approval does not transfer automatically. Concept sheet relative zygote size is illustrative, not an exact runtime scale proof.
- Remaining current step: six-phase concept storyboard demonstrating protrusion extension/retraction at different locations. Static reference phases are not an actual animation or game validation. No code, tests, game captures or browser game checks.
- Exact prompts: `assets/art/references/enemies/polyp/amorphous-feedback-prompts.md`. Preserve pre-existing modified `assets/art/previews/organic-world-mire-v7.webp`. Draft images remain ignored. Save intermediate commits.

---
Earlier checkpoint (historical; latest direct feedback above governs):

# Polyp — five requested corrections in progress (2026-10-27)

- User accepted prior image's wet violet flesh, visible pale seams, embedded Carapacid plates and lighter radial facehugger-inspired Polypoid. User reports acceptable 50 px seam readability and grayscale contrast on the reviewed prior concept; no new game capture supplied. This does not validate subsequent revisions.
- Requested corrections: six clearly folded discs around carrier; each juvenile's tentacles tucked against its own disc rather than noisy protrusions; soft tapering ends, no hooks; visible ragged seam remnant on juvenile; add Zygote.
- Parent pass 1 had only five readable discs and was rejected (`reports/generated/polyp-feedback/01-five-lobes-rejected.png`). Pass 2 reveals sixth rear disc (`02-six-lobes.png`); count inspected at large size, not game size. Six constituent bodies should each have six arms, mostly hidden in folds; the image cannot certify the hidden anatomical count.
- Next: remove hooked tips and tuck remaining parent protrusions; then separate juvenile seam-remnant pass; then add Zygote. Preserve accepted material, plates, palette and basic juvenile form. No game code/tests/captures/browser checks run.

---
Earlier checkpoint, preserved as history:

# Polyp — exact user prompt variant (2026-10-27)

## Current request and saved output

- User supplied a complete positive prompt and negative list for a SINGLE Polyp: six curled discs around one swollen carrier, short tendrils hugging the mass, thick pale-pink raised seams, scattered perforated amber plates, wet bruised violet flesh, neutral grey background, top-down three-quarter strategy-game view. This latest exact specification governs the new variant; do not substitute the earlier heterogeneous-parts prompt.
- Submitted the prompt and negative verbatim to built-in image_gen with no reference images or extra creative constraints. Saved local draft: `reports/generated/polyp-concept/polyp-user-prompt-v1.png`. Exact text and inspection: `assets/art/references/enemies/polyp/polyp-user-prompt-v1.md`.
- Large-image inspection: six peripheral folded bodies around central sac, wrapped short appendages, pale tissue connections and amber fragments present. No text or recognisable human anatomy. Awaiting user judgment on this variant; plate coverage and regular ring composition are review points.
- No game code/behavior/runtime assets changed. Tests, actual game captures, 40–50 px readability, grayscale against the lane, camera matching and movement remain unverified. Existing modified `assets/art/previews/organic-world-mire-v7.webp` is unrelated and preserved. Draft raster remains ignored.

## Next step

- User reviews the exact-prompt Polyp image. Follow their correction or acceptance before further concept stages; do not ask for A/B/C again. Prior Polypoid and mixed-part concepts remain historical candidates, not accepted final designs.
- Continue intermediate saves and user-owned game checks. No final artistic or in-game acceptance claimed.

---
Prior direction and study history (superseded for the current Polyp prompt):

# Polyp A — mixed body parts / facehugger-inspired Polypoid (2026-10-27)

## Latest progress

- LATEST DIRECT USER REQUEST: `а. полип сшит из разных частей тел других тварей. используй лицехвата для вдохновения полипоида`. Current direction is A, superseding previously recorded B. Parent composition is heterogeneous salvaged body parts, not six near-identical folded sacs. User approves direction, not final generated art.
- Generated new two-subject concept with built-in image_gen: `reports/generated/polyp-concept/polyp-concept-a-assemblage-v1.png`; viewer `reports/generated/polyp-concept/review-a-assemblage.html`. Exact prompt and inspection: `assets/art/references/enemies/polyp/selected-a-assemblage-prompt.md`. Draft raster ignored, prior B work retained.
- Large-image inspection: heterogeneous ribbed tissue, smooth sac, membrane and recognisable shell fragments with thick pale fusion seams; juvenile has a separate flat body and long arched grasping appendages. Parent height/projection, claw-like juvenile tips, six separable regions, game-scale/grayscale and motion remain unverified. No tests/game captures/browser game checks run. Acceptance pending.

## Prior direction (superseded by current A correction)

- User explicitly selected B (`б`). Direction B is selected; do not ask A/B/C again. Refined only six-body readability: first refinement still had five visible lobes, second splits rear mass into two. Candidate: `reports/generated/polyp-silhouettes/polyp-b-refinement-v2.png`. Large-view six-lobe count inspected; exact 50 px and in-game checks remain pending.
- Stage 3 color concept prepared: `reports/generated/polyp-concept/polyp-concept-b-v2.png`; review page `reports/generated/polyp-concept/review.html` includes the refined B and measured 50 CSS px silhouette. V1 saved before relative-size correction. Built-in image_gen; prompts in `assets/art/references/enemies/polyp/selected-b-prompts.md`. Color concept not yet accepted.
- Large-sheet inspection: six outer parent lobes and six detached zygotes in separation; pale fusion bridges, headless violet anatomy and paler radial juvenile present. Remaining risks: regular starfish-like Polypoid, some thin web-like seams, weak recognizability of old caste fragments. Exact runtime scale/projection, 50 px browser inspection, actual lane/grayscale and motion remain unverified.

- User supplied seven fusion/body-horror references. Preserved JPEGs and annotated `user-references-v1.html`/`.json` under `assets/art/references/enemies/polyp/`. These take priority for fusion/mood; original biology board is secondary. 23 reference images in total. No permission to add human anatomy inferred.
- Interpreted the supplied reference selection as steering to proceed with provisional silhouette exploration; this is not approval of a finished concept. Three variants: compact knot, low spread colony, skewed tumbling mass.
- Three provisional silhouette candidates produced with built-in image_gen. V1 rejected (flower-like lobes on stalks); V2 compresses the bodies; V3 removes internal shading to show pure silhouettes. Final review candidate: `reports/generated/polyp-silhouettes/polyp-silhouettes-v3.png`; sheet plus measured 50 CSS px views: `reports/generated/polyp-silhouettes/review.html`. All raster drafts ignored. Exact prompts: `assets/art/references/enemies/polyp/silhouette-prompts-v1.md`.
- Large images visually inspected. Provisional recommendation B for low heavy stance; A risks regular rosette, C risks excess height. Six distinct bodies are not yet unambiguously readable. 50 px browser inspection, actual game comparison, grayscale on ooze and animation are NOT verified. No artistic approval received.

## Task and current state

- User supplied `/Users/home/Downloads/polyp-designer-brief.pdf` as the task and explicitly corrected the initial checkpoint-only interpretation. Execute the design brief; make intermediate saves along the way.
- Read all six pages and inspected their rendered layout. Brief stages: moodboard → three black silhouettes with 50 px copies → concept sheet → game-size/color/grayscale comparison → sprites/atlases. Each stage requires approval before the next (brief p. 5).
- Stage 1 proposal completed: 16 annotated references, grouped by colony, seams/material, zygote, Polypoid, mood and existing game art. Lightweight files: `assets/art/references/enemies/polyp/{moodboard-v1.html,moodboard-v1.json,notes.md}`. Notes include observable criteria and exact exclusions for every reference category.
- User-viewable local outputs: `reports/generated/polyp-moodboard-v1/polyp-moodboard-v1.html` (standalone, embedded images) and `polyp-moodboard-v1.jpg` (contact sheet). Downloads and renders are ignored, not committed.
- Selection visually inspected as a contact sheet. Removed a distant aquarium view and a branching basket-star result with misleading search metadata; 16 remain. Number gaps 08/13 preserve source IDs. No artistic approval received yet.

## Scope and verification

- No game code, simulation, balance, geometry, runtime assets or replay files changed. No tests, game captures or game browser checks run; future checks remain user-run under AGENTS.md. Moodboard inspection does not establish in-game compliance.
- Branch `main`; implementation base `538832ecb3947726d9a2487a44153aa0c4571812`, previous documentation checkpoint `26d0fde`. Pre-existing modified `assets/art/previews/organic-world-mire-v7.webp` preserved and excluded from this work's commits.
- Discrepancy recorded before integration: passport still says two offspring; current code immediately creates six Polypoids; PDF describes six invulnerable zygotes hatching at 0.5–3 s. Visual development uses the supplied six-lobe design. No silent gameplay/canon reconciliation.

## Next step

- User: review current A mixed-part concept. Further revisions should preserve heterogeneous construction and low grasping Polypoid, not revert to six cloned sacs or broad starfish rays. No A/B/C selection question needed.
- After anatomy acceptance, align zygote/separation sheet to the heterogeneous body construction; retain six offspring without changing game behavior in this art task. Then user-run actual game-scale/gray/lane/camera validation. Current image is a concept, not a game capture or verified final asset.
- Confirm atlas layout and heading/frame counts before sprites. Save intermediate commits; preserve pre-existing `assets/art/previews/organic-world-mire-v7.webp` change. No runtime files or simulation changed.

---
Previous checkpoint (historical):

# Leech beneath the ooze — v0.11 (2026-10-26)

## State

- Implemented in `prototype/index.html`: `LEECH_OOZE` (surfaceDist 120 — raised from 60 by the user after the first browser look, collateral 0.25, collateralR 30; null under presets), submerged hunt from target pick, `surfacing` state for `BUILD_WARMUP_SECONDS`, targeting and tesla hops skip submerged bodies, collateral from shells, jet, pools and hops, wave cap by free generators (`freeGeneratorCount`), Leech 200/38/35 (presets keep 130/46/25), ripple drawing (`drawOozeRipple`), `LEECH_OOZE` in the rules fingerprint. Version string `prototype-v0.11` not yet added to the replay version list — exported replays still say `prototype-v0.10` (deliberate: no replay format change).
- Agent-run checks (chat session, not the user): `tests/leech-ooze.cjs` (new, 6 PASS), `tests/prototype-regression.cjs` (30/0 after updating the approach scenario to the surfacing state), `castes-v010`, `leech-slab-avoidance`, `overlapping-waves`, `flamethrower`, `branches`, `enemy-stagger`, `salvage-and-ranges`, `balance-preset`, `dispersal-control`, `build-warmup`; `node tools/restamp-replays.cjs --write` re-stamped 8 replays (source fingerprint only, rules unchanged, every checkpoint verified).
- Second pass after the user's first `npm test` failed on `creature-mire-parity`: `reports/carapacid-shelter/simulation-baseline.json` updated to the v0.11 fingerprints (rules df890fca, source c8f739ec); `tests/readability.cjs` attachment loop widened for the surfacing time. Agent then ran every test in `tests/` individually in the chat sandbox: all pass except `leech-crawl-atlas.cjs`, which the sandbox killed for memory (not a logic failure; known heavy test) — the user's `npm test` is the real full-suite result.
- NOT run: browser check from disk, frame captures. Visual readability of the ripple (greyscale contrast) is unverified.

## Next step

- User: full `npm test`; open `prototype/index.html` from disk, watch a Leech wave (wave 5+ with a generator built), check the console; capture a frame with the ripple for the PR.
- Simulation to run before locking the number: Leech survival on the open crawl at surfaceDist 60 vs 120 against a level-3 Turret next to the generator (seconds of fire survived, share of hunts that latch); and how many of the current map's slots lie within 120 of the lane (those generators never get the submerged hunt).
- Then: Testudo damage threshold (passport v2.15), separate PR.

---
Previous checkpoint:

# Creature mire contact — current implementation accepted (2026-10-25)

## PR #54 review follow-up

- User supplied an independent review accepting code, passing tests and improved visuals, with publication follow-ups. The user-owned verification agreement is now explicit in CLAUDE.md as well as AGENTS.md.
- Recorded platform avoidance, mutation markers and offset HP bar in the capture README backlog; no gameplay or test changes.
- Located and opened all four final reviewer comparisons in Downloads (`pr54-…`); uploaded them as GitHub attachments in https://github.com/fouringiz/hunger/pull/54#issuecomment-6400265423. BEFORE is above AFTER in each comparison. The comment contains Carapacid/Leech contact and Mire/Ember platform crossings. PR #54 is ready for the user-authorized squash merge; no new game or test changes.

## Publication cleanup

- Preserved all 27 modified/untracked WebP captures from `reports/creature-mire-contact/` under ignored `reports/generated/creature-mire-working-captures-20261025/`, with original paths and SHA-256 hashes in `manifest.json`; verified each copy before removing the untracked originals. Final platform comparisons remain separately in `reports/generated/leech-platform-occlusion/`.
- Restored the three tracked historical BEFORE images only after saving their modified versions. Updated the capture README to distinguish the old tracked baseline, corrected local baseline and final generated evidence.
- Included the previously uncommitted AGENTS.md agreement that the user runs checks. No game or test changes; existing successful validation remains applicable. This is local cleanup, not a remote push or merge.

---

## Final user confirmation

- After being asked to open `prototype/index.html` from disk, inspect Leech near a platform/Gate and check the console, user replied `все ок`. Record the requested manual file-origin/browser check as passed by user and current visual correction as user-accepted. Agent did not perform the browser run.
- Full `npm test` was previously confirmed by user after `2304e63`; no implementation changes followed. Ground burial/body protection and platform occlusion have focused/native evidence recorded below, with actual Mire/Ember before/after context and whole frames opened by the agent. User supplied the final human visual review; no separate agent review is claimed.
- Current requested work is accepted: Carapacid/Leech contact integration, preserved Leech body/mouth/tail, and Leech hidden behind slab tops instead of drawn over them. Platform fix is render-only masking, not obstacle avoidance. Combat, balance, PATH/GATE_D, slots and source sprite layouts were not changed by this work.
- Evidence remains local: `reports/generated/leech-platform-occlusion/{mire,ember}-{before,after}-context.webp` plus whole/gray frames; ground-mask evidence in `reports/generated/leech-body-contact/`. Generated drafts/captures are ignored and were not added to commits. Do not treat a future remote PR as having these attachments until they are explicitly supplied there.
- Scope boundaries retained: no performance/device certification or exhaustive continuous all-heading visual claim; earlier general scene-contrast concerns were not addressed by this fix. No push/PR/merge performed. There is no further implementation step for the accepted correction unless new feedback arrives.

---
Previous checkpoint:

## Full suite passed by user

- User reports `all tests passed` from full `npm test` after `2304e63`. Full-suite PASS is user-confirmed; agent did not run checks. This supersedes the failed full-suite attempt below.
- Latest implementation remains `197c82b` (ground contact/body protection plus Leech platform occlusion); subsequent commits record visual evidence and repair test mocks/baseline expectations. Actual before/after platform context and whole/gray evidence was inspected in both zones as recorded below.
- Remaining delivery boundaries: actual game opened from disk (`file://`) with console checked near a platform and Gate is not yet confirmed; final artistic approval of platform-occlusion frames and required independent visual review before merge remain pending. General contrast/all-heading scene coverage limitations below still apply. No push/PR/merge performed.
- Next user step: open `prototype/index.html` from disk, inspect the platform crossing and Gate interaction, and check the browser console. No additional automated rerun needed unless code changes or a new failure appears.

---
Previous iteration:

## Full-suite attempt: canvas mock incompatibility corrected; rerun pending

- User ran `npm test` on `197c82b` plus documentation checkpoint. It FAILED in `tests/building-buildup.cjs`: its generic canvas proxy returned undefined from `createRadialGradient`, causing `.addColorStop` to throw when a Carapacid mask was first drawn. Full suite is not green.
- Updated all nine matching canvas mocks to return gradient objects for both linear and radial APIs: building-buildup, coherent-art, infantry-art, forager-mire, organic-world, party-replay, readability, salvage-and-ranges, voltaic-art. This fixes the test harness API contract; no game-rendering fallback/change was made.
- Code inspection also found coherent-art's former zero sprite-baseline expectation. Updated to the intended fixed burial baselines: Forager 0, Carapacid 3.5, Leech 4; still checked at all four tested distances. Actual native contact/body/occlusion assertions remain unchanged.
- Agent did not execute tests. Next user command: `npm test`. Existing inspected platform comparison frames remain valid because this iteration changes tests only. Full-suite success and actual file-origin browser console are still pending.

---
Previous iteration:

## Platform occlusion: focused PASS and actual-frame review completed

- User reports all five requested checks PASS on `197c82b`: leech-platform-occlusion, creature-mire-body, creature-mire-contact, creature-mire-parity, file-origin-canvas. This is focused validation, not confirmation of full npm test or a real browser console check.
- New context/whole/gray files exist in `reports/generated/leech-platform-occlusion/`. Agent opened before/after context sheets and whole scenes in both zones, plus both after grayscale whole frames. No checks/captures run by agent.
- Visual criteria in the recorded 25-sample 0–3.2s crossing: slab hides the overlapping head/body progressively (frames 5–10); full concealment when the body is entirely behind it (10–12); body emerges progressively at the other side (13–20). No body remains on top of the slab in the formerly bad frames 7–14. Exposed body remains visible. No rectangular patch or slab/tower overwrite observed. Scene perspective/geometry unchanged. Actual smoothness between these discrete samples and other approach directions remains outside this evidence.
- Before/after evidence: `reports/generated/leech-platform-occlusion/mire-before-context.webp` -> `mire-after-context.webp`; `ember-before-context.webp` -> `ember-after-context.webp`; corresponding `*-before-whole.webp`/`*-after-whole.webp` show unchanged scene composition with corrected hiding.
- Grayscale review: the generator remains distinguishable; Leech is fully behind the slab at the selected whole-frame timestamp, so these grayscale frames do not establish exposed-enemy contrast. Prior general contrast concern remains open; no unrelated terrain/lighting change made in this iteration.
- Current narrow issue (Leech painted over slab tops) is visually corrected in the sampled passage and supported by user-run front/side/behind tests in three scales. No final user artistic approval of these new frames is inferred merely from 'all pass'. Earlier acceptance of the ground-mask correction still stands.
- Next release checks by user: `npm test`, then actual `file://` game/console check around a platform and near the Gate. Before any PR merge, obtain the required independent second visual review. Latest all-heading scene capture/general contrast and full release verification must not be claimed complete. No push/PR/merge performed.

---
Previous iteration:

## Platform-top overlap explicitly rejected; depth-mask fix pending

- User clarified that Leech still crawls visually across platform tops, pointing at frames 7–14 of the accepted context sheet. Previous acceptance covered the ground-mask correction; it does not approve platform overlap. Agent's visual review missed this defect. User reference preserved in `reports/generated/leech-platform-occlusion/user-references/platform-overlap.png`.
- Observable criteria for this iteration: a platform hides the overlapping portion of a Leech behind its footing; uncovered body remains visible; a Leech in front of the footing stays visible in front. Preserve slab geometry/camera, route and movement/combat. A visual mask does not implement obstacle avoidance.
- Cause: platform tops are drawn in the terrain pass, while only front walls participate in actor depth ordering. The body therefore covers the top even when behind the footing.
- New, NOT RUN: Leech-only offscreen body/light/shadow/burial compositing near foreground platforms. Subtract the actual top/front asset alpha using world coordinates and individual scale when the Leech anchor is behind the footing. Reuse one 256px layer; no pixel reads or new assets. Forager/Carapacid and platform/tower ordering remain unchanged. Optional drawing-context arguments route existing lighting/shadow/burial into that layer.
- Added `tests/leech-platform-occlusion.cjs`: native alpha checks behind/beside/in front, both zones, scales .92/1/1.08, simulation read-only signature, and negative control disabling the occlusion mask to reproduce the known top-overlap defect. No assertions run yet.
- Context capture now uses `62409dc` as BEFORE (ground fix present, platform defect present), output `reports/generated/leech-platform-occlusion/`. Adds grayscale whole frames; paired context sheets still cover 25 samples over 3.2s. Previous ground comparisons remain preserved in `reports/generated/leech-body-contact/`.
- Next user tests: `node tests/leech-platform-occlusion.cjs && node tests/creature-mire-body.cjs && node tests/creature-mire-contact.cjs && node tests/creature-mire-parity.cjs && node tests/file-origin-canvas.cjs`. Separately run `node tools/capture-leech-contact-context.cjs` so frames are available even on a test failure. Agent must open before/after context, whole and gray images and check for pop-in, edge seams, incorrect front/rear hiding, tower overwrite and readability before calling the issue fixed.
- No simulation changes/restamp, checks or captures run by agent. Current platform fix is unverified. Actual file-origin console and final broader release validation remain pending.

---
Previous iteration:

## Current Leech disappearance fix accepted by user

- On implementation `fc4d2d1`, user reports the requested body/contact tests and context capture all passed and says the result is in order. Treat this as acceptance of the current Leech texture-disappearance correction. No further rendering change made after that acceptance.
- Agent opened all eight freshly generated context/whole before/after images for Mire and Ember from `reports/generated/leech-body-contact/`. Comparisons use the same camera, size and sequence: 25 samples spanning 0–3.20s of seeking past an empty platform toward a generator. The mouth/lower body remain visible where the rejected broad mask removed them; raised tail remains present. These samples do not cover attachment, a full approach, all 16 headings or continuous video motion.
- Evidence: `reports/generated/leech-body-contact/mire-before-context.webp` and `mire-after-context.webp`; `ember-before-context.webp` and `ember-after-context.webp`; matching `*-before-whole.webp` / `*-after-whole.webp`. User-generated captures use the actual renderer through `loadWorld` in `tools/capture-organic-world.cjs`. Generated study images remain ignored and uncommitted.
- Confirmed scope: user-run focused body/contact tests passed; sampled Leech body/mouth preservation visually inspected in both zones; current result accepted by user. Platform geometry/depth ordering was not changed. Source sprites, combat, balance, route and slot positions remain unchanged by this correction.
- Release boundaries remain explicit: latest full `npm test`, real disk-browser console check, final all-heading cycle recapture and grayscale contrast hierarchy are not separately confirmed by this message. Earlier checkpoint concerns remain historical/open where not covered by current acceptance. Do not describe the whole branch as fully release-validated.
- Next only if preparing delivery/PR: obtain remaining release verification, preserve compact final evidence/report and keep user approval attached to this implementation. No push/PR/merge has been performed.

---
Previous iteration:

## Diagnostic reviewed: incorrect fixed measurement window corrected; visual capture needed

- User ran all 14 diagnostic candidates. All body-preservation tests pass; none passes the old contact test. Best strip (depth4.5/reach7/feather2.5) fails only Leech 15/0 (13 buried, 12 soft) and 15/3 (6 buried, 14 soft). Full logs read from `reports/generated/leech-burial-diagnostic/`.
- Found a test-specification error: every pose was required to bury >15 pixels inside fixed `y<124`, although the actual projected belly contacts for 15/0 and 15/3 largely lie at y126–131. That window was introduced to reject the anchor-only lip; it is not a valid all-heading ground-contact region. Repeated parameter tuning was optimizing an incorrect proxy.
- Selected the already screened depth4.5/reach7/feather2.5 mask for the next visual iteration. Baked body protection retained. This candidate has prior user-run body PASS, but the current implementation/updated test is not yet rerun and appearance is not approved.
- Corrected contact test: all 80 poses require >15 strongly buried pixels and >10 feathered pixels along the actual rendered lower silhouette (outer 4px, obtained independently from raw sprite alpha). Kept the original raised-underside >15 regression for all Carapacid poses and four Leech row-0 phases, where it is meaningful. Original lip still must give 0 in the raised window, and lifted-tail/body tests remain unchanged. Known bad lip is still rejected; exact rejected broad mask still damages 3,715 protected interior pixels in the user's diagnostic.
- This is a documented correction of measurement location, not artistic approval or evidence of passing tests. No threshold was lowered. Agent ran no tests/captures.
- Next user commands separately: `node tests/creature-mire-body.cjs && node tests/creature-mire-contact.cjs`, then `node tools/capture-leech-contact-context.cjs` regardless of test outcome, so that actual game evidence is finally available. Inspect paired context/whole files in `reports/generated/leech-body-contact/`, including platform-front overlap, before further changes.
- Diagnostic source anchors updated for the selected mask. Full cycles, populated grayscale/readability, file-origin browser console, platform-depth assessment and independent final visual review remain open.

---
Previous iteration:

## All-pose results received; bounded diagnostic prepared, game unchanged

- User run on `0a4b8eb`: all 23,494 protected interior pixels pass. Contact/feathering fails in 14 Leech poses: 1/1, 1/3, 3/2, 3/3, 4/2, 8/0, 8/2, 8/3, 11/2, 12/2, 15/0, 15/1, 15/2, 15/3. Some lack burial, others feathering. Capture did not run. Current game remains a rejected/unverified implementation, not ready for approval.
- No new game-rendering change this iteration. Prepared `tools/diagnose-leech-burial.cjs` for a single user-run diagnostic: 12 bounded strip variants (depth 3.5/4.5/5.5, contact proximity 5/7, feather 1.5/2.5) plus 2 authored-dab variants, all with the existing baked body protection.
- Each candidate is a separate ignored HTML copy. Both existing strict tests run unchanged in assertions; optional `CREATURE_MIRE_CANDIDATE` selects the copy. Without that environment variable, tests still load the actual working game. Every candidate gets logs and a result in `reports/generated/leech-burial-diagnostic/results.json`. No candidate is applied to the game automatically.
- If any candidate passes both tests, the first bounded candidate gets paired actual-game context captures in its own folder, clearly separate from working-game output. This is numerical screening only; visual review, complete cycles, readability and platform occlusion remain required. If none passes, no capture or implementation selection occurs.
- Next user command: `node tools/diagnose-leech-burial.cjs`. Agent did not run this diagnostic, tests or captures. After user output, inspect detailed logs and any candidate images before choosing an implementation. Do not repeat one-parameter guessing with another serial fail/retry loop.

---
Previous iteration:

## Protected body passed; strengthen edge opacity, collect all pose failures

- User run on `1677a5f`: body preservation passed (23,494 interior pixels; rejected mask damages 3,715). Contact test passed through earlier poses, then failed at Leech row 3/frame 2: 11 buried pixels, required >15. Context capture did not run.
- New, untested: same 3.5px mask extent, same contact gate and baked body protection; reaches full opacity after the first 1px of feathering instead of the earlier gradual 3px ramp. No widened area, no changes to simulation or other creatures.
- Contact test now collects burial/feathering failures across all 80 poses before failing, to avoid serial discovery of one pose per user run. Strict >15 burial and >10 feathering conditions remain unchanged, as do negative controls and body/tail preservation.
- Next user run: `node tests/creature-mire-body.cjs && node tests/creature-mire-contact.cjs && node tools/capture-leech-contact-context.cjs`. Agent ran no checks/captures. New appearance and all remaining criteria are unverified.

---
Previous iteration:

## Body protection from actual alpha added; tests pending

- User ran the chain on `9e354b2`: body preservation failed at Leech row 0/frame 2, display pixel (147,126). Contact test and capture did not run. The 3.5-px strip is not accepted.
- Inspection: a strip measured from sparse 4-atlas-pixel rim samples does not guarantee distance from the actual resampled silhouette. Interpolation can enter body interior. Further width tuning alone is insufficient.
- Added offline `bodyCore` scanline spans for each Leech pose. Baker renders the exact 80px cell/4px sink to alpha, protects a 3px opaque interior (alpha >=200), and embeds spans alongside the contacts. The runtime subtracts this protection from the ground mask using compositing, without pixel reads. This adds a margin around the independent test's stricter 4px/alpha220 interior. Tests and burial thresholds are unchanged; strong lower-edge overlap is retained where outside protected interior.
- Ran ONLY the data-generation command `node tools/bake-creature-ground-contacts.cjs` to build implementation data; it succeeded. No tests, captures or browser checks were run by the agent. Atlas images and Carapacid data/renderer unchanged.
- Next user run remains: `node tests/creature-mire-body.cjs && node tests/creature-mire-contact.cjs && node tools/capture-leech-contact-context.cjs`. Both numerical invariants and actual new frames remain unverified. Platform-front occlusion and contrast still separate open issues.

---
Previous iteration:

## Narrow-edge regression result: body preserved, burial insufficient

- User ran checks on `a5d1bef`: body preservation passed (23,494 interior pixels across 64 poses; rejected broad mask damages 3,715). Contact test failed on Leech row 0/frame 0: only 4 strongly buried underside pixels, required >15. The chained context capture did NOT run.
- New adjustment, not run: increase the edge-only fade extent from 2 to 3.5 local pixels, reaching opaque ground 0.5 px below that inner band toward the rim (`rim.y - 0.5`). Keep the contact gate, lifted-tail protection, and absence of interior belly dabs. Body preservation still protects the independently eroded 4-px interior; all test thresholds unchanged.
- Repeat the same three-command chain from the preceding checkpoint. Need both preservation and burial tests to pass before inspecting actual context captures. No new visual claim or simulation change.

---
Previous iteration:

## User rejects Leech disappearing into textures — narrow-edge iteration pending

- User reports all requested tests passed after `c01c1b9`, but provides three live screenshots showing unacceptable Leech occlusion on terrain and beside/on an empty platform. This is a visual rejection despite passing tests. Full `npm test` was not separately identified in the supplied output.
- Saved the supplied screenshots under ignored `reports/generated/leech-body-contact/user-references/{platform,side,lane}.png`. These are real user screenshots, not agent captures.
- Code inspection distinguishes two mechanisms: `worldLiveArt` contains terrain/contact effects, not the platform top/front; `platformFront` is separately depth-sorted. The broad belly mask additionally paints terrain inside the body/mouth. Do not attribute the platform wall to texture sampling or declare its occlusion solved by this iteration.
- Acceptance for this iteration: preserve opaque body/mouth interior and the lifted tail; retain a soft, narrow submerged lower silhouette. No internal terrain holes. Existing burial thresholds stay unchanged. Platform front depth/overlap and general contrast remain separate unresolved visual items.
- New, NOT RUN: Leech mask fades only in a strip from 2 local px above the lower rim to below it, gated by belly contact proximity. Removed broad interior belly dabs from the Leech path; Carapacid path unchanged. Pixel-aligned mask strips avoid fractional stripe seams. No simulation/asset/route/platform changes.
- Added `tests/creature-mire-body.cjs`: protects opaque body interior in all 64 poses via independent 4-px silhouette erosion; exact rejected mask from `c01c1b9` is the negative control. This supplements the old burial-only tests that missed excessive coverage.
- Added `tools/capture-leech-contact-context.cjs`: actual simulation/rendering of a seeking Leech passing an empty pad toward a generator, paired `c01c1b9`/working output in both zones. Files go to ignored `reports/generated/leech-body-contact/{zone}-{before,after}-{context,whole}.webp`. This also exposes the separate platform overlap; it is not expected to prove that issue fixed.
- Next user run: `node tests/creature-mire-body.cjs && node tests/creature-mire-contact.cjs && node tools/capture-leech-contact-context.cjs`. If green, inspect new close/whole comparisons before the next iteration. All new test/capture results are pending; user runs them. Full cycle recapture, grayscale/readability with towers, real file-origin console and independent final review remain required.

---
Previous iteration:

## User verification received; Leech tail correction pending

- User supplied successful output on `d768cdb` for creature-mire-contact (80 poses, old-lip negative control, portal boundary), creature-mire-parity (both zones, Forager pixels, simulation fingerprints/geometry), creature-crawl, portal-entry and file-origin-canvas (both zones). These focused results are confirmed by the user's run, not a full suite or a real browser check.
- User successfully captured before/after with `--poses` for Mire and Ember. Opened Mire before/after route strips for both creatures, both after whole/gray frames, Mire Carapacid after pose sheet, Mire Leech before/after pose sheets, Ember Leech after pose sheet.
- Visual findings: feet/belly occlusion is visible and detached bright rings are absent in inspected route strips. However, Leech's lifted tail tip is erased by the all-rim mask, so this output is rejected. Pose sheets also reveal that their fixed probe origin is off-route; they test heading coverage, while route strips supply the mud-context comparison. Discrete sheets do not establish smooth motion/no sliding in real-time.
- Grayscale: creatures are distinguishable, but terrain/platforms/Gate compete with them in contrast. The required enemy/tower contrast hierarchy is not approved; towers are absent from these scenes. Projection was not changed; complete perspective acceptance remains open.
- Preserved rejected Leech route/pose sheets under ignored `reports/generated/creature-mire-rejected-d768cdb/` before further capture. Current comparison references: `reports/creature-mire-contact/mire-leech-before.webp` vs `reports/generated/creature-mire-rejected-d768cdb/mire-leech-after.webp`; corresponding `*-poses.webp` show all headings.
- New implementation, NOT RUN: only Leech rim masking is limited to within 5 local pixels of the authored belly support polyline; its raised tail is excluded. Carapacid, sink, sizes, ground trails, combat and geometry unchanged. Added a fixed lifted-tail landmark assertion plus negative control that restores the rejected all-rim behavior. Existing 80-pose burial/feathering thresholds retained.
- Next user commands: `node tests/creature-mire-contact.cjs`; if green, `node tools/capture-creature-mire.cjs after --poses && node tools/capture-creature-mire.cjs after --ember --poses`. Baseline images need no regeneration. Inspect the new tail and belly together before any further visual iteration. Full npm test, populated gameplay contrast, actual file-origin browser console/portal motion and independent visual approval remain pending.

---
Previous session checkpoint:

## Resumed session: pending user checks

- Read AGENTS.md, this checkpoint and working changes on `codex/creature-mire-contact`. All earlier verification claims below are historical; no tests, captures or browser checks were run in this session.
- Fixed a code-level portal boundary: portal snapshots carry synthetic `(0,0)` coordinates. The render-only portal body now receives the real entry coordinates for lighting and an explicit airborne flag; contact shadow/ground overlay are skipped while the body stretches. Sprite sink remains consistent. Not visually verified.
- Extended `tests/creature-mire-contact.cjs` with portal ground-sampling/shadow rejection and a grounded negative control. Added `tests/creature-mire-parity.cjs` for exact Forager-only scene pixels in both zones, rules/source fingerprints and route/slot parity against `22e4d45`.
- Corrected the file-origin mock to actually select Ember and load the Carapacid atlas dimensions; explicitly renders both creatures under denied pixel access.
- Capture tool supports `--poses`: all 4/16 headings, eight intervals plus closing phase of one gait cycle, through actual `draw()`. These are controlled heading probes; existing route strips remain separate motion evidence. Whole-scene grayscale is also saved. No new captures generated here.
- Acceptance still pending: buried feet/belly with soft ground transitions, no detached ridges or sliding across the cycle; coherent perspective; enemy/tower readability in grayscale. Current whole-scene capture has no built towers, so tower contrast needs a populated gameplay/browser view as well.
- Next: user runs focused commands below; inspect results and freshly generated before/after images, then handle remaining scale/contact/visual defects. Full `npm test`, real disk-browser console check and independent visual review remain pending. Do not treat the existing `after` images as evidence for the latest ridges/portal fix.
- No combat, balance, PATH, GATE_D, slot or atlas-layout changes intended; simulation parity is pending, no restamp run.

From repository root (first stop on a failure):

```sh
node tests/creature-mire-contact.cjs && node tests/creature-mire-parity.cjs && node tests/creature-crawl.cjs && node tests/portal-entry.cjs && node tests/file-origin-canvas.cjs
```

Then regenerate matching evidence:

```sh
node tools/capture-creature-mire.cjs before --poses && node tools/capture-creature-mire.cjs after --poses
node tools/capture-creature-mire.cjs before --ember --poses && node tools/capture-creature-mire.cjs after --ember --poses
```

Output: `reports/creature-mire-contact/{mire,ember}-{before,after}-whole.webp`, `*-gray.webp`, `{zone}-{carapacid,leech}-{before,after}.webp` (route motion) and `*-poses.webp` (controlled full cycles). These are output paths, not a claim the new files already exist. Portal animation and actual file-origin console still require the user's browser check. Capture artifacts remain outside this implementation commit.

---
Previous implementation notes (historical checks, not rerun):

Branch `codex/creature-mire-contact`, base `22e4d45`, previous checkpoint `4ef87d4`.

Implemented, not yet finally verified:
- Atlas-derived ground-contact JSON for current Carapacid (4 rows) and Leech (16 rows), reproducibly embedded by `node tools/bake-creature-ground-contacts.cjs`.
- Actual ground texture masks the lower silhouette and belly/feet with soft edges; local contact shadows, contact-driven displacement and fading tracks. Presentation sink 3.5/4 px; body sizes remain 76/80.
- Combat, assets, route and Forager functions untouched. No simulation restamp required; full parity still to verify.
- Before captures regenerated from correct base 22e4d45, Mire and Ember. First Mire after strips inspected: burial visible; detached green rings rejected and changed to subtle broken brown/gold ridges. Need recapture revised output.
- Existing creature-crawl and file-origin mock tests pass. New all-pose burial regression test added; full suite not run yet.

Next: finish focused regression tests, capture/inspect both zones and multiple headings/full cycles, verify Forager pixel parity, full npm test, final report and checkpoint commit. Portal snapshots must not sample ground at fake (0,0) coordinates; inspect this boundary before completion.

Browser limitation: previous in-app browser explicitly rejected file:// under its URL policy. Do not bypass. Real disk-browser console check remains manual; native capture and SecurityError mock are separate evidence.

---
Historical checkpoint follows.

# Active: Creature mire contact — paused at user checkpoint request (2026-10-25)

## Verified state

- Working branch: codex/creature-mire-contact. Fast-forwarded to current local/origin main 22e4d45, which changed only display cell sizes: Carapacid 76, Leech 80 (previously 70/55). Preserve these new sizes.
- Current task: make Carapacid and Leech sink into mud like Forager: feathered lower-body occlusion, contact shadow, local ground deformation and trails. Presentation only; combat, balance, collision radii, speed, PATH/GATE_D and Forager rendering must remain unchanged.
- No task implementation has been made to prototype/index.html or assets. Only a capture tool and original BEFORE captures exist. The previous checkpoint request was interrupted before saving; this entry closes that gap.
- tools/capture-creature-mire.cjs captures the actual renderer through loadWorld: Carapacid/Leech/Forager, eight frames per cycle plus a full map view. BEFORE is pinned to aa9ed15. Captures in reports/creature-mire-contact are successful but PRE-DATE the size change in 22e4d45; they are historical only, not a valid current comparison. Not yet visually inspected. No AFTER captures exist.
- Leech has a 16x4 atlas and assets/hunger-leech-mire-v1.contacts.json (belly support paths). Carapacid still has its old 4x4 atlas; no Carapacid contacts JSON exists. New Carapacid design was deferred in the previous task. Need contacts for the CURRENT atlas without redesigning it.
- No tests run for this task; earlier green npm test belonged to the completed Leech atlas task.

## Inspected implementation

- creatureCrawlSprite / drawCreatureMudLip: currently only a narrow foreground lip; actor rendering is already scaled by e.__k inside enemyArt, so world texture/contact sampling must account for that scale.
- foragerMireSprite -> drawForagerBurial uses actual worldLiveArt texture plus baked contact coordinates; preserve these functions and Forager assets byte-for-byte.
- observeMireTraffic / drawLivingSurface already create generic trails/local displacement for all bodies. Extend only Carapacid/Leech branches using their contact geometry; leave Forager branch/output unchanged.
- JSON cannot be fetched naively from file://. Existing Forager contacts are embedded in the HTML; use a reproducible offline embedding step for creature contacts as well.

## Next steps (implementation proposal, not completed)

1. Re-read AGENTS.md and latest state. Update BEFORE capture baseline from aa9ed15 to 22e4d45 (or newly verified main), regenerate current Mire/Ember before frames and open them.
2. Derive/annotate visible foot contacts for the current Carapacid atlas; embed both caste contact tables from JSON. Preserve all atlas files/layouts.
3. Add contact-local shadow BEFORE each sprite; sink its presentation a few pixels; copy real ground texture over belly/feet with a soft irregular mask AFTER it. Use drawing/compositing/gradients, no runtime pixel reads. Match ground coordinates with actor scale. Belly paths must cover Leech underside in all headings, not just an ellipse at the anchor; Carapacid shell remains above mud while lower body/feet are buried.
4. Align small ground displacement and short-lived trails with those contacts, not a disconnected generic shadow. Preserve foundation protection and Forager pixels.
5. Verify actual closeups/full cycles/full frame and grayscale, before/after for both zones and relevant headings. Test regression against old lip-only rendering, contact projection, rendering-only state/fingerprints, unchanged Forager, and SecurityError resilience. Full npm test and diff check before final report.
6. Save checkpoints, concise evidence/report and PR commands; no remote push/merge authorized here.

## Browser verification limitation

AGENTS now requires file:// browser/console check and forbids unguarded canvas pixel reads. Chrome was unavailable via cua. Available in-app browser explicitly BLOCKED file:///Users/home/github/game/prototype/index.html: only HTTP(S) permitted; tool forbids workaround/alternate surface/raw CDP to bypass. Do not attempt a bypass. This is a browser URL-policy restriction, not a user refusal. Native capture does not establish browser success. Use safe mocked SecurityError tests for independent coverage, and clearly leave real file:// console check to user/authorized browser access.

---
Previous completed atlas task checkpoint follows; it is not progress on this task.

# Active: Leech 16 directions — ready for visual review

Branch codex/creature-16dir-atlas; implementation checkpoint 5272414. Continued from e6f2641. User authorized generating missing diagonals, showing the source before baking, and Leech-only presentation row selection. Generated source is saved in assets/art/sources/leech-headings-diagonal-4x4-v1.png and was shown before baking. Carapacid remains deferred and byte-unchanged.

Completed: Leech 16×4 atlas, belly-support JSON, configurable one-command baker, matte cleanup/lossless WebP, row selection and tests. Only game-code change is creatureCrawlPose direction count; simulation untouched, no restamp required. Rebuild: node tools/bake-creature-crawl.cjs leech. Python/Pillow auto-detected or CREATURE_PYTHON override. Future Carapacid uses the same configurable pipeline after new source/foot annotations exist.

Validation: full npm test passed (reports/generated/leech-16dir/npm-test.log), deterministic rebuild and negative white-border check passed, git diff --check clean. Opened before/after game route strips, full game frames, contact overview, full four-phase gait loop and grayscale strip. Source highlights slightly brighter; eight intermediate headings are affine approximations and discrete master switches remain. Contact JSON is prepared only, not yet consumed by game effects. No browser/device/performance testing.

Final evidence/report: reports/leech-16dir/README.md; PR text: reports/leech-16dir/PR.md. Next: independent visual review, then user push/PR/merge. No remote mutation by assistant. Do not call artistic acceptance or future Carapacid work complete.

---
Historical checkpoint follows.

# Active: Creature 16-direction source audit — 2026-10-24

Branch codex/creature-16dir-atlas from freshly fetched origin/main. User limits work to assets/baking tools and explicitly requires stopping if diagonal masters are missing. Visually inspected both 4x4 source sheets; missing SE/SW/NW/NE cycles for both castes. Stopped before baking. Exact two generation prompts and resume checklist: reports/creature-16dir-master-request.md. No game files/assets changed; contact JSON and 16-row tests remain pending. Separate scope conflict: renderer hardcodes four rows, so live diagonal-route acceptance requires authorization for a presentation-only row-selection change. Full baseline npm test passed (all tests passed); git diff --check clean. Older notes below are historical.

Branch codex/shelter-balance-audit from main cb7e53a. Main already removes the stale replay fingerprint exception and restamps all eight reference games. Added the explicit AGENTS rule. Completed paired on/off runs on four human-v0.4 timelines under v0.9 campaign rules. Same outcomes/Gate HP in all pairs; real occupancy verified. Report: reports/carapacid-shelter-balance-v0.9.md (results, caveats, reproducible command). Original fixture fidelity and instrumented ON equivalence passed. Restamp command reports zero changes. Next: user review/push; broader balance playtest remains open. No game balance changes authorized by the audit. Earlier notes below are historical.

## Latest verification correction

The final crawl-atlas integration is saved in 863d111 and origin/main reference additions have been merged into this branch. That integration shortened shelter gaps from [6,24,42] to [6,22,36], but left the previous simulation-baseline rules hash. Reproduced both hashes directly: previous gaps yield 1f5e7d0d; current gaps yield acedc780. Source hash stays 5dbb50a9. Corrected only the expected rules hash; retained all geometry, behavior and visual assertions. Full npm test passed (all tests passed) and git diff --check is clean after the correction. No push or merge into main performed. Older progress notes below predate the integrated animation atlases.

Branch codex/carapacid-shelter from fresh origin/main 0a6d30a. User confirms Gate work completed. Approved Leech concept and broad Carapacid shell; new request adds Foragers gathering beneath shell arches near a tower. See reports/carapacid-shelter-plan.md. Preserve untracked reports/NEW-CHAT-HANDOFF.md. Building readiness belongs to a later PR.

Implementation checkpoint: real deterministic gathering into three provisional lee-side berths, natural forward speed with a berth cap and bounded lateral movement. Inactive towers do not trigger it. Dead, frozen or infantry-blocked carriers release it; portal approach excludes grouping. Existing damage and interception functions are unchanged. Historical balance presets retain original movement and accept only the known previous source fingerprint; campaign replays have new movement/rules and version v0.9.

New generated four-view Carapacid art is in assets/hunger-carapacid-shelter-v1.webp. Render depth puts the shell over sheltered bodies. Initial capture hid the entire group; adjusted berth separation and lateral offsets, now actual alpha tests confirm each of three bodies is partly visible and partly covered. Read-only native captures for Mire/Ember, before/after and full 6-second approach/shelter/death/release movie are in reports/carapacid-shelter/. Full npm test passed after behavior changes; an added native occlusion test passed separately. Final suite/review still pending after latest marker-height adjustment.

Known scope boundary: these are four static directional Carapacid poses, not a new authored leg-cycle atlas. Accepted Leech art has not been integrated. No browser/device or balance playtest yet; no push/PR/merge. Next: finish checks/report, save commits and give user branch/push commands. Do not claim the entire two-creature animation task is complete.

# Previous: Gate integration — 2026-10-24

Repo /Users/home/github/game, branch codex/gate-ground-integration from fresh origin/main 284f3c2. Main contains portal teleport and local ground life. Preserve untracked reports/NEW-CHAT-HANDOFF.md.

Current explicit task authorizes intermediate commits and asks for npm test green before final report. Scope is rendering only: keep accepted frontal Gate art, source geometry/anchor, PATH, GATE_D, slots, combat and balance. Integration criteria: irregular mud/route overlap at base, matching organic growth climbing lower stone, soft ground shadow, cyan spill on nearby ground and bodies within ~80px, zone grading for Mire and Ember.

Baseline captures prepared with tools/capture-gate-integration.cjs (loadWorld from actual native game renderer), both zones. Next: cached Gate surface grading and irregular footing/ground growth, shadow/spill and body-only light. Preserve the full lane width and the teleport effect. Save intermediate code, inspect actual close/whole shots for both zones, add focused tests and run npm test. No push/merge requested.

## Implementation in progress

Baseline committed as 3e7e28f. Implemented cached display-only Gate grading (warm stone/moss in Ember, muted olive in Mire; cyan aperture preserved), irregular feathering of bottom alpha, six narrow world-texture roots on lower masonry, soft forward shadow and 80px cyan ground/body spill. Sprite lighting uses one reusable 128px alpha mask and preserves body transparency/texture. Projection, source assets, all Gate geometry and combat unchanged.

Focused portal-entry, organic-world and forager-mire tests passed for the first implementation. Visual inspection caught an unlit brown burial patch pasted over the new ground light beneath Foragers. Now paintGateApproach paints the same floor/shadow/light into the creature contact surface; recapturing to inspect correction. Need dedicated gate tests, whole/close/grayscale review and final npm test. No final approval yet.

## Integrated render checkpoint

Brown burial artifact corrected and final Mire/Ember captures regenerated. Opened both close-ups, Ember whole scene and Mire grayscale; accepted frontal silhouette and broad approach retained. tests/gate-integration.cjs passes both zones: exact baseline rules/combat/geometry, unchanged upper silhouette, cyan preservation, feathered bottom, warm Ember grading, 80px range, actual body lighting for all three castes and matching lit-floor samples. Tests account for the original image's 249–253 interior alpha. Final npm test pending. No push or merge.

## Completed implementation / awaiting user visual review

Full npm test passed on b67293d (all tests passed); subsequent changes are documentation only. git diff --check clean. Intermediate commits: 3e7e28f baseline, b67293d implementation and native visual tests. Final report/PR text in reports/gate-integration/README.md and PR.md; before/after full and close images for Mire/Ember plus grayscale views included. Source art files untouched. Native rendering validated; browser/device performance not assessed. Final artistic approval remains with the user.

No push, PR creation or merge performed. User can checkout codex/gate-ground-integration, inspect, push and create PR using the report's commands. A three-commit git-am delivery patch is saved after the final documentation commit at reports/generated/gate-ground-integration.patch; do not reapply it to this already-completed branch. Preserve untracked user reports/NEW-CHAT-HANDOFF.md. No remaining implementation task unless user feedback requests changes.
