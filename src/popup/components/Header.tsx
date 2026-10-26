import React from 'react';
import { QueueStatus } from '../../core/types';
import appIcon from '../../../icon/icon.png';

interface HeaderProps {
  status: QueueStatus;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  running: { label: 'Running', color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' },
  paused: { label: 'Paused', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  completed: { label: 'Completed', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  stopped: { label: 'Stopped', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' },
  failed: { label: 'Failed', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  idle: { label: 'Ready', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' },
};

export const Header: React.FC<HeaderProps> = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.idle;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* App Icon */}
        <img
          src={appIcon}
          alt="MultiURL Icon"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            objectFit: 'contain',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            flexShrink: 0,
          }}
        />

        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            MultiURL
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
            Detect, organize, and reliably open every link
          </div>
        </div>
      </div>

      {/* Pill status badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          backgroundColor: cfg.bg,
          padding: '3px 9px',
          borderRadius: 9999,
          border: `1px solid ${cfg.border}`,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: cfg.color,
            display: 'inline-block',
            flexShrink: 0,
            ...(status === 'running' ? { animation: 'pulse 2s infinite' } : {}),
          }}
        />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
};
