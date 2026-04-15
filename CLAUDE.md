# SilkChart Workflow Engine

## Project Overview
Crash-resilient workflow engine for AI agent task execution pipelines. NestJS backend with SQLite (WAL mode) for atomic state persistence, React frontend with real-time WebSocket updates.

## Commands
- `npm run dev` — Start both backend (3000) and frontend (5173) with hot-reload
- `cd backend && npm run dev` — Backend only
- `cd frontend && npm run dev` — Frontend only
- `cd backend && npm test` — Run all tests (resume, retry, fatal error)
- `cd backend && npx nest build` — Build backend
- `cd frontend && npx tsc --noEmit` — Type-check frontend

## Architecture

### Backend (NestJS)
```
backend/src/
  main.ts                    — Bootstrap, CORS
  app.module.ts              — Root module (DatabaseModule + WorkflowModule)
  database/
    database.module.ts       — Global module, runs migrations on init
    database.provider.ts     — better-sqlite3 connection (WAL mode, foreign keys)
    migrations.ts            — Schema creation (idempotent)
  workflow/
    workflow.module.ts       — Imports StepsModule
    workflow.controller.ts   — REST API (POST create, GET list, GET :id, POST :id/resume)
    workflow.service.ts      — THE CORE: execution loop, retry logic, crash resume on startup
    workflow.repository.ts   — All SQL queries. completeStep() is the crash-safety primitive
    workflow.gateway.ts      — socket.io WebSocket gateway for real-time events
    workflow.types.ts        — TypeScript types + DTO converters
  steps/
    steps.module.ts          — Registers all 5 handlers on init
    step-registry.service.ts — Maps step names to handler functions
    step.types.ts            — StepHandler interface, TransientError class, StepContext
    handlers/                — 5 mock step handlers (check-calendar, update-crm, etc.)
  shared/
    utils.ts                 — sleep, randomBetween, calculateBackoff (exp backoff + jitter)
```

### Frontend (React + Vite)
```
frontend/src/
  main.tsx          — QueryClient setup, React root
  App.tsx           — Socket hook + Layout + WorkflowList
  types.ts          — WorkflowDto, StepDto, STEP_LABELS
  api/
    client.ts       — Fetch wrapper with error handling
    workflows.ts    — API functions (list, get, create, resume)
  hooks/
    useSocket.ts    — socket.io connection + React Query invalidation on events
    useWorkflows.ts — useQuery + useMutation hooks for workflows
  components/
    Layout.tsx           — Header + main container
    WorkflowList.tsx     — List view with empty state
    WorkflowCard.tsx     — Card with status, progress bar, timeline, resume button
    StepTimeline.tsx     — Vertical timeline with status icons and duration
    StatusBadge.tsx      — Color-coded status pill
    ProgressBar.tsx      — Animated progress bar
    CreateWorkflowButton.tsx — Dropdown with workflow templates
```

### Critical Invariant
`WorkflowRepository.completeStep()` updates the step status AND advances `workflows.current_step` in a **single synchronous SQLite transaction**. This is the crash-safety primitive — everything depends on it.

## Data Flow
1. User creates workflow → POST /api/workflows
2. Controller calls service.createWorkflow() then fire-and-forget service.executeWorkflow()
3. Engine loops through steps, calling registered handlers from StepRegistry
4. After each step: atomic completeStep() transaction persists state
5. WebSocket emits update → frontend invalidates React Query cache → UI re-renders
6. On crash: onModuleInit() finds `status='running'` workflows and resumes them

## Error Handling
- `TransientError` → retry with exponential backoff + jitter (up to max_retries)
- Any other Error → fatal, stop workflow immediately, mark as failed
- Failed workflows can be resumed via POST /api/workflows/:id/resume

## Testing
Tests are in `backend/test/resume.e2e-spec.ts`. They directly instantiate the service with a mock gateway and tracking step handlers. Three scenarios:
1. **Resume after crash** — Crash at step 2, resume, verify only steps 3-4 execute
2. **Transient retry** — Step fails transiently twice, succeeds on 3rd attempt
3. **Fatal error** — Non-transient error stops workflow immediately

## Conventions
- Backend: NestJS decorators, constructor injection, repository pattern for SQL
- Frontend: React Query for server state, socket.io for real-time, Tailwind for styling
- Types: Shared between frontend/backend conceptually (WorkflowDto, StepDto) but not via package
- SQL: Raw queries in repository (no ORM), transactions for atomic operations
- Error types: Explicit TransientError class for retryable errors
- Step handlers: Pure async functions (StepContext) → StepResult
