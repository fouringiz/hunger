# Howitzer rotation #91 — redraw rejected for changing sprite identity

2026-10-30. Branch codex/howitzer-yaw-poses. Runtime remains the accepted #89 restoration from PR #90; no new runtime art or code is connected.

## Authoritative user direction

The ONLY selected identity for further yaw work is the user's attachment codex-clipboard-0a8d7ba6-9c4b-4a3b-a971-df6cedcc1c96.png, archived unchanged at assets/art/references/towers/howitzer-design-approved-v2.png. User accepts its design and rejects repeated depicted angles. Change viewpoints only: preserve its compact body, exact equipment boxes, paired ivory/copper sleeves and exposed rods, hose routes, short thick raised tube, muzzle collar and narrow mounting peg.

User explicitly rejected the replacement shown in the previous turn: "это не тот спарйт". Both reports/generated/howitzer-yaw-review/source/howitzer.png (exec-9518bb91-f67f-48c9-8877-8e643dc50247.png) and the earlier howitzer-candidate.png / design-comparison.png are REJECTED, not pending approval. Their altered boxes, hoses and piston arrangement are not acceptable substitutes. Do not bake, grade or connect any of them. The current hand-built model and its style transfers do not preserve the selected identity and are not approved production sources.

## Verified state / boundaries

- User previously reported all tests passed for the #89 candidate, then accepted its appearance ("сойдет"). Actual before/after captures were reviewed; details and remaining limitations are in reports/level4-review/howitzer-design-restoration.md.
- #91 is unresolved: authored directions repeat/skip; 60ms crossfade creates doubled outlines. Hard switching was rejected before implementation because muzzle continuity would fail.
- All exploratory runtime changes were restored before the prior checkpoint. Existing tests, renderer, atlas, anchors and capture tools remain unchanged. No agent-run tests, game captures or browser checks in this iteration.
- Heavy rejected drafts remain ignored. Prompts/provenance remain recorded; archive/provenance does not mean approval.

## Next

Rework the source-production approach around the exact selected sprite. Do not generate another alternate mechanism from the rejected approximation. Confirm same components, silhouette family, proportions and hose layout before claiming a new pose candidate. Then independently establish the 16 depicted angles and bearing/muzzle anchors; raster uniqueness alone is insufficient. Preserve source-design approval without asking for it again. After an acceptable candidate is integrated, user runs tests and actual-game captures; stop for verdict before another visual issue. No merge authorization.
