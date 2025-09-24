import { PrismaClient } from '../lib/generated/prisma';

const db = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await db.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!admin) {
      console.log('Admin user not found');
    } else {
      console.log('Admin found:');
      console.log('- Email:', admin.email);
      console.log('- Name:', admin.name);
      console.log('- Role:', admin.role);
      console.log('- Active:', admin.isActive);
      console.log('- 2FA Enabled:', admin.twoFactorEnabled);
      console.log('- Has 2FA Secret:', !!admin.twoFactorSecret);
      console.log('- Has Backup Codes:', !!admin.twoFactorBackupCodes);

      if (admin.twoFactorBackupCodes) {
        const codes = admin.twoFactorBackupCodes as string[];
        console.log('- Number of Backup Codes:', codes.length);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkAdmin();