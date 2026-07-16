"""Routes d'upload et gestion des fichiers."""

import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/photo")
async def upload_photo(image: UploadFile = File(...)):
    """Upload une photo personne ou produit."""
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Format invalide — seules les images sont acceptées")

    content = await image.read()
    if len(content) > settings.max_image_size_mb * 1024 * 1024:
        raise HTTPException(400, f"Image trop volumineuse (max {settings.max_image_size_mb}MB)")

    os.makedirs(settings.upload_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    ext = image.filename.split(".")[-1] if image.filename else "jpg"
    file_path = os.path.join(settings.upload_dir, f"{file_id}.{ext}")

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "id": file_id,
        "url": f"/api/upload/{file_id}.{ext}",
        "filename": image.filename,
        "size": len(content),
    }


@router.get("/{file_id}")
async def get_upload(file_id: str):
    """Récupère un fichier uploadé."""
    for ext in ["jpg", "jpeg", "png", "webp"]:
        path = os.path.join(settings.upload_dir, f"{file_id}")
        if os.path.exists(path):
            return FileResponse(path)
    raise HTTPException(404, "Fichier non trouvé")
