# Collision and clearance checks for a tower (docs/art-3d-parts.md, item 4). Run inside the working .blend.
# Usage:
#   exec(open('<repo>/tools/blender/check_tower.py').read())
#   rows = check_clip(bpy.data.scenes['mg_build'], DESIGNED_MG)   # every frame of the scene range
#   -> per frame: intersections (pairs that are not designed joints) and the minimum gap moving <-> static
import bpy
if bpy.app.version[:2] != (5, 2):
    raise RuntimeError('Blender 5.2 required (tools/blender/README.md), running %s' % bpy.app.version_string)
import math
from mathutils.bvhtree import BVHTree

SKIP = ('REF_', 'GAT_', 'CMP_')
MOVING = ('gun_', 'barrel_spin_', 'bushing_', 'side_')   # parts that move relative to the head body

# designed joints: these pairs overlap by 2-3 mm on purpose and are not reported as intersections
def designed(sides=('L', 'R'), extra=()):
    s = set()
    for k in sides:
        s |= {frozenset(p) for p in [('head', 'axle_' + k), ('axle_' + k, 'bushing_' + k), ('axle_' + k, 'gun_' + k),
                                     ('bushing_' + k, 'gun_' + k), ('barrel_spin_' + k, 'gun_' + k)]}
    s.add(frozenset(('platform', 'head')))
    return s | {frozenset(p) for p in extra}

DESIGNED_MG = designed()
DESIGNED_GATLING = designed(extra=[('axle_L', 'side_L'), ('axle_R', 'side_R'), ('bushing_L', 'side_L'), ('bushing_R', 'side_R')])

def meshes(sc):
    dg = bpy.context.evaluated_depsgraph_get(); W = {}
    for o in sc.objects:
        if o.type != 'MESH' or o.hide_viewport or o.name.startswith(SKIP): continue
        oe = o.evaluated_get(dg); me = oe.to_mesh(); M = oe.matrix_world
        W[o.name] = ([M @ v.co for v in me.vertices], [tuple(p.vertices) for p in me.polygons]); oe.to_mesh_clear()
    return W

def check_pose(sc, designed_pairs):
    """intersections that are not designed joints, and the smallest gap between a moving part and anything it does not move with"""
    W = meshes(sc); T = {n: BVHTree.FromPolygons(*W[n]) for n in W}; names = sorted(W)
    inter = []; gaps = []
    side = lambda n: n[-1] if n[-2:] in ('_L', '_R') else None
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            if frozenset((a, b)) in designed_pairs: continue
            if a.startswith(MOVING) and b.startswith(MOVING) and side(a) == side(b): continue   # rigid together
            ov = len(T[a].overlap(T[b]))
            if ov: inter.append((a, b, ov)); continue
            if a.startswith(MOVING) or b.startswith(MOVING):
                d = min(min(T[b].find_nearest(v)[3] for v in W[a][0]), min(T[a].find_nearest(v)[3] for v in W[b][0]))
                gaps.append((d, a, b))
    return inter, sorted(gaps)[:3]

def check_clip(sc, designed_pairs):
    bpy.context.window.scene = sc; rows = []
    for f in range(sc.frame_start, sc.frame_end + 1):
        sc.frame_set(f); inter, g = check_pose(sc, designed_pairs)
        rows.append(dict(frame=f, intersections=inter, min_gap_mm=round(g[0][0] * 1000, 1) if g else None, pair=(g[0][1], g[0][2]) if g else None))
    sc.frame_set(sc.frame_end)
    return rows
