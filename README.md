# lebeSsni — Virtual Try-On Platform 👕✨

> **lebeSsni** est une plateforme SaaS d'essayage virtuel (Virtual Try-On) pour le e-commerce mode. Une IA génère une photo du visiteur portant le produit — directement depuis une pub Meta/TikTok, un widget sur le store, ou une landing page dédiée.

## Architecture

```
[Pub Meta/TikTok] → [Landing Page ou Widget] → [API Backend] → [RunPod Serverless] → [Image générée]
```

## Tech Stack

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend | FastAPI (Python) |
| Moteur IA | RunPod Serverless (Docker + Nano Banana / IDM-VTON) |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| Distribution | Widget.js embarquable + Landing page générée |

## Structure du projet

```
lebeSsni/
├── runpod-worker/            ← Worker Docker pour RunPod
│   ├── Dockerfile
│   ├── handler.py            ← Point d'entrée RunPod
│   ├── requirements.txt
│   └── src/
│       ├── prompt_builder.py ← Master Prompt A
│       ├── generate.py       ← Appel modèle IA
│       └── quality_check.py  ← Contrôle qualité image
│
├── backend/                  ← API FastAPI
│   └── app/
│       ├── main.py           ← Point d'entrée FastAPI
│       ├── core/             ← Config, sécurité, sanitization
│       ├── routes/           ← tryon (génération), assistant, upload
│       ├── services/         ← prompt_engine, image_generator (RunPod), mode_detector
│       └── models/           ← tryon, tenant, schema.sql
│
├── frontend/                 ← Next.js 15 + Tailwind CSS 4
│   ├── public/widget.js      ← Snippet embarquable (iframe isolée)
│   └── src/app/
│       ├── (landing)/        ← Landing page générée par produit
│       ├── (dashboard)/      ← Dashboard vendeur (produits, config, stats, crédits)
│       └── widget-frame/     ← Contenu de l'iframe widget
│
└── prompts/                  ← Master prompts A + B version complète
```

## Master Prompts

Le fichier `prompts/virtual-tryon-v2.md` contient les 2 master prompts :

- **Prompt A** — Génération d'image (injecté dans le worker RunPod)
  - Variables : `{product_type}`, `{product_description}`, `{client_id}`
  - Contraintes : préservation identité, rendu produit, cohérence lumière, anti-artefacts
  
- **Prompt B** — Assistant conversationnel (widget / landing page)
  - Variables : `{NOM_BOUTIQUE}`, `{TON}`, `{DUREE_RETENTION}`, `{product_type}`
  - 4 étapes : accueil, génération, résultat, gestion échecs

## Fonctionnalités

### Distribution
- ✅ **Landing page générée** (recommandé) — une page par produit, hébergée sur la plateforme
- ✅ **Widget.js embarquable** — snippet `<script>` à coller sur Shopify, WooCommerce, site custom

### Dashboard vendeur
- ✅ Produits (création, listing, lien landing + widget)
- ✅ Configuration (ton assistant, durée rétention, pixels Meta/TikTok)
- ✅ Statistiques (visiteurs, générations, clics achat)
- ✅ Crédits / abonnements (Starter, Pro, Business)

### Moteur IA (RunPod Serverless)
- ✅ Scale-to-zero — pas de facturation quand personne génère
- ✅ Option A : Self-host IDM-VTON (GPU)
- ✅ Option B : Proxy Nano Banana (CPU, recommandé pour démarrer)
- ✅ Contrôle qualité avant affichage (résolution, artefacts, watermark)

### Sécurité & RGPD
- ✅ Auto-delete des photos après 24h (configurable)
- ✅ Consentement explicite avant upload
- ✅ Aucune réutilisation des photos hors génération
- ✅ Journalisation des accès
- ✅ Rate limiting + validation images (Pillow, magic bytes)

## Démarrage rapide

### Backend
```bash
cd backend
cp .env.example .env
# Configurer RUNPOD_API_KEY et RUNPOD_ENDPOINT_ID
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### RunPod Worker
```bash
cd runpod-worker
docker build -t lebessni-runpod .
# Push sur Docker Hub, configurer endpoint RunPod
```

## Configuration RunPod

1. Créer un compte [RunPod](https://runpod.io)
2. Aller dans Serverless → Endpoints
3. Créer un endpoint avec l'image Docker de `runpod-worker/`
4. Copier l'`ENDPOINT_ID` et la `RUNPOD_API_KEY` dans `.env`

## Roadmap

- **MVP** — Backend + RunPod (Option B) + Landing page + Dashboard basique ✅
- **V2** — Widget embarquable complet, domaines personnalisés, statistiques avancées
- **V3** — Migration Option A (self-host IDM-VTON) pour clients à fort volume
