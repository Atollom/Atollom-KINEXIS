import { test, expect } from '@playwright/test'

test.describe('CFDI Usage Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/erp/cfdi/usage')
    await page.waitForSelector('[data-testid="usage-progress-bar"]', { timeout: 10_000 })
  })

  // ── UsageCard ─────────────────────────────────────────────────────────────────

  test('displays usage card with all stats', async ({ page }) => {
    // Use exact heading to avoid matching the page h1 "Uso de Timbres CFDI"
    await expect(page.getByRole('heading', { name: 'Timbres CFDI', exact: true })).toBeVisible()
    await expect(page.getByText('Usados')).toBeVisible()
    await expect(page.getByText('Límite')).toBeVisible()
    await expect(page.getByText('Disponibles')).toBeVisible()
    await expect(page.getByText('Progreso del mes')).toBeVisible()
  })

  test('progress bar is rendered', async ({ page }) => {
    await expect(page.getByTestId('usage-progress-bar')).toBeVisible()
  })

  test('shows normal status by default (mock data at 25.4%)', async ({ page }) => {
    await expect(page.getByText('Normal')).toBeVisible()
    await expect(page.getByText(/Has usado el/)).not.toBeVisible()
  })

  test('stat numbers are rendered', async ({ page }) => {
    // Default mock: used=127, limit=500, remaining=373
    await expect(page.getByText('127')).toBeVisible()
    // Use exact match to avoid collision with "$8,500.00" in invoice table
    await expect(page.getByText('500', { exact: true })).toBeVisible()
    await expect(page.getByText('373')).toBeVisible()
  })

  // ── Status alerts via API mocking ─────────────────────────────────────────────

  test('shows warning banner when usage >80%', async ({ page }) => {
    await page.route('**/api/cfdi/usage**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          limit: 500, used: 425, remaining: 75, percentage: 85, status: 'warning',
        }),
      })
    )
    await page.goto('/erp/cfdi/usage')
    await expect(page.getByText(/Has usado el 85% de tu cuota/i)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Atención')).toBeVisible()
  })

  test('shows critical banner when usage >95%', async ({ page }) => {
    await page.route('**/api/cfdi/usage**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          limit: 500, used: 490, remaining: 10, percentage: 98, status: 'critical',
        }),
      })
    )
    await page.goto('/erp/cfdi/usage')
    await expect(page.getByText(/Cuota casi agotada/i)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Crítico')).toBeVisible()
  })

  // ── InvoiceHistoryTable ────────────────────────────────────────────────────────

  test('displays invoice history table headers', async ({ page }) => {
    await expect(page.getByText('Facturas Recientes')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Folio' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Cliente' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'RFC' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Fecha' })).toBeVisible()
  })

  test('shows mock invoice rows', async ({ page }) => {
    await expect(page.getByText('F-2026-042')).toBeVisible()
    await expect(page.getByText('Ferretería Central SA de CV')).toBeVisible()
    await expect(page.getByText('Válida').first()).toBeVisible()
    await expect(page.getByText('Cancelada')).toBeVisible()
  })

  test('shows valid badge styled with accent color', async ({ page }) => {
    const validBadge = page.locator('span', { hasText: 'Válida' }).first()
    await expect(validBadge).toBeVisible()
    await expect(validBadge).toHaveClass(/CCFF00/)
  })

  test('shows cancelled badge styled in red', async ({ page }) => {
    const cancelledBadge = page.locator('span', { hasText: 'Cancelada' })
    await expect(cancelledBadge).toBeVisible()
    await expect(cancelledBadge).toHaveClass(/red/)
  })

  // ── Generate button ────────────────────────────────────────────────────────────

  test('generate invoice button is enabled when quota available', async ({ page }) => {
    const btn = page.getByRole('link', { name: /generar factura/i })
    await expect(btn).toBeVisible()
    await expect(btn).toBeEnabled()
  })

  test('generate invoice button disabled when quota exhausted', async ({ page }) => {
    await page.route('**/api/cfdi/usage**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          limit: 500, used: 500, remaining: 0, percentage: 100, status: 'critical',
        }),
      })
    )
    await page.goto('/erp/cfdi/usage')
    const disabledBtn = page.getByRole('button', { name: /generar factura/i })
    await expect(disabledBtn).toBeDisabled({ timeout: 8_000 })
  })

  // ── Page metadata ─────────────────────────────────────────────────────────────

  test('page has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Uso de Timbres CFDI/)
  })
})
