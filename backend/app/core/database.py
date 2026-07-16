"""Couche base de donnees — PostgreSQL (Supabase) via psycopg2.

Meme interface async (execute, fetch, fetchrow) mais les appels DB
sont executes de maniere synchrone dans un thread pool (to_thread).
Compatible Vercel serverless Python.
"""

import os
import re
import logging
import asyncio
import traceback
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

import psycopg2
import psycopg2.extras
import psycopg2.pool

from .config import settings

logger = logging.getLogger(__name__)


class AsyncDB:
    """Wrapper asynchrone PostgreSQL (psycopg2 synchrone + asyncio.to_thread)."""

    def __init__(self):
        self.pool: psycopg2.pool.ThreadedConnectionPool | None = None

    async def connect(self, dsn: str | None = None) -> None:
        """Cree le pool de connexions PostgreSQL."""
        url = dsn or settings.database_url
        if not url or "postgres" not in url:
            raise RuntimeError(
                f"DATABASE_URL invalide. Attendue: postgresql://..., recu: {url}"
            )

        loop = asyncio.get_event_loop()

        def _connect():
            return psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=5,
                dsn=url,
            )

        self.pool = await loop.run_in_executor(None, _connect)
        logger.info("Pool PostgreSQL connecte (psycopg2, min=1, max=5)")

    async def close(self) -> None:
        if self.pool:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.pool.closeall)
            logger.info("Pool PostgreSQL ferme")

    @staticmethod
    def _convert(query: str) -> str:
        """Convertit les placeholders ? en %s pour psycopg2."""
        return query.replace("?", "%s")

    def _get_conn(self):
        if not self.pool:
            raise RuntimeError("Pool non initialise")
        return self.pool.getconn()

    def _put_conn(self, conn):
        if self.pool:
            self.pool.putconn(conn)

    async def execute(self, query: str, *args) -> str:
        """Execute une commande SQL (INSERT, UPDATE, DELETE, DDL)."""
        loop = asyncio.get_event_loop()

        def _exec():
            conn = self._get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(self._convert(query), args)
                    conn.commit()
                    return f"OK {cur.rowcount}"
            except Exception:
                conn.rollback()
                raise
            finally:
                self._put_conn(conn)

        return await loop.run_in_executor(None, _exec)

    async def fetch(self, query: str, *args) -> list[dict]:
        """Retourne toutes les lignes comme liste de dicts."""
        loop = asyncio.get_event_loop()

        def _fetch():
            conn = self._get_conn()
            try:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                    cur.execute(self._convert(query), args)
                    return [dict(row) for row in cur.fetchall()]
            finally:
                self._put_conn(conn)

        return await loop.run_in_executor(None, _fetch)

    async def fetchrow(self, query: str, *args) -> dict | None:
        """Retourne la premiere ligne comme dict ou None."""
        loop = asyncio.get_event_loop()

        def _fetchrow():
            conn = self._get_conn()
            try:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                    cur.execute(self._convert(query), args)
                    row = cur.fetchone()
                    return dict(row) if row else None
            finally:
                self._put_conn(conn)

        return await loop.run_in_executor(None, _fetchrow)

    async def executemany(self, query: str, args_list: list[tuple]) -> int:
        """Execute la meme requete avec plusieurs jeux de parametres."""
        loop = asyncio.get_event_loop()

        def _execmany():
            conn = self._get_conn()
            try:
                with conn.cursor() as cur:
                    psycopg2.extras.execute_batch(cur, self._convert(query), args_list)
                    conn.commit()
                    return cur.rowcount
            except Exception:
                conn.rollback()
                raise
            finally:
                self._put_conn(conn)

        return await loop.run_in_executor(None, _execmany)


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
        statements = [s.strip() for s in schema_sql.split(";") if s.strip()]

        loop = asyncio.get_event_loop()

        def _init():
            conn = db._get_conn()
            try:
                with conn.cursor() as cur:
                    for stmt in statements:
                        if stmt:
                            try:
                                cur.execute(stmt)
                            except Exception as e:
                                msg = str(e).split("\n")[0][:80]
                                logger.warning(f"Statement ignore: {msg}")
                    conn.commit()
                logger.info("Base de donnees PostgreSQL initialisee")
                return True
            except Exception as e:
                conn.rollback()
                logger.error(f"Erreur init DB: {e}")
                return False
            finally:
                db._put_conn(conn)

        return await loop.run_in_executor(None, _init)

    except Exception as e:
        logger.error(f"Erreur d'initialisation de la DB: {e}")
        return False


async def cleanup_expired_images():
    """Supprime les generations expirees."""
    try:
        await db.execute(
            "DELETE FROM generations WHERE expires_at IS NOT NULL AND expires_at < NOW()"
        )
    except Exception as e:
        logger.error(f"Erreur nettoyage: {e}")


def log_image_access(client_id: str, image_url: str, visitor_ip: str | None, action: str):
    """Logger les acces aux images (fichier — identique a avant)."""
    try:
        access_log_dir = Path(settings.upload_dir)
        os.makedirs(str(access_log_dir), exist_ok=True)
        log_path = access_log_dir / "access.log"

        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        ip = visitor_ip or "-"
        line = f"[{timestamp}] {action} {client_id} {image_url} {ip}\n"

        with open(str(log_path), "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as e:
        logger.error(f"Erreur log_image_access: {e}")
