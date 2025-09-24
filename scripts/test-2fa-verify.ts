import { PrismaClient } from '../lib/generated/prisma';
import speakeasy from 'speakeasy';

const db = new PrismaClient();

async function test2FAVerification() {
  try {
    // Get the admin user
    const admin = await db.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin found:');
    console.log('- Email:', admin.email);
    console.log('- 2FA Enabled:', admin.twoFactorEnabled);
    console.log('- Has Secret:', !!admin.twoFactorSecret);

    if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
      console.log('2FA is not enabled for this account');
      return;
    }

    // Generate a test TOTP code using the stored secret
    const testCode = speakeasy.totp({
      secret: admin.twoFactorSecret,
      encoding: 'base32'
    });

    console.log('\nGenerated test TOTP code:', testCode);

    // Verify the generated code
    const isValid = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: testCode,
      window: 2
    });

    console.log('Code verification result:', isValid);

    // Test with an invalid code
    const invalidCode = '000000';
    const isInvalidValid = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: invalidCode,
      window: 2
    });

    console.log('Invalid code verification result:', isInvalidValid);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

test2FAVerification();