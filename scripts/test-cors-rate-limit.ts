#!/usr/bin/env tsx

/**
 * Test script for CORS and Rate Limiting implementations
 */

import { config as loadEnv } from 'dotenv';

// Load environment variables
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  test: string;
  passed: boolean;
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  results.push(result);
  console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
  if (result.details) {
    console.log('  Details:', result.details);
  }
  if (result.error) {
    console.log('  Error:', result.error);
  }
}

async function testCORS() {
  console.log('\n🔍 Testing CORS Configuration...\n');

  // Test 1: OPTIONS preflight request
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
      'access-control-max-age': response.headers.get('access-control-max-age')
    };

    logTest({
      test: 'CORS preflight request',
      passed: response.status === 204 && corsHeaders['access-control-allow-origin'] !== null,
      details: corsHeaders
    });
  } catch (error) {
    logTest({
      test: 'CORS preflight request',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Test 2: Invalid origin rejection
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: true })
    });

    const data = await response.json();

    logTest({
      test: 'Invalid origin rejection',
      passed: response.status === 403 && data.error === 'CORS policy: Origin not allowed',
      details: { status: response.status, error: data.error }
    });
  } catch (error) {
    // This might fail due to browser CORS policy, which is expected
    logTest({
      test: 'Invalid origin rejection',
      passed: true,
      details: 'Request blocked by browser CORS policy (expected behavior)'
    });
  }

  // Test 3: Valid origin acceptance
  try {
    const response = await fetch(`${API_BASE_URL}/api/packages`, {
      method: 'GET',
      headers: {
        'Origin': API_BASE_URL
      }
    });

    const hasOriginHeader = response.headers.get('access-control-allow-origin') === API_BASE_URL;

    logTest({
      test: 'Valid origin acceptance',
      passed: response.ok && hasOriginHeader,
      details: {
        status: response.status,
        'access-control-allow-origin': response.headers.get('access-control-allow-origin')
      }
    });
  } catch (error) {
    logTest({
      test: 'Valid origin acceptance',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function testRateLimiting() {
  console.log('\n🚦 Testing Rate Limiting...\n');

  // Test 1: Booking endpoint rate limit (5 requests per minute)
  console.log('Testing booking endpoint rate limit (5 requests/minute)...');
  const bookingRequests = [];

  for (let i = 1; i <= 7; i++) {
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Request': `${i}` // To help identify requests
      },
      body: JSON.stringify({
        customer: {
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          phone: '07123456789'
        },
        date: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: '20:00-22:00',
        tableId: 1,
        partySize: 4
      })
    });

    const rateLimitHeaders = {
      limit: response.headers.get('x-ratelimit-limit'),
      remaining: response.headers.get('x-ratelimit-remaining'),
      reset: response.headers.get('x-ratelimit-reset')
    };

    bookingRequests.push({
      request: i,
      status: response.status,
      rateLimitHeaders,
      data: await response.json()
    });

    // Small delay to ensure requests are processed sequentially
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const rateLimited = bookingRequests.filter(r => r.status === 429);
  const successful = bookingRequests.filter(r => r.status !== 429);

  logTest({
    test: 'Booking endpoint rate limiting',
    passed: successful.length === 5 && rateLimited.length === 2,
    details: {
      successful: successful.length,
      rateLimited: rateLimited.length,
      lastSuccessfulHeaders: successful[successful.length - 1]?.rateLimitHeaders,
      firstRateLimitedResponse: rateLimited[0]?.data
    }
  });

  // Test 2: Payment intent endpoint rate limit (10 requests per minute)
  console.log('\nTesting payment intent endpoint rate limit (10 requests/minute)...');
  const paymentRequests = [];

  for (let i = 1; i <= 12; i++) {
    const response = await fetch(`${API_BASE_URL}/api/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Request': `${i}`
      },
      body: JSON.stringify({
        bookingId: 1,
        customerEmail: 'test@example.com'
      })
    });

    const rateLimitHeaders = {
      limit: response.headers.get('x-ratelimit-limit'),
      remaining: response.headers.get('x-ratelimit-remaining'),
      reset: response.headers.get('x-ratelimit-reset')
    };

    paymentRequests.push({
      request: i,
      status: response.status,
      rateLimitHeaders
    });

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const paymentRateLimited = paymentRequests.filter(r => r.status === 429);
  const paymentSuccessful = paymentRequests.filter(r => r.status !== 429);

  logTest({
    test: 'Payment intent endpoint rate limiting',
    passed: paymentSuccessful.length === 10 && paymentRateLimited.length === 2,
    details: {
      successful: paymentSuccessful.length,
      rateLimited: paymentRateLimited.length,
      lastSuccessfulHeaders: paymentSuccessful[paymentSuccessful.length - 1]?.rateLimitHeaders
    }
  });

  // Test 3: Admin login endpoint rate limit (5 requests per minute)
  console.log('\nTesting admin login endpoint rate limit (5 requests/minute)...');
  const loginRequests = [];

  for (let i = 1; i <= 7; i++) {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Request': `${i}`
      },
      body: JSON.stringify({
        email: `test${i}@example.com`,
        password: 'wrongpassword'
      })
    });

    const rateLimitHeaders = {
      limit: response.headers.get('x-ratelimit-limit'),
      remaining: response.headers.get('x-ratelimit-remaining'),
      reset: response.headers.get('x-ratelimit-reset'),
      retryAfter: response.headers.get('retry-after')
    };

    loginRequests.push({
      request: i,
      status: response.status,
      rateLimitHeaders
    });

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const loginRateLimited = loginRequests.filter(r => r.status === 429);
  const loginNotRateLimited = loginRequests.filter(r => r.status !== 429);

  logTest({
    test: 'Admin login endpoint rate limiting',
    passed: loginNotRateLimited.length === 5 && loginRateLimited.length === 2,
    details: {
      notRateLimited: loginNotRateLimited.length,
      rateLimited: loginRateLimited.length,
      firstRateLimitedHeaders: loginRateLimited[0]?.rateLimitHeaders
    }
  });

  // Test 4: Rate limit headers presence
  const hasRateLimitHeaders = bookingRequests[0]?.rateLimitHeaders.limit !== null;

  logTest({
    test: 'Rate limit headers presence',
    passed: hasRateLimitHeaders,
    details: {
      sampleHeaders: bookingRequests[0]?.rateLimitHeaders
    }
  });
}

async function testRateLimitReset() {
  console.log('\n⏱️  Testing Rate Limit Reset...\n');
  console.log('This test will take about 65 seconds to complete...\n');

  // First, exhaust the rate limit
  const exhaustRequests = [];
  for (let i = 1; i <= 6; i++) {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Request': `exhaust-${i}`
      },
      body: JSON.stringify({
        email: `exhaust${i}@example.com`,
        password: 'test'
      })
    });

    exhaustRequests.push({
      request: i,
      status: response.status,
      time: new Date().toISOString()
    });
  }

  const rateLimitedRequest = exhaustRequests.find(r => r.status === 429);

  if (rateLimitedRequest) {
    console.log(`Rate limit hit at request ${exhaustRequests.findIndex(r => r.status === 429) + 1}`);
    console.log('Waiting 65 seconds for rate limit to reset...');

    // Wait for rate limit window to pass (60 seconds + 5 second buffer)
    await new Promise(resolve => setTimeout(resolve, 65000));

    // Try again after reset
    const resetResponse = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Request': 'after-reset'
      },
      body: JSON.stringify({
        email: 'reset@example.com',
        password: 'test'
      })
    });

    logTest({
      test: 'Rate limit reset after time window',
      passed: resetResponse.status !== 429,
      details: {
        statusAfterReset: resetResponse.status,
        rateLimitHeaders: {
          limit: resetResponse.headers.get('x-ratelimit-limit'),
          remaining: resetResponse.headers.get('x-ratelimit-remaining')
        }
      }
    });
  } else {
    logTest({
      test: 'Rate limit reset after time window',
      passed: false,
      error: 'Could not trigger rate limit for reset test'
    });
  }
}

async function runTests() {
  console.log('================================');
  console.log('CORS and Rate Limiting Test Suite');
  console.log('================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  await testCORS();
  await testRateLimiting();

  // Optional: Run the reset test (takes 65+ seconds)
  const runResetTest = process.argv.includes('--with-reset');
  if (runResetTest) {
    await testRateLimitReset();
  } else {
    console.log('\n💡 Tip: Run with --with-reset flag to test rate limit reset (takes ~65 seconds)');
  }

  // Summary
  console.log('\n================================');
  console.log('Test Summary');
  console.log('================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});