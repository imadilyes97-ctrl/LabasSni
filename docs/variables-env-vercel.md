# lebeSsni — Variables d'environnement (projet unique Next.js)

## Vercel

| Variable | Obligatoire | Description |
|----------|:-----------:|-------------|
| `DATABASE_URL` | ✅ OUI | URL de connexion PostgreSQL (Supabase) |

Les autres (`JWT_SECRET`, `RUNPOD_API_KEY`...) ont des valeurs par défaut. Pas besoin de les remplir.

Le backend Python a été migré dans les API routes Next.js → **plus besoin de `NEXT_PUBLIC_API_URL`**.
