#!/usr/bin/env npx tsx
import { generateToken, verifyToken } from '../src/lib/auth/jwt';

async function testJWT() {
  console.log('Testing JWT functionality');
  console.log('========================\n');

  // Test user data
  const testUser = {
    id: 'test-123',
    email: 'test@example.com',
    role: 'admin',
    name: 'Test User'
  };

  console.log('1. Generating token for test user...');
  const token = generateToken(testUser);
  console.log('Token generated:', token.substring(0, 50) + '...');

  console.log('\n2. Verifying the generated token...');
  const payload = verifyToken(token);
  
  if (payload) {
    console.log('✅ Token verified successfully!');
    console.log('Payload:', payload);
  } else {
    console.log('❌ Token verification failed!');
  }

  console.log('\n3. Testing invalid token...');
  const invalidPayload = verifyToken('invalid.token.here');
  
  if (!invalidPayload) {
    console.log('✅ Invalid token correctly rejected');
  } else {
    console.log('❌ Invalid token was accepted (this should not happen)');
  }

  console.log('\n4. Testing expired token...');
  // This is a token that's already expired
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.abc';
  const expiredPayload = verifyToken(expiredToken);
  
  if (!expiredPayload) {
    console.log('✅ Expired token correctly rejected');
  } else {
    console.log('❌ Expired token was accepted');
  }
}

testJWT();