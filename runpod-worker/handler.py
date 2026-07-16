"""Handler RunPod Serverless — point d'entrée du worker.

Reçoit les requêtes du backend, construit le prompt via Master Prompt A,
appelle le modèle (via generate.py) et retourne l'image générée.

Architecture: Option B — proxy Nano Banana (CPU, pas besoin de GPU)
"""

import runpod
import logging
from src.generate import generate_tryon_image
from src.prompt_builder import build_prompt
from src.quality_check import quality_check

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def handler(event):
    """
    event["input"] attendu :
    {
        "product_image_url": "https://...",
        "user_image_url": "https://...",
        "product_type": "tshirt" | "basket" | "pantalon" | "tenue_complete" | ...,
        "client_id": "client123",
        "style_variables": {
            "ton": "chaleureux",
            "duree_retention": "24h",
            "product_description": "..."
        }
    }
    """
    data = event["input"]
    product_type = data.get("product_type", "vêtement")
    style_vars = data.get("style_variables", {})

    logger.info(f"🧵 Try-On reçu: {product_type} pour client {data.get('client_id', '?')}")

    # 1. Construire le prompt via Master Prompt A
    prompt = build_prompt(
        product_type=product_type,
        style_variables=style_vars,
    )

    # 2. Générer l'image
    result_image = generate_tryon_image(
        product_image_url=data["product_image_url"],
        user_image_url=data["user_image_url"],
        prompt=prompt,
    )

    # 3. Contrôle qualité
    qc = quality_check(result_image)
    if qc["status"] == "fail":
        logger.warning(f"⚠️ Quality check échoué: {qc.get('reason', 'checks')}")
        return {
            "image_base64": result_image,
            "status": "degraded",
            "quality_report": qc,
        }

    logger.info("✅ Génération réussie")
    return {
        "image_base64": result_image,
        "status": "success",
        "quality_report": qc,
    }


runpod.serverless.start({"handler": handler})
