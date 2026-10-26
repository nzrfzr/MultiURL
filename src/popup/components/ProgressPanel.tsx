import React from 'react';
import { QueueProgress } from '../../core/types';

interface ProgressPanelProps {
  statusMessage: string;
  progress: QueueProgress;
  mode: string;
  limit: number;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({
  statusMessage,
  progress,
  mode,
  limit,
}) => {
  const percentage =
    progress.totalSelected > 0
      ? Math.round((progress.dispatched / progress.totalSelected) * 100)
      : 0;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxSizing: 'border-box',
      }}
    >
      {/* Top row: short label + dispatched count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
          Progress
        </span>
        <span style={{ fontSize: 11, color: '#64748B' }}>
          {progress.dispatched} / {progress.totalSelected} opened
          {mode === 'queue' && (
            <span style={{ marginLeft: 5, color: '#2563EB', fontWeight: 600 }}>
              · {progress.liveManagedTabs}/{limit} active
            </span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 4,
          backgroundColor: '#EEF2F6',
          borderRadius: 9999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            backgroundColor: '#2563EB',
            borderRadius: 9999,
            transition: 'width 0.25s ease-out',
          }}
        />
      </div>

      {/* Bottom row: counts left, status message right (small italic) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#64748B' }}>
          <span>
            Success: <strong style={{ color: '#0F172A', fontWeight: 600 }}>{progress.success}</strong>
          </span>
          <span>
            Failed: <strong style={{ color: progress.failed > 0 ? '#DC2626' : '#0F172A', fontWeight: 600 }}>{progress.failed}</strong>
          </span>
          <span>
            Remaining: <strong style={{ color: '#0F172A', fontWeight: 600 }}>{progress.remaining}</strong>
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            color: '#94A3B8',
            fontStyle: 'italic',
            maxWidth: 195,
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={statusMessage}
        >
          {statusMessage}
        </span>
      </div>
    </div>
  );
};
