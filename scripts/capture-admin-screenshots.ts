#!/usr/bin/env npx tsx

/**
 * Script to capture screenshots of admin dashboard styling issues
 */

import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/cdev/booking-system-only-nextjs/.playwright-mcp';

async function captureScreenshots() {
  console.log('📸 Capturing Admin Dashboard Screenshots\n');

  // Ensure screenshot directory exists
  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  try {
    // Using playwright to capture screenshots
    const playwrightScript = `
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');

    // Take login page screenshot
    await page.screenshot({
      path: '${SCREENSHOT_DIR}/admin-login-current.png',
      fullPage: true
    });
    console.log('✅ Login page screenshot saved');

    // Fill login form
    await page.fill('input[name="email"]', 'admin@backroomleeds.co.uk');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Take full dashboard screenshot
    await page.screenshot({
      path: '${SCREENSHOT_DIR}/admin-dashboard-full.png',
      fullPage: true
    });
    console.log('✅ Full dashboard screenshot saved');

    // Take sidebar close-up screenshot
    const sidebar = page.locator('aside');
    if (await sidebar.isVisible()) {
      await sidebar.screenshot({
        path: '${SCREENSHOT_DIR}/admin-sidebar-closeup.png'
      });
      console.log('✅ Sidebar close-up screenshot saved');
    }

    // Take navigation menu screenshot
    const nav = page.locator('nav');
    if (await nav.isVisible()) {
      await nav.screenshot({
        path: '${SCREENSHOT_DIR}/admin-navigation-menu.png'
      });
      console.log('✅ Navigation menu screenshot saved');
    }

  } catch (error) {
    console.error('Error capturing screenshots:', error);

    // Try to capture current state anyway
    await page.screenshot({
      path: '${SCREENSHOT_DIR}/admin-error-state.png',
      fullPage: true
    });
    console.log('📸 Error state screenshot saved');
  }

  await browser.close();
  console.log('\\n🎯 Screenshots saved to: ${SCREENSHOT_DIR}');
})();
`;

    // Write temporary playwright script
    const scriptPath = '/tmp/capture-admin-screenshots.js';
    require('fs').writeFileSync(scriptPath, playwrightScript);

    // Install playwright if needed and run script
    console.log('Installing Playwright dependencies...');
    execSync('npm install playwright', { stdio: 'inherit' });

    console.log('Running screenshot capture...');
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });

  } catch (error) {
    console.error('Failed to capture screenshots:', error);

    // Fallback: Try using curl to check if pages are accessible
    console.log('\nTrying fallback: checking page accessibility...');
    try {
      const loginResponse = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login').toString();
      console.log(`Login page status: ${loginResponse}`);

      if (loginResponse === '200') {
        console.log('✅ Login page is accessible');
        console.log('❌ But screenshot capture failed - check if development server is running');
      }
    } catch (curlError) {
      console.error('Development server may not be running on localhost:3000');
    }
  }
}

captureScreenshots().catch(console.error);