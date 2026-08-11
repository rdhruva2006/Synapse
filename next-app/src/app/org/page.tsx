'use client';

export default function OrgPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h1 className="page-title" style={{ marginBottom: 0 }}>Organization Settings</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', color: '#fff' }}>Organization Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Name</label>
              <input type="text" defaultValue="Acme Corp AI" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Slug</label>
              <input type="text" defaultValue="acme-corp" disabled style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} />
            </div>
            <button className="button-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>Save Changes</button>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', color: '#fff' }}>Usage Quota</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Workflow Runs</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>450 / 1000</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', background: 'var(--accent-color)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Members</h2>
          <button className="button-secondary">+ Invite Member</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Role</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px', color: '#fff' }}>Alice Smith</td>
              <td style={{ padding: '12px', color: 'var(--text-muted)' }}>alice@acme.com</td>
              <td style={{ padding: '12px' }}><span style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--accent-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Admin</span></td>
              <td style={{ padding: '12px' }}><button style={{ color: 'var(--text-muted)' }}>Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}