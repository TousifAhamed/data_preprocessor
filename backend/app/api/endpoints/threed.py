from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
import trimesh
import io
import os
import numpy as np
from app.processors.threed_processor import ThreeDProcessor
from app.core.logger import logger

router = APIRouter(prefix="/3d", tags=["3D Processing"])

@router.post("/upload")
async def upload_threed(file: UploadFile = File(...)):
    allowed_extensions = {'.obj', '.stl', '.off', '.ply'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    try:
        content = await file.read()
        file_type = file_ext[1:]  # Remove the dot from extension
        
        mesh = ThreeDProcessor.load_mesh(content, file_type)
        validation = ThreeDProcessor.validate_mesh(mesh)
        mesh_data = ThreeDProcessor.mesh_to_dict(mesh)
        
        return JSONResponse(content={
            "filename": file.filename,
            "validation": validation,
            "mesh_data": mesh_data
        })
    except Exception as e:
        logger.error(f"Error processing 3D file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/preprocess")
async def preprocess_3d(
    file: UploadFile = File(...),
    remove_duplicates: bool = Form(True),
    fix_normals: bool = Form(True),
    fill_holes: bool = Form(True)
):
    try:
        content = await file.read()
        file_type = os.path.splitext(file.filename)[1][1:]
        mesh = ThreeDProcessor.load_mesh(content, file_type)
        
        result = ThreeDProcessor.preprocess(
            mesh,
            remove_duplicates=remove_duplicates,
            fix_normals=fix_normals,
            fill_holes=fill_holes
        )
        
        return {
            "processed_mesh": ThreeDProcessor.mesh_to_dict(result["processed_mesh"]),
            "statistics": result["statistics"],
            "steps": result["steps"]
        }
    except Exception as e:
        logger.error(f"Error preprocessing 3D file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/augment")
async def augment_3d(
    file: UploadFile = File(...),
    scale: float = Form(1.0),
    rotate_x: float = Form(0.0),
    rotate_y: float = Form(0.0),
    rotate_z: float = Form(0.0)
):
    try:
        content = await file.read()
        file_type = os.path.splitext(file.filename)[1][1:]
        mesh = ThreeDProcessor.load_mesh(content, file_type)
        
        result = ThreeDProcessor.augment(
            mesh,
            scale=scale,
            rotate_x=rotate_x,
            rotate_y=rotate_y,
            rotate_z=rotate_z
        )
        
        augmented_meshes = {}
        for name, mesh in result["augmented_meshes"].items():
            augmented_meshes[name] = ThreeDProcessor.mesh_to_dict(mesh)
        
        return {
            "augmented_meshes": augmented_meshes,
            "steps": result["steps"]
        }
    except Exception as e:
        logger.error(f"Error augmenting 3D file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))