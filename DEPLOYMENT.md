# Déploiement (Front & Back)

## Frontend — déployé automatiquement sur GitHub Pages
- Workflow: `.github/workflows/deploy-client-pages.yml` déclenche sur `push` vers `main` et build le dossier `client`, puis publie `client/dist` sur GitHub Pages.
- Important: le build utilise `VITE_BASE` défini par le workflow (`/${{ github.event.repository.name }}/`) pour que Vite génère des chemins corrects.

URL de publication (provisoire): `https://<username>.github.io/<repo>/` (remplacer `<username>` et `<repo>` par les tiens).

## Backend — image Docker buildée & poussée sur GHCR
- Workflow: `.github/workflows/build-and-push-server.yml` build et push l'image Docker du dossier `server` vers GitHub Container Registry (GHCR):
  - Tags: `ghcr.io/<owner>/valentine-server:latest` et `ghcr.io/<owner>/valentine-server:<sha>`
- Tu peux déployer cette image sur Render / Railway / Fly.io / un VPS.

## Ce qu'il te reste à faire
1. (Serveur) Si tu veux un déploiement managé, crée un service sur Render/Railway et connecte-le soit au repo (build automatique), soit à l'image GHCR.
2. (Serveur) Ajoute les variables d'environnement dans la plateforme choisie (ex: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`).
3. (Serveur) Si tu utilises Postgres, crée la base via le provider (Render/Railway) et exécute `server/schema.sql` pour créer les tables.

## Notes de sécurité
- Ne commite jamais les secrets dans le repo. Utilise les Secrets GitHub (Settings → Secrets) ou les variables d'environnement fournies par ton host.
