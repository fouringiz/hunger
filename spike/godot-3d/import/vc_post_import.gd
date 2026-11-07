@tool
extends EditorScenePostImport
## Import script for the *_vc.glb files (set in their .glb.import, import_script/path).
## Godot's glTF importer leaves vertex_color_use_as_albedo off for a material without
## baseColor, so the _vc file renders white. COLOR_0 is linear in glTF: is_srgb stays off.

func _post_import(scene: Node) -> Object:
	var n := _fix(scene)
	print("[vc_post_import] %s: vertex colour as albedo on %d surface(s)" % [get_source_file(), n])
	return scene

func _fix(node: Node) -> int:
	var count := 0
	if node is MeshInstance3D and node.mesh != null:
		for s in node.mesh.get_surface_count():
			count += _apply(node.mesh.surface_get_material(s))
	elif node is ImporterMeshInstance3D and node.mesh != null:
		for s in node.mesh.get_surface_count():
			count += _apply(node.mesh.get_surface_material(s))
	for c in node.get_children():
		count += _fix(c)
	return count

func _apply(m: Material) -> int:
	if m is BaseMaterial3D:
		m.vertex_color_use_as_albedo = true
		m.vertex_color_is_srgb = false
		return 1
	return 0
