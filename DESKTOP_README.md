Electron Desktop build (remote web)
=================================

But : cette application Next.js fonctionne principalement via des APIs distantes (OpenAI, Pinecone, etc.). Nous avons choisi d'empaqueter une version desktop légère qui charge votre application web hébergée (ou `http://localhost:3000` en dev).

Commandes utiles
-----------------

- Installer les dépendances nécessaires pour Electron (dev deps) :

```bash
npm install --save-dev electron electron-builder electron-is-dev cross-env
```

- En développement (lancer Next + Electron) :

Terminal 1 (Next dev):
```bash
npm run dev
```

Terminal 2 (Electron):
```bash
npm run electron:dev
```

- Pour lancer l'app pointant vers l'URL déployée :

```bash
ELECTRON_START_URL=https://app.votre-domaine.com npm run electron:prod
```

- Pour créer un build distribuable (config `electron-builder` basique fournie) :

```bash
npm run build
npm run dist:desktop
```

Sauvegarde de fichiers locaux
-----------------------------

Le binaire desktop expose une API sécurisée `window.electron.saveFile(base64, defaultName)` (via `preload.js`). Dans le renderer, si `window.electron` existe, la génération de PDF utilisera cette API pour ouvrir la boîte de dialogue "Enregistrer sous" et écrire directement le fichier sur le disque. Sinon, le comportement navigateur par défaut (téléchargement) est conservé.

Sécurité
--------

Icônes de l'application
-----------------------

- `nodeIntegration` est désactivé et `contextIsolation` est activé.
- `preload.js` expose uniquement `platform`, `versions` et `saveFile`.

Remarques
--------

- Auth (Clerk) : si vous chargez l'URL distante, Clerk fonctionne sans configuration supplémentaire.
- Offline : inutile pour cette application (modèles AI cloud). Le mode choisi est donc "remote web + Electron shell".

