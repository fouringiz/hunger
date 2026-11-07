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
