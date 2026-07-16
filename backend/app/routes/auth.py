"""Routes d'authentification — inscription et connexion vendeur."""

import logging
import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

from ..core.auth import hash_password, verify_password, create_token, get_current_client
from ..core.database import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    nom_boutique: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    client_id: str
    nom_boutique: str


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Inscrit un nouveau vendeur.

    Crée un compte, initialise ses crédits (Starter: 50 générations),
    et retourne un token JWT.
    """
    if len(req.password) < 6:
        raise HTTPException(400, "Mot de passe trop court (min 6 caractères)")

    if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", req.email):
        raise HTTPException(400, "Email invalide")

    if len(req.nom_boutique) < 2:
        raise HTTPException(400, "Nom de boutique trop court")

    # Vérifier si l'email existe déjà
    existing = await db.fetchrow("SELECT id FROM clients WHERE email = ?", req.email)
    if existing:
        raise HTTPException(409, "Cet email est déjà utilisé")

    # Créer le client
    await db.execute(
        "INSERT INTO clients (nom_boutique, email, password_hash) VALUES (?, ?, ?)",
        req.nom_boutique, req.email, hash_password(req.password),
    )

    # Récupérer l'ID généré (TEXT)
    client = await db.fetchrow("SELECT id FROM clients WHERE email = ?", req.email)
    if not client:
        raise HTTPException(500, "Erreur création du compte")
    client_id = client["id"]

    # Initialiser ses crédits (Starter: 50 générations)
    await db.execute(
        "INSERT INTO credits (client_id, plan, credits_total, credits_used) VALUES (?, 'starter', 50, 0)",
        client_id,
    )

    token = create_token(client_id)

    return AuthResponse(token=token, client_id=str(client_id), nom_boutique=req.nom_boutique)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Connecte un vendeur existant."""
    client = await db.fetchrow(
        "SELECT id, nom_boutique, password_hash FROM clients WHERE email = ?",
        req.email,
    )

    if not client or not verify_password(req.password, client["password_hash"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")

    token = create_token(str(client["id"]))

    return AuthResponse(token=token, client_id=str(client["id"]), nom_boutique=client["nom_boutique"])


@router.get("/me")
async def get_me(client_id: str = Depends(get_current_client)):
    """Retourne les infos du client connecté."""
    client = await db.fetchrow(
        "SELECT id, nom_boutique, email, ton_assistant, duree_retention, "
        "pixel_meta, pixel_tiktok, created_at FROM clients WHERE id = ?",
        client_id,
    )

    if not client:
        raise HTTPException(404, "Client non trouvé")

    return dict(client)
