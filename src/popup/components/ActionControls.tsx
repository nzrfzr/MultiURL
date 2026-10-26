import React from 'react';
import { QueueStatus } from '../../core/types';

interface ActionControlsProps {
  status: QueueStatus;
  selectedCount: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const actionBtnBase: React.CSSProperties = {
  height: 36,
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  cursor: 'pointer',
  transition: 'all 0.15s ease-out',
};

const secondaryBtn: React.CSSProperties = {
  ...actionBtnBase,
  padding: '0 16px',
  border: '1px solid #CBD5E1',
  backgroundColor: '#FFFFFF',
  color: '#334155',
};

export const ActionControls: React.FC<ActionControlsProps> = ({
  status,
  selectedCount,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isBusy = isRunning || isPaused;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36 }}>
      {/* Pause / Resume */}
      {isPaused ? (
        <button
          type="button"
          onClick={onResume}
          style={{
            ...secondaryBtn,
            backgroundColor: '#D97706',
            color: '#FFFFFF',
            borderColor: '#D97706',
          }}
        >
          Resume
        </button>
      ) : (
        <button
          type="button"
          onClick={onPause}
          disabled={!isRunning}
          style={{
            ...secondaryBtn,
            opacity: !isRunning ? 0.35 : 1,
            cursor: !isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          Pause
        </button>
      )}

      {/* Stop */}
      <button
        type="button"
        onClick={onStop}
        disabled={!isBusy}
        style={{
          ...secondaryBtn,
          opacity: !isBusy ? 0.35 : 1,
          cursor: !isBusy ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (isBusy) {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
            e.currentTarget.style.color = '#DC2626';
            e.currentTarget.style.borderColor = '#FECACA';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.color = '#334155';
          e.currentTarget.style.borderColor = '#CBD5E1';
        }}
      >
        Stop
      </button>

      {/* Primary button */}
      <button
        type="button"
        onClick={onStart}
        disabled={isBusy || selectedCount === 0}
        style={{
          ...actionBtnBase,
          flex: 1,
          padding: '0 16px',
          border: 'none',
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          cursor: isBusy || selectedCount === 0 ? 'not-allowed' : 'pointer',
          opacity: isBusy || selectedCount === 0 ? 0.4 : 1,
          boxShadow: '0 1px 3px rgba(37,99,235,0.25)',
        }}
        onMouseEnter={(e) => {
          if (!isBusy && selectedCount > 0) {
            e.currentTarget.style.backgroundColor = '#1D4ED8';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2563EB';
        }}
      >
        Open selected URLs
      </button>
    </div>
  );
};
