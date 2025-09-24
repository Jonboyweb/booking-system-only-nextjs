#!/usr/bin/env npx tsx
import { db } from '../lib/db';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';
import { generateToken } from '../src/lib/auth/jwt';

async function testPasswordChangeAPI() {
  console.log('Testing Password Change API End-to-End');
  console.log('======================================\n');

  try {
    // 1. Create or reset test admin
    console.log('1. Setting up test admin...');
    let testAdmin = await db.adminUser.findUnique({
      where: { email: 'test-api@test.com' }
    });

    const initialPassword = 'initialpass123';
    const initialPasswordHash = await hashPassword(initialPassword);

    if (!testAdmin) {
      testAdmin = await db.adminUser.create({
        data: {
          email: 'test-api@test.com',
          name: 'API Test Admin',
          passwordHash: initialPasswordHash,
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Created test admin');
    } else {
      await db.adminUser.update({
        where: { id: testAdmin.id },
        data: { passwordHash: initialPasswordHash }
      });
      console.log('✅ Reset test admin password');
    }

    // 2. Verify initial password works
    console.log('\n2. Testing initial login...');
    const loginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-api@test.com',
        password: initialPassword
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log('❌ Initial login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Initial login successful');

    // Get the JWT token from the cookie header
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const tokenMatch = setCookieHeader?.match(/admin-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      console.log('❌ No JWT token received');
      return;
    }
    console.log('✅ JWT token received');

    // 3. Change password via API
    console.log('\n3. Changing password via API...');
    const newPassword = 'newpassword456';

    const changeResponse = await fetch('http://localhost:3000/api/admin/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin-token=${token}`
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: newPassword
      })
    });

    const changeData = await changeResponse.json();

    if (!changeResponse.ok) {
      console.log('❌ Password change failed:', changeData);
      return;
    }

    console.log('✅ Password change API response successful');
    console.log('   Response:', changeData);

    // 4. Verify password was actually changed in database
    console.log('\n4. Verifying database update...');
    const updatedAdmin = await db.adminUser.findUnique({
      where: { id: testAdmin.id }
    });

    if (!updatedAdmin) {
      console.log('❌ Could not find admin after update');
      return;
    }

    // Test with old password (should fail)
    const oldPasswordWorks = await verifyPassword(initialPassword, updatedAdmin.passwordHash);
    console.log(`Old password verification: ${oldPasswordWorks ? '❌ FAIL (should not work)' : '✅ PASS (correctly rejected)'}`);

    // Test with new password (should work)
    const newPasswordWorks = await verifyPassword(newPassword, updatedAdmin.passwordHash);
    console.log(`New password verification: ${newPasswordWorks ? '✅ PASS' : '❌ FAIL'}`);

    // 5. Test login with new password
    console.log('\n5. Testing login with new password...');
    const newLoginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-api@test.com',
        password: newPassword
      })
    });

    const newLoginData = await newLoginResponse.json();

    if (!newLoginResponse.ok) {
      console.log('❌ Login with new password failed:', newLoginData);
      console.log('\n6. Debugging information...');

      // Additional debugging
      const debugAdmin = await db.adminUser.findUnique({
        where: { email: 'test-api@test.com' }
      });

      if (debugAdmin) {
        console.log('Current password hash in DB:', debugAdmin.passwordHash.substring(0, 30) + '...');

        // Test direct verification
        const directTest = await verifyPassword(newPassword, debugAdmin.passwordHash);
        console.log('Direct password verification:', directTest ? '✅ Works' : '❌ Fails');

        // Test if hash format is valid
        console.log('Hash starts with $2b$:', debugAdmin.passwordHash.startsWith('$2b$') ? '✅ Yes' : '❌ No');
        console.log('Hash starts with $2a$:', debugAdmin.passwordHash.startsWith('$2a$') ? '✅ Yes' : '❌ No');

        // Check hash length
        console.log('Hash length:', debugAdmin.passwordHash.length, '(should be 60)');
      }
    } else {
      console.log('✅ Login with new password successful');
      console.log('   User:', newLoginData.user);
    }

    // 6. Test login with old password (should fail)
    console.log('\n6. Testing login with old password (should fail)...');
    const oldLoginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-api@test.com',
        password: initialPassword
      })
    });

    if (oldLoginResponse.ok) {
      console.log('❌ Old password still works (should have failed)');
    } else {
      console.log('✅ Old password correctly rejected');
    }

    // Cleanup
    console.log('\n7. Cleaning up test user...');
    await db.adminUser.delete({
      where: { id: testAdmin.id }
    });
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    await db.$disconnect();
  }
}

// Make sure the server is running
console.log('⚠️  Make sure the Next.js dev server is running on http://localhost:3000');
console.log('⚠️  Run: npm run dev\n');

testPasswordChangeAPI();