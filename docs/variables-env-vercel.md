# lebeSsni — Variables d'environnement Vercel

> Copie ces valeurs dans Vercel → Project Settings → Environment Variables

---

## BACKEND (à créer dans Vercel en premier)

| Variable | Valeur | Où la trouver |
|----------|--------|--------------|
| `DATABASE_URL` | `postgresql://postgres:imadil1234.%40@db.chtuhujoxuypuckrvhbf.supabase.co:5432/postgres` | Supabase → Project Settings → Database → Connection string |
| `JWT_SECRET` | 🔴 **À CHANGER** → mets une chaîne aléatoire (ex: `sk_7R9mK2xP4vL8nQ1wJ3bH5tY6`) | Génère-la toi-même |
| `API_KEY` | 🔴 **À CHANGER** → mets une clé API (ex: `lebessni_api_key_2026`) | Génère-la toi-même |
| `PYTHON_VERSION` | `3.12` | Fixe (Vercel a besoin de savoir) |

**⚠️ ATTENTION :** Le `%40` dans DATABASE_URL correspond au `@` du mot de passe `imadil1234.@`

---

## FRONTEND (à créer après le backend)

| Variable | Valeur | Où la trouver |
|----------|--------|--------------|
| `NEXT_PUBLIC_API_URL` | 🔴 `https://TON_BACKEND.vercel.app` | L'URL donnée par Vercel après déploiement du backend |
| `NEXT_PUBLIC_META_PIXEL_ID` | *(optionnel)* laisser vide | Meta Ads → Pixel ID |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | *(optionnel)* laisser vide | TikTok Ads → Pixel ID |

---

## Ordre de déploiement

```
1️⃣ Supabase → SQL Editor → coller supabase/migration.sql → Run
2️⃣ Backend  → Vercel (root: backend/) → ajouter les 4 env vars → Deploy
3️⃣ Frontend → Vercel (root: frontend/) → ajouter NEXT_PUBLIC_API_URL → Deploy
```
