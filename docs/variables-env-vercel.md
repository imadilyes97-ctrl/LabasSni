# lebeSsni — Variables d'environnement

## BACKEND (Vercel)

| Variable | Obligatoire |
|----------|:-----------:|
| `DATABASE_URL` | ✅ OUI - Sans ça, pas de DB |

Les autres (JWT_SECRET, API_KEY, RUNPOD_API_KEY...) ont des valeurs par défaut. Pas besoin de les remplir.

## FRONTEND (Vercel)

| Variable | Obligatoire |
|----------|:-----------:|
| `NEXT_PUBLIC_API_URL` | ✅ OUI - URL du backend déployé sur Vercel |
