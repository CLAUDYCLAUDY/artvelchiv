# ARTVELCHIV — site + démonstrateur (un seul dépôt, un seul projet Vercel)

- `/`      → le site (index.html, images dans /public/assets)
- `/app/`  → le démonstrateur React, protégé par un code d'accès

## Mise en ligne (GitHub → Vercel)
1. Créer un dépôt GitHub privé `artvelchiv`, y pousser ce dossier :
       git init && git add . && git commit -m "ARTVELCHIV preview" && git branch -M main
       git remote add origin git@github.com:VOTRE_COMPTE/artvelchiv.git && git push -u origin main
2. Sur vercel.com : Add New → Project → importer `artvelchiv`. Framework détecté : Vite. Ne rien changer.
3. Onglet Environment Variables : ajouter `VITE_DEMO_PIN` = le code d'accès souhaité (Production + Preview).
4. Deploy. Adresses : `https://artvelchiv.vercel.app` (site) et `https://artvelchiv.vercel.app/app/` (démonstrateur).
5. Domaine : Settings → Domains → ajouter par ex. `preview.artvelchiv.com`.

Chaque `git push` sur `main` redéploie automatiquement. Pour changer le code d'accès : modifier la variable dans Vercel, puis Redeploy.

## En local
    npm install
    npm run dev        → http://localhost:5173/ (site) et /app/ (démonstrateur)
    npm run build      → dossier dist/

## Protection renforcée (facultatif)
Vercel → Settings → Deployment Protection (offre Pro) : mot de passe côté serveur sur tout le déploiement.
Ou Cloudflare Access devant le domaine (gratuit jusqu'à 50 utilisateurs).

Démonstrateur : données fictives ; le Référentiel ARTVELCHIV est validé à date par le cabinet.
