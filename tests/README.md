# 🧪 Tests Playwright - IA Veille

## 📋 Tests Disponibles

### 1. **homepage.spec.ts** - Page d'accueil
- ✅ Chargement de la page
- ✅ Affichage des articles depuis Supabase
- ✅ Loader pendant le chargement
- ✅ Liens fonctionnels

### 2. **onboarding.spec.ts** - Modal d'onboarding
- ✅ Affichage du modal pour nouveaux utilisateurs
- ✅ Navigation entre les étapes
- ✅ Fermeture du modal

### 3. **responsive.spec.ts** - Tests responsive
- ✅ Affichage mobile (375x667)
- ✅ Affichage tablette (768x1024)
- ✅ Affichage desktop (1920x1080)
- ✅ Screenshots automatiques

### 4. **navigation.spec.ts** - Navigation
- ✅ Navigation vers la page articles
- ✅ Ouverture des articles externes
- ✅ Footer
- ✅ Dark mode (si présent)

## 🚀 Commandes

### Exécuter tous les tests
```bash
npm test
```

### Mode UI interactif (recommandé)
```bash
npm run test:ui
```

### Mode headed (voir le navigateur)
```bash
npm run test:headed
```

### Mode debug
```bash
npm run test:debug
```

### Voir le rapport HTML
```bash
npm run test:report
```

### Exécuter un test spécifique
```bash
npx playwright test homepage.spec.ts
```

### Exécuter sur un navigateur spécifique
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 📊 Navigateurs Testés

- ✅ **Chromium** (Chrome, Edge)
- ✅ **Firefox**
- ✅ **WebKit** (Safari)
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)

## 🎯 Bonnes Pratiques

1. **Toujours exécuter les tests avant un commit**
   ```bash
   npm test
   ```

2. **Utiliser le mode UI pour déboguer**
   ```bash
   npm run test:ui
   ```

3. **Vérifier le responsive**
   ```bash
   npx playwright test responsive.spec.ts
   ```

4. **Prendre des screenshots**
   - Les screenshots sont automatiquement pris en cas d'échec
   - Dossier : `test-results/`

## 🔧 Configuration

La configuration se trouve dans `playwright.config.ts` :
- **baseURL** : http://localhost:3000
- **Retries** : 2 en CI, 0 en local
- **Screenshots** : Uniquement en cas d'échec
- **Traces** : Uniquement au premier retry

## 📝 Ajouter un Nouveau Test

1. Créer un fichier dans `tests/` : `mon-test.spec.ts`
2. Importer Playwright :
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Écrire vos tests :
   ```typescript
   test('mon test', async ({ page }) => {
     await page.goto('/');
     await expect(page.getByText('Hello')).toBeVisible();
   });
   ```

## 🐛 Dépannage

### Les tests échouent ?
1. Vérifiez que le serveur dev tourne : `npm run dev`
2. Vérifiez que Supabase est configuré (`.env.local`)
3. Installez les navigateurs : `npx playwright install`

### Timeout ?
- Augmentez le timeout dans `playwright.config.ts`
- Ou dans un test spécifique :
  ```typescript
  test('mon test', async ({ page }) => {
    test.setTimeout(60000); // 60 secondes
  });
  ```

## 📚 Documentation

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
