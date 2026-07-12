import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-title')).toHaveText('Anna Gatdula');
});

test('blog index lists the published post', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('link', { name: 'Welcome' })).toBeVisible();
});

test('draft post is absent from the blog index', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByText('Draft Example Do Not Publish')).toHaveCount(0);
});

test('draft post URL is not generated (404)', async ({ page }) => {
  const res = await page.goto('/blog/draft-example');
  expect(res?.status()).toBe(404);
});

test('published post page renders its title', async ({ page }) => {
  await page.goto('/blog/welcome');
  await expect(page.getByRole('heading', { name: 'Welcome', level: 1 })).toBeVisible();
});
