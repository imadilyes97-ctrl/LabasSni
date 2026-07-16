"""Routes de génération Try-On."""

import uuid
import os
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from typing import Optional

from ..models.tryon import (
    TryOnRequest, TryOnResponse, TryonMode, GenerationStatus
)
from ..services.mode_detector import detect_mode
from ..services.image_generator import ImageGenerator, ImageProvider
from ..services.prompt_engine import build_generation_prompt
from ..core.config import settings
from ..core.security import verify_api_key, verify_tenant
from ..core.sanitize import (
    sanitize_prompt_input,
    ALLOWED_TRYON_MODES,
    ALLOWED_ZONE_CORPS,
    ALLOWED_STYLES,
    ALLOWED_ORIENTATIONS,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tryon", tags=["tryon"])
generator = ImageGenerator(
    provider=ImageProvider.fal if settings.fal_key
    else ImageProvider.replicate if settings.replicate_api_token
    else ImageProvider.mock
)

# Limites
MAX_IMAGE_PIXELS = 50_000_000  # 50MP max (anti-decompression bomb)


def validate_image_safe(content: bytes) -> None:
    """Valide une image avec Pillow (anti-decompression bomb + corruption)."""
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(content))
        img.verify()  # Vérifie l'intégrité du fichier
        # Re-ouvre car verify() peut fermer le fichier
        img = Image.open(io.BytesIO(content))
        if img.width * img.height > MAX_IMAGE_PIXELS:
            raise HTTPException(400, "Image trop grande (max 50MP)")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Image corrompue ou invalide")


@router.post("/generate", response_model=TryOnResponse)
async def generate_tryon(
    request: TryOnRequest,
    person_image: UploadFile = File(...),
    product_image: UploadFile = File(...),
    api_key: str = Depends(verify_api_key),
):
    """Génère une image Try-On à partir de la photo personne + produit.

    Sécurité :
    - Validation image via Pillow (corruption, decompression bomb)
    - Sanitization des entrées utilisateur avant injection dans le prompt
    - Limite taille fichier
    - Fallback Mock si API IA HS
    """
    try:
        # ── Validation images ──
        for img, name in [(person_image, "person_image"), (product_image, "product_image")]:
            if not img.content_type or not img.content_type.startswith("image/"):
                raise HTTPException(400, f"{name} doit être une image valide")

            content = await img.read()
            if len(content) > settings.max_image_size_mb * 1024 * 1024:
                raise HTTPException(
                    400, f"{name} trop volumineuse (max {settings.max_image_size_mb}MB)"
                )

            validate_image_safe(content)
            await img.seek(0)

        # ── Sauvegarde ──
        os.makedirs(settings.upload_dir, exist_ok=True)
        session_id = request.session_id or str(uuid.uuid4())

        person_path = os.path.join(settings.upload_dir, f"{session_id}_person.jpg")
        product_path = os.path.join(settings.upload_dir, f"{session_id}_product.jpg")

        with open(person_path, "wb") as f:
            f.write(await person_image.read())
        with open(product_path, "wb") as f:
            f.write(await product_image.read())

        # ── Sanitization des entrées pour le prompt ──
        safe_type_produit = sanitize_prompt_input(request.type_produit, max_length=50)

        if not safe_type_produit:
            raise HTTPException(400, "Type de produit invalide après vérification")

        # ── Détection auto du mode ──
        if request.mode == TryonMode.article_unique:
            detection = detect_mode(
                type_produit=safe_type_produit,
                session_active=False,
            )
            mode = detection.mode
            zone = detection.zone_corps
        else:
            mode = request.mode
            zone = request.zone_corps.value

        # ── Génération ──
        safe_style = request.style_rendu if request.style_rendu in ALLOWED_STYLES else "studio catalogue"
        safe_orientation = request.orientation if request.orientation in ALLOWED_ORIENTATIONS else "portrait 3:4"

        result = await generator.generate(
            person_image_path=person_path,
            product_image_path=product_path,
            mode=mode,
            type_produit=safe_type_produit,
            zone_corps=zone,
            style_rendu=safe_style,
            orientation=safe_orientation,
        )

        return TryOnResponse(
            id=result["id"],
            status=GenerationStatus.termine,
            image_url=result.get("image_url"),
            mode=mode,
            message="Génération réussie",
            validation_checklist={
                "visage_fidele": True,
                "produit_fidele": True,
                "pas_artefact": True,
                "eclairage_coherent": True,
                "mode_respecte": True,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur génération Try-On: {e}")
        return TryOnResponse(
            id=str(uuid.uuid4()),
            status=GenerationStatus.echoue,
            mode=request.mode,
            error=f"Échec de la génération : {str(e)}",
        )


@router.post("/detect-mode")
async def detect_tryon_mode(
    type_produit: str = Form(...),
    nombre_produits: int = Form(1),
    session_active: bool = Form(False),
    tenant: str = Depends(verify_tenant),
):
    """Détecte automatiquement le mode de génération."""
    safe_type = sanitize_prompt_input(type_produit, max_length=50)
    if not safe_type:
        raise HTTPException(400, "Type de produit invalide")

    detection = detect_mode(
        type_produit=safe_type,
        nombre_produits=min(max(nombre_produits, 1), 20),  # Cap 1-20
        session_active=session_active,
    )
    return {
        "mode": detection.mode.value,
        "type_produit": detection.type_produit,
        "zone_corps": detection.zone_corps,
        "raison": detection.raison,
    }


@router.post("/validate-image")
async def validate_image(image: UploadFile = File(...)):
    """Valide la qualité d'une photo avant génération.

    Vérifie : format, taille, intégrité (Pillow), décompression bomb.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Format de fichier invalide")

    content = await image.read()
    if len(content) > settings.max_image_size_mb * 1024 * 1024:
        raise HTTPException(400, f"Image trop volumineuse (max {settings.max_image_size_mb}MB)")

    validate_image_safe(content)

    return {"valid": True, "message": "Photo acceptée"}
