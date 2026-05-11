const prisma = require('./src/config/database');
const roadmapAIService = require('./src/services/roadmapAIService');

async function run() {
  try {
    const title = "Arrays";
    const slug = "arrays";
    
    const existing = await prisma.roadmapTopic.findUnique({ where: { slug } });
    if (existing) {
      console.log(`Roadmap "${title}" already exists.`);
      return;
    }

    console.log(`Generating roadmap for "${title}" via Gemini... This may take up to 20-30 seconds.`);
    const generated = await roadmapAIService.generateRoadmap(title, 'Full Stack', 'Beginner');

    console.log('Saving to DB...');
    const topic = await prisma.roadmapTopic.create({
      data: {
        title: generated.topic || title,
        slug,
        description: generated.description,
        totalModules: generated.totalModules,
        difficulty: 'Beginner',
        roleTrack: 'Full Stack',
      },
    });

    if (generated.modules && generated.modules.length > 0) {
      await prisma.roadmapModule.createMany({
        data: generated.modules.map((m, i) => ({
          topicId: topic.id,
          title: m.title,
          description: m.description || '',
          difficulty: m.difficulty || 'Beginner',
          orderIndex: m.orderIndex ?? i,
          estimatedHours: m.estimatedHours || 2,
          concepts: m.concepts || [],
          milestones: m.milestones || [],
          checkpoints: m.checkpoints || [],
          isLocked: i !== 0,
        })),
      });
    }

    console.log(`Successfully generated "${title}" roadmap with ${generated.totalModules} modules.`);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
