"""lebeSsni — Virtual Try-On IA API (v2, RunPod)."""

import logging
import threading
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .core.database import init_db, cleanup_expired_images
from .routes import tryon, upload, assistant, auth

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["10/second", "100/minute"], storage_uri="memory://")

app = FastAPI(title=settings.app_name, version=settings.app_version,
    description="API de Virtual Try-On IA (RunPod Serverless)")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; font-src 'self'; frame-src 'none'; "
        "object-src 'none'; base-uri 'self'"
    )
    return response


app.include_router(auth.router)
app.include_router(tryon.router)
app.include_router(assistant.router)
app.include_router(upload.router)


@app.get("/health")
@limiter.exempt
async def health(request: Request):
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "provider": "runpod" if settings.runpod_api_key else "mock",
    }


def cleanup_loop():
    """Nettoie les fichiers expirés toutes les heures."""
    while True:
        time.sleep(3600)
        try:
            cleanup_expired_images()
        except Exception as e:
            logger.error(f"Erreur dans le cleanup: {e}")


@app.on_event("startup")
async def startup():
    # Initialiser la base de données
    db_ok = init_db()
    if db_ok:
        # Premier nettoyage au démarrage
        try:
            cleanup_expired_images()
        except Exception:
            pass
        # Lancer le thread de nettoyage automatique
        thread = threading.Thread(target=cleanup_loop, daemon=True)
        thread.start()
        logger.info("🧹 Auto-cleanup des fichiers expirés activé")

    logger.info(f"🚀 {settings.app_name} v{settings.app_version} démarrée — "
                f"moteur: {'RunPod' if settings.runpod_api_key else 'MOCK'}, "
                f"DB: {'OK' if db_ok else 'HS'}")
