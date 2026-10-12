import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// RenameInput — in-place text editor for chat titles. Slots into
// whichever element holds the title (sidebar row or conversation
// header) and stays visually transparent: the parent supplies a
// `style` that matches the surrounding font/color so the swap is
// invisible. Owns its own typed-value state.
//
// Commit / cancel rules (matched to the original prototype's spec):
//   - Enter   → commit
//   - Escape  → cancel (parent restores the original title)
//   - Blur    → commit, debounced 150ms so a quick re-focus (e.g.
//               clicking inside the field to position the caret)
//               doesn't trigger a premature commit
//   - Empty value on commit → falls back to the original `value`
//
// Imperative ref handle:
//   - `commit()` — commit the current text (used by the header's X
//     close button so it goes through the same pipeline as Enter,
//     and so any pending blur timer is cleared first)
//   - `cancel()` — discard and restore the original
//
// The component stops click + mousedown propagation so the wrapping
// chat-row click handler doesn't fire while the user is editing.
export const RenameInput = forwardRef(function RenameInput(
  { value, onCommit, onCancel, style, className },
  ref,
) {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);
  const blurTimerRef = useRef(null);

  // Mount: focus the field and select all so the user can replace
  // the title by typing immediately, matching the original prototype.
  // Then force scrollLeft back to 0 — by default the browser auto-
  // scrolls a long text input to show the cursor (which sits at the
  // end of the selection in forward direction), making the title
  // appear shifted left on mount. The original prototype shows the
  // title pinned to the start until the user actually moves the
  // caret with arrows or starts typing; this matches that.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
    el.scrollLeft = 0;
    // The browser also runs its scroll-to-cursor pass on the next
    // frame in some engines, so re-pin to 0 once more after layout.
    const rafId = requestAnimationFrame(() => {
      el.scrollLeft = 0;
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const clearBlurTimer = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  const commit = useCallback(() => {
    clearBlurTimer();
    const next = text.trim() || value;
    onCommit?.(next);
  }, [clearBlurTimer, text, value, onCommit]);

  const cancel = useCallback(() => {
    clearBlurTimer();
    onCancel?.();
  }, [clearBlurTimer, onCancel]);

  useImperativeHandle(ref, () => ({ commit, cancel }), [commit, cancel]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  function handleBlur() {
    blurTimerRef.current = setTimeout(() => {
      // If focus already returned to this input (user clicked back
      // in to fix a typo), don't commit — let the next blur start a
      // fresh timer.
      if (document.activeElement === inputRef.current) return;
      commit();
    }, 150);
  }

  function handleFocus() {
    clearBlurTimer();
  }

  return (
    <input
      ref={inputRef}
      type="text"
      spellCheck={false}
      // When the user clears the field the placeholder shows the
      // original title in muted color, matching the prototype's
      // .rename-ghost behavior. As soon as they type anything the
      // placeholder vanishes (native input behavior).
      placeholder={value}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      // Editing the title shouldn't trigger the wrapping row's click
      // handler (which would otherwise switch chats out from under us).
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`rename-input${className ? ' ' + className : ''}`}
      style={{
        background: 'transparent',
        border: 'none',
        outline: 'none',
        padding: 0,
        margin: 0,
        fontFamily: 'inherit',
        ...style,
      }}
    />
  );
});
