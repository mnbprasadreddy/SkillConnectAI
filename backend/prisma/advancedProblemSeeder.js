const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Advanced Problem Seeding...');
  
  // Load data
  const files = ['seed_data_1.json', 'seed_data_2.json', 'seed_data_3.json'];
  let allProblems = [];

  for (const file of files) {
    const dataPath = path.join(__dirname, file);
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      allProblems = allProblems.concat(data);
    } else {
      console.warn(`⚠️ Warning: ${file} not found. Skipping.`);
    }
  }

  if (allProblems.length === 0) {
    console.error('❌ No problem data found to seed.');
    return;
  }

  console.log(`📦 Loaded ${allProblems.length} problems. Beginning injection...`);

  let totalTestcases = 0;

  for (const problem of allProblems) {
    const { testCases, inputFormat, outputFormat, ...problemData } = problem;

    // Append formats to description
    if (inputFormat) problemData.description += `\n\n**Input Format:**\n${inputFormat}`;
    if (outputFormat) problemData.description += `\n\n**Output Format:**\n${outputFormat}`;

    // Safely upsert problem
    const dbProblem = await prisma.problem.upsert({
      where: { title: problemData.title },
      update: problemData,
      create: problemData,
    });

    console.log(`✅ Upserted Problem: ${dbProblem.title}`);

    // Clean old testcases to avoid duplication
    await prisma.testCase.deleteMany({
      where: { problemId: dbProblem.id }
    });

    // Insert new testcases
    const testCasesToInsert = testCases.map(tc => ({
      problemId: dbProblem.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden
    }));

    await prisma.testCase.createMany({
      data: testCasesToInsert
    });

    totalTestcases += testCasesToInsert.length;
    console.log(`   ↳ Added ${testCasesToInsert.length} testcases (${testCases.filter(t => t.isHidden).length} hidden)`);
  }

  console.log('\n✨ Seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   Total Problems: ${allProblems.length}`);
  console.log(`   Total Testcases: ${totalTestcases}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
