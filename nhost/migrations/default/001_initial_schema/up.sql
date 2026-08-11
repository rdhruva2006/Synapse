-- 1. organizations
CREATE TABLE public.organizations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  quota_limit       INTEGER NOT NULL DEFAULT 1000,
  quota_used        INTEGER NOT NULL DEFAULT 0,
  quota_period_start TIMESTAMPTZ DEFAULT date_trunc('month', NOW()),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. org_members
CREATE TABLE public.org_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- 3. workflows
CREATE TABLE public.workflows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES auth.users(id),
  webhook_secret TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. workflow_steps (fractional ordering)
CREATE TABLE public.workflow_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  step_order    NUMERIC NOT NULL,
  step_type     TEXT NOT NULL CHECK (step_type IN (
    'llm_call', 'http_request', 'db_write', 'notify',
    'conditional_branch', 'approval_gate'
  )),
  name          TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  position_x    FLOAT DEFAULT 0,
  position_y    FLOAT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. workflow_edges (graph connections)
CREATE TABLE public.workflow_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  source_step_id  UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  target_step_id  UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  edge_type       TEXT NOT NULL DEFAULT 'default' CHECK (edge_type IN (
    'default', 'if_true', 'if_false'
  )),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. workflow_triggers
CREATE TABLE public.workflow_triggers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id    UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  trigger_type   TEXT NOT NULL CHECK (trigger_type IN (
    'manual', 'webhook', 'scheduled', 'database_event'
  )),
  config         JSONB NOT NULL DEFAULT '{}',
  is_active      BOOLEAN DEFAULT true,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 7. workflow_runs
CREATE TABLE public.workflow_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id    UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES public.organizations(id),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'paused', 'completed', 'failed', 'cancelled'
  )),
  triggered_by   TEXT NOT NULL DEFAULT 'manual',
  started_by     UUID REFERENCES auth.users(id),
  idempotency_key TEXT UNIQUE,
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  error          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 8. step_runs
CREATE TABLE public.step_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id  UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  workflow_step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'skipped',
    'waiting_approval', 'approved', 'rejected'
  )),
  input            JSONB,
  output           JSONB,
  error            TEXT,
  attempt_count    INTEGER DEFAULT 0,
  token_count      INTEGER,
  cost_estimate    NUMERIC(10,6),
  latency_ms       INTEGER,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 9. notifications (event queue)
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id),
  step_run_id UUID REFERENCES public.step_runs(id),
  channel     TEXT NOT NULL DEFAULT 'log',
  payload     JSONB NOT NULL DEFAULT '{}',
  delivered   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 10. audit_log (immutable)
CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id),
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. webhook_rate_limits (token bucket)
CREATE TABLE public.webhook_rate_limits (
  workflow_id  UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (workflow_id, window_start)
);
