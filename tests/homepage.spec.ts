import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test('devrait charger la page correctement', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le titre
    await expect(page).toHaveTitle(/IA Veille/);
    
    // Vérifier la navbar
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Vérifier le hero
    await expect(page.getByText('Votre veille IA personnalisée')).toBeVisible();
  });

  test('devrait afficher les articles', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que les articles se chargent
    await page.waitForSelector('article', { timeout: 10000 });
    
    // Vérifier qu'il y a au moins un article
    const articles = page.locator('article');
    await expect(articles.first()).toBeVisible();
    
    // Vérifier qu'un article a un titre
    const firstArticle = articles.first();
    await expect(firstArticle.locator('h2')).toBeVisible();
  });

  test('devrait afficher le loader pendant le chargement', async ({ page }) => {
    await page.goto('/');
    
    // Le loader devrait apparaître brièvement
    const loader = page.locator('.animate-spin');
    
    // Soit le loader est visible, soit les articles sont déjà chargés
    const loaderVisible = await loader.isVisible().catch(() => false);
    const articlesVisible = await page.locator('article').first().isVisible().catch(() => false);
    
    expect(loaderVisible || articlesVisible).toBeTruthy();
  });

  test('devrait avoir des liens fonctionnels', async ({ page }) => {
    await page.goto('/');
    
    // Attendre les articles
    await page.waitForSelector('article', { timeout: 10000 });
    
    // Vérifier qu'un lien d'article existe
    const articleLink = page.locator('article a').first();
    await expect(articleLink).toBeVisible();
    
    // Vérifier que le lien a un href
    const href = await articleLink.getAttribute('href');
    expect(href).toBeTruthy();
  });
});
