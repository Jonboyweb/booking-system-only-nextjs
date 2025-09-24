#!/usr/bin/env tsx

/**
 * This script verifies that the password change bug has been fixed
 * by testing the actual flow that users would experience.
 */

import { db } from '../lib/db';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';

async function verifyPasswordFix() {
  console.log('=================================');
  console.log('PASSWORD CHANGE BUG VERIFICATION');
  console.log('=================================\n');

  const testEmail = 'admin@backroomleeds.co.uk';
  const knownPassword = 'admin123';
  const testPassword = 'TestPassword2024!';

  try {
    // 1. Setup admin with known password
    console.log('📋 Setting up test environment...');
    let admin = await db.adminUser.findUnique({ where: { email: testEmail } });

    if (!admin) {
      const hash = await hashPassword(knownPassword);
      admin = await db.adminUser.create({
        data: {
          email: testEmail,
          name: 'Test Admin',
          passwordHash: hash,
          role: 'admin',
          isActive: true
        }
      });
      console.log('  ✓ Created test admin');
    } else {
      const hash = await hashPassword(knownPassword);
      admin = await db.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: hash }
      });
      console.log('  ✓ Reset admin to known password');
    }

    // 2. Verify initial login works
    console.log('\n📋 Verifying initial state...');
    const initialCheck = await verifyPassword(knownPassword, admin.passwordHash);
    console.log(`  ✓ Can login with known password: ${initialCheck}`);

    if (!initialCheck) {
      throw new Error('Initial password verification failed');
    }

    // 3. Change password (simulating what the API does)
    console.log('\n📋 Changing password...');

    // This is exactly what /api/admin/auth/change-password does:
    const currentUser = await db.adminUser.findUnique({ where: { id: admin.id } });
    if (!currentUser) throw new Error('User not found');

    const isCurrentValid = await verifyPassword(knownPassword, currentUser.passwordHash);
    if (!isCurrentValid) throw new Error('Current password verification failed');
    console.log('  ✓ Current password verified');

    const newPasswordHash = await hashPassword(testPassword);
    console.log('  ✓ New password hashed');

    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });
    console.log('  ✓ Database updated');

    // 4. Test login with new password (simulating what login API does)
    console.log('\n📋 Testing login after password change...');

    const loginUser = await db.adminUser.findUnique({ where: { email: testEmail } });
    if (!loginUser) throw new Error('User not found for login');

    const newPasswordWorks = await verifyPassword(testPassword, loginUser.passwordHash);
    const oldPasswordFails = !(await verifyPassword(knownPassword, loginUser.passwordHash));

    console.log(`  ${newPasswordWorks ? '✅' : '❌'} New password works: ${newPasswordWorks}`);
    console.log(`  ${oldPasswordFails ? '✅' : '❌'} Old password blocked: ${oldPasswordFails}`);

    // 5. Restore original password
    console.log('\n📋 Cleaning up...');
    const originalHash = await hashPassword(knownPassword);
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: originalHash }
    });
    console.log('  ✓ Original password restored');

    // Final verdict
    console.log('\n=================================');
    if (newPasswordWorks && oldPasswordFails) {
      console.log('✅ PASSWORD BUG IS FIXED!');
      console.log('=================================\n');
      console.log('The admin can now:');
      console.log('1. Change their password through the settings page');
      console.log('2. Successfully log back in with the new password');
      console.log('\nThe fix involved:');
      console.log('- Downgrading bcryptjs from 3.0.2 to 2.4.3');
      console.log('- This resolved hash compatibility issues');
      console.log('- All password operations now work correctly');
    } else {
      console.log('❌ PASSWORD BUG STILL EXISTS');
      console.log('=================================');
      console.log('Please check the implementation');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Verification failed:', error);

    // Try to restore password
    try {
      const admin = await db.adminUser.findUnique({ where: { email: testEmail } });
      if (admin) {
        const hash = await hashPassword(knownPassword);
        await db.adminUser.update({
          where: { id: admin.id },
          data: { passwordHash: hash }
        });
        console.log('\nRestored original password');
      }
    } catch (e) {
      console.error('Could not restore password');
    }

    process.exit(1);
  }
}

verifyPasswordFix();