import { test, expect } from '@playwright/test'

// Selectors match generate/page.tsx:
// RFC input: placeholder="RFC850101ABC"
// receiver_name: placeholder="Empresa SA de CV"
// description: placeholder="Venta de mercancía..."
// unit_price: placeholder="0.00"
// quantity: no placeholder (value="1")

test.describe('Generate Invoice Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/erp/cfdi/generate')
  })

  // ── Page load ─────────────────────────────────────────────────────────────────

  test('renders all form sections', async ({ page }) => {
    // Use heading role to disambiguate from the submit button with same text
    await expect(page.getByRole('heading', { name: 'Generar Factura CFDI' })).toBeVisible()
    await expect(page.getByText('Datos del receptor')).toBeVisible()
    await expect(page.getByText('Concepto')).toBeVisible()
    await expect(page.getByText('Configuración fiscal')).toBeVisible()
  })

  test('page heading is visible', async ({ page }) => {
    // generate/page.tsx is a Client Component — metadata export is not applied
    // Test heading content instead of <title>
    await expect(page.getByRole('heading', { name: 'Generar Factura CFDI' })).toBeVisible()
  })

  // ── Form fields ────────────────────────────────────────────────────────────────

  test('all input fields are present', async ({ page }) => {
    await expect(page.getByPlaceholder('RFC850101ABC')).toBeVisible()
    await expect(page.getByPlaceholder('Empresa SA de CV')).toBeVisible()
    await expect(page.getByPlaceholder(/Venta de mercancía/)).toBeVisible()
    await expect(page.getByPlaceholder('0.00')).toBeVisible()
  })

  test('payment form select has expected options', async ({ page }) => {
    const select = page.locator('select').first()
    await expect(select.locator('option', { hasText: 'Transferencia' })).toHaveCount(1)
    await expect(select.locator('option', { hasText: 'Efectivo' })).toHaveCount(1)
  })

  // ── Total preview ──────────────────────────────────────────────────────────────

  test('shows total when price and quantity filled', async ({ page }) => {
    await page.getByPlaceholder('0.00').fill('500')
    // Quantity defaults to 1, total = $500
    await expect(page.getByText('Total estimado')).toBeVisible()
    await expect(page.locator('text=$500.00').or(page.getByText('$500'))).toBeVisible()
  })

  test('total updates with quantity change', async ({ page }) => {
    await page.getByPlaceholder('0.00').fill('1000')
    // Change quantity to 3 → 3000
    const qtyInput = page.locator('input[type="number"]').nth(1)
    await qtyInput.fill('3')
    await expect(page.getByText('$3,000').or(page.getByText('$3000'))).toBeVisible()
  })

  // ── Validation ─────────────────────────────────────────────────────────────────

  test('required fields are enforced by the browser', async ({ page }) => {
    // Submit without filling required fields
    await page.getByRole('button', { name: /generar factura cfdi/i }).click()
    // Browser's native required validation fires — form does not submit
    // RFC input should still be empty and page URL unchanged
    await expect(page).toHaveURL(/\/erp\/cfdi\/generate/)
    await expect(page.getByPlaceholder('RFC850101ABC')).toBeEmpty()
  })

  // ── API mocking — success flow ─────────────────────────────────────────────────

  test('submits and redirects to usage on success', async ({ page }) => {
    await page.route('**/api/cfdi/generate', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, uuid: 'FAKE-UUID-1234' }),
      })
    )

    await page.getByPlaceholder('RFC850101ABC').fill('XAXX010101000')
    await page.getByPlaceholder('Empresa SA de CV').fill('Público en General')
    await page.getByPlaceholder(/Venta de mercancía/).fill('Venta de producto')
    await page.getByPlaceholder('0.00').fill('100')
    await page.getByRole('button', { name: /generar factura cfdi/i }).click()

    await expect(page).toHaveURL(/\/erp\/cfdi\/usage/, { timeout: 10_000 })
  })

  // ── API mocking — error handling ───────────────────────────────────────────────

  test('shows error message on API failure', async ({ page }) => {
    await page.route('**/api/cfdi/generate', route =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'RFC format invalid' }),
      })
    )

    await page.getByPlaceholder('RFC850101ABC').fill('BADRFC')
    await page.getByPlaceholder('Empresa SA de CV').fill('Empresa')
    await page.getByPlaceholder(/Venta de mercancía/).fill('Test')
    await page.getByPlaceholder('0.00').fill('50')
    await page.getByRole('button', { name: /generar factura cfdi/i }).click()

    await expect(page.getByText('RFC format invalid')).toBeVisible({ timeout: 8_000 })
    // Should stay on the generate page
    await expect(page).toHaveURL(/\/erp\/cfdi\/generate/)
  })

  test('shows spinner while submitting', async ({ page }) => {
    // Delay the response so we can catch the spinner
    await page.route('**/api/cfdi/generate', async route => {
      await new Promise(r => setTimeout(r, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.getByPlaceholder('RFC850101ABC').fill('XAXX010101000')
    await page.getByPlaceholder('Empresa SA de CV').fill('Test SA')
    await page.getByPlaceholder(/Venta de mercancía/).fill('Test')
    await page.getByPlaceholder('0.00').fill('50')
    await page.getByRole('button', { name: /generar factura cfdi/i }).click()

    await expect(page.getByText(/Timbrando con el SAT/i)).toBeVisible()
  })

  // ── Back navigation ────────────────────────────────────────────────────────────

  test('back link returns to usage page', async ({ page }) => {
    await page.getByRole('link', { name: /volver/i }).click()
    await expect(page).toHaveURL(/\/erp\/cfdi\/usage/)
  })
})
