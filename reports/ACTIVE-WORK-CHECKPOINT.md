# PR #90 — Howitzer art restoration rebased; user verification pending

2026-10-30. Rebuilt `codex/howitzer-design-restoration` on current main `0c78db1` with only #89 restoration and its supporting fixtures/capture workflow. Old branch, including unpushed capture work, preserved at `codex/howitzer-pre-rebase-20261030` (`94d45e2`).

- #92 is already done on main via #93: HEAD_SEAT_DROP=5, no drawLevel4Coupling. No seating implementation, seating tests or passport change added here.
- Main atlas retained; only row 4 rebuilt from SHA-verified raw Howitzer source and graded. Other seven rows and LEVEL4_ART entries retained from main; Howitzer frames/anchors retained from the restoration branch. No simulation, balance, PATH, GATE_D or platform changes.
- Requested grading executed: before sat 0.529 / value 0.381 / bright 12.9%; after sat 0.340 / value 0.339 / bright 9.0%; target 0.345 / 0.340 / 9.0%. Before is after local contrast, before palette grading.
- Known defect #91 remains open: nonuniform depicted Howitzer yaw; existing brief blend may show a doubled contour. This PR does not resolve it.
- Static construction comparison confirmed identical decoded RGBA for all seven non-Howitzer rows and no renderer changes outside the Howitzer LEVEL4_ART entry. This does not establish visual quality.
- NO new agent-run tests, game captures or browser checks. Earlier results do not validate this rebased candidate; no visual completion claim.
- Next, user runs from the repository root:
  `node tests/howitzer-design.cjs`
  `node tests/level4-seating.cjs`
  `npm test`
  `node tools/capture-organic-world.cjs --tower-base howitzer --howitzer-design-review`
- Open `prototype/index.html` from disk and check console through upgrade/aim/fire. Inspect actual before/after whole/close/grayscale, full turn/attack/upgrade/sale cycles and reference at comparable scale, including consistent camera and enemy/tower contrast. Obtain independent second review before merge.
- Expected before/after evidence: `reports/generated/howitzer-design-review/howitzer/{before,after}-{mire,ember}-{whole,whole-gray,turn-zoom,upgrade-zoom,attack-zoom,sale-zoom}.png`, full cycle directories and `results.json`. These frames have not been regenerated for this rebase.
- Details: `reports/level4-review/howitzer-design-restoration.md`.

## Continuation audit — 2026-10-30

- Verified PR #90 remains open/draft at bfad8fa, based on 0c78db1. No merge or runtime edits during this continuation.
- Unconnected yaw experiments are rejected as runtime candidates: the ImageGen sectors repeat/skip depicted directions; the geometric prototype changes the approved surface detail and construction too much. Neither replaces the approved Howitzer. Heavy drafts stay ignored under reports/generated/howitzer-yaw-uniform/.
- Preserved the unfinished single-row baker experiment as an ignored patch and removed it from the PR working diff. #91 remains a separate iteration, pending acceptance of #89.
- Read the current capture implementation: it already advances real simulation ticks through branch warm-up and writes complete upgrade-cycle directories. The older unpushed capture helper is superseded; do not reintroduce it from codex/howitzer-pre-rebase-20261030.
- No tests, game captures or browser checks run. Next step remains the user-run commands above, followed by review of freshly generated frames for this exact candidate. Earlier accepted seating is not reclassified as approval of the rebased art.

## User verification received — 2026-10-30

User reports `all tests passed` and successful Howitzer design capture for candidate bfad8fa (later 3a7d03a adds documentation only). This is user-run validation. Results.json confirms both zones retain rules 388d2ac9 / source 48035e01 and 151 equal live ticks against pinned main 0c78db1.

Opened actual before/after Mire whole and turn-zoom sheets, user-approved-and-16-poses.png, all 97 turn frames and 151 attack frames in both zones as contact sheets built from the existing user captures, Mire upgrade strip and all 85 Ember upgrade frames, Mire sale strip and Ember attack whole grayscale. No new tests/captures/browser checks were executed by the agent.

Observable review:
- Compact housing, paired ivory/copper hydraulic units, hoses and rear vent restored relative to the simplified before art; no broad copper pedestal or green coupling disc observed. The approved source remains brighter than the runtime graded art. Artistic acceptance remains with the user.
- Direct seating retained in the inspected poses/attack and upgrade sequence; no new floating gap observed at these review scales. The mounting peg is largely hidden by intentional insertion into the socket.
- The complete upgrade sequence reaches the deployed new head, unlike the old presentation-only recording.
- Rotation criterion FAILS: apparent repeated directions and uneven jumps remain; translucent doubled outlines visible at transitions (for example after-mire-turn-cycle/023.png and /029.png). Already tracked by #91; not corrected in #90.
- In Ember grayscale, head and nearby enemies remain distinguishable, but the highly detailed background competes for contrast. No blanket claim that the global strongest-contrast rule is satisfied. Runtime camera appears consistent with the foundation in the reviewed views.
- No new discharge detachment observed in the inspected attack contact sheets. The full sale cycle and browser console have not been verified for this candidate. A second independent visual review is still pending.

Evidence root: reports/generated/howitzer-design-review/howitzer/.
Before/after: before-mire-whole.png, after-mire-whole.png, before-mire-turn-zoom.png, after-mire-turn-zoom.png.
Reference: user-approved-and-16-poses.png.
Full-cycle review boards: review-current-{mire,ember}-{turn-cycle,cycle}.png; upgrade: after-mire-upgrade.png and review-current-ember-upgrade-cycle.png.

STOP at this iteration: await user's verdict on restored Howitzer appearance before beginning #91. PR stays draft; no merge, no overall visual completion claim.

## User art verdict — 2026-10-30

User accepted the restored Howitzer appearance after the fresh capture review ("сойдет"). This accepts the current visual design for #89; it does not accept/fix the uneven rotation and doubled transition outlines tracked by #91. User-run tests remain passed as reported. No merge authorization was given. Next implementation iteration: #91, preserving this accepted construction, palette and seating. Disk-browser console confirmation remains unreported for this candidate.
