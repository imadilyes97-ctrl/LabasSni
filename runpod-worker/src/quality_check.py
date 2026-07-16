"""Contrôle qualité basique avant retour de l'image générée."""

import logging
from io import BytesIO

logger = logging.getLogger(__name__)

# Résolution minimale (côté le plus petit)
MIN_RESOLUTION = 1024


def check_resolution(image_bytes: bytes) -> bool:
    """Vérifie que la résolution de l'image respecte le minimum."""
    try:
        from PIL import Image
        img = Image.open(BytesIO(image_bytes))
        w, h = img.size
        if min(w, h) < MIN_RESOLUTION:
            logger.warning(f"Résolution trop faible: {w}x{h} (min {MIN_RESOLUTION})")
            return False
        return True
    except Exception:
        logger.warning("Impossible de vérifier la résolution")
        return True  # On laisse passer en cas d'erreur


def has_watermark(image_bytes: bytes) -> bool:
    """Vérification basique de watermark (à améliorer avec un vrai modèle)."""
    try:
        content = str(image_bytes[:1000])
        suspicious = [b'watermark', b'text watermark', b'shutterstock', b'getty']
        for s in suspicious:
            if s in image_bytes[:5000]:
                logger.warning(f"Watermark suspect détecté: {s}")
                return True
        return False
    except Exception:
        return False


def quality_check(result_image_base64: str) -> dict:
    """Point d'entrée du contrôle qualité.

    Args:
        result_image_base64: Image générée en base64

    Returns:
        Dict avec status (pass/fail) et rapport
    """
    import base64
    try:
        image_bytes = base64.b64decode(result_image_base64)
    except Exception:
        return {"status": "fail", "reason": "base64 invalide"}

    checks = {
        "resolution_ok": check_resolution(image_bytes),
        "no_watermark": not has_watermark(image_bytes),
        "has_content": len(image_bytes) > 1024,
    }

    all_pass = all(checks.values())

    return {
        "status": "pass" if all_pass else "fail",
        "checks": checks,
    }
