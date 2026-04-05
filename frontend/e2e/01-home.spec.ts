import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('home page loads and shows navigation', async ({ page }) => {
    await page.goto('/')

    // The Declaro brand name appears in the header
    await expect(page.getByText('Declaro').first()).toBeVisible({ timeout: 10000 })

    // Navigation / CTA button to Mükellefler section
    await expect(page.getByText('Mükellefler').first()).toBeVisible({ timeout: 10000 })
  })

  test('home page shows product description', async ({ page }) => {
    await page.goto('/')

    // Subtitle text confirming the product context
    await expect(
      page.getByText('Kurumlar Vergisi Yardımcısı'),
    ).toBeVisible({ timeout: 10000 })
  })

  test('clicking Mükellefler navigates to /mukellef', async ({ page }) => {
    await page.goto('/')

    // Click the prominent CTA button
    await page.getByRole('button', { name: 'Mükellefler' }).click()

    await page.waitForURL('/mukellef', { timeout: 10000 })
    await expect(page).toHaveURL('/mukellef')
  })
})
