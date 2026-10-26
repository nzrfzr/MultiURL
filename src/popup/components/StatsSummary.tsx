import React from 'react';
import { UrlStats } from '../../core/types';

interface StatsSummaryProps {
  stats: UrlStats;
}

const StatItem: React.FC<{
  label: string;
  value: number;
  highlightColor?: string;
}> = ({ label, value, highlightColor }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: '100%',
    }}
  >
    <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>{label}</span>
    <span
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: highlightColor || '#0F172A',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
  </div>
);

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 34,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <StatItem label="Total" value={stats.total} highlightColor="#0F172A" />
      <div style={{ width: 1, height: 16, backgroundColor: '#E2E8F0' }} />
      <StatItem label="Valid" value={stats.valid} highlightColor="#059669" />
      <div style={{ width: 1, height: 16, backgroundColor: '#E2E8F0' }} />
      <StatItem label="Duplicates" value={stats.duplicates} highlightColor="#D97706" />
      <div style={{ width: 1, height: 16, backgroundColor: '#E2E8F0' }} />
      <StatItem label="Invalid" value={stats.invalid} highlightColor="#DC2626" />
    </div>
  );
};
