# Portal teleport checkpoint — 2026-10-23

Work in /Users/home/github/game, branch codex/portal-teleport from fresh main9298dd2. Previous Forager atlas work is already in main. Existing untracked reports/NEW-CHAT-HANDOFF.md belongs to the user; leave it alone.

Task: remove the60px approach fade; retain held heading. Trigger once per enemy at a path threshold15–20px before GATE_D, with opaque3–4x directional stretch, blue flash/ripple, hard disappearance at flash peak,0.2s fading trail and short synthesized warp cue. Presentation must outlive the simulation's deleted body; coordinates, GATE_D, leak tick/damage and combat functions must stay exact. Three entries must create three independent effects.

Baseline recorded in reports/portal-teleport/baseline.json (rules/source fingerprints, path, exit and slots). Native before frame: before-approach.webp from tools/capture-organic-world.cjs loadWorld. The changed portal test intentionally fails before implementation: at GATE_D-30 old portalFade is0.5, expected1. Original HTML also saved to /private/tmp/portal-before.html for analysis.

Next: presentation-only observer retains enemy references between draws so it can detect a coordinate crossing even if update removes the body before the next draw. Capture frozen body/gait and a path-anchored event, never change simulation objects or functions. Initial threshold GATE_D-18, calibrate against actual rendered floor. Save four consecutive same-body stages plus multiple-body frame, inspect whole cycle and grayscale. Update portal tests, run npm test before report. No merge without second visual view per AGENTS.md.
