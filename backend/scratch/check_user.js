const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'skillconnectai@gmail.com';
  console.log(`Checking for user: ${email}...`);
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (user) {
      console.log('User Found:', JSON.stringify(user, null, 2));
    } else {
      console.log('User NOT found in database.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
