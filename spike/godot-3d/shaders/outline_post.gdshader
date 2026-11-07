// Variant B: screen-space edges from depth + normals (Forward+ only: normal_roughness texture).
// Full-screen quad, drawn in the transparent pass after opaque geometry.
shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_never, depth_test_disabled, cull_disabled, fog_disabled, shadows_disabled;

uniform sampler2D depth_tex : hint_depth_texture, filter_nearest;
uniform sampler2D normal_tex : hint_normal_roughness_texture, filter_nearest;
uniform vec4 color : source_color = vec4(0.18, 0.161, 0.118, 1.0);
uniform float depth_threshold = 0.08;   // world units of view depth
uniform float normal_threshold = 0.45;  // 1 - cos(angle)

void vertex() {
	POSITION = vec4(VERTEX.xy, 1.0, 1.0);
}

float view_depth(vec2 uv, mat4 inv_proj) {
	float d = texture(depth_tex, uv).r;
	vec4 v = inv_proj * vec4(uv * 2.0 - 1.0, d, 1.0);
	return -v.z / v.w;
}

void fragment() {
	vec2 px = 1.0 / VIEWPORT_SIZE;
	float d0 = view_depth(SCREEN_UV, INV_PROJECTION_MATRIX);
	vec3 n0 = texture(normal_tex, SCREEN_UV).xyz * 2.0 - 1.0;
	float dmax = 0.0;
	float nmax = 0.0;
	vec2 offs[4] = vec2[](vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0));
	for (int i = 0; i < 4; i++) {
		vec2 uv = SCREEN_UV + offs[i] * px;
		dmax = max(dmax, abs(view_depth(uv, INV_PROJECTION_MATRIX) - d0));
		vec3 n = texture(normal_tex, uv).xyz * 2.0 - 1.0;
		nmax = max(nmax, 1.0 - dot(n0, n));
	}
	float e = max(step(depth_threshold, dmax), step(normal_threshold, nmax));
	ALBEDO = color.rgb;
	ALPHA = e * color.a;
}
