from .text import router as text_router
from .image import router as image_router
from .audio import router as audio_router
from .threed import router as threed_router

__all__ = ['text_router', 'image_router', 'audio_router', 'threed_router']