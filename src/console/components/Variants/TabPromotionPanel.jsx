import { useState } from 'react';
import { CloseIcon } from '../icons';

const FONT_STACK = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const triggerStyle = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 9999,
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid var(--color-border-default)',
  background: '#1a1a1d',
  color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.15s ease, border-color 0.15s ease, color 0.15s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',
  fontFamily: FONT_STACK,
};

const panelStyle = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 10000,
  background: '#1a1a1d',
  border: '1px solid var(--color-border-default)',
  borderRadius: 10,
  padding: '10px 10px 8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
  transformOrigin: 'bottom right',
  transform: 'scale(0.9)',
  opacity: 0,
  pointerEvents: 'none',
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
  fontFamily: FONT_STACK,
  minWidth: 200,
};

const panelOpenStyle = {
  ...panelStyle,
  transform: 'scale(1)',
  opacity: 1,
  pointerEvents: 'auto',
};

const panelHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
};

const panelTitleStyle = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const sectionLabelStyle = {
  fontSize: 9,
  fontWeight: 600,
  color: '#4a4a52',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 4,
  paddingLeft: 2,
};

const closeBtnStyle = {
  width: 16,
  height: 16,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  borderRadius: 3,
  transition: 'color 0.15s ease',
};

const segmentedStyle = {
  display: 'flex',
  gap: 2,
  background: '#111113',
  borderRadius: 6,
  padding: 2,
};

const segmentedBtnStyle = {
  flex: 1,
  height: 24,
  padding: '0 10px',
  border: 'none',
  borderRadius: 5,
  fontSize: 11,
  fontWeight: 500,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

/**
 * Bottom-right floating panel for switching the overflow-tab promotion variant.
 *
 * @param {{ value: 'last' | 'first', onChange: (v: 'last' | 'first') => void }} props
 */
export function TabPromotionPanel({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const options = [
    { id: 'first', label: 'First' },
    { id: 'last', label: 'Last' },
  ];

  return (
    <>
      <button
        id="configTrigger"
        className={open ? 'hidden' : ''}
        onClick={() => setOpen(true)}
        aria-label="Open tab promotion picker"
        style={triggerStyle}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="1.5" y="4.5" width="13" height="2.5" rx="1.25" />
          <rect x="1.5" y="9" width="8" height="2.5" rx="1.25" />
        </svg>
      </button>

      <div style={open ? panelOpenStyle : panelStyle}>
        <div style={panelHeaderStyle}>
          <div style={panelTitleStyle}>Tab promotion</div>
          <button style={closeBtnStyle} onClick={() => setOpen(false)} aria-label="Close">
            <CloseIcon size={10} />
          </button>
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={sectionLabelStyle}>Invoked tab placement</div>
          <div style={segmentedStyle}>
            {options.map((opt) => (
              <button
                key={opt.id}
                className={`config-toggle${value === opt.id ? ' active' : ''}`}
                onClick={() => onChange(opt.id)}
                style={segmentedBtnStyle}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10, color: '#4a4a52', paddingLeft: 2, lineHeight: 1.5, marginTop: 6 }}>
          {value === 'last'
            ? 'Selected tab → last inline slot'
            : 'Selected tab → first inline slot'}
        </div>
      </div>
    </>
  );
}
