from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.core.logger import logger
from app.processors.text_processor import TextProcessor

router = APIRouter(prefix="/text", tags=["Text Processing"])

# Initialize TextProcessor
text_processor = TextProcessor()

@router.post("/upload")
async def upload_text(file: UploadFile = File(...)):
    logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")

    if not file.content_type in ["text/plain", "application/octet-stream"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    try:
        content = await file.read()
        text = content.decode('utf-8', errors='replace')
        
        # Validate text
        validation = text_processor.validate_text(text)
        if not validation["is_valid"]:
            raise HTTPException(status_code=400, detail=validation.get("error", "Invalid text content"))

        logger.info(f"Successfully loaded text file: {file.filename}")
        return {
            "text_content": text,
            "filename": file.filename,
            "validation": validation
        }
    except Exception as e:
        logger.error(f"Error processing text file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/preprocess")
async def preprocess_text(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode('utf-8', errors='replace')
        
        # Use TextProcessor to preprocess the text
        result = text_processor.preprocess(text)
        
        return {
            "processed_text": result["processed_text"],
            "original_text": result["original_text"],
            "steps": result["steps"]
        }
    except Exception as e:
        logger.error(f"Error preprocessing text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/augment")
async def augment_text(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode('utf-8', errors='replace')
        
        # Use TextProcessor to augment the text
        result = text_processor.augment(text)
        
        return {
            "augmented_texts": result["augmented_texts"],
            "steps": result["steps"]
        }
    except Exception as e:
        logger.error(f"Error augmenting text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))