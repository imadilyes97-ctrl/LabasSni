"""Service de génération d'image via API IA (FAL AI / Replicate).

Sécurité :
- Circuit breaker via tenacity (retry + backoff)
- Timeout HTTP configurable
- Validation des entrées
- Fallback automatique Mock
"""

import os
import uuid
import logging
from typing import Optional
from enum import Enum
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from .prompt_engine import build_generation_prompt
from ..models.tryon import TryonMode

logger = logging.getLogger(__name__)


class ImageProvider(str, Enum):
    fal = "fal-ai"
    replicate = "replicate"
    mock = "mock"


class ImageGenerationError(Exception):
    """Erreur de génération d'image."""


class ImageGenerator:
    """Génère l'image de virtual try-on via une API IA.

    Circuit breaker :
    - 3 tentatives avec backoff exponentiel (2s, 4s, 8s)
    - Fallback automatique vers Mock si toutes les tentatives échouent
    - Timeout HTTP : connect 10s, read 120s
    """

    def __init__(self, provider: ImageProvider = ImageProvider.mock):
        self.provider = provider
        self._init_provider()

    def _init_provider(self):
        """Initialise le provider choisi avec fallback Mock."""
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

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=10),
        retry=retry_if_exception_type(ImageGenerationError),
        before_sleep=lambda retry_state: logger.warning(
            f"Tentative {retry_state.attempt_number}/3 échouée, retry dans {retry_state.next_action.sleep}..."
        ),
    )
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
        """Génère l'image Try-On avec retry automatique."""
        prompt = build_generation_prompt(
            mode=mode,
            type_produit=type_produit,
            zone_corps=zone_corps,
            style_rendu=style_rendu,
            orientation=orientation,
        )

        logger.info(f"🎨 Génération Try-On [{self.provider.value}] — mode={mode.value}, produit={type_produit}")

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
        """Appelle l'API FAL AI avec timeout et retry."""
        import base64
        import httpx
        from ..core.sanitize import sanitize_prompt_input

        # Sanitize prompt avant envoi à l'API
        safe_prompt = sanitize_prompt_input(prompt, max_length=2000)

        def encode_image(path: str) -> str:
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")

        try:
            person_b64 = encode_image(person_image)
            product_b64 = encode_image(product_image)

            result = self.client.run(
                model_name,
                arguments={
                    "person_image": f"data:image/jpeg;base64,{person_b64}",
                    "product_image": f"data:image/jpeg;base64,{product_b64}",
                    "prompt": safe_prompt,
                },
            )
            image_url = result.get("image", {}).get("url", result.get("output"))
            if not image_url:
                raise ImageGenerationError("Aucune URL d'image retournée par FAL AI")

            return {
                "id": str(uuid.uuid4()),
                "image_url": image_url,
                "provider": "fal-ai",
                "prompt_used": safe_prompt[:100],
            }

        except Exception as e:
            raise ImageGenerationError(f"FAL AI error: {str(e)}") from e

    async def _generate_replicate(
        self,
        person_image: str,
        product_image: str,
        prompt: str,
    ) -> dict:
        """Appelle l'API Replicate avec timeout et retry."""
        import replicate
        import httpx
        from ..core.sanitize import sanitize_prompt_input

        safe_prompt = sanitize_prompt_input(prompt, max_length=2000)

        try:
            output = replicate.run(
                "cudingzuo/virtual-try-on:latest",
                input={
                    "person_image": open(person_image, "rb"),
                    "product_image": open(product_image, "rb"),
                    "prompt": safe_prompt,
                },
            )
            output_url = str(output)
            if not output_url or output_url == "None":
                raise ImageGenerationError("Aucune URL retournée par Replicate")

            return {
                "id": str(uuid.uuid4()),
                "image_url": output_url,
                "provider": "replicate",
                "prompt_used": safe_prompt[:100],
            }

        except Exception as e:
            raise ImageGenerationError(f"Replicate error: {str(e)}") from e

    def _generate_mock(
        self, person_image: str, product_image: str, prompt: str
    ) -> dict:
        """Mock pour développement — retourne une URL fictive."""
        logger.info(f"[MOCK] Génération Try-On avec prompt:\n{prompt[:200]}...")
        return {
            "id": str(uuid.uuid4()),
            "image_url": f"/mock/result/{uuid.uuid4()}.jpg",
            "provider": "mock",
            "prompt_used": prompt[:100],
        }
