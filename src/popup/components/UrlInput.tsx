import React from 'react';

interface UrlInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <label htmlFor="url-textarea" style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}>
          URLs
        </label>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>One URL per line</span>
      </div>

      {/* Textarea */}
      <textarea
        id="url-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`https://example.com\nhttps://www.google.com\nexample.org`}
        style={{
          width: '100%',
          height: 72,
          padding: '7px 10px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 11.5,
          lineHeight: 1.5,
          color: '#1E293B',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D8E0EC',
          borderRadius: 10,
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          ...(disabled ? { backgroundColor: '#F8FAFC', color: '#94A3B8' } : {}),
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#2563EB';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#D8E0EC';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {/* Helper text */}
      <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 3 }}>
        Supports http(s)://, www., bare domains, and common separators
      </div>
    </div>
  );
};
