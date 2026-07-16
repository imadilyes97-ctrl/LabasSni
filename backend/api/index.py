"""Vercel serverless entry point for lebeSsni FastAPI backend."""
import sys
from pathlib import Path

# Ajouter backend au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

# Exposed as handler for Vercel
handler = app
