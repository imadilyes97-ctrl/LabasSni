"""Couche base de donnees — PostgreSQL (Supabase) avec asyncpg.

Initialise le schema au demarrage, fournit un pool de connexions asynchrone.
Remplace l'ancienne couche SQLite synchrone.
"""

import os
import re
import logging
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg

from .config import settings

logger = logging.getLogger(__name__)


class AsyncDB:
    """Wrapper asynchrone autour d'asyncpg avec conversion automatique ? → $N."""

    def __init__(self):
        self.pool: asyncpg.Pool | None = None

    async def connect(self, dsn: str | None = None) -> None:
        """Cree le pool de connexions PostgreSQL."""
        url = dsn or settings.database_url
        if not url or "postgres" not in url:
            raise RuntimeError(
                f"DATABASE_URL invalide ou manquante. Attendue: postgresql://..., recu: {url}"
            )

        self.pool = await asyncpg.create_pool(
            url,
            min_size=1,
            max_size=5,
            command_timeout=30,
            timeout=10,
        )
        logger.info(f"✅ Pool PostgreSQL connecte (min=1, max=5)")

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()
            logger.info("Pool PostgreSQL ferme")

    def _convert(self, query: str) -> str:
        """Convertit les placeholders ? en $1, $2, ... pour asyncpg."""
        i = [0]
        return re.sub(r"\?", lambda _: f"${i[0] := i[0] + 1}", query)

    async def execute(self, query: str, *args) -> str:
        """Execute une commande SQL (INSERT, UPDATE, DELETE, DDL)."""
        async with self.pool.acquire() as conn:
            return await conn.execute(self._convert(query), *args)

    async def fetch(self, query: str, *args) -> list[asyncpg.Record]:
        """Retourne toutes les lignes."""
        async with self.pool.acquire() as conn:
            return await conn.fetch(self._convert(query), *args)

    async def fetchrow(self, query: str, *args) -> asyncpg.Record | None:
        """Retourne la premiere ligne ou None."""
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(self._convert(query), *args)

    async def executemany(self, query: str, args_list: list[tuple]) -> str:
        """Execute la meme requete avec plusieurs jeux de parametres."""
        async with self.pool.acquire() as conn:
            return await conn.executemany(self._convert(query), args_list)


db = AsyncDB()


# ── Helpers ─────────────────────────────────────────────────────────────────


async def init_db() -> bool:
    """Initialise la base de donnees avec le schema PostgreSQL."""
    schema_path = Path(__file__).parent.parent / "models" / "schema.sql"

    if not schema_path.exists():
        logger.warning(f"Schema SQL non trouve: {schema_path}")
        return False

    try:
        schema_sql = schema_path.read_text(encoding="utf-8")

        # Executer chaque instruction separement car asyncpg n'aime pas les blocks multiples
        statements = [s.strip() for s in schema_sql.split(";") if s.strip()]

        async with db.pool.acquire() as conn:
            for stmt in statements:
                if stmt:
                    try:
                        await conn.execute(stmt)
                    except asyncpg.exceptions.DuplicateTableError:
                        pass  # La table existe deja — OK
                    except asyncpg.exceptions.DuplicateFunctionError:
                        pass  # La fonction existe deja — OK
                    except asyncpg.exceptions.DuplicateObjectError:
                        pass  # L'extension existe deja — OK
                    except Exception as e:
                        logger.warning(f"Statement ignore: {e}")

        logger.info("✅ Base de donnees PostgreSQL initialisee")
        return True

    except Exception as e:
        logger.error(f"❌ Erreur d'initialisation de la DB: {e}")
        return False


async def cleanup_expired_images():
    """Supprime les generations expirees."""
    try:
        result = await db.execute(
            "DELETE FROM generations WHERE expires_at IS NOT NULL AND expires_at < NOW()"
        )
        # Extraire le nombre de lignes supprimees du message
        match = re.search(r"(\d+)", result)
        count = int(match.group(1)) if match else 0
        logger.info(f"Nettoyage termine: {count} generations expirees supprimees")
    except Exception as e:
        logger.error(f"Erreur nettoyage: {e}")


def log_image_access(client_id: str, image_url: str, visitor_ip: str | None, action: str):
    """Logger les acces aux images (fichier — identique a avant)."""
    try:
        from pathlib import Path as P
        access_log_dir = P(settings.upload_dir)
        os.makedirs(str(access_log_dir), exist_ok=True)
        log_path = access_log_dir / "access.log"

        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        ip = visitor_ip or "-"
        line = f"[{timestamp}] {action} {client_id} {image_url} {ip}\n"

        with open(str(log_path), "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as e:
        logger.error(f"Erreur log_image_access: {e}")
