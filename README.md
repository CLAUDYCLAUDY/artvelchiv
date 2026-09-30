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

## Accès privé

L'application demande un code à l'ouverture. Le code est défini dans `src/Artvelchiv.jsx` (`DEFAULT_PIN`, valeur actuelle `ARTVELCHIV`). Pour le changer, modifier cette valeur, puis régénérer `app/index.html` (voir ci-dessous) ; à défaut, le code reste celui de la page fournie.

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
