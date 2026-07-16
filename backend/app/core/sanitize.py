"""Utilitaires de sécurité — sanitization, validation, rate limiting."""

import re, uuid, html
from pathlib import Path
from fastapi import HTTPException

UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_TRYON_MODES = {"article_unique", "tenue_complete", "sequentiel"}
ALLOWED_STYLES = {"studio catalogue", "photo naturelle réseaux sociaux"}
ALLOWED_ORIENTATIONS = {"portrait 3:4", "carré 1:1"}

MAX_IMAGE_PIXELS = 50_000_000


def sanitize_prompt_input(value: str, max_length: int = 100) -> str:
    if not value or not isinstance(value, str):
        return ""
    value = value[:max_length]
    dangerous_patterns = [
        r"(?i)(?:ignore|override|forget|discard|skip|disregard)\s+(?:above|previous|all|any|the)",
        r"(?i)(?:you\s+(?:are\s+)?(?:now|not\s+)|act\s+as)",
        r"(?i)(?:system\s+prompt|master\s+prompt|instruction)",
        r"(?i)(?:say\s+|repeat\s+|print\s+)(?:the\s+)?(?:word|text|above)",
        r"(?i)(?:</?\w+[^>]*>)",
    ]
    for pattern in dangerous_patterns:
        value = re.sub(pattern, "", value)
    value = html.escape(value, quote=True)
    value = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", value)
    return value.strip()


def validate_file_id(file_id: str) -> bool:
    return bool(UUID_PATTERN.match(file_id))


def secure_join_path(upload_dir: str, filename: str) -> Path | None:
    base = Path(upload_dir).resolve()
    target = (base / filename).resolve()
    return target if target.is_relative_to(base) else None


def validate_image_safe(content: bytes) -> None:
    from PIL import Image
    import io
    img = Image.open(io.BytesIO(content))
    img.verify()
    img = Image.open(io.BytesIO(content))
    if img.width * img.height > MAX_IMAGE_PIXELS:
        raise HTTPException(400, "Image trop grande (max 50MP)")
