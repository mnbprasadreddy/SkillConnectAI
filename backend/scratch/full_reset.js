const admin = require('../src/config/firebase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupFirebase() {
  console.log('--- Cleaning Firebase Authentication ---');
  let userCount = 0;
  
  try {
    const listUsers = async (nextPageToken) => {
      const result = await admin.auth().listUsers(100, nextPageToken);
      const uids = result.users.map(user => user.uid);
      
      if (uids.length > 0) {
        await admin.auth().deleteUsers(uids);
        userCount += uids.length;
        console.log(`Deleted ${uids.length} users from Firebase.`);
      }
      
      if (result.pageToken) {
        await listUsers(result.pageToken);
      }
    };

    await listUsers();
    console.log(`✅ Total Firebase users deleted: ${userCount}`);
  } catch (error) {
    console.error('❌ Firebase cleanup failed:', error.message);
  }
}

async function cleanupDatabase() {
  console.log('--- Cleaning PostgreSQL Database ---');
  try {
    // Delete all users except potentially seeded ones if we wanted to keep them
    // But for a true clean slate, we'll empty the table.
    // Cascading deletes will handle related records in submissions, interviews, etc.
    const deleteResult = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} users from PostgreSQL.`);
    
    // Optional: Reset sequences for serial IDs if needed
    // await prisma.$executeRaw`ALTER SEQUENCE "users_id_seq" RESTART WITH 1`;
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
  }
}

async function main() {
  console.log('🚀 INITIALIZING FULL ENVIRONMENT RESET 🚀');
  console.log('Warning: This will delete ALL user data from Firebase and Neon PostgreSQL.');
  
  await cleanupFirebase();
  await cleanupDatabase();
  
  console.log('\n✨ ENVIRONMENT RESET COMPLETE ✨');
  console.log('You can now perform fresh registration testing.');
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
