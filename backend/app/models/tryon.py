"""Modèles de données pour les requêtes/réponses Try-On."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TryonMode(str, Enum):
    article_unique = "article_unique"
    tenue_complete = "tenue_complete"
    sequentiel = "sequentiel"


class GenerationStatus(str, Enum):
    en_attente = "en_attente"
    en_cours = "en_cours"
    termine = "termine"
    echoue = "echoue"


class TryOnRequest(BaseModel):
    mode: TryonMode
    type_produit: str
    zone_corps: str = "haut du corps"
    style_rendu: str = "studio catalogue"
    orientation: str = "portrait 3:4"
    tenant_id: str = "default"
    session_id: Optional[str] = None


class TryOnResponse(BaseModel):
    id: str
    status: GenerationStatus
    image_url: Optional[str] = None
    mode: TryonMode
    message: Optional[str] = None
    error: Optional[str] = None
    validation_checklist: dict = {}


class AssistantRequest(BaseModel):
    message: str
    tenant_id: str = "default"
    session_id: Optional[str] = None
    upload_state: Optional[str] = None
    ton: Optional[str] = None
    boutique: Optional[str] = None


class AssistantResponse(BaseModel):
    reply: str
    suggested_actions: list[str] = []
