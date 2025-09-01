#!/usr/bin/env npx tsx
import { PrismaClient } from '../lib/generated/prisma';
import { hashPassword } from '../src/lib/auth/password';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdminUser() {
  console.log('Create Admin User for The Backroom Leeds');
  console.log('=========================================\n');

  try {
    const email = await question('Email: ');
    const name = await question('Name: ');
    const password = await question('Password: ');
    const role = await question('Role (staff/manager/admin) [admin]: ') || 'admin';

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the admin user
    const adminUser = await prisma.adminUser.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        isActive: true
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`ID: ${adminUser.id}`);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdminUser();