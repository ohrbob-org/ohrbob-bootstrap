import bpy

for obj in bpy.context.scene.objects:
    if obj.type == 'CURVE':
        mat_names = [slot.material.name for slot in obj.material_slots if slot.material]
        print(f"Curve: {obj.name}, Materials: {mat_names}")
        for mat in obj.material_slots:
            if mat.material and mat.material.use_nodes:
                try:
                    color = mat.material.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value
                    print(f"  Color: {color[0]:.2f}, {color[1]:.2f}, {color[2]:.2f}")
                except:
                    pass
