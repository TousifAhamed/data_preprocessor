from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
import librosa
import soundfile as sf
import io
import base64
import os
from app.processors.audio_processor import AudioProcessor
from app.core.logger import logger

router = APIRouter(prefix="/audio", tags=["Audio Processing"])

@router.options("/upload")
async def audio_upload_options():
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        content = await file.read()
        with io.BytesIO(content) as buffer:
            y, sr = librosa.load(buffer)
        
        validation = AudioProcessor.validate_audio(y, sr)
        
        # Convert to base64 for frontend
        audio_bytes = AudioProcessor.save_audio(y, sr)
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return JSONResponse(
            content={
                "filename": file.filename,
                "validation": validation,
                "audio_data": audio_base64
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "*"
            }
        )
    except Exception as e:
        logger.error(f"Error processing audio file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing audio file")

@router.post("/preprocess")
async def preprocess_audio(
    file: UploadFile = File(...),
    normalize: bool = Form(default=True),
    remove_silence: bool = Form(default=True),
    reduce_noise: bool = Form(default=True)
):
    if not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        logger.info(f"Starting audio preprocessing for file: {file.filename}")
        content = await file.read()
        
        # Save the file temporarily
        temp_path = f"temp_{file.filename}"
        try:
            with open(temp_path, "wb") as temp_file:
                temp_file.write(content)
            
            # Load audio using librosa
            y, sr = librosa.load(temp_path, sr=None)  # Use original sample rate
            logger.info("Audio file loaded successfully")
            
            # Process the audio
            result = AudioProcessor.preprocess(
                y, sr,
                normalize=normalize,
                remove_silence=remove_silence,
                reduce_noise=reduce_noise
            )
            
            logger.info("Audio preprocessing completed")
            
            # Convert processed audio to bytes and encode in base64
            audio_bytes = AudioProcessor.save_audio(result["processed_audio"], result["sample_rate"])
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            return JSONResponse(
                content={
                    "processed_audio": audio_base64,
                    "steps": result["steps"],
                    "sample_rate": result["sample_rate"],
                    "success": True,
                    "message": "Audio preprocessing completed successfully"
                }
            )
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Error preprocessing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/augment")
async def augment_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        content = await file.read()
        
        # Save the file temporarily
        temp_path = f"temp_{file.filename}"
        try:
            with open(temp_path, "wb") as temp_file:
                temp_file.write(content)
            
            # Load audio using librosa
            y, sr = librosa.load(temp_path, sr=None)  # Use original sample rate
            
            result = AudioProcessor.augment(y, sr)
            augmented_files = {}
            
            # Convert each augmented audio to base64
            for name, audio in result["augmented_audio"].items():
                audio_bytes = AudioProcessor.save_audio(audio, result["sample_rate"])
                augmented_files[name] = base64.b64encode(audio_bytes).decode('utf-8')
            
            return JSONResponse(
                content={
                    "steps": result["steps"],
                    "augmented_audio": augmented_files,
                    "sample_rate": result["sample_rate"],
                    "success": True,
                    "message": "Audio augmentation completed successfully"
                }
            )
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Error augmenting audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))