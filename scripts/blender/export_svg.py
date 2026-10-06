import bpy
import math
import mathutils

def linear_to_srgb(c):
    if c <= 0.0031308:
        return 12.92 * c
    else:
        return 1.055 * math.pow(c, 1/2.4) - 0.055

def to_hex(rgba):
    r = int(max(0, min(255, round(linear_to_srgb(rgba[0]) * 255))))
    g = int(max(0, min(255, round(linear_to_srgb(rgba[1]) * 255))))
    b = int(max(0, min(255, round(linear_to_srgb(rgba[2]) * 255))))
    return f"#{r:02x}{g:02x}{b:02x}"

def export_svg(filepath):
    # Collect objects
    items = []
    for obj in bpy.context.scene.objects:
        if obj.type == 'CURVE':
            z = (obj.matrix_world @ mathutils.Vector((0,0,0))).z
            items.append((z, obj))
    
    # Sort by Z
    items.sort(key=lambda x: x[0])

    svg_elements = []
    
    min_x = min_y = float('inf')
    max_x = max_y = float('-inf')

    def add_path(obj, matrix, is_mirrored=False):
        nonlocal min_x, min_y, max_x, max_y
        
        # Color
        color = "#000000"
        if obj.material_slots and obj.material_slots[0].material:
            mat = obj.material_slots[0].material
            try:
                c = mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value
                color = to_hex(c)
            except:
                pass
        
        fill = "none"
        stroke = "none"
        if obj.data.fill_mode == 'NONE':
            stroke = color
            stroke_width = "0.02"
        else:
            fill = color
            stroke_width = "0"
            
        d = ""
        for spline in obj.data.splines:
            if spline.type == 'BEZIER':
                pts = spline.bezier_points
                if len(pts) == 0:
                    continue
                
                # We need to map point to SVG space: X = x, Y = -y
                def map_pt(p):
                    nonlocal min_x, min_y, max_x, max_y
                    w = matrix @ p
                    sx, sy = w.x, -w.y
                    min_x = min(min_x, sx)
                    min_y = min(min_y, sy)
                    max_x = max(max_x, sx)
                    max_y = max(max_y, sy)
                    return sx, sy
                
                # If mirrored, the winding order is reversed.
                # In SVG, this might not matter for solid fills, but it's cleaner to reverse the path?
                # Actually, standard SVG fill (nonzero) will fill it correctly. Let's just draw points in order.
                
                p0 = map_pt(pts[0].co)
                d += f"M {p0[0]:.4f} {p0[1]:.4f} "
                
                for i in range(1, len(pts)):
                    h1 = map_pt(pts[i-1].handle_right)
                    h2 = map_pt(pts[i].handle_left)
                    p1 = map_pt(pts[i].co)
                    d += f"C {h1[0]:.4f} {h1[1]:.4f}, {h2[0]:.4f} {h2[1]:.4f}, {p1[0]:.4f} {p1[1]:.4f} "
                
                if spline.use_cyclic_u:
                    h1 = map_pt(pts[-1].handle_right)
                    h2 = map_pt(pts[0].handle_left)
                    p1 = map_pt(pts[0].co)
                    d += f"C {h1[0]:.4f} {h1[1]:.4f}, {h2[0]:.4f} {h2[1]:.4f}, {p1[0]:.4f} {p1[1]:.4f} Z "

        if d:
            gid = f"{obj.name}{'_mirrored' if is_mirrored else ''}"
            path_str = f'<path id="{gid}" d="{d.strip()}" fill="{fill}" stroke="{stroke}" stroke-width="{stroke_width}"/>'
            svg_elements.append(path_str)

    # Process items
    for z, obj in items:
        # Original
        add_path(obj, obj.matrix_world)
        
        # Check for mirror modifier
        has_mirror = False
        mirror_axis = (False, False, False)
        for mod in obj.modifiers:
            if mod.type == 'MIRROR':
                has_mirror = True
                mirror_axis = mod.use_axis
                break
        
        if has_mirror and mirror_axis[0]: # X axis mirror
            mirror_mat = mathutils.Matrix.Scale(-1.0, 4, (1.0, 0.0, 0.0))
            add_path(obj, obj.matrix_world @ mirror_mat, is_mirrored=True)

    # Build SVG
    pad = 0.1
    min_x -= pad; min_y -= pad
    max_x += pad; max_y += pad
    width = max_x - min_x
    height = max_y - min_y

    svg = f'<?xml version="1.0" encoding="utf-8"?>\n'
    svg += f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{min_x:.4f} {min_y:.4f} {width:.4f} {height:.4f}">\n'
    for el in svg_elements:
        svg += f'  {el}\n'
    svg += '</svg>'

    with open(filepath, 'w') as f:
        f.write(svg)

export_svg('/home/kaiwegner/Projects/ohrbob-bootstrap/ohrbob-logo.svg')
