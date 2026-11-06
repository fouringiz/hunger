# Head UV for tower models (docs/art-3d-parts.md, item 11).
# The platform keeps its unwrap (the Turret one); head objects are unwrapped, normalised to one texel density
# and packed by our own rectangle packer into the free space around the platform islands.
# Grabli: bpy.ops.uv.pack_islands(pin=True, pin_method='LOCKED') does NOT keep pinned islands clear - it packed head
# islands over the platform. Hence occupancy_from() + try_pack() + apply_pack().
# Usage: set HEAD[:] = [head object names], then unwrap(sc, 66); normalise(sc); occ = occupancy_from(['platform']);
#        isl = collect_islands(HEAD); place = try_pack(isl, occ, dens); apply_pack(isl, place, dens); raster(sc) -> clash 0.
import bpy
if bpy.app.version[:2] != (5, 2):
    raise RuntimeError('Blender 5.2 required (tools/blender/README.md), running %s' % bpy.app.version_string)
import bmesh, math, numpy as np
from mathutils import Vector, Matrix, geometry
from mathutils.bvhtree import BVHTree

HEAD = []                      # head object names of the tower being unwrapped
SKIP = ('REF_', 'TUR_', 'CMP_')  # objects that never take part (reference, comparison copies)
DOWN_SCALE = {'head': 0.25}    # static head: faces looking down (n.z < -0.65) are never seen from the 49.4 deg game camera

def area_uv(f, uv):
    p = [l[uv].uv for l in f.loops]; return abs(sum(p[i].x * p[(i + 1) % len(p)].y - p[(i + 1) % len(p)].x * p[i].y for i in range(len(p)))) / 2

def uv_islands(bm, uv):
    parent = {f.index: f.index for f in bm.faces}
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for e in bm.edges:
        if len(e.link_faces) != 2: continue
        f1, f2 = e.link_faces; ok = True
        for v in e.verts:
            u1 = [l[uv].uv for l in f1.loops if l.vert == v][0]; u2 = [l[uv].uv for l in f2.loops if l.vert == v][0]
            if (u1 - u2).length > 1e-7: ok = False
        if ok: parent[find(f1.index)] = find(f2.index)
    g = {}
    for f in bm.faces: g.setdefault(find(f.index), []).append(f)
    return list(g.values())

def shells_world(sc):
    """BVH per closed shell of every tower mesh, world space (combat pose)"""
    out = []
    for o in sc.objects:
        if o.type != 'MESH' or o.name.startswith(SKIP): continue
        bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world); bm.faces.ensure_lookup_table(); bm.verts.ensure_lookup_table()
        seen = set()
        for f0 in bm.faces:
            if f0.index in seen: continue
            st = [f0]; fs = []
            while st:
                f = st.pop()
                if f.index in seen: continue
                seen.add(f.index); fs.append(f); st += [g for e in f.edges for g in e.link_faces]
            verts = sorted({v.index for f in fs for v in f.verts}); idx = {v: i for i, v in enumerate(verts)}
            out.append((o.name, {f.index for f in fs}, BVHTree.FromPolygons([bm.verts[v].co.copy() for v in verts], [[idx[v.index] for v in f.verts] for f in fs])))
        bm.free()
    return out

def _inside(t, p):
    hits = 0; q = p.copy(); dirv = Vector((0.577, 0.613, 0.539)).normalized()
    for _ in range(32):
        h = t.ray_cast(q, dirv)
        if h[0] is None: break
        hits += 1; q = h[0] + dirv * 1e-5
    return hits % 2 == 1

def hidden_faces(o, shells, eps=0.002):
    """faces where >= 60% of sample points (centre + 4 points 70% towards the corners), pushed 2 mm out, lie inside another closed shell"""
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world); bm.faces.ensure_lookup_table(); hid = set()
    for f in bm.faces:
        c = f.calc_center_median(); vs = [v.co for v in f.verts]
        pts = [c] + [c + (vs[int(k * len(vs) / 4)] - c) * 0.7 for k in range(4)]
        n_in = 0
        for p in pts:
            p = p + f.normal * eps
            for name, fset, t in shells:
                if name == o.name and f.index in fset: continue
                loc, nrm, i, d = t.find_nearest(p)
                if loc is not None and d < 0.5 and (p - loc).dot(nrm) < 0 and _inside(t, p): n_in += 1; break
        if n_in >= 0.6 * len(pts): hid.add(f.index)
    bm.free(); return hid

def unwrap(sc, angle=66):
    for o in sc.objects: o.select_set(o.name in HEAD)
    bpy.context.view_layer.objects.active = bpy.data.objects[HEAD[0]]
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')

def normalise(sc):
    """every island to 1 UV unit = 1 m; hidden islands x0.05; down-facing islands of the static head x DOWN_SCALE"""
    shells = shells_world(sc); rep = {}
    for n in HEAD:
        o = bpy.data.objects[n]; hid = hidden_faces(o, shells)
        bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table(); uv = bm.loops.layers.uv.active; S = o.matrix_world.to_scale()[0]
        isl = uv_islands(bm, uv); shr = 0
        for fs in isl:
            A = sum(f.calc_area() for f in fs) * S * S; U = sum(area_uv(f, uv) for f in fs)
            if A < 1e-10 or U < 1e-14: continue
            s = math.sqrt(A / U)
            if sum(f.calc_area() for f in fs if f.index in hid) * S * S > 0.9 * A: s *= 0.05; shr += 1
            elif n in DOWN_SCALE:
                M3 = o.matrix_world.to_3x3()
                if sum(f.calc_area() for f in fs if (M3 @ f.normal).normalized().z < -0.65) * S * S > 0.9 * A: s *= DOWN_SCALE[n]
            loops = [l for f in fs for l in f.loops]; c = sum((l[uv].uv for l in loops), Vector((0, 0))) / len(loops)
            for l in loops: l[uv].uv = c + (l[uv].uv - c) * s
        bm.to_mesh(o.data); bm.free(); rep[n] = (len(isl), shr, len(hid))
    return rep

def density(names):
    out = {}
    for n in names:
        o = bpy.data.objects[n]; bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world); uv = bm.loops.layers.uv.active
        A = sum(f.calc_area() for f in bm.faces); U = sum(area_uv(f, uv) for f in bm.faces); bm.free(); out[n] = (round(math.sqrt(U / A) * 2048), U)
    return out

def _tri_mask(a, b, c, X, Y, pad):
    sg = 1 if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) >= 0 else -1; ok = np.ones(X.shape, bool)
    for p, q in ((a, b), (b, c), (c, a)):
        L = max((q - p).length, 1e-9); ok &= sg * ((q.x - p.x) * (Y - p.y) - (q.y - p.y) * (X - p.x)) / L >= -pad
    return ok

def raster(sc, res=2048, pad=4):
    """island id per texel, each island dilated by pad px (islands closer than 2*pad px clash); returns (clashing texels, islands, coverage, pairs)"""
    grid = np.full((res, res), -1, np.int32); clash = 0; iid = 0; pairs = set()
    for o in sc.objects:
        if o.type != 'MESH' or o.name.startswith(SKIP): continue
        bm = bmesh.new(); bm.from_mesh(o.data); uv = bm.loops.layers.uv.active
        if uv is None: bm.free(); continue
        for fs in uv_islands(bm, uv):
            tris = []
            for f in fs:
                pts = [l[uv].uv * res for l in f.loops]; tris += [(pts[0], pts[k], pts[k + 1]) for k in range(1, len(pts) - 1)]
            xs = [p.x for t in tris for p in t]; ys = [p.y for t in tris for p in t]
            X0 = max(int(min(xs)) - pad - 1, 0); X1 = min(int(max(xs)) + pad + 2, res); Y0 = max(int(min(ys)) - pad - 1, 0); Y1 = min(int(max(ys)) + pad + 2, res)
            m = np.zeros((Y1 - Y0, X1 - X0), bool)
            for a, b, c in tris:
                x0 = max(int(min(a.x, b.x, c.x)) - pad, X0); x1 = min(int(max(a.x, b.x, c.x)) + pad + 1, X1)
                y0 = max(int(min(a.y, b.y, c.y)) - pad, Y0); y1 = min(int(max(a.y, b.y, c.y)) + pad + 1, Y1)
                if x1 <= x0 or y1 <= y0: continue
                X, Y = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
                m[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] |= _tri_mask(a, b, c, X, Y, pad)
            sub = grid[Y0:Y1, X0:X1]; hit = (sub >= 0) & m
            if hit.any():
                clash += int(hit.sum())
                for other in np.unique(sub[hit]): pairs.add((o.name, int(other)))
            sub[m & (sub < 0)] = iid; iid += 1
        bm.free()
    return clash, iid, float((grid >= 0).mean()), sorted(pairs)[:10]

def occupancy_from(names, res=2048, pad=8):
    """texels covered by islands of the given objects, dilated by pad px"""
    occ = np.zeros((res, res), bool)
    for n in names:
        o = bpy.data.objects[n]; bm = bmesh.new(); bm.from_mesh(o.data); uv = bm.loops.layers.uv.active
        for f in bm.faces:
            pts = [l[uv].uv * res for l in f.loops]
            for k in range(1, len(pts) - 1):
                a, b, c = pts[0], pts[k], pts[k + 1]
                x0 = max(int(min(a.x, b.x, c.x)) - pad, 0); x1 = min(int(max(a.x, b.x, c.x)) + pad + 1, res)
                y0 = max(int(min(a.y, b.y, c.y)) - pad, 0); y1 = min(int(max(a.y, b.y, c.y)) + pad + 1, res)
                if x1 <= x0 or y1 <= y0: continue
                X, Y = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
                occ[y0:y1, x0:x1] |= _tri_mask(a, b, c, X, Y, pad)
        bm.free()
    return occ

def collect_islands(names):
    """islands of head objects, rotated to their min-area box; UV units = metres (after normalise)"""
    out = []
    for n in names:
        o = bpy.data.objects[n]; bm = bmesh.new(); bm.from_mesh(o.data); uv = bm.loops.layers.uv.active
        for fs in uv_islands(bm, uv):
            loops = [l for f in fs for l in f.loops]; pts = [l[uv].uv.copy() for l in loops]
            ang = geometry.box_fit_2d(pts); R2 = Matrix.Rotation(ang, 2); q = [R2 @ p for p in pts]
            mnx = min(p.x for p in q); mny = min(p.y for p in q); w = max(p.x for p in q) - mnx; h = max(p.y for p in q) - mny
            if h > w: q = [Vector((p.y, -p.x)) for p in q]; mnx = min(p.x for p in q); mny = min(p.y for p in q); w, h = h, w
            out.append(dict(obj=n, idx=[(f.index, i) for f in fs for i, _ in enumerate(f.loops)], local=[Vector((p.x - mnx, p.y - mny)) for p in q], w=w, h=h))
        bm.free()
    return out

def try_pack(isl, occ0, dens, res=2048, pad=8, cell=2):
    """bottom-left rectangle packing on a cell grid; returns placements or None if it does not fit at this density"""
    G = occ0.reshape(res // cell, cell, res // cell, cell).any(axis=(1, 3)).copy(); place = []
    for i in sorted(range(len(isl)), key=lambda i: -isl[i]['h']):
        w = int(math.ceil((isl[i]['w'] * dens + pad) / cell)); h = int(math.ceil((isl[i]['h'] * dens + pad) / cell)); best = None
        for ww, hh, rot in ((w, h, False), (h, w, True)):
            if ww > G.shape[1] or hh > G.shape[0]: continue
            S = np.zeros((G.shape[0] + 1, G.shape[1] + 1), np.int32); S[1:, 1:] = G.cumsum(0).cumsum(1)
            box = S[hh:, ww:] - S[:-hh, ww:] - S[hh:, :-ww] + S[:-hh, :-ww]
            free = np.argwhere(box == 0)
            if len(free):
                y, x = free[np.lexsort((free[:, 1], free[:, 0]))[0]]
                if best is None or (y, x) < (best[0], best[1]): best = (y, x, ww, hh, rot)
        if best is None: return None
        y, x, ww, hh, rot = best; G[y:y + hh, x:x + ww] = True; place.append((i, x * cell + pad / 2, y * cell + pad / 2, rot))
    return place

def apply_pack(isl, place, dens, res=2048):
    by = {}
    for i, x, y, rot in place: by.setdefault(isl[i]['obj'], []).append((i, x, y, rot))
    for n, lst in by.items():
        o = bpy.data.objects[n]; bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table(); uv = bm.loops.layers.uv.active
        for i, x, y, rot in lst:
            I = isl[i]
            for (fi, li), p in zip(I['idx'], I['local']):
                q = Vector((I['h'] - p.y, p.x)) if rot else p
                bm.faces[fi].loops[li][uv].uv = Vector(((x + q.x * dens) / res, (y + q.y * dens) / res))
        bm.to_mesh(o.data); bm.free()
