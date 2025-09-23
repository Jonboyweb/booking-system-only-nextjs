#!/usr/bin/env npx tsx
import { db } from '../lib/db';
import { verifyPassword } from '../src/lib/auth/password';


async function testAdminLogin() {
  console.log('Testing Admin Login System');
  console.log('==========================\n');

  try {
    // 1. Check if admin user exists
    console.log('1. Checking if admin user exists...');
    const adminUser = await db.adminUser.findUnique({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!adminUser) {
      console.log('❌ Admin user does not exist!');
      console.log('Run: npx tsx scripts/seed-admin.ts');
      return;
    }

    console.log('✅ Admin user found:');
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Name: ${adminUser.name}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Active: ${adminUser.isActive}`);
    console.log(`   - Last Login: ${adminUser.lastLogin || 'Never'}`);

    // 2. Test password verification
    console.log('\n2. Testing password verification...');
    const isValidPassword = await verifyPassword('admin123', adminUser.passwordHash);
    
    if (isValidPassword) {
      console.log('✅ Password "admin123" is valid');
    } else {
      console.log('❌ Password "admin123" is NOT valid');
      console.log('   The password hash may be corrupted.');
    }

    // 3. Test wrong password
    console.log('\n3. Testing wrong password...');
    const isWrongPassword = await verifyPassword('wrongpassword', adminUser.passwordHash);
    
    if (!isWrongPassword) {
      console.log('✅ Wrong password correctly rejected');
    } else {
      console.log('❌ Wrong password was accepted (this should not happen)');
    }

    // 4. Test API endpoint
    console.log('\n4. Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@backroomleeds.co.uk',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ API login successful');
      console.log(`   - User ID: ${data.user.id}`);
      console.log(`   - User Role: ${data.user.role}`);
    } else {
      console.log('❌ API login failed');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Error: ${data.error || 'Unknown'}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await db.$disconnect();
  }
}

testAdminLogin();