import React from 'react';

export const Footer: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: '#94A3B8',
        height: 16,
      }}
    >
      <span>Tasks continue if you close this popup</span>
      <span style={{ color: '#CBD5E1' }}>•</span>
      <span>by</span>
      <span
        style={{
          color: '#2563EB',
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        nzrfzr
      </span>
    </div>
  );
};
