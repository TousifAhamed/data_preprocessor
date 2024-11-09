from fastapi import HTTPException
from typing import List, Set, Dict, Any
import os
import shutil
import hashlib
import time
from app.core.config import settings
from app.core.logger import logger

class FileHandler:
    UPLOAD_DIR = "uploads"
    
    @staticmethod
    def validate_file_type(content_type: str, allowed_types: Set[str]) -> bool:
        """Validate if the file type is allowed"""
        if content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        return True

    @staticmethod
    def validate_file(file_content: bytes, file_name: str) -> Dict[str, Any]:
        """Validate file content and generate metadata"""
        file_hash = hashlib.sha256(file_content).hexdigest()
        file_size = len(file_content)
        
        if file_size > 100 * 1024 * 1024:  # 100MB
            raise HTTPException(status_code=413, detail="File too large")
            
        return {
            "hash": file_hash,
            "size": file_size,
            "name": file_name
        }

    @staticmethod
    def save_upload_file(file_name: str, file_content, metadata: Dict[str, Any]) -> str:
        """Save uploaded file with metadata validation"""
        if not os.path.exists(FileHandler.UPLOAD_DIR):
            try:
                os.makedirs(FileHandler.UPLOAD_DIR, exist_ok=True)
            except Exception as e:
                logger.error(f"Failed to create upload directory: {str(e)}")
                raise HTTPException(status_code=500, detail="Server storage error")

        file_path = os.path.join(FileHandler.UPLOAD_DIR, file_name)
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)
            return file_path
        except Exception as e:
            logger.error(f"Error saving file {file_name}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to save file")

    @staticmethod
    def delete_file(file_name: str) -> bool:
        """Delete file from disk"""
        file_path = os.path.join(FileHandler.UPLOAD_DIR, file_name)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file {file_name}: {str(e)}")
            raise HTTPException(status_code=500, detail="Error deleting file")

    @staticmethod
    def cleanup_old_files(max_age_hours: int = 24) -> None:
        """Clean up files older than specified hours"""
        try:
            current_time = time.time()
            for filename in os.listdir(FileHandler.UPLOAD_DIR):
                file_path = os.path.join(FileHandler.UPLOAD_DIR, filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getctime(file_path)
                    if file_age > (max_age_hours * 3600):
                        os.remove(file_path)
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
