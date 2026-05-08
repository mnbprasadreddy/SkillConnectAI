const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 🛡️ SkillConnect AI DB Verification 🛡️ ---');
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Total Users in DB: ${await prisma.user.count()}`);
    console.log('Recent Registrations:');
    users.forEach((u, i) => {
      console.log(`${i+1}. [${u.createdAt.toISOString()}] ${u.name} (${u.email}) | UID: ${u.firebaseUid}`);
    });

    if (users.length === 0) {
      console.log('⚠️ No users found in database.');
    }
  } catch (error) {
    console.error('❌ Error verifying DB:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
