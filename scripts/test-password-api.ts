import { db } from '../lib/db';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';

async function testPasswordAPI() {
  try {
    console.log('=== Password API Test ===\n');

    // Find test admin user
    const testEmail = 'admin@backroomleeds.co.uk';
    const adminUser = await db.adminUser.findUnique({
      where: { email: testEmail }
    });

    if (!adminUser) {
      console.log('Test admin not found. Creating one...');

      // Create test admin
      const defaultPassword = 'admin123';
      const passwordHash = await hashPassword(defaultPassword);

      const newAdmin = await db.adminUser.create({
        data: {
          email: testEmail,
          name: 'Test Admin',
          passwordHash: passwordHash,
          role: 'admin',
          isActive: true
        }
      });

      console.log('Created test admin:', newAdmin.email);
      console.log('Default password:', defaultPassword);
      console.log('');

      // Test login with created admin
      const loginValid = await verifyPassword(defaultPassword, newAdmin.passwordHash);
      console.log('Can login with default password:', loginValid);
      console.log('');

    } else {
      console.log('Found existing admin:', adminUser.email);

      // Reset to known password first
      console.log('\n1. Resetting to known password (admin123)...');
      const knownPassword = 'admin123';
      const knownHash = await hashPassword(knownPassword);

      await db.adminUser.update({
        where: { id: adminUser.id },
        data: { passwordHash: knownHash }
      });

      // Verify reset worked
      const resetUser = await db.adminUser.findUnique({
        where: { id: adminUser.id }
      });

      const canLoginAfterReset = await verifyPassword(knownPassword, resetUser!.passwordHash);
      console.log('Can login with reset password:', canLoginAfterReset);

      // Now simulate password change like the API does
      console.log('\n2. Simulating API password change...');
      const currentPassword = knownPassword;
      const newPassword = 'NewSecurePassword456!';

      // Step 1: Verify current password (like API does)
      const currentUser = await db.adminUser.findUnique({
        where: { id: adminUser.id }
      });

      const isCurrentValid = await verifyPassword(currentPassword, currentUser!.passwordHash);
      console.log('Current password verified:', isCurrentValid);

      if (!isCurrentValid) {
        console.log('ERROR: Current password verification failed!');
        process.exit(1);
      }

      // Step 2: Hash new password (like API does)
      const newPasswordHash = await hashPassword(newPassword);
      console.log('New password hashed successfully');
      console.log('New hash:', newPasswordHash);

      // Step 3: Update database (like API does)
      const updatedUser = await db.adminUser.update({
        where: { id: adminUser.id },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      });

      console.log('Database updated successfully');
      console.log('Updated hash in DB:', updatedUser.passwordHash);
      console.log('Hashes match:', updatedUser.passwordHash === newPasswordHash);

      // Step 4: Test login with new password (like login API would)
      console.log('\n3. Testing login with new password...');
      const loginUser = await db.adminUser.findUnique({
        where: { email: testEmail }
      });

      if (!loginUser) {
        console.log('ERROR: User not found!');
        process.exit(1);
      }

      const canLoginWithNew = await verifyPassword(newPassword, loginUser.passwordHash);
      const canLoginWithOld = await verifyPassword(currentPassword, loginUser.passwordHash);

      console.log('Can login with new password:', canLoginWithNew);
      console.log('Can login with old password:', canLoginWithOld);

      if (!canLoginWithNew) {
        console.log('\nERROR: Cannot login with new password!');
        console.log('This is the bug we need to fix.');

        // Additional debugging
        console.log('\n4. Additional debugging...');
        console.log('Password being tested:', newPassword);
        console.log('Hash in database:', loginUser.passwordHash);
        console.log('Hash length:', loginUser.passwordHash.length);
        console.log('Hash starts with $2b$:', loginUser.passwordHash.startsWith('$2b$'));

        // Test if the hash itself is valid
        const bcrypt = require('bcryptjs');
        const directTest = await bcrypt.compare(newPassword, loginUser.passwordHash);
        console.log('Direct bcrypt.compare result:', directTest);

        // Test if we can create a new hash and it works
        const testHash = await bcrypt.hash(newPassword, 10);
        const testVerify = await bcrypt.compare(newPassword, testHash);
        console.log('Fresh hash and verify works:', testVerify);
      }

      // Restore original password
      console.log('\n5. Restoring original password...');
      const restoredHash = await hashPassword(knownPassword);
      await db.adminUser.update({
        where: { id: adminUser.id },
        data: { passwordHash: restoredHash }
      });

      const finalUser = await db.adminUser.findUnique({
        where: { id: adminUser.id }
      });

      const canLoginRestored = await verifyPassword(knownPassword, finalUser!.passwordHash);
      console.log('Original password restored:', canLoginRestored);
    }

    console.log('\n=== Test Complete ===');
    process.exit(0);

  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

testPasswordAPI();