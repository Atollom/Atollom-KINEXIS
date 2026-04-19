const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'https://dashboard.atollom.com';
const EMAIL = 'admin@orthocardio.com';
const PASSWORD = 'Admin2026';
const OUT_DIR = path.resolve(__dirname, '../../src/dashboard/public/screenshots');

const SHOTS = [
  { name: 'hero-dashboard',         path: '/dashboard',  mode: 'dark',  w: 1920, h: 1080, wait: 3000 },
  { name: 'ecommerce-unified',      path: '/ecommerce',  mode: 'dark',  w: 1920, h: 1080, wait: 2500 },
  { name: 'crm-dashboard',          path: '/crm',        mode: 'dark',  w: 1920, h: 1080, wait: 2500 },
  { name: 'erp-cfdi',               path: '/erp/cfdi',   mode: 'dark',  w: 1920, h: 1080, wait: 2500 },
  { name: 'light-mode-comparison',  path: '/dashboard',  mode: 'light', w: 1920, h: 1080, wait: 2500 },
  { name: 'samantha-panel',         path: '/dashboard',  mode: 'dark',  w: 1200, h: 800,  wait: 2500 },
];

async function login(page) {
  console.log('  → Navigating to login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  await page.type('input[type="email"], input[name="email"]', EMAIL, { delay: 50 });
  await page.type('input[type="password"], input[name="password"]', PASSWORD, { delay: 50 });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log('  → Logged in. Current URL:', page.url());
}

async function setTheme(page, mode) {
  if (mode === 'light') {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(600);
  } else {
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(400);
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Login once
  try {
    await login(page);
  } catch (e) {
    console.error('Login failed:', e.message);
    await browser.close();
    process.exit(1);
  }

  for (const shot of SHOTS) {
    console.log(`\n📸 ${shot.name} (${shot.w}x${shot.h}, ${shot.mode})`);
    try {
      await page.setViewport({ width: shot.w, height: shot.h });

      // domcontentloaded is enough — avoid networkidle0 which hangs on Supabase keep-alive
      await page.goto(`${BASE_URL}${shot.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      // Give React/Next.js time to hydrate + fetch data
      await page.waitForTimeout(shot.wait);
      await setTheme(page, shot.mode);
      await page.waitForTimeout(800);

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      const file = path.join(OUT_DIR, `${shot.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`  ✅ Saved: ${file}`);
    } catch (e) {
      console.error(`  ❌ Failed: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n✅ Done.');
})();
