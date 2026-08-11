'use client';

import React, { useState, useEffect } from 'react';
import ApprovalModal from '@/components/run/ApprovalModal';

export default function RunPage({ params }: { params: { workflowId: string } }) {
  const [status, setStatus] = useState('running');
  const [logs, setLogs] = useState<string[]>([]);
  const [showApproval, setShowApproval] = useState(false);

  useEffect(() => {
    // Mock WebSocket behavior
    setLogs(prev => [...prev, 'Starting workflow execution...']);
    setTimeout(() => setLogs(prev => [...prev, 'Running AI Process...']), 1000);
    setTimeout(() => {
      setLogs(prev => [...prev, 'Waiting for approval...']);
      setShowApproval(true);
    }, 2500);
  }, []);

  const handleApprove = () => {
    setShowApproval(false);
    setLogs(prev => [...prev, 'Approval granted. Continuing...']);
    setTimeout(() => {
      setLogs(prev => [...prev, 'Saving result...']);
    }, 1000);
    setTimeout(() => {
      setLogs(prev => [...prev, 'Workflow completed successfully.']);
      setStatus('completed');
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Run Workflow: {params.workflowId}</h1>
        <span style={{ 
          padding: '6px 12px', 
          borderRadius: '4px', 
          fontWeight: 'bold',
          backgroundColor: status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 211, 238, 0.1)',
          color: status === 'completed' ? 'var(--success-color)' : 'var(--accent-color)'
        }}>
          Status: {status.toUpperCase()}
        </span>
      </div>

      <div className="glass-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#fff' }}>Execution Logs</h2>
        <div style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.3)', 
          borderRadius: '8px', 
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          overflowY: 'auto'
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '8px', color: 'var(--text-main)' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>[{new Date().toLocaleTimeString()}]</span>
              {log}
            </div>
          ))}
          {status === 'running' && (
            <div style={{ color: 'var(--accent-color)', animation: 'pulse 1.5s infinite' }}>
              _
            </div>
          )}
        </div>
      </div>

      {showApproval && (
        <ApprovalModal 
          onApprove={handleApprove} 
          onReject={() => {
            setShowApproval(false);
            setLogs(prev => [...prev, 'Approval rejected. Workflow stopped.']);
            setStatus('failed');
          }} 
        />
      )}
    </div>
  );
}