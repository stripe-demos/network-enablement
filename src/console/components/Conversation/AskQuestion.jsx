import { useEffect, useRef, useState } from 'react';
import {
  CheckCircleFilledIcon,
  ChevronLeftSmall,
  ChevronRightSmall,
  CircleIcon,
} from '../icons';

// AskQuestion — pre-seeded multi-choice prompt rendered inline in a
// conversation. Distinct from Elicitation: AskQuestion guides the user
// forward through options (with a free-form escape hatch) to gather enough
// context for the agent to build a plan. Elicitation asks for a decision on
// an action the agent is about to take.
// Spec ported from Figma node 10689:87973 (Console — Spec).
//
// Behavior:
//   - Up to N concrete options + a final free-form row that's a real text
//     input (the user can type their own response there).
//   - Color tiering matches the reply indicator pattern (older→latest):
//     the card lifts ONE tier above the conversation surface, and the
//     active option lifts ONE tier above the card. Inactive options sit
//     flush with the card so only one row reads as "engaged" at a time.
//     surface-0 (conversation)
//       └─ surface-1  card background (also inactive options)
//          └─ surface-2  active option
//   - ↑/↓ moves between choices, including into and out of the freeform input.
//   - Enter "selects" the current option. When the freeform row is
//     selected, Enter submits whatever the user typed in that input.
//   - Esc returns focus to the bottom prompt input.
//   - Pointer hover moves the selection; click also focuses (for the
//     freeform row, that means focusing its inner text input).

const FREEFORM_PLACEHOLDER = 'Type something else or ask a question';

// Surface tier tokens — kept in sync with @theme in src/index.css.
const TIER_CARD = 'var(--color-surface-1)';
const TIER_ACTIVE = 'var(--color-surface-2)';

// Returns focus to the bottom chat prompt. Used whenever the user
// "exits" the AskQuestion (Esc, click outside, …) so the page never
// ends up in a state where nothing is focused.
function focusPrompt() {
  document.getElementById('promptInput')?.focus();
}

export function AskQuestion({
  options = ['Fix login bug', 'Add search filter', 'Update API response'],
  onSelect,
  // Header variant: a bold question title with the agent's restated intent
  // beneath it. Omit both to get the bare option list.
  title,
  subtitle,
  // Steps variant: when the agent walks a fixed sequence of questions, the
  // header gains a "N of M" pager. 1-indexed.
  step,
  stepCount,
  onStepChange,
  // Multi-choice variant: shows a selection icon on each row. That variant
  // presents a closed set, so it drops the free-form row.
  selectable = false,
  freeform = true,
  onCancel,
  autoFocus = false,
  scopedKeyboard = false,
  embedded = false,
}) {
  const [active, setActive] = useState(0);
  const [freeformValue, setFreeformValue] = useState('');
  const containerRef = useRef(null);
  const freeformInputRef = useRef(null);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => {
      // Don't override a click or Tab that already established focus.
      const focused = document.activeElement;
      if (!focused || focused === document.body || focused === document.documentElement) {
        containerRef.current?.focus({ preventScroll: true });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  // Total rows = options + 1 free-form row. Free-form sits at index = options.length.
  const total = options.length + (freeform ? 1 : 0);
  const freeformIndex = freeform ? options.length : -1;
  const isFreeformActive = freeform && active === freeformIndex;

  // Handle keys at the card boundary so focused descendants remain part of
  // the same interaction. Hover changes the highlight, never DOM focus.
  function handleKeyDown(event) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setActive(0);
      if (onCancel) onCancel();
      else focusPrompt();
      return;
    }
    const fromInput = event.target === freeformInputRef.current;
    if (event.target !== containerRef.current && !fromInput) return;
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && total > 0) {
      event.preventDefault();
      event.stopPropagation();
      const current = fromInput ? freeformIndex : active;
      const next = (current + (event.key === 'ArrowDown' ? 1 : -1) + total) % total;
      setActive(next);
      const target = next === freeformIndex ? freeformInputRef.current : containerRef.current;
      target?.focus({ preventScroll: true });
    } else if (event.key === 'Enter' && !fromInput) {
      event.preventDefault();
      event.stopPropagation();
      if (active === freeformIndex) freeformInputRef.current?.focus({ preventScroll: true });
      else onSelect?.(options[active]);
    }
  }

  // Click outside the AskQuestion card → return focus to the prompt.
  // Without this the user can end up with neither the freeform row nor
  // the prompt focused (focus drops to <body>) which feels broken.
  useEffect(() => {
    if (scopedKeyboard) return;
    function onPointerDown(e) {
      const card = containerRef.current;
      if (!card) return;
      if (card.contains(e.target)) return;
      // Don't steal focus if the click landed on something that wants
      // it (another input, a button that opens the search, etc.) —
      // only refocus the prompt if focus went nowhere meaningful.
      requestAnimationFrame(() => {
        const next = document.activeElement;
        const isMeaningful =
          next && next !== document.body && next.tagName !== 'HTML';
        if (!isMeaningful) focusPrompt();
      });
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [scopedKeyboard]);

  return (
    <div
      className="ask-question"
      style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      {/* The Figma source has an extra `px-24` outer wrapper around this
          card, but in this layout the messages area already supplies the
          16px gutter, so we render the bordered card flush to the column
          edges. */}
      <div
        ref={containerRef}
        data-askquestion-container="true"
        role="group"
        aria-label={title || 'Choose an option'}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          width: '100%',
          background: embedded ? 'transparent' : TIER_CARD,
          border: embedded ? 'none' : '1px solid var(--color-border-default)',
          borderRadius: 6,
          padding: 6,
          outline: 'none',
        }}
      >
        {(title || subtitle || stepCount) && (
          <AskQuestionHeader
            leftInset={embedded ? 7 : 12}
            title={title}
            subtitle={subtitle}
            step={step}
            stepCount={stepCount}
            onStepChange={onStepChange}
          />
        )}
        {options.map((label, i) => {
          const isActive = i === active;
          return (
            <AskQuestionOption
              key={i}
              label={label}
              number={i + 1}
              isActive={isActive}
              selectable={selectable}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                setActive(i);
                onSelect?.(label);
              }}
            />
          );
        })}
        {/* Free-form row — same shape, but the label is replaced with a
            real text input so the user can type their own answer. */}
        {freeform && (
        <FreeformAskQuestionOption
          inputRef={freeformInputRef}
          number={freeformIndex + 1}
          isActive={isFreeformActive}
          value={freeformValue}
          onChange={setFreeformValue}
          onActivate={() => setActive(freeformIndex)}
          onSubmit={() => {
            const text = freeformValue.trim();
            if (!text) return;
            onSelect?.(text);
            setFreeformValue('');
          }}
        />
        )}
      </div>

      {!embedded && <div
        style={{
          display: 'flex',
          alignItems: 'center',
          // 19 = card padding (6) + option-row padding-left (11) + a
          // 2px optical nudge so the helper text reads as visually
          // aligned with the option labels rather than mathematically
          // flush (the smaller font weight makes the math feel a hair
          // too far left without the bump).
          padding: '0 19px',
          marginTop: 6,
          width: '100%',
          fontSize: 11,
          fontWeight: 400,
          color: 'var(--color-text-secondary)',
        }}
      >
        ↑/↓ to navigate · Enter to confirm · Esc to cancel
      </div>}
    </div>
  );
}

// Header for the title/subtitle and steps variants. The pager only renders
// when there's a step count; its arrows dim at the ends of the sequence
// rather than disappearing, so the control keeps a stable width.
function AskQuestionHeader({ title, subtitle, step = 1, stepCount, onStepChange, leftInset = 12 }) {
  const hasPrev = step > 1;
  const hasNext = stepCount ? step < stepCount : false;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: `0 8px 0 ${leftInset}px`,
      }}
    >
      <div style={{ flex: '1 0 0', minWidth: 0, padding: '4px 0 6px' }}>
        {title && (
          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </div>
        )}
      </div>
      {stepCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingTop: 4 }}>
          <StepArrow
            direction="prev"
            enabled={hasPrev}
            onClick={() => hasPrev && onStepChange?.(step - 1)}
          />
          <div style={{ fontSize: 11, fontWeight: 400, lineHeight: 1.6, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {step} of {stepCount}
          </div>
          <StepArrow
            direction="next"
            enabled={hasNext}
            onClick={() => hasNext && onStepChange?.(step + 1)}
          />
        </div>
      )}
    </div>
  );
}

function StepArrow({ direction, enabled, onClick }) {
  const Glyph = direction === 'prev' ? ChevronLeftSmall : ChevronRightSmall;
  return (
    <span
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        color: 'var(--color-text-tertiary)',
        opacity: enabled ? 1 : 0.2,
        cursor: enabled ? 'pointer' : 'default',
        transition: 'opacity 120ms ease',
      }}
    >
      <Glyph size={8} />
    </span>
  );
}

function AskQuestionOption({ label, number, isActive, muted, selectable, onMouseEnter, onClick }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        // 11px left for a 1pt optical nudge — the prior 10px sat a hair
        // too tight against the card edge.
        padding: '4px 10px 4px 11px',
        // Inactive rows sit flush with the card; only the active row lifts
        // one tier (surface-1 → surface-2). Mirrors the older→latest tone
        // shift on the reply indicator dots — exactly one item engaged.
        background: isActive ? TIER_ACTIVE : TIER_CARD,
        boxShadow: isActive ? 'inset 0 0 0 1px var(--color-border-default)' : 'none',
        borderRadius: 4,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 120ms ease',
      }}
    >
      {selectable && (
        <span
          style={{
            display: 'flex',
            flexShrink: 0,
            color: isActive ? 'var(--color-icon-default)' : 'var(--color-icon-subtle)',
          }}
        >
          {isActive ? <CheckCircleFilledIcon size={16} /> : <CircleIcon size={16} />}
        </span>
      )}
      <div
        style={{
          flex: '1 0 0',
          minWidth: 0,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.6,
          color: muted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 3,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
        }}
      >
        {number}
      </div>
    </div>
  );
}

// Free-form row variant: same chrome as AskQuestionOption but the label
// is a real <input>. Active state lifts the row to surface-2 to match
// the regular options. Focusing the input also activates the row, so
// clicking anywhere on it visually + functionally engages it.
function FreeformAskQuestionOption({
  inputRef,
  number,
  isActive,
  value,
  onChange,
  onActivate,
  onSubmit,
}) {
  return (
    <div
      onMouseEnter={onActivate}
      onClick={() => {
        onActivate();
        inputRef.current?.focus();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        // Match AskQuestionOption (11/10) so the freeform row's caret +
        // placeholder line up with the labels above.
        padding: '4px 10px 4px 11px',
        background: isActive ? TIER_ACTIVE : TIER_CARD,
        boxShadow: isActive ? 'inset 0 0 0 1px var(--color-border-default)' : 'none',
        borderRadius: 4,
        cursor: 'text',
        userSelect: 'none',
        transition: 'background 120ms ease',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder={FREEFORM_PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onActivate}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            onSubmit();
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
          color: 'var(--color-text-primary)',
          fontFamily: 'inherit',
          // The placeholder takes the muted tone the static label used
          // to have, so the row reads identically to the others when
          // empty + inactive.
          // (Placeholder color set via CSS in index.css; falls back to
          //  the browser default if that rule is missing.)
        }}
      />
      <div
        style={{
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 3,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
        }}
      >
        {number}
      </div>
    </div>
  );
}
