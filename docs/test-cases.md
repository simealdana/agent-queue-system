# Test Cases

Automated test suite covering the workflow engine's core behaviors: crash recovery, error handling, human intervention, state management, and API operations.

Run with:
```bash
cd backend && npm test
```

**15 tests across 8 categories — all passing.**

---

## 1. Resume After Crash

The core crash-safety proof. Demonstrates that `completeStep()` — a single synchronous SQLite transaction — guarantees that completed steps are never re-executed after a crash.

### TC-1.1: Resumes from the last completed step — skips already-completed steps

**Setup:** Create a 5-step workflow. Inject a fatal error at step 2 (generate-summary).

**Phase 1 — Crash:**
- Execute workflow
- Steps 0-1 complete successfully
- Step 2 throws → workflow status = `failed`
- Steps 3-4 remain `pending`
- Context contains outputs from steps 0-1 only

**Phase 2 — Resume:**
- Reset failed step, re-execute
- Execution log records ONLY steps 2, 3, 4
- Steps 0-1 are NOT re-executed (the core crash-safety proof)
- Workflow reaches `completed`, `current_step` = 5
- Context contains all 5 step outputs

**Why this matters:** In production, if the process crashes between step 1 and step 2, on restart the engine reads `current_step` and `step.status` from SQLite. Because `completeStep()` atomically advances both, there's no partial state — the engine always knows exactly where to resume.

---

## 2. Transient Error Retry

Validates the retry mechanism with exponential backoff + jitter for recoverable errors (API timeouts, rate limits).

### TC-2.1: Retries transient errors and succeeds after backoff

**Setup:** Register update-crm handler that throws `TransientError` on attempts 1-2 and succeeds on attempt 3.

**Expects:**
- update-crm is attempted 3 times (logged in execution log)
- Workflow completes successfully
- Step's `attempt` counter = 3

### TC-2.2: Fails workflow after exhausting all retries

**Setup:** Register update-crm handler that always throws `TransientError`.

**Expects:**
- Step retries `max_retries + 1` times (4 total)
- After exhausting retries, step status = `failed`
- Workflow status = `failed`

**Backoff formula:** `min(30s, 500ms × 2^(attempt-1)) × random(0, 1)` — exponential with full jitter to prevent thundering herd.

---

## 3. Fatal Error Handling

Validates that unknown/non-transient errors stop the workflow immediately without retrying. This is safer than the inverse pattern where unknown errors might retry forever.

### TC-3.1: Stops immediately without retrying on non-transient error

**Setup:** Register update-crm handler that throws a regular `Error` (not TransientError).

**Expects:**
- Execution log shows only steps 0 and 1 (step 1 = the fatal one)
- No retry attempts on the fatal step
- Workflow status = `failed`, error message preserved
- Steps 2-4 remain `pending` (never reached)

**Design decision:** Step handlers opt-in to retryability by throwing `TransientError`. Any other error type is treated as fatal. This prevents infinite retry loops on bugs or configuration errors.

---

## 4. Dashboard Approval (Human Intervention)

Tests the in-app approval flow where the workflow pauses for human review and resumes only after explicit approval from the dashboard UI.

### TC-4.1: Pauses workflow at a WaitForApproval step

**Setup:** 4-step workflow with `human-review` at step 2 that throws `WaitForApproval` with type `dashboard`.

**Expects:**
- Steps 0-1 complete
- Step 2 status = `waiting`
- Workflow status = `waiting`
- Pending data (`summary: 'Good candidate'`) stored in step result
- `_approvalType = 'dashboard'` in step result
- Step 3 remains `pending`

### TC-4.2: Continues execution after approval

**Setup:** Same as TC-4.1, then call `approveWorkflow()`.

**Expects:**
- After approval, only step 3 (send-followup) executes
- Steps 0-2 are NOT re-executed
- All steps reach `completed`
- Workflow status = `completed`

---

## 5. External Link Approval

Tests the external approval flow where a unique token-based link is generated so someone outside the dashboard (e.g., a hiring manager) can approve via a shared URL.

### TC-5.1: Generates a token and pauses workflow

**Setup:** 3-step workflow with `external-approval` at step 1 that throws `WaitForApproval` with type `external`.

**Expects:**
- Step 0 completes
- Step 1 status = `waiting`
- Workflow status = `waiting`
- `_approvalType = 'external'` in step result
- `_token` is a non-empty UUID string

### TC-5.2: Can be approved by token and continues execution

**Setup:** Same as TC-5.1, extract the token from step result, then call `approveByToken(token)`.

**Expects:**
- `findStepByToken(token)` returns the correct step and workflow ID
- After approval, only step 2 (send-followup) executes
- Workflow status = `completed`

### TC-5.3: Rejects invalid tokens

**Setup:** Call `approveByToken('nonexistent-token')`.

**Expects:**
- Throws `NotFoundException`

---

## 6. Restart From Scratch

Tests the full reset + re-execution flow for completed or failed workflows. Used by the "Run Again" feature in the UI.

### TC-6.1: Resets all steps and context, re-executes from step 0

**Setup:** 5-step workflow that fails at step 2. Steps 0-1 already completed. Call `restartWorkflow()`.

**Expects:**
- ALL 5 steps execute (including previously completed steps 0-1)
- Execution log contains steps 0 through 4 in order
- Workflow status = `completed`, `current_step` = 5
- Context contains fresh outputs from all 5 steps

### TC-6.2: Clears previous context on restart

**Setup:** Workflow fails at step 1. Context has step 0 output. Call `repo.restartWorkflow()`.

**Expects:**
- Context = `{}` (empty)
- `current_step` = 0
- All steps: status = `pending`, result = null, attempt = 0

---

## 7. Context Accumulation

Validates that each step receives the accumulated output from all prior steps, enabling data flow through the pipeline (e.g., the follow-up email step can reference the AI summary from step 3).

### TC-7.1: Passes accumulated context from prior steps to subsequent steps

**Setup:** 5-step workflow where each handler records `ctx.accumulated` and returns `{ [stepName]: result }`.

**Expects:**
- Step 0 receives empty context `{}`
- Step 1 receives step 0's output
- Step 4 receives outputs from steps 0-3 (4 keys)
- Final workflow context has all 5 step outputs

**Type safety:** The `AccumulatedContext` type maps each step name to its known output shape, so handlers can access `ctx.accumulated['generate-summary']?.confidence` without unsafe casting.

---

## 8. Migration Runner

Tests the database schema migration system that ensures the SQLite schema is always in the correct state, even across version upgrades.

### TC-8.1: Applies migrations in order and records them in the ledger

**Expects:**
- `_migrations` table contains at least 2 rows
- Row 1: version = 1, name = `initial_schema`
- Row 2: version = 2, name = `add_waiting_status`

### TC-8.2: Does not re-apply already-applied migrations

**Setup:** Run `runner.run(migrations)` a second time.

**Expects:**
- No error thrown
- `_migrations` table still has exactly 2 rows (no duplicates)

### TC-8.3: Supports rollback

**Setup:** Roll back migration 2, then re-apply.

**Expects:**
- After rollback: `_migrations` has 1 row (version 1 only)
- After re-apply: `_migrations` has 2 rows again

---

## API Endpoints Reference

These endpoints are exercised by the tests above and available for external integrations:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workflows` | Create workflow (pending) |
| `POST` | `/api/workflows/run` | Create and start in one call |
| `GET` | `/api/workflows` | List all workflows |
| `GET` | `/api/workflows/:id` | Get workflow with steps |
| `PUT` | `/api/workflows/:id` | Update pending workflow |
| `POST` | `/api/workflows/:id/start` | Start a pending workflow |
| `POST` | `/api/workflows/:id/resume` | Resume a failed workflow |
| `POST` | `/api/workflows/:id/restart` | Re-run from scratch |
| `POST` | `/api/workflows/:id/approve` | Approve waiting step |
| `GET` | `/api/steps` | List available step handlers |

**Input validation:** All POST/PUT endpoints validate input using `class-validator` decorators (`@IsString`, `@IsArray`, `@MinLength`). Invalid payloads return 400 with descriptive error messages.

**Real-time updates:** All state changes emit `workflow:update` via WebSocket (socket.io), enabling live UI updates without polling.
