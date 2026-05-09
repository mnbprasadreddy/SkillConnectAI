# 🤖 ANTIGRAVITY AGENT HANDOVER CONTEXT

**Project Name:** SkillConnect AI
**Description:** A futuristic, highly-interactive coding platform featuring real-time code execution, competitive programming contests, and an AI-driven interview engine.
**Design Aesthetic:** Dark mode, vibrant neon colors (cyan/purple), heavy use of glassmorphism (`bg-white/5`, `backdrop-blur`), and micro-animations via Framer Motion.

---

## 1. Technology Stack

### Frontend
*   **Core:** React 19, Vite, React Router DOM v7
*   **Styling:** Tailwind CSS (with custom neon shadows and glass gradients)
*   **Animations:** Framer Motion
*   **Editor:** `@monaco-editor/react`
*   **State/Data:** React Context API, Axios (configured with a strict interceptor)

### Backend
*   **Core:** Node.js, Express.js (CommonJS)
*   **Database:** PostgreSQL (hosted on Neon) managed via Prisma ORM (`@prisma/client` v6.9.0)
*   **Authentication:** Firebase Admin SDK (token verification) + Firebase Client (Frontend)
*   **Code Execution:** Judge0 API (RapidAPI)
*   **Real-time:** Socket.io (for live contest leaderboards and interview telemetry)

---

## 2. Core Architecture Rules (DO NOT VIOLATE)

### Data Hydration & API Interceptor
We recently resolved a massive architectural bug regarding inconsistent API payloads.
*   **Rule:** The frontend Axios interceptor (`src/services/api.js`) is the **Single Source of Truth** for payload normalization.
*   **Behavior:** It intercepts all backend responses and *always* returns a standardized object: `{ success: true, data: <actual_payload> }`.
*   **Rule:** Frontend components (e.g., `Problems.jsx`, `Dashboard.jsx`) must **NEVER** use defensive double-unwrapping logic. They should simply access `response.data` directly and safely fall back (e.g., `const problems = response?.data || [];`).

### Authentication Flow
*   **Rule:** Authentication is handled by Firebase. However, the Neon database *must* mirror the Firebase state.
*   **Behavior:** On login/signup (`AuthContext.jsx`), Firebase authenticates the user, and then a call is made to `POST /api/users/sync` to ensure the user exists in the PostgreSQL `users` table.
*   **Rule:** The frontend relies on `localStorage.getItem('skillconnect_token')`. If a 401 Unauthorized occurs, the interceptor automatically clears this token.

### UI / UX Constraints
*   **Rule:** The user is extremely protective of the UI. **DO NOT** redesign layouts, alter glassmorphism styles, or change the color palette unless explicitly ordered.
*   **Rule:** Fallback UI states (like empty arrays) must use the designated "No Neural Matches Found" glass-card design.

---

## 3. Database Schema Overview

The database is highly relational. Key models include:
*   `User`: Caches high-level stats (`accuracy`, `streak`). Tied via `firebaseUid`.
*   `Problem` / `TestCase`: The core coding library.
*   `Submission`: Junction between User and Problem, tracks language, source code, and Judge0 results.
*   `Contest` / `ContestProblem` / `ContestSubmission`: Manages active arenas, linked problems, and live user scoring.
*   `Interview` / `InterviewAnalytic` / `Report`: Manages AI mentorship sessions and telemetry scoring.

---

## 4. Current State & Known Quirks

*   **Port 5000 EADDRINUSE:** The backend runs on port 5000. If `nodemon` crashes with `EADDRINUSE`, it's because a zombie Node process held the port. (Solution: Use powershell to kill the process holding port 5000, then hit `rs` in nodemon).
*   **Nullish Coalescing for Stats:** In `Dashboard.jsx`, always use `??` instead of `||` for numeric stats (e.g., `data?.stats?.problemsSolved ?? 0`). Using `||` causes actual `0` values from the database to incorrectly trigger fallbacks.
*   **Frontend Port:** The Vite frontend typically runs on `localhost:5173`.

---

## 5. Directives for the Next AI Agent

When the user gives you this document, you must:
1. **Acknowledge** you understand the "SkillConnect AI" architecture.
2. **Prioritize** backend logic (Prisma controllers/services) over frontend UI redesigns.
3. **Respect** the existing `api.js` interceptor—do not attempt to re-engineer how the frontend parses JSON payloads.
4. **Check** the `AuthContext` and `apiHelpers` before adding new authentication or data-fetching logic.
5. **Always** implement error handling that logs to `console.error` and provides a graceful UI fallback.
