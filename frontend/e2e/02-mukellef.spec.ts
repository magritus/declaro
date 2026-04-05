/**
 * Mükellef CRUD tests.
 * These tests hit the real backend API via the Vite proxy (http://localhost:8001).
 * If the backend is not running, tests will fail with a network error.
 *
 * Tests are serial so that later tests can rely on data created by earlier ones.
 */
import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('Mükellef listesi', () => {
  test('mukellef listesi yüklenir', async ({ page }) => {
    await page.goto('/mukellef')

    // Page heading
    await expect(
      page.getByRole('heading', { name: 'Mükellefler' }),
    ).toBeVisible({ timeout: 10000 })

    // "Yeni Mükellef" action button
    await expect(
      page.getByRole('button', { name: 'Yeni Mükellef' }),
    ).toBeVisible({ timeout: 10000 })
  })

  test('yeni mükellef oluşturulur', async ({ page }) => {
    await page.goto('/mukellef')

    // Open modal
    await page.getByRole('button', { name: 'Yeni Mükellef' }).click()

    // Verify modal title
    await expect(page.getByRole('heading', { name: 'Yeni Mükellef' })).toBeVisible({
      timeout: 5000,
    })

    // Fill in ünvan
    await page.getByPlaceholder('Şirket ünvanı').fill('Test AŞ')

    // Fill in VKN (10 digits)
    await page.getByPlaceholder('10 haneli vergi kimlik numarası').fill('1234567890')

    // Submit
    await page.getByRole('button', { name: 'Kaydet' }).click()

    // Modal should close on success (backend must be running)
    // If backend is down, the test will timeout here.
    await expect(page.getByRole('heading', { name: 'Yeni Mükellef' })).not.toBeVisible({
      timeout: 10000,
    })

    // The new mükellef should appear in the list
    await expect(page.getByText('Test AŞ')).toBeVisible({ timeout: 10000 })
  })

  test('vkn 10 hane zorunluluğu', async ({ page }) => {
    await page.goto('/mukellef')

    // Open modal
    await page.getByRole('button', { name: 'Yeni Mükellef' }).click()

    // Fill ünvan
    await page.getByPlaceholder('Şirket ünvanı').fill('Hatalı Firma')

    // Fill VKN with only 3 digits (too short)
    await page.getByPlaceholder('10 haneli vergi kimlik numarası').fill('123')

    // Attempt submit
    await page.getByRole('button', { name: 'Kaydet' }).click()

    // Form should show validation error; modal should remain open
    await expect(
      page.getByText('VKN tam 10 haneli olmalıdır'),
    ).toBeVisible({ timeout: 5000 })

    // Modal should still be visible (form did not submit)
    await expect(page.getByRole('heading', { name: 'Yeni Mükellef' })).toBeVisible()

    // Close modal to clean up
    await page.getByRole('button', { name: 'İptal' }).click()
  })

  test('mükellef detay sayfası açılır', async ({ page }) => {
    await page.goto('/mukellef')

    // Wait for list to load
    await expect(
      page.getByRole('heading', { name: 'Mükellefler' }),
    ).toBeVisible({ timeout: 10000 })

    // Check if there are any mükellef rows; skip gracefully if list is empty
    // (e.g., if backend wasn't running during the create test above)
    const rowCount = await page.getByRole('row').count()
    if (rowCount <= 1) {
      // Only header row present — no data to navigate into
      test.skip()
      return
    }

    // Click the first data row (index 1 = first data row after header)
    await page.getByRole('row').nth(1).click()

    // Should navigate to /mukellef/:id
    await page.waitForURL(/\/mukellef\/\d+/, { timeout: 10000 })

    // Detay page should show "Dönemler" section
    await expect(
      page.getByRole('heading', { name: 'Dönemler' }),
    ).toBeVisible({ timeout: 10000 })
  })
})
