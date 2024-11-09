import trimesh

import numpy as np

from typing import Dict, Any

import io

from app.core.logger import logger



class ThreeDProcessor:

    @staticmethod

    def load_mesh(content: bytes, file_type: str) -> trimesh.Trimesh:

        """Load mesh from bytes with proper error handling"""

        try:

            buffer = io.BytesIO(content)

            mesh = trimesh.load(buffer, file_type=file_type)

            

            # Convert scene to mesh if needed

            if isinstance(mesh, trimesh.Scene):

                if len(mesh.geometry) > 0:

                    # Get the first geometry from the scene

                    mesh = next(iter(mesh.geometry.values()))

                else:

                    raise ValueError("Empty scene")

            

            # Ensure it's a Trimesh object

            if not isinstance(mesh, trimesh.Trimesh):

                raise ValueError("Loaded geometry is not a valid mesh")

            

            return mesh

        except Exception as e:

            logger.error(f"Error loading mesh: {str(e)}")

            raise ValueError(f"Failed to load {file_type} file: {str(e)}")



    @staticmethod

    def validate_mesh(mesh: trimesh.Trimesh) -> Dict[str, Any]:

        """Validate mesh and return detailed information"""

        try:

            # Compute face normals if they don't exist

            if not hasattr(mesh, 'face_normals'):

                mesh.face_normals



            # Compute vertex normals if they don't exist

            if not hasattr(mesh, 'vertex_normals'):

                mesh.vertex_normals



            return {

                "vertex_count": len(mesh.vertices),

                "face_count": len(mesh.faces),

                "is_watertight": mesh.is_watertight,

                "is_empty": mesh.is_empty,

                "bounds": mesh.bounds.tolist(),

                "volume": float(mesh.volume) if mesh.is_watertight else None,

                "center_mass": mesh.center_mass.tolist(),

                "has_face_normals": True if hasattr(mesh, 'face_normals') else False,

                "has_vertex_normals": True if hasattr(mesh, 'vertex_normals') else False,

                "has_valid_faces": not any(mesh.area_faces < 1e-8)

            }

        except Exception as e:

            logger.error(f"Error validating mesh: {str(e)}")

            raise ValueError(f"Mesh validation failed: {str(e)}")



    @staticmethod

    def mesh_to_dict(mesh: trimesh.Trimesh) -> Dict[str, Any]:

        """Convert mesh to a format suitable for THREE.js"""

        try:

            # Ensure we have vertex normals

            if not hasattr(mesh, 'vertex_normals'):

                mesh.vertex_normals



            # Convert to format suitable for THREE.js

            vertices = mesh.vertices.tolist()

            faces = mesh.faces.tolist()

            normals = mesh.vertex_normals.tolist()



            # Scale to reasonable size if needed

            bounds = mesh.bounds

            size = np.max(bounds[1] - bounds[0])

            if size > 10 or size < 0.1:

                scale = 1.0 / size

                vertices = (np.array(vertices) * scale).tolist()



            return {

                "vertices": vertices,

                "faces": faces,

                "normals": normals,

                "bounds": mesh.bounds.tolist(),

                "center": mesh.center_mass.tolist()

            }

        except Exception as e:

            logger.error(f"Error converting mesh to dict: {str(e)}")

            raise ValueError(f"Mesh conversion failed: {str(e)}")



    @staticmethod

    def preprocess(mesh: trimesh.Trimesh, 

                   remove_duplicates: bool = True,

                   fix_normals: bool = True,

                   fill_holes: bool = True) -> Dict[str, Any]:

        """Preprocess the mesh with detailed steps"""

        try:

            # Make a copy of the original mesh

            processed_mesh = mesh.copy()

            steps = []

            original_stats = {

                "vertices": len(processed_mesh.vertices),

                "faces": len(processed_mesh.faces),

                "volume": float(processed_mesh.volume) if processed_mesh.is_watertight else None

            }



            # Remove duplicate vertices and faces

            if remove_duplicates:

                initial_vertices = len(processed_mesh.vertices)

                initial_faces = len(processed_mesh.faces)

                

                # Remove duplicate faces

                if len(processed_mesh.faces) > 0:

                    processed_mesh.remove_duplicate_faces()

                    steps.append(f"Removed duplicate faces")

                

                # Remove unreferenced vertices

                processed_mesh.remove_unreferenced_vertices()

                steps.append("Removed unreferenced vertices")

                

                # Remove degenerate faces

                processed_mesh.remove_degenerate_faces()

                steps.append("Removed degenerate faces")

                

                vertices_reduced = initial_vertices - len(processed_mesh.vertices)

                faces_reduced = initial_faces - len(processed_mesh.faces)

                if vertices_reduced > 0:

                    steps.append(f"Reduced {vertices_reduced} vertices")

                if faces_reduced > 0:

                    steps.append(f"Reduced {faces_reduced} faces")



            # Fix surface normals

            if fix_normals:

                # Compute face normals

                processed_mesh.fix_normals()

                steps.append("Fixed surface normals")

                

                # Fix face winding order for watertight meshes

                if processed_mesh.is_watertight:

                    # Use trimesh's built-in methods to ensure consistent winding

                    processed_mesh.fix_normals()

                    processed_mesh.vertex_normals  # This recomputes vertex normals

                    steps.append("Fixed face winding order")



            # Fill holes if the mesh is not watertight

            if fill_holes and not processed_mesh.is_watertight:

                try:

                    # Try to make the mesh watertight

                    initial_faces = len(processed_mesh.faces)

                    processed_mesh = processed_mesh.fill_holes()

                    if len(processed_mesh.faces) > initial_faces:

                        steps.append(f"Filled holes (added {len(processed_mesh.faces) - initial_faces} faces)")

                except Exception as e:

                    logger.warning(f"Could not fill holes: {str(e)}")

                    steps.append("Hole filling skipped")



            # Final cleanup and optimization

            try:

                # Remove any remaining degenerate geometry

                processed_mesh.remove_degenerate_faces()

                processed_mesh.remove_unreferenced_vertices()

                processed_mesh.remove_infinite_values()

                

                # Merge close vertices

                processed_mesh.merge_vertices(merge_tex=True)

                steps.append("Performed final geometry cleanup")



                # Ensure proper normals

                processed_mesh.fix_normals()

                processed_mesh.vertex_normals

                steps.append("Finalized surface normals")



            except Exception as e:

                logger.warning(f"Some cleanup steps skipped: {str(e)}")

                steps.append("Some cleanup steps skipped")



            # Calculate final statistics

            final_stats = {

                "vertices": len(processed_mesh.vertices),

                "faces": len(processed_mesh.faces),

                "volume": float(processed_mesh.volume) if processed_mesh.is_watertight else None,

                "is_watertight": processed_mesh.is_watertight,

                "bounds": processed_mesh.bounds.tolist()

            }



            return {

                "processed_mesh": processed_mesh,

                "steps": steps,

                "statistics": {

                    "original": original_stats,

                    "processed": final_stats,

                    "improvements": {

                        "vertices_reduced": original_stats["vertices"] - final_stats["vertices"],

                        "faces_reduced": original_stats["faces"] - final_stats["faces"],

                        "volume_change": (final_stats["volume"] - original_stats["volume"]) 

                                       if (final_stats["volume"] and original_stats["volume"]) else None

                    }

                }

            }



        except Exception as e:

            logger.error(f"Error preprocessing mesh: {str(e)}")

            raise ValueError(f"Preprocessing failed: {str(e)}")



    @staticmethod

    def augment(mesh: trimesh.Trimesh, 

                scale: float = 1.0,

                rotate_x: float = 0.0,

                rotate_y: float = 0.0,

                rotate_z: float = 0.0) -> Dict[str, Any]:

        """Create meaningful augmentations of the 3D model"""

        try:

            augmented_meshes = {}

            steps = []



            # Scale the mesh

            if scale != 1.0:

                scaled = mesh.copy()

                scaled.apply_scale(scale)

                augmented_meshes["scaled"] = scaled

                steps.append(f"Scaled by factor {scale}")



            # Rotate the mesh

            if any([rotate_x, rotate_y, rotate_z]):

                rotated = mesh.copy()

                if rotate_x:

                    matrix = trimesh.transformations.rotation_matrix(

                        angle=np.radians(rotate_x), direction=[1, 0, 0])

                    rotated.apply_transform(matrix)

                if rotate_y:

                    matrix = trimesh.transformations.rotation_matrix(

                        angle=np.radians(rotate_y), direction=[0, 1, 0])

                    rotated.apply_transform(matrix)

                if rotate_z:

                    matrix = trimesh.transformations.rotation_matrix(

                        angle=np.radians(rotate_z), direction=[0, 0, 1])

                    rotated.apply_transform(matrix)

                augmented_meshes["rotated"] = rotated

                steps.append(f"Rotated: X={rotate_x}°, Y={rotate_y}°, Z={rotate_z}°")



            # Mirror the mesh

            mirrored = mesh.copy()

            mirror_matrix = np.eye(4)

            mirror_matrix[0, 0] = -1

            mirrored.apply_transform(mirror_matrix)

            augmented_meshes["mirrored"] = mirrored

            steps.append("Mirrored along X-axis")



            # Create a simplified version

            if len(mesh.faces) > 1000:

                simplified = mesh.copy()

                target_faces = len(mesh.faces) // 2

                simplified = simplified.simplify_quadratic_decimation(target_faces)

                augmented_meshes["simplified"] = simplified

                steps.append(f"Simplified to {target_faces} faces")



            return {

                "augmented_meshes": augmented_meshes,

                "steps": steps

            }



        except Exception as e:

            logger.error(f"Error augmenting mesh: {str(e)}")

            raise ValueError(f"Augmentation failed: {str(e)}")



    @staticmethod

    def save_mesh(mesh: trimesh.Trimesh, file_format: str = 'obj') -> bytes:

        """Convert mesh to bytes in specified format"""

        buffer = io.BytesIO()

        mesh.export(buffer, file_format)

        buffer.seek(0)

        return buffer.read()
