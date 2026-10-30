`rejected-copper-pedestal-v1.png` is the unmodified 256x256 Howitzer cell at
(0,1024) from `assets/hunger-level4-towers-v2.png` in PR #69 commit d022ae3.
It pins the actual rejected broad copper foot for the mounting-peg regression.
Tests load this file directly, without relying on Git history.

`before-0c78db1-row.png` is the unmodified 4096x256 Howitzer row at (0,1024)
from the color-graded runtime atlas in main 0c78db1. The capture helper overlays
this row onto the seven current-main rows for a faithful pre-fix atlas.
The matching source is pinned at `../history/0c78db1/prototype/index.html.gz`.
