#!/bin/sh
# Copies the accepted tower exports into models/ from a pinned repo commit.
# models/*.glb is gitignored; the committed models/*.glb.import files carry the import settings.
set -eu
REV=${1:-0439b45}
cd "$(dirname "$0")"
mkdir -p models
for f in turret/3d/turret_static turret/3d/turret_static_vc machine_gun/3d/machine_gun_static machine_gun/3d/machine_gun_static_vc; do
  git show "$REV:assets/art/work/towers/$f.glb" > "models/$(basename "$f").glb"
done
echo "models from $REV:"; ls -l models/*.glb
