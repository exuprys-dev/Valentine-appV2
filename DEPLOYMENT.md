# Guide de Déploiement : Vercel + AlwaysData

## 1. Frontend — Vercel

Vercel est idéal pour déployer ton application React/Vite.

1.  **Préparation** : Assure-toi que ton code est poussé sur GitHub.
2.  **Création du projet** :
    *   Va sur [vercel.com](https://vercel.com) et connecte ton compte GitHub.
    *   Clique sur **Add New...** > **Project** > Importe ton dépôt `Valentine-appV2`.
3.  **Configuration du projet sur Vercel** :
    *   **Framework Preset** : Sélectionne `Vite`.
    *   **Root Directory** : Clique sur `Edit` et sélectionne le dossier `client`.
    *   Les commandes de build (`npm run build`) et dossier (`dist`) devraient se remplir automatiquement.
4.  **Variables d'Environnement** :
    *   Dans la section "Environment Variables", ajoute une variable :
        *   Nom : `VITE_API_URL`
        *   Valeur : L'URL de ton backend AlwaysData (ex: `https://mon-app-valentine.alwaysdata.net`).
        *   *Note : Tu devras peut-être revenir remplir cette valeur une fois le backend déployé. Pour le moment, tu peux mettre un placeholder ou laisser vide si ton code gère le cas.*
5.  **Déployer** : Clique sur **Deploy**.

## 2. Backend — AlwaysData

AlwaysData est un hébergeur français qui supporte Node.js et MySQL même en compte gratuit (100Mo).

### Étape A : Créer le compte et l'Environnement
1.  Crée ton compte sur [alwaysdata.com](https://www.alwaysdata.com).
2.  Dans l'interface d'administration (AlwaysData Administration), va dans la section **Web** > **Sites**.

### Étape B : Base de Données (MySQL)
1.  Va dans **Bases de données** > **MySQL**.
2.  Ajoute une nouvelle base de données :
    *   Nom de la base (ex: `valentine_db`).
    *   Crée un utilisateur et un mot de passe (note-les bien !).
    *   Donne les droits à cet utilisateur sur la base.
    *   Note le **Hôte** (souvent `mysql-toncompte.alwaysdata.net`).
3.  **Initialiser la base** :
    *   Tu peux utiliser **phpMyAdmin** (lien dans l'interface AlwaysData) pour importer ton fichier `server/schema.sql` ou exécuter les requêtes SQL manuellement pour créer les tables.

### Étape C : Configurer l'Application Node.js
1.  Retourne dans **Web** > **Sites**.
2.  Crée un nouveau site ou modifie le site par défaut :
    *   **Type** : `Node.js`.
    *   **Adresse** : Choisis ton sous-domaine (ex: `mon-app-valentine.alwaysdata.net`).
    *   **Répertoire de travail** : `/www/valentine-server` (par exemple).
    *   **Script de démarrage** : `server/index.js` (ou juste `index.js` si tu mets tout à la racine du dossier).
    *   **Version Node.js** : Une version récente (ex: 20.x ou 18.x).

### Étape D : Mettre les fichiers sur le serveur
Tu as plusieurs options pour envoyer ton code backend (dossier `server`) chez AlwaysData :
*   **Option 1 : Git (Recommandé)**
    *   Connecte-toi en SSH à ton compte AlwaysData (`ssh tonuser@ssh-tonuser.alwaysdata.net`).
    *   Clone ton repo dans le dossier `/www/` (ou un sous-dossier).
    *   `git clone https://github.com/exuprys-dev/Valentine-appV2.git valentine-server`
    *   Va dans le dossier server : `cd valentine-server/server`.
    *   Installe les dépendances : `npm install --production`.
*   **Option 2 : FTP**
    *   Utilise FileZilla avec les accès FTP fournis par AlwaysData.
    *   Copie le contenu de ton dossier `server` local vers un dossier sur le serveur (ex: `/www/valentine-server`).
    *   Tu devras quand même lancer `npm install` (via SSH ou l'interface si dispo).

### Étape E : Variables d'Environnement
Dans la configuration de ton **Site** sur AlwaysData (onglet **Variables d'environnement**), ajoute :
*   `DB_HOST` = (L'hôte MySQL noté à l'étape B)
*   `DB_USER` = (Ton user MySQL)
*   `DB_PASSWORD` = (Ton mdp MySQL)
*   `DB_NAME` = (Le nom de ta base)
*   `JWT_SECRET` = (Une phrase secrète complexe)
*   `ALLOWED_ORIGIN` = (L'URL de ton frontend Vercel, ex: `https://valentine-client.vercel.app`. **Important pour éviter les erreurs CORS**).

### Étape F : Vérification
1.  Redémarre le site dans l'interface AlwaysData si nécessaire.
2.  Vérifie les logs (dans `/admin/logs/sites/`) si ça ne marche pas.
3.  Une fois le backend OK (l'URL `https://ton-app.alwaysdata.net` répond "Welcome" ou similaire), retourne sur **Vercel** et mets à jour la variable `VITE_API_URL` avec cette URL, puis redéploie le frontend.
