const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.problem.count();
  console.log('Total Problems:', count);
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  
  if (users.length > 0) {
    const adminEmail = users[0].email;
    await prisma.user.updateMany({
      where: { email: adminEmail },
      data: { role: 'super_admin' }
    });
    console.log(`Updated ${adminEmail} to super_admin`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
