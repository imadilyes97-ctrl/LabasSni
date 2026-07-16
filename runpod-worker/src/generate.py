"""Logique de génération d'image pour le worker RunPod.
Option B: Proxy vers Nano Banana (Gemini API) — pas de GPU nécessaire."""

import os
import base64
import logging
import requests

logger = logging.getLogger(__name__)

# Nano Banana / Gemini API config
NANO_BANANA_API_URL = "https://api.nanobanana.ai/v1/images/generations"
NANO_BANANA_API_KEY = os.environ.get("NANO_BANANA_API_KEY", "")


def generate_tryon_image(
    product_image_url: str,
    user_image_url: str,
    prompt: str,
) -> str:
    """Génère l'image Try-On via Nano Banana (Gemini API).

    Args:
        product_image_url: URL de l'image du produit
        user_image_url: URL de la photo de l'utilisateur
        prompt: Prompt formaté (Master Prompt A)

    Returns:
        Image générée en base64
    """
    if not NANO_BANANA_API_KEY:
        logger.warning("NANO_BANANA_API_KEY non configurée, utilisation du mode mock")
        return _generate_mock(product_image_url, user_image_url, prompt)

    try:
        response = requests.post(
            NANO_BANANA_API_URL,
            headers={
                "Authorization": f"Bearer {NANO_BANANA_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "product_image": product_image_url,
                "user_image": user_image_url,
                "prompt": prompt,
                "model": "gemini-2.0-flash-exp",
                "response_format": "b64_json",
            },
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", [{}])[0].get("b64_json", "")

    except requests.exceptions.Timeout:
        logger.error("Timeout sur l'appel Nano Banana")
        raise
    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur appel Nano Banana: {e}")
        raise


def _generate_mock(product_image_url: str, user_image_url: str, prompt: str) -> str:
    """Mock pour développement — retourne une image factice."""
    import uuid
    logger.info(f"[MOCK] Génération Try-On: produit={product_image_url[:40]}..., user={user_image_url[:40]}...")
    # Retourne un petit carré gris en base64 (placeholder visuel)
    return (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
