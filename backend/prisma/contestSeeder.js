const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Global Neural Arena...');

  // 1. Check if a contest already exists to avoid duplicates
  const existingContest = await prisma.contest.findFirst({
    where: { title: 'Global Neural Arena' }
  });

  if (existingContest) {
    console.log('Contest already exists! Re-initializing time...');
    const now = new Date();
    await prisma.contest.update({
      where: { id: existingContest.id },
      data: {
        startTime: new Date(now.getTime() - 5 * 60000), // 5 mins ago
        endTime: new Date(now.getTime() + 2 * 60 * 60000), // 2 hours from now
        status: 'active'
      }
    });
    console.log('Contest timer reset. Done.');
    return;
  }

  // 2. Fetch problems
  const easy = await prisma.problem.findMany({ where: { difficulty: 'Easy' }, take: 2 });
  const medium = await prisma.problem.findMany({ where: { difficulty: 'Medium' }, take: 2 });
  const hard = await prisma.problem.findMany({ where: { difficulty: 'Hard' }, take: 1 });

  const problems = [...easy, ...medium, ...hard];

  if (problems.length === 0) {
    console.error('No problems found in database! Please run seed:problems first.');
    return;
  }

  // 3. Create the Contest
  const now = new Date();
  const contest = await prisma.contest.create({
    data: {
      title: 'Global Neural Arena',
      description: 'Join the high-frequency neural contest. Solve complex algorithms under intense temporal constraints to climb the global leaderboard.',
      startTime: new Date(now.getTime() - 5 * 60000), // 5 mins ago
      endTime: new Date(now.getTime() + 2 * 60 * 60000), // 2 hours from now
      difficulty: 'Expert',
      status: 'active'
    }
  });

  console.log('Contest Created:', contest.title);

  // 4. Map the problems into contest_problems
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    await prisma.contestProblem.create({
      data: {
        contestId: contest.id,
        problemId: problem.id,
        points: (i + 1) * 100 // Scale points
      }
    });
    console.log(`Mapped problem: ${problem.title}`);
  }

  console.log('Contest seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
