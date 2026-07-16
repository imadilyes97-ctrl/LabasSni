"""Sécurité multi-tenant et validation des requêtes."""

from fastapi import Header, HTTPException, Depends
from typing import Optional
from .config import settings


async def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """Vérifie la clé API pour les endpoints protégés."""
    if settings.api_key is None:
        return "default"
    if x_api_key is None or x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Clé API invalide")
    return x_api_key


async def verify_tenant(x_tenant_id: Optional[str] = Header(None)) -> str:
    """Récupère l'identifiant de la boutique (multi-tenant)."""
    return x_tenant_id or "default"
