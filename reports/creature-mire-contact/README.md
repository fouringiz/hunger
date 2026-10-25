# Creature mire contact captures

Final reviewed BEFORE/AFTER comparisons are published as four image attachments in [PR #54](https://github.com/fouringiz/hunger/pull/54#issuecomment-6400265423): Carapacid contact, Leech contact, and Leech platform occlusion in Mire/Ember. In each image, BEFORE is above AFTER.

The tracked BEFORE images here are historical captures from aa9ed15, before the display-size change. They are not the baseline for the final implementation. The capture tool now uses 22e4d45.

Local generated evidence (ignored by Git):
- `../generated/leech-platform-occlusion/`: final before/after platform crossing, whole scenes and grayscale in Mire/Ember.
- `../generated/leech-body-contact/`: earlier ground-mask comparisons and user references.
- `../generated/creature-mire-working-captures-20261025/`: all 27 modified/untracked captures preserved during working-copy cleanup, including corrected 22e4d45 BEFORE images. `manifest.json` records original paths and SHA-256 hashes. These include intermediate results and must not be presented as final.

All paths above are local evidence; they are not included in the published branch. See [the active checkpoint](../ACTIVE-WORK-CHECKPOINT.md) for user-confirmed tests, browser verification and visual acceptance boundaries.

## Follow-up backlog from PR #54 review

- Leech platform avoidance: the current mask handles visibility only; movement still crosses platform footprints. Any route/simulation change requires separate approval and validation.
- Mutation markers: review visibility and placement independently of the burial effect.
- Offset HP bar: align its display with the visible creature in a separate visual iteration.

These items are outside PR #54 and are not claimed as fixed.
