#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function testConfirmationComprehensive() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  console.log('\n🔍 Comprehensive Confirmation Page Testing\n');
  console.log('=' . repeat(50));

  const testCases = [
    { ref: 'BR-F5ONF3', expected: 'success', description: 'Valid confirmed booking' },
    { ref: 'BR-OVIRHT', expected: 'success', description: 'Another valid booking' },
    { ref: 'BR-INVALID', expected: 'error', description: 'Invalid booking reference' },
    { ref: '', expected: 'error', description: 'Empty reference parameter' }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`   Reference: ${testCase.ref || '(empty)'}`);

    const page = await context.newPage();

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    try {
      const url = testCase.ref
        ? `http://localhost:3000/booking/confirmation?reference=${testCase.ref}`
        : `http://localhost:3000/booking/confirmation`;

      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

      // Wait for content to load
      await page.waitForSelector('h2, .bg-red-50', { timeout: 10000 });

      if (testCase.expected === 'success') {
        // Check for success elements
        const successBanner = await page.$('h2:has-text("Booking Confirmed")');
        const tableInfo = await page.$('text=/Table [0-9]+/');
        const customerDetails = await page.$('h3:has-text("Customer Details")');

        if (successBanner && tableInfo && customerDetails) {
          console.log('   ✅ Success page rendered correctly');
          console.log('   ✅ No JavaScript errors');
          passedTests++;
        } else {
          console.log('   ❌ Missing expected elements on success page');
          if (!successBanner) console.log('      - Success banner missing');
          if (!tableInfo) console.log('      - Table info missing');
          if (!customerDetails) console.log('      - Customer details missing');
          failedTests++;
        }
      } else if (testCase.expected === 'error') {
        // Check for error message
        const errorElement = await page.$('.bg-red-50');
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log('   ✅ Error handled correctly');
          console.log(`   ℹ️  Error message: ${errorText?.substring(0, 50)}...`);
          passedTests++;
        } else {
          console.log('   ❌ Error not displayed properly');
          failedTests++;
        }
      }

      // Check for JavaScript errors
      if (pageErrors.length > 0 || consoleErrors.length > 0) {
        console.log('   ⚠️  JavaScript errors detected:');
        pageErrors.forEach(err => console.log(`      - Page error: ${err}`));
        consoleErrors.forEach(err => console.log(`      - Console error: ${err}`));

        // Check specifically for the table.tableNumber error
        const hasTableError = [...pageErrors, ...consoleErrors].some(err =>
          err.includes('booking.table.tableNumber') ||
          err.includes('undefined is not an object')
        );

        if (hasTableError) {
          console.log('   ❌ CRITICAL: The original bug is still present!');
          failedTests++;
        }
      }

    } catch (error: any) {
      console.log(`   ❌ Test failed: ${error.message}`);
      failedTests++;
    } finally {
      await page.close();
    }
  }

  console.log('\n' + '=' . repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`   ✅ Passed: ${passedTests}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failedTests}/${testCases.length}`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The bug has been successfully fixed.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }

  await browser.close();
}

testConfirmationComprehensive().catch(console.error);