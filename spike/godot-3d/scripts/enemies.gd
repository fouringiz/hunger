class_name Enemies
extends Node3D
## Stress test: N procedural skinned capsules (3 bones, one run clip) running along the road.

var units: Array = []   # [Node3D, speed, lane]
static var _mesh: ArrayMesh
static var _skin: Skin
static var _lib: AnimationLibrary

func build(count: int) -> void:
	for c in get_children():
		c.queue_free()
	units.clear()
	if count <= 0:
		return
	_ensure_assets()
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	for i in count:
		var root := Node3D.new()
		var sk := _skeleton()
		root.add_child(sk)
		var mi := MeshInstance3D.new()
		mi.mesh = _mesh
		mi.skin = _skin
		sk.add_child(mi)
		mi.skeleton = NodePath("..")
		var ap := AnimationPlayer.new()
		root.add_child(ap)
		ap.add_animation_library("", _lib)
		var lane := rng.randf_range(-Cfg.ROAD_HALF_WIDTH + 0.12, Cfg.ROAD_HALF_WIDTH - 0.12)
		root.position = Vector3(-Cfg.ROAD_HALF_LEN + 2.0 * Cfg.ROAD_HALF_LEN * float(i) / count, 0, lane)
		root.rotation.y = -PI / 2.0   # face +X (direction of travel)
		add_child(root)
		ap.play("run")
		ap.seek(rng.randf() * 0.5, true)
		ap.speed_scale = rng.randf_range(0.9, 1.1)
		units.append([root, rng.randf_range(0.9, 1.3), lane])

func _physics_process(_d: float) -> void:
	var dt := Cfg.SIM_STEP
	for u in units:
		var n: Node3D = u[0]
		n.position.x += u[1] * dt
		if n.position.x > Cfg.ROAD_HALF_LEN:
			n.position.x -= 2.0 * Cfg.ROAD_HALF_LEN

func nearest(p: Vector3, max_r: float):
	var best = null
	var bd := max_r * max_r
	for u in units:
		var q: Vector3 = (u[0] as Node3D).position
		var d := Vector2(q.x - p.x, q.z - p.z).length_squared()
		if d < bd:
			bd = d
			best = q + Vector3(0, 0.3, 0)
	return best

static func _skeleton() -> Skeleton3D:
	var sk := Skeleton3D.new()
	sk.name = "Skeleton3D"
	sk.add_bone("hips")
	sk.set_bone_rest(0, Transform3D(Basis(), Vector3(0, 0.18, 0)))
	sk.add_bone("spine")
	sk.set_bone_parent(1, 0)
	sk.set_bone_rest(1, Transform3D(Basis(), Vector3(0, 0.14, 0)))
	sk.add_bone("head")
	sk.set_bone_parent(2, 1)
	sk.set_bone_rest(2, Transform3D(Basis(), Vector3(0, 0.14, 0)))
	sk.reset_bone_poses()
	return sk

static func _ensure_assets() -> void:
	if _mesh != null:
		return
	var cap := CapsuleMesh.new()
	cap.radius = 0.11
	cap.height = 0.56
	cap.radial_segments = 12
	cap.rings = 6
	var arrays := cap.get_mesh_arrays()
	var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var bones := PackedInt32Array()
	var weights := PackedFloat32Array()
	for i in verts.size():
		verts[i].y += 0.28
		var y := verts[i].y
		var b := [0, 1, 2, 0]
		var w := [0.0, 0.0, 0.0, 0.0]
		if y < 0.20:
			w = [1.0, 0.0, 0.0, 0.0]
		elif y < 0.34:
			var k := (y - 0.20) / 0.14
			w = [1.0 - k, k, 0.0, 0.0]
		else:
			var k2 := clampf((y - 0.34) / 0.12, 0.0, 1.0)
			w = [0.0, 1.0 - k2, k2, 0.0]
		for j in 4:
			bones.append(b[j])
			weights.append(w[j])
	arrays[Mesh.ARRAY_VERTEX] = verts
	arrays[Mesh.ARRAY_BONES] = bones
	arrays[Mesh.ARRAY_WEIGHTS] = weights
	_mesh = ArrayMesh.new()
	_mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color8(0xc8, 0x2a, 0x4a)
	mat.roughness = 0.6
	_mesh.surface_set_material(0, mat)
	_skin = _skeleton().create_skin_from_rest_transforms()
	var a := Animation.new()
	a.length = 0.5
	a.loop_mode = Animation.LOOP_LINEAR
	var th := a.add_track(Animation.TYPE_POSITION_3D)
	a.track_set_path(th, "Skeleton3D:hips")
	var tr := a.add_track(Animation.TYPE_ROTATION_3D)
	a.track_set_path(tr, "Skeleton3D:hips")
	var ts := a.add_track(Animation.TYPE_ROTATION_3D)
	a.track_set_path(ts, "Skeleton3D:spine")
	var thd := a.add_track(Animation.TYPE_ROTATION_3D)
	a.track_set_path(thd, "Skeleton3D:head")
	for k in 5:
		var t := k * 0.125
		var s := sin(k * PI / 2.0)          # 0,1,0,-1,0
		var c := absf(cos(k * PI / 2.0))    # bob twice per cycle
		a.position_track_insert_key(th, t, Vector3(0, 0.18 + 0.04 * c, 0))
		a.rotation_track_insert_key(tr, t, Quaternion(Vector3.FORWARD, 0.18 * s))
		a.rotation_track_insert_key(ts, t, Quaternion(Vector3.RIGHT, -0.3) * Quaternion(Vector3.UP, 0.4 * s))
		a.rotation_track_insert_key(thd, t, Quaternion(Vector3.UP, -0.3 * s))
	_lib = AnimationLibrary.new()
	_lib.add_animation("run", a)
