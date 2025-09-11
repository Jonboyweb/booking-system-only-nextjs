#!/usr/bin/env npx tsx
import { PrismaClient } from '../lib/generated/prisma';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Creating default admin user for The Backroom Leeds');
  console.log('==================================================\n');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      
      // Update password to ensure it's correct
      const passwordHash = await hashPassword('admin123');
      await prisma.adminUser.update({
        where: { email: 'admin@backroomleeds.co.uk' },
        data: { 
          passwordHash,
          isActive: true 
        }
      });
      console.log('\n✅ Admin password reset successfully!');
      console.log('Email: admin@backroomleeds.co.uk');
      console.log('Password: admin123');
    } else {
      // Create new admin user
      const passwordHash = await hashPassword('admin123');
      
      const adminUser = await prisma.adminUser.create({
        data: {
          email: 'admin@backroomleeds.co.uk',
          name: 'Admin User',
          passwordHash,
          role: 'admin',
          isActive: true
        }
      });
      
      console.log('\n✅ Admin user created successfully!');
      console.log(`Email: ${adminUser.email}`);
      console.log(`Name: ${adminUser.name}`);
      console.log(`Role: ${adminUser.role}`);
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();