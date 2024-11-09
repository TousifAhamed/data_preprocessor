from fastapi import APIRouter, UploadFile, HTTPException, File
from app.core.config import settings
from typing import List
import os
import shutil

router = APIRouter(
    prefix="/audio",
    tags=["audio"],
    responses={404: {"description": "Not found"}}
)

@router.head("/upload")
async def check_audio_upload():
    return {"status": "ok"}

@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    try:
        # Ensure file is audio
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Save the uploaded file
        file_location = f"uploads/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        return {"filename": file.filename, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files")
async def list_audio_files():
    try:
        files = os.listdir("uploads")
        audio_files = [f for f in files if f.endswith(('.mp3', '.wav', '.ogg'))]
        return {"files": audio_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/files/{filename}")
async def delete_audio_file(filename: str):
    try:
        file_path = f"uploads/{filename}"
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"status": "success", "message": f"File {filename} deleted"}
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
