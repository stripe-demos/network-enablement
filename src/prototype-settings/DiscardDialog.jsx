import { useEffect, useId } from 'react';

/** Confirms discarding the current flow. `existing` is the loaded saved flow, if any. */
export default function DiscardDialog({ existing, onDiscard, onClose }) {
  const titleId = useId();

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
      <div className="ps-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="ps-dialog-title">Are you sure you want to discard this flow?</h2>
        <p className="ps-dialog-body">
          {existing
            ? `“${existing.name}” will be deleted, and everything you selected will be wireframed again.`
            : 'Everything you selected will be wireframed again.'}
        </p>
        <div className="ps-dialog-actions">
          <button type="button" className="ps-button" onClick={onClose}>Cancel</button>
          <button type="button" className="ps-button ps-button--danger" onClick={onDiscard} autoFocus>Discard</button>
        </div>
      </div>
    </div>
  );
}
