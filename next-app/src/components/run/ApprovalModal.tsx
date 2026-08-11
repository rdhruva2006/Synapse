'use client';

import React from 'react';

interface ApprovalModalProps {
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalModal({ onApprove, onReject }: ApprovalModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-card" style={{ width: '400px', padding: '32px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff' }}>Approval Required</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          The workflow requires manual approval to proceed to the next step.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button className="button-secondary" onClick={onReject}>Reject</button>
          <button className="button-primary" style={{ backgroundColor: 'var(--success-color)' }} onClick={onApprove}>Approve</button>
        </div>
      </div>
    </div>
  );
}