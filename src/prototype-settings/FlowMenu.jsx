import { useEffect, useId, useRef, useState } from 'react';

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5 6 4.5 9 7.5" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  );
}

/**
 * The flow's name in the toast, as a menu for switching flows. The menu opens
 * upward because the toast sits at the bottom of the screen. With no saved
 * flows there is nothing to switch to, so the name stays plain text.
 *
 * `selected` is the id of the checked item ('' is the default flow, `null`
 * checks nothing, as for an unsaved customized view).
 */
export default function FlowMenu({ label, flows, defaultLabel, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    // Focus the checked item, or the first, so the keyboard picks up where the eye is.
    const items = rootRef.current.querySelectorAll('[role="menuitemradio"]');
    (rootRef.current.querySelector('[aria-checked="true"]') ?? items[0])?.focus();

    const onPointerDown = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (flows.length === 0) return <span className="ps-flow-label">{label}</span>;

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...rootRef.current.querySelectorAll('[role="menuitemradio"]')];
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = items.indexOf(document.activeElement) + step;
    items[(next + items.length) % items.length]?.focus();
  }

  const choose = id => {
    setOpen(false);
    onSelect(id);
  };

  return (
    <div ref={rootRef} className="ps-flow-menu" onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="ps-flow-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ps-flow-label">{label}</span>
        <Chevron />
      </button>
      {open && (
        <div id={menuId} className="ps-flow-list" role="menu" aria-label="Flows">
          {[{ id: '', name: defaultLabel }, ...flows].map(flow => (
            <button
              key={flow.id || 'default'}
              type="button"
              role="menuitemradio"
              aria-checked={flow.id === selected}
              className="ps-flow-item"
              onClick={() => choose(flow.id)}
            >
              <span className="ps-flow-check">{flow.id === selected && <Check />}</span>
              <span className="ps-flow-name">{flow.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
