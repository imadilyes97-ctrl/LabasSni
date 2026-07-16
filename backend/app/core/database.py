"""Couche base de données — SQLite avec connexion sécurisée.

Initialise le schéma au démarrage, fournit des helpers pour les requêtes.
Supporte le multi-tenant et l'auto-delete des photos expirées.
"""

import os
import sqlite3
import logging
import threading
from pathlib import Path
from datetime import datetime, timedelta
from contextlib import contextmanager

from .config import settings

logger = logging.getLogger(__name__)

_local = threading.local()


def get_db_path() -> str:
    """Retourne le chemin absolu de la base de données."""
    db_url = settings.database_url
    if db_url.startswith("sqlite+aiosqlite:///"):
        db_path = db_url.replace("sqlite+aiosqlite:///", "")
    elif db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
    else:
        db_path = "./lebeSsni.db"

    # S'assurer que le dossier parent existe
    parent = Path(db_path).parent
    if str(parent) != ".":
        os.makedirs(str(parent), exist_ok=True)

    return db_path


def get_connection() -> sqlite3.Connection:
    """Récupère une connexion thread-safe."""
    if not hasattr(_local, "conn") or _local.conn is None:
        db_path = get_db_path()
        _local.conn = sqlite3.connect(db_path, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


@contextmanager
def get_db():
    """Context manager pour les requêtes — commit/rollback automatique."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def init_db():
    """Initialise la base de données avec le schéma SQL."""
    schema_path = Path(__file__).parent.parent / "models" / "schema.sql"

    if not schema_path.exists():
        logger.warning(f"Schema SQL non trouvé: {schema_path}")
        return False

    try:
        schema_sql = schema_path.read_text(encoding="utf-8")
        conn = get_connection()
        conn.executescript(schema_sql)
        conn.commit()
        logger.info("✅ Base de données initialisée avec succès")
        return True
    except Exception as e:
        logger.error(f"❌ Erreur d'initialisation de la DB: {e}")
        return False


def cleanup_expired_images():
    """Supprime les entrées expirées et leurs fichiers."""
    import glob

    try:
        with get_db() as db:
            # Récupérer les chemins à supprimer avant de supprimer les entrées
            expired = db.execute(
                "SELECT user_image_url, result_image_url FROM generations WHERE expires_at < datetime('now')"
            ).fetchall()

            # Supprimer les fichiers
            upload_dir = settings.upload_dir
            for row in expired:
                for url in [row["user_image_url"], row["result_image_url"]]:
                    if url and url.startswith("/"):
                        file_path = str(Path(upload_dir) / Path(url).name)
                        if os.path.exists(file_path):
                            os.remove(file_path)
                            logger.info(f"🗑️ Fichier expiré supprimé: {file_path}")

            # Nettoyer les entrées orphelines (plus vieilles que la rétention max)
            max_hours = settings.image_retention_hours
            db.execute(
                "DELETE FROM generations WHERE created_at < datetime('now', ?)",
                (f"-{max_hours} hours",)
            )

            logger.info(f"🧹 Nettoyage terminé: {len(expired)} fichiers supprimés")
    except Exception as e:
        logger.error(f"Erreur nettoyage: {e}")
