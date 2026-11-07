class_name Tower
extends Node3D
## A tower on a pad: appear, combat (aim / fire / recoil / spin), manual clip, 3->4 swap.
## Logic runs on the fixed physics step (Cfg.SIM_STEP); the deploy clip plays in the model's
## AnimationPlayer on the same step (it owns fold and pivot_*); code owns head_root.
## Particles are visual only.

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
var dust: GPUParticles3D
var cloud: GPUParticles3D   # dense swap cover (swap_style "cloud")
var collar_dust: GPUParticles3D   # small ring at the collar (swap_style "sink")
var swap_log := []
var ready_pending := false

static var _dust_pm: ParticleProcessMaterial
static var _dust_mesh: QuadMesh
static var _cloud_pm: ParticleProcessMaterial
static var _cloud_mesh: QuadMesh
static var _collar_pm: ParticleProcessMaterial
static var _collar_mesh: QuadMesh

func setup(kind_: String) -> void:
	kind = kind_
	rig = Rig.create(kind, Cfg.use_vc)
	add_child(rig.model)
	rig.pose(rig.clip_len)
	rig.set_yaw(yaw)
	dust = _make_dust()
	add_child(dust)
	cloud = _make_cloud()
	add_child(cloud)
	collar_dust = _make_collar_dust()
	add_child(collar_dust)

func appear() -> void:
	state = "appearing"
	ticks = 0
	swap_log.clear()
	rig.set_alpha(rig.model, 0.0)
	rig.pose(0.0)
	dust.restart()

var clip_forward := true

func play_clip(forward: bool) -> void:
	state = "clip"
	clip_forward = forward
	if forward: rig.play_forward(1.0)
	else: rig.play_backward(1.0)

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
		"clip": _tick_clip()
		"swapping": _tick_swap()
		"combat": _tick_combat(dt)
	if state != "combat":
		spin_speed = maxf(0.0, spin_speed - Cfg.MG_SPIN_ACCEL * dt)
	rig.step(dt)
	if old_rig != null and old_rig != rig:
		old_rig.step(dt)
	if ready_pending:
		ready_pending = false
		_ready_now(rig)
	rig.tick_fx(dt, spin_speed)

# A clip started in tick k is advanced by one step in the same tick and reaches its end
# n-1 ticks later (n = clip_len / (speed * SIM_STEP)).

func _tick_appear() -> void:
	var fade_ticks := Cfg.ticks(Cfg.FADE_IN_SECONDS)                 # 9
	if ticks < fade_ticks:
		rig.set_alpha(rig.model, float(ticks) / fade_ticks)
	elif ticks == fade_ticks:
		rig.set_alpha(rig.model, 1.0)
	elif ticks == fade_ticks + 1:
		rig.play_forward(Cfg.deploy_speed_appear(rig.clip_len))      # ends at tick 99
	if ticks >= Cfg.ticks(Cfg.BUILD_WARMUP_SECONDS):
		ready_pending = true            # reported after this tick's clip step

func _ready_now(r: Rig) -> void:
	var pos := r.clip_pos()
	_log("t=%.3f combat-ready; clip playing=%s pos=%.4f" % [ticks * Cfg.SIM_STEP, r.ap.is_playing(), pos])
	state = "combat"
	became_ready.emit(self, ticks * Cfg.SIM_STEP)

func _tick_clip() -> void:
	if not rig.ap.is_playing():
		state = "combat" if clip_forward else "folded"

func _tick_swap() -> void:
	var t0 := Cfg.ticks(Cfg.SWAP_RETRACT_END)            # 27
	var t1 := Cfg.ticks(Cfg.SWAP_SUBST_END)              # 33
	var t_end := Cfg.ticks(Cfg.BUILD_WARMUP_SECONDS)     # 99
	var f := Cfg.SWAP_FADE_FRAMES
	var style := Cfg.swap_style
	if ticks == 1:
		# head_root keeps the current aim: only fold/pivot_* move (contract p.6)
		old_rig.play_backward(Cfg.swap_retract_speed(old_rig.clip_len))   # ends at tick 27
	if style == "cloud" and ticks == t0 - Cfg.ticks(Cfg.SWAP_COVER_LEAD):
		cloud.restart()
	if ticks == t0 + 1:
		_log("t=%.3f retract finished on the previous tick: old clip playing=%s pos=%.4f" % [(ticks - 1) * Cfg.SIM_STEP, old_rig.ap.is_playing(), old_rig.clip_pos()])
	if ticks == t0:
		_log("t=%.3f before this tick's step: old clip playing=%s pos=%.4f, old head_root yaw %.1f deg" % [ticks * Cfg.SIM_STEP, old_rig.ap.is_playing(), old_rig.clip_pos(), rad_to_deg(old_rig.head_root.rotation.y)])
		if style != "sink":
			dust.restart()
		# new head appears folded, in the same aim direction, without its own platform
		rig = Rig.create("machine_gun", Cfg.use_vc)
		add_child(rig.model)
		rig.platform.visible = false
		rig.pose(0.0)
		match style:
			"cloud": rig.set_yaw(yaw, Cfg.SWAP_SCALE_FROM)
			"sink": rig.set_yaw(yaw, Cfg.SWAP_SINK_SCALE, -Cfg.SWAP_SINK_DROP)
			_: rig.set_yaw(yaw)
		if style == "sink":
			rig.head_root.visible = false
		else:
			rig.set_alpha(rig.head_root, 0.0)
	if style == "sink":
		_tick_sink(t0, t1)
	else:
		if ticks > t0 and ticks <= t0 + f:
			old_rig.set_alpha(old_rig.head_root, 1.0 - float(ticks - t0) / f)
		if ticks > t0 + f and ticks <= t0 + 2 * f:
			rig.set_alpha(rig.head_root, float(ticks - t0 - f) / f)
		if ticks == t0 + f:
			_log("t=%.3f old head gone" % (ticks * Cfg.SIM_STEP))
		if ticks == t0 + 2 * f:
			_log("t=%.3f new head fully visible" % (ticks * Cfg.SIM_STEP))
	if ticks == t1 + 1:
		rig.play_forward(Cfg.swap_deploy_speed(rig.clip_len))             # ends at tick 99
	if style == "cloud" and ticks > t1:
		var k := clampf(float(ticks - t1) / Cfg.ticks(Cfg.SWAP_SCALE_SECONDS), 0.0, 1.0)
		var e := 1.0 - (1.0 - k) * (1.0 - k)                               # ease out
		rig.set_yaw(yaw, lerpf(Cfg.SWAP_SCALE_FROM, 1.0, e))
	if ticks >= t_end:
		rig.set_yaw(yaw, 1.0)
		kind = "machine_gun"
		_log("t=%.3f new head_root yaw %.1f deg (same as before swap)" % [ticks * Cfg.SIM_STEP, rad_to_deg(rig.head_root.rotation.y)])
		ready_pending = true            # reported after this tick's clip step

## "Sink and raise": ticks t0+1..tm sink the old head (ease-in), tick tm+1 swaps heads at the
## bottom pose, ticks tm+1..t1 raise the new one (ease-out). 3 frames each at 60 Hz.
func _tick_sink(t0: int, t1: int) -> void:
	var tm := Cfg.ticks(Cfg.SWAP_SINK_END)                # 30
	var s0 := Cfg.SWAP_SINK_SCALE
	var d0 := Cfg.SWAP_SINK_DROP
	if ticks == tm - 1:
		collar_dust.restart()
	if ticks > t0 and ticks <= tm:
		var k := float(ticks - t0) / (tm - t0)
		var e := k * k
		old_rig.set_yaw(yaw, lerpf(1.0, s0, e), -d0 * e)
		_log("t=%.3f old head scale %.3f dy %.3f" % [ticks * Cfg.SIM_STEP, lerpf(1.0, s0, e), -d0 * e])
	if ticks == tm + 1:
		old_rig.head_root.visible = false
		rig.head_root.visible = true
	if ticks > tm and ticks <= t1:
		var k := float(ticks - tm - 1) / (t1 - tm - 1)
		var e := 1.0 - (1.0 - k) * (1.0 - k)
		rig.set_yaw(yaw, lerpf(s0, 1.0, e), -d0 * (1.0 - e))
		_log("t=%.3f new head scale %.3f dy %.3f (old hidden)" % [ticks * Cfg.SIM_STEP, lerpf(s0, 1.0, e), -d0 * (1.0 - e)])

func _tick_combat(dt: float) -> void:
	var has_target := aim_point != null
	var diff := 0.0
	if has_target:
		var local := to_local(aim_point)
		var want := atan2(-local.x, -local.z)
		diff = angle_difference(yaw, want)
		yaw += clampf(diff, -Cfg.TURN_RATE * dt, Cfg.TURN_RATE * dt)
	rig.set_yaw(yaw)
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
		m.vertex_color_is_srgb = true
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

# ---------- swap cover: a dense, tall cloud over the whole folded head for the substitution ----------

func _make_cloud() -> GPUParticles3D:
	if _cloud_pm == null:
		var pm := ParticleProcessMaterial.new()
		pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
		pm.emission_box_extents = Cfg.SWAP_CLOUD_EXTENTS
		pm.direction = Vector3.UP
		pm.spread = 180.0
		pm.initial_velocity_min = 0.05
		pm.initial_velocity_max = 0.25
		pm.gravity = Vector3(0, 0.15, 0)
		pm.damping_min = 0.5
		pm.damping_max = 1.0
		pm.scale_min = 0.8
		pm.scale_max = 1.3
		var sc := Curve.new()
		sc.add_point(Vector2(0, 0.7))
		sc.add_point(Vector2(0.25, 1.0))
		sc.add_point(Vector2(1, 1.25))
		var sct := CurveTexture.new()
		sct.curve = sc
		pm.scale_curve = sct
		var g := Gradient.new()
		var c := Cfg.SWAP_CLOUD_COLOR
		g.set_color(0, Color(c, 0.0))
		g.set_color(1, Color(c, 0.0))
		g.add_point(0.12, Color(c, 1.0))
		g.add_point(0.6, Color(c, 1.0))
		var gt := GradientTexture1D.new()
		gt.gradient = g
		pm.color_ramp = gt
		_cloud_pm = pm
		var rg := Gradient.new()
		rg.set_color(0, Color(1, 1, 1, 1))
		rg.set_color(1, Color(1, 1, 1, 0))
		rg.add_point(0.55, Color(1, 1, 1, 1))     # solid core: overlapping puffs give an opaque cover
		var tex := GradientTexture2D.new()
		tex.gradient = rg
		tex.fill = GradientTexture2D.FILL_RADIAL
		tex.fill_from = Vector2(0.5, 0.5)
		tex.fill_to = Vector2(1.0, 0.5)
		tex.width = 64
		tex.height = 64
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
		m.vertex_color_use_as_albedo = true
		m.albedo_texture = tex
		m.vertex_color_is_srgb = true
		m.no_depth_test = true        # the cover is drawn over the head it hides
		m.render_priority = 10
		_cloud_mesh = QuadMesh.new()
		_cloud_mesh.size = Vector2(Cfg.SWAP_CLOUD_PUFF, Cfg.SWAP_CLOUD_PUFF)
		_cloud_mesh.material = m
	var p := GPUParticles3D.new()
	p.process_material = _cloud_pm
	p.draw_pass_1 = _cloud_mesh
	p.amount = Cfg.SWAP_CLOUD_AMOUNT
	p.lifetime = Cfg.SWAP_CLOUD_LIFETIME
	p.one_shot = true
	p.explosiveness = 1.0
	p.emitting = false
	p.local_coords = false
	p.fixed_fps = 60
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.position = Cfg.SWAP_CLOUD_CENTER
	p.visibility_aabb = AABB(Vector3(-2, -2, -2), Vector3(4, 4, 4))
	return p

# ---------- sink swap: small depth-tested dust ring at the collar ----------
# Bounds (analytic, linear damping): radial reach <= 0.40 + 0.9^2 / (2 * 2.5) = 0.56, plus half a puff
# (0.16 * 1.3 / 2 = 0.10) -> 0.66 < pad half-width 0.90. Rise <= 0.2^2 / (2 * 2.5) = 0.01 + 0.10 above
# the collar (y 0.424) -> top ~0.55, below the folded head body; gravity 0.4 drops it <= 0.04.

func _make_collar_dust() -> GPUParticles3D:
	if _collar_pm == null:
		var pm := ParticleProcessMaterial.new()
		pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_RING
		pm.emission_ring_axis = Vector3.UP
		pm.emission_ring_radius = 0.40
		pm.emission_ring_inner_radius = 0.30
		pm.emission_ring_height = 0.01
		pm.direction = Vector3.UP
		pm.spread = 10.0
		pm.initial_velocity_min = 0.05
		pm.initial_velocity_max = 0.20
		pm.radial_velocity_min = 0.5
		pm.radial_velocity_max = 0.9
		pm.gravity = Vector3(0, -0.4, 0)
		pm.damping_min = 2.5
		pm.damping_max = 3.0
		pm.scale_min = 0.8
		pm.scale_max = 1.0
		var sc := Curve.new()
		sc.add_point(Vector2(0, 0.6))
		sc.add_point(Vector2(1, 1.3))
		var sct := CurveTexture.new()
		sct.curve = sc
		pm.scale_curve = sct
		var g := Gradient.new()
		g.set_color(0, Color8(0x98, 0x87, 0x6d, 220))
		g.set_color(1, Color8(0x98, 0x87, 0x6d, 0))
		var gt := GradientTexture1D.new()
		gt.gradient = g
		pm.color_ramp = gt
		_collar_pm = pm
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
		m.vertex_color_is_srgb = true
		m.albedo_texture = tex           # depth test stays on: the head and hull occlude it
		_collar_mesh = QuadMesh.new()
		_collar_mesh.size = Vector2(0.16, 0.16)
		_collar_mesh.material = m
	var p := GPUParticles3D.new()
	p.process_material = _collar_pm
	p.draw_pass_1 = _collar_mesh
	p.amount = 32
	p.lifetime = 0.45
	p.one_shot = true
	p.explosiveness = 0.9
	p.emitting = false
	p.local_coords = false
	p.fixed_fps = 60
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.position = Vector3(0, Cfg.RING_TOP, 0)
	p.visibility_aabb = AABB(Vector3(-1, -0.5, -1), Vector3(2, 1, 2))
	return p
