# Organic world — visual checkpoint

Status: **art-direction preview for player review**. No runtime changes in this checkpoint.

## Player decisions, 2026-10-22

- All new buildings must finish their 1.65-second deployment before becoming operational. Weapons cannot fire, generators cannot supply power, and Barracks cannot release soldiers during construction. The duration follows simulation time, including pause and speed controls. Upgrades do not restart initial construction. Existing resume warm-up remains separate.
- Pause should have visible machinery animation: retract/fold weapon barrels; extinguish or retract the upper Tesla assembly. This communicates the existing paused state.
- Buildings stand on modestly raised concrete platforms. The platform's lower edge sinks into the mire; the actual gun does not.
- Make the entire location an organic swamp, with saturated olive/brown peat, burgundy tissue, amber/yellow-green slime and clear wet highlights. The terrain should be brighter and more readable than the current dark lane.
- Enemies remain immersed: slime covers lower limbs and bellies, stretches between them and the terrain, and closes behind them.
- Use the supplied worm silhouette as the new Leech form and the broad armored organism as the new Carapacid form. Reference lettering supplies no game mechanics or lore.
- Preserve the approved Forager anatomy.
- Make the ancient Gate monumental. Explore placing its mass deeper in the scene rather than moving the path or build slots. Exact placement must be resolved against the game geometry.
- The new swamp creature photograph is a general reference for environment/creature symbiosis, submerged contact and hanging slime. It does not request a new spider unit or human remains.

These are implementation decisions from the player; the images below have **not** yet been approved as the final visual treatment.

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

The first draft over-raised the pads and duplicated the old Gate. The revision lowers platforms, removes the obsolete two-post gate and shifts terrain toward ochre/olive slime.

Limitations for review: this is a generated concept, not a runtime capture or a placement blueprint. The revision alters machinery near the exit, keeps a dense terrain pattern and does not reliably align the portal aperture to the final lane. The final implementation must preserve real build slots, tower identity and route endpoint; it must also keep units and combat effects readable at phone scale. The concept contains no animation proof.

## Next implementation boundary

Review overall brightness, material balance and creature silhouettes first. Then separate construction/readiness rules (simulation and replay compatibility) from terrain, Gate, platforms, pause animation and creature art (presentation). Do not silently re-stamp old replays as compatible with new construction rules.
