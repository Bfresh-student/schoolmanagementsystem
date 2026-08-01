# Frontend - PWA vanilla

## Structure

- **index.html** - Page principale
- **css/** - Feuilles de style
- **js/** - Scripts JavaScript
- **manifest.json** - Configuration PWA

## Tests rapides

- `npm run test:auth` : vérifie les flux d'authentification (`auth.js`) avec mocks.
- `npm run test:offline` : vérifie la file d'attente offline/sync (Dexie).
- `npm test` : exécute les deux suites ci-dessus.
