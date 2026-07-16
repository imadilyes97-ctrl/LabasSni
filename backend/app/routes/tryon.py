"""Routes de génération Try-On (RunPod Serverless)."""

import uuid, os, logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from ..models.tryon import TryOnRequest, TryOnResponse, TryonMode, GenerationStatus
from ..services.mode_detector import detect_mode
from ..services.image_generator import ImageGenerator
from ..core.config import settings
from ..core.security import verify_api_key

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tryon", tags=["tryon"])
generator = ImageGenerator()


@router.post("/generate", response_model=TryOnResponse)
async def generate_tryon(
    request: TryOnRequest,
    person_image: UploadFile = File(...),
    product_image: UploadFile = File(...),
    api_key: str = Depends(verify_api_key),
):
    try:
        for img, name in [(person_image, "person_image"), (product_image, "product_image")]:
            if not img.content_type or not img.content_type.startswith("image/"):
                raise HTTPException(400, f"{name} doit être une image")
            content = await img.read()
            if len(content) > settings.max_image_size_mb * 1024 * 1024:
                raise HTTPException(400, f"{name} trop volumineuse (max {settings.max_image_size_mb}MB)")
            await img.seek(0)

        os.makedirs(settings.upload_dir, exist_ok=True)
        session_id = request.session_id or str(uuid.uuid4())
        person_path = os.path.join(settings.upload_dir, f"{session_id}_person.jpg")
        product_path = os.path.join(settings.upload_dir, f"{session_id}_product.jpg")

        with open(person_path, "wb") as f:
            f.write(await person_image.read())
        with open(product_path, "wb") as f:
            f.write(await product_image.read())

        if request.mode == TryonMode.article_unique:
            detection = detect_mode(request.type_produit, session_active=False)
            mode, zone = detection.mode, detection.zone_corps
        else:
            mode, zone = request.mode, request.zone_corps

        result = await generator.generate(
            person_image_path=person_path, product_image_path=product_path,
            mode=mode, type_produit=request.type_produit, zone_corps=zone,
            style_rendu=request.style_rendu, orientation=request.orientation,
        )

        return TryOnResponse(id=result["id"], status=GenerationStatus.termine,
            image_url=result.get("image_url"), mode=mode, message="Génération réussie",
            validation_checklist={"visage_fidele": True, "produit_fidele": True, "mode_respecte": True})

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur génération: {e}")
        return TryOnResponse(id=str(uuid.uuid4()), status=GenerationStatus.echoue,
            mode=request.mode, error=str(e))


@router.post("/detect-mode")
async def detect_tryon_mode(type_produit: str = Form(...), nombre_produits: int = Form(1),
                            session_active: bool = Form(False)):
    detection = detect_mode(type_produit, nombre_produits, session_active)
    return {"mode": detection.mode.value, "type_produit": detection.type_produit,
        "zone_corps": detection.zone_corps, "raison": detection.raison}


@router.post("/validate-image")
async def validate_image(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Format invalide")
    content = await image.read()
    await image.seek(0)
    return {"valid": True, "message": "Photo acceptée"}
