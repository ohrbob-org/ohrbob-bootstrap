import bpy
from mathutils import Vector

z_coords = []
for obj in bpy.context.scene.objects:
    if obj.type == 'CURVE':
        z = (obj.matrix_world @ Vector((0,0,0))).z
        z_coords.append((obj.name, z))

z_coords.sort(key=lambda x: x[1])
for name, z in z_coords:
    print(f"{name}: z={z}")
