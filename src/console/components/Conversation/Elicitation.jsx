import { useEffect, useRef, useState } from 'react';

// Elicitation — how the agent asks the user to confirm or cancel an action it
// is about to take. Replaces traditional forms across Console.
//
// Three variants, all sharing the same card chrome:
//   Elicitation                    — numbered options (Proceed / Cancel)
//                                    Figma 20319:11079
//   Elicitation + disclaimer       — same, with a consequence line beneath
//                                    Figma 15960:24151
//   RiskElicitation                — type-to-confirm for irreversible actions
//                                    Figma 15535:779470
//
// Not to be confused with AskQuestion (AskQuestion.jsx), which gathers context
// through pre-seeded options rather than confirming a pending action.
//
// Behavior:
//   - ↑/↓ moves the selection, Enter confirms it, Esc cancels and returns
//     focus to the bottom prompt.
//   - RiskElicitation gates confirmation on the user typing the exact token,
//     so Enter does nothing until the input matches.

const HINT_TEXT = '↑/↓ to navigate · Enter to confirm · Esc to cancel';

// Surface tier tokens — kept in sync with @theme in src/index.css.
const TIER_CARD = 'var(--color-surface-1)';
const TIER_ACTIVE = 'var(--color-surface-2)';

// Returns focus to the bottom chat prompt whenever the user "exits" the
// elicitation, so the page never ends up with nothing focused.
function focusPrompt() {
  document.getElementById('promptInput')?.focus();
}

// ─── Shared chrome ──────────────────────────────────────────────────────────

function ElicitationCard({ innerRef, children, ...rest }) {
  return (
    <div
      ref={innerRef}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
        background: TIER_CARD,
        border: '1px solid var(--color-border-default)',
        borderRadius: 6,
        padding: 6,
        outline: 'none',
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// Consequence line beneath the options — what the user is agreeing to.
function ElicitationDisclaimer({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '6px 2px 0',
        borderTop: '1px solid var(--color-border-subtle)',
      }}
    >
      <div
        style={{
          flex: '1 0 0',
          minWidth: 0,
          fontSize: 11,
          fontWeight: 400,
          lineHeight: 1.6,
          color: 'var(--color-text-tertiary)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ElicitationHint() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '0 8px',
        fontSize: 11,
        fontWeight: 400,
        lineHeight: 1.6,
        color: 'var(--color-text-secondary)',
      }}
    >
      {HINT_TEXT}
    </div>
  );
}

// One option row. Inactive rows sit flush with the card; only the active row
// lifts a tier, so exactly one row reads as engaged at a time.
function ElicitationOption({ label, trailing, isActive, onMouseEnter, onClick }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '4px 12px',
        background: isActive ? TIER_ACTIVE : TIER_CARD,
        borderRadius: 4,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 120ms ease',
      }}
    >
      <div
        style={{
          flex: '1 0 0',
          minWidth: 0,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.6,
          color: 'var(--color-text-primary)',
        }}
      >
        {label}
      </div>
      <OptionTrailing>{trailing}</OptionTrailing>
    </div>
  );
}

// Fixed 22×22 slot on the right of every row. Always rendered, even when
// empty, so rows with and without a number stay the same height.
function OptionTrailing({ children, style }) {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
        borderRadius: 3,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.6,
        color: 'var(--color-text-secondary)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Arrow-key navigation shared by both variants. Only fires when no text field
// is focused, so typing in the risk input or the bottom prompt still works.
function useOptionKeyNav({ total, active, setActive, onConfirm, onCancel, containerAttr }) {
  useEffect(() => {
    function onKey(e) {
      const focused = document.activeElement;
      const focusedIsTextField =
        focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        return;
      }
      if (focusedIsTextField) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % total);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i - 1 + total) % total);
      } else if (e.key === 'Enter') {
        if (focused && focused.dataset?.[containerAttr] === 'true') {
          e.preventDefault();
          onConfirm?.(active);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total, active, setActive, onConfirm, onCancel, containerAttr]);
}

// ─── Elicitation (basic, and basic + disclaimer) ────────────────────────────

export function Elicitation({ options = ['Proceed', 'Cancel'], disclaimer, onSelect }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef(null);

  useOptionKeyNav({
    total: options.length,
    active,
    setActive,
    containerAttr: 'elicitationContainer',
    onConfirm: (i) => onSelect?.(options[i]),
    onCancel: focusPrompt,
  });

  return (
    <div className="elicitation" style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <ElicitationCard innerRef={containerRef} data-elicitation-container="true">
        {options.map((label, i) => (
          <ElicitationOption
            key={i}
            label={label}
            trailing={i + 1}
            isActive={i === active}
            onMouseEnter={() => setActive(i)}
            onClick={() => {
              setActive(i);
              onSelect?.(label);
            }}
          />
        ))}
        {disclaimer && <ElicitationDisclaimer>{disclaimer}</ElicitationDisclaimer>}
      </ElicitationCard>
      <ElicitationHint />
    </div>
  );
}

// ─── Risk elicitation (type-to-confirm) ─────────────────────────────────────

export function RiskElicitation({
  token = 'sub_1TON',
  disclaimer,
  onConfirm,
  onCancel,
  autoFocus = true,
}) {
  const [value, setValue] = useState('');
  const [active, setActive] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const matches = value.trim() === token;
  const isInputRow = active === 0;

  // Focus the input while its row is engaged so the user can type immediately.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // Reference examples should only move focus after the user enters the card.
    if (!autoFocus && !containerRef.current?.contains(document.activeElement)) return;
    if (isInputRow) input.focus();
    else if (document.activeElement === input) input.blur();
  }, [autoFocus, isInputRow]);

  function handleCancel() {
    onCancel?.();
    focusPrompt();
  }

  useOptionKeyNav({
    total: 2,
    active,
    setActive,
    containerAttr: 'elicitationContainer',
    onConfirm: (i) => (i === 0 ? matches && onConfirm?.() : handleCancel()),
    onCancel: handleCancel,
  });

  return (
    <div className="elicitation" style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <ElicitationCard innerRef={containerRef} data-elicitation-container="true">
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '4px 8px 6px 12px' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.6,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            Type in <span style={{ color: 'var(--color-text-tertiary)' }}>{token}</span> to confirm.
          </div>
        </div>

        {/* Type-to-confirm row. Taller than a standard option row and using the
            card's corner radius, since it reads as a field rather than a row. */}
        <div
          onMouseEnter={() => setActive(0)}
          onClick={() => {
            setActive(0);
            inputRef.current?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            height: 34,
            padding: '4px 12px',
            background: isInputRow ? TIER_ACTIVE : TIER_CARD,
            borderRadius: 6,
            cursor: 'text',
            transition: 'background 120ms ease',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={token}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setActive(0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (matches) onConfirm?.();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            style={{
              flex: '1 0 0',
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.6,
              fontFamily: 'inherit',
              color: 'var(--color-text-primary)',
            }}
          />
          {/* Dimmed until the token matches, so the row shows when Enter arms. */}
          <OptionTrailing style={{ width: 'auto', opacity: matches ? 1 : 0.2, transition: 'opacity 120ms ease' }}>
            Enter
          </OptionTrailing>
        </div>

        <ElicitationOption
          label="Cancel"
          trailing={null}
          isActive={active === 1}
          onMouseEnter={() => setActive(1)}
          onClick={handleCancel}
        />

        {disclaimer && <ElicitationDisclaimer>{disclaimer}</ElicitationDisclaimer>}
      </ElicitationCard>
      <ElicitationHint />
    </div>
  );
}
