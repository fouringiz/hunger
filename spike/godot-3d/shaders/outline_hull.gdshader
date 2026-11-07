// Variant A: inverted hull. Added as next_pass of every tower material.
shader_type spatial;
render_mode unshaded, cull_front, depth_draw_opaque, fog_disabled;

uniform float width = 0.022;  // world units (~1.4 px at the game camera, 64 px/unit)
uniform vec4 color : source_color = vec4(0.18, 0.161, 0.118, 1.0);  // palette "black" #2e291e

void vertex() {
	VERTEX += NORMAL * width;
}

void fragment() {
	ALBEDO = color.rgb;
}
