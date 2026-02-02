# Déploiement (Front & Back)

## Frontend — déployé sur Netlify (recommandé) ou GitHub Pages
- Workflow: `.github/workflows/deploy-client-netlify.yml` build et déploie `client/dist` sur **Netlify** (déclenche sur `main`/`master`).
- Option rapide (UI): connecte ton compte GitHub sur https://app.netlify.com → New site from Git → choisis `exuprys-dev/Valentine-appV2` → dans Build settings :
  - **Base directory**: `client`  
  - **Build command**: `npm run build`  
  - **Publish directory**: `dist`
- Variables d'environnement (Netlify) :
  - `VITE_API_URL` = `https://<your-backend-url>`
  - (optionnel) autres variables front

URL de publication (exemple Netlify): `https://your-app.netlify.app`.

**Si tu automates via GitHub Actions** : ajoute ces GitHub Secrets `NETLIFY_AUTH_TOKEN` et `NETLIFY_SITE_ID` (Netlify → User Settings → Applications → Personal access tokens, et Site settings → Site information).

## Backend — Render (recommended) or Railway (recommended for MySQL)

### Render (optional)
- `render.yaml` provided for import (remplace `<OWNER>/<REPO>` par tes valeurs) ou crée un service dans Render Dashboard et connecte le repo.
- If using Render UI:
  1. Crée un **Web Service** → repo: `exuprys-dev/Valentine-appV2` → root: `server` → branch: `master`.
  2. Build Command: `npm ci`  
     Start Command: `npm start`
  3. Add a **Postgres Database** (Render → Databases) if necessary.
  4. In Environment, set: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `ALLOWED_ORIGIN` (ex: `https://your-app.vercel.app`).

- Workflow: `.github/workflows/deploy-to-render.yml` can trigger a Render deploy via API on pushes under `server/**`. Add these **GitHub Secrets**:
  - `RENDER_API_KEY` (Render dashboard → Account → API Keys)
  - `RENDER_SERVICE_ID` (ID du service Render — visible on the service page)

### Railway (recommended if you want a simple MySQL setup)
- Railway supports MySQL as a plugin and integrates directly with GitHub for automatic deploys.
- Quick steps:
  1. Create an account on https://railway.app and connect your GitHub account.
  2. Create a new **Project** → Connect your repository `exuprys-dev/Valentine-appV2` and select the `server` folder as the service root.
  3. In the project, add a **MySQL plugin** (Railway → Plugins → Add MySQL). This will create environment variables for you.
  4. In **Environment** variables (Railway), check the provided vars (you'll get a `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` or a single `DATABASE_URL`).
     - Our server now supports `DATABASE_URL` (format: `mysql://user:pass@host:port/db`) or the individual `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` vars.
  5. Add these env vars if not provisioned automatically: `JWT_SECRET`, `ALLOWED_ORIGIN` (set to your Vercel URL), and `NODE_ENV=production`.
  6. Trigger deploy (Railway will auto-deploy on push if connected to GitHub).

**Initialize the MySQL schema**:
- In Railway, open the DB plugin → click **Connect** to get a connection string, then run the SQL from `server/schema.sql` using the SQL editor they provide, or locally with:
  ```bash
  mysql -h <host> -u <user> -p<password> <db_name> < server/schema.sql
  ```

**Notes**:
- Make sure `ALLOWED_ORIGIN` equals your Vercel URL (e.g. `https://your-app.vercel.app`) to avoid CORS issues.
- If Railway provides `DATABASE_URL`, set it in Railway's environment variables and the app will use it automatically.

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
