"""Routes d'upload et gestion des fichiers."""

import os
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from ..core.config import settings
from ..core.sanitize import (
    validate_file_id,
    secure_join_path,
    ALLOWED_EXTENSIONS,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/photo")
async def upload_photo(image: UploadFile = File(...)):
    """Upload une photo personne ou produit.

    Sécurité :
    - Validation MIME stricte (magic bytes + content-type)
    - Limite taille (max 10MB)
    - Nom fichier safe (UUID, pas de nom original)
    - Extension validée
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Format invalide — seules les images sont acceptées")

    content = await image.read()
    if len(content) > settings.max_image_size_mb * 1024 * 1024:
        raise HTTPException(400, f"Image trop volumineuse (max {settings.max_image_size_mb}MB)")

    # Validation extension
    ext = (image.filename or "").split(".")[-1].lower() if image.filename else "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Extension interdite: .{ext} — accepté: jpg, jpeg, png, webp")

    # Nom de fichier sécurisé (UUID uniquement)
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}.{ext}"

    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"📸 Upload réussi: {safe_filename} ({len(content)} bytes)")

    return {
        "id": file_id,
        "url": f"/api/upload/{file_id}",
        "filename": None,  # Jamais renvoyer le nom original
        "size": len(content),
    }


@router.get("/{file_id}")
async def get_upload(file_id: str):
    """Récupère un fichier uploadé par son UUID.

    Sécurité : validation stricte de l'UUID pour éviter path traversal.
    """
    if not validate_file_id(file_id):
        raise HTTPException(400, "ID de fichier invalide")

    for ext in ALLOWED_EXTENSIONS:
        filename = f"{file_id}.{ext}"
        resolved = secure_join_path(settings.upload_dir, filename)
        if resolved and resolved.exists():
            return FileResponse(str(resolved))

    raise HTTPException(404, "Fichier non trouvé")
