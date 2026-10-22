# Organic world — visual checkpoint

Status: **art-direction preview for player review**. No runtime changes in this checkpoint.

## Player decisions, 2026-10-22

- All new buildings must finish their 1.65-second deployment before becoming operational. Weapons cannot fire, generators cannot supply power, and Barracks cannot release soldiers during construction. The duration follows simulation time, including pause and speed controls. Upgrades do not restart initial construction. Existing resume warm-up remains separate.
- Pause should have visible machinery animation: retract/fold weapon barrels; extinguish or retract the upper Tesla assembly. This communicates the existing paused state.
- Buildings stand on raised concrete platforms. The player explicitly chose the full platform height in concept v1; do not lower it as in v2. The platform's lower edge sinks into the mire; the actual gun does not.
- Make the entire location an organic swamp. The player chose concept v1's amount and density of texture, but requested a green–umber–brown environment instead of red/yellow. Preserve bright wet highlights, pores and slime density. Creature colors remain distinct from the ground.
- Enemies remain immersed: slime covers lower limbs and bellies, stretches between them and the terrain, and closes behind them.
- Use the supplied worm silhouette as the new Leech form and the broad armored organism as the new Carapacid form. Reference lettering supplies no game mechanics or lore.
- Preserve the approved Forager anatomy.
- Make the ancient Gate monumental and move its aperture onto the final lane endpoint so the path enters it. Surrounding architecture should look ancient and stand upright in the map's projection; it must not look laid flat on the terrain. Exact placement must preserve build slots and the route.
- The new swamp creature photograph is a general reference for environment/creature symbiosis, submerged contact and hanging slime. It does not request a new spider unit or human remains.

The player selected **v1 as the preferred base**, explicitly approving its platform height and texture density. The requested palette and portal changes are shown in v3 for review; v3 has not yet received a final visual verdict.

## Original user references

- [Ancient Gate](references/ancient-gate-user-v1.png): scale, weathered structure and ancient energy technology.
- [Leech](references/leech-maw-user-v1.png): low worm, round toothed maw, wet strands.
- [Carapacid](references/carapacid-mass-user-v1.png): broad body, porous dark plates, viscous dripping tissue.
- [General swamp symbiosis](references/swamp-symbiosis-user-v1.png): added to the shared reference collection, original unchanged. Its muted lighting is not a replacement for the requested bright world palette.
- [Approved Forager master](references/forager-approved-v1.webp): anatomy and material identity.

User-provided images are visual references. Authorship and redistribution rights are not established here; they are not shipped by the runtime.

## Generated concepts

Generated with the built-in imagegen tool from the current native-rendered game frame and the supplied visual references.

- [First concept](studies/organic-world-direction-v1.png), [exact prompt](organic-world-direction-v1.prompt.txt).
- [Revised concept](studies/organic-world-direction-v2.png), [exact revision prompt](organic-world-direction-v2.prompt.txt).
- [Green–umber–brown revision of the preferred first concept](studies/organic-world-direction-v3.png), [exact prompt](organic-world-direction-v3.prompt.txt).

V2 lowered platforms based on the assistant's judgment. The player preferred v1 and explicitly retained its height and dense texture, superseding that judgment. V3 edits v1 directly: greener/browner terrain, a single portal whose threshold meets the final approach, and upright weathered architecture.

Limitations for review: these are generated concepts, not runtime captures or placement blueprints. V3 visually brings the approach into the portal, but its enlarged ruins obscure/replace some right-hand platforms and machinery. The final implementation must preserve real build slots, tower identity and route endpoint, arranging the architecture around them. Dense texture and height are intentional player choices; units and combat effects still need a readability check at phone scale. The concepts contain no animation proof.

## Next implementation boundary

Review overall brightness, material balance and creature silhouettes first. Then separate construction/readiness rules (simulation and replay compatibility) from terrain, Gate, platforms, pause animation and creature art (presentation). Do not silently re-stamp old replays as compatible with new construction rules.
