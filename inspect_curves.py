import bpy

for obj in bpy.context.scene.objects:
    if obj.type == 'CURVE':
        print(f"--- Object: {obj.name} ---")
        print(f"Location: {obj.location}")
        
        for i, spline in enumerate(obj.data.splines):
            print(f"  Spline {i} type: {spline.type}")
            if spline.type == 'BEZIER':
                for j, point in enumerate(spline.bezier_points):
                    if j < 2:
                        print(f"    Point {j} co: {point.co}")
        
        print(f"  Matrix World: {obj.matrix_world}")
