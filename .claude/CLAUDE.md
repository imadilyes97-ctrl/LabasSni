# lebeSsni — Virtual Try-On IA

Ce dossier contient le projet **lebeSsni**, un système complet d'essayage virtuel pour le e-commerce mode.

## Architecture

- **Frontend** : Next.js 15 + React 19 + Tailwind CSS 4
- **Backend** : FastAPI + Python
- **IA** : FAL AI / Replicate (génération d'image Try-On)
- **Base** : SQLite (dev) / PostgreSQL (prod)

## Structure

```
lebeSsni/
├── frontend/          ← Next.js widget Try-On
│   └── src/
│       ├── components/widget/  ← TryOnWidget, PhotoUploader, ModeSelector, ResultViewer, AssistantChat
│       ├── hooks/              ← useTryOn, useAssistant
│       └── lib/                ← types, api client
├── backend/           ← FastAPI
│   └── app/
│       ├── routes/    ← tryon, assistant, upload
│       ├── services/  ← prompt_engine, mode_detector, image_generator
│       ├── models/    ← tryon, tenant
│       └── core/      ← config, security
└── prompts/           ← master prompt virtual-try-on-v2.md
```

## Master Prompt

Le fichier `prompts/virtual-tryon-v2.md` est le master prompt original. Le backend l'utilise via `services/prompt_engine.py` qui injecte les variables dynamiquement.

## États des modèles d'orchestration

| Modèle | Statut | Usage |
|--------|--------|-------|
| Nemotron 3 Ultra | ✅ OK | Planification, architecture |
| GLM-5.2 (Architecture) | ❌ CF HS | Backend (fallback JARVIS) |
| GLM-5.2 Design | ❌ CF HS | Frontend (fallback JARVIS) |
| MiniMax M2.7 | ❌ Timeout | Analyse (fallback JARVIS) |
| North Mini Code | ✅ OK | Micro-tâches, setup |

## Objectifs Jumbo

- **Phase 1** : Backend API + Frontend widget fonctionnel ✅
- **Phase 2** : Intégration IA réelle (FAL AI key)
- **Phase 3** : Multi-tenant + Dashboard boutique
- **Phase 4** : Déploiement Vercel + Railway
