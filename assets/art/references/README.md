# Art references

User-supplied references and rejected looks, grouped by the object they describe. Generated sources, studies and prompts live in `../work/` under the same layout; files the game loads live in `../../runtime/`. See `../../README.md` for the rules.

```
style/            palette, mood and lighting that apply to everything
world/gate/       the ancient Gate
world/lane/       the creep lane
world/platforms/  raised concrete build pads
world/terrain/    swamp ground and tissue
enemies/<caste>/  one folder per Hunger caste (forager, leech, carapacid, ...)
towers/<type>/    one folder per tower type; a tower's weapon belongs with its tower
ui/               HUD, menus, documents
```

A separate `weapons/` folder is created only if a weapon becomes an object of its own (swapped between towers or carried by infantry).

## Naming

`<object>-<aspect>-<user|approved|rejected>-v<N>.<ext>`, for example `ancient-gate-top-user-v1.png`. Keep the object name in the file name even inside its folder: files get dragged into chats, Canva and Blender and must keep their context. Aspects: `top`, `side`, `motion`, `detail`, `material`; omit when the reference is general.

- `user` — supplied by the player/designer.
- `approved` — a look accepted as canon.
- `rejected` — a look that was turned down. Rejected images stay next to the references of the same object as a visual blacklist.

## Notes

Each object folder may contain `notes.md`: what to take from each reference and what not to take. A reference without a note tends to be read as "make it look like this".

## Weight

The repository is public and Git keeps every version forever. References do not need lossless quality: save new ones as WebP or JPEG, at most 1600 px on the long side. The same rule covers studies and report captures; see `../../README.md`. Existing files are not recompressed, because rewriting them would add bytes to history, not remove them.
