# ARTVELCHIV — site et application (accès privé)

Dépôt statique, sans étape de construction : chaque fichier se sert tel quel (GitHub Pages, Vercel, Netlify ou tout hébergement de fichiers).

## Contenu

| Chemin | Rôle |
| --- | --- |
| `index.html` | Site public (ordinateur et mobile). Le lien « Accès privé » (pied de page et menu mobile) ouvre `app/`. |
| `app/index.html` | Application complète en une seule page. Elle charge React depuis cdnjs et embarque le code de l'application ; aucun fichier de build n'est nécessaire. |
| `app/manifest.webmanifest`, `app/icon-*.png`, `app/apple-touch-icon.png` | Permettent d'ajouter l'application à l'écran d'accueil d'un iPhone ou d'un Android pendant la phase de test (icône verte, plein écran). |
| `assets/logo-wordmark-*.png` | Logotype détouré, version sombre (fond clair) et claire (fond vert). |
| `src/Artvelchiv.jsx` | Source du composant React. C'est ce fichier qui servira de base à la version App Store (Capacitor ou Expo). |

## Palette

Blanc, noir et gris pour la structure ; vert forêt (`#19382c`, `#1c4634`) pour les accents ; six pastels appliqués par blocs, sur le site comme dans l'application : rose poudré `#f2dfd9`, bleu poudre `#dbe7ee`, sauge `#dfe9df`, paille `#f4ebcf`, lilas `#e6e0ef`, sable `#f1ece3`. Ils sont déclarés en tête de la feuille de style du site (`:root`) et dans l'objet `UI` de `src/Artvelchiv.jsx`.

## Accès privé

L'application demande un code à l'ouverture. Le code est défini dans `src/Artvelchiv.jsx` (`DEFAULT_PIN`, valeur actuelle `arttest`, majuscules ou minuscules indifférentes). Pour le changer, modifier cette valeur, puis régénérer `app/index.html` (voir ci-dessous) ; à défaut, le code reste celui de la page fournie.

## Mise en ligne

1. Remplacer `index.html` à la racine du site.
2. Supprimer entièrement l'ancien dossier `app/` (anciens fichiers de build), puis déposer le nouveau dossier `app/`.
3. Déposer `assets/` et `src/`.
4. Conserver le fichier `CNAME` s'il existe (domaine www.artvelchiv.com).
5. Vider le cache du navigateur avant de tester.

## Régénérer `app/index.html` après une modification de `src/Artvelchiv.jsx`

```bash
npm install esbuild react@18 react-dom@18
cat > main.jsx <<'JS'
import { createRoot } from "react-dom/client";
import Artvelchiv from "./src/Artvelchiv.jsx";
createRoot(document.getElementById("root")).render(window.React.createElement(Artvelchiv, {}));
JS
npx esbuild main.jsx --bundle --minify --format=iife --jsx=transform \
  --jsx-factory=window.React.createElement --jsx-fragment=window.React.Fragment \
  --external:react --external:react-dom --external:react-dom/client --outfile=app-bundle.js
```

Coller ensuite le contenu de `app-bundle.js` dans la dernière balise `<script>` de `app/index.html`.

## Vers l'App Store

Le composant `src/Artvelchiv.jsx` ne dépend que de React. Pour la publication native, l'enrober dans un projet Capacitor (WebView, le plus rapide) ou le porter en React Native / Expo (rendu natif). L'écran de lancement vert, le code d'accès et les données de démonstration sont dans le composant lui-même.

## Reconnaissance d'une œuvre par photographie

Le bouton appareil photo de l'application envoie la photographie (réduite à 1 400 pixels, côté téléphone) à la fonction `api/recognize.js`, qui interroge deux services puis renvoie une fiche structurée :

- **Google Cloud Vision (web detection)** retrouve les pages où l'image, ou une image très proche, apparaît déjà (ventes passées, publications, collections), ainsi que les entités qu'internet associe à l'image et le texte lisible (signature, cachet).
- **Claude (Anthropic)** décrit l'œuvre : nature, technique, matériau, période probable, artiste ou école possible avec un degré de confiance, signature, dimensions estimées, état apparent, points de vigilance. Les indices trouvés par Vision lui sont transmis, avec consigne de ne rien affirmer sur l'authenticité ni l'attribution.

L'application ouvre alors un dossier pré-rempli ; chaque champ reste à confirmer par le professionnel, et le dossier conserve la fiche proposée et les occurrences trouvées.

### Mise en service (site hébergé sur Vercel)

1. Déposer le dossier `api/` et le fichier `vercel.json` dans le dépôt : Vercel déploie automatiquement `api/recognize.js` à l'adresse `/api/recognize`, sur le même domaine que le site. (Si un `vercel.json` existe déjà, y ajouter la clé `functions` de celui fourni.)
2. Dans Vercel, ouvrir le projet → Settings → Environment Variables, et déclarer pour « Production » :
   - `GOOGLE_VISION_API_KEY` : dans Google Cloud Console, créer un projet, activer l'API « Cloud Vision API », activer la facturation, puis créer une clé d'API (APIs & Services → Credentials → Create credentials → API key) restreinte à l'API Cloud Vision.
   - `ANTHROPIC_API_KEY` : sur console.anthropic.com, créer une clé d'API.
   - Facultatif : `APP_ACCESS_TOKEN` (par défaut `arttest`, doit rester identique au code d'accès de l'application), `ALLOWED_ORIGINS`, `ANTHROPIC_MODEL`.
3. Redéployer (Vercel → Deployments → Redeploy) pour que les variables soient prises en compte.
4. Tester : ouvrir l'application, toucher l'appareil photo, photographier une œuvre. En l'absence de clés, l'application affiche un message clair et permet de décrire l'œuvre à la main.

`repo/app/index.html` contient la ligne `window.ARTVELCHIV_API_URL = ""` : le service est appelé sur le même domaine. Pour héberger la fonction ailleurs, indiquer son adresse dans cette variable.

### Confidentialité et coût

Les photographies transitent par Google Cloud et Anthropic pour l'analyse ; selon les conditions de ces services, elles ne servent pas à l'entraînement de leurs modèles et ne sont pas publiées, ce qui doit être vérifié dans les conditions en vigueur et repris dans les conditions d'utilisation d'ARTVELCHIV, avec le consentement du professionnel avant l'envoi. Le coût est de l'ordre de quelques millièmes d'euro par photographie ; les deux services offrent un quota gratuit mensuel.
