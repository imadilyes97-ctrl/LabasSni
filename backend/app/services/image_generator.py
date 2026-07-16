"""Service de génération d'image via API IA (FAL AI / Replicate)."""

import os
import uuid
import logging
from typing import Optional
from enum import Enum
from .prompt_engine import build_generation_prompt
from ..models.tryon import TryonMode

logger = logging.getLogger(__name__)


class ImageProvider(str, Enum):
    fal = "fal-ai"
    replicate = "replicate"
    mock = "mock"  # Pour développement sans API


class ImageGenerator:
    """Génère l'image de virtual try-on via une API IA."""

    def __init__(self, provider: ImageProvider = ImageProvider.mock):
        self.provider = provider
        self._init_provider()

    def _init_provider(self):
        """Initialise le provider choisi."""
        if self.provider == ImageProvider.fal:
            try:
                import fal_client
                self.client = fal_client
            except ImportError:
                logger.warning("fal-client non installé, fallback mock")
                self.provider = ImageProvider.mock

        elif self.provider == ImageProvider.replicate:
            api_token = os.getenv("REPLICATE_API_TOKEN")
            if not api_token:
                logger.warning("REPLICATE_API_TOKEN manquant, fallback mock")
                self.provider = ImageProvider.mock

    async def generate(
        self,
        person_image_path: str,
        product_image_path: str,
        mode: TryonMode,
        type_produit: str,
        zone_corps: str = "haut du corps",
        style_rendu: str = "studio catalogue",
        orientation: str = "portrait 3:4",
        model_name: str = "fal-ai/flux-vton",
    ) -> dict:
        """Génère l'image Try-On."""
        prompt = build_generation_prompt(
            mode=mode,
            type_produit=type_produit,
            zone_corps=zone_corps,
            style_rendu=style_rendu,
            orientation=orientation,
        )

        if self.provider == ImageProvider.fal:
            return await self._generate_fal(
                person_image_path, product_image_path, prompt, model_name
            )
        elif self.provider == ImageProvider.replicate:
            return await self._generate_replicate(
                person_image_path, product_image_path, prompt
            )
        else:
            return self._generate_mock(person_image_path, product_image_path, prompt)

    async def _generate_fal(
        self,
        person_image: str,
        product_image: str,
        prompt: str,
        model_name: str,
    ) -> dict:
        """Appelle l'API FAL AI avec le modèle de virtual try-on."""
        import base64

        def encode_image(path: str) -> str:
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")

        person_b64 = encode_image(person_image)
        product_b64 = encode_image(product_image)

        result = self.client.run(
            model_name,
            arguments={
                "person_image": f"data:image/jpeg;base64,{person_b64}",
                "product_image": f"data:image/jpeg;base64,{product_b64}",
                "prompt": prompt,
            },
        )
        return {
            "id": str(uuid.uuid4()),
            "image_url": result.get("image", {}).get("url", result.get("output")),
            "provider": "fal-ai",
            "prompt_used": prompt,
        }

    async def _generate_replicate(
        self,
        person_image: str,
        product_image: str,
        prompt: str,
    ) -> dict:
        """Appelle l'API Replicate."""
        import replicate

        output = replicate.run(
            "cudingzuo/virtual-try-on:latest",
            input={
                "person_image": open(person_image, "rb"),
                "product_image": open(product_image, "rb"),
                "prompt": prompt,
            },
        )
        return {
            "id": str(uuid.uuid4()),
            "image_url": str(output),
            "provider": "replicate",
            "prompt_used": prompt,
        }

    def _generate_mock(
        self, person_image: str, product_image: str, prompt: str
    ) -> dict:
        """Mock pour développement — retourne une URL fictive."""
        logger.info(f"[MOCK] Génération Try-On avec prompt:\n{prompt[:200]}...")
        return {
            "id": str(uuid.uuid4()),
            "image_url": f"/mock/result/{uuid.uuid4()}.jpg",
            "provider": "mock",
            "prompt_used": prompt,
        }
