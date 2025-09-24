import { db } from '../lib/db';
import bcrypt from 'bcryptjs';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';

async function testPasswordChange() {
  try {
    console.log('=== Password Change Test ===\n');

    // Test basic bcrypt functionality
    console.log('1. Testing bcrypt functionality:');
    const testPassword = 'TestPassword123!';
    const hash1 = await bcrypt.hash(testPassword, 10);
    const hash2 = await hashPassword(testPassword);

    console.log('   Original password:', testPassword);
    console.log('   Direct bcrypt hash:', hash1);
    console.log('   hashPassword() hash:', hash2);
    console.log('   Direct bcrypt verify:', await bcrypt.compare(testPassword, hash1));
    console.log('   verifyPassword() verify:', await verifyPassword(testPassword, hash2));
    console.log('   Cross-verify (direct hash with verifyPassword):', await verifyPassword(testPassword, hash1));
    console.log('   Cross-verify (hashPassword hash with direct bcrypt):', await bcrypt.compare(testPassword, hash2));
    console.log('');

    // Find test admin user
    console.log('2. Finding test admin user:');
    const testEmail = 'admin@backroomleeds.co.uk';
    const adminUser = await db.adminUser.findUnique({
      where: { email: testEmail }
    });

    if (!adminUser) {
      console.log('   ❌ Test admin not found. Please run: npx tsx scripts/seed-admin.ts');
      process.exit(1);
    }

    console.log('   Found admin:', adminUser.email);
    console.log('   Current password hash:', adminUser.passwordHash);
    console.log('');

    // Test current password verification
    console.log('3. Testing current password verification:');
    const currentPassword = 'admin123'; // Default password from seed
    const isCurrentValid = await verifyPassword(currentPassword, adminUser.passwordHash);
    console.log('   Current password valid:', isCurrentValid);

    if (!isCurrentValid) {
      console.log('   ⚠️  Current password does not match. The admin password may have been changed.');
    }
    console.log('');

    // Simulate password change
    console.log('4. Simulating password change:');
    const newPassword = 'NewPassword123!';
    const newPasswordHash = await hashPassword(newPassword);

    console.log('   New password:', newPassword);
    console.log('   New password hash:', newPasswordHash);
    console.log('   Hash length:', newPasswordHash.length);
    console.log('');

    // Update password in database
    console.log('5. Updating password in database:');
    const updatedUser = await db.adminUser.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    console.log('   ✅ Password updated successfully');
    console.log('   Updated hash in DB:', updatedUser.passwordHash);
    console.log('   Hashes match:', updatedUser.passwordHash === newPasswordHash);
    console.log('');

    // Verify new password works
    console.log('6. Verifying new password:');
    const reloadedUser = await db.adminUser.findUnique({
      where: { email: testEmail }
    });

    if (!reloadedUser) {
      console.log('   ❌ Could not reload user');
      process.exit(1);
    }

    const newPasswordValid = await verifyPassword(newPassword, reloadedUser.passwordHash);
    const oldPasswordValid = await verifyPassword(currentPassword, reloadedUser.passwordHash);

    console.log('   New password works:', newPasswordValid);
    console.log('   Old password works:', oldPasswordValid);
    console.log('   DB hash matches new hash:', reloadedUser.passwordHash === newPasswordHash);
    console.log('');

    // Test with direct bcrypt
    console.log('7. Direct bcrypt verification:');
    const directBcryptCheck = await bcrypt.compare(newPassword, reloadedUser.passwordHash);
    console.log('   Direct bcrypt check:', directBcryptCheck);
    console.log('');

    // Restore original password for future tests
    console.log('8. Restoring original password:');
    const originalHash = await hashPassword(currentPassword);
    await db.adminUser.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: originalHash,
        updatedAt: new Date()
      }
    });

    const finalCheck = await db.adminUser.findUnique({
      where: { email: testEmail }
    });

    if (finalCheck) {
      const restoredValid = await verifyPassword(currentPassword, finalCheck.passwordHash);
      console.log('   ✅ Original password restored:', restoredValid);
    }

    console.log('\n=== Test Complete ===');
    process.exit(0);

  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

testPasswordChange();