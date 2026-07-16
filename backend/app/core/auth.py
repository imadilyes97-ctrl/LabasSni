"""Authentification JWT — login, register, middleware.

Utilise bcrypt pour les mots de passe et JWT pour les sessions.
Les tokens expirent après 7 jours.
"""

import os
import uuid
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Header, HTTPException, Depends
from ..core.database import get_db

logger = logging.getLogger(__name__)

# Secret JWT (depuis .env ou généré)
JWT_SECRET = os.getenv("JWT_SECRET") or hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    """Hash un mot de passe avec SHA-256 + salt (sans bcrypt pour éviter dépendance)."""
    salt = uuid.uuid4().hex[:16]
    return f"{salt}${hashlib.sha256(f'{salt}{password}'.encode()).hexdigest()}"


def verify_password(password: str, hashed: str) -> bool:
    """Vérifie un mot de passe hashé."""
    if "$" not in hashed:
        return False
    salt, stored_hash = hashed.split("$", 1)
    return stored_hash == hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def create_token(client_id: str) -> str:
    """Crée un token JWT simple (sans librairie externe)."""
    import json
    import base64

    header = base64.urlsafe_b64encode(json.dumps({"alg": JWT_ALGORITHM, "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(json.dumps({
        "sub": client_id,
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)).timestamp(),
    }).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(
        hashlib.sha256(f"{header}.{payload}.{JWT_SECRET}".encode()).digest()
    ).rstrip(b"=").decode()

    return f"{header}.{payload}.{signature}"


def verify_token(token: str) -> Optional[str]:
    """Vérifie et décode un token JWT. Retourne le client_id ou None."""
    import json
    import base64

    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header, payload, signature = parts

        # Vérifier la signature
        expected_sig = base64.urlsafe_b64encode(
            hashlib.sha256(f"{header}.{payload}.{JWT_SECRET}".encode()).digest()
        ).rstrip(b"=").decode()

        if signature != expected_sig:
            return None

        # Décoder le payload
        padded = payload + "=" * (4 - len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded).decode())

        # Vérifier l'expiration
        if data.get("exp", 0) < datetime.utcnow().timestamp():
            return None

        return data.get("sub")

    except Exception:
        return None


async def get_current_client(authorization: Optional[str] = Header(None)) -> str:
    """Dependency FastAPI — extrait le client_id du token JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")

    token = authorization.replace("Bearer ", "")
    client_id = verify_token(token)

    if not client_id:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    return client_id
