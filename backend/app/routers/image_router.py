from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image
import io
from typing import List
from app.processors.image_processor import ImageProcessor
from app.core.config import settings
from app.utils.file_handler import FileHandler

router = APIRouter(prefix="/image", tags=["Image Processing"])

class ImageResponse(BaseModel):
    filename: str
    size: int
    format: str
    width: int
    height: int

class ProcessedImageResponse(BaseModel):
    steps: List[str]
    size: int
    format: str
    width: int
    height: int

@router.head("/upload")
async def check_image_upload():
    return {"status": "ok"}

@router.post("/upload", response_model=ImageResponse)
async def upload_image(file: UploadFile = File(...)):
    try:
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, "Invalid file type")
            
        content = await file.read()
        if len(content) > settings.MAX_IMAGE_SIZE:
            raise HTTPException(400, "File too large")

        image = Image.open(io.BytesIO(content))
        if max(image.size) > settings.MAX_IMAGE_DIMENSION:
            raise HTTPException(400, "Image dimensions too large")
        
        return {
            "filename": file.filename,
            "size": len(content),
            "format": image.format,
            "width": image.width,
            "height": image.height
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process image: {str(e)}"}
        )

@router.post("/process", response_model=ProcessedImageResponse)
async def process_image(file: UploadFile = File(...)):
    try:
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, "Invalid file type")

        content = await file.read()
        image = Image.open(io.BytesIO(content))
        
        processed_image, steps = ImageProcessor.preprocess(image)
        
        # Convert back to bytes for response
        buf = io.BytesIO()
        processed_image.save(buf, format='PNG')
        buf_value = buf.getvalue()
        
        return {
            "steps": steps,
            "size": len(buf_value),
            "format": processed_image.format,
            "width": processed_image.width,
            "height": processed_image.height
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process image: {str(e)}"}
        )