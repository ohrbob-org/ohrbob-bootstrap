import bpy

for obj_name in ['Headband', 'Cup2']:
    obj = bpy.context.scene.objects.get(obj_name)
    if obj:
        print(f"Object {obj.name} modifiers: {[m.name for m in obj.modifiers]}")
        print(f"Bevel object: {obj.data.bevel_object}")
