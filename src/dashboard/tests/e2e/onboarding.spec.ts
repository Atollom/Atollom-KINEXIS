import { test, expect } from '@playwright/test'

// Selectors derived from the actual Step component implementations
// Inputs use placeholder text; buttons use exact visible text

test.describe('Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding')
  })

  // ── Smoke ────────────────────────────────────────────────────────────────────

  test('renders step 1 on load', async ({ page }) => {
    await expect(page.getByText('Información de la Empresa')).toBeVisible()
    await expect(page.getByText('KINEXIS Setup')).toBeVisible()
    // Progress indicator shows 5 steps
    await expect(page.locator('text=1/5, text=Paso 1').first().or(
      page.getByRole('heading', { name: 'Información de la Empresa' })
    )).toBeVisible()
  })

  // ── Step 1 validation ────────────────────────────────────────────────────────

  test('step 1 — blocks advance without required fields', async ({ page }) => {
    await page.getByRole('button', { name: /continuar/i }).click()
    await expect(page.getByText('Nombre requerido')).toBeVisible()
    await expect(page.getByText(/RFC requerido/i)).toBeVisible()
  })

  test('step 1 — rejects invalid RFC format', async ({ page }) => {
    await page.getByPlaceholder('Ej. Kap Tools S.A. de C.V.').fill('Mi Empresa')
    await page.getByPlaceholder('Ej. KAP120101AB1').fill('INVALID')
    await page.getByPlaceholder('Ej. +52 222 123 4567').fill('+52 222 123 4567')
    await page.getByPlaceholder('Calle, número, colonia, ciudad, estado, C.P.').fill('Calle 1, Puebla')
    await page.getByRole('button', { name: /continuar/i }).click()
    await expect(page.getByText(/formato inválido/i)).toBeVisible()
  })

  test('step 1 — advances with valid data', async ({ page }) => {
    await page.getByPlaceholder('Ej. Kap Tools S.A. de C.V.').fill('Kap Tools SA de CV')
    await page.getByPlaceholder('Ej. KAP120101AB1').fill('KAP120101AB1')
    await page.getByPlaceholder('Ej. +52 222 123 4567').fill('+52 222 123 4567')
    await page.getByPlaceholder('Calle, número, colonia, ciudad, estado, C.P.').fill('Av. Principal 100, Puebla')
    await page.getByRole('button', { name: /continuar/i }).click()
    // Step 2 heading — use exact heading to avoid sidebar nav collision
    await expect(page.getByRole('heading', { name: 'Plataformas E-commerce' })).toBeVisible()
  })

  // ── Step 2 ───────────────────────────────────────────────────────────────────

  test('step 2 — renders without crashing', async ({ page }) => {
    await _goToStep(page, 2)
    // Use the ML connect link as an unambiguous marker
    await expect(page.getByRole('link', { name: /Conectar con Mercado Libre/i })).toBeVisible()
  })

  test('step 2 — can advance without configuring integrations', async ({ page }) => {
    await _goToStep(page, 2)
    await page.getByRole('button', { name: /continuar/i }).click()
    // Step 3 heading
    await expect(page.getByRole('heading', { name: 'Mensajería' })).toBeVisible()
  })

  // ── Step 3 ───────────────────────────────────────────────────────────────────

  test('step 3 — renders messaging options', async ({ page }) => {
    await _goToStep(page, 3)
    // Use the exact span text inside the step content
    await expect(page.getByText('WhatsApp Business', { exact: true })).toBeVisible()
  })

  // ── Step 5 users ─────────────────────────────────────────────────────────────

  test('step 5 — blocks submit without users', async ({ page }) => {
    await _goToStep(page, 5)
    const submitBtn = page.getByRole('button', { name: /completar|lanzar/i })
    await expect(submitBtn).toBeDisabled()
  })

  test('step 5 — adds user and enables submit', async ({ page }) => {
    await _goToStep(page, 5)
    await page.getByPlaceholder('Juan García López').fill('Carlos Cortés')
    await page.getByPlaceholder('juan@miempresa.com').fill('carlos@kaptools.com')
    await page.getByRole('button', { name: /agregar/i }).click()
    // User appears in list
    await expect(page.getByText('carlos@kaptools.com')).toBeVisible()
    // Submit button enabled
    await expect(page.getByRole('button', { name: /completar|lanzar/i })).toBeEnabled()
  })

  test('step 5 — rejects duplicate email', async ({ page }) => {
    await _goToStep(page, 5)
    await page.getByPlaceholder('Juan García López').fill('Carlos Cortés')
    await page.getByPlaceholder('juan@miempresa.com').fill('dup@test.com')
    await page.getByRole('button', { name: /agregar/i }).click()
    // Try adding same email again
    await page.getByPlaceholder('juan@miempresa.com').fill('dup@test.com')
    await page.getByRole('button', { name: /agregar/i }).click()
    await expect(page.getByText(/ya agregado/i)).toBeVisible()
  })
})

// ── Helpers ────────────────────────────────────────────────────────────────────

async function _goToStep(page: import('@playwright/test').Page, step: number) {
  const VALID_COMPANY = {
    name: 'Kap Tools SA de CV',
    rfc: 'KAP120101AB1',
    phone: '+52 222 123 4567',
    address: 'Av. Principal 100, Puebla, México',
  }

  if (step >= 1) {
    await page.goto('/onboarding')
  }
  if (step >= 2) {
    await page.getByPlaceholder('Ej. Kap Tools S.A. de C.V.').fill(VALID_COMPANY.name)
    await page.getByPlaceholder('Ej. KAP120101AB1').fill(VALID_COMPANY.rfc)
    await page.getByPlaceholder('Ej. +52 222 123 4567').fill(VALID_COMPANY.phone)
    await page.getByPlaceholder('Calle, número, colonia, ciudad, estado, C.P.').fill(VALID_COMPANY.address)
    await page.getByRole('button', { name: /continuar/i }).click()
    await page.waitForSelector('h2:has-text("Plataformas E-commerce")')
  }
  if (step >= 3) {
    await page.getByRole('button', { name: /continuar/i }).click()
    await page.waitForSelector('h2:has-text("Mensajería")')
  }
  if (step >= 4) {
    await page.getByRole('button', { name: /continuar/i }).click()
    await page.waitForSelector('h2:has-text("Facturación")')
  }
  if (step >= 5) {
    await page.getByRole('button', { name: /continuar/i }).click()
    await page.waitForSelector('h2:has-text("Equipo y Roles")')
  }
}
