# Shared glTF export for tower models (docs/art-3d-parts.md, item 14). Run inside the working .blend:
#   exec(open('<repo>/tools/blender/export_tower.py').read()); export(CFG_MACHINE_GUN, vc=False, out='<dir>/')
# vc=False -> <name>.glb   : zone materials, for the artist / final pipeline
# vc=True  -> <name>_vc.glb: one material, zone colours in vertex colours (Steam Deck test before the texture exists)
#
# Grabli (each one cost a broken export once):
#  1. Export only the active scene; the file's JSON must not contain REF_* or Mesh_* names (reference data never ships).
#  2. Static pose = combat pose: export with export_current_frame on the combat frame, otherwise the exporter takes frame 1
#     (the folded pose). Check the pose in the FILE (no rotation/scale on any node), not in the scene.
#  3. Hidden objects do not re-evaluate animation: unhide before measuring and exporting.
#  4. The exporter makes one clip per object: all actions share one name and are merged into a single clip;
#     the action name must be unique in the .blend (comparison copies are renamed), otherwise it becomes 'deploy.001'.
#  5. Zone file and _vc file come from one source via a flag, never from two model versions.
#  6. glTF IMPORT sets rotation_mode = QUATERNION: rotation_euler on an imported object is silently ignored.
#  7. Mesh names must not end in .001 (a replaced mesh keeps the suffix if the old one still exists).
# Head contract: Godot looks up nodes by prefix: pivot_*, muzzle_*, recoil_axis_*, barrel_spin_*; mesh names are free.
import bpy
if bpy.app.version[:2] != (5, 2):
    raise RuntimeError('Blender 5.2 required (tools/blender/README.md), running %s' % bpy.app.version_string)
import os, re, json, struct, math

OUT = os.environ.get('UTD_3D_OUT', os.path.expanduser('~/Downloads/utd3d/rebuild/'))
FORBIDDEN = ('REF_', 'Mesh_')

CFG_TURRET = dict(scene='turret_build', name='turret_static', combat_frame=None,
    clip=dict(name='deploy', last_time=45 / 30,
              rot={'head_root': (1, -90.0), 'pivot_L': (0, 90.0), 'pivot_R': (0, 90.0)},
              slide={'pivot_L': (-0.485, -0.54), 'pivot_R': (0.485, 0.54)}))
CFG_MACHINE_GUN = dict(scene='mg_build', name='machine_gun_static', combat_frame=None,
    clip=dict(name='deploy', last_time=45 / 30,
              rot={'head_root': (1, -90.0), 'pivot_L': (0, 90.0), 'pivot_R': (0, 90.0)}))

def _glb(path):
    d = open(path, 'rb').read(); L = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + L])
    bo = 20 + L; bl = struct.unpack('<I', d[bo:bo + 4])[0]; return J, d[bo + 8:bo + 8 + bl]

def export(cfg, vc=False, out=None):
    sc = bpy.data.scenes[cfg['scene']]
    if bpy.context.window: bpy.context.window.scene = sc
    elif bpy.context.scene != sc: raise RuntimeError('background mode: make %s the active scene' % sc.name)
    root = bpy.data.objects['tower_root']; tree = [root] + list(root.children_recursive)
    hidden = [o.name for o in tree if o.hide_get() or o.hide_viewport]
    if hidden: raise RuntimeError('unhide before export (grabli 3): %s' % hidden)
    meshes = [o for o in tree if o.type == 'MESH']; swapped = {}
    if vc:
        m = bpy.data.materials.get('tower_vc') or bpy.data.materials.new('tower_vc'); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
        attr = nt.nodes.get('VC') or nt.nodes.new('ShaderNodeVertexColor'); attr.name = 'VC'; attr.layer_name = 'zone'
        nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = 0.6
        for o in meshes:
            orig = o.data; me = orig.copy(); me.name = orig.name + '_vc'; swapped[o] = orig
            cols = [tuple(mm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value) for mm in me.materials]
            ca = me.color_attributes.new('zone', 'FLOAT_COLOR', 'CORNER')
            for p in me.polygons:
                for li in p.loop_indices: ca.data[li].color = cols[p.material_index]
            me.materials.clear(); me.materials.append(m)
            for p in me.polygons: p.material_index = 0
            o.data = me
    path = (out or OUT) + cfg['name'] + ('_vc' if vc else '') + '.glb'
    for o in sc.objects: o.select_set(o in tree)
    bpy.context.view_layer.objects.active = root
    sc.frame_set(cfg['combat_frame'] or sc.frame_end)
    try:
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_active_scene=True, use_selection=True,
            export_current_frame=True, export_animations=True, export_animation_mode='ACTIONS', export_merge_animation='ACTION',
            export_anim_slide_to_zero=True, export_force_sampling=True, export_frame_range=True, export_cameras=False, export_lights=False,
            export_yup=True, export_apply=False, export_texcoords=True, export_normals=True,
            export_materials='EXPORT', export_vertex_color='MATERIAL' if vc else 'NONE', export_extras=False)
    finally:
        for o, orig in swapped.items():
            tmp = o.data; o.data = orig; bpy.data.meshes.remove(tmp)
    return check(cfg, path)

def check(cfg, path):
    J, BIN = _glb(path); errors = []
    names = [n.get('name', '') for k in ('nodes', 'meshes', 'materials') for n in J.get(k, [])]
    bad = [n for n in names if n.startswith(FORBIDDEN)]
    if len(J['scenes']) != 1: errors.append('scenes != 1')
    if bad: errors.append('forbidden names: %s' % bad)
    dup = [n for n in names if re.search(r'\.\d{3}(_vc)?$', n)]
    if dup: errors.append('names with .00N suffix (grabli 7): %s' % dup)
    if J.get('images') or J.get('textures'): errors.append('file contains images/textures')
    if any('rotation' in n or 'scale' in n for n in J['nodes']): errors.append('non-identity rotation/scale on a node (pose is not combat)')
    nodes = J['nodes']; parent = {c: i for i, n in enumerate(nodes) for c in n.get('children', [])}
    nm = lambda i: nodes[i].get('name', '')
    if not any(nm(i) == 'tower_root' for i in range(len(nodes))): errors.append('no tower_root')
    for need in ('head_root', 'platform'):
        i = [k for k in range(len(nodes)) if nm(k) == need]
        if not i or nm(parent.get(i[0], -1)) != 'tower_root': errors.append(need + ' must be a child of tower_root')
    for i in range(len(nodes)):
        if nm(i).startswith(('muzzle_', 'recoil_axis_', 'barrel_spin_')) and not nm(parent.get(i, -1)).startswith('pivot_'):
            errors.append(nm(i) + ' must be a child of a pivot_*')
    errors += _clip(cfg, J, BIN)
    if errors:
        os.remove(path); raise RuntimeError('export rejected, file deleted: ' + '; '.join(errors))
    tris = sum(J['accessors'][p['indices']]['count'] // 3 for m in J['meshes'] for p in m['primitives'])
    rep = dict(file=os.path.basename(path), kb=os.path.getsize(path) // 1024, nodes=len(nodes), meshes=len(J['meshes']),
               primitives=sum(len(m['primitives']) for m in J['meshes']), materials=[m['name'] for m in J.get('materials', [])], tris=tris,
               animations=[a['name'] for a in J.get('animations', [])])
    print('OK', rep); return rep

def _clip(cfg, J, BIN):
    spec = cfg.get('clip'); anims = J.get('animations', []); errs = []
    if spec is None:
        return ['unexpected animations: %s' % [a['name'] for a in anims]] if anims else []
    def acc(i):
        a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]; n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); vals = struct.unpack('<%df' % (a['count'] * n), BIN[off:off + a['count'] * n * 4])
        return [vals[k * n:(k + 1) * n] for k in range(a['count'])]
    if [a['name'] for a in anims] != [spec['name']]: return ['animations: %s' % [a['name'] for a in anims]]
    an = anims[0]; nodes = {}
    for ch in an['channels']:
        nm = J['nodes'][ch['target']['node']]['name']; smp = an['samplers'][ch['sampler']]
        nodes.setdefault(nm, {})[ch['target']['path']] = (acc(smp['input']), acc(smp['output']))
    expect = set(spec['rot']) | set(spec.get('slide', {}))
    if set(nodes) != expect: errs.append('channel nodes: %s' % sorted(nodes))
    ang = lambda q, axis: math.degrees(2 * math.atan2(q[axis], q[3]))
    for nm, (ax, a0) in spec['rot'].items():
        t, v = nodes.get(nm, {}).get('rotation', ([], []))
        if not t: errs.append(nm + ': no rotation channel'); continue
        first, last = ang(v[0], ax), ang(v[-1], ax)
        print('  %-9s keys %d  t %.3f..%.3f s  first %.1f deg  last %.1f deg' % (nm, len(t), t[0][0], t[-1][0], first, last))
        if abs(t[0][0]) > 1e-4 or abs(t[-1][0] - spec['last_time']) > 1e-3: errs.append(nm + ': time range')
        if abs(first - a0) > 0.1 or abs(last) > 0.1: errs.append(nm + ': start/end pose')
    for nm, (x0, x1) in spec.get('slide', {}).items():
        t, v = nodes.get(nm, {}).get('translation', ([], []))
        if not t: errs.append(nm + ': no translation channel'); continue
        print('  %-9s slide x %.3f -> %.3f' % (nm, v[0][0], v[-1][0]))
        if abs(v[0][0] - x0) > 1e-3 or abs(v[-1][0] - x1) > 1e-3: errs.append(nm + ': slide start/end')
    if not errs: print('OK clip', spec['name'])
    return errs
