# Déploiement (Front & Back)

## Frontend — déployé automatiquement sur GitHub Pages ou Vercel
- Workflow: `.github/workflows/deploy-client-pages.yml` build et publie `client/dist` sur **GitHub Pages** (déclenche sur `main`/`master`).
- Option recommandée: **Vercel** — connecte ton repo, définis le root sur `/client` (ou utilise `vercel.json` fourni).  
  - Build command: `npm run build`
  - Output dir: `dist`
  - Définis la variable d'environnement `VITE_API_URL` sur l'URL publique de ton backend (ex: `https://api.example.com`).

URL de publication (exemple Vercel): `https://your-app.vercel.app`.

## Backend — Render (recommended)
- `render.yaml` fourni pour import (remplace `<OWNER>/<REPO>` par tes valeurs) ou crée un service dans Render Dashboard et connecte le repo.
- Si tu veux utiliser Render UI (simpler):
  1. Crée un **Web Service** → repo: `exuprys-dev/Valentine-appV2` → root: `server` → branch: `master`.
  2. Build Command: `npm ci`  
     Start Command: `npm start`
  3. Ajoute une **Postgres Database** (Render → Databases) si nécessaire.
  4. Dans Environment, définis: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, et `ALLOWED_ORIGIN` (ex: `https://your-app.vercel.app`).

- Workflow: `.github/workflows/deploy-to-render.yml` peut déclencher un déploiement Render via API quand on pousse dans `server/**`. Tu dois ajouter ces **GitHub Secrets**:
  - `RENDER_API_KEY` (Render dashboard → Account → API Keys)
  - `RENDER_SERVICE_ID` (ID du service Render — visible sur la page du service)

## CORS & sécurité
- Le serveur lit `ALLOWED_ORIGIN`. En production, définis `ALLOWED_ORIGIN` à l'URL Vercel (par exemple `https://your-app.vercel.app`) plutôt que `*`.
- Ne commite jamais les secrets (utilise GitHub Secrets ou les variables d'environnement du host).

## Initialiser la DB
- Si tu utilises Postgres, connecte-toi à la DB (via psql ou l'UI du provider) et exécute `server/schema.sql`.

---
Si tu veux, je peux :
- connecter le repo à **Vercel** et configurer `VITE_API_URL` (il faudra autoriser l'accès via ton compte Vercel), ou
- créer les secrets GitHub requis **(RENDER_API_KEY, RENDER_SERVICE_ID)** si tu me fournis les valeurs, ou
- te guider pas à pas pendant la connexion Render/Vercel.
