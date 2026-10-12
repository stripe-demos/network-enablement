import { useEffect, useId, useRef, useState } from 'react';

/**
 * Save a flow. `existing` is the loaded flow: saving asks whether to override
 * it or save a new flow, with the name prompt behind "Save as new flow".
 * Otherwise it asks for a name.
 */
export default function FlowDialog({ existing, onSave, onOverride, onClose }) {
  const [naming, setNaming] = useState(!existing);
  const [name, setName] = useState('');
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef(null);
  const trimmed = name.trim();

  useEffect(() => {
    if (naming) inputRef.current?.focus();
  }, [naming]);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  return (
    <div className="ps-dialog-backdrop" onPointerDown={event => event.target === event.currentTarget && onClose()}>
      {naming ? (
        <form
          className="ps-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onSubmit={event => {
            event.preventDefault();
            if (trimmed) onSave(trimmed);
          }}
        >
          <h2 id={titleId} className="ps-dialog-title">Save flow</h2>
          <label htmlFor={inputId} className="ps-field-label">Flow name</label>
          <input
            ref={inputRef}
            id={inputId}
            className="ps-input"
            value={name}
            placeholder="e.g. Failed payments follow-up"
            onChange={event => setName(event.target.value)}
          />
          <div className="ps-dialog-actions">
            {existing ? (
              <button type="button" className="ps-button" onClick={() => setNaming(false)}>Back</button>
            ) : (
              <button type="button" className="ps-button" onClick={onClose}>Discard</button>
            )}
            <button type="submit" className="ps-button ps-button--primary" disabled={!trimmed}>Save</button>
          </div>
        </form>
      ) : (
        <div className="ps-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
          <h2 id={titleId} className="ps-dialog-title">Save changes to “{existing.name}”?</h2>
          <p className="ps-dialog-body">Override this flow with your current selections, or keep it and save them as a new flow.</p>
          <div className="ps-dialog-actions">
            <button type="button" className="ps-button ps-button--start" onClick={onClose}>Cancel</button>
            <button type="button" className="ps-button" onClick={() => setNaming(true)}>Save as new flow</button>
            <button type="button" className="ps-button ps-button--primary" onClick={onOverride}>Override</button>
          </div>
        </div>
      )}
    </div>
  );
}
