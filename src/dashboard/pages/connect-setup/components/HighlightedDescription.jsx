import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { describeTrait, STRENGTH_LEVELS, STRENGTH_SEGMENTS } from '../data/descriptionInsights';
import './HighlightedDescription.css';

// Hover intent before the first tooltip opens, so sweeping the pointer across
// the text doesn't flash explanations. Once one is open, neighbors swap in
// immediately. Caret placement never waits.
const OPEN_DELAY_MS = 90;
const HIDE_DELAY_MS = 140;
const EXIT_MS = 120;

// Signal-strength segments from Figma `6503:71162`, with the level as text so
// it isn't conveyed by fill alone.
function StrengthMeter({ level, label }) {
  const { filled, text } = STRENGTH_LEVELS[level];
  return (
    <div className="flex items-center gap-2">
      <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
        {Array.from({ length: STRENGTH_SEGMENTS }, (_, i) => (
          <span key={i} className={`h-2 w-1 rounded-full ${i < filled ? 'bg-icon-brand' : 'bg-brand-100'}`} />
        ))}
      </span>
      <span className="text-label-small text-subdued">{text} signal for {label.toLowerCase()}</span>
    </div>
  );
}

export default function HighlightedDescription({ value, highlights, onChange, onFocus, onBlur, maxLength }) {
  const inputRef = useRef(null);
  const mirrorRef = useRef(null);
  const hideTimer = useRef(null);
  const exitTimer = useRef(null);
  const openTimer = useRef(null);
  const pendingIndex = useRef(null);
  const [active, setActive] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [composing, setComposing] = useState(false);

  // Editing or scrolling dismisses immediately so a stale explanation never
  // trails the text. Pointer exits get a short grace period and a soft fade.
  const dismiss = useCallback(() => {
    clearTimeout(hideTimer.current);
    clearTimeout(exitTimer.current);
    clearTimeout(openTimer.current);
    hideTimer.current = null;
    pendingIndex.current = null;
    setActive(null);
    setExiting(false);
  }, []);

  const syncMirror = () => {
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (!input || !mirror) return;
    mirror.style.width = `${input.clientWidth}px`;
    mirror.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`;
  };

  useLayoutEffect(() => {
    syncMirror();
    dismiss();
  }, [value, highlights, dismiss]);

  useEffect(() => {
    const observer = new ResizeObserver(() => { syncMirror(); dismiss(); });
    observer.observe(inputRef.current);
    const hide = dismiss;
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      observer.disconnect();
      clearTimeout(hideTimer.current);
      clearTimeout(exitTimer.current);
      clearTimeout(openTimer.current);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [dismiss]);

  const keepOpen = () => {
    clearTimeout(hideTimer.current);
    clearTimeout(exitTimer.current);
    hideTimer.current = null;
    setExiting(false);
  };

  // Always anchored by `top` (shifted up by its own height when above) so moving
  // between highlights can glide the same property instead of jumping between
  // top and bottom anchoring. A side flip skips the glide.
  const show = (index, rect) => {
    clearTimeout(openTimer.current);
    pendingIndex.current = null;
    keepOpen();
    const above = rect.bottom > window.innerHeight - 260;
    setActive((prev) => ({
      index,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 324)),
      top: above ? rect.top - 8 : rect.bottom + 8,
      above,
      glide: Boolean(prev) && prev.above === above,
    }));
  };
  const hideSoon = () => {
    clearTimeout(openTimer.current);
    pendingIndex.current = null;
    if (hideTimer.current !== null || exiting) return;
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null;
      setExiting(true);
      exitTimer.current = setTimeout(dismiss, EXIT_MS);
    }, HIDE_DELAY_MS);
  };

  const handlePointerMove = (event) => {
    if (event.buttons || composing) return;
    for (const mark of mirrorRef.current.querySelectorAll('mark')) {
      for (const rect of mark.getClientRects()) {
        if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
          const index = Number(mark.dataset.index);
          // Stay put while the pointer wanders within the same highlight, even
          // across its wrapped lines, rather than chasing each line box.
          if (active?.index === index) { keepOpen(); return; }
          if (active) { show(index, rect); return; }
          if (pendingIndex.current === index) return;
          clearTimeout(openTimer.current);
          pendingIndex.current = index;
          openTimer.current = setTimeout(() => show(index, rect), OPEN_DELAY_MS);
          return;
        }
      }
    }
    hideSoon();
  };

  // Arrow keys and touch caret placement expose the same explanations as hover.
  const handleSelect = () => {
    const input = inputRef.current;
    if (composing || input.selectionStart !== input.selectionEnd) { dismiss(); return; }
    const index = highlights.findIndex((span) => input.selectionStart >= span.start && input.selectionStart < span.end);
    const mark = mirrorRef.current.querySelector(`[data-index="${index}"]`);
    const visibleRect = mark && Array.from(mark.getClientRects()).find((rect) => {
      const bounds = input.getBoundingClientRect();
      return rect.top >= bounds.top && rect.bottom <= bounds.bottom;
    });
    if (visibleRect) show(index, visibleRect);
    else dismiss();
  };

  const content = [];
  let position = 0;
  highlights.forEach((span, index) => {
    content.push(value.slice(position, span.start));
    content.push(
      <mark key={`${span.start}-${span.end}`} data-index={index} data-active={active?.index === index && !exiting ? '' : undefined}>
        {value.slice(span.start, span.end)}
      </mark>
    );
    position = span.end;
  });
  content.push(value.slice(position), '\n');
  const activeHighlight = active && highlights[active.index];
  const readings = activeHighlight
    ? activeHighlight.traits.map((id) => ({ id, ...describeTrait(id, value.slice(activeHighlight.start, activeHighlight.end), activeHighlight.confidence?.[id]) }))
    : [];

  return (
    <div className="description-editor relative min-h-[156px] flex-1 text-body-medium text-default">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div ref={mirrorRef} className="description-editor-mirror">{content}</div>
      </div>
      <textarea
        ref={inputRef}
        id="composer-description"
        className="description-editor-input absolute inset-0 h-full w-full resize-none bg-transparent focus:outline-none"
        value={value}
        maxLength={maxLength}
        aria-describedby={`description-analysis-status${activeHighlight ? ' description-trait-tooltip' : ''}`}
        onChange={(event) => { dismiss(); onChange(event); }}
        onFocus={onFocus}
        onBlur={(event) => { hideSoon(); onBlur?.(event); }}
        onScroll={() => { syncMirror(); dismiss(); }}
        onPointerMove={handlePointerMove}
        onPointerLeave={hideSoon}
        onSelect={handleSelect}
        onCompositionStart={() => { setComposing(true); dismiss(); }}
        onCompositionEnd={() => setComposing(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && active) {
            event.stopPropagation();
            dismiss();
          } else if (event.key.length === 1) dismiss();
        }}
      />
      {activeHighlight && createPortal(
        <div
          id="description-trait-tooltip"
          role="tooltip"
          // Portaled to <body>, outside the wireframed page, so keep it real.
          data-wireframe-show=""
          className="description-trait-tooltip fixed z-[10030] max-h-[240px] w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-lg border border-tooltip-border bg-tooltip-surface p-4 text-body-small text-default shadow-lg"
          data-state={exiting ? 'closing' : 'open'}
          data-side={active.above ? 'above' : 'below'}
          data-glide={active.glide ? '' : undefined}
          style={{ left: active.left, top: active.top }}
          onPointerEnter={keepOpen}
          onPointerLeave={hideSoon}
        >
          {/* Keyed so swapping highlights crossfades the copy while the frame glides. */}
          <div key={active.index} className="description-trait-tooltip-content divide-y divide-hairline">
            {readings.map((reading) => (
              <div key={reading.id} className="py-3 first:pt-0 last:pb-0">
                <StrengthMeter level={reading.strength} label={reading.label} />
              </div>
            ))}
          </div>
        </div>, document.body
      )}
    </div>
  );
}
