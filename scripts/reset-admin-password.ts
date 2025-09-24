import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.adminUser.update({
      where: {
        email: 'admin@backroomleeds.co.uk'
      },
      data: {
        passwordHash: hashedPassword
      }
    });

    console.log('Admin password reset successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();