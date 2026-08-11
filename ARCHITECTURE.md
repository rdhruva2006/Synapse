# AI Workflow Builder Architecture

This document explains the schema reasoning, the dual-layer permission model, and the implementation of the approval gate pause/resume mechanic.

## 1. Schema Reasoning: The Graph Model

Workflows are modeled as Directed Graphs rather than linear lists or simple arrays.

**Tables Involved:**
- `workflow_steps` (Nodes): Represents the configuration and type of a step (e.g., `llm_call`, `http_request`).
- `workflow_edges` (Edges): Defines the execution path. Contains `source_step_id`, `target_step_id`, and `edge_type` (`default`, `if_true`, `if_false`).

**Why this approach?**
1. **Branching**: A linear array (`next_step_id`) fails immediately when you introduce conditional branching (if/else). Edges allow a node to have multiple outgoing paths.
2. **Cycles**: While we cap execution limits to prevent infinite loops, an edge-based graph natively supports loops (e.g., retry logic or pagination flows) without complex self-referencing columns.
3. **UI Integration**: React Flow (the visual builder) naturally maps to a Node/Edge architecture. The database schema perfectly mirrors the frontend data structure, eliminating complex translation layers.

---

## 2. Dual-Layer Permission Model

The platform uses a strict multi-tenant SaaS model implemented entirely at the database row level (Hasura RLS).

### Layer 1: Data Isolation (Tenant Boundaries)
- **Concept**: A user can never see or modify data belonging to an organization they are not a member of.
- **Implementation**: Every core table (`workflows`, `workflow_runs`, etc.) has an `org_id` foreign key.
- **Hasura Rule**: The permissions engine applies a filter checking the `org_members` junction table:
  `{ "organization": { "members": { "user_id": { "_eq": "X-Hasura-User-Id" } } } }`
- **Result**: Complete tenant isolation at the API level.

### Layer 2: Role-Based Access Control (RBAC within the Org)
- **Concept**: Within an organization, members have specific capabilities (`owner`, `editor`, `viewer`).
- **Implementation**: We check the `role` column in the `org_members` table.
- **Hasura Rules**: 
  - `owner`: Has `check: { "role": { "_in": ["owner"] } }` on destructive or sensitive actions (like deleting workflows or updating billing).
  - `editor`: Can Insert/Update/Delete workflows and steps, but cannot delete the organization.
  - `viewer`: Only has `Select` permissions. Any attempt to mutate data throws a GraphQL error.
- **Action Level**: Serverless functions (like `/approve-step`) manually execute this Layer 2 check by querying the user's role before processing the business logic.

---

## 3. Approval Gate: Pause & Resume Mechanics

The most complex feature of the engine is the ability to halt execution in the middle of a graph, wait for a human, and resume securely.

### How it works
1. **The Pause**:
   - The engine loop evaluates an `approval_gate` step handler.
   - The handler returns `{ success: true, pause: true }`.
   - The engine detects the `pause` flag, updates the `step_run` status to `waiting_approval`, updates the `workflow_run` to `paused`, and **terminates the execution loop**.
   - The node process exits, consuming zero compute resources while waiting.

2. **The Subscription**:
   - The UI listens via a GraphQL WebSocket subscription for any `step_runs` with `status == "waiting_approval"`.
   - When detected, the Approval Modal is presented to the user.

3. **The Resume**:
   - The user clicks "Approve", invoking the `/approve-step` Hasura Action.
   - The Action function verifies the user's role (Layer 2).
   - It updates the step status to `approved`.
   - It queries `workflow_edges` to find the `target_step_id` where `source_step_id` is the approval gate.
   - It updates the `workflow_run` to `running`.
   - Finally, it triggers `executeFromStep(runId, nextStepId)` — restarting the engine loop exactly where it left off, passing the baton to the next node in the graph.
