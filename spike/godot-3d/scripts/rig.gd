class_name Rig
extends RefCounted
## One imported tower model: contract nodes, the deploy clip sampled by hand, fades, recoil, flashes.

var kind := ""
var model: Node3D
var tower_root: Node3D
var head_root: Node3D
var platform: MeshInstance3D
var pivots: Array = []
var muzzles: Array = []
var recoil_axes: Array = []
var spins: Array = []
var recoil_parts: Array = []   # per pivot: Array of [MeshInstance3D, base position]
var recoil_t: Array = []       # per pivot: seconds left
var flashes: Array = []        # per muzzle
var flash_ticks: Array = []
var anim: Animation
var clip_len := 0.0
var tracks: Array = []         # [node, type, track index]
var rest := {}                 # node -> Transform3D as imported (before any sampling)
var clip_t := 0.0
var problems: Array = []

static var _flash_mesh: QuadMesh

static func create(kind_: String, vc: bool) -> Rig:
	var r := Rig.new()
	r.kind = kind_
	var scene: PackedScene = load(Cfg.model_path(kind_, vc))
	r.model = scene.instantiate()
	r._bind()
	if vc:
		r._fix_vc()
	return r

## Godot's glTF importer leaves vertex_color_use_as_albedo off for a material without baseColor,
## so the _vc file renders white. Workaround: switch it on (COLOR_0 is linear in glTF).
func _fix_vc() -> void:
	for g in geometry(model):
		if g is MeshInstance3D:
			for s in g.mesh.get_surface_count():
				var m = g.mesh.surface_get_material(s)
				if m is BaseMaterial3D and not m.vertex_color_use_as_albedo:
					m.vertex_color_use_as_albedo = true
					m.vertex_color_is_srgb = false

func _bind() -> void:
	tower_root = model.find_child("tower_root", true, false)
	head_root = model.find_child("head_root", true, false)
	platform = model.find_child("platform", true, false) as MeshInstance3D
	if tower_root == null: problems.append("tower_root not found")
	if head_root == null:
		problems.append("head_root not found")
		return
	for n in _walk(head_root):
		rest[n] = n.transform
		var nm := String(n.name)
		if nm.begins_with("pivot_"): pivots.append(n)
		elif nm.begins_with("muzzle_"): muzzles.append(n)
		elif nm.begins_with("recoil_axis_"): recoil_axes.append(n)
		elif nm.begins_with("barrel_spin_"): spins.append(n)
	for arr in [pivots, muzzles, recoil_axes, spins]:
		arr.sort_custom(func(a, b): return String(a.name) < String(b.name))
	for p in pivots:
		var parts := []
		for c in p.get_children():
			if c is MeshInstance3D and not String(c.name).begins_with("bushing_"):
				parts.append([c, c.position])
		recoil_parts.append(parts)
		recoil_t.append(0.0)
	for m in muzzles:
		var f := MeshInstance3D.new()
		f.mesh = _flash()
		f.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		f.visible = false
		m.add_child(f)
		flashes.append(f)
		flash_ticks.append(0)
	var ap: AnimationPlayer = null
	for c in model.find_children("*", "AnimationPlayer", true, false):
		ap = c
		break
	if ap == null or not ap.has_animation("deploy"):
		problems.append("deploy clip not found")
		return
	anim = ap.get_animation("deploy")
	clip_len = anim.length
	var root := ap.get_node(ap.root_node)
	for i in anim.get_track_count():
		var path := anim.track_get_path(i)
		var node := root.get_node_or_null(NodePath(path.get_concatenated_names()))
		if node == null:
			problems.append("track target missing: %s" % path)
			continue
		tracks.append([node, anim.track_get_type(i), i])
	# The clip is sampled by hand on the fixed step; the player itself is removed.
	ap.get_parent().remove_child(ap)
	ap.free()

static func _flash() -> QuadMesh:
	if _flash_mesh == null:
		var g := Gradient.new()
		g.set_color(0, Color(1.0, 0.95, 0.7, 1.0))
		g.set_color(1, Color(1.0, 0.45, 0.1, 0.0))
		g.add_point(0.35, Color(1.0, 0.75, 0.3, 0.9))
		var tex := GradientTexture2D.new()
		tex.gradient = g
		tex.fill = GradientTexture2D.FILL_RADIAL
		tex.fill_from = Vector2(0.5, 0.5)
		tex.fill_to = Vector2(1.0, 0.5)
		tex.width = 64
		tex.height = 64
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		m.albedo_texture = tex
		m.albedo_color = Color(1.6, 1.3, 0.9)
		_flash_mesh = QuadMesh.new()
		_flash_mesh.size = Vector2(0.38, 0.38)
		_flash_mesh.material = m
	return _flash_mesh

static func _walk(n: Node) -> Array:
	var out := [n]
	for c in n.get_children():
		out.append_array(_walk(c))
	return out

func sample(t: float, yaw: float) -> void:
	clip_t = clampf(t, 0.0, clip_len)
	for tr in tracks:
		var node: Node3D = tr[0]
		match tr[1]:
			Animation.TYPE_POSITION_3D: node.position = anim.position_track_interpolate(tr[2], clip_t)
			Animation.TYPE_ROTATION_3D: node.quaternion = anim.rotation_track_interpolate(tr[2], clip_t)
			Animation.TYPE_SCALE_3D: node.scale = anim.scale_track_interpolate(tr[2], clip_t)
	apply_yaw(yaw)

## The clip keys head_root rotation and the code aims head_root too: the aim yaw is composed
## on top of the sampled clip rotation (about the vertical axis through head_root).
func apply_yaw(yaw: float) -> void:
	var clip_q: Quaternion = rest[head_root].basis.get_rotation_quaternion()
	for tr in tracks:
		if tr[0] == head_root and tr[1] == Animation.TYPE_ROTATION_3D:
			clip_q = anim.rotation_track_interpolate(tr[2], clip_t)
	head_root.quaternion = Quaternion(Vector3.UP, yaw) * clip_q

func geometry(under: Node) -> Array:
	return _walk(under).filter(func(n): return n is GeometryInstance3D)

func set_alpha(under: Node, a: float) -> void:
	var tr := clampf(1.0 - a, 0.0, 1.0)
	for g in geometry(under):
		if flashes.has(g):
			continue
		g.transparency = tr
		g.visible = a > 0.0

func fire(i: int) -> void:
	if i >= pivots.size(): return
	recoil_t[i] = Cfg.RECOIL_TIME
	if i < flashes.size():
		flash_ticks[i] = Cfg.FLASH_TICKS

func tick_fx(dt: float, spin_speed: float) -> void:
	for i in pivots.size():
		var r: float = recoil_t[i]
		var k := 0.0
		if r > 0.0:
			r = maxf(0.0, r - dt)
			recoil_t[i] = r
			k = r / Cfg.RECOIL_TIME   # instant kick back, linear return
		# recoil direction: +Z of recoil_axis_* (barrel looks along -Z)
		var dir := Vector3(0, 0, 1)
		if i < recoil_axes.size():
			dir = (recoil_axes[i] as Node3D).transform.basis.z.normalized()
		for part in recoil_parts[i]:
			(part[0] as Node3D).position = part[1] + dir * Cfg.RECOIL_DIST * k
	for i in flashes.size():
		var ft: int = flash_ticks[i]
		(flashes[i] as Node3D).visible = ft > 0
		if ft > 0: flash_ticks[i] = ft - 1
	for s in spins:
		# contract: barrel_spin_* turns about its local Y in Blender = local Z in Godot (barrel axis)
		(s as Node3D).rotate_object_local(Vector3(0, 0, 1), spin_speed * dt)

# ---------- contract report ----------

static func rel_xform(n: Node3D, ancestor: Node) -> Transform3D:
	var t := Transform3D.IDENTITY
	var cur: Node = n
	while cur != null and cur != ancestor:
		t = (cur as Node3D).transform * t
		cur = cur.get_parent()
	return t

func _verts_in(space: Node) -> PackedVector3Array:
	var out := PackedVector3Array()
	for g in geometry(head_root):
		if not (g is MeshInstance3D) or flashes.has(g): continue
		var mi: MeshInstance3D = g
		var xf := rel_xform(mi, space)
		for s in mi.mesh.get_surface_count():
			var v: PackedVector3Array = mi.mesh.surface_get_arrays(s)[Mesh.ARRAY_VERTEX]
			for p in v:
				out.append(xf * p)
	return out

func turn_radius() -> float:
	sample(clip_len, 0.0)
	var r := 0.0
	for p in _verts_in(head_root):
		r = maxf(r, Vector2(p.x, p.z).length())
	return r

func head_aabb(t: float) -> AABB:
	sample(t, 0.0)
	var v := _verts_in(tower_root)
	var box := AABB(v[0], Vector3.ZERO)
	for p in v:
		box = box.expand(p)
	return box

func tris(under: Node) -> int:
	var n := 0
	for g in geometry(under):
		if g is MeshInstance3D and not flashes.has(g):
			for s in g.mesh.get_surface_count():
				var idx = g.mesh.surface_get_arrays(s)[Mesh.ARRAY_INDEX]
				n += (idx.size() if idx != null else g.mesh.surface_get_arrays(s)[Mesh.ARRAY_VERTEX].size()) / 3
	return n

func surfaces(under: Node) -> int:
	var n := 0
	for g in geometry(under):
		if g is MeshInstance3D and not flashes.has(g):
			n += g.mesh.get_surface_count()
	return n

func report() -> Array:
	var L := []
	L.append("== %s ==" % kind)
	for p in problems: L.append("  PROBLEM: " + p)
	if head_root == null: return L
	L.append("  head_root: %s (contract (0, 0.424, 0) Godot = (0,0,0.424) Blender)" % [rest[head_root].origin])
	for pair in [["pivot_*", pivots], ["muzzle_*", muzzles], ["recoil_axis_*", recoil_axes], ["barrel_spin_*", spins]]:
		var names := []
		for n in pair[1]: names.append("%s<-%s" % [n.name, n.get_parent().name])
		L.append("  %s: %d %s" % [pair[0], pair[1].size(), names])
	var bad_parent := []
	for n in muzzles + recoil_axes + spins:
		if not String(n.get_parent().name).begins_with("pivot_"): bad_parent.append(String(n.name))
	L.append("  muzzle/recoil/spin under pivot_*: %s" % ("yes" if bad_parent.is_empty() else "NO " + str(bad_parent)))
	var rot_nonzero := []
	for n in rest.keys():
		var b: Basis = rest[n].basis
		if not b.is_equal_approx(Basis.IDENTITY): rot_nonzero.append(String(n.name))
	L.append("  rest rotation/scale = identity for all head nodes: %s" % ("yes" if rot_nonzero.is_empty() else "NO " + str(rot_nonzero)))
	if anim == null: return L
	var tnames := []
	var foreign := []
	for tr in tracks:
		var nm := String(tr[0].name)
		tnames.append("%s:%s" % [nm, ["value", "pos", "rot", "scale"][min(tr[1], 3)] if tr[1] <= 3 else str(tr[1])])
		if nm != "head_root" and not nm.begins_with("pivot_"): foreign.append(nm)
	L.append("  clip deploy: %.3f s (contract 1.50), tracks %s" % [clip_len, tnames])
	L.append("  channels only on head_root/pivot_*: %s" % ("yes" if foreign.is_empty() else "NO " + str(foreign)))
	var end_err := 0.0
	sample(clip_len, 0.0)
	for tr in tracks:
		var n: Node3D = tr[0]
		end_err = maxf(end_err, n.transform.origin.distance_to(rest[n].origin))
		end_err = maxf(end_err, n.quaternion.angle_to(rest[n].basis.get_rotation_quaternion()))
	L.append("  clip end == rest (battle pose = zeros): max err %.5f -> %s" % [end_err, "yes" if end_err < 1e-3 else "NO"])
	sample(0.0, 0.0)
	var hy := rad_to_deg(head_root.quaternion.get_euler().y)
	var piv := []
	for p in pivots: piv.append("%s %s" % [p.name, (p.quaternion.get_euler() * 180.0 / PI).snapped(Vector3.ONE * 0.1)])
	L.append("  frame 1 (folded): head_root yaw %.1f deg (contract -90), pivots %s" % [hy, piv])
	sample(clip_len, 0.0)
	var mz := []
	for m in muzzles:
		var hp := rel_xform(m, head_root)
		mz.append("%s at %s fwd %s" % [m.name, hp.origin.snapped(Vector3.ONE * 0.001), (-hp.basis.z).snapped(Vector3.ONE * 0.01)])
	L.append("  muzzles (battle pose, head space; barrels must point -Z): %s" % [mz])
	var rr := turn_radius()
	L.append("  turn radius 360 deg from head_root axis: %.3f (declared %.2f)" % [rr, Cfg.DECLARED_TURN_RADIUS.get(kind, 0.0)])
	for pose in [["battle", clip_len], ["folded", 0.0]]:
		var b := head_aabb(pose[1])
		var hx := maxf(absf(b.position.x), absf(b.end.x))
		var hz := maxf(absf(b.position.z), absf(b.end.z))
		L.append("  head extent %s: |x|<=%.3f |z|<=%.3f h %.3f..%.3f -> inside pad (0.90 x 0.94): %s" % [pose[0], hx, hz, b.position.y, b.end.y, "yes" if hx <= Cfg.PAD_HALF.x and hz <= Cfg.PAD_HALF.y else "NO"])
	L.append("  tris: tower %d, head %d, platform %d; surfaces (draw calls per tower, no shadows): %d" % [tris(model), tris(head_root), tris(platform) if platform else 0, surfaces(model)])
	sample(clip_len, 0.0)
	return L
