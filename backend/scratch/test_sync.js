const userService = require('../src/services/userService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('--- 🧪 Testing Database Sync Directly 🧪 ---');
  try {
    const testUid = 'test-uid-' + Date.now();
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Direct Test User';

    console.log(`Attempting to sync: UID=${testUid}, Email=${testEmail}, Name=${testName}`);
    
    const user = await userService.syncUser(testUid, testEmail, testName, null);
    
    console.log('✅ Success! User inserted into DB:');
    console.log(user);

  } catch (error) {
    console.error('❌ Sync Failed!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.code) console.error('Prisma Code:', error.code);
    if (error.meta) console.error('Prisma Meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
