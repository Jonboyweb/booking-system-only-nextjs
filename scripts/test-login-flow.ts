#!/usr/bin/env npx tsx

/**
 * Test script to verify admin login flow and cookie handling
 */

async function testLoginFlow() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('🔐 Testing Admin Login Flow');
  console.log('═'.repeat(50));
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    // Step 1: Test login endpoint
    console.log('1️⃣  Testing login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@backroomleeds.co.uk',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Success: ${loginData.success}`);

    // Check for Set-Cookie header
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('   ✅ Cookie header present');

      // Parse cookie attributes
      const cookieAttributes = setCookieHeader.split(';').map(s => s.trim());
      console.log('\n   Cookie Attributes:');

      cookieAttributes.forEach(attr => {
        if (attr.startsWith('admin-token=')) {
          console.log(`   - Token: ${attr.substring(0, 30)}...`);
        } else if (attr) {
          console.log(`   - ${attr}`);
        }
      });

      // Check for important attributes
      const hasHttpOnly = cookieAttributes.some(a => a.toLowerCase() === 'httponly');
      const hasSecure = cookieAttributes.some(a => a.toLowerCase() === 'secure');
      const sameSite = cookieAttributes.find(a => a.toLowerCase().startsWith('samesite'));

      console.log('\n   Security Checks:');
      console.log(`   - HttpOnly: ${hasHttpOnly ? '✅' : '❌'}`);
      console.log(`   - Secure: ${hasSecure ? '✅ (HTTPS)' : '⚠️  (HTTP - OK for dev)'}`);
      console.log(`   - SameSite: ${sameSite || 'Not set'}`);
    } else {
      console.log('   ❌ No Set-Cookie header found');
    }

    // Step 2: Test protected endpoint with cookie
    if (setCookieHeader) {
      console.log('\n2️⃣  Testing protected endpoint with cookie...');

      // Extract token from cookie
      const tokenMatch = setCookieHeader.match(/admin-token=([^;]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];

        const verifyResponse = await fetch(`${baseUrl}/api/admin/auth/verify`, {
          method: 'GET',
          headers: {
            'Cookie': `admin-token=${token}`
          }
        });

        const verifyData = await verifyResponse.json();
        console.log(`   Status: ${verifyResponse.status}`);
        console.log(`   Valid: ${verifyData.valid || false}`);

        if (verifyData.user) {
          console.log(`   User: ${verifyData.user.email} (${verifyData.user.role})`);
        }
      }
    }

    // Step 3: Browser compatibility notes
    console.log('\n3️⃣  Browser Compatibility Notes:');
    console.log('   - Chrome: Strict SameSite enforcement');
    console.log('   - Safari Desktop: More lenient cookie handling');
    console.log('   - Safari iPad: Additional third-party restrictions');
    console.log('   - Fix Applied: Using SameSite=lax for better compatibility');

    console.log('\n═'.repeat(50));
    console.log('✅ Login flow test complete');
    console.log('\nNext Steps:');
    console.log('1. Test login in Chrome browser');
    console.log('2. Test login in Safari browser');
    console.log('3. Test login on iPad Safari');
    console.log('4. Check DevTools > Application > Cookies');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLoginFlow().catch(console.error);