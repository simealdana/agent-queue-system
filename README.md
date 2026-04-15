# SilkChart Workflow Engine

A crash-resilient workflow engine for AI agent task execution. Built with NestJS, React, SQLite, and WebSocket for real-time step-by-step visibility.

## Quick Start

```bash
# Install dependencies
npm run install:all
npm install

# Start both backend (port 3000) and frontend (port 5173)
npm run dev
```

Open http://localhost:5173 — click "New Workflow" to create an interview follow-up pipeline and watch the steps execute in real-time.

### Run Tests

```bash
cd backend
npm test
```

## Architecture

```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│   React + RQ    │◄────────────────►│     NestJS        │
│   (Vite)        │    REST API      │  Workflow Engine   │
└─────────────────┘◄────────────────►│                    │
                                     │  ┌──────────────┐  │
                                     │  │  StepRegistry │  │
                                     │  └──────┬───────┘  │
                                     │         │          │
                                     │  ┌──────▼───────┐  │
                                     │  │   SQLite WAL  │  │
                                     │  │  (crash-safe) │  │
                                     │  └──────────────┘  │
                                     └────────────────────┘
```

## Data Model

### `workflows` table — The workflow state machine

| Column | Type | Purpose |
|--------|------|---------|
| `id` | TEXT PK | UUIDv4 identifier |
| `name` | TEXT | Human-readable label (e.g. "Post-Interview Follow-up") |
| `status` | TEXT | `pending` → `running` → `completed` or `failed` |
| `current_step` | INTEGER | **Resume pointer** — index of the next step to execute |
| `total_steps` | INTEGER | Total step count for progress calculation |
| `context` | TEXT (JSON) | Accumulated output from all completed steps |
| `error` | TEXT | Error message if the workflow failed |
| `created_at` | TEXT | ISO-8601 timestamp |
| `updated_at` | TEXT | ISO-8601 timestamp |

### `workflow_steps` table — Individual step tracking

| Column | Type | Purpose |
|--------|------|---------|
| `id` | TEXT PK | UUIDv4 identifier |
| `workflow_id` | TEXT FK | Parent workflow (CASCADE delete) |
| `step_index` | INTEGER | Execution order (0-based, UNIQUE with workflow_id) |
| `name` | TEXT | Step handler name (e.g. "check-calendar") |
| `status` | TEXT | `pending` → `running` → `completed` or `failed` |
| `result` | TEXT (JSON) | Step output data |
| `error` | TEXT | Error message if the step failed |
| `attempt` | INTEGER | Current retry attempt number |
| `max_retries` | INTEGER | Maximum retry attempts for transient errors |
| `started_at` | TEXT | When execution began |
| `completed_at` | TEXT | When execution finished |
| `duration_ms` | INTEGER | Wall-clock execution time |

### Why this structure

**1. `current_step` as a resume pointer.** After a crash, the engine reads `current_step` and starts the execution loop from there. Steps before that index are guaranteed completed because `completeStep()` advances `current_step` in the same atomic SQLite transaction that marks the step as completed.

**2. `context` as accumulated JSON on the workflow row.** Each step reads context from prior steps and writes its output back. Storing this on the workflow row means resume is O(1) — we don't need to scan all completed steps to reconstruct the pipeline state.

**3. SQLite with WAL mode (not a JSON file).** The assignment allows a JSON file, but SQLite with WAL gives us atomic transactions — the core durability guarantee. If the process crashes between "mark step completed" and "advance current_step," neither write persists. This is impossible to guarantee with JSON file writes.

**4. `TransientError` as an explicit error class.** Step handlers opt-in to retryability by throwing `TransientError`. Any other error is fatal and stops the workflow immediately. This is safer than the inverse pattern where unknown errors might retry forever.

**5. Per-step `attempt` + `max_retries`.** Retry budget is tracked at the step level, so transient failures can be retried with exponential backoff + jitter without affecting other steps.

## Crash Recovery — How It Works

The crash-safety invariant is simple:

> `completeStep()` marks the step as `completed` **and** advances `workflow.current_step` in a **single synchronous SQLite transaction**.

Because better-sqlite3 is synchronous and SQLite transactions are atomic (WAL mode), either both writes land on disk or neither does. There is no partial-commit window.

**On startup**, `WorkflowService.onModuleInit()` queries for workflows with `status = 'running'` (interrupted by a crash) and resumes each one. The execution loop naturally skips completed steps by checking `step.status === 'completed'`.

**On manual resume** (for failed workflows), the failed step is reset to `pending` and the execution loop restarts from `current_step`, again skipping any completed steps.

## Error Handling

| Error Type | Behavior |
|-----------|----------|
| `TransientError` | Retry with exponential backoff + full jitter (base 500ms, cap 30s). Up to `max_retries` attempts. |
| Any other `Error` | **Fatal.** Step marked failed, workflow marked failed. User can resume after fixing the issue. |

## Mock Steps

The demo workflow simulates a post-interview AI agent pipeline:

1. **Check Calendar** — Verify interviewer availability (returns available slots)
2. **Update CRM** — Update candidate status to "interviewing"
3. **Generate Summary** — AI-generate interview summary with sentiment analysis
4. **Send Follow-up** — Send follow-up email via SendGrid
5. **Schedule Next** — Schedule next interview round

Each step simulates 500-2000ms of async work and returns realistic mock data.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workflows` | Create and start a new workflow |
| `GET` | `/api/workflows` | List all workflows with steps |
| `GET` | `/api/workflows/:id` | Get a single workflow with steps |
| `POST` | `/api/workflows/:id/resume` | Resume a failed workflow |

## Real-time Updates

The backend pushes `workflow:update` and `step:update` events via socket.io. The React frontend uses these to invalidate React Query caches, giving instant UI updates as each step completes.

## Tech Stack

- **Backend:** NestJS, TypeScript, better-sqlite3, socket.io
- **Frontend:** React 18, Vite, TanStack React Query, socket.io-client, Tailwind CSS
- **Testing:** Jest, direct database assertions

## What I'd Add With More Time

- **Workflow templates** — Define reusable step sequences as templates (JSON schema)
- **Step timeout** — Per-step timeout with automatic failure if exceeded
- **Parallel step execution** — DAG-based execution where independent steps run concurrently
- **Idempotency keys** — Pass unique keys to external APIs so retried steps don't cause duplicate side effects
- **Audit log** — Immutable append-only log of all state transitions for debugging
- **Authentication + multi-tenancy** — JWT auth, workflow ownership, team-based access
- **Metrics + observability** — Prometheus metrics (step duration histograms, retry rates, failure rates)
- **Webhook notifications** — Notify external systems when workflows complete or fail
- **Rate limiting** — Per-step rate limits for external API calls
- **UI enhancements** — Step result JSON viewer, workflow search/filter, dark/light theme toggle
