from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.endpoints import text_router, image_router, audio_router, threed_router
import os
from app.core.logger import logger

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create required directories
REQUIRED_DIRS = {
    'uploads/images': 'image uploads',
    'uploads/audio': 'audio uploads',
    'uploads/text': 'text uploads',
    'uploads/3d': '3D model uploads',
    'uploads/temp': 'temporary files',
    'static': 'static files',
    'static/js': 'JavaScript files',
    'static/css': 'CSS files',
    'static/js/components': 'JavaScript components'
}

# Create directories if they don't exist
for dir_path, description in REQUIRED_DIRS.items():
    try:
        os.makedirs(dir_path, exist_ok=True)
        logger.info(f"Ensured directory exists for {description}: {dir_path}")
    except Exception as e:
        logger.error(f"Error creating directory {dir_path}: {str(e)}")

# Mount static files - make sure the directory exists
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
else:
    logger.warning(f"Static directory not found: {static_dir}")

# Serve favicon.ico
@app.get('/favicon.ico')
async def favicon():
    favicon_path = os.path.join(static_dir, 'favicon.ico')
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    return {"status": "no favicon"}

# Include routers
app.include_router(text_router, prefix="/api/v1")
app.include_router(image_router, prefix="/api/v1")
app.include_router(audio_router, prefix="/api/v1")
app.include_router(threed_router, prefix="/api/v1")

# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy"}

# Status check endpoints for each service
@app.get("/api/v1/image/status")
async def image_status():
    return {"status": "operational"}

@app.get("/api/v1/audio/status")
async def audio_status():
    return {"status": "operational"}

@app.get("/api/v1/text/status")
async def text_status():
    return {"status": "operational"}

@app.get("/api/v1/3d/status")
async def threed_status():
    return {"status": "operational"}

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "detail": str(exc.detail),
        "status_code": exc.status_code
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        "detail": "Internal server error",
        "status_code": 500
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)