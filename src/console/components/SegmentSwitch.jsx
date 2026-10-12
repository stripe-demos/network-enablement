
export function SegmentSwitch({ options, value, onChange }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--color-surface-2)',
        borderRadius: 8,
        padding: 4,
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          style={{
            flex: '1 0 0',
            padding: '4px 8px',
            borderRadius: 6,
            border: 'none',
            background: value === opt.id ? 'var(--color-surface-1)' : 'transparent',
            boxShadow: value === opt.id
              ? '0px 1px 1px 0px rgba(0,0,0,0.12), 0px 2px 5px 0px rgba(48,49,61,0.08)'
              : 'none',
            color: value === opt.id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.6,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 120ms ease',
            minWidth: 52,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
