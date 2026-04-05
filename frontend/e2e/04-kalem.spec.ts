/**
 * Kalem sayfası tests.
 *
 * These tests navigate to /calisma/1/kalem/egitim_rehabilitasyon_5_1_i.
 * They require at least one çalışma with id=1 to exist in the database AND
 * the kalem schema for 'egitim_rehabilitasyon_5_1_i' to be available from
 * the backend API.
 *
 * All tests are skipped by default until the DB is seeded:
 *   test.skip(true, 'DB seed gerekli')
 *
 * Remove the skip line once the DB is seeded with at least one calisma.
 */
import { test, expect } from '@playwright/test'

const CALISMA_ID = 1
const IC_KOD = 'egitim_rehabilitasyon_5_1_i'
const BASE_URL = `/calisma/${CALISMA_ID}/kalem/${IC_KOD}`

test.describe('Kalem sayfası', () => {
  test.skip(true, 'DB seed gerekli — en az bir çalışma (id=1) ve kalem şeması gereklidir')

  test('kalem sayfası sekmeler görünür', async ({ page }) => {
    await page.goto(BASE_URL)

    // Wait for tabs to render (the page may show a loading state first)
    await expect(page.getByRole('tab', { name: 'Veri Girişi' })).toBeVisible({
      timeout: 15000,
    })

    // All 5 tabs should be present
    await expect(page.getByRole('tab', { name: 'Veri Girişi' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Hesaplamalar' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'K-Checklist' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Belgeler' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Muhasebe Kayıtları' })).toBeVisible()
  })

  test('veri girişi formu render edilir', async ({ page }) => {
    await page.goto(BASE_URL)

    // Ensure "Veri Girişi" tab is active (it should be by default)
    const veriTab = page.getByRole('tab', { name: 'Veri Girişi' })
    await expect(veriTab).toBeVisible({ timeout: 15000 })
    await veriTab.click()

    // At least one form field should be visible
    const formFields = page.locator('input, textarea, select').filter({ visible: true })
    await expect(formFields.first()).toBeVisible({ timeout: 10000 })
  })

  test('excel indir butonu var', async ({ page }) => {
    await page.goto(BASE_URL)

    // "Excel İndir" button should be present on the kalem page
    await expect(
      page.getByRole('button', { name: 'Excel İndir' }),
    ).toBeVisible({ timeout: 15000 })
  })
})
