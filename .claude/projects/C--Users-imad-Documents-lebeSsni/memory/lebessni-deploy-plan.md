---
name: lebessni-deploy-plan
description: "Plan de deploiement lebeSsni v2.1.0 — Vercel + Supabase PostgreSQL"
metadata:
  type: project
  date: 2026-07-16
---

# lebeSsni — Plan de Déploiement Vercel + Supabase

## Architecture
- **Frontend** : Next.js 15 → Vercel (standalone)
- **Backend** : FastAPI → Vercel (serverless Python via api/index.py)
- **DB** : PostgreSQL → Supabase

## Étapes réalisées (code)
- ✅ `database.py` → asyncpg wrapper (AsyncDB class, auto-conversion ? → $N)
- ✅ `schema.sql` → PostgreSQL (pgcrypto, triggers, GENERATED ALWAYS AS)
- ✅ `config.py` → DATABASE_URL par défaut PostgreSQL
- 🔄 Routes backend → async (auth, dashboard, tryon, main)
- 🔄 Vercel config (vercel.json, api/index.py, requirements.txt)
- 🔄 Frontend .env.example + gitignore

## Étapes restantes
1. Créer Supabase project (via supabase.com)
2. Récupérer DATABASE_URL de Supabase
3. Lancer la migration SQL dans Supabase SQL Editor
4. Déployer backend sur Vercel (avec DATABASE_URL en env var)
5. Déployer frontend sur Vercel (avec NEXT_PUBLIC_API_URL)
6. Vérifier le /health et les endpoints

## Notes
- Le cleanup auto n'utilise plus de thread daemon — utilise asyncio.create_task
- Les images uploadées sont stockées localement (tmp sur Vercel) — à migrer vers S3/Cloudinary plus tard
- Les Pixels Meta/TikTok sont activés via NEXT_PUBLIC_* env vars
- Le widget.js est dans public/ — servi statiquement par Vercel
