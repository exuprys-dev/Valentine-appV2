# Guide de Déploiement : Vercel (Front) + Render (Back) - GRATUIT

## ✅ Frontend — Vercel (Déjà fait)

Ton frontend est déjà sur Vercel. Tu devras juste mettre à jour la variable `VITE_API_URL` une fois le backend déployé.

---

## 🚀 Backend — Render.com (GRATUIT)

### Étape 1 : Créer un compte Render
1. Va sur [render.com](https://render.com)
2. Inscris-toi avec ton compte GitHub

### Étape 2 : Créer la Base de Données MySQL
1. Dans le dashboard Render, clique sur **New +** → **MySQL**
2. Remplis :
   - **Name** : `valentine-db`
   - **Database** : `valentine_db`
   - **User** : `valentine_user`
   - **Region** : Frankfurt (le plus proche de la France)
   - **Plan** : **Free** (gratuit)
3. Clique sur **Create Database**
4. ⏳ Attends quelques minutes que la DB soit créée
5. 📝 **IMPORTANT** : Note les informations de connexion :
   - Clique sur la DB créée
   - Tu verras : **Internal Database URL** (commence par `mysql://...`)
   - **Copie cette URL** (on en aura besoin)

### Étape 3 : Initialiser la Base de Données
1. Dans la page de ta DB sur Render, clique sur **Connect** (en haut à droite)
2. Copie la commande de connexion (elle ressemble à ça) :
   ```bash
   mysql -h dpg-xxxxx.frankfurt-postgres.render.com -u valentine_user -p valentine_db
   ```
3. Sur ton ordinateur, ouvre un terminal et colle cette commande
4. Entre le mot de passe quand demandé
5. Une fois connecté, copie-colle le contenu de `server/schema.sql` pour créer les tables
6. Tape `exit` pour quitter

**Alternative si tu n'as pas MySQL en local** :
- Tu peux utiliser un client MySQL en ligne comme **phpMyAdmin** ou **MySQL Workbench**
- Ou attendre que le serveur démarre et il créera les tables automatiquement si tu ajoutes un script d'initialisation

### Étape 4 : Déployer le Backend
1. Dans le dashboard Render, clique sur **New +** → **Web Service**
2. Connecte ton dépôt GitHub `Valentine-appV2`
3. Configure :
   - **Name** : `valentine-api` (ou ce que tu veux)
   - **Region** : Frankfurt
   - **Branch** : `main` (ou `master`)
   - **Root Directory** : `server`
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : **Free**

### Étape 5 : Variables d'Environnement
Dans la section **Environment**, ajoute ces variables :

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (Colle l'Internal Database URL de l'étape 2) |
| `JWT_SECRET` | `ton_secret_super_securise_123` (change-le !) |
| `ALLOWED_ORIGIN` | `https://ton-app.vercel.app` (l'URL de ton front Vercel) |
| `NODE_ENV` | `production` |

4. Clique sur **Create Web Service**

### Étape 6 : Vérification
1. ⏳ Attends que le déploiement se termine (2-3 minutes)
2. Render te donnera une URL comme : `https://valentine-api.onrender.com`
3. Teste dans ton navigateur : `https://valentine-api.onrender.com`
   - Tu devrais voir : "Valentine API is running"

### Étape 7 : Connecter le Frontend
1. Retourne sur **Vercel**
2. Va dans ton projet → **Settings** → **Environment Variables**
3. Modifie `VITE_API_URL` :
   - Valeur : `https://valentine-api.onrender.com`
4. Redéploie le frontend (Vercel → Deployments → Redeploy)

---

## 🎉 C'est tout !

Ton app est maintenant en ligne :
- **Frontend** : https://ton-app.vercel.app
- **Backend** : https://valentine-api.onrender.com

---

## ⚠️ Limitations du plan gratuit Render

- Le service **s'endort après 15 minutes d'inactivité**
- Au premier accès après sommeil, il faut **~30 secondes** pour redémarrer
- **750 heures/mois** gratuites (largement suffisant)

**Solution** : Si tu veux éviter le sommeil, tu peux :
- Utiliser un service comme [UptimeRobot](https://uptimerobot.com) (gratuit) pour ping ton API toutes les 5 minutes
- Ou passer au plan payant Render ($7/mois)

---

## 🆘 Problèmes courants

### Erreur CORS
- Vérifie que `ALLOWED_ORIGIN` sur Render = URL exacte de Vercel
- Vérifie que `VITE_API_URL` sur Vercel = URL exacte de Render

### La DB ne se connecte pas
- Vérifie que `DATABASE_URL` est bien copié (avec le mot de passe)
- Vérifie que les tables sont créées (étape 3)

### Le backend ne démarre pas
- Regarde les logs sur Render (onglet "Logs")
- Vérifie que toutes les variables d'environnement sont bien définies
