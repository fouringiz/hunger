# Portal teleport checkpoint — 2026-10-24

Work in /Users/home/github/game, branch codex/portal-teleport from fresh main9298dd2. Previous Forager atlas work is already in main. Existing untracked reports/NEW-CHAT-HANDOFF.md belongs to the user; leave it alone.

Task: remove the60px approach fade; retain held heading. Trigger once per enemy at a path threshold15–20px before GATE_D, with opaque3–4x directional stretch, blue flash/ripple, hard disappearance at flash peak,0.2s fading trail and short synthesized warp cue. Presentation must outlive the simulation's deleted body; coordinates, GATE_D, leak tick/damage and combat functions must stay exact. Three entries must create three independent effects.

Baseline recorded in reports/portal-teleport/baseline.json (rules/source fingerprints, path, exit and slots). Native before frame: before-approach.webp from tools/capture-organic-world.cjs loadWorld. The changed portal test intentionally fails before implementation: at GATE_D-30 old portalFade is0.5, expected1. Original HTML also saved to /private/tmp/portal-before.html for analysis.

Next: presentation-only observer retains enemy references between draws so it can detect a coordinate crossing even if update removes the body before the next draw. Capture frozen body/gait and a path-anchored event, never change simulation objects or functions. Initial threshold GATE_D-18, calibrate against actual rendered floor. Save four consecutive same-body stages plus multiple-body frame, inspect whole cycle and grayscale. Update portal tests, run npm test before report. No merge without second visual view per AGENTS.md.

## Functional teleport checkpoint

Implemented: path threshold GATE_D-18; independent retained-reference observer in draw; no simulation/update/reset function changes (both baseline fingerprints remain exact). One frozen snapshot per body stretches3.8x and narrows to0.18, disappears at0.34s peak, with0.20s trailing echo. Held arrival heading remains. Shared portal polygon clips ripple to light surface. Synth voice sweeps240→2400Hz over0.22s, respects mute/voice budget, does not throttle three entries into one cue.

Updated portal tests pass: opaque approach, distance-only trigger, exact one-shot, stretch/hard removal, expiry/reset, after-leak continuation, a body removed between render frames, three events/voices, off-lane exclusions and exact source/rules fingerprints. First full npm test passed. Native capture tool generated single-body stages and three-body timeline with normal damage.

Visual refinement: original red leak ring remained visible over the new blue echo. Suppressed that old ring only in rendering; S.fx leak data, GATE_D and damage remain untouched. Increased trailing center-ray thickness for readability. Must recapture and inspect refined stages, then get second visual review and run final npm test. No completion claim yet.

## Delivery checkpoint — user runs final checks

Refined native stages, full-map view, single/multiple MP4 cycles and offline cue sample are saved in reports/portal-teleport; README.md lists evidence and commands. Second visual review accepted the captured appearance, but reproduced teleport of a body killed before GATE_D. Final presentation fix excludes those bodies and cancels their active snapshots; true leaked bodies retain their effect. Added regression cases and an actual renderer opacity spy. Generic warp rendering now draws only the body without stretching its ground shadow.

Last full npm test passed before the combat-death fix and new tests. At the user's request, do not repeat full verification or publish remotely: deliver a binary git-am patch and let the user run final checks/create the PR. Final changes are untested; visual captures precede the combat-death fix. No PR created, no push, no merge. Base is 9298dd2; checkpoint commits 146d319 and a8769aa plus final delivery commit. Patch will be reports/generated/portal-teleport.patch (ignored delivery artifact).
