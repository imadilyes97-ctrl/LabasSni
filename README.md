# lebeSsni — Virtual Try-On IA 👕✨

> **lebeSsni** est un système complet d'essayage virtuel (Virtual Try-On) pour le e-commerce mode. Uploade ta photo, choisis un produit, vois le rendu en temps réel.

## Architecture

```
lebeSsni/
├── frontend/          # Next.js 15 + Tailwind CSS 4
│   └── src/
│       ├── app/             # Pages Next.js
│       ├── components/
│       │   └── widget/      # Composants du widget Try-On
│       │       ├── TryOnWidget.tsx    # Conteneur principal
│       │       ├── PhotoUploader.tsx  # Upload photo drag & drop
│       │       ├── ModeSelector.tsx   # Mode article/tenue/séquentiel
│       │       ├── ResultViewer.tsx   # Rendu + validation checklist
│       │       └── AssistantChat.tsx  # Chat assistant client
│       ├── hooks/
│       │   ├── useTryOn.ts           # State et logique Try-On
│       │   └── useAssistant.ts       # State assistant chat
│       └── lib/
│           ├── types.ts              # Types partagés
│           └── api.ts                # Client API backend
│
├── backend/           # FastAPI + Python
│   └── app/
│       ├── main.py              # Point d'entrée FastAPI
│       ├── core/
│       │   ├── config.py        # Configuration (Pydantic Settings)
│       │   └── security.py      # API Key + multi-tenant
│       ├── models/
│       │   ├── tryon.py         # Modèles Try-On (modes, status, requêtes)
│       │   └── tenant.py        # Configuration multi-tenant
│       ├── services/
│       │   ├── prompt_engine.py # Template master prompt + injection
│       │   ├── mode_detector.py # Détection auto du mode (produit→zone)
│       │   └── image_generator.py # Génération via FAL AI / Replicate
│       └── routes/
│           ├── tryon.py         # POST /api/tryon/generate, detect-mode
│           ├── assistant.py     # POST /api/assistant/chat
│           └── upload.py        # POST /api/upload/photo
│
└── prompts/
    └── virtual-tryon-v2.md      # Master prompt original
```

## Fonctionnalités

- ✅ **3 modes de génération** : article unique, tenue complète, séquentiel
- ✅ **Détection automatique du mode** selon le nombre de produits & session active
- ✅ **Assistant client** conversationnel intégré (confidentialité, aide, erreurs)
- ✅ **Multi-tenant** prêt : chaque boutique a sa config (prompts, ton, durée rétention)
- ✅ **Validation checklist** sur chaque rendu (visage, produit, artefacts, lumière, mode)
- ✅ **Fallback IA** : FAL AI → Replicate → Mock (développement)
- ✅ **Upload drag & drop** côté client

## Démarrage rapide

### Backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le widget est accessible sur `http://localhost:3000` et l'API sur `http://localhost:8000`.

## Configuration

| Variable | Description |
|----------|-------------|
| `FAL_KEY` | Clé API FAL AI (recommandé) |
| `REPLICATE_API_TOKEN` | Token Replicate (fallback) |
| `API_KEY` | Clé API pour sécuriser les endpoints |
| `DATABASE_URL` | URL de BDD (multi-tenant) |

## Master Prompt

Le master prompt (`prompts/virtual-tryon-v2.md`) définit le comportement du système :
- **Partie A** : Prompt de génération d'image (moteur de rendu photo-réaliste)
- **Partie B** : Prompt système de l'assistant widget (guide client)

Les variables sont injectées dynamiquement par `services/prompt_engine.py`.

## Tech Stack

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| IA | FAL AI / Replicate |
| Base | SQLite (dev), configurable |
