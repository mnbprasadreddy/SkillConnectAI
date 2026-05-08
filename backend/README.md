# SkillConnect AI — Main Backend

Production-grade Node.js + Express backend for the SkillConnect AI platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon)
- **Auth**: Firebase Authentication
- **Real-Time**: Socket.IO
- **Code Execution**: Judge0 API

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Generate Prisma client
npx prisma generate

# 4. Push schema to database
npx prisma db push

# 5. Start development server
npm run dev
```

## API Endpoints

| Route | Base Path | Description |
|-------|-----------|-------------|
| Users | `/api/users` | Auth sync, profiles |
| Problems | `/api/problems` | CRUD, search, filter |
| Submissions | `/api/submissions` | Run/submit code |
| Interviews | `/api/interviews` | Session management |
| Analytics | `/api/analytics` | Dashboard data |
| Contests | `/api/contests` | Contest lifecycle |
| Recommendations | `/api/recommendations` | AI suggestions |
| Reports | `/api/reports` | AI interview reports |
| Roadmap | `/api/roadmap` | Learning path |

## Socket.IO Namespaces

- `/interview` — Live interview events
- `/contest` — Real-time leaderboard
- `/analytics` — Live analytics updates
