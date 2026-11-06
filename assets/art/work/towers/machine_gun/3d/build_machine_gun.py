# Machine Gun - full rebuild from primitives (docs/art-3d-parts.md, item 13). Builds a new empty file, nothing else is read
# except the platform mesh data and the palette from this repo; the Meshy reference is never opened here.
#   blender -b --python assets/art/work/towers/machine_gun/3d/build_machine_gun.py          (from the repo root)
# Writes machine_gun_static.glb and machine_gun_static_vc.glb next to this script (or into UTD_3D_OUT).
# Geometry is variant B: x1.10 along X and Z above the ring, Y unchanged (measured numbers of the reference, reference units).
import bpy
if bpy.app.version[:2] != (5, 2):
    raise RuntimeError('Blender 5.2 required (tools/blender/README.md), running %s' % bpy.app.version_string)
import bmesh, math, os, json
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else None
REPO = os.environ.get('UTD_REPO') or (os.path.abspath(os.path.join(HERE, *['..'] * 6)) if HERE else os.getcwd())
OUT = os.environ.get('UTD_3D_OUT') or (HERE or os.getcwd())
TOOLS = os.path.join(REPO, 'tools', 'blender')
PLATFORM = os.path.join(REPO, 'assets/art/work/towers/platform/3d/platform_mesh.json')
PALETTE = os.path.join(REPO, 'assets/art/work/style/palette.json')
def tool(name):
    ns = {'__name__': 'tool_' + name}; exec(compile(open(os.path.join(TOOLS, name)).read(), name, 'exec'), ns); return ns

Z0 = 0.424
SX = SZ = 1.10
PY, PZ, CX = -0.20, 0.98, 0.57           # trunnion y/z, barrel-bundle axis |x| (reference units)
DENSITY = 300                            # head texel density, px/m on the 2K atlas
MATN = ('graphite_frame', 'olive_plate', 'steel_dark', 'brass_band', 'orange_accent', 'teal_indicator')
GRAPH, OLIVE, STEEL, BRASS, ORANGE, TEAL = range(6)
# surface parameters of the zone materials (colours come from palette.json): roughness, metallic
MAT_PARAMS = {'graphite_frame': (0.55, 0.35), 'olive_plate': (0.7, 0.0), 'steel_dark': (0.45, 0.7),
              'brass_band': (0.4, 0.8), 'orange_accent': (0.5, 0.0), 'teal_indicator': (0.3, 0.0)}
# deploy clip: 30 fps, 46 frames; keys (frame, degrees); the key that starts a move eases in-out
CLIP = {'head_root': (2, [(1, -90), (24, -90), (39, 0), (46, 0)], 24),
        'pivot_L':   (0, [(1, 90), (6, 90), (23, 0), (46, 0)], 6),
        'pivot_R':   (0, [(1, 90), (7, 90), (24, 0), (46, 0)], 7)}

def P(x, y, z): return Vector((x * SX, y, Z0 + (z - Z0) * SZ))
def R(r): return r * SX

# ---------------- primitives ----------------
def _mi(bm, mi):
    for f in bm.faces: f.material_index = mi
    return bm

def bevel(bm, w, ang=30):
    bm.normal_update()
    es = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(ang)]
    if w > 0 and es: bmesh.ops.bevel(bm, geom=es, offset=w, offset_type='OFFSET', segments=1, profile=0.5, affect='EDGES', clamp_overlap=True)
    return bm

def prism_yz(prof, x0, x1, mi, w=0.0):
    bm = bmesh.new()
    A = [bm.verts.new(P(x0, y, z)) for y, z in prof]; B = [bm.verts.new(P(x1, y, z)) for y, z in prof]; n = len(A)
    bm.faces.new(A); bm.faces.new(B[::-1])
    for i in range(n): bm.faces.new((A[i], A[(i + 1) % n], B[(i + 1) % n], B[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bevel(_mi(bm, mi), w)

def box(x0, x1, y0, y1, z0, z1, mi, w=0.0):
    x0, x1 = min(x0, x1), max(x0, x1)
    return prism_yz([(y0, z0), (y1, z0), (y1, z1), (y0, z1)], x0, x1, mi, w)

def lathe(prof, n, mi):
    bm = bmesh.new()
    rings = [[bm.verts.new(Vector((R(r) * math.cos(2 * math.pi * i / n), R(r) * math.sin(2 * math.pi * i / n), Z0 + (z - Z0) * SZ))) for i in range(n)] for r, z in prof]
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    for A, B in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((A[i], A[(i + 1) % n], B[(i + 1) % n], B[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _mi(bm, mi)

def cyl(c, axis, r, h0, h1, n, mi, ch=0.0, mi_h1=None):
    """closed cylinder; c in reference units, h0/h1 offsets along the axis (final units), optional end chamfer; mi_h1 = material of the h1 cap"""
    bm = bmesh.new(); c = P(*c); ax = Vector(axis).normalized(); u = ax.orthogonal().normalized(); w = ax.cross(u); r = R(r)
    prof = [(r - ch, h0), (r, h0 + ch), (r, h1 - ch), (r - ch, h1)] if ch else [(r, h0), (r, h1)]
    rings = [[bm.verts.new(c + ax * h + (u * math.cos(2 * math.pi * i / n) + w * math.sin(2 * math.pi * i / n)) * rr) for i in range(n)] for rr, h in prof]
    bm.faces.new(rings[0][::-1]); end = bm.faces.new(rings[-1])
    for A, B in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((A[i], A[(i + 1) % n], B[(i + 1) % n], B[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    _mi(bm, mi)
    if mi_h1 is not None: end.material_index = mi_h1
    return bm

def to_obj(bm, name, col):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in MATN: me.materials.append(bpy.data.materials[m])
    o = bpy.data.objects.new(name, me); col.objects.link(o); return o

def apply_mods(o):
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); old = o.data
    o.modifiers.clear(); o.data = me; bpy.data.meshes.remove(old)

def union(name, col, bms):
    objs = [to_obj(b, name + '_p%d' % i, col) for i, b in enumerate(bms)]
    base = objs[0]
    for o in objs[1:]:
        md = base.modifiers.new('u', 'BOOLEAN'); md.operation = 'UNION'; md.object = o; md.solver = 'EXACT'; md.material_mode = 'TRANSFER'
        apply_mods(base); me = o.data; bpy.data.objects.remove(o); bpy.data.meshes.remove(me)
    bm = bmesh.new(); bm.from_mesh(base.data); bmesh.ops.dissolve_degenerate(bm, dist=1e-5, edges=bm.edges); bm.to_mesh(base.data); bm.free()
    base.name = name; base.data.name = name; return base

def join(name, col, bms):
    """several closed shells in one mesh, no boolean (overlaps hidden inside a shell: barrels through clamps)"""
    me = bpy.data.meshes.new(name); out = bmesh.new()
    for b in bms:
        tmp = bpy.data.meshes.new('tmp'); b.to_mesh(tmp); b.free(); out.from_mesh(tmp); bpy.data.meshes.remove(tmp)
    out.to_mesh(me); out.free()
    for m in MATN: me.materials.append(bpy.data.materials[m])
    o = bpy.data.objects.new(name, me); col.objects.link(o); return o

# ---------------- parts ----------------
def head_parts():
    yield lathe([(0.272, 0.421), (0.272, 0.452), (0.248, 0.476), (0.205, 0.50), (0.205, 0.62), (0.25, 0.665), (0.30, 0.715)], 24, GRAPH)  # yoke
    yield lathe([(0.205, 0.545), (0.222, 0.552), (0.222, 0.588), (0.205, 0.595)], 24, BRASS)                                             # yoke band
    yield prism_yz([(-0.48, 0.70), (0.32, 0.70), (0.36, 0.78), (0.40, 0.92), (0.40, 1.10), (0.26, 1.22), (0.20, 1.30),
                    (-0.80, 1.30), (-0.89, 1.20), (-0.89, 0.94), (-0.76, 0.88), (-0.76, 0.78)], -0.40, 0.40, OLIVE, 0.025)              # body
    yield box(-0.415, 0.415, -0.86, 0.405, 0.90, 0.94, GRAPH, 0.01)                   # graphite belt line
    for s in (-1, 1):
        yield box(s * 0.385, s * 0.42, -0.46, 0.06, 0.80, 1.17, GRAPH, 0.012)         # side trunnion mount plate
    yield box(-0.22, 0.22, -0.68, -0.20, 1.28, 1.52, OLIVE, 0.02)                      # roof box
    yield box(-0.20, 0.20, -0.66, -0.22, 1.515, 1.552, GRAPH, 0.01)                    # roof box lid frame
    yield box(-0.14, 0.14, -0.04, 0.24, 1.28, 1.50, GRAPH, 0.015)                      # sensor mast
    for s in (-1, 1):
        yield box(s * 0.025, s * 0.095, 0.23, 0.255, 1.41, 1.46, TEAL)                 # lenses
    yield box(-0.29, -0.15, -0.04, 0.08, 1.28, 1.62, GRAPH, 0.01)                      # sight bracket

def gun_parts(s):
    yield box(s * 0.44, s * 0.715, -0.60, 0.24, 0.78, 1.18, GRAPH, 0.025)              # receiver core
    yield box(s * 0.70, s * 0.74, -0.56, 0.20, 0.80, 1.16, OLIVE, 0.012)               # outer armour plate
    yield box(s * 0.47, s * 0.70, -0.52, -0.02, 1.17, 1.225, OLIVE, 0.015)             # top hump
    yield box(s * 0.50, s * 0.62, 0.10, 0.22, 1.17, 1.21, ORANGE, 0.008)               # accent block
    # no cradle: rails, post and X-brace hid the barrels from the 49.4 deg game camera
    # (visible barrel px at 160: 439 with X-brace and full rails -> 765 without any cradle)

def spin_parts(s):
    c = (s * CX, 0.0, PZ)
    yield cyl(c, (0, 1, 0), 0.135, 0.237, 0.40, 24, STEEL, 0.01)                       # rear hub, 3 mm into the receiver
    yield cyl(c, (0, 1, 0), 0.125, 0.56, 0.60, 16, BRASS, 0.006)                       # mid clamp
    yield cyl(c, (0, 1, 0), 0.125, 0.76, 0.80, 16, BRASS, 0.006)                       # front clamp
    for k in range(6):
        a = 2 * math.pi * k / 6 + math.pi / 6
        yield cyl((s * CX + 0.085 * math.cos(a), 0.0, PZ + 0.085 * math.sin(a)), (0, 1, 0), 0.03, 0.39, 0.84, 16, STEEL, mi_h1=BRASS)  # barrel, brass muzzle face

# ---------------- assembly ----------------
WL = {}
def place(o, world, parent):
    o.parent = parent; o.matrix_parent_inverse = Matrix(); o.location = Vector(world) - (WL[parent.name] if parent else Vector()); WL[o.name] = Vector(world)
    return o
def set_origin(o, world): o.data.transform(Matrix.Translation(-Vector(world)))
def empty(name, col, world, parent, size=0.08):
    e = bpy.data.objects.new(name, None); e.empty_display_type = 'ARROWS'; e.empty_display_size = size; col.objects.link(e); return place(e, world, parent)

def materials():
    for name in MATN:
        m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Roughness'].default_value, b.inputs['Metallic'].default_value = MAT_PARAMS[name]

def platform(col, parent):
    D = json.load(open(PLATFORM)); me = bpy.data.meshes.new('platform')
    me.from_pydata([tuple(v) for v in D['verts']], [], [tuple(p) for p in D['polys']])
    for m in D['materials']: me.materials.append(bpy.data.materials[m])
    me.polygons.foreach_set('material_index', D['material_index'])
    uv = me.uv_layers.new(name='UVMap'); flat = [c for p in D['loop_uv'] for c in p]; uv.data.foreach_set('uv', flat)
    me.update(); o = bpy.data.objects.new('platform', me); col.objects.link(o); return place(o, (0, 0, 0), parent)

def build_scene():
    bpy.ops.wm.read_homefile(use_empty=True)
    sc = bpy.context.scene; sc.name = 'mg_build'; col = sc.collection; WL.clear()
    sc.render.fps = 30; sc.frame_start = 1; sc.frame_end = 46
    materials()
    root = empty('tower_root', col, (0, 0, 0), None)
    platform(col, root)
    hr = empty('head_root', col, (0, 0, Z0), root)
    h = union('head', col, list(head_parts())); set_origin(h, (0, 0, Z0)); place(h, (0, 0, Z0), hr)
    for side, s in (('L', -1), ('R', 1)):                    # L = -X looking along the barrels (+Y)
        o = P(s * 0.44, PY, PZ)
        ax = to_obj(cyl((0, PY, PZ), (1, 0, 0), 0.07, s * 0.39 * SX, s * 0.443 * SX, 24, STEEL), 'axle_' + side, col); set_origin(ax, o); place(ax, o, hr)
        piv = empty('pivot_' + side, col, o, hr)
        bu = to_obj(cyl((0, PY, PZ), (1, 0, 0), 0.105, s * 0.4245 * SX, s * 0.443 * SX, 24, BRASS), 'bushing_' + side, col); set_origin(bu, o); place(bu, o, piv)
        g = union('gun_' + side, col, list(gun_parts(s))); set_origin(g, o); place(g, o, piv)
        c = P(s * CX, 0.237, PZ)
        sp = join('barrel_spin_' + side, col, list(spin_parts(s))); set_origin(sp, c); place(sp, c, piv)
        empty('muzzle_' + side, col, P(s * CX, 0.84, PZ), piv)
        empty('recoil_axis_' + side, col, P(s * CX, 0.24, PZ), piv)
    return sc

def clip():
    act = bpy.data.actions.new('deploy')
    for n, (ax, keys, ease_from) in CLIP.items():
        o = bpy.data.objects[n]; o.rotation_mode = 'XYZ'; ad = o.animation_data_create(); ad.action = act
        for f, deg in keys:
            r = [0.0, 0.0, 0.0]; r[ax] = math.radians(deg); o.rotation_euler = r; o.keyframe_insert('rotation_euler', frame=f)
        for lay in act.layers:
            for st in lay.strips:
                for fc in st.channelbag(ad.action_slot).fcurves:
                    for k in fc.keyframe_points:
                        if int(round(k.co[0])) == ease_from: k.interpolation = 'CUBIC'; k.easing = 'EASE_IN_OUT'
                        else: k.interpolation = 'LINEAR'
                    fc.update()

def uv(sc):
    U = tool('lib_uv_tower.py')
    U['HEAD'][:] = ['head', 'axle_L', 'axle_R', 'bushing_L', 'bushing_R', 'gun_L', 'gun_R', 'barrel_spin_L', 'barrel_spin_R']
    U['unwrap'](sc, 66); U['normalise'](sc)
    occ = U['occupancy_from'](['platform'], pad=8); isl = U['collect_islands'](U['HEAD'])
    place_ = U['try_pack'](isl, occ, DENSITY)
    if not place_: raise RuntimeError('head UV does not fit at %d px/m' % DENSITY)
    U['apply_pack'](isl, place_, DENSITY)
    clash = U['raster'](sc, pad=4)[0]
    if clash: raise RuntimeError('UV islands closer than 8 px: %d texels' % clash)

def main():
    sc = build_scene()
    tool('sync_palette.py')['sync'](PALETTE)
    sc.frame_set(46); uv(sc)
    clip(); sc.frame_set(46)
    C = tool('check_tower.py'); rows = C['check_clip'](sc, C['DESIGNED_MG'])
    bad = [(r['frame'], r['intersections']) for r in rows if r['intersections']]
    if bad: raise RuntimeError('intersections in the deploy clip: %s' % bad[:5])
    print('clip: 0 intersections over %d frames, min gap %.1f mm' % (len(rows), min(r['min_gap_mm'] for r in rows)))
    E = tool('export_tower.py')
    for vc in (False, True): E['export'](E['CFG_MACHINE_GUN'], vc=vc, out=OUT.rstrip('/') + '/')

main()
