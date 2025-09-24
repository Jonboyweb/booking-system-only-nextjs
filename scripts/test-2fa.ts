#!/usr/bin/env npx tsx
import { db } from '../lib/db';
import speakeasy from 'speakeasy';

async function test2FA() {
  console.log('Testing 2FA Implementation...\n');

  try {
    // Get an admin user
    const admin = await db.adminUser.findFirst({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!admin) {
      console.error('Admin user not found. Run npx tsx scripts/seed-admin.ts first');
      process.exit(1);
    }

    console.log('Admin User:', {
      email: admin.email,
      name: admin.name,
      twoFactorEnabled: admin.twoFactorEnabled,
      hasSecret: !!admin.twoFactorSecret,
      backupCodesCount: admin.twoFactorBackupCodes ? (admin.twoFactorBackupCodes as any[]).length : 0
    });

    if (admin.twoFactorEnabled && admin.twoFactorSecret) {
      console.log('\n2FA is already enabled for this user.');

      // Generate a current TOTP code
      const code = speakeasy.totp({
        secret: admin.twoFactorSecret,
        encoding: 'base32'
      });

      console.log('Current TOTP code:', code);
      console.log('This code can be used to test 2FA login');

      // Show backup codes if any
      if (admin.twoFactorBackupCodes && Array.isArray(admin.twoFactorBackupCodes)) {
        console.log('\nBackup codes (encoded):');
        (admin.twoFactorBackupCodes as string[]).forEach((code, index) => {
          // Decode the backup code for display
          const decoded = Buffer.from(code, 'base64').toString();
          console.log(`  ${index + 1}. ${decoded}`);
        });
      }
    } else {
      console.log('\n2FA is not enabled for this user.');
      console.log('To enable 2FA:');
      console.log('1. Login to the admin dashboard');
      console.log('2. Go to Settings');
      console.log('3. Click "Enable 2FA" in the Two-Factor Authentication section');
      console.log('4. Follow the setup instructions');
    }

    console.log('\n--- Testing Password Change API ---');
    console.log('Note: This would require authentication. Test it through the UI instead.');

    console.log('\n--- Instructions for Manual Testing ---');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to http://localhost:3000/admin/login');
    console.log('3. Login with admin@backroomleeds.co.uk / admin123');
    console.log('4. Go to Settings page');
    console.log('5. Test password change functionality');
    console.log('6. Test 2FA setup and verification');
    console.log('7. Logout and test login with 2FA enabled');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

test2FA();