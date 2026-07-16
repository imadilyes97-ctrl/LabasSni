"""Configuration multi-tenant (chaque boutique a ses réglages)."""

from pydantic import BaseModel
from typing import Optional


class TenantConfig(BaseModel):
    id: str
    nom_boutique: str
    ton: str = "chaleureux, rassurant, concis"
    duree_retention: str = "24 heures"
    style_rendu_defaut: str = "studio catalogue"
    orientation_defaut: str = "portrait 3:4"
    modele_ia: str = "runpod"
    webhook_url: Optional[str] = None


TENANTS: dict[str, TenantConfig] = {"default": TenantConfig(id="default", nom_boutique="Ma Boutique")}


def get_tenant(tenant_id: str) -> TenantConfig:
    return TENANTS.get(tenant_id, TENANTS["default"])


def register_tenant(config: TenantConfig) -> None:
    TENANTS[config.id] = config
