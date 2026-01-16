# 🧪 Guide de Test - IA Veille

## ✅ Playwright Configuré !

Votre projet dispose maintenant d'une suite de tests end-to-end complète avec Playwright.

## 🚀 Démarrage Rapide

### 1. Installer les navigateurs (première fois uniquement)
```bash
npx playwright install
```

### 2. Lancer les tests en mode UI (recommandé pour débuter)
```bash
npm run test:ui
```

Cela ouvre une interface graphique où vous pouvez :
- ✅ Voir tous les tests
- ✅ Exécuter les tests un par un
- ✅ Voir le navigateur en action
- ✅ Inspecter chaque étape

### 3. Lancer tous les tests en mode headless
```bash
npm test
```

## 📊 Ce qui est Testé

### ✅ Page d'Accueil (`homepage.spec.ts`)
- Chargement correct de la page
- Affichage des articles depuis Supabase
- Loader pendant le chargement
- Liens fonctionnels vers les articles

### ✅ Onboarding (`onboarding.spec.ts`)
- Affichage du modal pour nouveaux utilisateurs
- Navigation entre les étapes du formulaire
- Fermeture du modal

### ✅ Responsive (`responsive.spec.ts`)
- Affichage mobile (375x667)
- Affichage tablette (768x1024)
- Affichage desktop (1920x1080)
- Screenshots automatiques

### ✅ Navigation (`navigation.spec.ts`)
- Navigation entre les pages
- Ouverture des articles dans un nouvel onglet
- Footer
- Dark mode (si activé)

## 🎯 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm test` | Exécute tous les tests |
| `npm run test:ui` | Mode UI interactif |
| `npm run test:headed` | Voir le navigateur pendant les tests |
| `npm run test:debug` | Mode debug avec pause |
| `npm run test:report` | Voir le rapport HTML |

## 🔍 Tester un Fichier Spécifique

```bash
# Tester uniquement la page d'accueil
npx playwright test homepage.spec.ts

# Tester uniquement le responsive
npx playwright test responsive.spec.ts

# Tester sur un navigateur spécifique
npx playwright test --project=chromium
npx playwright test --project=firefox
```

## 📸 Screenshots

Les screenshots sont automatiquement pris :
- ✅ En cas d'échec de test
- ✅ Dans `test-results/`
- ✅ Un screenshot complet de la page dans `responsive.spec.ts`

## 🐛 Dépannage

### Erreur "Executable doesn't exist"
```bash
npx playwright install
```

### Les tests échouent ?
1. Vérifiez que le serveur dev tourne : `npm run dev`
2. Vérifiez `.env.local` avec les clés Supabase
3. Vérifiez que des articles existent dans la base

### Timeout ?
Les tests attendent max 10 secondes pour les articles. Si votre connexion est lente, augmentez le timeout dans les tests.

## 📚 Prochaines Étapes

1. **Ajouter plus de tests** selon vos besoins
2. **Intégrer dans CI/CD** (GitHub Actions, GitLab CI, etc.)
3. **Tests de régression visuelle** avec Playwright
4. **Tests de performance** avec Lighthouse

## 🎓 Ressources

- [Documentation Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Exemples de tests](https://github.com/microsoft/playwright/tree/main/tests)

---

**Bon testing ! 🚀**
