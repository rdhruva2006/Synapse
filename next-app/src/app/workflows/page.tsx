'use client';

import Link from 'next/link';

const mockWorkflows = [
  { id: '1', name: 'Document Processing AI', steps: 5, status: 'active' },
  { id: '2', name: 'Customer Support Bot', steps: 3, status: 'paused' },
  { id: '3', name: 'Data Pipeline', steps: 8, status: 'active' },
];

export default function WorkflowsPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Workflows</h1>
        <button className="button-primary">+ Create Workflow</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {mockWorkflows.map((wf) => (
          <Link href={`/workflow/${wf.id}`} key={wf.id}>
            <div className="glass-card" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>{wf.name}</h2>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem',
                  backgroundColor: wf.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(113, 113, 122, 0.1)',
                  color: wf.status === 'active' ? 'var(--success-color)' : 'var(--text-muted)'
                }}>
                  {wf.status}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {wf.steps} steps configured
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}