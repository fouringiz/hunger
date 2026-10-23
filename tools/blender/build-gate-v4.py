
"""Ancient Gate v4: procedural ring built in game units, rendered through the game's own projection.

Run inside Blender: exec(open('tools/blender/build-gate-v4.py').read()); build(); render()
Game space: u = across the lane, d = depth along the lane (0 = mouth face), h = height.
Screen mapping is exactly gatePoint() in prototype/index.html:
  x = GATE.x - 16 + 0.70u + d,  y = GATE.y - 1.28 - 0.55u - 0.58h + 0.08d
"""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, noise

REPO = os.environ.get("HUNGER_REPO", "/Users/home/github/game")
GATE = (930.0, 420.0)
MOUTH = 16.0
SCALE = 2
RING = dict(center=78.0, outer=(52.0, 88.0), inner=(40.0, 76.0), depth=20.0)

# Rows 1-2 reproduce gatePoint(); row 3 only orders depth (front, west and higher are nearer).
PROJ = Matrix(((0.70, 1.00, 0.00), (0.55, -0.08, 0.58), (-0.60, -0.50, 1.00)))

def screen(u, d, h):
    return (GATE[0] - MOUTH + 0.70*u + d, GATE[1] - MOUTH*0.08 - 0.55*u - 0.58*h + 0.08*d)

def scene():
    sc = bpy.data.scenes.get("HungerGate") or bpy.data.scenes.new("HungerGate")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(sc.collection.children):
        bpy.data.collections.remove(c)
    return sc

def material(name, build):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    build(nt, out)
    return m

def stone_mat(name, base, moss, dark):
    def b(nt, out):
        L = nt.links
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        tc = nt.nodes.new("ShaderNodeTexCoord")
        img = nt.nodes.new("ShaderNodeTexImage")
        p = os.path.join(REPO, "assets/hunger-ancient-stone-v1.webp")
        if os.path.exists(p):
            img.image = bpy.data.images.load(p, check_existing=True)
        img.projection = "BOX"; img.projection_blend = 0.3
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.08, 0.08, 0.08)
        L.new(tc.outputs["Object"], mp.inputs["Vector"]); L.new(mp.outputs["Vector"], img.inputs["Vector"])
        nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.16; nz.inputs["Detail"].default_value = 12; nz.inputs["Roughness"].default_value = 0.62
        L.new(tc.outputs["Object"], nz.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.42; ramp.color_ramp.elements[0].color = (*dark, 1)
        ramp.color_ramp.elements[1].position = 0.62; ramp.color_ramp.elements[1].color = (*base, 1)
        L.new(nz.outputs["Fac"], ramp.inputs["Fac"])
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "OVERLAY"; mix.inputs["Factor"].default_value = 0.9
        L.new(ramp.outputs["Color"], mix.inputs[6]); L.new(img.outputs["Color"], mix.inputs[7])
        ao = nt.nodes.new("ShaderNodeAmbientOcclusion"); ao.inputs["Distance"].default_value = 6
        L.new(mix.outputs[2], ao.inputs["Color"])
        inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1.0
        L.new(ao.outputs["AO"], inv.inputs[1])
        mz = nt.nodes.new("ShaderNodeTexNoise"); mz.inputs["Scale"].default_value = 0.35; mz.inputs["Detail"].default_value = 6
        L.new(tc.outputs["Object"], mz.inputs["Vector"])
        mm = nt.nodes.new("ShaderNodeMath"); mm.operation = "MULTIPLY"; mm.use_clamp = True
        L.new(inv.outputs[0], mm.inputs[0]); L.new(mz.outputs["Fac"], mm.inputs[1])
        mm2 = nt.nodes.new("ShaderNodeMath"); mm2.operation = "MULTIPLY"; mm2.inputs[1].default_value = 3.4; mm2.use_clamp = True
        L.new(mm.outputs[0], mm2.inputs[0])
        moss_mix = nt.nodes.new("ShaderNodeMix"); moss_mix.data_type = "RGBA"
        moss_mix.inputs[7].default_value = (*moss, 1)
        L.new(mm2.outputs[0], moss_mix.inputs["Factor"]); L.new(ao.outputs["Color"], moss_mix.inputs[6])
        L.new(moss_mix.outputs[2], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.78
        bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.8
        vz = nt.nodes.new("ShaderNodeTexVoronoi"); vz.inputs["Scale"].default_value = 0.35
        L.new(tc.outputs["Object"], vz.inputs["Vector"])
        hmix = nt.nodes.new("ShaderNodeMath"); hmix.operation = "ADD"
        L.new(vz.outputs["Distance"], hmix.inputs[0]); L.new(nz.outputs["Fac"], hmix.inputs[1])
        L.new(hmix.outputs[0], bump.inputs["Height"]); L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        L.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return material(name, b)

def flat_mat(name, color, rough, emit=None, strength=0.0, spec=0.5):
    def b(nt, out):
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.inputs["Base Color"].default_value = (*color, 1)
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Specular IOR Level"].default_value = spec
        if emit:
            bsdf.inputs["Emission Color"].default_value = (*emit, 1)
            bsdf.inputs["Emission Strength"].default_value = strength
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return material(name, b)

def vortex_mat():
    def b(nt, out):
        L = nt.links
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["UV"], sep.inputs[0])
        flat = nt.nodes.new("ShaderNodeCombineXYZ"); L.new(sep.outputs["X"], flat.inputs[0]); L.new(sep.outputs["Y"], flat.inputs[1])
        ln = nt.nodes.new("ShaderNodeVectorMath"); ln.operation = "LENGTH"; L.new(flat.outputs[0], ln.inputs[0])
        at = nt.nodes.new("ShaderNodeMath"); at.operation = "ARCTAN2"
        L.new(sep.outputs["Y"], at.inputs[0]); L.new(sep.outputs["X"], at.inputs[1])
        sw = nt.nodes.new("ShaderNodeMath"); sw.operation = "MULTIPLY_ADD"; sw.inputs[1].default_value = 5.0
        L.new(ln.outputs["Value"], sw.inputs[0]); L.new(at.outputs[0], sw.inputs[2])
        cmb = nt.nodes.new("ShaderNodeCombineXYZ"); L.new(at.outputs[0], cmb.inputs[0]); L.new(sw.outputs[0], cmb.inputs[1])
        nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 1.6; nz.inputs["Detail"].default_value = 10; nz.inputs["Distortion"].default_value = 1.4
        L.new(cmb.outputs[0], nz.inputs["Vector"])
        r1 = nt.nodes.new("ShaderNodeMath"); r1.operation = "DIVIDE"; r1.inputs[1].default_value = 1.05
        L.new(ln.outputs["Value"], r1.inputs[0])
        ramp = nt.nodes.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
        cr.elements[0].position = 0.0; cr.elements[0].color = (0.80, 1.0, 1.0, 1)
        cr.elements[1].position = 1.0; cr.elements[1].color = (0.0, 0.01, 0.02, 1)
        e = cr.elements.new(0.22); e.color = (0.12, 0.78, 0.86, 1)
        e = cr.elements.new(0.52); e.color = (0.02, 0.30, 0.38, 1)
        e = cr.elements.new(0.80); e.color = (0.00, 0.06, 0.09, 1)
        add = nt.nodes.new("ShaderNodeMath"); add.operation = "MULTIPLY_ADD"; add.inputs[1].default_value = 0.45
        L.new(nz.outputs["Fac"], add.inputs[0]); L.new(r1.outputs[0], add.inputs[2])
        L.new(add.outputs[0], ramp.inputs["Fac"])
        em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 2.6
        L.new(ramp.outputs["Color"], em.inputs["Color"]); L.new(em.outputs[0], out.inputs["Surface"])
    return material("GateVortex", b)

def mesh_object(name, bm, mat, coll):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    return ob

def annulus(bm, ro, ri, d0, d1, t0, t1, n, c=RING["center"]):
    rows = []
    for k in range(n + 1):
        t = t0 + (t1 - t0) * k / n
        ct, st = math.cos(t), math.sin(t)
        rows.append([bm.verts.new((ro[0]*ct, d0, c + ro[1]*st)), bm.verts.new((ri[0]*ct, d0, c + ri[1]*st)),
                     bm.verts.new((ri[0]*ct, d1, c + ri[1]*st)), bm.verts.new((ro[0]*ct, d1, c + ro[1]*st))])
    for k in range(n):
        a, b = rows[k], rows[k + 1]
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(tuple(reversed(rows[0]))); bm.faces.new(tuple(rows[-1]))

def box(bm, u0, u1, d0, d1, h0, h1, taper=0.0):
    v = [bm.verts.new(p) for p in [(u0,d0,h0),(u1,d0,h0),(u1,d1,h0),(u0,d1,h0),
                                    (u0+taper,d0+taper,h1),(u1-taper,d0+taper,h1),(u1-taper,d1-taper,h1),(u0+taper,d1-taper,h1)]]
    for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:
        bm.faces.new([v[i] for i in f])

def weather(bm, amp=0.7, cuts=2, bevel=0.9, seed=0.0, freq=0.11):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=2, affect="EDGES", clamp_overlap=True)
    if cuts:
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=cuts, use_grid_fill=True)
    bm.normal_update()
    for v in bm.verts:
        p = v.co * freq + Vector((seed, seed * 0.7, 0))
        n = noise.fractal(p, 0.6, 2.1, 4)
        v.co -= v.normal * (abs(n) * amp)
    bm.normal_update()

def tube(bm, pts, r0, r1, sides=7):
    rings = []
    for i, p in enumerate(pts):
        a = Vector(pts[min(i+1, len(pts)-1)]) - Vector(pts[max(i-1, 0)])
        a.normalize(); side = a.cross(Vector((0, 1, 0)))
        if side.length < 1e-3: side = a.cross(Vector((1, 0, 0)))
        side.normalize(); up = a.cross(side)
        r = r0 + (r1 - r0) * i / (len(pts) - 1)
        rings.append([bm.verts.new(Vector(p) + (side*math.cos(t) + up*math.sin(t)) * r)
                      for t in [2*math.pi*k/sides for k in range(sides)]])
    for i in range(len(rings) - 1):
        for k in range(sides):
            j = (k + 1) % sides
            bm.faces.new((rings[i][k], rings[i][j], rings[i+1][j], rings[i+1][k]))

def tendril_path(rng, u, d, h_end, wobble):
    pts = []
    for i in range(9):
        t = i / 8
        pts.append((u * (1 - 0.15*t) + rng.uniform(-wobble, wobble), d + rng.uniform(-2, 2), -1 + h_end * t))
    return pts

def build():
    sc = scene()
    rear = bpy.data.collections.new("GateRear"); front = bpy.data.collections.new("GateFront")
    sc.collection.children.link(rear); sc.collection.children.link(front)
    stone = stone_mat("GateStone", (0.60, 0.53, 0.40), (0.22, 0.27, 0.06), (0.17, 0.15, 0.11))
    old = stone_mat("GateStoneDark", (0.40, 0.36, 0.28), (0.20, 0.25, 0.06), (0.11, 0.10, 0.08))
    glow = flat_mat("GateGlow", (0.1, 0.6, 0.65), 0.3, emit=(0.25, 0.95, 1.0), strength=3.0)
    sludge = flat_mat("GateSludge", (0.17, 0.15, 0.05), 0.12, spec=0.9)
    vein = flat_mat("GateVein", (0.11, 0.035, 0.025), 0.22, spec=0.9)
    vortex = vortex_mat()
    R = RING; D = R["depth"]
    n_blocks = 22
    for k in range(n_blocks):
        t0 = 2*math.pi*k/n_blocks + 0.012; t1 = 2*math.pi*(k+1)/n_blocks - 0.012; mid = (t0 + t1) / 2
        if R["center"] + R["outer"][1] * math.sin(mid) < -6: continue
        bm = bmesh.new()
        annulus(bm, R["outer"], (R["outer"][0]-6, R["outer"][1]-6), 0, D, t0, t1, 4)
        weather(bm, amp=1.6, cuts=3, bevel=1.0, seed=k * 1.7, freq=0.09)
        mesh_object("Rim%02d" % k, bm, stone, front if math.cos(mid) < 0 else rear)
    for half, coll in ((0, rear), (1, front)):
        t0, t1 = (-math.pi/2, math.pi/2) if half == 0 else (math.pi/2, 3*math.pi/2)
        bm = bmesh.new()
        annulus(bm, (R["outer"][0]-6, R["outer"][1]-6), (R["inner"][0]+3, R["inner"][1]+3), 3, D, t0, t1, 40)
        weather(bm, amp=0.5, cuts=1, bevel=0.5, seed=40 + half)
        mesh_object("Band%d" % half, bm, old, coll)
        bm = bmesh.new()
        annulus(bm, (R["inner"][0]+3, R["inner"][1]+3), R["inner"], 6, D + 4, t0, t1, 40)
        weather(bm, amp=0.35, cuts=1, bevel=0.4, seed=50 + half)
        mesh_object("Liner%d" % half, bm, stone, coll)
        bm = bmesh.new()
        annulus(bm, (R["inner"][0]+2.1, R["inner"][1]+2.1), (R["inner"][0]+1.3, R["inner"][1]+1.3), 5.4, 6.2, t0, t1, 48)
        mesh_object("GlowLine%d" % half, bm, glow, coll)
        for s in range(18):
            t = t0 + (t1 - t0) * (s + 0.5) / 18
            if R["center"] + R["outer"][1]*math.sin(t) < 2: continue
            ru, rh = R["outer"][0]-9, R["outer"][1]-9
            cu, ch = ru*math.cos(t), R["center"] + rh*math.sin(t)
            bm = bmesh.new(); w = 2.2 if s % 3 else 4.6
            box(bm, cu-w, cu+w, 0.2, 3.2, ch-2.0, ch+2.0)
            mesh_object("Glyph%d_%02d" % (half, s), bm, old, coll)
    bm = bmesh.new()
    ru, rh = R["inner"]
    rows = 24; ring_n = 64
    center = bm.verts.new((0, MOUTH, R["center"]))
    prev = None
    for i in range(1, rows + 1):
        f = i / rows
        ring = [bm.verts.new((ru*f*math.cos(2*math.pi*k/ring_n), MOUTH + 6*(1-f), R["center"] + rh*f*math.sin(2*math.pi*k/ring_n))) for k in range(ring_n)]
        for k in range(ring_n):
            j = (k + 1) % ring_n
            if prev is None: bm.faces.new((center, ring[k], ring[j]))
            else: bm.faces.new((prev[k], ring[k], ring[j], prev[j]))
        prev = ring
    uv = bm.loops.layers.uv.new("disk")
    for f in bm.faces:
        for lp in f.loops:
            c = lp.vert.co
            lp[uv].uv = (c.x / ru, (c.z - R["center"]) / rh)
    mesh_object("Vortex", bm, vortex, rear)
    bm = bmesh.new(); box(bm, -R["inner"][0]-2, R["inner"][0]+2, -16, D + 6, -3, 0.2)
    weather(bm, amp=0.4, cuts=3, bevel=0.6, seed=70)
    mesh_object("Threshold", bm, old, rear)
    rng = random.Random(7)
    for name, coll, blocks in (
        ("ButtressRear", rear, [(54, 80, -6, D+8, -3, 64, 3), (58, 76, -2, D+4, 64, 98, 3), (62, 72, 2, D, 98, 116, 4)]),
        ("ButtressFront", front, [(-72, -52, -2, D+4, -3, 22, 2), (-66, -55, 4, D-2, 22, 34, 3)])):
        for i, (u0, u1, d0, d1, h0, h1, tp) in enumerate(blocks):
            bm = bmesh.new(); box(bm, u0, u1, d0, d1, h0, h1, taper=tp)
            weather(bm, amp=2.6, cuts=4, bevel=1.4, seed=rng.random() * 50, freq=0.07)
            mesh_object("%s%d" % (name, i), bm, stone, coll)
    for name, coll, specs in (
        ("VeinRear", rear, [(58, -4, 70), (66, 12, 96), (50, 24, 52)]),
        ("VeinFront", front, [(-60, -2, 40), (-50, 10, 46)])):
        for i, (u, d, h) in enumerate(specs):
            bm = bmesh.new(); tube(bm, tendril_path(rng, u, d, h, 2.5), 2.2, 0.5)
            mesh_object("%s%d" % (name, i), bm, vein, coll)
    ro_u, ro_h = R["outer"]
    for name, coll, d, a0, a1, rad in (
        ("CreepFront", front, -1.2, 250, 168, 0), ("CreepFrontFace", front, -1.6, 236, 196, -5),
        ("CreepRear", rear, -1.2, -78, -8, 0), ("CreepRearFace", rear, -1.6, -64, -30, -5)):
        pts = []
        for i in range(14):
            t = math.radians(a0 + (a1 - a0) * i / 13)
            w = rng.uniform(-1.4, 1.4) + rad
            pts.append(((ro_u + 1.2 + w) * math.cos(t), d if rad else rng.uniform(2, D - 2), R["center"] + (ro_h + 1.2 + w) * math.sin(t)))
        bm = bmesh.new(); tube(bm, pts, 2.4, 0.6)
        mesh_object(name, bm, vein, coll)
    for name, coll, spots in (
        ("SludgeRear", rear, [(40, 4, 9), (62, -6, 12), (72, 18, 11), (20, -12, 8), (-20, -12, 8)]),
        ("SludgeFront", front, [(-46, -4, 11), (-66, 8, 12), (-58, -10, 9)])):
        for i, (u, d, r) in enumerate(spots):
            bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=r)
            for v in bm.verts:
                v.co.z *= 0.28
                v.co += Vector((u, d, 0.6)) + Vector((0, 0, 1)) * noise.noise(v.co * 0.3) * 0.8
            mesh_object("%s%d" % (name, i), bm, sludge, coll)
    project_all(sc)
    lights_and_camera(sc)
    return sc

def project_all(sc):
    flip = PROJ.determinant() < 0
    for ob in sc.collection.all_objects:
        if ob.type != "MESH": continue
        ob.data.transform(PROJ.to_4x4())
        if flip: ob.data.flip_normals()
        ob.data.update()

def art_box(sc, margin=4):
    xs, ys = [], []
    for ob in sc.collection.all_objects:
        if ob.type != "MESH": continue
        for v in ob.data.vertices:
            xs.append(GATE[0] - MOUTH + v.co.x); ys.append(GATE[1] - MOUTH*0.08 - v.co.y)
    x0, x1 = math.floor(min(xs)) - margin, math.ceil(max(xs)) + margin
    y0, y1 = math.floor(min(ys)) - margin, math.ceil(max(ys)) + margin
    return dict(x=x0, y=y0, width=x1 - x0, height=y1 - y0)

def lights_and_camera(sc):
    box_ = art_box(sc)
    sc["gate_art_box"] = box_
    cam_data = bpy.data.cameras.new("GateCam"); cam_data.type = "ORTHO"
    cam_data.ortho_scale = max(box_["width"], box_["height"])
    cam_data.clip_start = 0.1; cam_data.clip_end = 2000
    cam = bpy.data.objects.new("GateCam", cam_data); sc.collection.objects.link(cam)
    cx = box_["x"] + box_["width"]/2 - (GATE[0] - MOUTH); cy = -(box_["y"] + box_["height"]/2 - (GATE[1] - MOUTH*0.08))
    cam.location = (cx, cy, 600); cam.rotation_euler = (0, 0, 0)
    sc.camera = cam
    r = sc.render
    r.resolution_x = box_["width"] * SCALE; r.resolution_y = box_["height"] * SCALE; r.resolution_percentage = 100
    r.film_transparent = True; r.engine = "BLENDER_EEVEE"
    r.image_settings.file_format = "PNG"; r.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
    sun_data = bpy.data.lights.new("GateSun", "SUN"); sun_data.energy = 5.6; sun_data.angle = math.radians(3); sun_data.color = (1.0, 0.95, 0.85)
    sun = bpy.data.objects.new("GateSun", sun_data); sc.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), math.radians(-38), math.radians(-25))
    world = sc.world or bpy.data.worlds.new("GateWorld"); sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg: bg.inputs["Color"].default_value = (0.20, 0.22, 0.16, 1); bg.inputs["Strength"].default_value = 0.7

def render(out_dir=None, tag="v4"):
    sc = bpy.context.window.scene
    out_dir = out_dir or os.path.join(REPO, "assets/art/studies")
    rear = bpy.data.collections["GateRear"]; front = bpy.data.collections["GateFront"]
    paths = {}
    for layer, show_rear, show_front in (("rear", True, False), ("front", False, True)):
        rear.hide_render = not show_rear; front.hide_render = not show_front
        p = os.path.join(out_dir, "ancient-gate-%s-%s.png" % (tag, layer))
        sc.render.filepath = p
        bpy.ops.render.render(write_still=True)
        paths[layer] = p
    rear.hide_render = False; front.hide_render = False
    return paths, dict(sc["gate_art_box"])
