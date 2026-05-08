const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Prisma Diagnostic Start ---');
  try {
    const userCount = await prisma.user.count();
    console.log(`Current User Count: ${userCount}`);

    const users = await prisma.user.findMany({ take: 5 });
    console.log('Sample Users:', JSON.stringify(users, null, 2));

    const testUid = `test_${Date.now()}`;
    const testEmail = `test_${Date.now()}@example.com`;

    console.log(`Attempting Upsert for ${testEmail}...`);
    const upserted = await prisma.user.upsert({
      where: { firebaseUid: testUid },
      update: { name: 'Updated Test User' },
      create: {
        firebaseUid: testUid,
        email: testEmail,
        name: 'Test User'
      }
    });
    console.log('Upsert Success:', JSON.stringify(upserted, null, 2));

    // Cleanup
    await prisma.user.delete({ where: { id: upserted.id } });
    console.log('Cleanup Success');

  } catch (error) {
    console.error('--- DIAGNOSTIC ERROR ---');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
