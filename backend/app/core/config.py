"""Configuration centralisée de l'application."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "lebeSsni"
    app_version: str = "1.0.0"
    debug: bool = False

    # API Keys
    fal_key: Optional[str] = None
    replicate_api_token: Optional[str] = None

    # Stockage
    upload_dir: str = "./uploads"
    max_image_size_mb: int = 10

    # Sécurité
    api_key: Optional[str] = None

    # Base de données
    database_url: str = "sqlite+aiosqlite:///./lebeSsni.db"

    # Paramètres par défaut du prompt
    default_style_rendu: str = "studio catalogue"
    default_orientation: str = "portrait 3:4"
    retention_duree: str = "24 heures"
    default_ton: str = "décontracté et amical"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
