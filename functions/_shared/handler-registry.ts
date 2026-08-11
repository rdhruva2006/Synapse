// functions/_shared/handler-registry.ts
import * as llmCall from './llm_call';
import * as httpRequest from './http_request';
import * as dbWrite from './db_write';
import * as notify from './notify';
import * as conditionalBranch from './conditional_branch';
import * as approvalGate from './approval_gate';

export const HANDLERS: Record<string, any> = {
  llm_call: llmCall,
  http_request: httpRequest,
  db_write: dbWrite,
  notify: notify,
  conditional_branch: conditionalBranch,
  approval_gate: approvalGate,
};
