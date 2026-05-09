# SkillConnect AI: Complete Rebuild Blueprint

This guide contains the exact steps, dependencies, schemas, and configurations required to recreate the SkillConnect AI project completely from scratch in a new directory.

## 1. Project Initialization & Folder Structure

Create a new main directory and split it into `frontend` and `backend`.

```bash
mkdir skillconnect-ai
cd skillconnect-ai
mkdir backend
```

## 2. Backend Setup (Node.js + Express + Prisma)

### Initialize Backend
```bash
cd backend
npm init -y
```

### Install Dependencies
**Core Packages:**
```bash
npm install express cors dotenv helmet morgan compression axios winston
npm install firebase-admin socket.io express-rate-limit express-validator
```

**Database (Prisma):**
```bash
npm install @prisma/client
npm install -D prisma nodemon prisma-dbml-generator
```

### Backend `.env` File
Create a `.env` file in the root of the `backend` folder:
```env
PORT=5000
NODE_ENV=development

# Neon PostgreSQL Connection String
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# Firebase Admin Service Account JSON (Minified string)
FIREBASE_SERVICE_ACCOUNT='{ "type": "service_account", "project_id": "...", "private_key_id": "...", "private_key": "...", "client_email": "...", "client_id": "...", "auth_uri": "...", "token_uri": "...", "auth_provider_x509_cert_url": "...", "client_x509_cert_url": "..." }'

# Judge0 API Keys (For Code Execution)
RAPIDAPI_KEY="your_rapidapi_key_here"
JUDGE0_HOST="judge0-ce.p.rapidapi.com"

# External AI / Recommendation API keys
OPENAI_API_KEY="your_openai_key"
```

### Prisma Schema (`backend/prisma/schema.prisma`)
Run `npx prisma init` to create the prisma folder, then overwrite `schema.prisma` with the following:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 Int                 @id @default(autoincrement())
  firebaseUid        String              @unique @map("firebase_uid")
  name               String
  email              String              @unique
  profileImage       String?             @map("profile_image")
  skillLevel         String              @default("beginner") @map("skill_level")
  accuracy           Float               @default(0)
  streak             Int                 @default(0)
  createdAt          DateTime            @default(now()) @map("created_at")
  updatedAt          DateTime            @updatedAt @map("updated_at")
  contestSubmissions ContestSubmission[]
  interviews         Interview[]
  learningRoadmaps   LearningRoadmap[]
  recommendations    Recommendation[]
  submissions        Submission[]

  @@map("users")
}

model Problem {
  id              Int              @id @default(autoincrement())
  title           String           @unique
  description     String
  difficulty      String
  topic           String
  constraints     String?
  examples        String?
  starterCode     String?          @map("starter_code")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  submissions     Submission[]
  testCases       TestCase[]
  contestProblems ContestProblem[]

  @@map("problems")
}

model TestCase {
  id             Int      @id @default(autoincrement())
  problemId      Int      @map("problem_id")
  input          String
  expectedOutput String   @map("expected_output")
  isHidden       Boolean  @default(false) @map("is_hidden")
  createdAt      DateTime @default(now()) @map("created_at")
  problem        Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("test_cases")
}

model Submission {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  problemId  Int      @map("problem_id")
  language   String
  sourceCode String   @map("source_code")
  result     String   @default("pending")
  runtime    String?
  memory     String?
  stdout     String?
  stderr     String?
  createdAt  DateTime @default(now()) @map("created_at")
  problem    Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("submissions")
}

model Interview {
  id                 Int                @id @default(autoincrement())
  userId             Int                @map("user_id")
  interviewType      String             @map("interview_type")
  difficulty         String
  duration           Int                @default(0)
  score              Float?
  confidenceScore    Float?             @map("confidence_score")
  communicationScore Float?             @map("communication_score")
  technicalScore     Float?             @map("technical_score")
  recordingUrl       String?            @map("recording_url")
  transcript         String?
  status             String             @default("in_progress")
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")
  analytics          InterviewAnalytic?
  user               User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  report             Report?

  @@map("interviews")
}

model InterviewAnalytic {
  id               Int       @id @default(autoincrement())
  interviewId      Int       @unique @map("interview_id")
  eyeContactScore  Float?    @map("eye_contact_score")
  postureScore     Float?    @map("posture_score")
  speechClarity    Float?    @map("speech_clarity")
  nervousnessScore Float?    @map("nervousness_score")
  speakingSpeed    Float?    @map("speaking_speed")
  emotionDetected  String?   @map("emotion_detected")
  createdAt        DateTime  @default(now()) @map("created_at")
  interview        Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)

  @@map("interview_analytics")
}

model Report {
  id              Int       @id @default(autoincrement())
  interviewId     Int       @unique @map("interview_id")
  strengths       String?
  weaknesses      String?
  recommendations String?
  aiSummary       String?   @map("ai_summary")
  createdAt       DateTime  @default(now()) @map("created_at")
  interview       Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)

  @@map("reports")
}

model Contest {
  id          Int                 @id @default(autoincrement())
  title       String
  description String?
  startTime   DateTime            @map("start_time")
  endTime     DateTime            @map("end_time")
  difficulty  String
  status      String              @default("upcoming")
  createdAt   DateTime            @default(now()) @map("created_at")
  submissions ContestSubmission[]
  problems    ContestProblem[]

  @@map("contests")
}

model ContestProblem {
  id        Int      @id @default(autoincrement())
  contestId Int      @map("contest_id")
  problemId Int      @map("problem_id")
  points    Int      @default(100)
  createdAt DateTime @default(now()) @map("created_at")

  contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([contestId, problemId])
  @@map("contest_problems")
}

model ContestSubmission {
  id             Int      @id @default(autoincrement())
  contestId      Int      @map("contest_id")
  userId         Int      @map("user_id")
  score          Float    @default(0)
  solvedCount    Int      @default(0) @map("solved_count")
  completionTime Int?     @map("completion_time")
  createdAt      DateTime @default(now()) @map("created_at")
  contest        Contest  @relation(fields: [contestId], references: [id], onDelete: Cascade)
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([contestId, userId])
  @@map("contest_submissions")
}

model LearningRoadmap {
  id                 Int      @id @default(autoincrement())
  userId             Int      @map("user_id")
  currentTopic       String?  @map("current_topic")
  progressPercentage Float    @default(0) @map("progress_percentage")
  completedTopics    String?  @map("completed_topics")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("learning_roadmaps")
}

model Recommendation {
  id                 Int      @id @default(autoincrement())
  userId             Int      @map("user_id")
  recommendationType String   @map("recommendation_type")
  content            String
  createdAt          DateTime @default(now()) @map("created_at")
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("recommendations")
}
```

Once pasted, run:
```bash
npx prisma generate
npx prisma db push
```

---

## 3. Frontend Setup (React + Vite)

### Initialize Frontend
Return to the root directory (`skillconnect-ai`) and generate a Vite app:
```bash
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### Install Dependencies
**Core Packages:**
```bash
npm install react-router-dom axios date-fns clsx tailwind-merge framer-motion lucide-react recharts
npm install firebase @monaco-editor/react socket.io-client
```

**Tailwind CSS Setup:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Tailwind Configuration (`frontend/tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#111116',
        primary: '#00f0ff',
        secondary: '#7000ff',
        accent: '#ff0055',
        muted: '#8892b0',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-purple': '0 0 10px rgba(112, 0, 255, 0.5), 0 0 20px rgba(112, 0, 255, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
```

### Frontend `.env` File
Create `.env` in the root of the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api

# Firebase Config
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_firebase_sender_id"
VITE_FIREBASE_APP_ID="your_firebase_app_id"
```

### Critical Setup: `api.js` Interceptor
To prevent the exact hydration issues we previously fixed, place this in `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost ? 'http://localhost:5000/api' : `${window.location.origin}/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('skillconnect_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'success' in payload) {
      if (!('data' in payload)) payload.data = null;
      return payload;
    }
    return { success: true, data: payload };
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('skillconnect_token');
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 4. Run Both Environments

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

This completes the absolute pin-to-pin core architecture replication guide!
