import { deriveAttribution } from '../../data/sourceAttribution';
import { DisclosureChevron } from '../Disclosure';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  SourceApiIcon,
  SourceDocIcon,
  SourceCodeIcon,
  SourceDashboardIcon,
  ExpandArrowIcon,
} from '../icons';

export function SourceItemIcon({ type, size = 12 }) {
  if (type === 'dashboard') return <SourceDashboardIcon size={size} />;
  if (type === 'code') return <SourceCodeIcon size={size} />;
  if (type === 'api') return <SourceApiIcon size={size} />;
  return <SourceDocIcon size={size} />;
}

// One row in an expanded source list. Interaction is driven by item.type:
// 'code' opens the SQL as a canvas tab, 'api' reveals the agent's reasoning,
// and dashboard/doc rows are link-styled but inert in the prototype.
export function SourceItemRow({ item, size = 12, className = 'source-tooltip-item', onApiClick, onOpenSourceTab }) {
  const [hovered, setHovered] = useState(false);
  const isExpand = className === 'source-expand-item';
  const isCode = item.type === 'code' && item.sqlId && onOpenSourceTab;
  const isApi = item.type === 'api' && onApiClick;
  const interactive = isCode || isApi;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCode) onOpenSourceTab(item.sqlId);
    else if (isApi) onApiClick();
  };

  return (
    <div
      data-chat-nav={isExpand ? true : undefined}
      className={className}
      style={isExpand ? undefined : { display: 'flex', alignItems: 'center', gap: 6, cursor: interactive ? 'pointer' : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={interactive ? handleClick : undefined}
    >
      <span
        className={isExpand ? 'source-expand-icon' : undefined}
        style={isExpand ? undefined : { flexShrink: 0, display: 'flex', alignItems: 'center', color: 'var(--color-text-tertiary)' }}
      >
        <SourceItemIcon type={item.type} size={size} />
      </span>
      <a href="#" onClick={handleClick}>{item.label}</a>
      {/* The hover affordance always occupies its space and only fades in, so
          revealing it can't resize the row (and with it the whole popover). */}
      {interactive && (
        <>
          {isCode && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--color-text-tertiary)',
                marginLeft: 2,
                flexShrink: 0,
                opacity: hovered ? 1 : 0,
                transition: 'opacity 120ms ease',
              }}
              aria-hidden
            >
              <ExpandArrowIcon size={8} />
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-tertiary)',
              marginLeft: 4,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 120ms ease',
            }}
            aria-hidden={!hovered}
          >
            {isCode ? 'View SQL' : 'Show agent reasoning'}
          </span>
        </>
      )}
    </div>
  );
}

// Artifact chips are followed by available source details and response feedback.
// Without source details, omit attribution while retaining eligible feedback.
export function ArtifactChips({ children, onApiClick, onOpenSourceTab, isLatest = true, sourceItems }) {
  const selectedColor = 'default';
  // Baked-in prototype behavior: the thumbs are hidden by default and only
  // appear when the most recent Console message row is hovered. Clicking a thumb
  // shows the right-aligned acknowledgement ("Thank you." / "Provide feedback?"),
  // which fades out on a timer. No hover tooltips, no consolidate collapse.
  const feedbackRight = true;
  const persistent = false;
  const consolidate = false;
  const tooltipsEnabled = false;
  const UpIcon = ThumbsUpIcon;
  const DownIcon = ThumbsDownIcon;
  // Source transparency: collapsed label derives from the items; the chevron
  // expands them inline (the landed "expand" configuration).
  const hasSources = Array.isArray(sourceItems) && sourceItems.length > 0;
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const sourceId = useId();
  const feedbackId = useId();
  const revealFrame = useRef(null);
  const sourceExpandRef = useRef(null);

  // Follow only the revealed height when sources open below the composer.
  // scrollIntoView on the first frame measured the still-clipped full content
  // and started a competing smooth scroll, causing a second, jagged movement.
  useEffect(() => {
    if (!sourceExpanded) return undefined;
    const content = sourceExpandRef.current;
    const area = content?.closest('[data-conversation-scroll]');
    if (!area) return undefined;
    const observer = new ResizeObserver(() => {
      const rect = content.getBoundingClientRect();
      if (rect.height < 1) return;
      const viewport = area.getBoundingClientRect();
      const dock = area.querySelector('.composer-dock')?.getBoundingClientRect();
      const bottom = dock && dock.top > viewport.top ? Math.min(viewport.bottom, dock.top) : viewport.bottom;
      const overflow = rect.bottom - (bottom - 12);
      if (overflow > 0) area.scrollTop += overflow;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [sourceExpanded]);

  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  // Feedback controls appear on the most recent Console message (hover to
  // reveal). Once a choice is pinned they also stay on THAT message in
  // perpetuity — even after newer turns arrive and it's no longer the latest —
  // so the rating remains appended to the message it correlates to.
  const showFeedback = isLatest || feedback !== null;
  // Per-thumb animation state. Bumping `n` changes the icon wrapper's `key`,
  // which remounts it and (re)starts the animation named by `type`:
  //   'flash' — activation: brief transition to pure white and back to default.
  //   'fade'  — deactivation: smooth fade from icon default back to icon subtle.
  const [animUp, setAnimUp] = useState({ n: 0, type: null });
  const [animDown, setAnimDown] = useState({ n: 0, type: null });
  // While true, both thumbs are held at full opacity. It stays on for the whole
  // acknowledgement hold so the thumbs settle back to the pinned 50% at the same
  // moment the "Thank you." / "Provide feedback?" text fades out.
  const [flashActive, setFlashActive] = useState(false);
  const flashTimer = useRef(null);
  // After a deselect, keep the icon at icon-subtle even while the cursor is
  // still on it (prevents a flicker back to the hover/default color). Cleared
  // when the cursor leaves the icon, so re-hovering plays the transition anew.
  const [suppressHover, setSuppressHover] = useState(null); // 'up' | 'down' | null

  // Selecting a thumb sets it as the sole active choice. Because feedback is a
  // single value, choosing one automatically clears the other — only thumbs up
  // OR thumbs down can be active at a time. Clicking the already-active thumb
  // toggles it back off (returns to the unselected icon-subtle state).
  const select = (value) => {
    cancelAnimationFrame(revealFrame.current);
    const activating = feedback !== value;
    setFeedback(activating ? value : null);
    // In Consolidate mode the icons don't flash/fade their color on click — the
    // interaction is a pure opacity/collapse crossfade, so the white flash (which
    // also fights the "stay subtle" resting color) is suppressed there.
    const suppressAnim = feedbackRight && consolidate;
    const type = activating ? 'flash' : 'fade';
    if (!suppressAnim) {
      if (value === 'up') setAnimUp((s) => ({ n: s.n + 1, type }));
      else setAnimDown((s) => ({ n: s.n + 1, type }));
    }
    // Hold both thumbs at full opacity for the whole acknowledgement, then
    // release so they settle back to the pinned 50% at the SAME moment the
    // "Thank you." / "Provide feedback?" text fades out.
    clearTimeout(flashTimer.current);
    if (activating && !suppressAnim) {
      setFlashActive(true);
      const hold = value === 'up' ? RIGHT_HOLD : RIGHT_HOLD_DOWN;
      flashTimer.current = setTimeout(() => setFlashActive(false), hold);
    } else {
      setFlashActive(false);
    }
    // Suppress the hover color on the icon we just deactivated so it settles on
    // icon subtle without flickering; activating clears any suppression.
    setSuppressHover(activating ? null : value);
    // "Feedback right": show a short acknowledgement to the LEFT of the thumbs
    // without disturbing the source label. It fades in on
    // activation and fades out when the choice is toggled back off.
    if (feedbackRight) {
      clearTimeout(rightRevertTimer.current);
      clearTimeout(rightHideTimer.current);
      if (activating) {
        // Render the acknowledgement text while it's still hidden (opacity 0),
        // then flip it visible on the NEXT frame. Doing both in one commit gives
        // the browser no "from" state to animate, so the text would snap in; the
        // rAF guarantees a paint at opacity 0 first, producing a real fade.
        // Hover-reveal is disabled during this initial phase — otherwise the
        // row-hover CSS rule (opacity:1) would override the hidden state and the
        // text would appear instantly instead of fading.
        setRightMode(value);
        setRightVisible(false);
        setRightHoverEnabled(false);
        revealFrame.current = requestAnimationFrame(() => {
          revealFrame.current = requestAnimationFrame(() => setRightVisible(true));
        });
        // Both acknowledgements fade out after a short hold (2.5s). Once the ack
        // has been shown and faded, it's done — it does NOT come back on hover.
        // The thumb stays pinned (at 50%), but the "Thank you." / "Provide
        // feedback?" text clears out entirely and never re-reveals.
        const hold = value === 'up' ? RIGHT_HOLD : RIGHT_HOLD_DOWN;
        rightHideTimer.current = setTimeout(() => {
          setRightVisible(false);
          setRightHoverEnabled(false);
          rightRevertTimer.current = setTimeout(() => setRightMode(null), FADE);
        }, hold);
      } else {
        setRightVisible(false);
        setRightHoverEnabled(false);
        rightRevertTimer.current = setTimeout(() => setRightMode(null), FADE);
      }
    }
  };

  // "Feedback right" acknowledgement state (rendered just left of the thumbs).
  const [rightMode, setRightMode] = useState(null); // 'up' | 'down' | null
  const [rightVisible, setRightVisible] = useState(false);
  // Enabled only AFTER the acknowledgement's timed fade-out, so hovering the row
  // can bring it back. Kept off during the initial reveal so the row-hover CSS
  // doesn't force it visible and skip the fade-in.
  const [rightHoverEnabled, setRightHoverEnabled] = useState(false);
  const rightRevertTimer = useRef(null);
  const rightHideTimer = useRef(null);
  const RIGHT_HOLD = 2500; // ms the "Thank you." right-aligned ack stays up
  const RIGHT_HOLD_DOWN = 2500; // ms the "Provide feedback?" ack stays up

  // Once the feedback elicitation container is open, the "Provide feedback?"
  // link has already been acted on — suppress it entirely (even on hover) for
  // as long as the container stays open.
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false);
  useEffect(() => {
    function onState(e) {
      setFeedbackFormOpen(Boolean(e.detail?.open));
    }
    window.addEventListener('console:feedback-state', onState);
    return () => window.removeEventListener('console:feedback-state', onState);
  }, []);

  // Collision guard: on a narrow chat panel the right-aligned acknowledgement
  // ("Thank you." / "Provide feedback?") can run into the left source label. We measure the natural widths of the left text, the
  // right text and the thumbs against the row width; if they wouldn't all fit,
  // we hide the right text (the thumbs stay). Measuring with scrollWidth keeps
  // it stable — hiding the text via opacity doesn't change its measured width,
  // so there's no show/hide oscillation.
  const rowRef = useRef(null);
  const attrRef = useRef(null);
  const rightMsgRef = useRef(null);
  const thumbsRef = useRef(null);
  const [collides, setCollides] = useState(false);

  // "Consolidate": once a choice is made (with Feedback right on), the chosen
  // thumb stays and the other collapses away toward the right margin.
  const consolidated = consolidate && feedbackRight && feedback !== null;
  const consolidateClass = consolidated
    ? feedback === 'up'
      ? ' feedback-thumbs--consolidate-up'
      : ' feedback-thumbs--consolidate-down'
    : '';
  // The acknowledgement is only hover-revealable once it has completed its timed
  // fade-out (rightHoverEnabled). Un-selecting clears both the selection and the
  // flag, so a toggled-off message fades out cleanly and isn't re-revealed.
  const rightHoverable = rightHoverEnabled && feedback !== null && !feedbackFormOpen;
  // In Consolidate mode the acknowledgement uses a slower, deeper crossfade so it
  // glides in/out in step with the icon collapse instead of snapping.
  const rightMsgConsolidateClass = consolidate && feedbackRight ? ' feedback-right-msg--consolidate' : '';

  // Collision guard (measured after the content-defining state above is set up).
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const rowW = row.clientWidth;
      const leftW = attrRef.current ? attrRef.current.scrollWidth : 0;
      const rightW = rightMsgRef.current ? rightMsgRef.current.scrollWidth : 0;
      const thumbsW = thumbsRef.current ? thumbsRef.current.offsetWidth : 0;
      // left text + min gap between the two sides + right text + group gap + thumbs
      const needed = leftW + 16 + rightW + 8 + thumbsW;
      setCollides(rightW > 0 && needed > rowW);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
    // Re-measure when the row's content changes (which side shows what) — the
    // ResizeObserver covers panel-width changes.
  }, [rightMode, rightVisible, rightHoverEnabled, sourceItems, showFeedback, feedbackFormOpen]);
  const FADE = 260; // ms — must match the .attribution-line CSS transition
  // When feedback is submitted from the elicitation container, Console shows no
  // new thread message — instead the message that was rated re-plays the same
  // right-aligned "Thank you" acknowledgement (same reveal → hold → fade
  // treatment as a thumbs-up). Only the originating message responds.
  useEffect(() => {
    function onSubmitted(event) {
      if (event.detail?.feedbackId !== feedbackId) return;
      cancelAnimationFrame(revealFrame.current);
      clearTimeout(rightRevertTimer.current);
      clearTimeout(rightHideTimer.current);
      setRightMode('submitted'); // "Feedback submitted"
      setRightVisible(false);
      setRightHoverEnabled(false);
      revealFrame.current = requestAnimationFrame(() => {
        revealFrame.current = requestAnimationFrame(() => setRightVisible(true));
      });
      rightHideTimer.current = setTimeout(() => {
        setRightVisible(false);
        setRightHoverEnabled(false);
        rightRevertTimer.current = setTimeout(() => setRightMode(null), FADE);
      }, RIGHT_HOLD);
    }
    window.addEventListener('console:feedback-submitted', onSubmitted);
    return () => window.removeEventListener('console:feedback-submitted', onSubmitted);
  }, [feedbackId]);

  const clearSuppress = (value) => setSuppressHover((s) => (s === value ? null : s));

  // Tooltip is rendered in a portal on document.body with fixed positioning so
  // it always sits above all console content and is never clipped by the
  // scroll/canvas containers' overflow. Shown after a short hover delay, and
  // faded out (not instantly removed) on mouse-leave or click.
  const [tip, setTip] = useState(null); // { text, left, top } | null
  const [tipVisible, setTipVisible] = useState(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const tipFrame = useRef(null);
  useEffect(() => () => {
    clearTimeout(flashTimer.current);
    clearTimeout(rightHideTimer.current);
    clearTimeout(rightRevertTimer.current);
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
    cancelAnimationFrame(revealFrame.current);
    cancelAnimationFrame(tipFrame.current);
  }, []);

  const showTip = (text, el) => {
    if (!tooltipsEnabled) return; // Tooltips disabled in the Controls panel.
    clearTimeout(hideTimer.current);
    clearTimeout(showTimer.current);
    const r = el.getBoundingClientRect();
    const left = r.left + r.width / 2;
    const top = r.top - 8; // sit above the icon; translateY(-100%) in CSS
    showTimer.current = setTimeout(() => {
      setTip({ text, left, top });
      // Mount at opacity 0, then flip visible next frame to trigger the fade-in.
      tipFrame.current = requestAnimationFrame(() => setTipVisible(true));
    }, 150);
  };
  const hideTip = () => {
    cancelAnimationFrame(tipFrame.current);
    clearTimeout(showTimer.current);
    setTipVisible(false); // fade out, then unmount once the transition ends
    hideTimer.current = setTimeout(() => setTip(null), 340);
  };

  const animClass = (a) =>
    a.n > 0 ? (a.type === 'flash' ? 'feedback-thumb__flash' : 'feedback-thumb__fade') : undefined;

  // Older responses without sources or retained feedback need no footer space.
  const rowHasContent = showFeedback || hasSources;

  return (
    <>
      {children && <div className="artifact-pills">{children}</div>}
      {rowHasContent && (
      <div
        ref={rowRef}
        className="computed-by-console"
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {hasSources && <span
          ref={attrRef}
          data-chat-nav={hasSources ? true : undefined}
          className={`attribution-line m-0 font-normal${hasSources ? ' disclosure-trigger' : ''}`}
          style={{
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--color-text-tertiary)',
            cursor: hasSources ? 'pointer' : undefined,
          }}
          onClick={hasSources ? (e) => { e.stopPropagation(); setSourceExpanded((v) => !v); } : undefined}
          role={hasSources ? 'button' : undefined}
          tabIndex={hasSources ? 0 : undefined}
          aria-expanded={hasSources ? sourceExpanded : undefined}
          aria-controls={hasSources ? sourceId : undefined}
          onKeyDown={hasSources ? event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              setSourceExpanded(value => !value);
            }
          } : undefined}
        >
          {deriveAttribution(sourceItems)}
          <DisclosureChevron expanded={sourceExpanded} />
        </span>}
        <div
          className="feedback-right-group"
          style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', marginLeft: 'auto' }}
        >
          {feedbackRight && (
            <span
              ref={rightMsgRef}
              className={`attribution-line feedback-right-msg${
                rightHoverable && !collides ? ' feedback-right-msg--hoverable' : ''
              }${rightMsgConsolidateClass} m-0 font-normal${
                rightVisible && !feedbackFormOpen && !collides ? '' : ' is-hidden'
              }`}
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                color: 'var(--color-text-tertiary)',
                // Keep it a single line so scrollWidth always reports the full
                // natural width (used by the collision guard), never a wrapped
                // subset.
                whiteSpace: 'nowrap',
                // When colliding, drop the text out of flow so the row no longer
                // overflows — that keeps `justify-content: space-between` pinning
                // the thumbs flush right instead of sliding them left. It stays
                // measurable (scrollWidth) since it still renders its content.
                ...(collides ? { position: 'absolute', right: 0 } : null),
              }}
            >
              {rightMode === 'up' && 'Thank you'}
              {rightMode === 'submitted' && 'Feedback submitted'}
              {rightMode === 'down' && (
                <a
                  href="#"
                  className="see-how-link"
                  onClick={(e) => {
                    e.preventDefault();
                    // Ask the conversation panel to morph its bottom prompt into
                    // the feedback elicitation form.
                    window.dispatchEvent(new CustomEvent('console:provide-feedback', { detail: { feedbackId } }));
                  }}
                >
                  Provide feedback?
                </a>
              )}
            </span>
          )}
            {showFeedback && (
            <div
              ref={thumbsRef}
              className={`feedback-thumbs${
                selectedColor === 'blurple' ? ' feedback-thumbs--blurple' : ''
              }${persistent ? ' feedback-thumbs--persistent' : ''}${
                feedback !== null ? ' feedback-thumbs--pinned' : ''
              }${flashActive ? ' feedback-thumbs--flashing' : ''}${consolidateClass}`}
            >
          <button
            type="button"
            className={`feedback-thumb feedback-thumb--up${
              feedback === 'up' ? ' feedback-thumb--selected' : ''
            }${suppressHover === 'up' ? ' feedback-thumb--suppress-hover' : ''}`}
            aria-label="Good response"
            aria-pressed={feedback === 'up'}
            onClick={() => {
              select('up');
              hideTip();
            }}
            onMouseEnter={(e) => showTip('Good response', e.currentTarget)}
            onMouseLeave={() => {
              clearSuppress('up');
              hideTip();
            }}
          >
            <span key={animUp.n} className={animClass(animUp)}>
              <UpIcon size={12} />
            </span>
          </button>
          <button
            type="button"
            className={`feedback-thumb feedback-thumb--down${
              feedback === 'down' ? ' feedback-thumb--selected' : ''
            }${suppressHover === 'down' ? ' feedback-thumb--suppress-hover' : ''}`}
            aria-label="Bad response"
            aria-pressed={feedback === 'down'}
            onClick={() => {
              select('down');
              hideTip();
            }}
            onMouseEnter={(e) => showTip('Bad response', e.currentTarget)}
            onMouseLeave={() => {
              clearSuppress('down');
              hideTip();
            }}
          >
            <span key={animDown.n} className={animClass(animDown)}>
              <DownIcon size={12} />
            </span>
          </button>
        </div>
            )}
        </div>
      </div>
      )}
      {hasSources && (
        <div id={sourceId} ref={sourceExpandRef} className="disclosure-content" data-expanded={sourceExpanded} inert={!sourceExpanded} aria-hidden={!sourceExpanded}>
        <div className="disclosure-content-inner">
        <div className="source-expand-section source-expand-section--inline">
          {sourceItems.map((item, i) => (
            <SourceItemRow
              key={i}
              item={item}
              size={10}
              className="source-expand-item"
              onApiClick={onApiClick}
              onOpenSourceTab={onOpenSourceTab}
            />
          ))}
        </div>
        </div>
        </div>
      )}
      {tip &&
        createPortal(
          <div
            className={`feedback-tooltip${tipVisible ? ' is-visible' : ''}`}
            role="tooltip"
            style={{ left: tip.left, top: tip.top }}
          >
            {tip.text}
          </div>,
          document.body,
        )}
    </>
  );
}
