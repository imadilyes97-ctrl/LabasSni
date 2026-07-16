"""Routes d'upload et gestion des fichiers."""

import os, uuid, logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from ..core.config import settings
from ..core.sanitize import validate_file_id, secure_join_path, ALLOWED_EXTENSIONS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/photo")
async def upload_photo(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Format invalide")
    content = await image.read()
    if len(content) > settings.max_image_size_mb * 1024 * 1024:
        raise HTTPException(400, f"Image trop volumineuse (max {settings.max_image_size_mb}MB)")
    ext = (image.filename or "").split(".")[-1].lower() if image.filename else "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Extension interdite: .{ext}")
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}.{ext}"
    os.makedirs(settings.upload_dir, exist_ok=True)
    with open(os.path.join(settings.upload_dir, safe_filename), "wb") as f:
        f.write(content)
    logger.info(f"📸 Upload: {safe_filename} ({len(content)} bytes)")
    return {"id": file_id, "url": f"/api/upload/{file_id}", "size": len(content)}


@router.get("/{file_id}")
async def get_upload(file_id: str):
    if not validate_file_id(file_id):
        raise HTTPException(400, "ID invalide")
    for ext in ALLOWED_EXTENSIONS:
        resolved = secure_join_path(settings.upload_dir, f"{file_id}.{ext}")
        if resolved and resolved.exists():
            return FileResponse(str(resolved))
    raise HTTPException(404, "Fichier non trouvé")
