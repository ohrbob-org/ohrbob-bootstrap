import bpy

for obj in bpy.context.scene.objects:
    print(f"Object: {obj.name}, Type: {obj.type}, Location: {obj.location}")
    if obj.type == 'CURVE':
        for modifier in obj.modifiers:
            print(f"  Modifier: {modifier.name}, Type: {modifier.type}")
