class_name Tower
extends Node3D
## A tower on a pad: appear, combat (aim / fire / recoil / spin), manual clip, 3->4 swap.
## Everything runs on the fixed physics step (Cfg.SIM_STEP); particles are visual only.

signal became_ready(tower: Tower, seconds: float)

var kind := ""
var rig: Rig
var old_rig: Rig            # Turret during a 3->4 swap; its platform stays
var state := "combat"       # appearing | combat | clip | folded | swapping
var ticks := 0
var yaw := 0.0
var aim_point = null        # Vector3 or null
var fire_enabled := true
var fire_cd := 0.0
var fire_side := 0
var spin_speed := 0.0
var clip_dir := 1.0
var dust: GPUParticles3D
var swap_log := []

static var _dust_pm: ParticleProcessMaterial
static var _dust_mesh: QuadMesh

func setup(kind_: String) -> void:
	kind = kind_
	rig = Rig.create(kind, Cfg.use_vc)
	add_child(rig.model)
	rig.sample(rig.clip_len, yaw)
	dust = _make_dust()
	add_child(dust)

func appear() -> void:
	state = "appearing"
	ticks = 0
	rig.set_alpha(rig.model, 0.0)
	rig.sample(0.0, yaw)
	dust.restart()

func play_clip(forward: bool) -> void:
	state = "clip"
	clip_dir = 1.0 if forward else -1.0

func swap_to_machine_gun() -> bool:
	if kind != "turret" or state != "combat":
		return false
	state = "swapping"
	ticks = 0
	old_rig = rig
	swap_log.clear()
	return true

func _physics_process(_d: float) -> void:
	var dt := Cfg.SIM_STEP
	ticks += 1
	match state:
		"appearing": _tick_appear()
		"clip": _tick_clip(dt)
		"swapping": _tick_swap()
		"combat": _tick_combat(dt)
	if state != "combat":
		spin_speed = maxf(0.0, spin_speed - Cfg.MG_SPIN_ACCEL * dt)
	rig.tick_fx(dt, spin_speed)

func _tick_appear() -> void:
	var t := ticks * Cfg.SIM_STEP
	var fade_ticks := Cfg.ticks(Cfg.FADE_IN_SECONDS)
	if ticks < fade_ticks:
		rig.set_alpha(rig.model, float(ticks) / fade_ticks)
		rig.sample(0.0, yaw)
	else:
		rig.set_alpha(rig.model, 1.0)
		rig.sample((ticks - fade_ticks) * Cfg.SIM_STEP * Cfg.deploy_speed_appear(rig.clip_len), yaw)
	if ticks >= Cfg.ticks(Cfg.BUILD_WARMUP_SECONDS):
		rig.sample(rig.clip_len, yaw)
		state = "combat"
		became_ready.emit(self, t)

func _tick_clip(dt: float) -> void:
	var t := rig.clip_t + clip_dir * dt
	rig.sample(t, yaw)
	if clip_dir > 0.0 and rig.clip_t >= rig.clip_len:
		state = "combat"
	elif clip_dir < 0.0 and rig.clip_t <= 0.0:
		state = "folded"

func _tick_swap() -> void:
	var t0 := Cfg.ticks(Cfg.SWAP_RETRACT_END)            # 27
	var t1 := Cfg.ticks(Cfg.SWAP_SUBST_END)              # 33
	var t_end := Cfg.ticks(Cfg.BUILD_WARMUP_SECONDS)     # 99
	var f := Cfg.SWAP_FADE_FRAMES
	if ticks <= t0:
		old_rig.sample(old_rig.clip_len - ticks * Cfg.SIM_STEP * Cfg.swap_retract_speed(old_rig.clip_len), yaw)
	if ticks == t0:
		dust.restart()
		# new head appears folded, invisible, without its own platform
		rig = Rig.create("machine_gun", Cfg.use_vc)
		add_child(rig.model)
		rig.platform.visible = false
		rig.set_alpha(rig.head_root, 0.0)
		rig.sample(0.0, yaw)
		_log("t=%.3f retract done, old clip_t=%.3f; MG spawned folded" % [ticks * Cfg.SIM_STEP, old_rig.clip_t])
	if ticks > t0 and ticks <= t0 + f:
		old_rig.set_alpha(old_rig.head_root, 1.0 - float(ticks - t0) / f)
	if ticks > t0 + f and ticks <= t0 + 2 * f:
		rig.set_alpha(rig.head_root, float(ticks - t0 - f) / f)
		rig.platform.visible = false
	if ticks == t0 + f:
		_log("t=%.3f old head gone" % (ticks * Cfg.SIM_STEP))
	if ticks == t0 + 2 * f:
		_log("t=%.3f new head fully visible" % (ticks * Cfg.SIM_STEP))
	if ticks > t1:
		rig.sample((ticks - t1) * Cfg.SIM_STEP * Cfg.swap_deploy_speed(rig.clip_len), yaw)
	if ticks >= t_end:
		rig.sample(rig.clip_len, yaw)
		kind = "machine_gun"
		state = "combat"
		_log("t=%.3f MG combat-ready, clip_t=%.3f" % [ticks * Cfg.SIM_STEP, rig.clip_t])
		became_ready.emit(self, ticks * Cfg.SIM_STEP)

func _tick_combat(dt: float) -> void:
	var has_target := aim_point != null
	var diff := 0.0
	if has_target:
		var local := to_local(aim_point)
		var want := atan2(-local.x, -local.z)
		diff = angle_difference(yaw, want)
		yaw += clampf(diff, -Cfg.TURN_RATE * dt, Cfg.TURN_RATE * dt)
	rig.apply_yaw(yaw)
	var on_target := has_target and absf(diff) < 0.12 and fire_enabled
	fire_cd -= dt
	if kind == "machine_gun":
		if on_target:
			spin_speed = minf(Cfg.MG_SPIN_MAX, spin_speed + Cfg.MG_SPIN_ACCEL * dt)
		else:
			spin_speed = maxf(0.0, spin_speed - Cfg.MG_SPIN_ACCEL * dt)
		if on_target and spin_speed > Cfg.MG_SPIN_MAX * 0.6 and fire_cd <= 0.0:
			rig.fire(fire_side)
			fire_side = 1 - fire_side
			fire_cd = Cfg.MG_FIRE_PERIOD
	elif on_target and fire_cd <= 0.0:
		rig.fire(fire_side)
		fire_side = 1 - fire_side
		fire_cd = Cfg.TURRET_FIRE_PERIOD

func _log(s: String) -> void:
	swap_log.append(s)

func geometry_all() -> Array:
	var out := rig.geometry(rig.model)
	if old_rig != null:
		out.append_array(old_rig.geometry(old_rig.model))
	return out

# ---------- dust: procedural ring of soft quads on the ring edge ----------

func _make_dust() -> GPUParticles3D:
	if _dust_pm == null:
		var pm := ParticleProcessMaterial.new()
		pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_RING
		pm.emission_ring_axis = Vector3.UP
		pm.emission_ring_radius = Cfg.RING_RADIUS + 0.02
		pm.emission_ring_inner_radius = Cfg.RING_RADIUS - 0.02
		pm.emission_ring_height = 0.02
		pm.direction = Vector3.UP
		pm.spread = 25.0
		pm.initial_velocity_min = 0.15
		pm.initial_velocity_max = 0.35
		pm.radial_velocity_min = 0.5
		pm.radial_velocity_max = 0.9
		pm.gravity = Vector3(0, -0.35, 0)
		pm.damping_min = 1.2
		pm.damping_max = 1.8
		pm.scale_min = 0.7
		pm.scale_max = 1.3
		var sc := Curve.new()
		sc.add_point(Vector2(0, 0.5))
		sc.add_point(Vector2(1, 1.6))
		var sct := CurveTexture.new()
		sct.curve = sc
		pm.scale_curve = sct
		var g := Gradient.new()
		g.set_color(0, Color8(0x98, 0x87, 0x6d, 200))
		g.set_color(1, Color8(0x98, 0x87, 0x6d, 0))
		var gt := GradientTexture1D.new()
		gt.gradient = g
		pm.color_ramp = gt
		_dust_pm = pm
		var rg := Gradient.new()
		rg.set_color(0, Color(1, 1, 1, 1))
		rg.set_color(1, Color(1, 1, 1, 0))
		var tex := GradientTexture2D.new()
		tex.gradient = rg
		tex.fill = GradientTexture2D.FILL_RADIAL
		tex.fill_from = Vector2(0.5, 0.5)
		tex.fill_to = Vector2(1.0, 0.5)
		tex.width = 32
		tex.height = 32
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
		m.vertex_color_use_as_albedo = true
		m.albedo_texture = tex
		_dust_mesh = QuadMesh.new()
		_dust_mesh.size = Vector2(0.2, 0.2)
		_dust_mesh.material = m
	var p := GPUParticles3D.new()
	p.process_material = _dust_pm
	p.draw_pass_1 = _dust_mesh
	p.amount = 40
	p.lifetime = 0.7
	p.one_shot = true
	p.explosiveness = 0.85
	p.emitting = false
	p.local_coords = false
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.position = Vector3(0, Cfg.RING_TOP, 0)
	p.visibility_aabb = AABB(Vector3(-2, -1, -2), Vector3(4, 3, 4))
	return p
