# LEGACY - partial, does NOT rebuild the Turret (docs/art-3d-parts.md, item 13; see the issue linked in ../README.md).
# Helper functions used while the Turret head was built step by step in a chat session; the step-by-step build code itself
# was not saved. Kept as the history of the method. Expects a scene 'turret_build' with the six zone materials.

import bpy, bmesh, math
from mathutils import Vector
b=bpy.data.scenes['turret_build']; col=b.collection
M={m.name:m for m in bpy.data.materials}; MATS=[M['graphite_frame'],M['olive_plate'],M['steel_dark'],M['brass_band'],M['orange_accent'],M['teal_indicator']]
GRAPH,OLIVE,STEEL,BRASS,ORANGE,TEAL=range(6)
def fin(bm,mi):
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    for f in bm.faces: f.material_index=mi
    return bm
def prism(profile,a0,a1,axis,mi):
    bm=bmesh.new()
    def P(u,v,w): return {'x':(w,u,v),'y':(u,w,v),'z':(u,v,w)}[axis]
    A=[bm.verts.new(P(u,v,a0)) for u,v in profile]; B=[bm.verts.new(P(u,v,a1)) for u,v in profile]; n=len(A)
    bm.faces.new(A); bm.faces.new(B[::-1])
    for i in range(n): bm.faces.new((A[i],B[i],B[(i+1)%n],A[(i+1)%n]))
    return fin(bm,mi)
def box(x0,x1,y0,y1,z0,z1,mi): return prism([(min(y0,y1),min(z0,z1)),(max(y0,y1),min(z0,z1)),(max(y0,y1),max(z0,z1)),(min(y0,y1),max(z0,z1))],min(x0,x1),max(x0,x1),'x',mi)
def cyl(c,axis,r,h0,h1,n,mi):
    bm=bmesh.new(); ax=Vector(axis).normalized(); u=ax.orthogonal().normalized(); v=ax.cross(u); c=Vector(c)
    A=[bm.verts.new(c+ax*h0+(u*math.cos(2*math.pi*i/n)+v*math.sin(2*math.pi*i/n))*r) for i in range(n)]
    B=[bm.verts.new(c+ax*h1+(u*math.cos(2*math.pi*i/n)+v*math.sin(2*math.pi*i/n))*r) for i in range(n)]
    bm.faces.new(A); bm.faces.new(B[::-1])
    for i in range(n): bm.faces.new((A[i],B[i],B[(i+1)%n],A[(i+1)%n]))
    return fin(bm,mi)
def obj(bm,name='tmp'):
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in MATS: me.materials.append(m)
    o=bpy.data.objects.new(name,me); col.objects.link(o); return o
def apply(o):
    dg=bpy.context.evaluated_depsgraph_get(); me=bpy.data.meshes.new_from_object(o.evaluated_get(dg)); old=o.data; o.modifiers.clear(); o.data=me; bpy.data.meshes.remove(old)
def boolean(t,c,op):
    md=t.modifiers.new('b','BOOLEAN'); md.operation=op; md.object=c; md.solver='EXACT'; md.material_mode='TRANSFER'; apply(t); bpy.data.objects.remove(c)
def bevel(o,w,ang=40):
    md=o.modifiers.new('bev','BEVEL'); md.width=w; md.segments=1; md.limit_method='ANGLE'; md.angle_limit=math.radians(ang); md.use_clamp_overlap=True; apply(o); return o
def part(bm,w=None):
    o=obj(bm)
    if w: bevel(o,w)
    return o
def union(parts):
    base=parts[0]
    for p in parts[1:]: boolean(base,p,'UNION')
    return base
def replace_mesh(name, src, offset=Vector((0,0,0))):
    t=bpy.data.objects[name]; me=src.data; me.transform(__import__('mathutils').Matrix.Translation(-offset))
    old=t.data; t.data=me; me.name=name; bpy.data.objects.remove(src); bpy.data.meshes.remove(old)
def stats(name):
    o=bpy.data.objects[name]; me=o.data; me.calc_loop_triangles(); bm=bmesh.new(); bm.from_mesh(me)
    nm=sum(1 for e in bm.edges if not e.is_manifold); sh=len(__import__('bmesh').ops.region_extend if False else [0]); bm.free()
    return len(me.loop_triangles), nm

def cylc(c,axis,r,h0,h1,n,mi,ch0=0.0,ch1=0.0):
    prof=[(r-ch0,h0)] if ch0 else [(r,h0)]
    if ch0: prof.append((r,h0+ch0))
    if ch1: prof.append((r,h1-ch1))
    prof.append((r-ch1,h1) if ch1 else (r,h1))
    bm=bmesh.new(); ax=Vector(axis).normalized(); u=ax.orthogonal().normalized(); v=ax.cross(u); c=Vector(c)
    rings=[[bm.verts.new(c+ax*h+(u*math.cos(2*math.pi*i/n)+v*math.sin(2*math.pi*i/n))*rr) for i in range(n)] for rr,h in prof]
    bm.faces.new(rings[0]); bm.faces.new(rings[-1][::-1])
    for A,B in zip(rings,rings[1:]):
        for i in range(n): bm.faces.new((A[i],B[i],B[(i+1)%n],A[(i+1)%n]))
    return fin(bm,mi)
