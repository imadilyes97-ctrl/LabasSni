"""lebeSsni — Virtual Try-On IA API."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .routes import tryon, upload, assistant

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API de Virtual Try-On IA pour le e-commerce mode",
)

# CORS — autorise les requêtes du widget frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(tryon.router)
app.include_router(assistant.router)
app.include_router(upload.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "provider": "fal-ai" if settings.fal_key else "replicate" if settings.replicate_api_token else "mock",
    }


@app.on_event("startup")
async def startup():
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} démarrée")
    if settings.fal_key:
        logger.info("📸 Provider IA : FAL AI")
    elif settings.replicate_api_token:
        logger.info("📸 Provider IA : Replicate")
    else:
        logger.warning("📸 Provider IA : MOCK (aucune clé API configurée)")
