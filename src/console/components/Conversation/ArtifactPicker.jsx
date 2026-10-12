import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useState } from 'react';
import { CANVAS_TAB_DATA, CANVAS_TAB_ICONS } from '../Canvas/canvasArtifactRegistry';
import { ContextMenu } from '../Menu/ContextMenu';

export function ArtifactPicker({ isOpen, ...props }) {
  return isOpen ? <OpenArtifactPicker key={props.query ?? ''} {...props} /> : null;
}

function OpenArtifactPicker({ caretLeft, caretTop, caretBottom, anchorRef, tabIds, query = '', onSelect, onClose, onPreviewChange }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const filteredIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tabIds.filter(id => CANVAS_TAB_DATA[id] &&
      (!normalized || CANVAS_TAB_DATA[id].label.toLowerCase().includes(normalized)));
  }, [tabIds, query]);
  const selectedIndex = Math.min(activeIdx, Math.max(0, filteredIds.length - 1));
  const activeId = filteredIds[selectedIndex] ?? null;
  const preview = useEffectEvent(id => onPreviewChange?.(id));

  useEffect(() => {
    preview(activeId);
    return () => preview(null);
  }, [activeId]);

  useLayoutEffect(() => {
    const element = anchorRef?.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setAnchor({ left: rect.left, top: rect.top, bottom: rect.bottom,
        viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchorRef]);

  // Keyboard navigation — capture phase so Enter/Escape intercept before
  // the contenteditable's own keydown handler sees them.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIdx((i) => Math.max(0, Math.min(i + 1, filteredIds.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const tabId = filteredIds[selectedIndex];
        if (tabId) {
          const data = CANVAS_TAB_DATA[tabId];
          onSelect(tabId, data?.label ?? tabId);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [selectedIndex, filteredIds, onSelect, onClose]);

  if (!anchor) return null;
  const { viewportWidth, viewportHeight } = anchor;

  const PICKER_W = Math.min(240, viewportWidth - 16);
  const ROW_H = 36;
  const MAX_VISIBLE_ROWS = 7;
  const GAP = 10;
  const topAnchor = caretTop ?? anchor.top;
  const bottomAnchor = caretBottom ?? anchor.bottom;
  const spaceAbove = Math.max(0, topAnchor - GAP - 8);
  const spaceBelow = Math.max(0, viewportHeight - bottomAnchor - GAP - 8);

  // Use the full max height to decide direction — this keeps the direction stable
  // as result count changes so the picker never flips sides mid-session.
  const opensBelow = spaceBelow > spaceAbove && spaceBelow >= (MAX_VISIBLE_ROWS * ROW_H + 8);

  const visibleRows = filteredIds.length === 0 ? 1 : Math.min(filteredIds.length, MAX_VISIBLE_ROWS);
  const maxHeight = visibleRows * ROW_H + 8;
  const x = Math.max(8, Math.min(caretLeft ?? anchor.left + 16, viewportWidth - PICKER_W - 8));

  // When opening above, use CSS `bottom` anchoring so the picker's bottom edge
  // stays pinned at the caret regardless of how tall the list grows or shrinks.
  // ContextMenu sets `top: position.y` first; the style prop spreads after and
  // overrides it, so passing `top: 'unset'` + `bottom` works correctly.
  const pickerMaxHeight = Math.min(maxHeight, opensBelow ? spaceBelow : spaceAbove);
  const posStyle = opensBelow
    ? { top: bottomAnchor + GAP }
    : { top: 'unset', bottom: viewportHeight - topAnchor + GAP };

  return (
    <ContextMenu
      isOpen={true}
      position={{ x, y: opensBelow ? bottomAnchor + GAP : 0 }}
      onClose={onClose}
      className="artifact-picker-menu"
      style={{ width: PICKER_W, ...posStyle }}
    >
      <div style={{ maxHeight: pickerMaxHeight, overflowY: 'auto' }}>
      {filteredIds.length === 0 ? (
        <div style={{ padding: '6px 10px', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          {tabIds.length === 0 ? 'No artifacts in this chat yet' : 'No matches'}
        </div>
      ) : (
        filteredIds.map((tabId, idx) => {
          const data = CANVAS_TAB_DATA[tabId];
          const Icon = CANVAS_TAB_ICONS[tabId];
          if (!data) return null;
          const isActive = idx === selectedIndex;
          return (
            <div
              key={tabId}
              role="option"
              aria-selected={isActive}
              className="item-popup-row artifact-picker-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: isActive ? '#28282c' : 'transparent',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(tabId, data.label);
              }}
            >
              {Icon && (
                <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <Icon size={12} />
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.label}
              </span>
            </div>
          );
        })
      )}
      </div>
    </ContextMenu>
  );
}
