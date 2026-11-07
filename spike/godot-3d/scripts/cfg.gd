extends Node
## Every tunable of the spike in one place (autoload "Cfg").

const SIM_STEP := 1.0 / 60.0

# Build / swap timing (prototype/index.html: BUILD_WARMUP_SECONDS = 1.65).
const BUILD_WARMUP_SECONDS := 1.65
const FADE_IN_SECONDS := 0.15          # appear: alpha fade + dust, then deploy fills the rest
const SWAP_RETRACT_END := 0.45         # 3->4: Turret deploy backwards 0.00-0.45
const SWAP_SUBST_END := 0.55           # 3->4: substitution in folded pose 0.45-0.55
const SWAP_FADE_FRAMES := 2            # old head out in 2 frames, new head in 2 frames
# 0.55-1.65: Machine Gun deploy forwards (ends at BUILD_WARMUP_SECONDS)

# Swap style (anti-"teleport", no model changes): --swap-style=none|cloud|sink_v1|sink (default sink).
# --swap-cover=0/1 is kept as an alias for none/cloud (earlier captures).
var swap_style := "sink"     # none | cloud | sink_v1 | sink
const SWAP_COVER_LEAD := 0.05          # cloud starts 0.05 s before the substitution (0.40 s)
const SWAP_CLOUD_CENTER := Vector3(0, 1.35, 0)        # middle of the folded head (0.42 .. 2.19)
const SWAP_CLOUD_EXTENTS := Vector3(0.75, 0.90, 0.75)
const SWAP_CLOUD_PUFF := 0.55
const SWAP_CLOUD_AMOUNT := 160
const SWAP_CLOUD_LIFETIME := 0.30      # opaque from 12 % to 60 % of life: 0.436 .. 0.58 s, gone by 0.70 s
const SWAP_CLOUD_COLOR := Color8(0xa8, 0x98, 0x7c)
const SWAP_SCALE_FROM := 0.85          # new head grows 0.85 -> 1.0 over the first 0.2 s of its deploy
const SWAP_SCALE_SECONDS := 0.20
# "sink_v1" (2026-11-07, rejected: invisible on the game camera): retract 0.00-0.45, old head 1.0 -> 0.6
# and down 0.10 over 0.45-0.50, new head back over 0.50-0.55, small collar dust; deploy 0.55-1.65.
const SWAP_SINK1_END := 0.50
const SWAP_SINK1_SCALE := 0.6
const SWAP_SINK1_DROP := 0.10
# "sink" (v2): retract 0.00-0.30 (x5.0), old head down 0.35 and 1.0 -> 0.6 over 0.30-0.45 (ease-in),
# substitution at 0.45, new head up from -0.35 / 0.6 over 0.45-0.60 (ease-out), no flash (a head flash
# was tried and rejected, see REPORT update 4; no dust), Machine Gun deploy 0.60-1.65 (x1.43). Depth test stays on:
# the platform hides the part of the head below the collar.
const SWAP_SINK_RETRACT_END := 0.30
const SWAP_SINK_SUBST := 0.45
const SWAP_SINK_RISE_END := 0.60
const SWAP_SINK_SCALE := 0.6
const SWAP_SINK_DROP := 0.35

## [retract end, sink end (= substitution), deploy start] in ticks for the current swap style.
func swap_ticks() -> Array:
	match swap_style:
		"sink": return [ticks(SWAP_SINK_RETRACT_END), ticks(SWAP_SINK_SUBST), ticks(SWAP_SINK_RISE_END)]
		"sink_v1": return [ticks(SWAP_RETRACT_END), ticks(SWAP_SINK1_END), ticks(SWAP_SUBST_END)]
		_: return [ticks(SWAP_RETRACT_END), ticks(SWAP_RETRACT_END), ticks(SWAP_SUBST_END)]

# Grid and scale (one parameter each; models are not touched).
const CELL_STEPS := [1.80, 2.36]
const TOWER_SCALES := [1.0, 0.9, 0.85]
var cell_step := 1.80
var tower_scale := 1.0
const PAD_HALF := Vector2(0.90, 0.94)  # contract p.8: half pad, x and depth
const RING_RADIUS := 0.32              # contract p.7: ring diameter 0.64
const RING_TOP := 0.424                # contract p.1: head_root sits on top of the ring
const DECLARED_TURN_RADIUS := {"turret": 1.18, "machine_gun": 1.12}

# Camera: orthographic, 49.4 deg pitch, looking from the south.
const CAMERA_PITCH_DEG := 49.4
const GAME_CAMERA_WIDTH := 20.0        # world units across 1280 px (64 px/unit, pad 1.80 = 115 px)
const CLOSE_CAMERA_WIDTH := 7.0
const CAPSULE_PX := 160
const CAPSULE_CAMERA_WIDTH := 2.4

# Combat feel (visual only).
const TURN_RATE := 5.0                 # rad/s
const RECOIL_DIST := 0.07
const RECOIL_TIME := 0.12
const FLASH_TICKS := 3
const TURRET_FIRE_PERIOD := 0.30
const MG_FIRE_PERIOD := 0.08
const MG_SPIN_MAX := 30.0              # rad/s
const MG_SPIN_ACCEL := 40.0

# Enemies stress test.
const ENEMY_COUNT := 300
const ROAD_HALF_LEN := 14.0
const ROAD_HALF_WIDTH := 0.7

var teal_emission_strength := 0.8      # overwritten from palette.json when reachable

var use_vc := false

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--swap-cover="):
			swap_style = "none" if a.substr(13) == "0" else "cloud"
		if a.begins_with("--swap-style="):
			swap_style = a.substr(13)
		if a == "--vc":
			use_vc = true
	var p := ProjectSettings.globalize_path("res://") + "../../assets/art/work/style/palette.json"
	if FileAccess.file_exists(p):
		var data = JSON.parse_string(FileAccess.get_file_as_string(p))
		if data is Dictionary and data.has("emission_strength"):
			teal_emission_strength = float(data["emission_strength"].get("teal_indicator", teal_emission_strength))

func model_path(kind: String, vc: bool) -> String:
	return "res://models/%s_static%s.glb" % [kind, "_vc" if vc else ""]

func deploy_speed_appear(clip_len: float) -> float:
	return clip_len / (BUILD_WARMUP_SECONDS - FADE_IN_SECONDS)

func swap_retract_speed(clip_len: float) -> float:
	return clip_len / SWAP_RETRACT_END

func swap_deploy_speed(clip_len: float) -> float:
	return clip_len / (BUILD_WARMUP_SECONDS - SWAP_SUBST_END)

func ticks(seconds: float) -> int:
	return int(round(seconds / SIM_STEP))
