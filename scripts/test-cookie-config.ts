#!/usr/bin/env npx tsx

/**
 * Test script to verify cookie configuration across different environments
 */

import { getSecureCookieOptions, getAdminTokenCookieOptions } from '../lib/cookie-utils';

// Save original env values
const originalNodeEnv = process.env.NODE_ENV;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalCookieDomain = process.env.COOKIE_DOMAIN;

// Type assertion to allow writing to process.env
const mutableEnv = process.env as { [key: string]: string | undefined };

function testConfiguration(envName: string, nodeEnv: string, appUrl: string, cookieDomain?: string) {
  // Set test environment using mutable reference
  mutableEnv.NODE_ENV = nodeEnv;
  mutableEnv.NEXT_PUBLIC_APP_URL = appUrl;
  if (cookieDomain) {
    mutableEnv.COOKIE_DOMAIN = cookieDomain;
  } else {
    delete mutableEnv.COOKIE_DOMAIN;
  }

  console.log(`\n🔍 Testing: ${envName}`);
  console.log('─'.repeat(50));
  console.log(`NODE_ENV: ${nodeEnv}`);
  console.log(`APP_URL: ${appUrl}`);
  console.log(`COOKIE_DOMAIN: ${cookieDomain || '(not set)'}`);

  const adminOptions = getAdminTokenCookieOptions();

  console.log('\n📦 Cookie Configuration:');
  console.log(`  httpOnly: ${adminOptions.httpOnly}`);
  console.log(`  secure: ${adminOptions.secure}`);
  console.log(`  sameSite: ${adminOptions.sameSite}`);
  console.log(`  path: ${adminOptions.path}`);
  console.log(`  maxAge: ${adminOptions.maxAge}`);
  if (adminOptions.domain) {
    console.log(`  domain: ${adminOptions.domain}`);
  }

  // Browser compatibility notes
  console.log('\n🌐 Browser Compatibility:');
  if (!adminOptions.secure && adminOptions.sameSite === 'none') {
    console.log('  ⚠️  Warning: sameSite="none" requires secure=true');
  }
  if (adminOptions.secure && appUrl.startsWith('http://')) {
    console.log('  ⚠️  Warning: secure=true but using HTTP URL');
  }
  if (adminOptions.sameSite === 'none' && adminOptions.secure) {
    console.log('  ✅ Cross-site requests allowed (good for embedded iframes)');
  }
  if (adminOptions.sameSite === 'lax') {
    console.log('  ✅ Navigation requests allowed (good for standard login)');
  }
  if (!adminOptions.secure && appUrl.includes('localhost')) {
    console.log('  ✅ Correct configuration for localhost development');
  }
}

console.log('🍪 Cookie Configuration Test');
console.log('═'.repeat(50));

// Test different environments
testConfiguration(
  'Local Development',
  'development',
  'http://localhost:3000'
);

testConfiguration(
  'Production with HTTPS',
  'production',
  'https://br.door50a.co.uk'
);

testConfiguration(
  'Production with Subdomain Cookie',
  'production',
  'https://br.door50a.co.uk',
  '.door50a.co.uk'
);

testConfiguration(
  'Staging Environment',
  'production',
  'https://staging.backroomleeds.co.uk',
  '.backroomleeds.co.uk'
);

testConfiguration(
  'Local Testing with Different Port',
  'development',
  'http://localhost:3003'
);

// Restore original values
mutableEnv.NODE_ENV = originalNodeEnv || '';
mutableEnv.NEXT_PUBLIC_APP_URL = originalAppUrl || '';
if (originalCookieDomain) {
  mutableEnv.COOKIE_DOMAIN = originalCookieDomain;
} else {
  delete mutableEnv.COOKIE_DOMAIN;
}

console.log('\n═'.repeat(50));
console.log('✅ Cookie configuration test complete');
console.log('\nRecommendations:');
console.log('1. For production, ensure HTTPS is enabled');
console.log('2. Set COOKIE_DOMAIN for subdomain compatibility');
console.log('3. Test login on Chrome, Safari (desktop), and Safari (iPad)');
console.log('4. Check browser DevTools > Application > Cookies after login');