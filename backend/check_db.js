const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.submission.findMany({ include: { user: true } });
  console.log(JSON.stringify(subs.map(s => ({ 
    id: s.id, 
    userId: s.userId, 
    userFirebaseId: s.user?.firebaseUid, 
    result: s.result 
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
