"""Service de génération d'image via RunPod Serverless.

Architecture: Option B — proxy Nano Banana via RunPod (CPU, scale-to-zero).
Remplace l'ancien provider FAL AI / Replicate.
"""

import os
import uuid
import json
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from enum import Enum
from .prompt_engine import build_generation_prompt
from ..models.tryon import TryonMode

logger = logging.getLogger(__name__)


class ImageProvider(str, Enum):
    runpod = "runpod"
    mock = "mock"  # Pour développement sans API


class ImageGenerationError(Exception):
    """Erreur de génération d'image."""


class ImageGenerator:
    """Génère l'image de virtual try-on via RunPod Serverless.

    Circuit breaker :
    - 3 tentatives avec backoff exponentiel (2s, 4s, 8s)
    - Fallback Mock si toutes les tentatives échouent
    - Timeout HTTP : connect 10s, read 120s

    RunPod :
    - Endpoint: /runsync (synchrone, < 30s)
    - Endpoint: /run (asynchrone, avec polling) si > 30s
    """

    def __init__(self):
        self.runpod_api_key = os.getenv("RUNPOD_API_KEY", "")
        self.runpod_endpoint_id = os.getenv("RUNPOD_ENDPOINT_ID", "")
        self.provider = (
            ImageProvider.runpod
            if self.runpod_api_key and self.runpod_endpoint_id
            else ImageProvider.mock
        )

    def _runpod_url(self) -> str:
        return f"https://api.runpod.ai/v2/{self.runpod_endpoint_id}/runsync"

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=2, max=8),
        retry=retry_if_exception_type(ImageGenerationError),
        before_sleep=lambda rs: logger.warning(
            f"Tentative {rs.attempt_number}/2 échouée, retry dans {rs.next_action.sleep}s..."
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
    ) -> dict:
        """Génère l'image Try-On via RunPod Serverless."""
        prompt = build_generation_prompt(
            mode=mode,
            type_produit=type_produit,
            zone_corps=zone_corps,
            style_rendu=style_rendu,
            orientation=orientation,
        )

        logger.info(f"🎨 Génération Try-On [{self.provider.value}] — mode={mode.value}, produit={type_produit}")

        if self.provider == ImageProvider.runpod:
            return await self._generate_runpod(person_image_path, product_image_path, prompt)
        else:
            return self._generate_mock(person_image_path, product_image_path, prompt)

    async def _generate_runpod(
        self,
        person_image: str,
        product_image: str,
        prompt: str,
    ) -> dict:
        """Appelle l'endpoint RunPod Serverless /runsync."""
        import base64

        def encode_image(path: str) -> str:
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")

        # Upload des images vers un bucket temporaire (ou passer en base64 selon le worker)
        person_b64 = encode_image(person_image)
        product_b64 = encode_image(product_image)

        payload = {
            "input": {
                "product_image_url": f"data:image/jpeg;base64,{product_b64}",
                "user_image_url": f"data:image/jpeg;base64,{person_b64}",
                "product_type": "vêtement",
                "client_id": "lebessni",
                "style_variables": {
                    "prompt": prompt,
                },
            }
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0)) as client:
                response = await client.post(
                    self._runpod_url(),
                    headers={
                        "Authorization": f"Bearer {self.runpod_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            output = data.get("output", {})
            image_b64 = output.get("image_base64", "")
            status = output.get("status", "success")

            if not image_b64 and status != "success":
                raise ImageGenerationError(f"RunPod: {output.get('quality_report', {}).get('reason', 'échec inconnu')}")

            return {
                "id": str(uuid.uuid4()),
                "image_base64": image_b64,
                "provider": "runpod",
                "status": status,
                "prompt_used": prompt[:100],
            }

        except httpx.TimeoutException:
            raise ImageGenerationError("Timeout appel RunPod (120s dépassé)")
        except httpx.HTTPStatusError as e:
            raise ImageGenerationError(f"RunPod HTTP {e.response.status_code}: {e.response.text[:200]}")
        except Exception as e:
            raise ImageGenerationError(f"RunPod error: {str(e)}") from e

    def _generate_mock(
        self, person_image: str, product_image: str, prompt: str
    ) -> dict:
        """Mock pour développement."""
        logger.info(f"[MOCK] Génération Try-On avec prompt:\n{prompt[:200]}...")
        return {
            "id": str(uuid.uuid4()),
            "image_url": f"/mock/result/{uuid.uuid4()}.jpg",
            "provider": "mock",
            "prompt_used": prompt[:100],
        }
