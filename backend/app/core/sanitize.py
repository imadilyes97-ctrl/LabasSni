"""Utilitaires de sécurité — sanitization, validation, rate limiting."""

import re
import uuid
import html
from pathlib import Path

# UUID strict regex
UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)

# Extensions autorisées
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

# Types MIME autorisés
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Liste blanche des modes Try-On
ALLOWED_TRYON_MODES = {"article_unique", "tenue_complete", "sequentiel"}

# Liste blanche des zones corps
ALLOWED_ZONE_CORPS = {"haut du corps", "bas du corps", "corps entier", "pieds"}

# Liste blanche des styles de rendu
ALLOWED_STYLES = {"studio catalogue", "photo naturelle réseaux sociaux"}

# Liste blanche des orientations
ALLOWED_ORIENTATIONS = {"portrait 3:4", "carré 1:1"}


def sanitize_prompt_input(value: str, max_length: int = 100) -> str:
    """Nettoie une entrée utilisateur avant injection dans un prompt.

    - Supprime les instructions impératives dangereuses
    - Limite la longueur
    - Échappe le HTML
    - Supprime les caractères de contrôle
    """
    if not value or not isinstance(value, str):
        return ""

    # Limite longueur
    value = value[:max_length]

    # Supprime les instructions impératives (prompt injection)
    dangerous_patterns = [
        r"(?i)(?:ignore|override|forget|discard|skip|disregard)\s+(?:above|previous|all|any|the)",
        r"(?i)(?:you\s+(?:are\s+)?(?:now|not\s+)|act\s+as)",
        r"(?i)(?:system\s+prompt|master\s+prompt|instruction)",
        r"(?i)(?:say\s+|repeat\s+|print\s+)(?:the\s+)?(?:word|text|above)",
        r"(?i)(?:</?\w+[^>]*>)",  # HTML/XML tags
    ]
    for pattern in dangerous_patterns:
        value = re.sub(pattern, "", value)

    # Échapper HTML
    value = html.escape(value, quote=True)

    # Supprimer caractères de contrôle (sauf newline)
    value = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", value)

    return value.strip()


def validate_file_id(file_id: str) -> bool:
    """Valide qu'un file_id est un UUID strict."""
    return bool(UUID_PATTERN.match(file_id))


def secure_join_path(upload_dir: str, filename: str) -> Path | None:
    """Vérifie qu'un chemin ne sort pas du répertoire autorisé."""
    base = Path(upload_dir).resolve()
    target = (base / filename).resolve()
    return target if target.is_relative_to(base) else None


def validate_image_mime(content: bytes, content_type: str | None) -> bool:
    """Valide qu'un fichier est bien une image (MIME + magic bytes)."""
    if content_type not in ALLOWED_MIME_TYPES:
        return False

    # Magic bytes check
    magic_map = {
        b"\xff\xd8\xff": "image/jpeg",
        b"\x89PNG\r\n\x1a\n": "image/png",
        b"RIFF": "image/webp",
    }
    for magic, mime in magic_map.items():
        if content[:len(magic)] == magic:
            return mime == content_type

    return False
