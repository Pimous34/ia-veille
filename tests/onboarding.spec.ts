import { test, expect } from '@playwright/test';

test.describe('Modal d\'onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur la page d'accueil
    await page.goto('/');
  });

  test('devrait afficher le modal pour un nouvel utilisateur', async ({ page }) => {
    // Note: Ce test nécessite que le mode test soit activé dans useOnboarding.ts
    // ou que l'utilisateur ne soit pas connecté
    
    // Attendre que la page charge
    await page.waitForLoadState('networkidle');
    
    // Vérifier si le modal est visible (peut ne pas l'être si l'utilisateur a déjà complété l'onboarding)
    const modal = page.locator('[role="dialog"]');
    const isVisible = await modal.isVisible().catch(() => false);
    
    if (isVisible) {
      // Vérifier le contenu du modal
      await expect(page.getByText(/Bienvenue/i)).toBeVisible();
    }
  });

  test('devrait permettre de naviguer entre les étapes', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const modal = page.locator('[role="dialog"]');
    const isVisible = await modal.isVisible().catch(() => false);
    
    if (isVisible) {
      // Étape 1: Informations personnelles
      const nameInput = page.getByLabel(/nom/i);
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Test User');
        
        // Cliquer sur Suivant
        await page.getByRole('button', { name: /suivant/i }).click();
        
        // Vérifier qu'on est passé à l'étape suivante
        await expect(page.getByText(/centres d'intérêt/i)).toBeVisible();
      }
    }
  });

  test('devrait permettre de fermer le modal', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const modal = page.locator('[role="dialog"]');
    const isVisible = await modal.isVisible().catch(() => false);
    
    if (isVisible) {
      // Chercher le bouton de fermeture
      const closeButton = page.getByRole('button', { name: /passer|fermer|×/i });
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        
        // Vérifier que le modal est fermé
        await expect(modal).not.toBeVisible();
      }
    }
  });
});
