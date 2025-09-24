import { PrismaClient } from '../lib/generated/prisma';

const db = new PrismaClient();

async function toggle2FA() {
  const email = process.argv[2] || 'admin@backroomleeds.co.uk';
  const action = process.argv[3] || 'status'; // status, enable, disable

  try {
    const admin = await db.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      console.log(`Admin user ${email} not found`);
      return;
    }

    console.log('Current 2FA Status:');
    console.log('- Email:', admin.email);
    console.log('- 2FA Enabled:', admin.twoFactorEnabled);
    console.log('- Has Secret:', !!admin.twoFactorSecret);

    if (action === 'disable') {
      await db.adminUser.update({
        where: { email },
        data: { twoFactorEnabled: false }
      });
      console.log('\n✅ 2FA has been DISABLED for', email);
      console.log('Note: The secret is preserved, so 2FA can be re-enabled');
    } else if (action === 'enable') {
      if (!admin.twoFactorSecret) {
        console.log('\n❌ Cannot enable 2FA - no secret configured');
        console.log('Use the admin dashboard to set up 2FA first');
      } else {
        await db.adminUser.update({
          where: { email },
          data: { twoFactorEnabled: true }
        });
        console.log('\n✅ 2FA has been ENABLED for', email);
      }
    } else if (action === 'status') {
      // Already shown above
    } else {
      console.log('\nUsage:');
      console.log('  npx tsx scripts/toggle-2fa.ts [email] [action]');
      console.log('\nActions:');
      console.log('  status  - Show current 2FA status (default)');
      console.log('  enable  - Enable 2FA (if secret exists)');
      console.log('  disable - Disable 2FA (keeps secret)');
      console.log('\nExamples:');
      console.log('  npx tsx scripts/toggle-2fa.ts');
      console.log('  npx tsx scripts/toggle-2fa.ts admin@backroomleeds.co.uk disable');
      console.log('  npx tsx scripts/toggle-2fa.ts admin@backroomleeds.co.uk enable');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

toggle2FA();