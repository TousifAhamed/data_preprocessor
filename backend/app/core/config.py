# backend/app/core/config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Preprocessor API"
    API_V1_STR: str = "/api/v1"
    
    # File upload settings
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Image settings
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/gif"
    ]
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_IMAGE_DIMENSION: int = 4096
    
    # Audio settings
    ALLOWED_AUDIO_TYPES: List[str] = [
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav"
    ]
    MAX_AUDIO_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # Text settings
    ALLOWED_TEXT_TYPES: List[str] = [
        "text/plain",
        "application/octet-stream"
    ]
    MAX_TEXT_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    # 3D settings
    ALLOWED_3D_TYPES: List[str] = [
        "model/obj",
        "model/stl",
        "application/octet-stream"
    ]
    MAX_3D_SIZE: int = 50 * 1024 * 1024  # 50MB

    class Config:
        case_sensitive = True

settings = Settings()