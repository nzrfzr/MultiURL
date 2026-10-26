import React, { useMemo } from 'react';
import { QueueSessionState } from '../../core/types';
import { deriveProgress } from '../../core/scheduler';

interface MonitorViewProps {
  session: QueueSessionState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const MonitorView: React.FC<MonitorViewProps> = ({
  session,
  onPause,
  onResume,
  onStop,
}) => {
  const progress = useMemo(() => deriveProgress(session), [session]);
  const percentage =
    progress.totalSelected > 0
      ? Math.round((progress.dispatched / progress.totalSelected) * 100)
      : 0;

  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isCompleted = session.status === 'completed';
  const isStopped = session.status === 'stopped';

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.close) {
      window.close();
    }
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return {
        label: 'Running',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#DBEAFE',
      };
    }
    if (isPaused) {
      return {
        label: 'Paused',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
      };
    }
    if (isCompleted) {
      return {
        label: 'Completed',
        color: '#0D9488',
        bg: '#F0FDFA',
        border: '#CCFBF1',
      };
    }
    return {
      label: 'Stopped',
      color: '#64748B',
      bg: '#F1F5F9',
      border: '#E2E8F0',
    };
  };

  const badge = getStatusBadge();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 20px',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
        userSelect: 'none',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: badge.color,
              boxShadow: isRunning ? `0 0 0 3px ${badge.bg}` : 'none',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
            MultiURL Monitor
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: badge.color,
              backgroundColor: badge.bg,
              border: `1px solid ${badge.border}`,
              borderRadius: 9999,
              padding: '2px 8px',
            }}
          >
            {badge.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#64748B',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '2px 7px',
              textTransform: 'uppercase',
            }}
          >
            {session.mode.replace('_', ' ')}
          </span>
          <button
            onClick={handleClose}
            title="Close window"
            style={{
              all: 'unset',
              cursor: 'pointer',
              color: '#94A3B8',
              fontSize: 18,
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>
      </div>

      {/* 2. Progress Panel Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Progress header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>
              {percentage}%
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            <strong style={{ color: '#0F172A' }}>{progress.dispatched}</strong> / {progress.totalSelected} opened
            {session.mode === 'queue' && (
              <span style={{ marginLeft: 6, color: '#2563EB', fontWeight: 600 }}>
                · {progress.liveManagedTabs}/{session.limit} active slots
              </span>
            )}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 6,
            backgroundColor: '#EEF2F6',
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, percentage))}%`,
              backgroundColor: isCompleted ? '#0D9488' : '#2563EB',
              borderRadius: 9999,
              transition: 'width 0.25s ease-out',
            }}
          />
        </div>

        {/* Stats breakdown chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Success
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
              {progress.success}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: progress.failed > 0 ? '#FEF2F2' : '#F8FAFC',
              border: `1px solid ${progress.failed > 0 ? '#FECACA' : '#E2E8F0'}`,
              borderRadius: 6,
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 9, color: progress.failed > 0 ? '#DC2626' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Failed
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: progress.failed > 0 ? '#DC2626' : '#0F172A', marginTop: 1 }}>
              {progress.failed}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Remaining
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
              {progress.remaining}
            </div>
          </div>
        </div>

        {/* Real-time status message */}
        <div
          style={{
            fontSize: 11,
            color: '#64748B',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingTop: 2,
          }}
          title={session.statusMessage}
        >
          {session.statusMessage}
        </div>
      </div>

      {/* 3. Action Controls */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {isRunning && (
          <>
            <button
              onClick={onPause}
              style={{
                flex: 1,
                height: 34,
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.12s',
              }}
            >
              Pause
            </button>
            <button
              onClick={onStop}
              style={{
                flex: 1,
                height: 34,
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#DC2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.12s',
              }}
            >
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={onResume}
              style={{
                flex: 1,
                height: 34,
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#D97706',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Resume
            </button>
            <button
              onClick={onStop}
              style={{
                flex: 1,
                height: 34,
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#DC2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Stop
            </button>
          </>
        )}

        {(isCompleted || isStopped) && (
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              height: 34,
              backgroundColor: '#2563EB',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
};
