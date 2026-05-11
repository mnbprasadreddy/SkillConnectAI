// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Material Service (Isolated)
// Material CRUD with soft-delete. NEVER hard-deletes materials.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');

/**
 * Get all materials for admin view (including archived)
 */
const getAllMaterialsAdmin = async ({ page, limit, search, topic, archived }) => {
  const where = {};

  if (archived === 'true') where.isArchived = true;
  else if (archived === 'false') where.isArchived = false;

  if (topic) where.topic = topic;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { tags: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [materials, totalCount] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.material.count({ where }),
  ]);

  return { materials, totalCount };
};

/**
 * Get a single material for editing
 */
const getMaterialById = async (id) => {
  return await prisma.material.findUnique({ where: { id } });
};

/**
 * Create a new material
 */
const createMaterial = async (data) => {
  const { title, topic, difficulty, description, articleUrl, youtubeUrl, pdfUrl, tags } = data;

  if (!title || !topic) {
    throw Object.assign(new Error('Title and topic are required'), { statusCode: 400 });
  }

  return await prisma.material.create({
    data: {
      title,
      topic,
      difficulty: difficulty || 'Beginner',
      description: description || null,
      articleUrl: articleUrl || null,
      youtubeUrl: youtubeUrl || null,
      pdfUrl: pdfUrl || null,
      tags: tags || null,
    },
  });
};

/**
 * Update a material
 */
const updateMaterial = async (id, data) => {
  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Material not found'), { statusCode: 404 });
  }

  const allowedFields = ['title', 'topic', 'difficulty', 'description', 'articleUrl', 'youtubeUrl', 'pdfUrl', 'tags'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  return await prisma.material.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Archive a material (preserves recommendation history)
 */
const archiveMaterial = async (id) => {
  return await prisma.material.update({
    where: { id },
    data: { isArchived: true },
    select: { id: true, title: true, isArchived: true },
  });
};

/**
 * Unarchive a material
 */
const unarchiveMaterial = async (id) => {
  return await prisma.material.update({
    where: { id },
    data: { isArchived: false },
    select: { id: true, title: true, isArchived: true },
  });
};

/**
 * Get distinct topics for filter dropdown
 */
const getDistinctTopics = async () => {
  const materials = await prisma.material.findMany({
    select: { topic: true },
    distinct: ['topic'],
    orderBy: { topic: 'asc' },
  });
  return materials.map(m => m.topic);
};

module.exports = {
  getAllMaterialsAdmin,
  getMaterialById,
  createMaterial,
  updateMaterial,
  archiveMaterial,
  unarchiveMaterial,
  getDistinctTopics,
};
