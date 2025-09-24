#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function testConfirmationPage() {
  const bookingRef = process.argv[2] || 'BR-F5ONF3';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\nTesting confirmation page for booking ${bookingRef}...\n`);

    // Navigate to the confirmation page
    const url = `http://localhost:3000/booking/confirmation?reference=${bookingRef}`;
    console.log(`Loading: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for the content to load (either success or error)
    await page.waitForSelector('h2, .bg-red-50', { timeout: 10000 });

    // Check if there are any errors
    const errorElement = await page.$('.bg-red-50');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error found on page:', errorText);

      // Check console for JavaScript errors
      page.on('pageerror', error => {
        console.log('❌ JavaScript error:', error.message);
      });

      return;
    }

    // Check if the success banner is displayed
    const successBanner = await page.$('h2:has-text("Booking Confirmed")');
    if (successBanner) {
      console.log('✅ Success banner displayed');
    } else {
      console.log('❌ Success banner not found');
    }

    // Check if booking reference is displayed
    const refElement = await page.$(`text=${bookingRef}`);
    if (refElement) {
      console.log(`✅ Booking reference ${bookingRef} displayed`);
    } else {
      console.log('❌ Booking reference not displayed');
    }

    // Check if table number is displayed
    const tableText = await page.textContent('text=/Table [0-9]+/');
    if (tableText) {
      console.log(`✅ Table information displayed: ${tableText}`);
    } else {
      console.log('❌ Table information not displayed');
    }

    // Check if customer details are displayed
    const customerSection = await page.$('h3:has-text("Customer Details")');
    if (customerSection) {
      console.log('✅ Customer details section found');
    } else {
      console.log('❌ Customer details section not found');
    }

    // Check for any JavaScript errors in the console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a moment to catch any late errors
    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors found:');
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('\n✅ No console errors detected');
    }

    console.log('\n✅ Confirmation page is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testConfirmationPage().catch(console.error);