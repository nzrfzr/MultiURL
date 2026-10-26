import React from 'react';
import { OpenMode } from '../../core/types';

interface OpenModeSelectorProps {
  mode: OpenMode;
  onChangeMode: (mode: OpenMode) => void;
  delaySeconds: number;
  onChangeDelay: (val: number) => void;
  limit: number;
  onChangeLimit: (val: number) => void;
  disabled?: boolean;
}

export const OpenModeSelector: React.FC<OpenModeSelectorProps> = ({
  mode,
  onChangeMode,
  delaySeconds,
  onChangeDelay,
  limit,
  onChangeLimit,
  disabled,
}) => {
  const modes: { id: OpenMode; label: string }[] = [
    { id: 'open_all', label: 'Open all' },
    { id: 'interval', label: 'Intervals' },
    { id: 'after_load', label: 'After load' },
    { id: 'queue', label: 'Queue' },
  ];

  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>Open mode</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>Tasks continue in the background</span>
      </div>

      {/* Single horizontal row for segmented tabs + conditional input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
        {/* Segmented tab bar */}
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            gap: 3,
            padding: 3,
            backgroundColor: '#F1F5F9',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            boxSizing: 'border-box',
          }}
        >
          {modes.map((item) => {
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onChangeMode(item.id)}
                style={{
                  flex: 1,
                  height: '100%',
                  padding: '0 4px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  border: 'none',
                  borderRadius: 6,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease-out',
                  backgroundColor: isActive ? '#2563EB' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569',
                  boxShadow: isActive ? '0 1px 2px rgba(37,99,235,0.2)' : 'none',
                  opacity: disabled ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Conditional input on the same row */}
        {mode === 'interval' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, height: '100%' }}>
            <input
              type="number"
              min={0.5}
              max={300}
              step={0.5}
              value={delaySeconds}
              disabled={disabled}
              onChange={(e) => onChangeDelay(parseFloat(e.target.value) || 1)}
              style={{
                width: 48,
                height: '100%',
                padding: '0 4px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                textAlign: 'center',
                outline: 'none',
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: 11.5, color: '#64748B' }}>sec</span>
          </div>
        )}

        {mode === 'queue' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, height: '100%' }}>
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={limit}
              disabled={disabled}
              onChange={(e) => onChangeLimit(parseInt(e.target.value, 10) || 1)}
              style={{
                width: 48,
                height: '100%',
                padding: '0 4px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                textAlign: 'center',
                outline: 'none',
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: 11.5, color: '#64748B' }}>tabs</span>
          </div>
        )}
      </div>
    </div>
  );
};
