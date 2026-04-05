/**
 * Mali Kâr Özeti sayfası tests.
 *
 * These tests navigate to /calisma/1/ozet.
 * They require at least one çalışma with id=1 to exist in the database.
 *
 * All tests are skipped by default until the DB is seeded:
 *   test.skip(true, 'DB seed gerekli')
 *
 * Remove the skip line once the DB is seeded with at least one calisma.
 */
import { test, expect } from '@playwright/test'

const CALISMA_ID = 1
const OZET_URL = `/calisma/${CALISMA_ID}/ozet`

test.describe('Mali Kâr Özeti sayfası', () => {
  test.skip(true, 'DB seed gerekli — en az bir çalışma (id=1) gereklidir')

  test('mali kar ozeti sayfası yüklenir', async ({ page }) => {
    await page.goto(OZET_URL)

    // Page heading
    await expect(
      page.getByText('Mali Kâr Özeti'),
    ).toBeVisible({ timeout: 15000 })
  })

  test('hesapla butonu görünür', async ({ page }) => {
    await page.goto(OZET_URL)

    // "Hesapla" or "Pipeline Hesaplamasını Başlat" button
    await expect(
      page.getByRole('button', { name: /Hesapla/i }),
    ).toBeVisible({ timeout: 15000 })
  })

  test('ozet excel indir butonu var', async ({ page }) => {
    await page.goto(OZET_URL)

    // "Özet Excel İndir" button
    await expect(
      page.getByRole('button', { name: 'Özet Excel İndir' }),
    ).toBeVisible({ timeout: 15000 })
  })
})
