from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.logger import logger

router = APIRouter()

@router.post("/upload")
async def upload_text(file: UploadFile = File(...)):
    if not file.content_type.startswith('text/'):
        raise HTTPException(status_code=400, detail="File must be a text file")
    
    try:
        content = await file.read()
        text = content.decode('utf-8')
        logger.info(f"Successfully loaded text file: {file.filename}")
        return {"text_content": text, "filename": file.filename}
    except Exception as e:
        logger.error(f"Error processing text file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing text file")
