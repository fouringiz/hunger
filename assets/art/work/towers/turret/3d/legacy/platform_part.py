# LEGACY - partial, does NOT rebuild the platform (docs/art-3d-parts.md, item 13; see the issue linked in ../README.md).
# Builds the platform parts (slab quarters, pylons, plateau, collar, ring, side modules, accents) as separate objects
# into the scene 'turret_build'. The later steps - joining into one mesh, the Turret UV pack, the palette sync - were done
# step by step in a chat session and were not saved. The resulting platform is kept as data in
# assets/art/work/towers/platform/3d/platform_mesh.json. Kept as the history of the method.

import bpy, bmesh, math, os, numpy as np, mathutils
from mathutils import Vector
OUT='/Users/home/Downloads/utd3d/rebuild/'
VERSION=globals().get('VERSION','v02')
sc=bpy.data.scenes['turret_build']; col=sc.collection
def srgb(h):
    v=[int(h[i:i+2],16)/255 for i in (0,2,4)]; return tuple(c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4 for c in v)
def mat(name, rgb, rough, metal, emit=None):
    m=bpy.data.materials.new(name); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*rgb,1); b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=metal
    if emit: b.inputs['Emission Color'].default_value=(*emit,1); b.inputs['Emission Strength'].default_value=6
    return m
MATS=[mat('graphite',srgb('4e4d49'),0.55,0.35), mat('olive',srgb('665b3c'),0.7,0.0), mat('steel_dark',srgb('2a2823'),0.45,0.7),
      mat('brass',srgb('9b8c77'),0.4,0.8), mat('orange',srgb('d07a1e'),0.5,0.0), mat('teal',(0.05,0.6,0.6),0.3,0.0,emit=(0.1,0.9,0.9))]
GRAPH,OLIVE,STEEL,BRASS,ORANGE,TEAL=range(6)
def new_obj(name, bm):
    bm.normal_update(); me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o=bpy.data.objects.new(name, me); col.objects.link(o)
    for m in MATS: o.data.materials.append(m)
    return o
def set_mat(bm, mi):
    for f in bm.faces: f.material_index=mi
def extrude_up(bm, faces, h):
    r=bmesh.ops.extrude_face_region(bm, geom=faces)
    bmesh.ops.translate(bm, vec=(0,0,h), verts=[g for g in r['geom'] if isinstance(g,bmesh.types.BMVert)])
    bmesh.ops.delete(bm, geom=[f for f in faces if f.is_valid], context='FACES_ONLY')
    return [g for g in r['geom'] if isinstance(g,bmesh.types.BMFace)]
def prism_bm(outline, z0, z1, mi):
    bm=bmesh.new(); vs=[bm.verts.new((x,y,z0)) for x,y in outline]; f=bm.faces.new(vs)
    r=bmesh.ops.extrude_face_region(bm, geom=[f]); bmesh.ops.translate(bm, vec=(0,0,z1-z0), verts=[g for g in r['geom'] if isinstance(g,bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); set_mat(bm, mi); return bm
def step_up(bm, inset, h, mi=None):
    zt=max(f.calc_center_median().z for f in bm.faces if f.normal.z>0.9)
    top=[f for f in bm.faces if f.normal.z>0.9 and f.calc_center_median().z>=zt-1e-6][0]
    bmesh.ops.inset_region(bm, faces=[top], thickness=inset, depth=0)
    newf=extrude_up(bm,[top],h); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if mi is not None:
        for f in bm.faces:
            c=f.calc_center_median()
            if c.z>zt+1e-5: f.material_index=mi
def octagon(cx,cy,across,n=8,rot=math.pi/8):
    r=(across/2)/math.cos(math.pi/n); return [(cx+r*math.cos(rot+2*math.pi*i/n), cy+r*math.sin(rot+2*math.pi*i/n)) for i in range(n)]
def crect(x0,x1,y0,y1,c):
    x0,x1=min(x0,x1),max(x0,x1); y0,y1=min(y0,y1),max(y0,y1)
    return [(x0+c,y0),(x1-c,y0),(x1,y0+c),(x1,y1-c),(x1-c,y1),(x0+c,y1),(x0,y1-c),(x0,y0+c)]
def box_bm(x0,x1,y0,y1,z0,z1,mi):
    return prism_bm([(min(x0,x1),min(y0,y1)),(max(x0,x1),min(y0,y1)),(max(x0,x1),max(y0,y1)),(min(x0,x1),max(y0,y1))], min(z0,z1), max(z0,z1), mi)
def cyl_bm(cx,cy,r,z0,z1,n,mi): return prism_bm([(cx+r*math.cos(2*math.pi*i/n), cy+r*math.sin(2*math.pi*i/n)) for i in range(n)], z0,z1,mi)
def tube_bm(cx,cy,ro,ri,z0,z1,n,mi):
    bm=bmesh.new(); o=[bm.verts.new((cx+ro*math.cos(2*math.pi*i/n),cy+ro*math.sin(2*math.pi*i/n),z0)) for i in range(n)]
    i_=[bm.verts.new((cx+ri*math.cos(2*math.pi*i/n),cy+ri*math.sin(2*math.pi*i/n),z0)) for i in range(n)]
    fs=[bm.faces.new((o[i],o[(i+1)%n],i_[(i+1)%n],i_[i])) for i in range(n)]
    r=bmesh.ops.extrude_face_region(bm, geom=fs); bmesh.ops.translate(bm, vec=(0,0,z1-z0), verts=[g for g in r['geom'] if isinstance(g,bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); set_mat(bm,mi); return bm
def lathe_bm(profile, mats, n):
    bm=bmesh.new(); rings=[]
    for r,z in profile:
        rings.append([bm.verts.new((0,0,z))] if r<1e-6 else [bm.verts.new((r*math.cos(2*math.pi*i/n), r*math.sin(2*math.pi*i/n), z)) for i in range(n)])
    m=len(profile)
    for k in range(m):
        a,b=rings[k],rings[(k+1)%m]
        if len(a)==1 and len(b)==1: continue
        for i in range(n):
            if len(a)==1: f=bm.faces.new((a[0],b[i],b[(i+1)%n]))
            elif len(b)==1: f=bm.faces.new((a[i],a[(i+1)%n],b[0]))
            else: f=bm.faces.new((a[i],a[(i+1)%n],b[(i+1)%n],b[i]))
            f.material_index=mats[k]
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); return bm
def tmp_obj(bm): return new_obj('cutter', bm)
def apply_mods(o):
    dg=bpy.context.evaluated_depsgraph_get(); ev=o.evaluated_get(dg); me=bpy.data.meshes.new_from_object(ev)
    old=o.data; o.modifiers.clear(); o.data=me; bpy.data.meshes.remove(old)
    while len(me.materials)<len(MATS): me.materials.append(MATS[len(me.materials)])
def boolean(target, cutter, op):
    md=target.modifiers.new('b','BOOLEAN'); md.operation=op; md.object=cutter; md.solver='EXACT'; md.material_mode='TRANSFER'
    apply_mods(target); bpy.data.objects.remove(cutter)
def bevel(o, width=0.02, angle=50, mi=BRASS):
    md=o.modifiers.new('bev','BEVEL'); md.width=width; md.segments=1; md.limit_method='ANGLE'; md.angle_limit=math.radians(angle); md.use_clamp_overlap=True; md.material=mi
    apply_mods(o)
def bevel_bottom_outer(bm, width):
    es=[e for e in bm.edges if all(abs(v.co.z)<1e-6 for v in e.verts) and not (all(abs(v.co.x)<1e-6 for v in e.verts) or all(abs(v.co.y)<1e-6 for v in e.verts))]
    bmesh.ops.bevel(bm, geom=es, offset=width, segments=1, affect='EDGES')
def join(bms):
    bm=bmesh.new()
    for b in bms:
        me=bpy.data.meshes.new('t'); b.to_mesh(me); b.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    return bm
S={'EN':(1,1),'ES':(1,-1),'WN':(-1,1),'WS':(-1,-1)}
# ---- slab quarters ----
for k,(sx,sy) in S.items():
    outline=[(0,0),(sx*0.86,0),(sx*0.86,sy*0.76),(sx*0.76,sy*0.86),(0,sy*0.86)]
    bm=prism_bm(outline,0,0.15,GRAPH); bevel_bottom_outer(bm,0.04); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o=new_obj(f'slab_{k}',bm)
    xe=(0.74,0.86) if sx>0 else (0.77,0.91)
    boolean(o, tmp_obj(box_bm(0,sx*0.22,sy*0.69,sy*0.86,0.15,0.245,GRAPH)), 'UNION')
    boolean(o, tmp_obj(box_bm(sx*xe[0],sx*xe[1],0,sy*0.29,0.15,0.225,GRAPH)), 'UNION')
    bevel(o,0.02)
# ---- pylons ----
for k,(sx,sy) in S.items():
    cx,cy=sx*0.74,sy*0.70
    bm=prism_bm(octagon(cx,cy,0.40),0,0.245,GRAPH); step_up(bm,0.02,0.04)
    o=new_obj(f'pylon_{k}',bm)
    boolean(o, tmp_obj(tube_bm(cx,cy,0.125,0.075,0.27,0.30,24,STEEL)), 'DIFFERENCE'); bevel(o,0.015)
# ---- plateau quarters ----
for k,(sx,sy) in S.items():
    a=0.53; b=a*math.tan(math.pi/8)
    outline=[(0,0),(sx*a,0),(sx*a,sy*b),(sx*b,sy*a),(0,sy*a)]
    bm=prism_bm(outline,0.15,0.33,OLIVE); step_up(bm,0.012,0.041,OLIVE)
    for f in bm.faces:
        c=f.calc_center_median()
        if f.normal.z>0.9 and abs(c.z-0.33)<1e-4: f.material_index=GRAPH
    o=new_obj(f'plateau_{k}',bm)
    boolean(o, tmp_obj(cyl_bm(0,0,0.43,0.33,0.6,48,GRAPH)), 'DIFFERENCE')
    boolean(o, tmp_obj(cyl_bm(0,0,0.375,0.30,0.7,48,GRAPH)), 'DIFFERENCE')
    boolean(o, tmp_obj(box_bm(-0.25,0.25,sy*0.375,sy*0.72,0.33,0.6,GRAPH)), 'DIFFERENCE')
    if sx>0: boolean(o, tmp_obj(box_bm(0.47,0.80,-0.235,0.235,0.33,0.6,GRAPH)), 'DIFFERENCE')
    else:    boolean(o, tmp_obj(box_bm(-0.85,-0.40,-0.30,0.30,0.33,0.6,GRAPH)), 'DIFFERENCE')
    bevel(o,0.02)
# ---- collar ----
bm=prism_bm(octagon(0,0,0.80),0.33,0.39,GRAPH); o=new_obj('collar',bm)
boolean(o, tmp_obj(cyl_bm(0,0,0.375,0.2,0.6,48,STEEL)), 'DIFFERENCE'); bevel(o,0.02)
# ---- ring ----
prof=[(0,0.30),(0.32,0.30),(0.32,0.405),(0.30,0.424),(0,0.424)]
pm  =[GRAPH,GRAPH,BRASS,GRAPH,GRAPH]
ringo=new_obj('ring', lathe_bm(prof,pm,48))
cuts=[]
for i in range(16):
    th=2*math.pi*i/16; ca,sa=math.cos(th),math.sin(th); r0,r1,hw=0.205,0.26,0.02
    pts=[(r0*ca-hw*(-sa), r0*sa-hw*ca),(r1*ca-hw*(-sa), r1*sa-hw*ca),(r1*ca+hw*(-sa), r1*sa+hw*ca),(r0*ca+hw*(-sa), r0*sa+hw*ca)]
    cuts.append(prism_bm(pts,0.395,0.45,STEEL))
boolean(ringo, tmp_obj(join(cuts)), 'DIFFERENCE')
bm=bmesh.new(); bm.from_mesh(ringo.data); tb=box_bm(-0.03,0.03,-0.335,-0.31,0.36,0.40,TEAL); me=bpy.data.meshes.new('t'); tb.to_mesh(me); tb.free(); bm.from_mesh(me); bpy.data.meshes.remove(me); bm.to_mesh(ringo.data); bm.free()
# ---- side ----
pieces=[box_bm(-0.82,-0.40,-0.30,0.30,0.15,0.33,GRAPH)]
w=new_obj('side_W', prism_bm(crect(-0.80,-0.42,-0.28,0.28,0.04),0.34,0.42,OLIVE)); pieces.append(prism_bm(crect(-0.815,-0.405,-0.295,0.295,0.045),0.32,0.345,GRAPH))
boolean(w, tmp_obj(box_bm(-0.78,-0.64,-0.15,0.15,0.40,0.5,STEEL)),'DIFFERENCE')
boolean(w, tmp_obj(box_bm(-0.58,-0.46,-0.14,0.14,0.39,0.5,STEEL)),'DIFFERENCE'); bevel(w,0.015)
for yy in (-0.08,0.0,0.08): pieces.append(box_bm(-0.58,-0.46,yy-0.02,yy+0.02,0.39,0.41,BRASS))
for yy in (-0.11,0.11): pieces.append(box_bm(-0.73,-0.69,yy-0.02,yy+0.02,0.40,0.415,TEAL))
pieces.append(box_bm(0.47,0.76,-0.23,0.23,0.15,0.33,GRAPH)); pieces.append(box_bm(0.72,0.76,-0.20,0.20,0.33,0.358,GRAPH))
e=new_obj('side_E', prism_bm(crect(0.49,0.72,-0.21,0.21,0.04),0.34,0.405,OLIVE)); pieces.append(prism_bm(crect(0.475,0.735,-0.225,0.225,0.045),0.32,0.345,GRAPH))
boolean(e, tmp_obj(box_bm(0.545,0.665,-0.14,0.14,0.375,0.5,STEEL)),'DIFFERENCE'); bevel(e,0.015)
for yy in (-0.08,0.0,0.08): pieces.append(box_bm(0.545,0.665,yy-0.02,yy+0.02,0.375,0.395,BRASS))
ns=[]
for sy in (1,-1):
    pieces.append(box_bm(-0.24,0.24,sy*0.38,sy*0.68,0.15,0.33,GRAPH))
    bmm=prism_bm(crect(-0.22,0.22,sy*0.40,sy*0.66,0.04),0.34,0.385,OLIVE); step_up(bmm,0.03,0.025,OLIVE); m=new_obj('side_NS', bmm); pieces.append(prism_bm(crect(-0.235,0.235,sy*0.385,sy*0.675,0.045),0.32,0.345,GRAPH))
    boolean(m, tmp_obj(box_bm(-0.14,0.14,sy*0.48,sy*0.58,0.38,0.5,STEEL)),'DIFFERENCE'); bevel(m,0.015); ns.append(m)
    for xx in (-0.08,0.0,0.08): pieces.append(box_bm(xx-0.02,xx+0.02,sy*0.48,sy*0.58,0.38,0.40,BRASS))
    for sx in (1,-1): pieces.append(box_bm(sx*0.27,sx*0.39,sy*0.49,sy*0.66,0.15,0.264,GRAPH))
    pieces.append(box_bm(0.53,0.69,sy*0.25,sy*0.44,0.15,0.22,GRAPH))
side=new_obj('side', join(pieces))
bm=bmesh.new(); bm.from_mesh(side.data)
for ob in [w,e]+ns: bm.from_mesh(ob.data); bpy.data.objects.remove(ob)
bm.to_mesh(side.data); bm.free()
# ---- accent ----
o=new_obj('accent', join([prism_bm(octagon(sx*0.54,sy*0.53,0.14,n=4,rot=0),0.15,0.28,ORANGE) for k,(sx,sy) in S.items()])); bevel(o,0.015)
