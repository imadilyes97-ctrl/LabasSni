"""Routes du tableau de bord vendeur — produits, credits, stats, config."""

import logging
import re
import uuid
import random
from datetime import timedelta, date
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from ..core.auth import get_current_client
from ..core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


# ── Modèles ──────────────────────────────────────────────────────────────


class CreateProduitRequest(BaseModel):
    nom: str
    description: Optional[str] = None
    product_type: str
    image_url: str


class UpdateConfigRequest(BaseModel):
    ton_assistant: Optional[str] = None
    duree_retention: Optional[str] = None
    pixel_meta: Optional[str] = None
    pixel_tiktok: Optional[str] = None
    webhook_url: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────


def _generate_slug(nom: str) -> str:
    """Genere un slug URL-friendly a partir du nom du produit."""
    slug = nom.lower().strip()
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "produit"


# ── Produits ─────────────────────────────────────────────────────────────


@router.get("/produits")
async def list_produits(client_id: str = Depends(get_current_client)):
    """Liste tous les produits du client connecte avec leur compteur de generations."""
    with get_db() as db:
        rows = db.execute(
            """
            SELECT
                p.id, p.nom, p.description, p.product_type, p.image_url,
                p.landing_slug, p.created_at,
                (SELECT COUNT(*) FROM generations g WHERE g.produit_id = p.id) AS generations_count
            FROM produits p
            WHERE p.client_id = ?
            ORDER BY p.created_at DESC
            """,
            (client_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.post("/produits")
async def create_produit(
    req: CreateProduitRequest,
    client_id: str = Depends(get_current_client),
):
    """Cree un nouveau produit pour le client connecte."""
    if len(req.nom) < 2:
        raise HTTPException(400, "Nom du produit trop court (min 2 caracteres)")

    with get_db() as db:
        slug = _generate_slug(req.nom)

        # Garantir l'unicite du slug
        existing = db.execute(
            "SELECT id FROM produits WHERE landing_slug = ?", (slug,)
        ).fetchone()
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        db.execute(
            "INSERT INTO produits (client_id, nom, description, product_type, image_url, landing_slug) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (client_id, req.nom, req.description, req.product_type, req.image_url, slug),
        )

        # Récupérer l'ID généré (TEXT, pas lastrowid)
        row = db.execute(
            "SELECT * FROM produits WHERE landing_slug = ? AND client_id = ?",
            (slug, client_id),
        ).fetchone()

    logger.info(f"📦 Produit cree: {row['nom']} (slug={slug}) — client={client_id}")
    return dict(row)


@router.delete("/produits/{produit_id}")
async def delete_produit(
    produit_id: str,
    client_id: str = Depends(get_current_client),
):
    """Supprime un produit en verifiant qu'il appartient au client."""
    with get_db() as db:
        row = db.execute(
            "SELECT id FROM produits WHERE id = ? AND client_id = ?",
            (produit_id, client_id),
        ).fetchone()
        if not row:
            raise HTTPException(404, "Produit non trouve")

        db.execute("DELETE FROM produits WHERE id = ?", (produit_id,))

    logger.info(f"🗑️ Produit {produit_id} supprime par client {client_id}")
    return {"message": "Produit supprime"}


# ── Credits ──────────────────────────────────────────────────────────────


@router.get("/credits")
async def get_credits(client_id: str = Depends(get_current_client)):
    """Retourne les informations de credits du client connecte."""
    with get_db() as db:
        row = db.execute(
            "SELECT plan, credits_total, credits_used, credits_remaining, "
            "billing_period_start, billing_period_end "
            "FROM credits WHERE client_id = ?",
            (client_id,),
        ).fetchone()

    if not row:
        raise HTTPException(404, "Credits non trouves")
    return dict(row)


# ── Analytics ────────────────────────────────────────────────────────────


@router.get("/stats")
async def get_stats(client_id: str = Depends(get_current_client)):
    """Retourne les analytics des 7 derniers jours (ou donnees mock si vide)."""
    with get_db() as db:
        rows = db.execute(
            """
            SELECT date, visiteurs, generations, clics_achat
            FROM analytics
            WHERE client_id = ? AND date >= date('now', '-7 days')
            ORDER BY date ASC
            """,
            (client_id,),
        ).fetchall()

    if rows:
        evolution = [dict(r) for r in rows]
        total_visiteurs = sum(r["visiteurs"] for r in rows)
        total_generations = sum(r["generations"] for r in rows)
        total_clics = sum(r["clics_achat"] for r in rows)
    else:
        # Generer des donnees mock realistes
        evolution = []
        total_visiteurs = 0
        total_generations = 0
        total_clics = 0
        for i in range(6, -1, -1):
            d = (date.today() - timedelta(days=i)).isoformat()
            v = random.randint(10, 100)
            g = random.randint(1, max(1, v // 3))
            c = random.randint(0, max(0, g // 2))
            total_visiteurs += v
            total_generations += g
            total_clics += c
            evolution.append({"date": d, "visiteurs": v, "generations": g, "clics_achat": c})

    return {
        "visiteurs": total_visiteurs,
        "generations": total_generations,
        "clics_achat": total_clics,
        "evolution": evolution,
    }


# ── Configuration ────────────────────────────────────────────────────────


@router.get("/config")
async def get_config(client_id: str = Depends(get_current_client)):
    """Retourne la configuration du client connecte."""
    with get_db() as db:
        row = db.execute(
            "SELECT ton_assistant, duree_retention, pixel_meta, pixel_tiktok, webhook_url "
            "FROM clients WHERE id = ?",
            (client_id,),
        ).fetchone()

    if not row:
        raise HTTPException(404, "Client non trouve")
    return dict(row)


@router.put("/config")
async def update_config(
    req: UpdateConfigRequest,
    client_id: str = Depends(get_current_client),
):
    """Met a jour la configuration du client connecte (champs partiels)."""
    updates = {}
    if req.ton_assistant is not None:
        updates["ton_assistant"] = req.ton_assistant
    if req.duree_retention is not None:
        updates["duree_retention"] = req.duree_retention
    if req.pixel_meta is not None:
        updates["pixel_meta"] = req.pixel_meta
    if req.pixel_tiktok is not None:
        updates["pixel_tiktok"] = req.pixel_tiktok
    if req.webhook_url is not None:
        updates["webhook_url"] = req.webhook_url

    if not updates:
        raise HTTPException(400, "Aucun champ a mettre a jour")

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values())
    values.append(client_id)

    with get_db() as db:
        db.execute(
            f"UPDATE clients SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            values,
        )

    # Re-lire la config mise a jour
    with get_db() as db:
        row = db.execute(
            "SELECT ton_assistant, duree_retention, pixel_meta, pixel_tiktok, webhook_url "
            "FROM clients WHERE id = ?",
            (client_id,),
        ).fetchone()

    logger.info(f"⚙️  Config mise a jour pour client {client_id}: {list(updates.keys())}")
    return dict(row)
