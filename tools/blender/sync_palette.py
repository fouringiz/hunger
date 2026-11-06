# Sync the Blender zone materials to palette.json - the single colour canon (docs/art-3d-parts.md, item 10).
# Usage inside Blender:  exec(open('<repo>/tools/blender/sync_palette.py').read()); sync('<repo>/assets/art/work/style/palette.json')
import bpy
if bpy.app.version[:2] != (5, 2):
    raise RuntimeError('Blender 5.2 required (tools/blender/README.md), running %s' % bpy.app.version_string)
import json, os

def _lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def sync(path=None):
    path = path or os.path.join(os.environ.get('UTD_REPO', os.getcwd()), 'assets/art/work/style/palette.json')
    P = json.load(open(path)); out = {}
    for zone, role in P['zones'].items():
        b = bpy.data.materials[zone].node_tree.nodes['Principled BSDF']; c = _lin(P['roles'][role]['hex'])
        old = tuple(b.inputs['Base Color'].default_value)[:3]
        b.inputs['Base Color'].default_value = (*c, 1.0)
        if zone == 'teal_indicator': b.inputs['Emission Color'].default_value = (*c, 1.0)
        if zone in P.get('emission_strength', {}): b.inputs['Emission Strength'].default_value = P['emission_strength'][zone]
        out[zone] = (P['roles'][role]['hex'], max(abs(a - n) for a, n in zip(old, c)))
    return out
