import React from 'react';
import { UrlEntry, UrlOutcome } from '../../core/types';
import { Check, AlertCircle, X, Loader2 } from 'lucide-react';

interface UrlListProps {
  entries: UrlEntry[];
  entryOutcomes: Record<string, UrlOutcome>;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const UrlList: React.FC<UrlListProps> = ({
  entries,
  entryOutcomes,
  onToggleSelect,
  onRemove,
  disabled,
}) => {
  if (entries.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '16px 12px',
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: 11.5,
          height: 104,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        No URLs entered yet. Paste links above to get started.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        height: 104,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {entries.map((entry, index) => {
          const outcome = entryOutcomes[entry.id];
          const isSelected = entry.isSelected;
          const isLast = index === entries.length - 1;

          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                transition: 'background-color 0.1s',
              }}
            >
              {/* Row number */}
              <span
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  width: 16,
                  textAlign: 'right',
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {index + 1}
              </span>

              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                disabled={disabled}
                onChange={() => onToggleSelect(entry.id)}
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 4,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  margin: 0,
                  accentColor: '#2563EB',
                }}
              />

              {/* URL text */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  title={entry.raw}
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 11.5,
                    color: entry.isValid ? '#1E293B' : '#DC2626',
                    textDecoration: entry.isValid ? 'none' : 'line-through',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.normalizedUrl || entry.raw}
                </span>

                {entry.isDuplicate && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      color: '#64748B',
                      backgroundColor: '#F1F5F9',
                      padding: '1px 5px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    dup
                  </span>
                )}
              </div>

              {/* Status indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {outcome === 'opening' && (
                  <Loader2 size={13} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
                )}
                {outcome === 'opened' && <Check size={13} color="#059669" strokeWidth={2.5} />}
                {outcome === 'failed' && <AlertCircle size={13} color="#DC2626" />}

                {!outcome && entry.isValid && <Check size={13} color="#059669" strokeWidth={2.5} />}
                {!outcome && !entry.isValid && <AlertCircle size={13} color="#DC2626" />}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  disabled={disabled}
                  title="Remove"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    color: '#CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    opacity: disabled ? 0.3 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.color = '#DC2626';
                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#CBD5E1';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
