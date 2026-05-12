// ═══════════════════════════════════════════════════════════════
// Global Test Setup & Mocks
// ═══════════════════════════════════════════════════════════════

// Mock Environment Variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';

// ── Mock Firebase Admin ─────────────────────────────────────────
const mockAuthInstance = {
  verifyIdToken: jest.fn((token) => {
    if (token === 'valid-token') {
      return Promise.resolve({ uid: 'test-uid', email: 'test@example.com' });
    }
    if (token === 'admin-token') {
      return Promise.resolve({ uid: 'admin-uid', email: 'admin@example.com' });
    }
    return Promise.reject(new Error('Invalid token'));
  }),
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(() => mockAuthInstance),
  apps: {
    length: 1,
  },
}));

// ── Mock Prisma Client ──────────────────────────────────────────
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  interview: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  problem: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  testCase: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  contest: {
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  submission: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  contestSubmission: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  weakTopic: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  recommendationAnalytics: {
    createMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((promises) => Promise.all(promises)),
};

jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

// ── Mock AI Services ────────────────────────────────────────────
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  create: jest.fn(function () {
    return this;
  }),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
}));

// Silence logs during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

global.afterAll(async () => {
  // Clean up if necessary
});
