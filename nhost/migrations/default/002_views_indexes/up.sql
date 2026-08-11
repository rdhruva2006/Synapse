-- View: org_usage_stats
CREATE VIEW public.org_usage_stats AS
SELECT
  o.id AS org_id,
  o.name AS org_name,
  o.quota_limit,
  o.quota_used,
  o.quota_limit - o.quota_used AS quota_remaining,
  ROUND((o.quota_used::NUMERIC / NULLIF(o.quota_limit, 0)) * 100, 2) AS usage_percentage,
  COUNT(DISTINCT wr.id) AS total_runs_this_month,
  COALESCE(AVG(EXTRACT(EPOCH FROM (wr.completed_at - wr.started_at))), 0) AS avg_run_duration_seconds
FROM public.organizations o
LEFT JOIN public.workflow_runs wr ON wr.org_id = o.id AND wr.started_at >= date_trunc('month', NOW())
GROUP BY o.id, o.name, o.quota_limit, o.quota_used;

-- Indexes
CREATE INDEX idx_org_members_user_org ON public.org_members(user_id, org_id);
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_workflows_org_id ON public.workflows(org_id);
CREATE INDEX idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX idx_workflow_edges_workflow_id ON public.workflow_edges(workflow_id);
CREATE INDEX idx_workflow_edges_source ON public.workflow_edges(source_step_id);
CREATE INDEX idx_workflow_edges_target ON public.workflow_edges(target_step_id);
CREATE INDEX idx_workflow_runs_workflow_id ON public.workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_org_id ON public.workflow_runs(org_id);
CREATE INDEX idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX idx_workflow_runs_idempotency ON public.workflow_runs(idempotency_key);
CREATE INDEX idx_step_runs_workflow_run_id ON public.step_runs(workflow_run_id);
CREATE INDEX idx_step_runs_status ON public.step_runs(status);
CREATE INDEX idx_audit_log_org_id ON public.audit_log(org_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_webhook_rate_limits_workflow ON public.webhook_rate_limits(workflow_id, window_start);
