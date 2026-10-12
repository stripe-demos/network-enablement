import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ContextMenu } from '../Menu/ContextMenu';
import { CloseIcon } from '../icons';
import { contextUsageSample, formatTokenCount } from '../../data/contextUsageSample';

function anchoredPosition(element, preferredWidth) {
  const rect = element.getBoundingClientRect();
  const width = Math.min(preferredWidth, window.innerWidth - 16);
  const above = rect.top > window.innerHeight - rect.bottom;
  return {
    width,
    left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
    top: above ? 'auto' : rect.bottom + 8,
    bottom: above ? window.innerHeight - rect.top + 8 : 'auto',
    maxHeight: Math.max(60, (above ? rect.top : window.innerHeight - rect.bottom) - 16),
  };
}

export function ContextUsage({ usage, onCompact }) {
  const tooltipId = useId();
  const panelId = useId();
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const suppressFocusTooltip = useRef(false);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [panelPosition, setPanelPosition] = useState(null);
  const { used, limit, categories } = contextUsageSample(usage);

  function showTooltip() {
    if (suppressFocusTooltip.current) { suppressFocusTooltip.current = false; return; }
    if (!panelPosition && triggerRef.current) setTooltipPosition(anchoredPosition(triggerRef.current, 184));
  }

  function closePanel(restoreFocus = false) {
    setPanelPosition(null);
    setTooltipPosition(null);
    if (restoreFocus) {
      suppressFocusTooltip.current = true;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    if (panelPosition) closeRef.current?.focus({ preventScroll: true });
  }, [panelPosition]);

  useEffect(() => {
    if (!tooltipPosition && !panelPosition) return;
    const hide = event => {
      if (event.type === 'scroll' && panelRef.current?.closest('.context-usage-popover')?.contains(event.target)) return;
      setTooltipPosition(null);
      setPanelPosition(null);
    };
    const escape = event => { if (event.key === 'Escape') setTooltipPosition(null); };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    document.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      document.removeEventListener('keydown', escape);
    };
  }, [tooltipPosition, panelPosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="prompt-composer__usage"
        aria-label={`Context usage: ${usage}%. View details`}
        aria-haspopup="dialog"
        aria-expanded={Boolean(panelPosition)}
        aria-controls={panelPosition ? panelId : undefined}
        aria-describedby={tooltipPosition ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setTooltipPosition(null)}
        onFocus={showTooltip}
        onBlur={() => setTooltipPosition(null)}
        onMouseDown={event => { if (panelPosition) event.stopPropagation(); }}
        onClick={() => {
          setTooltipPosition(null);
          if (panelPosition) closePanel();
          else setPanelPosition(anchoredPosition(triggerRef.current, 360));
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6" fill="none" stroke="var(--color-border-default)" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" pathLength="100" strokeDasharray={`${usage} 100`} transform="rotate(-90 8 8)" />
        </svg>
      </button>
      {tooltipPosition && createPortal(
        <div id={tooltipId} role="tooltip" className="feedback-tooltip is-visible composer-context-tooltip" style={tooltipPosition}>
          <div>{usage}% context used</div>
          <div className="composer-context-tooltip__tokens">{formatTokenCount(used)} / {formatTokenCount(limit)} tokens</div>
        </div>,
        document.body,
      )}
      <ContextMenu
        isOpen={Boolean(panelPosition)}
        position={panelPosition ? { x: panelPosition.left, y: 0 } : null}
        onClose={() => closePanel()}
        className="context-usage-popover"
        style={panelPosition}
      >
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Context usage"
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePanel(true); }
          }}
          onBlur={event => {
            if (event.relatedTarget !== triggerRef.current && !event.currentTarget.contains(event.relatedTarget)) closePanel();
          }}
        >
          <div className="context-usage-popover__header">
            <span>Context usage</span>
            <button ref={closeRef} type="button" className="context-usage-popover__close" aria-label="Close context usage" onClick={() => closePanel(true)}><CloseIcon size={12} /></button>
          </div>
          <div className="context-usage-popover__totals">
            <span>{usage}% full</span>
            <span>~{formatTokenCount(used)} / {formatTokenCount(limit)} tokens</span>
          </div>
          <div className="context-usage-popover__bar" role="meter" aria-label="Context used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usage}>
            {categories.map(category => <span key={category.label} style={{ width: `${category.tokens / limit * 100}%`, background: category.color }} />)}
          </div>
          <dl className="context-usage-popover__breakdown">
            {categories.map(category => (
              <div key={category.label}>
                <dt><span className="context-usage-popover__swatch" style={{ background: category.color }} aria-hidden="true" />{category.label}</dt>
                <dd>{formatTokenCount(category.tokens)}</dd>
              </div>
            ))}
          </dl>
          <div className="context-usage-popover__compaction">
            <p>As this chat fills up, summarize it and continue in a new chat. The summary carries forward key details and makes room for what’s next.</p>
            <button type="button" className="context-usage-popover__compact" disabled={!onCompact || used === 0} onClick={() => { onCompact?.(); closePanel(); }}>
              Summarize and start new chat
            </button>
          </div>
        </div>
      </ContextMenu>
    </>
  );
}
