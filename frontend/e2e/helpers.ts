import type { Page, Locator } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Creates a new mükellef via the UI on the /mukellef page.
 * Assumes the page is already at /mukellef.
 * Returns the table row locator for the newly created mükellef.
 */
export async function createMukellef(
  page: Page,
  unvan: string,
  vkn: string,
): Promise<Locator> {
  // Open the create form
  await page.getByRole('button', { name: 'Yeni Mükellef' }).click()

  // Fill in the form fields
  await page.getByPlaceholder('Şirket ünvanı').fill(unvan)
  await page.getByPlaceholder('10 haneli vergi kimlik numarası').fill(vkn)

  // Submit
  await page.getByRole('button', { name: 'Kaydet' }).click()

  // Wait for the modal to close and the row to appear
  await expect(page.getByRole('button', { name: 'Kaydet' })).not.toBeVisible({
    timeout: 10000,
  })

  // Return the row containing the new mükellef
  return page.getByRole('row').filter({ hasText: unvan })
}

/**
 * Creates a new dönem via the UI on the MukellefDetay page.
 * Assumes the page is already at /mukellef/:id.
 * @param yil  - Year as string (e.g. "2024")
 * @param ceyrek - Dönem type value: 'Q1-GV' | 'Q2-GV' | 'Q3-GV' | 'YILLIK'
 */
export async function createDonem(
  page: Page,
  yil: string,
  ceyrek: 'Q1-GV' | 'Q2-GV' | 'Q3-GV' | 'YILLIK',
): Promise<void> {
  await page.getByRole('button', { name: 'Yeni Dönem' }).click()

  // Fill year
  const yilInput = page.getByLabel('Yıl')
  await yilInput.fill('')
  await yilInput.fill(yil)

  // Select dönem type
  await page.getByLabel('Dönem Türü').selectOption(ceyrek)

  // Submit
  await page.getByRole('button', { name: 'Kaydet' }).click()

  // Wait for modal to close
  await expect(page.getByRole('button', { name: 'Kaydet' })).not.toBeVisible({
    timeout: 10000,
  })
}

/**
 * Creates a new çalışma on the DonemDetay page.
 * Assumes the page is already at /donem/:id.
 */
export async function createCalisma(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Yeni Çalışma Başlat' }).click()
  // Wait for navigation to faz0 wizard
  await page.waitForURL(/\/wizard\/faz0/, { timeout: 10000 })
}

/**
 * Fills and submits the Faz0 dönem açılış form.
 * Assumes the page is already at /calisma/:id/wizard/faz0.
 */
export async function fillWizardFaz0(
  page: Page,
  values: {
    ticariKar: string
    kkeg?: string
    finansmanFonu?: string
  },
): Promise<void> {
  // Ticari bilanço kârı / zararı
  const ticariInput = page.getByLabel(/Ticari bilanço kârı/i)
  await ticariInput.fill(values.ticariKar)

  // KKEG (optional)
  if (values.kkeg !== undefined) {
    const kkegInput = page.getByLabel(/KKEG toplamı/i)
    await kkegInput.fill(values.kkeg)
  }

  // Finansman fonu (optional)
  if (values.finansmanFonu !== undefined) {
    const finansmanInput = page.getByLabel(/Finansman fonu/i)
    await finansmanInput.fill(values.finansmanFonu)
  }

  // Submit
  await page.getByRole('button', { name: /İleri|Devam|Kaydet/i }).click()

  // Wait for navigation to faz1
  await page.waitForURL(/\/wizard\/faz1/, { timeout: 10000 })
}
