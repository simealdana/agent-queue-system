# Possible Improvements

Prioritized by impact for a live-interview AI agent system.

---

## Critical for Production

### Step Timeout with Cancellation

A step calling an LLM or external API could hang indefinitely. During a live interview, a stuck workflow blocks the entire candidate experience.

**What's needed:**
- Per-step configurable deadline (e.g., 30s for LLM inference, 10s for CRM updates)
- `AbortController`-style cancellation that kills the step cleanly
- Timed-out steps should be treated as transient errors (retry) or fatal (fail), depending on configuration
- Workflow-level cancellation: if an interview ends early, all in-flight steps should be aborted and the workflow marked as `cancelled`

**Without this:** A single slow LLM call can block a 6-step pipeline for minutes. The candidate waits, the recruiter waits, and there's no way to stop it.

**Implementation sketch:**
```typescript
// Per-step timeout in the execution loop
const result = await Promise.race([
  handler(ctx),
  sleep(step.timeoutMs).then(() => { throw new TimeoutError() }),
]);
```

---

### Idempotency Keys for External Side Effects

When retrying a `send-followup` step that calls SendGrid, the current engine will send duplicate emails. The same applies to CRM updates, calendar bookings, and any external mutation.

**What's needed:**
- Deterministic idempotency key per step execution: `{workflowId}:{stepName}:{attempt}`
- Passed to every external API call that supports idempotency (Stripe, SendGrid, most modern APIs)
- For APIs that don't support idempotency natively, a deduplication table that checks "did this key already succeed?"

**Without this:** A transient retry on `send-followup` sends the candidate the same email twice. A retry on `update-crm` creates duplicate records. These are real production incidents.

**Implementation sketch:**
```typescript
interface StepContext {
  workflowId: string;
  stepIndex: number;
  attempt: number;
  accumulated: AccumulatedContext;
  idempotencyKey: string; // `${workflowId}:${stepName}:${attempt}`
}
```

---

### Conditional Branching (DAG Execution)

Steps are strictly sequential. In practice, many steps are independent and some should be conditional.

**What's needed:**
- Model the step graph as a DAG (directed acyclic graph) instead of a flat array
- Independent steps run in parallel (e.g., "check calendar" and "update CRM" have no data dependency)
- Conditional edges: if the AI summary has low confidence (`< 0.7`), skip auto-followup and route to human review
- Each step declares its `dependsOn` (which prior steps it needs) and optional `condition` (a predicate on the accumulated context)

**Without this:** A 6-step pipeline that could complete in 3s (3 parallel pairs) takes 6s sequentially. More importantly, there's no way to express "only send the follow-up if the summary was positive" without hardcoding logic in the handler itself.

**Implementation sketch:**
```typescript
interface StepDefinition {
  name: string;
  dependsOn: string[];        // step names that must complete first
  condition?: (ctx: AccumulatedContext) => boolean;
}

// Execution: topological sort, run steps whose dependencies are all met
```

**Data model change:** Replace `step_index` (linear order) with a `depends_on` JSON array. The execution loop becomes a topological sort that runs ready steps concurrently.

---

## Important for Operations

### Structured Observability

No metrics, no structured logging, no distributed tracing. When something is slow in production, there's no way to know which step, which workflow, or which external API caused it.

**What's needed:**
- **Metrics:** Step duration histograms (p50, p95, p99), retry rate by step name, workflow completion rate by template, active workflow gauge
- **Structured logging:** JSON logs with `workflowId`, `stepName`, `attempt`, `durationMs` on every state transition
- **Tracing:** OpenTelemetry spans per step, propagated to external API calls so you can trace a slow workflow end-to-end

**Without this:** When the recruiter reports "the follow-up email took 5 minutes," there's no way to determine if it was the LLM, SendGrid, or a retry storm. Debugging requires reading raw logs and guessing.

**Implementation sketch:**
```typescript
// Prometheus metrics in WorkflowService
const stepDuration = new Histogram({
  name: 'workflow_step_duration_seconds',
  help: 'Step execution duration',
  labelNames: ['step_name', 'status'],
});
```

---

### Webhook Notifications

External systems (Slack, ATS platforms, internal dashboards) need to know when a workflow completes, fails, or requires approval. Currently the only notification channel is the WebSocket, which requires an active browser session.

**What's needed:**
- Configurable webhook URLs per event type (`workflow.completed`, `workflow.failed`, `workflow.waiting`)
- Retry with exponential backoff for failed webhook deliveries
- Webhook signature verification (HMAC) so receivers can validate authenticity
- A webhook delivery log for debugging

**Without this:** If the recruiter closes the browser tab, they never learn that the workflow failed. The candidate never gets their follow-up email, and nobody knows until someone manually checks.

---

## Necessary for Multi-Tenancy

### Authentication and Workflow Ownership

No auth layer exists. Every workflow is visible to everyone. There's no concept of "who created this" or "who can see this."

**What's needed:**
- JWT-based authentication with refresh tokens
- `owner_id` and `team_id` columns on the `workflows` table
- RBAC: `admin` (full access), `member` (own team's workflows), `viewer` (read-only)
- Per-tenant rate limiting on the API
- Audit trail: who started, approved, restarted each workflow

**Without this:** One recruiting team can see, modify, or restart another team's workflows. There's no accountability for who approved what. In a multi-team organization, this is a non-starter.

**Data model change:**
```sql
ALTER TABLE workflows ADD COLUMN owner_id TEXT NOT NULL;
ALTER TABLE workflows ADD COLUMN team_id TEXT NOT NULL;
CREATE INDEX idx_workflows_team ON workflows(team_id, created_at DESC);
```
