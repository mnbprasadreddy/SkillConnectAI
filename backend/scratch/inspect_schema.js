const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Schema Inspection ---');
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
    console.log('Columns in "users" table:', JSON.stringify(columns, null, 2));

    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users'
    `;
    console.log('Indexes in "users" table:', JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('Error inspecting schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
