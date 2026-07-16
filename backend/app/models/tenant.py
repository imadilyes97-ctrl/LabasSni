"""Configuration multi-tenant (chaque boutique a ses réglages)."""

from pydantic import BaseModel
from typing import Optional


class TenantConfig(BaseModel):
    """Configuration d'une boutique cliente."""
    id: str
    nom_boutique: str
    ton: str = "décontracté et amical"
    duree_retention: str = "24 heures"
    style_rendu_defaut: str = "studio catalogue"
    orientation_defaut: str = "portrait 3:4"
    modele_ia: str = "fal-ai/flux-vton"
    webhook_url: Optional[str] = None


# Configuration par défaut (multi-tenant prêt)
TENANTS: dict[str, TenantConfig] = {
    "default": TenantConfig(
        id="default",
        nom_boutique="Ma Boutique",
    )
}


def get_tenant(tenant_id: str) -> TenantConfig:
    """Récupère la config d'une boutique."""
    return TENANTS.get(tenant_id, TENANTS["default"])


def register_tenant(config: TenantConfig) -> None:
    """Enregistre une nouvelle boutique."""
    TENANTS[config.id] = config
