# Howitzer design restoration — #89

Follow-up to merged PR #69. Baseline: main at 0c78db1. This iteration addresses only the Howitzer identity
rejected by the user after iteration 3. No artistic acceptance is implied.

## Observable criteria

1. Retain the user's second-sheet construction: compact olive riveted housing,
   thick elevated olive barrel with perforated steel collar, TWO prominent
   ivory/copper hydraulic cylinders with long exposed dark piston rods, looping
   black hoses, vented side boxes and rear hatch, short narrow steel mounting peg.
   No broad copper pedestal and no simplified box body.
2. Sixteen ordered directional poses; camera, physical size and lighting stay
   consistent. Check full turn for apparent repeated directions, sudden changes
   of barrel elevation, hardware popping and transient doubled outlines.
3. Each pose has physically measured bearing/muzzle anchors. Retain the <=2px
   seating bound through recoil and the known-bad 6-unit rear shift control.
4. Compare actual game to the exact user reference at comparable head height,
   plus the original foundation-width reference. Inspect whole/close/grayscale,
   complete turn and live attack, not only a sheet of authored art.
5. Preserve simulation rules/source fingerprints and live ticks; no combat,
   targeting, balance, PATH, GATE_D or platform-position changes.

## Authoring / regression

The user reference is archived unchanged as
`assets/art/references/towers/howitzer-selected-approved-v1.png`.
Prompts and acceptance/rejection reasons are recorded in
`assets/art/work/towers/level4-towers-v1.prompt.txt`. Heavy raw sheets/guides remain ignored.

New `tests/howitzer-design.cjs` checks that the bottom 4% of every actual atlas
pose terminates in a narrow peg (<=22% of the upper assembly's overall width).
It applies the SAME check to an unmodified tile from the actual rejected d022ae3
atlas and requires rejection. This protects the narrow-peg requirement only;
it cannot approve the complete design. Its pinned raster fixture is read
without Git history. Existing tests/thresholds are not rewritten for this fix.

The dedicated capture flag loads BOTH baseline source and baseline atlas pixels
from pinned main 0c78db1 source and the pinned pre-fix Howitzer row; using
the candidate PNG with old metadata would be an invalid before/after. Output is separate from the previous iteration's evidence.

## Prepared candidate

Only the Howitzer row and its anchors have been repacked. Atlas dimensions and
layout remain 4096x2048 / 256px cells, so the existing v2 name is retained.
The other seven atlas rows/metadata entries and runtime behavior remain on
current main. Existing HEAD_SCALE, deployment/branch-swap behavior and palette
grading are retained. The existing offline grader was applied to the NEW raw
Howitzer row only; its record is updated, without double-grading other rows. The 16 views retain the compact detailed body and narrow peg.
The source sheet and annotated bearing/muzzle board were opened for authoring;
this is not a substitute for actual-game captures.

## User-run commands (not run by the agent)

From the repository root:

```bash
node tests/howitzer-design.cjs
node tests/level4-seating.cjs
npm test
node tools/capture-organic-world.cjs --tower-base howitzer --howitzer-design-review
```

Also open `prototype/index.html` from disk and check the browser console while
upgrading/aiming/firing the Howitzer. Node captures do not verify file-origin
SecurityError handling.

## Expected frame paths — pending generation by user

Root: `/private/tmp/hunger-level4-sprites/reports/generated/howitzer-design-review/howitzer/`

- `user-approved-and-16-poses.png`: exact user upper reference + original
  foundation reference + all16 actual-game poses.
- `before-mire-whole.png`, `after-mire-whole.png` (also `ember`).
- `before-mire-turn-zoom.png`, `after-mire-turn-zoom.png`.
- `{before,after}-{mire,ember}-turn-cycle/000.png` through `096.png`.
- `{before,after}-{mire,ember}-cycle/000.png` through `150.png`.
- `{before,after}-{mire,ember}-attack-whole-gray.png`.
- `results.json`: rule/source fingerprints and 151 identical live ticks.

All new tests, captures, browser checks and visual criteria remain UNVERIFIED
until the user supplies their results and frames. Earlier branch results do not establish this rebased candidate's success.

## Rebase onto current main — 2026-10-30

Base: 0c78db1. Only #89 is addressed. #92 is already implemented on main via #93: HEAD_SEAT_DROP=5 and no drawLevel4Coupling. No bearing-removal implementation, test changes, or passport changes are carried by this PR. #91 remains open for nonuniform depicted yaw.

The raw Howitzer row was reconstructed using the original baker algorithm and the branch metadata from source SHA256 e5b359068e47875eb686ed25e9c4b61917948917f733a8c63aa164a617e8098c. All other atlas rows come from main. Dimensions/layout remain unchanged. Only Howitzer metadata and its embedded LEVEL4_ART entry are replaced.

Requested command: `node tools/grade-level4-atlas.cjs --replace howitzer`. Printed metrics (before means after the command's local-contrast step, before its palette grade):

- Before: sat 0.529, value 0.381, bright 12.9%.
- After: sat 0.340, value 0.339, bright 9.0%.
- Target: sat 0.345, value 0.340, bright 9.0%.
- Parameters: saturation 0.6605, gamma 1.02, scale 0.9.

Capture baseline is pinned current main 0c78db1 with its matching Howitzer row; the helper retains main's complete simulated upgrade cycle. No new tests, captures or browser checks have been run. No visual completion claim. Whole/close comparison, full cycles, grayscale readability, perspective and independent second review remain pending.

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
