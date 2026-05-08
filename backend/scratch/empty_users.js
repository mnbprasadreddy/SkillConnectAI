const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Emptying Users Table ---');
  try {
    const result = await prisma.user.deleteMany({});
    console.log(`✅ Successfully deleted ${result.count} users.`);
    
    const count = await prisma.user.count();
    console.log(`Remaining users in DB: ${count}`);
    
    if (count === 0) {
      console.log('✨ Database is now COMPLETELY EMPTY and ready for fresh testing.');
    }
  } catch (error) {
    console.error('❌ Failed to empty users table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
