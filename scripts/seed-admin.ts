#!/usr/bin/env npx tsx
import { PrismaClient } from '../lib/generated/prisma';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function seedAdminUser() {
  console.log('Seeding default admin user...');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const passwordHash = await hashPassword('admin123');
    
    const adminUser = await prisma.adminUser.create({
      data: {
        email: 'admin@backroomleeds.co.uk',
        name: 'Admin',
        passwordHash,
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Admin user created:');
    console.log('Email: admin@backroomleeds.co.uk');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminUser();