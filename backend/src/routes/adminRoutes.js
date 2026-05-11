// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Routes (Phase 1: Foundation Only)
// No CRUD management yet — only role system + user management.
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');
const prisma = require('../config/database');

const VALID_ROLES = ['user', 'admin', 'super_admin'];

// ─── GET /admin/stats — Basic admin health check ───────────────
router.get('/stats', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const [totalUsers, totalAdmins, totalProblems, totalInterviews] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: ['admin', 'super_admin'] } } }),
    prisma.problem.count(),
    prisma.interview.count(),
  ]);

  return response.success(res, {
    totalUsers,
    totalAdmins,
    totalProblems,
    totalInterviews,
    serverUptime: Math.floor(process.uptime()),
  }, 'Admin stats retrieved');
}));

// ─── GET /admin/users — Paginated user list (super_admin only) ─
router.get('/users', verifyToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const { search, role: roleFilter } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (roleFilter && VALID_ROLES.includes(roleFilter)) {
    where.role = roleFilter;
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skillLevel: true,
        accuracy: true,
        streak: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return response.paginated(res, {
    data: users,
    page,
    limit,
    totalCount,
  });
}));

// ─── PATCH /admin/users/:id/role — Change user role ────────────
router.patch('/users/:id/role', verifyToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id);
  const { role: newRole } = req.body;

  // Validate role value
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    return response.badRequest(res, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  // Prevent super_admin from demoting themselves
  if (targetUserId === req.user.id && newRole !== 'super_admin') {
    return response.badRequest(res, 'Super admin cannot demote themselves.');
  }

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return response.notFound(res, 'User');
  }

  // Prevent removing the last super_admin
  if (targetUser.role === 'super_admin' && newRole !== 'super_admin') {
    const superAdminCount = await prisma.user.count({ where: { role: 'super_admin' } });
    if (superAdminCount <= 1) {
      return response.badRequest(res, 'Cannot remove the last super admin from the platform.');
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log(`[AdminRoutes] Role changed: User ${updated.id} (${updated.email}) → ${newRole} | By: ${req.user.id}`);

  // Audit log (non-blocking)
  const adminLogService = require('../services/adminLogService');
  adminLogService.logAction(req.user.id, 'ROLE_CHANGE', 'user', updated.id, `${targetUser.role} → ${newRole}`);

  return response.success(res, updated, `User role updated to ${newRole}`);
}));

// ═══════════════════════════════════════════════════════════════
// Phase 2: Admin Problem Management
// ═══════════════════════════════════════════════════════════════

const adminProblemService = require('../services/adminProblemService');

// ─── GET /admin/problems — Paginated admin problem list ────────
router.get('/problems', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const { search, difficulty, archived } = req.query;

  const { problems, totalCount } = await adminProblemService.getAllProblemsAdmin({
    page, limit, search, difficulty, archived,
  });

  return response.paginated(res, { data: problems, page, limit, totalCount });
}));

// ─── GET /admin/problems/:id — Get problem details for editing ─
router.get('/problems/:id', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const problem = await adminProblemService.getProblemForEdit(parseInt(req.params.id));
  if (!problem) return response.notFound(res, 'Problem');
  return response.success(res, problem);
}));

// ─── POST /admin/problems — Create problem with test cases ─────
router.post('/problems', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const { title, description, difficulty, topic } = req.body;

  if (!title || !description || !difficulty || !topic) {
    return response.badRequest(res, 'Title, description, difficulty, and topic are required.');
  }

  try {
    const problem = await adminProblemService.createProblemWithTestCases(req.body);
    console.log(`[AdminRoutes] Problem created: ${problem.id} "${problem.title}" | By: ${req.user.id}`);
    return response.created(res, problem, 'Problem created successfully');
  } catch (err) {
    if (err.code === 'P2002') {
      return response.badRequest(res, 'A problem with this title already exists.');
    }
    throw err;
  }
}));

// ─── PUT /admin/problems/:id — Update problem ──────────────────
router.put('/problems/:id', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Problem');

  try {
    const updated = await adminProblemService.updateProblem(id, req.body);
    console.log(`[AdminRoutes] Problem updated: ${id} | By: ${req.user.id}`);
    return response.success(res, updated, 'Problem updated successfully');
  } catch (err) {
    if (err.code === 'P2002') {
      return response.badRequest(res, 'A problem with this title already exists.');
    }
    throw err;
  }
}));

// ─── PATCH /admin/problems/:id/archive — Toggle archive ────────
router.patch('/problems/:id/archive', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Problem');

  let result;
  if (existing.isArchived) {
    result = await adminProblemService.unarchiveProblem(id);
    console.log(`[AdminRoutes] Problem unarchived: ${id} | By: ${req.user.id}`);
  } else {
    result = await adminProblemService.archiveProblem(id);
    console.log(`[AdminRoutes] Problem archived: ${id} | By: ${req.user.id}`);
  }

  return response.success(res, result, `Problem ${result.isArchived ? 'archived' : 'restored'} successfully`);
}));

// ═══════════════════════════════════════════════════════════════
// Phase 3: Admin Test Case Management
// ═══════════════════════════════════════════════════════════════

const adminTestCaseService = require('../services/adminTestCaseService');

// ─── GET /admin/problems/:id/testcases — All test cases for a problem ─
router.get('/problems/:id/testcases', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const problemId = parseInt(req.params.id);
  const testCases = await adminTestCaseService.getTestCasesForProblem(problemId);
  return response.success(res, testCases);
}));

// ─── POST /admin/problems/:id/testcases — Add a test case ─────
router.post('/problems/:id/testcases', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const problemId = parseInt(req.params.id);
  const { input, expectedOutput } = req.body;

  if (!input || !expectedOutput) {
    return response.badRequest(res, 'Input and expected output are required.');
  }

  try {
    const testCase = await adminTestCaseService.addTestCase(problemId, req.body);
    console.log(`[AdminRoutes] Test case added to problem ${problemId} | By: ${req.user.id}`);
    return response.created(res, testCase, 'Test case added');
  } catch (err) {
    if (err.statusCode === 404) return response.notFound(res, 'Problem');
    throw err;
  }
}));

// ─── PUT /admin/testcases/:id — Update a test case ─────────────
router.put('/testcases/:id', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const updated = await adminTestCaseService.updateTestCase(id, req.body);
    console.log(`[AdminRoutes] Test case ${id} updated | By: ${req.user.id}`);
    return response.success(res, updated, 'Test case updated');
  } catch (err) {
    if (err.statusCode === 404) return response.notFound(res, 'Test case');
    throw err;
  }
}));

// ─── PATCH /admin/testcases/:id/archive — Toggle archive ───────
router.patch('/testcases/:id/archive', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.testCase.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Test case');

  let result;
  if (existing.isArchived) {
    result = await adminTestCaseService.unarchiveTestCase(id);
    console.log(`[AdminRoutes] Test case ${id} unarchived | By: ${req.user.id}`);
  } else {
    result = await adminTestCaseService.archiveTestCase(id);
    console.log(`[AdminRoutes] Test case ${id} archived | By: ${req.user.id}`);
  }

  return response.success(res, result, `Test case ${result.isArchived ? 'archived' : 'restored'}`);
}));

// ═══════════════════════════════════════════════════════════════
// Phase 4: Admin Contest Management
// ═══════════════════════════════════════════════════════════════

const adminContestService = require('../services/adminContestService');

// ─── GET /admin/contests — Paginated admin contest list ────────
router.get('/contests', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const { search, archived } = req.query;

  const { contests, totalCount } = await adminContestService.getAllContestsAdmin({
    page, limit, search, archived,
  });

  return response.paginated(res, { data: contests, page, limit, totalCount });
}));

// ─── GET /admin/contests/:id — Contest details for editing ─────
router.get('/contests/:id', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const contest = await adminContestService.getContestForEdit(parseInt(req.params.id));
  if (!contest) return response.notFound(res, 'Contest');
  return response.success(res, contest);
}));

// ─── POST /admin/contests — Create contest with problem mappings ─
router.post('/contests', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const { title, startTime, endTime, difficulty } = req.body;
  if (!title || !startTime || !endTime || !difficulty) {
    return response.badRequest(res, 'Title, start time, end time, and difficulty are required.');
  }
  try {
    const contest = await adminContestService.createContestWithProblems(req.body);
    console.log(`[AdminRoutes] Contest created: ${contest.id} "${contest.title}" | By: ${req.user.id}`);
    return response.created(res, contest, 'Contest created');
  } catch (err) {
    if (err.statusCode === 400) return response.badRequest(res, err.message);
    throw err;
  }
}));

// ─── PUT /admin/contests/:id — Update contest details ──────────
router.put('/contests/:id', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.contest.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Contest');
  try {
    const updated = await adminContestService.updateContest(id, req.body);
    console.log(`[AdminRoutes] Contest ${id} updated | By: ${req.user.id}`);
    return response.success(res, updated, 'Contest updated');
  } catch (err) {
    if (err.statusCode === 400) return response.badRequest(res, err.message);
    throw err;
  }
}));

// ─── PATCH /admin/contests/:id/archive — Toggle archive ────────
router.patch('/contests/:id/archive', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.contest.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Contest');

  let result;
  if (existing.isArchived) {
    result = await adminContestService.unarchiveContest(id);
    console.log(`[AdminRoutes] Contest ${id} unarchived | By: ${req.user.id}`);
  } else {
    result = await adminContestService.archiveContest(id);
    console.log(`[AdminRoutes] Contest ${id} archived | By: ${req.user.id}`);
  }

  return response.success(res, result, `Contest ${result.isArchived ? 'archived' : 'restored'}`);
}));

// ─── POST /admin/contests/:id/problems — Add problem to contest ─
router.post('/contests/:id/problems', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const contestId = parseInt(req.params.id);
  const { problemId, points } = req.body;
  if (!problemId) return response.badRequest(res, 'Problem ID is required.');

  try {
    const mapping = await adminContestService.addProblemToContest(contestId, parseInt(problemId), points);
    console.log(`[AdminRoutes] Problem ${problemId} added to contest ${contestId} | By: ${req.user.id}`);
    return response.created(res, mapping, 'Problem added to contest');
  } catch (err) {
    if (err.statusCode === 404) return response.notFound(res, err.message);
    if (err.code === 'P2002') return response.badRequest(res, 'Problem already in this contest.');
    throw err;
  }
}));

// ─── DELETE /admin/contests/:id/problems/:problemId — Detach mapping ─
router.delete('/contests/:id/problems/:problemId', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const contestId = parseInt(req.params.id);
  const problemId = parseInt(req.params.problemId);
  try {
    await adminContestService.removeProblemFromContest(contestId, problemId);
    console.log(`[AdminRoutes] Problem ${problemId} removed from contest ${contestId} | By: ${req.user.id}`);
    return response.success(res, null, 'Problem removed from contest');
  } catch (err) {
    if (err.code === 'P2025') return response.notFound(res, 'Contest-problem mapping');
    throw err;
  }
}));

// ═══════════════════════════════════════════════════════════════
// Phase 5: Admin Material Management
// ═══════════════════════════════════════════════════════════════

const adminMaterialService = require('../services/adminMaterialService');
const adminLogService = require('../services/adminLogService');

// ─── GET /admin/materials — Paginated admin material list ──────
router.get('/materials', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const { search, topic, archived } = req.query;

  const { materials, totalCount } = await adminMaterialService.getAllMaterialsAdmin({
    page, limit, search, topic, archived,
  });

  return response.paginated(res, { data: materials, page, limit, totalCount });
}));

// ─── GET /admin/materials/topics — Distinct topic list ─────────
router.get('/materials/topics', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const topics = await adminMaterialService.getDistinctTopics();
  return response.success(res, topics);
}));

// ─── GET /admin/materials/:id — Material details ───────────────
router.get('/materials/:id', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const material = await adminMaterialService.getMaterialById(parseInt(req.params.id));
  if (!material) return response.notFound(res, 'Material');
  return response.success(res, material);
}));

// ─── POST /admin/materials — Create material ───────────────────
router.post('/materials', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const material = await adminMaterialService.createMaterial(req.body);
    console.log(`[AdminRoutes] Material created: ${material.id} "${material.title}" | By: ${req.user.id}`);
    adminLogService.logAction(req.user.id, 'CREATE', 'material', material.id, material.title);
    return response.created(res, material, 'Material created');
  } catch (err) {
    if (err.statusCode === 400) return response.badRequest(res, err.message);
    throw err;
  }
}));

// ─── PUT /admin/materials/:id — Update material ────────────────
router.put('/materials/:id', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const updated = await adminMaterialService.updateMaterial(parseInt(req.params.id), req.body);
    console.log(`[AdminRoutes] Material ${updated.id} updated | By: ${req.user.id}`);
    adminLogService.logAction(req.user.id, 'UPDATE', 'material', updated.id, updated.title);
    return response.success(res, updated, 'Material updated');
  } catch (err) {
    if (err.statusCode === 404) return response.notFound(res, 'Material');
    throw err;
  }
}));

// ─── PATCH /admin/materials/:id/archive — Toggle archive ───────
router.patch('/materials/:id/archive', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Material');

  let result;
  if (existing.isArchived) {
    result = await adminMaterialService.unarchiveMaterial(id);
    console.log(`[AdminRoutes] Material ${id} unarchived | By: ${req.user.id}`);
    adminLogService.logAction(req.user.id, 'UNARCHIVE', 'material', id);
  } else {
    result = await adminMaterialService.archiveMaterial(id);
    console.log(`[AdminRoutes] Material ${id} archived | By: ${req.user.id}`);
    adminLogService.logAction(req.user.id, 'ARCHIVE', 'material', id);
  }

  return response.success(res, result, `Material ${result.isArchived ? 'archived' : 'restored'}`);
}));

// ═══════════════════════════════════════════════════════════════
// Phase 7: Admin Roadmap Management
// ═══════════════════════════════════════════════════════════════

const roadmapAIService = require('../services/roadmapAIService');

// ─── POST /admin/roadmaps/generate — Create roadmap via Gemini ──
router.post('/roadmaps/generate', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const { title, roleTrack, difficulty } = req.body;
  if (!title) return response.badRequest(res, 'Topic title is required');

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Check duplicate
  const existing = await prisma.roadmapTopic.findUnique({ where: { slug } });
  if (existing) return response.badRequest(res, `Roadmap for "${title}" already exists`);

  // Generate via Gemini
  const generated = await roadmapAIService.generateRoadmap(title, roleTrack || 'Full Stack', difficulty || 'Beginner');

  // Save topic
  const topic = await prisma.roadmapTopic.create({
    data: {
      title: generated.topic || title,
      slug,
      description: generated.description,
      totalModules: generated.totalModules,
      difficulty: difficulty || 'Beginner',
      roleTrack: roleTrack || 'Full Stack',
    },
  });

  // Save modules — include ALL new detailed content fields
  if (generated.modules && generated.modules.length > 0) {
    await prisma.roadmapModule.createMany({
      data: generated.modules.map((m, i) => ({
        topicId: topic.id,
        title:            m.title,
        description:      m.description      || '',
        difficulty:       m.difficulty       || 'Beginner',
        orderIndex:       m.orderIndex       ?? i,
        estimatedHours:   m.estimatedHours   || 2,
        concepts:         m.concepts         || [],
        milestones:       m.milestones       || [],
        checkpoints:      m.checkpoints      || [],
        // ─── AI detailed content ───
        theory:           m.theory           || null,
        examples:         m.examples         || [],
        codeSnippets:     m.codeSnippets     || [],
        bestPractices:    m.bestPractices     || [],
        commonMistakes:   m.commonMistakes    || [],
        interviewTips:    m.interviewTips     || [],
        miniExercises:    m.miniExercises     || [],
        practiceProblems: m.practiceProblems  || [],
        isLocked: i !== 0, // First module always unlocked
      })),
    });
  }

  console.log(`[AdminRoutes] Roadmap "${title}" generated with ${generated.totalModules} modules | By: ${req.user.id}`);
  adminLogService.logAction(req.user.id, 'CREATE', 'roadmap', topic.id, `${title} (${generated.totalModules} modules)`);

  // Return with modules
  const fullTopic = await prisma.roadmapTopic.findUnique({
    where: { id: topic.id },
    include: { modules: { orderBy: { orderIndex: 'asc' } } },
  });

  return response.created(res, fullTopic, 'Roadmap generated successfully');
}));

// ─── GET /admin/roadmaps — List all roadmap topics ──────────────
router.get('/roadmaps', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const topics = await prisma.roadmapTopic.findMany({
    include: {
      modules: { select: { id: true }, orderBy: { orderIndex: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return response.success(res, topics.map(t => ({
    ...t,
    moduleCount: t.modules.length,
    modules: undefined,
  })));
}));

// ─── POST /admin/roadmaps/:id/regenerate — Backfill content for existing roadmaps ──
// Useful for roadmaps created before the detailed content system was added.
// Deletes and recreates all modules with fresh Gemini content.
router.post('/roadmaps/:id/regenerate', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.roadmapTopic.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Roadmap topic');

  // Generate fresh content for this topic
  const generated = await roadmapAIService.generateRoadmap(
    existing.title,
    existing.roleTrack || 'Full Stack',
    existing.difficulty || 'Beginner',
  );

  // Delete old modules and recreate with full content
  await prisma.roadmapModule.deleteMany({ where: { topicId: id } });

  if (generated.modules && generated.modules.length > 0) {
    await prisma.roadmapModule.createMany({
      data: generated.modules.map((m, i) => ({
        topicId: id,
        title:            m.title,
        description:      m.description      || '',
        difficulty:       m.difficulty       || existing.difficulty || 'Beginner',
        orderIndex:       m.orderIndex       ?? i,
        estimatedHours:   m.estimatedHours   || 2,
        concepts:         m.concepts         || [],
        milestones:       m.milestones       || [],
        checkpoints:      m.checkpoints      || [],
        theory:           m.theory           || null,
        examples:         m.examples         || [],
        codeSnippets:     m.codeSnippets     || [],
        bestPractices:    m.bestPractices     || [],
        commonMistakes:   m.commonMistakes    || [],
        interviewTips:    m.interviewTips     || [],
        miniExercises:    m.miniExercises     || [],
        practiceProblems: m.practiceProblems  || [],
        isLocked: i !== 0,
      })),
    });
  }

  // Update totalModules count
  await prisma.roadmapTopic.update({
    where: { id },
    data: { totalModules: generated.modules.length },
  });

  console.log(`[AdminRoutes] Roadmap "${existing.title}" regenerated with ${generated.modules.length} modules | By: ${req.user.id}`);
  adminLogService.logAction(req.user.id, 'REGENERATE', 'roadmap', id, existing.title);

  return response.success(res, { regenerated: generated.modules.length }, 'Roadmap content regenerated successfully');
}));

// ─── PATCH /admin/roadmaps/:id/archive — Toggle archive ────────
router.patch('/roadmaps/:id/archive', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.roadmapTopic.findUnique({ where: { id } });
  if (!existing) return response.notFound(res, 'Roadmap topic');

  const updated = await prisma.roadmapTopic.update({
    where: { id },
    data: { isArchived: !existing.isArchived },
  });

  const action = updated.isArchived ? 'ARCHIVE' : 'UNARCHIVE';
  console.log(`[AdminRoutes] Roadmap ${id} ${action.toLowerCase()}d | By: ${req.user.id}`);
  adminLogService.logAction(req.user.id, action, 'roadmap', id, existing.title);

  return response.success(res, updated, `Roadmap ${updated.isArchived ? 'archived' : 'restored'}`);
}));

module.exports = router;

