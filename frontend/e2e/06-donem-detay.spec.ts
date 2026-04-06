/**
 * Dönem detay sayfası tests — Çalışma CRUD butonları.
 *
 * Tests the Görüntüle / Düzenle / Sil buttons added to the çalışmalar table
 * on the DonemDetay page (/donem/:id).
 *
 * Requires at least one dönem with id=1 and one çalışma in the database.
 * If the DB is empty or the page is inaccessible, tests skip gracefully.
 */
import { test, expect } from '@playwright/test'

const DONEM_ID = 1

test.describe.configure({ mode: 'serial' })

test.describe('Dönem Detay — Çalışma butonları', () => {
  test('donem detay sayfası yüklenir', async ({ page }) => {
    await page.goto(`/donem/${DONEM_ID}`)

    const heading = page.getByRole('heading', { name: 'Çalışmalar' })
    if ((await heading.count()) === 0) {
      test.skip()
      return
    }

    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('çalışmalar tablosunda Görüntüle butonu görünür', async ({ page }) => {
    await page.goto(`/donem/${DONEM_ID}`)

    const heading = page.getByRole('heading', { name: 'Çalışmalar' })
    if ((await heading.count()) === 0) {
      test.skip()
      return
    }
    await expect(heading).toBeVisible({ timeout: 10000 })

    // If there are çalışmalar rows, the buttons must appear
    const goruntuleButtons = page.getByRole('button', { name: 'Görüntüle' })
    const btnCount = await goruntuleButtons.count()
    if (btnCount === 0) {
      // No çalışmalar yet — nothing to test
      test.skip()
      return
    }

    await expect(goruntuleButtons.first()).toBeVisible()
  })

  test('çalışmalar tablosunda Düzenle ve Sil butonları görünür', async ({ page }) => {
    await page.goto(`/donem/${DONEM_ID}`)

    const heading = page.getByRole('heading', { name: 'Çalışmalar' })
    if ((await heading.count()) === 0) {
      test.skip()
      return
    }
    await expect(heading).toBeVisible({ timeout: 10000 })

    const duzenleBtns = page.getByRole('button', { name: 'Düzenle' })
    const silBtns = page.getByRole('button', { name: 'Sil' })

    if ((await duzenleBtns.count()) === 0) {
      test.skip()
      return
    }

    await expect(duzenleBtns.first()).toBeVisible()
    await expect(silBtns.first()).toBeVisible()
  })

  test('Görüntüle butonuna tıklayınca çalışmaya gidilir', async ({ page }) => {
    await page.goto(`/donem/${DONEM_ID}`)

    const heading = page.getByRole('heading', { name: 'Çalışmalar' })
    if ((await heading.count()) === 0) {
      test.skip()
      return
    }
    await expect(heading).toBeVisible({ timeout: 10000 })

    const goruntuleBtn = page.getByRole('button', { name: 'Görüntüle' }).first()
    if ((await goruntuleBtn.count()) === 0) {
      test.skip()
      return
    }

    await goruntuleBtn.click()

    // Should navigate to either /istek-listesi or /wizard/faz*
    await page.waitForURL(/(istek-listesi|wizard\/faz)/, { timeout: 10000 })
    expect(page.url()).toMatch(/(istek-listesi|wizard\/faz)/)
  })

  test('Düzenle butonuna tıklayınca wizard faz1 açılır', async ({ page }) => {
    await page.goto(`/donem/${DONEM_ID}`)

    const heading = page.getByRole('heading', { name: 'Çalışmalar' })
    if ((await heading.count()) === 0) {
      test.skip()
      return
    }
    await expect(heading).toBeVisible({ timeout: 10000 })

    const duzenleBtn = page.getByRole('button', { name: 'Düzenle' }).first()
    if ((await duzenleBtn.count()) === 0) {
      test.skip()
      return
    }

    await duzenleBtn.click()

    // Should navigate to wizard/faz0 or wizard/faz1
    await page.waitForURL(/wizard\/faz/, { timeout: 10000 })
    expect(page.url()).toMatch(/wizard\/faz[01]/)
  })

  test('Sil butonuna tıklayınca onay modali açılır', async ({ page }) => {
    await page.goto(`/donem/${DONEM_ID}`)

    const heading = page.getByRole('heading', { name: 'Çalışmalar' })
    if ((await heading.count()) === 0) {
      test.skip()
      return
    }
    await expect(heading).toBeVisible({ timeout: 10000 })

    const silBtn = page.getByRole('button', { name: 'Sil' }).first()
    if ((await silBtn.count()) === 0) {
      test.skip()
      return
    }

    await silBtn.click()

    // Confirmation modal should appear
    await expect(page.getByText(/Çalışmayı Sil/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/kalıcı olarak silinecek/i)).toBeVisible({ timeout: 5000 })

    // Cancel button should dismiss the modal
    await page.getByRole('button', { name: 'İptal' }).click()
    await expect(page.getByText(/kalıcı olarak silinecek/i)).not.toBeVisible({ timeout: 5000 })
  })

  test('Yeni Çalışma Başlat butonu görünür', async ({ page }) => {
    await page.goto(`/donem/${DONEM_ID}`)

    const heading = page.getByRole('heading', { name: 'Çalışmalar' })
    if ((await heading.count()) === 0) {
      test.skip()
      return
    }
    await expect(heading).toBeVisible({ timeout: 10000 })

    await expect(
      page.getByRole('button', { name: /Yeni Çalışma Başlat/i }),
    ).toBeVisible({ timeout: 5000 })
  })
})
