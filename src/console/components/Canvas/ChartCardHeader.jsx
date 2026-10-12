import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MenuDotsIcon } from '../icons';
import { ContextMenu } from '../Menu/ContextMenu';
import { RenameInput } from '../RenameInput';

const MENU_ANCHOR_WIDTH_PX = 140;

/**
 * Chart card header — title + subtitle and ⋯ menu for multi-chart panel actions.
 *
 * When `onRemove`/`onExpand` are provided (multi-chart context), the menu shows
 * Save to library · Open in new tab · [sep] · Remove (with inline confirm slot).
 *
 * @param {() => void} [props.onRemove] — remove this panel from the multi-chart
 * @param {() => void} [props.onExpand] — expand this panel as its own canvas tab
 * @param {(open: boolean) => void} [props.onMenuOpenChange]
 */
export function ChartCardHeader({ title, subtitle, onMenuOpenChange, onRemove, onExpand, onRename, freshnessLabel }) {
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const renameRef = useRef(null);
  const yesRef = useRef(null);
  const noRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    onMenuOpenChange?.(menuPos !== null);
  }, [menuPos, onMenuOpenChange]);

  // Reset confirm state each time the menu opens fresh.
  useEffect(() => {
    if (!menuPos) return;
    queueMicrotask(() => {
      setConfirmOpen(false);
      setFading(false);
    });
  }, [menuPos]);

  // Slide Yes/No in or snap them back out when confirm state changes.
  useLayoutEffect(() => {
    const yes = yesRef.current;
    const no = noRef.current;
    if (!yes || !no) return;
    if (confirmOpen) {
      yes.classList.remove('slide-in', 'slide-out');
      no.classList.remove('slide-in', 'slide-out');
      void yes.offsetHeight; // force reflow so the transition fires
      yes.classList.add('slide-in');
      no.classList.add('slide-in');
    } else {
      yes.classList.remove('slide-in');
      no.classList.remove('slide-in');
      yes.classList.add('slide-out');
      no.classList.add('slide-out');
    }
  }, [confirmOpen]);

  useEffect(() => {
    return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); };
  }, []);

  const openMenu = useCallback(() => {
    if (menuPos) { setMenuPos(null); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPos({ x: rect.right - MENU_ANCHOR_WIDTH_PX, y: rect.bottom + 4 });
  }, [menuPos]);

  function closeMenu() {
    setConfirmOpen(false);
    setFading(false);
    setMenuPos(null);
  }

  function fire(fn) {
    closeMenu();
    fn?.();
  }

  function handleYes() {
    if (fadeTimerRef.current) return;
    setFading(true);
    fadeTimerRef.current = setTimeout(() => {
      fadeTimerRef.current = null;
      onRemove?.();
      closeMenu();
    }, 130);
  }

  function handleNo() {
    setConfirmOpen(false);
  }

  function handleRenameCommit(next) {
    setRenaming(false);
    onRename?.(next);
  }

  return (
    <div className="chart-shell__header">
      <div className="chart-shell__headerText">
        <div className="chart-shell__title">
          {renaming ? (
            <RenameInput
              ref={renameRef}
              value={title}
              onCommit={handleRenameCommit}
              onCancel={() => setRenaming(false)}
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', caretColor: 'var(--color-text-primary)', width: '100%' }}
            />
          ) : title}
        </div>
        {subtitle ? <div className="chart-shell__subtitle">{subtitle}</div> : null}
      </div>
      <button
        type="button"
        ref={btnRef}
        className="chart-shell__menuBtn"
        aria-label="Chart options"
        aria-haspopup="menu"
        aria-expanded={menuPos !== null}
        onClick={(e) => {
          e.stopPropagation();
          openMenu();
        }}
      >
        <MenuDotsIcon size={14} />
      </button>
      <ContextMenu
        isOpen={menuPos !== null}
        position={menuPos}
        onClose={closeMenu}
        style={{
          opacity: fading ? 0 : 1,
          ...(fading && { transition: 'opacity 120ms ease' }),
        }}
      >
        <div className="item-popup-row" onClick={() => { closeMenu(); setRenaming(true); }}>Rename</div>
        <div className="item-popup-row" onClick={() => fire(null)}>Save to library</div>
        {onExpand && (
          <div className="item-popup-row" onClick={() => fire(onExpand)}>Open in new tab</div>
        )}
        {onRemove && (
          <>
            {!freshnessLabel && <div className="item-popup-sep" />}
            <div className="delete-slot" style={{ position: 'relative' }}>
              <div
                className="item-popup-row item-popup-row--delete"
                style={{
                  opacity: confirmOpen ? 0 : 1,
                  pointerEvents: confirmOpen ? 'none' : 'auto',
                }}
                onClick={() => setConfirmOpen(true)}
              >
                Remove
              </div>
              <div
                className="item-popup-confirm"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: confirmOpen ? 1 : 0,
                  pointerEvents: confirmOpen ? 'auto' : 'none',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Remove?</span>
                <span ref={yesRef} className="confirm-yes" onClick={handleYes}>Yes</span>
                <span ref={noRef} className="confirm-no" onClick={handleNo}>No</span>
              </div>
            </div>
          </>
        )}
        {freshnessLabel && (
          <>
            <div className="item-popup-sep" />
            <div
              className="item-popup-row"
              style={{
                color: 'var(--color-text-quaternary, var(--color-text-tertiary))',
                pointerEvents: 'none',
                cursor: 'default',
                fontSize: 11,
              }}
            >
              {freshnessLabel}
            </div>
          </>
        )}
      </ContextMenu>
    </div>
  );
}
