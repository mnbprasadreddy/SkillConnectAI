require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firebaseUid: true,
      name: true,
      email: true,
      skillLevel: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log('\n════════════════════════════════════════════');
  console.log('   NEON POSTGRESQL — users TABLE');
  console.log('════════════════════════════════════════════\n');
  console.table(users);
  console.log('\nTotal users:', users.length);

  const realUsers = users.filter((u) => !u.firebaseUid.startsWith('demo_'));
  const demoUsers = users.filter((u) => u.firebaseUid.startsWith('demo_'));
  console.log('Real Firebase users:', realUsers.length);
  console.log('Demo/seeded users:', demoUsers.length);

  if (realUsers.length > 0) {
    console.log('\n✅ REAL USERS FOUND IN DATABASE:');
    realUsers.forEach((u) => {
      console.log(`  → ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | UID: ${u.firebaseUid}`);
    });
  } else {
    console.log('\n❌ No real users found in database.');
  }

  await prisma.$disconnect();
})();
