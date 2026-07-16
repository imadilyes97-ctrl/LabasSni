"""Modèles de données pour les requêtes/réponses Try-On."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TryonMode(str, Enum):
    article_unique = "article_unique"
    tenue_complete = "tenue_complete"
    sequentiel = "sequentiel"


class ZoneCorps(str, Enum):
    haut_du_corps = "haut du corps"
    bas_du_corps = "bas du corps"
    corps_entier = "corps entier"
    pieds = "pieds"


class GenerationStatus(str, Enum):
    en_attente = "en_attente"
    en_cours = "en_cours"
    termine = "termine"
    echoue = "echoue"


class TryOnRequest(BaseModel):
    """Requête de génération Try-On."""
    mode: TryonMode
    type_produit: str = Field(..., description="Catégorie : t-shirt, basket, pantalon, robe...")
    zone_corps: ZoneCorps = ZoneCorps.haut_du_corps
    style_rendu: str = "studio catalogue"
    orientation: str = "portrait 3:4"
    tenant_id: str = "default"
    session_id: Optional[str] = None  # Pour le mode séquentiel


class TryOnResponse(BaseModel):
    """Réponse après génération."""
    id: str
    status: GenerationStatus
    image_url: Optional[str] = None
    mode: TryonMode
    message: Optional[str] = None
    error: Optional[str] = None
    validation_checklist: dict = {}


class AssistantRequest(BaseModel):
    """Message envoyé à l'assistant widget."""
    message: str
    tenant_id: str = "default"
    session_id: Optional[str] = None
    upload_state: Optional[str] = None


class AssistantResponse(BaseModel):
    """Réponse de l'assistant widget."""
    reply: str
    suggested_actions: list[str] = []
