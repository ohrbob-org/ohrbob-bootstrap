import bpy

for obj in bpy.context.scene.objects:
    if obj.type == 'CURVE':
        print(f"Curve: {obj.name}, Fill: {obj.data.fill_mode}, Bevel: {obj.data.bevel_depth}, Extrude: {obj.data.extrude}")
