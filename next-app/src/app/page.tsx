'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#fff' }}>Welcome to AI Workflow Builder</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Design, execute, and monitor AI-powered workflows with our visual editor and robust execution engine.
        </p>
      </header>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff' }}>Quick Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px' }}>Active Workflows</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>12</div>
          </div>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px' }}>Running Jobs</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>4</div>
          </div>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px' }}>Failed Jobs (24h)</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error-color)' }}>1</div>
          </div>

        </div>
      </section>

      <section style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
        <Link href="/workflows">
          <button className="button-primary" style={{ fontSize: '1.1rem', padding: '12px 24px' }}>View Workflows</button>
        </Link>
        <Link href="/org">
          <button className="button-secondary" style={{ fontSize: '1.1rem', padding: '12px 24px' }}>Manage Org</button>
        </Link>
      </section>
    </div>
  );
}