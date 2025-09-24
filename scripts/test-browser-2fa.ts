import { PrismaClient } from '../lib/generated/prisma';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const db = new PrismaClient();

async function showAdminTOTPInfo() {
  try {
    const admin = await db.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('='.repeat(60));
    console.log('ADMIN 2FA TEST INFORMATION');
    console.log('='.repeat(60));
    console.log('\nAdmin Details:');
    console.log('- Email: admin@backroomleeds.co.uk');
    console.log('- Password: admin123');
    console.log('- 2FA Enabled:', admin.twoFactorEnabled);

    if (!admin.twoFactorSecret) {
      console.log('\n2FA is not configured for this admin');
      return;
    }

    // Generate current TOTP code
    const currentCode = speakeasy.totp({
      secret: admin.twoFactorSecret,
      encoding: 'base32'
    });

    console.log('\n📱 Current TOTP Code (valid for 30 seconds):');
    console.log(`\n   >>> ${currentCode} <<<\n`);

    // Show backup codes if available
    if (admin.twoFactorBackupCodes) {
      const backupCodes = admin.twoFactorBackupCodes as string[];
      console.log('\n🔑 Backup Codes (use only if TOTP unavailable):');
      backupCodes.slice(0, 2).forEach((code, index) => {
        // Decode the base64 encoded backup code
        const decodedCode = Buffer.from(code, 'base64').toString();
        console.log(`   ${index + 1}. ${decodedCode}`);
      });
      console.log(`   ... and ${backupCodes.length - 2} more backup codes`);
    }

    // Generate authenticator URL for setup
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: admin.twoFactorSecret,
      label: 'admin@backroomleeds.co.uk',
      issuer: 'The Backroom Leeds',
      encoding: 'base32'
    });

    console.log('\n📲 Authenticator Setup URL (if needed):');
    console.log(otpAuthUrl);

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);
    console.log('\n📷 QR Code for Authenticator App:');
    console.log('   (Save as HTML file and open in browser to scan)');
    console.log(`   <img src="${qrCodeUrl.substring(0, 100)}...">`)

    console.log('\n' + '='.repeat(60));
    console.log('TESTING INSTRUCTIONS:');
    console.log('='.repeat(60));
    console.log('\n1. Open browser to: http://localhost:3002/admin/login');
    console.log('2. Enter email: admin@backroomleeds.co.uk');
    console.log('3. Enter password: admin123');
    console.log('4. Click "Sign In"');
    console.log('5. When prompted for 2FA, enter the TOTP code shown above');
    console.log('6. Click "Verify"');
    console.log('\nNote: The TOTP code changes every 30 seconds.');
    console.log('Run this script again to get a fresh code if needed.');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

showAdminTOTPInfo();