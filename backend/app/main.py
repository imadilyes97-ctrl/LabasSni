"""lebeSsni — Virtual Try-On IA API."""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .routes import tryon, upload, assistant

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Rate limiter (10 req/s par IP, 100 req/min)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["10/second", "100/minute"],
    storage_uri="memory://",
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API de Virtual Try-On IA pour le e-commerce mode",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "frame-src 'none'; "
        "object-src 'none'; "
        "base-uri 'self'"
    )
    return response


# Routes
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
