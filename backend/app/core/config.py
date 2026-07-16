"""Configuration centralisée de l'application (lebeSsni v2 — RunPod)."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "lebeSsni"
    app_version: str = "2.0.0"
    debug: bool = False

    # RunPod Serverless (nouveau moteur IA)
    runpod_api_key: Optional[str] = None
    runpod_endpoint_id: Optional[str] = None

    # Anciens providers (deprecated — conservés pour fallback)
    fal_key: Optional[str] = None
    replicate_api_token: Optional[str] = None

    # Stockage
    upload_dir: str = "./uploads"
    max_image_size_mb: int = 10
    image_retention_hours: int = 24

    # Sécurité
    api_key: Optional[str] = None
    jwt_secret: Optional[str] = None
    cors_origins: str = "http://localhost:3000"

    # Base de données PostgreSQL (Supabase)
    database_url: str = "postgresql://postgres:imadil1234.%40@db.chtuhujoxuypuckrvhbf.supabase.co:5432/postgres"

    # Paramètres par défaut
    default_style_rendu: str = "studio catalogue"
    default_orientation: str = "portrait 3:4"
    retention_duree: str = "24 heures"
    default_ton: str = "chaleureux, rassurant, concis"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
