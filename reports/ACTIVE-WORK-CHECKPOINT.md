# Polyp — user references and silhouette studies (2026-10-27)

## Latest progress

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

- User: choose A/B/C or give direction on the provisional sheet. Refine the selected silhouette to make the six fused bodies clearer, then obtain acceptance before colored concepts. Inspect supplied 50 CSS px views at browser zoom 100%; no in-game claim follows from this sheet. Use six folded bodies around a seventh carrier, soft radial/asymmetric anatomy, no head/face/paired eyes, thick pale seams in later color stage.
- Before sprite production, agree atlas cell/frame counts and heading count. Before claiming visual integration, user must supply actual game before/after captures, full frame/close-up/grayscale and full animation cycle; independent visual review is required before merge.
- Continue intermediate commits and maintain this compact top checkpoint. Earlier results below are historical and do not validate Polyp art.

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
