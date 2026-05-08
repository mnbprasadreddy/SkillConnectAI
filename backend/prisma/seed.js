const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Demo Users
  const user1 = await prisma.user.upsert({
    where: { email: 'alex.neural@example.com' },
    update: {},
    create: {
      firebaseUid: 'demo_firebase_uid_1',
      email: 'alex.neural@example.com',
      name: 'Alex Neural',
      skillLevel: 'advanced',
      accuracy: 82.5,
      streak: 14,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah.quantum@example.com' },
    update: {},
    create: {
      firebaseUid: 'demo_firebase_uid_2',
      email: 'sarah.quantum@example.com',
      name: 'Sarah Quantum',
      skillLevel: 'intermediate',
      accuracy: 65.0,
      streak: 7,
    },
  });

  console.log('✅ Users seeded');

  // 2. Create Problems
  const problems = [
    { title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', description: 'Find two numbers that add up to target.' },
    { title: 'Reverse Linked List', difficulty: 'Easy', topic: 'Linked Lists', description: 'Reverse a singly linked list.' },
    { title: 'Merge K Sorted Lists', difficulty: 'Hard', topic: 'Linked Lists', description: 'Merge k sorted linked lists.' },
    { title: 'Longest Palindromic Substring', difficulty: 'Medium', topic: 'Strings', description: 'Find the longest palindrome.' },
    { title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Arrays', description: 'Calculate how much water can be trapped.' },
    { title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Strings', description: 'Check if string has valid brackets.' },
  ];

  for (const p of problems) {
    await prisma.problem.upsert({
      where: { title: p.title },
      update: {},
      create: p,
    });
  }

  const dbProblems = await prisma.problem.findMany();
  console.log('✅ Problems seeded');

  // 3. Create Mock Submissions
  for (const user of [user1, user2]) {
    for (let i = 0; i < 15; i++) {
      const prob = dbProblems[Math.floor(Math.random() * dbProblems.length)];
      await prisma.submission.create({
        data: {
          userId: user.id,
          problemId: prob.id,
          language: 'python3',
          sourceCode: '# Demo code solution',
          result: Math.random() > 0.3 ? 'accepted' : 'wrong_answer',
          runtime: String(Math.floor(Math.random() * 100) + 10),
          memory: String(Math.floor(Math.random() * 5000) + 2000),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log('✅ Submissions seeded');

  // 4. Create Mock Interviews
  for (const user of [user1, user2]) {
    for (let i = 0; i < 3; i++) {
      const interview = await prisma.interview.create({
        data: {
          userId: user.id,
          interviewType: ['behavioral', 'technical', 'system_design'][i],
          difficulty: 'Medium',
          status: 'completed',
          score: Math.floor(Math.random() * 30) + 70,
          confidenceScore: Math.floor(Math.random() * 20) + 75,
          communicationScore: Math.floor(Math.random() * 20) + 70,
          technicalScore: Math.floor(Math.random() * 30) + 65,
          duration: Math.floor(Math.random() * 600) + 1200,
          transcript: 'Interviewer: Tell me about your projects. Candidate: I built a neural platform...',
          createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.interviewAnalytic.create({
        data: {
          interviewId: interview.id,
          eyeContactScore: Math.floor(Math.random() * 15) + 80,
          postureScore: Math.floor(Math.random() * 10) + 85,
          speechClarity: Math.floor(Math.random() * 15) + 80,
          nervousnessScore: Math.floor(Math.random() * 20) + 10,
          speakingSpeed: Math.floor(Math.random() * 20) + 140,
          emotionDetected: 'confident',
        },
      });

      await prisma.report.create({
        data: {
          interviewId: interview.id,
          aiSummary: 'Excellent performance demonstrating strong technical command and articulate communication.',
          strengths: 'Clear articulation, strong problem solving approach, confident posture.',
          weaknesses: 'Minor usage of filler words, could improve eye contact consistency.',
          recommendations: 'Practice the STAR method for behavioral questions and minimize filler words.',
        },
      });
    }
  }
  console.log('✅ Interviews seeded');

  // 5. Create Mock Recommendations
  for (const user of [user1, user2]) {
    await prisma.recommendation.create({
      data: {
        userId: user.id,
        recommendationType: 'problem',
        content: JSON.stringify({
          message: 'Focus on medium-difficulty String problems to improve your readiness.',
          suggestedProblems: dbProblems.filter(p => p.difficulty === 'Medium').slice(0, 2),
        }),
      },
    });
  }
  console.log('✅ Recommendations seeded');

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
