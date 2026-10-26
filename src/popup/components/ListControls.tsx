import React from 'react';

interface ListControlsProps {
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDeleteSelected: () => void;
  onClear: () => void;
  disabled?: boolean;
  selectedCount: number;
  totalCount: number;
}

const controlBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '3px 6px',
  borderRadius: 5,
  cursor: 'pointer',
  fontSize: 11.5,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#64748B',
  transition: 'all 0.15s',
  display: 'inline-flex',
  alignItems: 'center',
};

export const ListControls: React.FC<ListControlsProps> = ({
  onSelectAll,
  onSelectNone,
  onDeleteSelected,
  onClear,
  disabled,
  selectedCount,
  totalCount,
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={onSelectAll}
          disabled={disabled || totalCount === 0}
          style={{
            ...controlBtn,
            opacity: disabled || totalCount === 0 ? 0.35 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled && totalCount > 0) {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          Select all
        </button>
        <button
          type="button"
          onClick={onSelectNone}
          disabled={disabled || selectedCount === 0}
          style={{
            ...controlBtn,
            opacity: disabled || selectedCount === 0 ? 0.35 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled && selectedCount > 0) {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          Select none
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={disabled || selectedCount === 0}
          style={{
            ...controlBtn,
            opacity: disabled || selectedCount === 0 ? 0.35 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled && selectedCount > 0) {
              e.currentTarget.style.backgroundColor = '#FEF2F2';
              e.currentTarget.style.color = '#DC2626';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          Delete selected
        </button>
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={disabled || totalCount === 0}
        style={{
          ...controlBtn,
          opacity: disabled || totalCount === 0 ? 0.35 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled && totalCount > 0) {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
            e.currentTarget.style.color = '#DC2626';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#64748B';
        }}
      >
        Clear all
      </button>
    </div>
  );
};
