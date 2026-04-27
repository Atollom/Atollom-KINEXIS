import { test, expect } from '@playwright/test'

test.describe('Dashboard Navigation', () => {
  test('dashboard page loads', async ({ page }) => {
    const resp = await page.goto('/dashboard')
    expect(resp?.status()).toBeLessThan(500)
  })

  test('ERP / CFDI usage page loads', async ({ page }) => {
    const resp = await page.goto('/erp/cfdi/usage')
    expect(resp?.status()).toBeLessThan(500)
    // Disambiguate: page h1 contains the full phrase
    await expect(page.getByRole('heading', { name: 'Uso de Timbres CFDI' })).toBeVisible({ timeout: 10_000 })
  })

  test('ERP / CFDI generate page loads', async ({ page }) => {
    const resp = await page.goto('/erp/cfdi/generate')
    expect(resp?.status()).toBeLessThan(500)
    // Check the page heading (h1) specifically
    await expect(page.getByRole('heading', { name: 'Generar Factura CFDI' })).toBeVisible({ timeout: 10_000 })
  })

  test('onboarding page loads', async ({ page }) => {
    const resp = await page.goto('/onboarding')
    expect(resp?.status()).toBeLessThan(500)
    await expect(page.getByText('KINEXIS Setup')).toBeVisible({ timeout: 10_000 })
  })

  test('CFDI usage page — usage card stats visible', async ({ page }) => {
    await page.goto('/erp/cfdi/usage')
    await expect(page.getByText('Usados')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Límite')).toBeVisible()
    await expect(page.getByText('Disponibles')).toBeVisible()
  })

  test('CFDI usage page — invoice table header visible', async ({ page }) => {
    await page.goto('/erp/cfdi/usage')
    await expect(page.getByText('Facturas Recientes')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('columnheader', { name: 'Folio' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })

  test('CFDI usage page — generate invoice button links to generate', async ({ page }) => {
    await page.goto('/erp/cfdi/usage')
    const link = page.getByRole('link', { name: /generar factura/i })
    await expect(link).toBeVisible({ timeout: 10_000 })
    await link.click()
    await expect(page).toHaveURL(/\/erp\/cfdi\/generate/)
  })

  test('breadcrumb navigation back from generate', async ({ page }) => {
    await page.goto('/erp/cfdi/generate')
    const backLink = page.getByRole('link', { name: /volver/i })
    await expect(backLink).toBeVisible({ timeout: 10_000 })
    await backLink.click()
    await expect(page).toHaveURL(/\/erp\/cfdi\/usage/)
  })
})
