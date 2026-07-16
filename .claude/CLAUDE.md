# lebeSsni — Virtual Try-On Platform v2

Plateforme SaaS d'essayage virtuel pour e-commerce mode.
Moteur IA sur RunPod Serverless (au lieu de FAL AI / Replicate).

## Architecture

```
runpod-worker/     ← Worker Docker RunPod (handler.py, prompt_builder, generate, quality_check)
backend/           ← API FastAPI (routes: tryon, assistant, upload — services: prompt_engine, image_generator RunPod)
frontend/          ← Next.js 15 + Tailwind 4
  ├── widget.js    ← Snippet embarquable (iframe)
  ├── (landing)/   ← Landing page par produit
  ├── (dashboard)/ ← Dashboard vendeur (produits, config, stats, credits)
  └── widget-frame/← Contenu iframe
prompts/           ← Master Prompt A + B complets
```

## Master Prompts

- **Prompt A** (worker RunPod) — `{product_type}`, `{product_description}`, `{client_id}`
- **Prompt B** (widget/landing) — `{NOM_BOUTIQUE}`, `{TON}`, `{DUREE_RETENTION}`, `{product_type}`

## DB Schema

`backend/app/models/schema.sql` — 5 tables: clients, produits, generations, credits, analytics

## États des modèles d'orchestration

| Modèle | Statut | Usage |
|--------|--------|-------|
| Nemotron 3 Ultra | ✅ OK | Planification, architecture |
| GLM-5.2 | ⚠️ HS (Payant CF) | Fallback Nemotron |
| GLM-5.2 Design | ⚠️ HS (Payant CF) | Fallback Nemotron |
| MiniMax M2.7 | ⚠️ Dahl API instable | Fallback JARVIS |
| North Mini | ✅ OK | Micro-tâches, setup |

## Objectifs

- **Phase 1** : RunPod Worker + Backend update ✅
- **Phase 2** : Widget.js + Landing page + Dashboard ✅
- **Phase 3** : Déploiement production
