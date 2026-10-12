import { useState } from 'react';
import { CloseIcon } from '../icons';

// Bottom-right floating picker — successor to the original LayoutToggle.
//
// Three sections, all backed by URL state via the useVariants hook:
//   • Layout     — built-in Small/Large segmented control. Single-select.
//                  Maps to body[data-layout] and the `layout` prop the
//                  Canvas already reads. Setting "Small" clears the flag.
//   • Components — auto-discovered element variants (one toggle per slot).
//                  Multi-section, single-select within each slot group.
//   • Pages      — auto-discovered page variants. Single-select; clearing
//                  the selection drops back to the default Home.
//
// Sections with no variants are hidden so a stock build still shows just
// the Small/Large layout group, exactly like the original.

export function VariantsPanel({
  byScope,
  selected,
  setPage,
  toggleElement,
  customSections = [],
}) {
  const [open, setOpen] = useState(false);

  const elementsBySlot = groupBy(byScope.element, 'slot');
  const hasElementVariants = byScope.element.length > 0;
  const hasPageVariants = byScope.page.length > 0;

  return (
    <>
      <button
        id="configTrigger"
        className={open ? 'hidden' : ''}
        onClick={() => setOpen(true)}
        aria-label="Open variants picker"
        style={triggerStyle}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
        </svg>
      </button>

      <div id="configPanel" className={open ? 'open' : ''} style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div style={panelTitleStyle}>Variants</div>
          <button id="configClose" onClick={() => setOpen(false)} style={closeBtnStyle}>
            <CloseIcon size={10} />
          </button>
        </div>

        {hasElementVariants &&
          Object.entries(elementsBySlot).map(([slot, variants]) => (
            <Section key={slot} label={slot}>
              <Segmented
                options={[
                  {
                    id: '__default__',
                    label: 'Default',
                    active: !variants.some((v) => selected.elements.has(v.id)),
                  },
                  ...variants.map((v) => ({
                    id: v.id,
                    label: v.label,
                    active: selected.elements.has(v.id),
                  })),
                ]}
                onSelect={(id) => {
                  if (id === '__default__') {
                    variants.forEach((v) => {
                      if (selected.elements.has(v.id)) toggleElement(v.id);
                    });
                  } else {
                    toggleElement(id);
                  }
                }}
              />
            </Section>
          ))}

        {hasPageVariants && (
          <Section label="Page">
            <Segmented
              options={[
                { id: '__default__', label: 'Home', active: !selected.page },
                ...byScope.page.map((v) => ({
                  id: v.id,
                  label: v.label,
                  active: selected.page === v.id,
                })),
              ]}
              onSelect={(id) => setPage(id === '__default__' ? null : id)}
            />
          </Section>
        )}

        {customSections.map((section) => (
          <Section key={section.label} label={section.label}>
            <Segmented options={section.options} onSelect={section.onSelect} />
          </Section>
        ))}

      </div>
    </>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={sectionLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

function Segmented({ options, onSelect }) {
  return (
    <div style={segmentedStyle}>
      {options.map((opt) => (
        <button
          key={opt.id}
          className={`config-toggle ${opt.active ? 'active' : ''}`}
          onClick={() => onSelect(opt.id)}
          style={segmentedBtnStyle}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key] || '_';
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

// ── Styles (kept inline so the original prototype CSS stays intact) ─────────

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
