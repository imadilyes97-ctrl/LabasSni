---
name: lebessni-merge-plan
description: "Plan de merge backend Python -> Next.js API routes (1 seul projet Vercel)"
metadata:
  type: project
  date: 2026-07-17
---

# lebeSsni — Merge Backend → Frontend (1 projet Next.js)

## Ce qui a été fait
- ✅ Compte Supabase créé (db.chtuhujoxuypuckrvhbf.supabase.co)
- ✅ DATABASE_URL avec mot de passe
- ✅ Code backend async (routes auth, dashboard, tryon, upload, assistant)
- ✅ Déploiement backend Vercel testé (bloqué sur asyncpg -> psycopg2)
- ✅ Frontend compilé (build OK, 6 pages statiques)
- ✅ Push sur GitHub imadilyes97-ctrl/LabasSni
- ✅ .env.example simplifiés
- ✅ docs/variables-env-vercel.md

## Ce qu'il reste à faire (prochaine session)
1. Installer les dépendances : pg (PostgreSQL), bcryptjs, jsonwebtoken
2. Créer les lib/ : lib/db.ts, lib/auth.ts, lib/config.ts
3. Convertir les routes backend en Next.js API routes :
   - src/app/api/auth/register/route.ts
   - src/app/api/auth/login/route.ts
   - src/app/api/auth/me/route.ts
   - src/app/api/tryon/generate/route.ts
   - src/app/api/tryon/detect-mode/route.ts
   - src/app/api/upload/photo/route.ts
   - src/app/api/assistant/chat/route.ts
   - src/app/api/dashboard/produits/route.ts
   - src/app/api/dashboard/credits/route.ts
   - src/app/api/dashboard/stats/route.ts
   - src/app/api/dashboard/config/route.ts
   - src/app/api/health/route.ts
4. Adapter les appels API dans le frontend (enlever NEXT_PUBLIC_API_URL)
5. Tester build
6. Déployer 1 seul projet Vercel (root: frontend/)
7. Mettre à jour .env.example et docs

## Fichiers backend/ à garder (référence, pas supprimés)
- backend/app/routes/*.py → logique à recoder en TS
- backend/app/core/auth.py → JWT helper
- backend/app/models/schema.sql → déjà en SQL
