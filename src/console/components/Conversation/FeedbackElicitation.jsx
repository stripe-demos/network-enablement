import { useEffect, useRef, useState } from 'react';

// FeedbackElicitation — the "Provide feedback?" form that the bottom prompt
// morphs into. Ported from Figma (Console — Spec, node 19294:4521):
//
//   ┌───────────────────────────────────────────────┐
//   │ Feedback                                        │  ← header
//   │ I think that...                          Submit │  ← free-form input row
//   └───────────────────────────────────────────────┘
//   ↑/↓ to navigate · Enter to submit · Esc to cancel     ← helper text
//
// Surfaces: card = Surface/1 (var(--color-surface-1)) with Border/Default (var(--color-border-default)). The
// input row lifts to Surface/2 (var(--color-surface-2)) on focus for affordance.

// Match the user-message bubbles in the thread (.user-message.linear-border):
// Surface/2 fill, Border/Default, 6px radius, the same soft shadow, and
// var(--color-icon-default) primary text.
const CARD_BG = 'var(--color-surface-2)';
const CARD_BORDER = 'var(--color-border-default)';
const CARD_SHADOW = '0 1px 4px rgba(0,0,0,0.12)';
const TEXT_PRIMARY = 'var(--color-icon-default)';
// Focused input row background. Lifted one step above the card (var(--color-surface-2)) so
// the focus fill is actually visible — a literal var(--color-surface-2) would be invisible
// against the user-message-matched container.
const ROW_ACTIVE = '#26262A';

const PLACEHOLDER = 'Type feedback...';

export function FeedbackElicitation(props) {
  return <FeedbackForm key={String(props.active)} {...props} />;
}

function FeedbackForm({ active, onSubmit, onCancel }) {
  const [value, setValue] = useState('');
  // Default focused=true (like PromptInput) so the thick blinking block cursor
  // is live the instant the card fades in, before the async focus lands.
  const [focused, setFocused] = useState(active);
  // True once the text has scrolled left (long input) — drives a subtle
  // left-edge fade so the overflowing text dissolves instead of hard-clipping.
  const [scrolledLeft, setScrolledLeft] = useState(false);
  const inputRef = useRef(null);

  // Autofocus the input whenever the form becomes active (the prompt has just
  // morphed into it), and clear any stale text when it closes.
  useEffect(() => {
    if (active) {
      const id = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 180);
      return () => clearTimeout(id);
    }
  }, [active]);

  const isEmpty = value.length === 0;
  const firstChar = PLACEHOLDER.charAt(0);
  const restGhost = PLACEHOLDER.slice(1);

  const submit = () => {
    const text = value.trim();
    onSubmit?.(text);
    setValue('');
  };

  return (
    <div
      className="feedback-elicitation"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        // 16px horizontal matches the message gutter. The 20px bottom lifts the
        // helper line off the viewport edge so its baseline aligns with the
        // bottom edge of the sidebar settings gear (~26px above the bottom:
        // 18px rail pad + the gear's centering offset) when the window is short.
        padding: '4px 16px 20px 16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          width: '100%',
          background: CARD_BG,
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: 6,
          boxShadow: CARD_SHADOW,
          padding: 6,
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', height: 20, padding: '0 8px 0 10px' }}>
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: TEXT_PRIMARY }}>
            Tell us more about your experience with Console today.
          </span>
        </div>

        {/* Free-form input row */}
        <div
          onClick={() => inputRef.current?.focus({ preventScroll: true })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '4px 10px',
            borderRadius: 6,
            background: focused ? ROW_ACTIVE : 'transparent',
            cursor: 'text',
            transition: 'background 120ms ease',
          }}
        >
          <div style={{ position: 'relative', flex: '1 0 0', minWidth: 0, display: 'flex', alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              className="feedback-elicitation__input"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setScrolledLeft(e.target.scrollLeft > 0);
              }}
              onScroll={(e) => setScrolledLeft(e.target.scrollLeft > 0)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancel?.();
                }
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: 0,
                margin: 0,
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.6,
                color: TEXT_PRIMARY,
                fontFamily: 'inherit',
                // Fade the left 40px once the text scrolls out of view so it
                // dissolves at the edge rather than hard-clipping.
                WebkitMaskImage: scrolledLeft
                  ? 'linear-gradient(to right, transparent 0, #000 40px)'
                  : undefined,
                maskImage: scrolledLeft
                  ? 'linear-gradient(to right, transparent 0, #000 40px)'
                  : undefined,
              }}
            />
            {/* Empty-state overlay: mirrors PromptInput — the first placeholder
                char sits inside the blinking block cursor, the rest renders as
                ghost text. The structure is IDENTICAL whether focused or not so
                nothing shifts on focus/blur; only the block's blink+highlight
                toggles (idle → plain ghost glyph, no jump). */}
            {isEmpty && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div className={`block-cursor${focused ? '' : ' is-idle'}`}>{firstChar}</div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    // Text/Tertiary — the placeholder copy color per the spec.
                    color: 'var(--color-text-tertiary)',
                    // 'pre' preserves the leading space in " think that..." so it
                    // doesn't collapse against the block cursor ("Ithink" bug).
                    whiteSpace: 'pre',
                    WebkitFontSmoothing: 'antialiased',
                  }}
                >
                  {restGhost}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              submit();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 22,
              padding: 0,
              border: 'none',
              background: 'transparent',
              borderRadius: 3,
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.6,
              // Lifts to Text/Primary (var(--color-icon-default), same as Console message copy)
              // once there's something to submit; muted otherwise.
              color: value.trim() ? TEXT_PRIMARY : 'var(--color-text-tertiary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 0.15s ease',
            }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Helper text */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
        <span style={{ fontSize: 11, fontWeight: 400, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
          Enter to submit · Esc to cancel
        </span>
      </div>
    </div>
  );
}
