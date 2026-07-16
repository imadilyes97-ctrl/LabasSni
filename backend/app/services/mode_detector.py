"""Détection automatique du mode de génération selon les entrées."""

from typing import Optional
from ..models.tryon import TryonMode


class DetectionResult:
    mode: TryonMode
    type_produit: str
    zone_corps: str
    raison: str

    def __init__(self, mode: TryonMode, type_produit: str, zone_corps: str, raison: str):
        self.mode = mode
        self.type_produit = type_produit
        self.zone_corps = zone_corps
        self.raison = raison


PRODUCT_ZONE_MAP = {
    "t-shirt": "haut du corps", "chemise": "haut du corps", "veste": "haut du corps",
    "manteau": "haut du corps", "pull": "haut du corps", "débardeur": "haut du corps",
    "pantalon": "bas du corps", "jean": "bas du corps", "short": "bas du corps",
    "jupe": "bas du corps", "robe": "corps entier", "combinaison": "corps entier",
    "basket": "pieds", "chaussures": "pieds", "sandales": "pieds",
    "accessoire": "haut du corps", "bijou": "haut du corps", "sac": "haut du corps",
    "ceinture": "bas du corps", "chapeau": "haut du corps",
}


def detect_product_zone(type_produit: str) -> str:
    produit_lower = type_produit.lower().strip()
    for key, zone in PRODUCT_ZONE_MAP.items():
        if key in produit_lower or produit_lower in key:
            return zone
    return "haut du corps"


def detect_mode(type_produit: str, nombre_produits: int = 1, session_active: Optional[bool] = None) -> DetectionResult:
    zone = detect_product_zone(type_produit)
    if session_active:
        return DetectionResult(mode=TryonMode.sequentiel, type_produit=type_produit, zone_corps=zone,
            raison="Session active: ajout séquentiel")
    if nombre_produits >= 2:
        return DetectionResult(mode=TryonMode.tenue_complete, type_produit=f"{nombre_produits} articles",
            zone_corps="corps entier", raison=f"{nombre_produits} produits: tenue complète")
    return DetectionResult(mode=TryonMode.article_unique, type_produit=type_produit, zone_corps=zone,
        raison=f"1 produit ({type_produit}): article unique")
