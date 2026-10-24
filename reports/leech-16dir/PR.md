Leech previously selected four headings and snapped between front and side views on the curved route. Bake 16 headings from the cardinal/diagonal four-phase sheets and use them in creatureCrawlPose; Carapacid remains unchanged.

Adds per-frame belly-support JSON, a configurable one-command bake, lossless encoding and matte-edge cleanup. JSON is prepared for later contact effects; this PR does not integrate those effects or change simulation/balance.

Validation: full npm test passed; deterministic rebuild, all 64 cells/contacts, matte negative control, and native before/after route captures plus complete gait cycle. See reports/leech-16dir/README.md for images and limitations. Independent visual review before merge remains pending.
