from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import settings
from app.core.logger import logger
import trimesh
import numpy as np
import base64
import io
import json

router = APIRouter(prefix=f"{settings.API_V1_STR}/3d", tags=["3D Processing"])



def mesh_to_json(mesh):
    return {
        "vertices": mesh.vertices.tolist(),
        "faces": mesh.faces.tolist(),
        "bounds": mesh.bounds.tolist(),
        "volume": float(mesh.volume) if mesh.is_watertight else None,
        "metadata": {
            "is_watertight": mesh.is_watertight,
            "is_empty": mesh.is_empty,
            "vertices_count": len(mesh.vertices),
            "faces_count": len(mesh.faces),
            "bounds": mesh.bounds.tolist()
        }
    }
    
@router.head("/upload")
async def check_3d_upload():
    return {"status": "ok"}

@router.post("/upload")
async def upload_3d(file: UploadFile = File(...)):
    if file.content_type not in settings.ALLOWED_3D_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        content = await file.read()
        with io.BytesIO(content) as mesh_io:
            mesh = trimesh.load(mesh_io, file_type=file.filename.split('.')[-1])
        logger.info(f"Successfully loaded 3D model: {file.filename}")
        return {"mesh_data": mesh_to_json(mesh)}
    except Exception as e:
        logger.error(f"Error processing 3D file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing 3D file")

@router.post("/preprocess")
async def preprocess_3d(file: UploadFile = File(...)):
    if file.content_type not in settings.ALLOWED_3D_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        content = await file.read()
        with io.BytesIO(content) as mesh_io:
            mesh = trimesh.load(mesh_io)
            
            original = mesh.copy()
            # Enhanced preprocessing
            mesh.remove_duplicate_faces()
            mesh.remove_unreferenced_vertices()
            mesh.fix_normals()
            mesh.fill_holes()
            mesh.remove_degenerate_faces()
            
        logger.info(f"Successfully preprocessed 3D model: {file.filename}")
        return {
            "original": mesh_to_json(original),
            "processed": mesh_to_json(mesh),
            "preprocessing_steps": [
                "Removed duplicate faces",
                "Removed unreferenced vertices",
                "Fixed normals",
                "Filled holes",
                "Removed degenerate faces"
            ]
        }
    except Exception as e:
        logger.error(f"Error preprocessing 3D file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error preprocessing 3D file")

@router.post("/augment")
async def augment_3d(file: UploadFile = File(...)):
    if file.content_type not in settings.ALLOWED_3D_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        content = await file.read()
        with io.BytesIO(content) as mesh_io:
            mesh = trimesh.load(mesh_io)
            
            # Enhanced augmentations
            scaled = mesh.copy()
            scaled.apply_scale(1.5)
            
            rotated = mesh.copy()
            rotation = trimesh.transformations.rotation_matrix(
                angle=np.pi/4,
                direction=[0, 1, 0]
            )
            rotated.apply_transform(rotation)
            
            mirrored = mesh.copy()
            mirror_matrix = np.eye(4)
            mirror_matrix[0, 0] = -1
            mirrored.apply_transform(mirror_matrix)
            
        logger.info(f"Successfully augmented 3D model: {file.filename}")
        return {
            "original": mesh_to_json(mesh),
            "scaled": mesh_to_json(scaled),
            "rotated": mesh_to_json(rotated),
            "mirrored": mesh_to_json(mirrored)
        }
    except Exception as e:
        logger.error(f"Error augmenting 3D file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error augmenting 3D file")