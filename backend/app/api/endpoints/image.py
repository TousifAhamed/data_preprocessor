from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from PIL import Image
import io
from app.processors.image_processor import ImageProcessor
from app.core.logger import logger
import base64

router = APIRouter(prefix="/image", tags=["Image Processing"])

# Helper function to create CORS headers
def get_cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Expose-Headers": "*"
    }

@router.options("/{path:path}")
async def options_route(path: str):
    return JSONResponse(
        content={"message": "OK"},
        headers=get_cors_headers()
    )

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        validation = ImageProcessor.validate_image(image)
        
        # Convert image to base64
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format=image.format or 'PNG')
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        return JSONResponse(
            content={
                "filename": file.filename,
                "validation": validation,
                "image_data": img_base64,
                "original_size": image.size
            },
            headers=get_cors_headers()
        )
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/preprocess")
async def preprocess_image(
    file: UploadFile = File(...),
    resize_width: int = Form(None),
    resize_height: int = Form(None),
    grayscale: bool = Form(False),
    normalize: bool = Form(False)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        original_size = image.size
        
        result = ImageProcessor.preprocess(
            image,
            resize=(resize_width, resize_height) if resize_width and resize_height else None,
            grayscale=grayscale,
            normalize=normalize
        )
        
        # Convert processed image to base64
        img_byte_arr = io.BytesIO()
        result["processed_image"].save(img_byte_arr, format='PNG')
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        return JSONResponse(
            content={
                "processed_image": img_base64,
                "original_size": original_size,
                "processed_size": result["processed_image"].size,
                "steps": result["steps"]
            },
            headers=get_cors_headers()
        )
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/augment")
async def augment_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        
        result = ImageProcessor.augment(image)
        augmented_images = {}
        
        # Convert all augmented images to base64
        for name, img in result["augmented_images"].items():
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            augmented_images[name] = base64.b64encode(img_byte_arr).decode('utf-8')
        
        return JSONResponse(
            content={
                "steps": result["steps"],
                "augmented_images": augmented_images
            },
            headers=get_cors_headers()
        )
    except Exception as e:
        logger.error(f"Error augmenting image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 