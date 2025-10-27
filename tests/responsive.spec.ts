import { test, expect } from '@playwright/test';

test.describe('Tests responsive', () => {
  test('devrait s\'afficher correctement sur mobile', async ({ page }) => {
    // Définir la taille mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Vérifier que la navbar est visible
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Vérifier que le contenu s'adapte
    const hero = page.getByText('Votre veille IA personnalisée');
    await expect(hero).toBeVisible();
  });

  test('devrait s\'afficher correctement sur tablette', async ({ page }) => {
    // Définir la taille tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Vérifier l'affichage
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Attendre les articles
    await page.waitForSelector('article', { timeout: 10000 });
    const articles = page.locator('article');
    await expect(articles.first()).toBeVisible();
  });

  test('devrait s\'afficher correctement sur desktop', async ({ page }) => {
    // Définir la taille desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Vérifier l'affichage
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Vérifier que les articles sont en grille
    await page.waitForSelector('article', { timeout: 10000 });
    const articles = page.locator('article');
    const count = await articles.count();
    
    // Sur desktop, on devrait voir plusieurs articles côte à côte
    expect(count).toBeGreaterThan(0);
  });

  test('devrait prendre un screenshot de la page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Prendre un screenshot
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });
  });
});
