// Swap "head flash": additive white overlay on the new head, driven per instance (works for zonal and _vc).
shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_back, shadows_disabled;

instance uniform float flash = 0.0;   // 0..1, set by Tower._tick_head_flash
uniform float peak = 0.4;             // brightness added at flash = 1
uniform vec3 tint : source_color = vec3(1.0);

void fragment() {
	ALBEDO = tint * (flash * peak);
}
