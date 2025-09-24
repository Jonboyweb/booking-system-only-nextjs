import fetch from 'node-fetch';
import speakeasy from 'speakeasy';
import { PrismaClient } from '../lib/generated/prisma';

const db = new PrismaClient();
const BASE_URL = 'http://localhost:3002';

async function test2FALoginFlow() {
  try {
    console.log('Starting 2FA login flow test...\n');

    // Step 1: Attempt login with correct credentials
    console.log('Step 1: Login with email/password');
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@backroomleeds.co.uk',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json() as any;
    console.log('Login response:', {
      status: loginResponse.status,
      data: loginData
    });

    if (!loginData.requiresTwoFactor) {
      console.log('ERROR: Expected requiresTwoFactor to be true');
      return;
    }

    // Step 2: Get the admin's 2FA secret from database
    const admin = await db.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!admin || !admin.twoFactorSecret) {
      console.log('ERROR: Admin or 2FA secret not found');
      return;
    }

    // Step 3: Generate a valid TOTP code
    const totpCode = speakeasy.totp({
      secret: admin.twoFactorSecret,
      encoding: 'base32'
    });

    console.log(`\nStep 2: Generated TOTP code: ${totpCode}`);

    // Step 4: Verify 2FA code
    console.log('\nStep 3: Verify 2FA code');
    const verifyResponse = await fetch(`${BASE_URL}/api/admin/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@backroomleeds.co.uk',
        code: totpCode,
        isBackupCode: false
      })
    });

    const verifyData = await verifyResponse.json() as any;
    console.log('2FA verification response:', {
      status: verifyResponse.status,
      data: verifyData,
      headers: Object.fromEntries(verifyResponse.headers.entries())
    });

    if (verifyResponse.ok && verifyData.success) {
      console.log('\n✅ 2FA login flow completed successfully!');
      console.log('User:', verifyData.user);
    } else {
      console.log('\n❌ 2FA verification failed');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await db.$disconnect();
  }
}

// Check if the server is running
fetch(`${BASE_URL}/api/health`)
  .then(() => {
    console.log('Server is running, starting test...\n');
    test2FALoginFlow();
  })
  .catch(() => {
    console.log('Server is not running. Please start the server with "npm run dev" first.');
  });