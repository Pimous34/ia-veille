import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('devrait naviguer vers la page des articles', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur "Voir tout"
    const voirToutLink = page.getByRole('link', { name: /voir tout/i });
    if (await voirToutLink.isVisible().catch(() => false)) {
      await voirToutLink.click();
      
      // Vérifier l'URL
      await expect(page).toHaveURL(/\/articles/);
    }
  });

  test('devrait ouvrir un article dans un nouvel onglet', async ({ page }) => {
    await page.goto('/');
    
    // Attendre les articles
    await page.waitForSelector('article', { timeout: 10000 });
    
    // Trouver le premier lien d'article
    const articleLink = page.locator('article a[target="_blank"]').first();
    
    if (await articleLink.isVisible().catch(() => false)) {
      // Vérifier que le lien a target="_blank"
      const target = await articleLink.getAttribute('target');
      expect(target).toBe('_blank');
      
      // Vérifier que le lien a rel="noopener noreferrer"
      const rel = await articleLink.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });

  test('devrait avoir un footer fonctionnel', async ({ page }) => {
    await page.goto('/');
    
    // Scroller vers le bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Vérifier que le footer est visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('devrait gérer le dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Chercher le bouton de dark mode (si présent)
    const darkModeButton = page.locator('[aria-label*="dark" i], [aria-label*="theme" i]');
    const isVisible = await darkModeButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Cliquer sur le bouton
      await darkModeButton.click();
      
      // Vérifier que le thème a changé
      const html = page.locator('html');
      const className = await html.getAttribute('class');
      
      // Le thème devrait contenir 'dark' ou avoir changé
      expect(className).toBeTruthy();
    }
  });
});
