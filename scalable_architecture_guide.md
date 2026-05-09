# Scalable Project Architecture Guide

To ensure your new SkillConnect AI project remains maintainable, scalable, and easy to navigate as it grows, it is highly recommended to adopt a **Feature-Based Architecture** (often called Feature-Sliced Design for the frontend, and Modular Monolith for the backend).

Instead of grouping files by their *type* (e.g., putting all controllers in one folder and all components in another), you group them by their *domain* or *feature*.

Here is the ultimate, production-ready folder structure for your new project.

---

## 1. Backend Architecture (Node.js + Express + Prisma)

The backend should use a **Layered Service Architecture**. The Controller handles the HTTP request/response, the Service contains the business logic, and Prisma handles the database layer.

```text
backend/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Your data models
│   └── seeders/            # Database seed scripts
├── src/
│   ├── config/             # Environment & third-party config
│   │   ├── database.js     # Prisma client initialization
│   │   ├── env.js          # Environment variable validation
│   │   └── firebase.js     # Firebase Admin SDK init
│   │
│   ├── middleware/         # Global Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── rateLimiter.js
│   │
│   ├── modules/            # 🌟 FEATURE-BASED MODULES (Scalable Approach)
│   │   ├── auth/           
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   ├── problems/
│   │   │   ├── problems.routes.js
│   │   │   ├── problems.controller.js
│   │   │   └── problems.service.js
│   │   ├── contests/
│   │   └── interviews/
│   │
│   ├── utils/              # Shared helper functions
│   │   ├── apiResponse.js  # Standardized response wrapper
│   │   ├── logger.js       # Winston logger setup
│   │   └── judge0.js       # Code execution engine helper
│   │
│   ├── app.js              # Express app setup & global middlewares
│   └── server.js           # Server entry point (app.listen)
├── .env                    # Environment variables
└── package.json
```

### Why this backend structure?
* **Isolation:** If you need to modify the "Problems" feature, you only open the `modules/problems/` folder. You don't have to jump between a giant global `routes/` folder and a giant global `controllers/` folder.
* **Separation of Concerns:** Controllers *only* extract HTTP bodies and params. Services *only* do database queries and business logic. This makes writing automated tests much easier.

---

## 2. Frontend Architecture (React + Vite + Tailwind)

As React applications grow, flat `components` and `pages` folders become a nightmare. The industry standard for scalable React apps is **Feature-Sliced Design**.

```text
frontend/
├── public/                 # Static assets (favicons, manifest)
├── src/
│   ├── assets/             # Images, global CSS, fonts
│   │   └── index.css       # Tailwind entry point
│   │
│   ├── components/         # 🌟 GLOBAL SHARED UI COMPONENTS
│   │   ├── ui/             # Buttons, Inputs, Modals, Spinners
│   │   └── layout/         # Navbar, Sidebar, Footer
│   │
│   ├── config/             # Global configurations
│   │   └── firebase.js     # Firebase client init
│   │
│   ├── features/           # 🌟 FEATURE-BASED MODULES (The core of scalability)
│   │   ├── auth/
│   │   │   ├── components/ # Login form, Signup form
│   │   │   ├── context/    # AuthContext provider
│   │   │   └── api/        # Auth-specific API calls
│   │   ├── problems/
│   │   │   ├── components/ # ProblemCard, MonacoEditor wrapper
│   │   │   ├── hooks/      # useProblems, useSubmitCode
│   │   │   └── api/        # Fetch problems, submit code
│   │   └── dashboard/
│   │
│   ├── hooks/              # Global shared hooks (e.g., useTheme, useDebounce)
│   ├── lib/                # Third-party library wrappers (e.g., axios setup)
│   │   └── api.js          # Main Axios instance and interceptors
│   │
│   ├── pages/              # Routing entry points (Keep these very thin!)
│   │   ├── Home.jsx        # Imports components from features/dashboard
│   │   ├── Problems.jsx    # Imports components from features/problems
│   │   └── Workspace.jsx   
│   │
│   ├── routes/             # Route definitions and layout wrappers
│   │   └── AppRouter.jsx   # React Router DOM definitions
│   │
│   ├── utils/              # Pure helper functions (formatting, math)
│   │   └── formatters.js   
│   │
│   ├── App.jsx             # Main application wrapper (Providers)
│   └── main.jsx            # React DOM render entry point
├── .env
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### Why this frontend structure?
* **Scalable Feature Folders:** Everything related to the `auth` system lives in `src/features/auth/`. If you decide to remove or rewrite authentication, you just delete one folder. It doesn't pollute your global components.
* **Thin Pages:** Files in `src/pages/` should contain almost no logic. They should simply import a layout and the relevant feature components. 
* **Global UI vs Feature UI:** A `<Button />` goes in `src/components/ui/` because it's used everywhere. But a `<ProblemCard />` goes in `src/features/problems/components/` because it's ONLY used by the problems feature.

## 3. Top 3 Rules for Scaling

1. **Never mutate global state when local state is enough:** Only put data in global Context if multiple distinct features need it (like the currently logged-in User). If only the Problem Workspace needs the code string, keep it in a local `useState`.
2. **Absolute Imports:** Configure Vite and JSConfig to use absolute imports (e.g., `import Button from '@/components/ui/Button'`) so you don't end up with `../../../../components/Button`.
3. **API Normalization:** Always use interceptors (like the one we built) to normalize your API responses. Your components should never have to guess the shape of the data they are receiving.
