import bpy

for obj in bpy.context.scene.objects:
    if obj.type == 'CURVE':
        for mod in obj.modifiers:
            if mod.type == 'MIRROR':
                print(f"Object {obj.name} has mirror mod: x={mod.use_axis[0]}, y={mod.use_axis[1]}, z={mod.use_axis[2]}, mirror_object={mod.mirror_object}")
