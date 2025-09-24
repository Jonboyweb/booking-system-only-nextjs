import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function verifyAdminPassword() {
  try {
    const admin = await db.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin found:');
    console.log('- Email:', admin.email);
    console.log('- Name:', admin.name);
    console.log('- Active:', admin.isActive);

    // Test password verification
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    console.log(`\nPassword 'admin123' verification result:`, isValid);

    if (!isValid) {
      console.log('\nPassword hash in database:', admin.passwordHash);
      console.log('Generating correct hash for admin123...');
      const correctHash = await bcrypt.hash('admin123', 10);
      console.log('Correct hash should be something like:', correctHash);

      // Update the password to admin123
      console.log('\nUpdating admin password to "admin123"...');
      await db.adminUser.update({
        where: { email: 'admin@backroomleeds.co.uk' },
        data: { passwordHash: correctHash }
      });
      console.log('Password updated successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

verifyAdminPassword();