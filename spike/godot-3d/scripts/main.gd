extends Node3D
## Polygon scene: field, road, pads, target, towers, enemies, HUD, keys and automated runs.
## Automated runs: godot --path . -- --auto=contract|style|grid|swap|bench|appear

const KEYS_TEXT := """F1  hide this list
1   contract: print, deploy back/fwd (selected)
2   combat on/off
3   appear (selected)
4   swap 3->4 (selected Turret)
Tab select tower
5   materials zonal / _vc
6   outline off / hull / post
7   SSAO
8   teal glow
9   grid step 1.80 / 2.36
0   tower scale 1.0 / 0.9 / 0.85
T   shadows off / PSSM4 / ortho
L   towers 4 / 20 / 40
E   enemies 0 / 300
C   camera game / close
P   screenshot + capsule
B   bench (all scenarios)"""

const OUTLINE_NAMES := ["off", "hull", "post"]
const SHADOW_NAMES := ["off", "pssm4", "ortho"]

var cam: Camera3D
var sun: DirectionalLight3D
var env: Environment
var towers: Array = []
var selected := 0
var target: MeshInstance3D
var target_x := 0.0
var target_dir := 1.0
var target_frozen = null       # Vector3 to hold the target still (style / grid shots)
var enemies: Enemies
var tiles: MultiMeshInstance3D
var hud: Label
var keys_label: Label
var post_quad: MeshInstance3D
var hull_mat: ShaderMaterial
var capsule_vp: SubViewport
var capsule_cam: Camera3D
var outline_mode := 0
var shadow_mode := 1
var ssao := false
var glow := false
var layout_count := 4
var layout_kind := "rows"      # rows | grid_demo
var combat := true
var close_cam := false
var enemy_count := 0
var hud_acc := 0.0
var frame_ms_acc := 0.0
var frame_n := 0
var shots_dir := ""
var retarget_tick := 0

func _ready() -> void:
	shots_dir = ProjectSettings.globalize_path("res://shots/")
	DirAccess.make_dir_recursive_absolute(shots_dir + "raw")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://out/"))
	RenderingServer.viewport_set_measure_render_time(get_viewport().get_viewport_rid(), true)
	Engine.max_fps = 0
	_build_world()
	_build_ui()
	rebuild_layout()
	var auto := ""
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--auto="):
			auto = a.substr(7)
	if auto != "":
		keys_label.visible = false
		call_deferred("_run_auto", auto)

# ---------------- world ----------------

func _build_world() -> void:
	env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color8(0x2c, 0x2b, 0x22)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color8(0xb8, 0xb4, 0xa4)
	env.ambient_light_energy = 0.45
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	env.glow_hdr_threshold = 1.0
	env.glow_intensity = 0.9
	env.glow_bloom = 0.0
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	sun = DirectionalLight3D.new()
	sun.light_energy = 1.25
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 40.0
	var dir := Vector3(0.6, -1.0, 0.35).normalized()   # from the upper left of the screen
	sun.transform = Transform3D(Basis.looking_at(dir, Vector3.UP), Vector3.ZERO)
	add_child(sun)
	_apply_shadows()

	var ground := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(80, 60)
	ground.mesh = pm
	var gm := StandardMaterial3D.new()
	gm.albedo_color = Color8(0x3b, 0x3a, 0x2c)
	gm.roughness = 0.95
	ground.material_override = gm
	add_child(ground)

	var road := MeshInstance3D.new()
	var rm := PlaneMesh.new()
	rm.size = Vector2(2.0 * Cfg.ROAD_HALF_LEN + 4.0, 2.0 * Cfg.ROAD_HALF_WIDTH)
	road.mesh = rm
	road.position.y = 0.004
	var rmat := StandardMaterial3D.new()
	rmat.albedo_color = Color8(0x5c, 0x54, 0x42)
	rmat.roughness = 0.95
	road.material_override = rmat
	add_child(road)

	tiles = MultiMeshInstance3D.new()
	tiles.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(tiles)

	target = MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.16
	cm.bottom_radius = 0.2
	cm.height = 0.5
	target.mesh = cm
	var tm := StandardMaterial3D.new()
	tm.albedo_color = Color8(0xe8, 0x3a, 0x3a)
	target.material_override = tm
	add_child(target)

	enemies = Enemies.new()
	add_child(enemies)

	cam = Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.keep_aspect = Camera3D.KEEP_WIDTH
	cam.near = 0.1
	cam.far = 200.0
	add_child(cam)
	_place_camera(cam, Vector3.ZERO, Cfg.GAME_CAMERA_WIDTH)

	hull_mat = ShaderMaterial.new()
	hull_mat.shader = load("res://shaders/outline_hull.gdshader")
	post_quad = MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(2, 2)
	q.flip_faces = true
	var pmat := ShaderMaterial.new()
	pmat.shader = load("res://shaders/outline_post.gdshader")
	q.material = pmat
	post_quad.mesh = q
	post_quad.extra_cull_margin = 16384.0
	post_quad.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	post_quad.visible = false
	cam.add_child(post_quad)
	post_quad.position = Vector3(0, 0, -1)

	capsule_vp = SubViewport.new()
	capsule_vp.size = Vector2i(Cfg.CAPSULE_PX, Cfg.CAPSULE_PX)
	capsule_vp.render_target_update_mode = SubViewport.UPDATE_DISABLED
	capsule_vp.transparent_bg = false
	add_child(capsule_vp)
	capsule_cam = Camera3D.new()
	capsule_cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	capsule_cam.keep_aspect = Camera3D.KEEP_WIDTH
	capsule_vp.add_child(capsule_cam)

func _place_camera(c: Camera3D, center: Vector3, width: float) -> void:
	var p := deg_to_rad(Cfg.CAMERA_PITCH_DEG)
	c.size = width
	c.position = center + Vector3(0, sin(p), cos(p)) * 40.0
	c.look_at(center, Vector3.UP)

func _apply_shadows() -> void:
	sun.shadow_enabled = shadow_mode != 0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL if shadow_mode == 2 else DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS

func _build_ui() -> void:
	var cl := CanvasLayer.new()
	add_child(cl)
	hud = Label.new()
	hud.position = Vector2(10, 8)
	hud.add_theme_color_override("font_color", Color(1, 1, 0.85))
	hud.add_theme_color_override("font_outline_color", Color.BLACK)
	hud.add_theme_constant_override("outline_size", 4)
	hud.add_theme_font_size_override("font_size", 14)
	cl.add_child(hud)
	keys_label = Label.new()
	keys_label.text = KEYS_TEXT
	keys_label.position = Vector2(1280 - 330, 8)
	keys_label.add_theme_color_override("font_color", Color(0.85, 0.95, 0.9))
	keys_label.add_theme_color_override("font_outline_color", Color.BLACK)
	keys_label.add_theme_constant_override("outline_size", 4)
	keys_label.add_theme_font_size_override("font_size", 13)
	cl.add_child(keys_label)

# ---------------- layout ----------------

func layout_positions() -> Array:
	var s: float = Cfg.cell_step
	var out := []
	if layout_kind == "grid_demo":
		# 2x2 block: A->B, B->A (side by side), C->A (behind), D->A (diagonal)
		out = [[Vector2(-0.5, -0.5), "turret"], [Vector2(0.5, -0.5), "machine_gun"],
			[Vector2(-0.5, 0.5), "machine_gun"], [Vector2(0.5, 0.5), "turret"]]
		for o in out: o[0] *= s
		return out
	var cols := 2 if layout_count <= 4 else layout_count / 4
	var rows := [-1, 1] if layout_count <= 4 else [-2, -1, 1, 2]
	for r in rows.size():
		for c in cols:
			var x := (c - (cols - 1) / 2.0) * s
			var z: float = rows[r] * s
			out.append([Vector2(x, z), "turret" if (r + c) % 2 == 0 else "machine_gun"])
	return out

func rebuild_layout() -> void:
	for t in towers:
		t.queue_free()
	towers.clear()
	var pos := layout_positions()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	var tile := PlaneMesh.new()
	tile.size = Vector2(Cfg.cell_step - 0.08, Cfg.cell_step - 0.08)
	var tmat := StandardMaterial3D.new()
	tmat.albedo_color = Color8(0x47, 0x46, 0x38)
	tmat.roughness = 0.95
	tile.material = tmat
	mm.mesh = tile
	mm.instance_count = pos.size()
	for i in pos.size():
		var p: Vector2 = pos[i][0]
		mm.set_instance_transform(i, Transform3D(Basis(), Vector3(p.x, 0.008, p.y)))
		var t := Tower.new()
		t.position = Vector3(p.x, 0, p.y)
		t.scale = Vector3.ONE * Cfg.tower_scale
		add_child(t)
		t.setup(pos[i][1])
		t.fire_enabled = combat
		t.became_ready.connect(_on_ready)
		towers.append(t)
	tiles.multimesh = mm
	selected = clampi(selected, 0, towers.size() - 1)
	apply_style()

func _on_ready(t: Tower, seconds: float) -> void:
	print("[ready] %s tower #%d combat-ready after %.4f s (%d ticks), BUILD_WARMUP_SECONDS=%.2f" % [t.kind, towers.find(t), seconds, roundi(seconds / Cfg.SIM_STEP), Cfg.BUILD_WARMUP_SECONDS])
	for s in t.swap_log:
		print("   " + s)

# ---------------- style ----------------

func tower_materials() -> Array:
	var mats := []
	for t in towers:
		for g in t.geometry_all():
			if g is MeshInstance3D and g.mesh != null and not (g.mesh is QuadMesh):
				for s in g.mesh.get_surface_count():
					var m = g.mesh.surface_get_material(s)
					if m != null and not mats.has(m):
						mats.append(m)
	return mats

func apply_style() -> void:
	for m in tower_materials():
		if m is BaseMaterial3D:
			m.next_pass = hull_mat if outline_mode == 1 else null
			if m.resource_name == "teal_indicator":
				m.emission_enabled = true
				m.emission_energy_multiplier = Cfg.teal_emission_strength * (3.0 if glow else 1.0)
	post_quad.visible = outline_mode == 2
	env.ssao_enabled = ssao
	env.glow_enabled = glow
	_apply_shadows()

# ---------------- loop ----------------

func _physics_process(_d: float) -> void:
	var dt := Cfg.SIM_STEP
	if target_frozen != null:
		target.position = target_frozen
	else:
		target_x += target_dir * 2.0 * dt
		if absf(target_x) > Cfg.ROAD_HALF_LEN - 2.0:
			target_dir = -target_dir
		target.position = Vector3(target_x, 0.25, 0.0)
	retarget_tick += 1
	for i in towers.size():
		var t: Tower = towers[i]
		if layout_kind == "grid_demo":
			var aim_at: int = [1, 0, 0, 0][i]
			t.aim_point = towers[aim_at].global_position + Vector3(0, 0.6, 0)
		elif enemy_count > 0:
			if (retarget_tick + i) % 10 == 0:
				t.aim_point = enemies.nearest(t.global_position, 8.0)
		else:
			t.aim_point = target.global_position

func _process(delta: float) -> void:
	hud_acc += delta
	frame_ms_acc += delta * 1000.0
	frame_n += 1
	if hud_acc >= 0.25:
		var m := metrics()
		hud.text = "FPS %d   frame %.2f ms (avg)\nCPU process %.2f ms  physics %.2f ms  render CPU %.2f ms  GPU %.2f ms\ndraw calls %d (visible %d, shadow %d)   tris %d (visible %d, shadow %d)\nshadow passes %d   objects %d\n%s" % [
			m.fps, frame_ms_acc / frame_n, m.cpu_process_ms, m.cpu_physics_ms, m.cpu_render_ms, m.gpu_ms,
			m.draw_calls, m.vis_draw, m.shadow_draw, m.primitives, m.vis_prims, m.shadow_prims, m.shadow_passes, m.objects, state_line()]
		hud_acc = 0.0
		frame_ms_acc = 0.0
		frame_n = 0

func state_line() -> String:
	var sel := ""
	if towers.size() > 0:
		sel = "#%d %s (%s)" % [selected, towers[selected].kind, towers[selected].state]
	return "towers %d  enemies %d  mat %s  outline %s  ssao %s  glow %s  shadows %s  step %.2f  scale %.2f  selected %s" % [
		towers.size(), enemy_count, "vc" if Cfg.use_vc else "zonal", OUTLINE_NAMES[outline_mode], ssao, glow, SHADOW_NAMES[shadow_mode], Cfg.cell_step, Cfg.tower_scale, sel]

func metrics() -> Dictionary:
	var vp := get_viewport()
	var rid := vp.get_viewport_rid()
	return {
		"fps": Performance.get_monitor(Performance.TIME_FPS),
		"cpu_process_ms": Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0,
		"cpu_physics_ms": Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0,
		"cpu_render_ms": RenderingServer.viewport_get_measured_render_time_cpu(rid) + RenderingServer.get_frame_setup_time_cpu(),
		"gpu_ms": RenderingServer.viewport_get_measured_render_time_gpu(rid),
		"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"primitives": Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
		"objects": Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),
		"vis_draw": vp.get_render_info(Viewport.RENDER_INFO_TYPE_VISIBLE, Viewport.RENDER_INFO_DRAW_CALLS_IN_FRAME),
		"vis_prims": vp.get_render_info(Viewport.RENDER_INFO_TYPE_VISIBLE, Viewport.RENDER_INFO_PRIMITIVES_IN_FRAME),
		"shadow_draw": vp.get_render_info(Viewport.RENDER_INFO_TYPE_SHADOW, Viewport.RENDER_INFO_DRAW_CALLS_IN_FRAME),
		"shadow_prims": vp.get_render_info(Viewport.RENDER_INFO_TYPE_SHADOW, Viewport.RENDER_INFO_PRIMITIVES_IN_FRAME),
		"shadow_passes": [0, 4, 1][shadow_mode],
	}

# ---------------- keys ----------------

func _unhandled_input(ev: InputEvent) -> void:
	if not (ev is InputEventKey and ev.pressed and not ev.echo):
		return
	var sel: Tower = towers[selected] if towers.size() > 0 else null
	match ev.keycode:
		KEY_F1: keys_label.visible = not keys_label.visible
		KEY_1:
			if sel:
				for l in sel.rig.report(): print(l)
				sel.play_clip(sel.state == "folded")
		KEY_2:
			combat = not combat
			for t in towers: t.fire_enabled = combat
		KEY_3: if sel: sel.appear()
		KEY_4: if sel and not sel.swap_to_machine_gun(): print("swap: select a combat-ready Turret")
		KEY_TAB:
			if towers.size() > 0: selected = (selected + 1) % towers.size()
			if close_cam: _place_camera(cam, towers[selected].position, Cfg.CLOSE_CAMERA_WIDTH)
		KEY_5:
			Cfg.use_vc = not Cfg.use_vc
			rebuild_layout()
		KEY_6:
			outline_mode = (outline_mode + 1) % 3
			apply_style()
		KEY_7:
			ssao = not ssao
			apply_style()
		KEY_8:
			glow = not glow
			apply_style()
		KEY_9:
			Cfg.cell_step = Cfg.CELL_STEPS[(Cfg.CELL_STEPS.find(Cfg.cell_step) + 1) % Cfg.CELL_STEPS.size()]
			rebuild_layout()
		KEY_0:
			Cfg.tower_scale = Cfg.TOWER_SCALES[(Cfg.TOWER_SCALES.find(Cfg.tower_scale) + 1) % Cfg.TOWER_SCALES.size()]
			rebuild_layout()
		KEY_T:
			shadow_mode = (shadow_mode + 1) % 3
			_apply_shadows()
		KEY_L:
			layout_kind = "rows"
			layout_count = {4: 20, 20: 40, 40: 4}[layout_count]
			rebuild_layout()
		KEY_E:
			enemy_count = Cfg.ENEMY_COUNT if enemy_count == 0 else 0
			enemies.build(enemy_count)
		KEY_C:
			close_cam = not close_cam
			if close_cam and sel: _place_camera(cam, sel.position, Cfg.CLOSE_CAMERA_WIDTH)
			else: _place_camera(cam, Vector3.ZERO, Cfg.GAME_CAMERA_WIDTH)
		KEY_B:
			await auto_bench()
		KEY_P:
			var stamp := Time.get_datetime_string_from_system().replace(":", "-")
			await screenshot("raw/manual_%s.jpg" % stamp)
			await capsule("raw/manual_%s_capsule.jpg" % stamp)

# ---------------- capture ----------------

func screenshot(rel: String, region := Rect2i()) -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	if region.size != Vector2i.ZERO:
		img = img.get_region(region)
	img.save_jpg(shots_dir + rel, 0.9)
	print("[shot] " + rel)

func capsule(rel: String) -> Image:
	if towers.is_empty(): return null
	_place_camera(capsule_cam, towers[selected].global_position + Vector3(0, 0.4, 0), Cfg.CAPSULE_CAMERA_WIDTH)
	capsule_vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	var img := capsule_vp.get_texture().get_image()
	if rel != "":
		img.save_jpg(shots_dir + rel, 0.92)
		print("[shot] " + rel)
	return img

func wait_frames(n: int) -> void:
	for i in n:
		await get_tree().process_frame

func wait_ticks(n: int) -> void:
	for i in n:
		await get_tree().physics_frame

# ---------------- automated runs ----------------

func _run_auto(mode: String) -> void:
	await wait_frames(5)
	match mode:
		"contract": await auto_contract()
		"appear": await auto_appear()
		"swap": await auto_swap()
		"style": await auto_style()
		"grid": await auto_grid()
		"bench": await auto_bench()
		"stress": await auto_stress()
	get_tree().quit()

func auto_contract() -> void:
	var lines := []
	for k in ["turret", "machine_gun"]:
		for vc in [false, true]:
			Cfg.use_vc = vc
			var r := Rig.create(k, vc)
			add_child(r.model)
			r.model.position = Vector3(0, -50, 0)
			lines.append("[%s]" % ("_vc" if vc else "zonal"))
			lines.append_array(r.report())
			r.model.queue_free()
	Cfg.use_vc = false
	var txt := "\n".join(lines)
	print(txt)
	var f := FileAccess.open("res://out/contract.txt", FileAccess.WRITE)
	f.store_string(txt + "\n")

func auto_appear() -> void:
	close_cam = true
	selected = 0
	_place_camera(cam, towers[0].position, Cfg.CLOSE_CAMERA_WIDTH)
	towers[0].appear()
	for tick in Cfg.ticks(Cfg.BUILD_WARMUP_SECONDS) + 1:
		if tick in [0, 3, 6, 9, 20, 40, 60, 80, 99]:
			await screenshot("raw/appear_t%03d.jpg" % tick)
		await wait_ticks(1)
	await wait_ticks(10)

func auto_swap() -> void:
	close_cam = true
	selected = 0
	target_frozen = Vector3(-2.5, 0.25, 0.6)
	_place_camera(cam, towers[0].position, Cfg.CLOSE_CAMERA_WIDTH)
	await wait_ticks(90)
	towers[0].swap_to_machine_gun()
	var keep := [0, 9, 18, 27, 28, 29, 30, 33, 45, 60, 75, 90, 99]
	for tick in 100:
		if tick in keep:
			await screenshot("raw/swap_t%03d.jpg" % tick, Rect2i(320, 100, 640, 600))
		await wait_ticks(1)
	await wait_ticks(30)
	await screenshot("raw/swap_after.jpg", Rect2i(320, 100, 640, 600))

func auto_style() -> void:
	target_frozen = Vector3(-3.0, 0.25, 0.3)
	combat = false
	for t in towers: t.fire_enabled = false
	await wait_ticks(90)
	var sheet := Image.create(Cfg.CAPSULE_PX * 6, Cfg.CAPSULE_PX * 4, false, Image.FORMAT_RGB8)
	var idx := 0
	var names := []
	for vc in [false, true]:
		Cfg.use_vc = vc
		rebuild_layout()
		for t in towers: t.fire_enabled = false
		await wait_ticks(90)
		for om in 3:
			for s in [false, true]:
				for g in [false, true]:
					outline_mode = om
					ssao = s
					glow = g
					apply_style()
					await wait_frames(4)
					var tag := "%s_%s_ssao%d_glow%d" % ["vc" if vc else "zonal", OUTLINE_NAMES[om], int(s), int(g)]
					await screenshot("raw/style_%s.jpg" % tag)
					await screenshot("raw/style_%s_crop.jpg" % tag, Rect2i(400, 220, 480, 360))
					var img := await capsule("")
					img.convert(Image.FORMAT_RGB8)
					sheet.blit_rect(img, Rect2i(0, 0, Cfg.CAPSULE_PX, Cfg.CAPSULE_PX), Vector2i((idx % 6) * Cfg.CAPSULE_PX, (idx / 6) * Cfg.CAPSULE_PX))
					names.append("%d:%s" % [idx, tag])
					idx += 1
	sheet.save_jpg(shots_dir + "raw/style_capsules_sheet.jpg", 0.92)
	print("[sheet order] " + ", ".join(names))
	outline_mode = 0; ssao = false; glow = false; Cfg.use_vc = false

func auto_grid() -> void:
	layout_kind = "grid_demo"
	for st in Cfg.CELL_STEPS:
		for sc in Cfg.TOWER_SCALES:
			Cfg.cell_step = st
			Cfg.tower_scale = sc
			rebuild_layout()
			for t in towers: t.fire_enabled = false
			_place_camera(cam, Vector3(0, 0.6, 0), 9.5)
			await wait_ticks(60)
			await screenshot("raw/grid_step%.2f_scale%.2f.jpg" % [st, sc], Rect2i(190, 130, 900, 640))
	var tr := {}
	for k in ["turret", "machine_gun"]:
		var r := Rig.create(k, false)
		add_child(r.model)
		tr[k] = r.turn_radius()
		r.model.queue_free()
	var lines := ["turn radius: turret %.3f, machine_gun %.3f" % [tr.turret, tr.machine_gun]]
	for st in Cfg.CELL_STEPS:
		for sc in Cfg.TOWER_SCALES:
			var row := "step %.2f scale %.2f:" % [st, sc]
			for pair in [["turret", "turret"], ["turret", "machine_gun"], ["machine_gun", "machine_gun"]]:
				var reach: float = (tr[pair[0]] + tr[pair[1]]) * sc
				row += "  %s+%s reach %.3f vs step %.2f -> %s (%+.3f); diag %.3f -> %s" % [pair[0], pair[1], reach, st, "overlap" if reach > st else "clear", st - reach, st * sqrt(2.0), "overlap" if reach > st * sqrt(2.0) else "clear"]
			lines.append(row)
	var txt := "\n".join(lines)
	print(txt)
	FileAccess.open("res://out/grid.txt", FileAccess.WRITE).store_string(txt + "\n")
	layout_kind = "rows"; Cfg.cell_step = 1.80; Cfg.tower_scale = 1.0

func bench_one(name: String, n_towers: int, n_enemies: int, vc: bool, sh: int, om := 0, s := false, g := false) -> Dictionary:
	Cfg.use_vc = vc
	shadow_mode = sh
	outline_mode = om
	ssao = s
	glow = g
	layout_kind = "rows"
	if n_towers == 0:
		for t in towers: t.queue_free()
		towers.clear()
		tiles.multimesh = null
	else:
		layout_count = n_towers
		rebuild_layout()
	apply_style()
	if enemy_count != n_enemies:
		enemy_count = n_enemies
		enemies.build(n_enemies)
	await wait_frames(90)
	var keys := ["cpu_process_ms", "cpu_physics_ms", "cpu_render_ms", "gpu_ms"]
	var acc := {}
	for k in keys: acc[k] = 0.0
	var frames := []
	var last := {}
	var t0 := Time.get_ticks_usec()
	var drawn0 := Engine.get_frames_drawn()
	var n := 240
	for i in n:
		var a := Time.get_ticks_usec()
		await get_tree().process_frame
		frames.append((Time.get_ticks_usec() - a) / 1000.0)
		last = metrics()
		for k in keys: acc[k] += last[k]
	var total_ms := (Time.get_ticks_usec() - t0) / 1000.0
	var drawn := Engine.get_frames_drawn() - drawn0
	frames.sort()
	var res := {"name": name, "towers": n_towers, "enemies": n_enemies, "mat": "vc" if vc else "zonal",
		"shadows": SHADOW_NAMES[sh], "outline": OUTLINE_NAMES[om], "ssao": s, "glow": g,
		"frames_sampled": n, "frames_drawn": drawn, "frame_ms_avg": total_ms / n, "frame_ms_p95": frames[int(n * 0.95)], "fps_avg": 1000.0 * n / total_ms}
	for k in keys: res[k] = acc[k] / n
	for k in ["draw_calls", "vis_draw", "shadow_draw", "primitives", "vis_prims", "shadow_prims", "objects", "shadow_passes"]:
		res[k] = last[k]
	print("[bench] %s" % JSON.stringify(res))
	return res

func auto_bench() -> void:
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	# an occluded macOS window is not redrawn: keep the bench window on top
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_ALWAYS_ON_TOP, true)
	DisplayServer.window_move_to_foreground()
	await wait_frames(30)
	var results := []
	for sc in [["towers20", 20, 0], ["towers40", 40, 0], ["enemies300", 0, 300], ["enemies300+towers40", 40, 300]]:
		for vc in ([false, true] if sc[1] > 0 else [false]):
			for sh in [0, 1, 2]:
				results.append(await bench_one(sc[0], sc[1], sc[2], vc, sh))
	# style cost on the 40-tower scene, zonal, PSSM4
	results.append(await bench_one("style40", 40, 0, false, 1))
	results.append(await bench_one("style40", 40, 0, false, 1, 1))
	results.append(await bench_one("style40", 40, 0, false, 1, 2))
	results.append(await bench_one("style40", 40, 0, false, 1, 0, true))
	results.append(await bench_one("style40", 40, 0, false, 1, 0, false, true))
	results.append(await bench_one("style40", 40, 0, true, 1, 1))
	results.append(await bench_one("style40", 40, 0, true, 1, 2))
	var info := {"godot": Engine.get_version_info().string, "driver": RenderingServer.get_current_rendering_driver_name(),
		"method": RenderingServer.get_current_rendering_method(), "adapter": RenderingServer.get_video_adapter_name(),
		"adapter_vendor": RenderingServer.get_video_adapter_vendor(), "window": str(get_viewport().size), "results": results}
	var f := FileAccess.open("res://out/bench_%s.json" % info.driver, FileAccess.WRITE)
	f.store_string(JSON.stringify(info, "  "))
	print("[bench] done -> out/bench_%s.json" % info.driver)

func auto_stress() -> void:
	layout_count = 40
	rebuild_layout()
	enemy_count = Cfg.ENEMY_COUNT
	enemies.build(enemy_count)
	await wait_ticks(120)
	await screenshot("raw/stress_40towers_300enemies.jpg")
