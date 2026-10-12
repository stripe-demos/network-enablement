import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContextMenu } from './ContextMenu';

// ChatItemMenu — Rename · Delete (with inline confirm slot).
// Rendered for both the sidebar item-menu-btn and the conversation header
// convMenuBtn.
//
// Animation flow on Delete (matches the original prototype's spec):
//
//   1. Click "Delete"      → Delete row fades to opacity 0 (CSS, 120ms).
//                            "Delete? Yes No" confirm bar fades in (CSS,
//                            120ms) inside the same .delete-slot, with
//                            Yes/No bouncing in via the .slide-in class
//                            (cubic-bezier(0.34, 1.4, 0.64, 1)).
//   2. Click "No"          → Yes/No swap to .slide-out (transition: none,
//                            instant snap back to translateX(-8px)/op 0)
//                            and the confirm bar fades back to opacity 0
//                            while the Delete row fades back to 1.
//   3. Click "Yes"         → The whole popup fades to opacity 0 (120ms).
//                            After 130ms (slightly past the fade), we
//                            call onDelete + onClose so the sidebar
//                            row's collapse animation starts after the
//                            popup is visually gone.
//
// The 130ms gap is deliberate — it keeps the popup-fade and the row-
// collapse from overlapping, which makes the deletion feel "considered"
// rather than instant/jarring.
export function ChatItemMenu({
  isOpen,
  position,
  onClose,
  onRename,
  onDelete,
}) {
  // confirmOpen drives the visual state of the delete slot:
  //   false → Delete row visible, confirm bar invisible
  //   true  → Delete row faded, confirm bar visible with Yes/No bounced in
  const [confirmOpen, setConfirmOpen] = useState(false);
  // fading drives the popup-wide opacity transition that runs after Yes.
  const [fading, setFading] = useState(false);
  const yesRef = useRef(null);
  const noRef = useRef(null);
  const fadeTimerRef = useRef(null);

  // Each time the menu re-opens fresh, reset confirm + fade state. The
  // .slide-out class is left on the Yes/No spans so the next entry into
  // confirmOpen=true can re-apply .slide-in cleanly.
  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setConfirmOpen(false);
      setFading(false);
    });
  }, [isOpen]);

  // Re-fire the bounce each time we enter confirm mode — without the
  // reflow trick the browser sees the .slide-in class as already present
  // (from the previous open) and skips the transition.
  useLayoutEffect(() => {
    const yes = yesRef.current;
    const no = noRef.current;
    if (!yes || !no) return;
    if (confirmOpen) {
      yes.classList.remove('slide-in', 'slide-out');
      no.classList.remove('slide-in', 'slide-out');
      // Read offsetHeight to force a reflow before re-adding the class.
      // This is the same pattern the original prototype used.
      void yes.offsetHeight;
      yes.classList.add('slide-in');
      no.classList.add('slide-in');
    } else {
      // Cancel: snap back to the hidden start state without a reverse
      // animation. .slide-out has transition: none so this is instant.
      yes.classList.remove('slide-in');
      no.classList.remove('slide-in');
      yes.classList.add('slide-out');
      no.classList.add('slide-out');
    }
  }, [confirmOpen]);

  // Make sure any pending Yes-timeout is cleared if the menu is torn
  // down mid-fade (e.g. user clicks somewhere else in those 130ms).
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  function close() {
    setConfirmOpen(false);
    setFading(false);
    onClose?.();
  }

  function handleYes() {
    // Phase 2: popup fades out (120ms). Phase 3 (the row collapse) is
    // staged 130ms later, so the popup is gone before the collapse
    // begins. The actual onDelete fires together with onClose at the
    // 130ms mark.
    if (fadeTimerRef.current) return; // guard against double-click
    setFading(true);
    fadeTimerRef.current = setTimeout(() => {
      fadeTimerRef.current = null;
      onDelete?.();
      onClose?.();
    }, 130);
  }

  function handleNo() {
    setConfirmOpen(false);
  }

  return (
    <ContextMenu
      isOpen={isOpen}
      position={position}
      onClose={close}
      style={{
        // Only apply the fade transition when actually fading — leaving
        // a permanent transition would slow down the popup's first paint.
        opacity: fading ? 0 : 1,
        ...(fading && { transition: 'opacity 120ms ease' }),
      }}
    >
      <div
        className="item-popup-row"
        onClick={() => {
          onRename?.();
          close();
        }}
      >
        Rename
      </div>
      <div className="item-popup-sep" />
      <div className="delete-slot" style={{ position: 'relative' }}>
        <div
          className="item-popup-row item-popup-row--delete"
          // Inline opacity / pointer-events so the Delete row fades out
          // when the confirm bar takes over the same slot.
          style={{
            opacity: confirmOpen ? 0 : 1,
            pointerEvents: confirmOpen ? 'none' : 'auto',
          }}
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </div>
        <div
          className="item-popup-confirm"
          // Position over the same slot as the delete row so swapping
          // doesn't change the popup's measured size.
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            opacity: confirmOpen ? 1 : 0,
            pointerEvents: confirmOpen ? 'auto' : 'none',
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>Delete?</span>
          <span ref={yesRef} className="confirm-yes" onClick={handleYes}>
            Yes
          </span>
          <span ref={noRef} className="confirm-no" onClick={handleNo}>
            No
          </span>
        </div>
      </div>
    </ContextMenu>
  );
}
