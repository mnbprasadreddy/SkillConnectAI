const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Connection Check ---');
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to Neon PostgreSQL.');
    const userCount = await prisma.user.count();
    console.log(`Current users in DB: ${userCount}`);
  } catch (error) {
    console.error('❌ Connection FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
