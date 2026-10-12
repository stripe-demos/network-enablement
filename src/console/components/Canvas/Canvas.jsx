import { deriveAttribution } from '../../data/sourceAttribution';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CanvasTabIconCode } from './tab-icons/CanvasTabIcons';
import { ClockIcon, CloseIcon, EyeOpenIcon, MenuDotsIcon, SourceIcon } from '../icons';
import { BarChart } from './BarChart';
import { Chart } from './Chart';
import { MultiChartLayout } from './MultiChartLayout';
import { MULTI_CHART_TAB_IDS, defaultPanelsWithIds, defaultRowSizes } from './multiChartStorage';
import { Table } from './Table';
import { CodeView } from './CodeView';
import { TextView } from './TextView';
import { CanvasEmptyState } from './CanvasEmptyState';
import { SourceItemRow } from '../Conversation/ArtifactChips';
import { ContextMenu } from '../Menu/ContextMenu';
import { CANVAS_TAB_ORDER } from './canvasTabOrder';
import {
  CANVAS_TAB_DATA as TAB_DATA,
  CANVAS_TAB_ICONS as TAB_ICONS,
  ARTIFACT_TYPE_ICONS,
  artifactShowsEditorChrome,
} from './canvasArtifactRegistry';

const STAMP_TOOLTIP_WIDTH = 224;

/** Frosted-glass popover tooltip — Console Spec (Figma 16523:26857).
 *  Portaled to document.body so it is not clipped by the canvas overflow. */
function StampTooltip({ children, tooltip }) {
  const wrapRef = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.right - STAMP_TOOLTIP_WIDTH, window.innerWidth - STAMP_TOOLTIP_WIDTH - 8));
    setPos({ top: r.bottom + 8, left });
  };
  const hide = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    const hideOnScroll = () => setPos(null);
    window.addEventListener('scroll', hideOnScroll, true);
    window.addEventListener('resize', hideOnScroll);
    return () => {
      window.removeEventListener('scroll', hideOnScroll, true);
      window.removeEventListener('resize', hideOnScroll);
    };
  }, [pos]);

  return (
    <div
      ref={wrapRef}
      className="canvas-content-header__stamp flex items-center"
      style={{ gap: 4, cursor: 'default' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {pos && createPortal(
        <div
          className="canvas-stamp-tooltip"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: STAMP_TOOLTIP_WIDTH,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border-default)',
            background: 'rgba(28, 28, 31, 0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--color-text-secondary)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {tooltip}
        </div>,
        document.body,
      )}
    </div>
  );
}

// Canvas form factor of the source list — the same typed rows as the
// conversation, surfaced on hover from the header stamp instead of inline.
function SourceStampPopover({ items, onOpenSourceTab, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const closeTimer = useRef(null);
  const triggerRef = useRef(null);

  const handleEnter = () => {
    clearTimeout(closeTimer.current);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Right-aligned to the trigger: the stamp sits at the canvas's right
      // edge, so anchoring the left edge would push the popover off-screen.
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <>
      <span
        ref={triggerRef}
        className="flex items-center"
        style={{ gap: 4, cursor: 'default' }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </span>
      {open && pos && createPortal(
        <div
          className="source-tooltip-popover source-tooltip-popover--below"
          style={{ position: 'fixed', top: pos.top, right: pos.right }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="source-tooltip-header">{items.length} {items.length === 1 ? 'source' : 'sources'}</div>
          {items.map((item, i) => (
            <SourceItemRow key={i} item={item} size={11} onOpenSourceTab={onOpenSourceTab} />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

/** Canvas title row under tabs — Console Spec (Figma 16763:57420). */
function CanvasContentHeader({ title, freshnessLabel = 'Updated just now', sourceLabel = 'Custom', sourceTooltip, showSource = true, sourceItems, onOpenSourceTab }) {
  const hasSourceItems = Array.isArray(sourceItems) && sourceItems.length > 0;
  return (
    <header
      id="canvasContentHeader"
      className="canvas-content-header box-border flex w-full shrink-0 self-stretch items-end justify-between"
      style={{ padding: 24, flexWrap: 'wrap', columnGap: 16, rowGap: 8 }}
      data-canvas-chrome="header-v2"
    >
      <div
        id="canvasHeading"
        className="font-semibold"
        style={{
          fontSize: 20,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          overflowWrap: 'break-word',
          color: 'var(--color-text-primary)',
          flex: '1 1 12rem',
          minWidth: 'min(100%, 12rem)',
        }}
      >
        {title}
      </div>
      <div
        className="canvas-content-header__stamps flex shrink-0 items-center"
        style={{ gap: 12 }}
        aria-label="Artifact metadata"
      >
        <span className="flex items-center" style={{ gap: 4 }}>
          <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center' }} aria-hidden>
            <ClockIcon size={10} />
          </span>
          <p className="m-0 whitespace-nowrap font-normal" style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--color-text-tertiary)' }}>
            {freshnessLabel}
          </p>
        </span>
        {showSource && hasSourceItems && (
          <SourceStampPopover items={sourceItems} onOpenSourceTab={onOpenSourceTab}>
            <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center' }} aria-hidden>
              <SourceIcon size={10} />
            </span>
            <p className="m-0 whitespace-nowrap font-normal" style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--color-text-tertiary)' }}>
              {deriveAttribution(sourceItems)}
            </p>
          </SourceStampPopover>
        )}
        {showSource && !hasSourceItems && (
          <StampTooltip tooltip={sourceTooltip || `From your ${sourceLabel} data. Data as of 1 hour ago.`}>
            <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center' }} aria-hidden>
              <SourceIcon size={10} />
            </span>
            <p className="m-0 whitespace-nowrap font-normal" style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--color-text-tertiary)' }}>
              Source: {sourceLabel}
            </p>
          </StampTooltip>
        )}
      </div>
    </header>
  );
}

function ArtifactTabPlaceholder({ title }) {
  return (
    <div
      className="flex flex-1 flex-col min-h-0 min-w-0 p-6 text-text-secondary text-sm"
      style={{ gap: 8 }}
    >
      <p className="text-text-primary font-medium">Artifact preview</p>
      <p className="text-text-primary">{title}</p>
      <p className="opacity-70">Prototype-only tab for truncation and overflow demos.</p>
    </div>
  );
}

function isEditorFileType(tabId) {
  return artifactShowsEditorChrome(TAB_DATA[tabId]?.artifactType);
}


/** Gap between tab pills and "N more" inside the track. */
const TAB_BAR_PILL_GAP_PX = 8;
/**
 * Space between the tab track column and the Save/actions column (CSS margin on
 * `.tab-bar-actions`). Flex already shrinks the track by the actions width; this is
 * only the gap between those two columns.
 */
const TAB_BAR_TRACK_TO_ACTIONS_GAP_PX = 20;
/**
 * Maximum rendered width of `.tab-bar-actions` — save(52) + gap(12) + toggle(44) + gap(8) + kebab(28).
 * Packing math always subtracts this from the bar width regardless of which buttons are
 * currently visible. This decouples tab-count calculation from actions state so k never
 * changes just because an editor tab is opened (which shows Save/toggle).
 */
const TAB_ACTIONS_MAX_W = 144;
/** Tab bar horizontal padding (24px each side). */
const TAB_BAR_H_PADDING_PX = 48;
/**
 * Small breathing room so the last pill / "N more" isn't flush against the actions column.
 */
const TAB_TRACK_TAIL_RESERVE_PX = 8;

/**
 * Reserve width for the "N more" control in packing math only (do not measure the live
 * control — its label depends on N and caused feedback). Keep close to real CSS width
 * for typical "NN more" + chevron so we don't over-hide tabs.
 */
const MORE_TRIGGER_ESTIMATE_PX = 80;

/** Pill close-out duration; keep in sync with `.tab-pill--closing` CSS. */
const TAB_CLOSE_ANIM_MS = 120;
/** FLIP slide when tabs reflow after close; keep in sync with CSS if added there. */
const TAB_INLINE_SLIDE_MS = 340;

/** Used to keep the "N more" menu inside the viewport horizontally. */
const TAB_OVERFLOW_MENU_MIN_W = 280;
const VIEWPORT_MENU_MARGIN = 8;

function clampTabOverflowMenuPosition(left, top, overflowCount) {
  if (typeof window === 'undefined') return { x: left, y: top };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = VIEWPORT_MENU_MARGIN;
  const maxLeft = Math.max(m, vw - m - TAB_OVERFLOW_MENU_MIN_W);
  const x = Math.min(Math.max(left, m), maxLeft);
  const rowH = 34;
  const estHeight = Math.min(vh - 2 * m, 12 + overflowCount * rowH);
  let y = top;
  if (y + estHeight > vh - m) {
    y = Math.max(m, vh - m - estHeight);
  }
  if (y < m) y = m;
  return { x, y };
}

function ChevronDownTiny() {
  return (
    <svg width={10} height={10} viewBox="0 0 10 10" fill="none" aria-hidden className="tab-bar-more__chev">
      <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function computeInlineTabCount(barInnerWidth, tabIds, widthById, moreBtnWidth) {
  if (!tabIds.length) return 0;
  if (tabIds.length === 1) return 1;

  const gap = TAB_BAR_PILL_GAP_PX;
  const widths = tabIds.map((id) => widthById[id] ?? 72);

  let sumAll = 0;
  for (let i = 0; i < widths.length; i++) {
    sumAll += widths[i] + (i > 0 ? gap : 0);
  }
  if (sumAll <= barInnerWidth) return tabIds.length;

  const moreW = moreBtnWidth > 0 ? moreBtnWidth : MORE_TRIGGER_ESTIMATE_PX;
  let used = 0;
  let k = 0;
  for (let i = 0; i < tabIds.length; i++) {
    const w = widths[i];
    const step = i === 0 ? w : gap + w;
    const remainingAfter = tabIds.length - i - 1;
    const needMore = remainingAfter > 0 ? gap + moreW : 0;
    if (used + step + needMore <= barInnerWidth) {
      used += step;
      k = i + 1;
    } else {
      break;
    }
  }
  return Math.max(1, k);
}

function buildInitialMultiChartState() {
  const o = {};
  for (const tabId of MULTI_CHART_TAB_IDS) {
    const panels = TAB_DATA[tabId]?.panels;
    if (!Array.isArray(panels) || panels.length < 2) continue;
    const defaultPanels = defaultPanelsWithIds(tabId, panels);
    o[tabId] = { panels: defaultPanels, rowSizes: defaultRowSizes(defaultPanels.length) };
  }
  return o;
}

export function Canvas({
  chat,
  preparingChart = false,
  activeTab,
  onTabChange,
  layout = 'default',
  visibleTabIds = CANVAS_TAB_ORDER,
  onCloseTab = () => {},
  onExpandPanel,
  onCollapseMultiChart,
  mentionedTabIds = [],
  mentionedRawIds = [],
  onCmdLSelect,
  onOpenSourceTab,
}) {
  const reducedMotion = useReducedMotion();
  const [artifactViewMode, setArtifactViewMode] = useState('preview');
  /** Unsaved edits for the active editor artifact (markdown / code); cleared on Save or tab change. */
  const [editorDirty, setEditorDirty] = useState(false);
  /** Ref to the active CodeView instance; exposes save() without state round-trips. */
  const codeViewRef = useRef(null);
  /** Refs for editorDirty and showEditorHeaderActions so Cmd+S handler only registers once. */
  const editorDirtyRef = useRef(false);
  const showEditorHeaderActionsRef = useRef(false);
  /** Ref for onCloseTab so the close-animation timer doesn't reset when the prop reference changes. */
  const onCloseTabRef = useRef(onCloseTab);
  /** Session-only panel order and layout; initialized from the shared defaults. */
  const [multiChartState, setMultiChartState] = useState(buildInitialMultiChartState);
  /** Custom labels for renamed tabs, keyed by tabId. */
  const [tabLabels] = useState({});

  /** Tracks the currently hovered chart element for Shift+click element references. */
  const hoveredElementRef = useRef(null);
  const activeTabRef = useRef(activeTab);
  const tabLabelsRef = useRef(tabLabels);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useLayoutEffect(() => { tabLabelsRef.current = tabLabels; }, [tabLabels]);

  const onElementHover = useCallback((info) => {
    hoveredElementRef.current = info;
  }, []);

  const tabBarRef = useRef(null);
  const mainTrackRef = useRef(null);
  const tabBarActionsRef = useRef(null);
  const moreBtnRef = useRef(null);
  // Track the last measured track.clientWidth so remeasure can gate k increases.
  // k is only allowed to grow when the track physically got wider (real resize),
  // preventing overflow promotion from silently pulling in an extra tab when the
  // promoted tab is narrower than the one it replaced.
  const lastTrackInnerRef = useRef(null);
  const inlineTabCountRef = useRef(0);
  const [overflowMenuPos, setOverflowMenuPos] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState(null);
  const [inlineTabCount, setInlineTabCount] = useState(visibleTabIds.length);
  /** Permutation of `visibleTabIds` for pill order; overflow selection swaps into the last inline slot. */
  const [displayOrder, setDisplayOrder] = useState(() => [...visibleTabIds]);
  const visibleTabIdsKey = useMemo(() => visibleTabIds.join('\0'), [visibleTabIds]);

  const [closingTabId, setClosingTabId] = useState(null);
  const closeTabAnimTimerRef = useRef(null);
  // Minimum k to enforce after an overflow promotion. The promoted tab may be
  // wider than the tab it replaced, causing packing math to return k-1. We
  // prevent that decrease by holding a floor until the bar physically widens.
  // Unlike the old one-shot skipKDecreaseRef flag, this persists across multiple
  // remeasure calls (layout-effect + ResizeObserver initial-observation) so both
  // can't sneak a decrease past it.
  const kMinAfterPromotionRef = useRef(null);
  const prevTabTrackLeftRef = useRef(null);
  const prevVisibleLenForFlipRef = useRef(null);
  // Kept in sync via useLayoutEffect so the activeTab-change effect can read
  // the latest order without adding displayOrder to its deps (which would
  // cause it to re-run on every reorder and loop).
  const displayOrderRef = useRef(displayOrder);

  // Reset local pill permutation when the canonical tab id list changes (close / reorder from parent).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-way sync when `visibleTabIdsKey` changes
    setDisplayOrder([...visibleTabIds]);
    // Reset the track-width gate so the next remeasure after a tab-list change
    // (chat switch, tab added/removed) computes k freely without clamping.
    lastTrackInnerRef.current = null;
    kMinAfterPromotionRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key encodes list identity; omit `visibleTabIds` so a new [] ref each render does not undo overflow swaps
  }, [visibleTabIdsKey]);

  // Keep displayOrderRef current so the external-navigation effect (below the
  // promoteOverflow callbacks) can read it without adding displayOrder to deps.
  useLayoutEffect(() => {
    displayOrderRef.current = displayOrder;
  }, [displayOrder]);

  // If the active tab ended up in overflow (e.g. remeasure ran before the swap
  // landed, or the swap was a no-op), force it into the correct visible slot so
  // the selected tab is always shown inline — never hidden behind "N more".
  // Which slot depends on the promotion variant: 'last' puts it at k-1 (current
  // default), 'first' puts it at 0 (new variant).
  const rawInlineIds = displayOrder.slice(0, inlineTabCount);
  const activeInOverflow =
    activeTab != null &&
    !rawInlineIds.includes(activeTab) &&
    displayOrder.includes(activeTab);
  // Active tab in overflow always promotes to last inline slot.
  const inlineIds = activeInOverflow
    ? [...rawInlineIds.slice(0, -1), activeTab]
    : rawInlineIds;
  const inlineIdSet = new Set(inlineIds);
  const overflowIds = displayOrder.filter((id) => !inlineIdSet.has(id));
  const showOverflowTrigger = overflowIds.length > 0;
  const canCloseAnyTab = displayOrder.length >= 1;

  const showEditorHeaderActions = isEditorFileType(activeTab);
  /** View toggle (preview ↔ code) is only meaningful for markdown; code files have no preview mode. */
  const showViewToggle = TAB_DATA[activeTab]?.artifactType === 'markdown';
  /** Save is only shown in edit (code) view for markdown; always shown for plain code tabs. */
  const showSaveBtn = showEditorHeaderActions && !(showViewToggle && artifactViewMode === 'preview');

  /** Promote overflow `selectedId` into the last inline slot.
   *  The tab that was previously last-inline moves to the FIRST overflow position,
   *  not to wherever selectedId was sitting in the overflow list. */
  const promoteOverflowTabToLastInline = useCallback((selectedId, k) => {
    if (k < 1) return;
    setDisplayOrder((order) => {
      const slot = k - 1; // last inline index
      const lastInlineId = order[slot];
      if (!lastInlineId || lastInlineId === selectedId) return order;
      const iSel = order.indexOf(selectedId);
      if (iSel === -1 || iSel <= slot) return order;
      // Remove selectedId from its overflow position, place it at slot,
      // and push the displaced lastInlineId to position k (first overflow slot).
      const next = order.filter((id) => id !== selectedId);
      next.splice(slot, 1, selectedId);   // replace slot with promoted tab
      next.splice(k, 0, lastInlineId);    // insert displaced tab at first overflow position
      return next;
    });
  }, []);

// Persist the promotion when activeTab lands in overflow via external navigation
  // (artifact pill click) rather than the overflow menu. Existing overflow tabs
  // always promote to the last inline slot; new tabs inserted at index 0 are
  // already inline so this effect exits early via the idx < k guard.
  useEffect(() => {
    if (activeTab == null) return;
    const k = inlineTabCountRef.current;
    const idx = displayOrderRef.current.indexOf(activeTab);
    if (idx === -1 || idx < k) return;
    kMinAfterPromotionRef.current = k;
    promoteOverflowTabToLastInline(activeTab, k);
  }, [activeTab, promoteOverflowTabToLastInline]);

  const handleMultiPanelsChange = useCallback(
    (tabId, nextPanels) => {
      setMultiChartState((prev) => {
        const cur = prev[tabId];
        if (!cur) return prev;
        return { ...prev, [tabId]: { ...cur, panels: nextPanels } };
      });
    },
    [],
  );

  const handleRemovePanel = useCallback(
    (tabId, panelId) => {
      const cur = multiChartState[tabId];
      if (!cur) return;
      const nextPanels = cur.panels.filter((p) => String(p.id) !== String(panelId));
      if (nextPanels.length === 0 || nextPanels.length === cur.panels.length) return;

      if (nextPanels.length === 1) {
        // Collapse to a standalone single-chart tab replacing the multi-chart.
        const remaining = nextPanels[0];
        const newId = `expanded_${remaining.id}_${Date.now()}`;
        TAB_DATA[newId] = {
          artifactType: 'chart',
          chartVariant: remaining.chartVariant ?? 'line',
          label: remaining.headingLarge,
          heading: remaining.headingLarge,
          headingLarge: remaining.headingLarge,
          sub: remaining.sub ?? '',
          ...(remaining.chartVariant === 'bar'
            ? { barDataKey: remaining.barDataKey ?? 'queueDepth', legendLabel: remaining.legendLabel ?? 'Volume' }
            : { chartDataKey: remaining.chartDataKey ?? 'default' }),
        };
        TAB_ICONS[newId] = ARTIFACT_TYPE_ICONS['chart'];
        onCollapseMultiChart?.(newId, tabId);
        return;
      }

      const nextRowSizes = defaultRowSizes(nextPanels.length);
      setMultiChartState(prev => ({ ...prev, [tabId]: { panels: nextPanels, rowSizes: nextRowSizes } }));
    },
    [multiChartState, onCollapseMultiChart],
  );

  const handleExpandPanel = useCallback(
    (panel) => {
      const newId = `expanded_${panel.id}_${Date.now()}`;
      TAB_DATA[newId] = {
        artifactType: 'chart',
        chartVariant: panel.chartVariant ?? 'line',
        label: panel.headingLarge,
        heading: panel.headingLarge,
        headingLarge: panel.headingLarge,
        sub: panel.sub ?? '',
        ...(panel.chartVariant === 'bar'
          ? { barDataKey: panel.barDataKey ?? 'queueDepth', legendLabel: panel.legendLabel ?? 'Volume' }
          : { chartDataKey: panel.chartDataKey ?? 'default' }),
      };
      TAB_ICONS[newId] = ARTIFACT_TYPE_ICONS['chart'];
      onExpandPanel?.(newId);
    },
    [onExpandPanel],
  );

  // Keep refs in sync so the Cmd+S handler (registered once) always reads current values.
  useEffect(() => { editorDirtyRef.current = editorDirty; }, [editorDirty]);
  useEffect(() => { showEditorHeaderActionsRef.current = showEditorHeaderActions; }, [showEditorHeaderActions]);
  useLayoutEffect(() => { onCloseTabRef.current = onCloseTab; }, [onCloseTab]);

  useEffect(() => {
    queueMicrotask(() => {
      setEditorDirty(false);
      if (activeTab === 'welcome') setArtifactViewMode('preview');
    });
  }, [activeTab]);

  // Register Cmd+S once; reads live values through refs to avoid re-registration on every keystroke.
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (showEditorHeaderActionsRef.current && editorDirtyRef.current) {
          if (codeViewRef.current) {
            codeViewRef.current.save();
          } else {
            setEditorDirty(false);
          }
        }
      }

    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);


  useEffect(() => {
    if (visibleTabIds.length && !visibleTabIds.includes(activeTab)) {
      onTabChange(visibleTabIds[0]);
    }
  }, [visibleTabIds, activeTab, onTabChange]);

  useEffect(() => {
    if (closingTabId && !visibleTabIds.includes(closingTabId)) {
      if (closeTabAnimTimerRef.current) {
        clearTimeout(closeTabAnimTimerRef.current);
        closeTabAnimTimerRef.current = null;
      }
      queueMicrotask(() => {
        setClosingTabId(null);
      });
    }
  }, [visibleTabIds, closingTabId]);

  useEffect(() => {
    if (!closingTabId) return;
    const id = closingTabId;
    closeTabAnimTimerRef.current = window.setTimeout(() => {
      onCloseTabRef.current(id);
      setClosingTabId(null);
      closeTabAnimTimerRef.current = null;
    }, TAB_CLOSE_ANIM_MS);
    return () => {
      if (closeTabAnimTimerRef.current) {
        clearTimeout(closeTabAnimTimerRef.current);
        closeTabAnimTimerRef.current = null;
      }
    };
  }, [closingTabId]);


  const remeasure = useCallback(() => {
    const track = mainTrackRef.current;
    const bar = tabBarRef.current;
    if (!track || !bar) return;

    const strip = bar.querySelector('.tab-bar-measure-strip');
    const measureNodes = strip?.querySelectorAll('[data-measure-tab]') ?? [];
    const nextWidths = {};
    measureNodes.forEach((node) => {
      const id = node.getAttribute('data-measure-tab');
      if (id) nextWidths[id] = node.getBoundingClientRect().width;
    });

    // Derive available width from the bar element, not the track.
    // track.clientWidth is flex-1 and changes whenever actions grows/shrinks (e.g. when an
    // editor tab becomes active and Save/toggle appear). Using bar.clientWidth minus a fixed
    // constant for max actions size means packing math only reacts to real viewport/canvas
    // resizes — never to tab-type switches — so k never changes when opening an editor tab.
    const inner = Math.floor(
      bar.clientWidth - TAB_BAR_H_PADDING_PX - TAB_ACTIONS_MAX_W - TAB_BAR_TRACK_TO_ACTIONS_GAP_PX
    );
    if (inner <= 0) return;

    const effectiveInner = Math.max(0, inner - TAB_TRACK_TAIL_RESERVE_PX);

    // Fixed reserve for "N more" in packing math only (avoid live measure → N feedback).
    const moreW = displayOrder.length > 1 ? MORE_TRIGGER_ESTIMATE_PX : 0;

    let k = computeInlineTabCount(effectiveInner, displayOrder, nextWidths, moreW);

    // Clamp k based on bar width change:
    //   • bar same or narrower, promotion floor set → enforce floor (prevents decrease due to
    //     promoted tab being wider than the one it replaced). Persists across multiple
    //     remeasure calls (layout-effect + ResizeObserver initial-observation callback).
    //   • bar same or narrower, no floor → don't let k spontaneously increase.
    //   • bar wider → clear floor and allow k to grow naturally.
    const lastInner = lastTrackInnerRef.current;
    if (lastInner !== null && inner <= lastInner) {
      const floor = kMinAfterPromotionRef.current;
      if (floor !== null) {
        k = Math.max(k, floor);
      } else {
        k = Math.min(k, inlineTabCountRef.current);
      }
    } else if (lastInner !== null && inner > lastInner) {
      kMinAfterPromotionRef.current = null;
    }
    lastTrackInnerRef.current = inner;

    setInlineTabCount(k);
  }, [displayOrder]);

  useLayoutEffect(() => {
    remeasure();
  }, [remeasure, layout, displayOrder, closingTabId]);

  // Keep inlineTabCountRef current so the track-width gate in remeasure can
  // read the live value without causing remeasure to depend on inlineTabCount
  // (which would create a setState → dep change → re-run loop).
  useLayoutEffect(() => {
    inlineTabCountRef.current = inlineTabCount;
  }, [inlineTabCount]);

  // Reset FLIP state on chat switch so the new tab set doesn't look like
  // a batch of closes from the previous chat's tab count.
  useLayoutEffect(() => {
    prevTabTrackLeftRef.current = null;
    prevVisibleLenForFlipRef.current = null;
  }, [chat.id]);

  useLayoutEffect(() => {
    if (visibleTabIds.length === 0) {
      prevTabTrackLeftRef.current = null;
      prevVisibleLenForFlipRef.current = null;
      return;
    }
    const track = mainTrackRef.current;
    if (!track) {
      prevTabTrackLeftRef.current = null;
      prevVisibleLenForFlipRef.current = null;
      return;
    }

    const prefersReduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    const tabEls = [...track.querySelectorAll(':scope > .tab-pill[data-tab]')];
    const moreEl = track.querySelector(':scope > button.tab-bar-more');
    const trackRect = track.getBoundingClientRect();

    const current = new Map();
    tabEls.forEach((el) => {
      const id = el.getAttribute('data-tab');
      if (id) current.set(id, el.getBoundingClientRect().left - trackRect.left);
    });
    if (moreEl) {
      current.set('__more__', moreEl.getBoundingClientRect().left - trackRect.left);
    }

    const prev = prevTabTrackLeftRef.current;
    const prevLen = prevVisibleLenForFlipRef.current;
    const curLen = displayOrder.length;
    const didCloseTab = prevLen !== null && curLen < prevLen;
    const didAddTab = prevLen !== null && curLen === prevLen + 1;
    prevVisibleLenForFlipRef.current = curLen;

    if (prev && !prefersReduce && didAddTab) {
      const slideEase = 'cubic-bezier(0.22, 1, 0.36, 1)';
      const slideDur = `${TAB_INLINE_SLIDE_MS / 1000}s`;

      const newTabEl = tabEls.find((el) => {
        const id = el.getAttribute('data-tab');
        return id && !prev.has(id);
      }) ?? null;

      // Existing tabs FLIP to their new positions.
      tabEls.forEach((el) => {
        if (el === newTabEl) return;
        const id = el.getAttribute('data-tab');
        if (!id) return;
        const oldL = prev.get(id);
        const newL = current.get(id);
        if (oldL === undefined || newL === undefined) return;
        const dx = oldL - newL;
        if (Math.abs(dx) < 0.25) return;
        const inner = el.querySelector(':scope > .tab-pill__anim');
        if (!inner) return;
        inner.style.transition = 'none';
        inner.style.transform = `translateX(${dx}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inner.style.transition = `transform ${slideDur} ${slideEase}`;
            inner.style.transform = 'translateX(0)';
            const onEnd = (e) => {
              if (e.propertyName !== 'transform') return;
              inner.style.transition = '';
              inner.style.transform = '';
              inner.removeEventListener('transitionend', onEnd);
            };
            inner.addEventListener('transitionend', onEnd);
          });
        });
      });

    }

    if (prev && !prefersReduce && didCloseTab) {
      const slideEase = 'cubic-bezier(0.22, 1, 0.36, 1)';
      const slideDur = `${TAB_INLINE_SLIDE_MS / 1000}s`;

      function runFlip(flipTarget, key) {
        const oldL = prev.get(key);
        const newL = current.get(key);
        if (oldL === undefined || newL === undefined) return;
        const dx = oldL - newL;
        if (Math.abs(dx) < 0.25) return;
        flipTarget.style.transition = 'none';
        flipTarget.style.transform = `translateX(${dx}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            flipTarget.style.transition = `transform ${slideDur} ${slideEase}`;
            flipTarget.style.transform = 'translateX(0)';
            const onEnd = (e) => {
              if (e.propertyName !== 'transform') return;
              flipTarget.style.transition = '';
              flipTarget.style.transform = '';
              flipTarget.removeEventListener('transitionend', onEnd);
            };
            flipTarget.addEventListener('transitionend', onEnd);
          });
        });
      }

      tabEls.forEach((el) => {
        const id = el.getAttribute('data-tab');
        if (!id) return;
        const inner = el.querySelector(':scope > .tab-pill__anim');
        if (inner) runFlip(inner, id);
      });
      if (moreEl) runFlip(moreEl, '__more__');
    }

    prevTabTrackLeftRef.current = current;
  }, [visibleTabIds.length, displayOrder, inlineTabCount, activeTab]);

  useEffect(() => {
    const bar = tabBarRef.current;
    const track = mainTrackRef.current;
    const actions = tabBarActionsRef.current;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => remeasure());
    ro.observe(bar);
    if (track) ro.observe(track);
    if (actions) ro.observe(actions);
    return () => ro.disconnect();
  }, [remeasure]);

  function openOverflowMenu() {
    const el = moreBtnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pos = clampTabOverflowMenuPosition(r.left, r.bottom + 4, overflowIds.length);
    setOverflowMenuPos(pos);
  }

  function closeOverflowMenu() {
    setOverflowMenuPos(null);
  }

  function handleOverflowTriggerClick(e) {
    e.stopPropagation();
    if (overflowMenuPos) closeOverflowMenu();
    else openOverflowMenu();
  }

  const mentionedTabSet = useMemo(() => new Set(mentionedTabIds), [mentionedTabIds]);
  const mentionedStoragePanelIds = useMemo(() => new Set(
    mentionedRawIds.flatMap((id) => {
      const match = id.match(/^(.+)-(\d+)$/);
      if (match && TAB_DATA[match[1]]?.artifactType === 'multiChart') {
        return [`${match[1]}-p${match[2]}`];
      }
      return [];
    })
  ), [mentionedRawIds]);

  const showEmpty = visibleTabIds.length === 0;
  const stateTransition = { duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' };
  const stateStyle = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 };

  const tab = TAB_DATA[activeTab] || {};
  const canvasTitle = tabLabels[activeTab] ?? tab.headingLarge ?? tab.label ?? activeTab;

  function handlePillCloseClick(e, id) {
    e.stopPropagation();
    if (!canCloseAnyTab || closingTabId !== null) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      onCloseTab(id);
      return;
    }
    setClosingTabId(id);
  }

  function handleSaveClick() {
    if (!editorDirty) return;
    if (codeViewRef.current) {
      codeViewRef.current.save();
    } else {
      setEditorDirty(false);
    }
  }

  function renderActiveCanvasBody() {
    if (!visibleTabIds.includes(activeTab)) return null;
    const t = tab.artifactType;
    if (t === 'multiChart') {
      const registryPanels = tab.panels;
      const snap = multiChartState[activeTab];
      if (!Array.isArray(registryPanels) || registryPanels.length < 2 || !snap) return null;
      return (
        <MultiChartLayout
          key={activeTab}
          panels={snap.panels}
          onPanelsChange={(next) => handleMultiPanelsChange(activeTab, next)}
          rowSizes={snap.rowSizes}
          onRemovePanel={(panelId) => handleRemovePanel(activeTab, panelId)}
          onExpandPanel={handleExpandPanel}
          mentionedPanelIds={mentionedStoragePanelIds}
          onElementHover={onElementHover}
          onCmdLSelect={onCmdLSelect}
        />
      );
    }
    if (t === 'chart') {
      const cv = tab.chartVariant ?? 'line';
      const chartProps = {
        title: tab.headingLarge,
        subtitle: tab.sub,
        standalone: true,
        tabId: activeTab,
        artifactLabel: tab.headingLarge,
        onCmdLSelect,
        onElementHover,
      };
      if (cv === 'bar') {
        return <BarChart key={activeTab} {...chartProps} legendLabel={tab.legendLabel ?? 'Volume'} dataset={tab.dataset} />;
      }
      return (
        <Chart
          key={activeTab}
          {...chartProps}
          series1Label="Past 30 days"
          series2Label="Previous period"
        />
      );
    }
    if (t === 'table') return <Table tabId={activeTab} onCmdLSelect={onCmdLSelect} />;
    if (t === 'markdown') {
      return (
        <TextView
          key={activeTab}
          ref={codeViewRef}
          initialContent={tab.markdownContent}
          guide={activeTab === 'welcome'}
          headerViewMode={artifactViewMode}
          onDirtyChange={setEditorDirty}
        />
      );
    }
    if (t === 'code') {
      return (
        <CodeView
          key={activeTab}
          ref={codeViewRef}
          tabId={activeTab}
          onDirtyChange={setEditorDirty}
        />
      );
    }
    return <ArtifactTabPlaceholder title={tab.label ?? activeTab} />;
  }

  function renderTabPill(id, { measuring } = { measuring: false }) {
    const Icon = TAB_ICONS[id];
    const pillLabel = tabLabels[id] ?? TAB_DATA[id]?.label ?? id;
    const active = activeTab === id;
    const canClose = canCloseAnyTab;
    const isClosing = !measuring && closingTabId === id;
    const isMentioned = !measuring && mentionedTabSet.has(id);
    return (
      <div
        key={measuring ? `m-${id}` : id}
        {...(measuring ? { 'data-measure-tab': id } : { 'data-tab': id, 'data-artifact-type': TAB_DATA[id]?.artifactType })}
        className={`tab-pill ${active ? 'active' : 'inactive'}${measuring ? ' tab-pill--measure' : ''}${!canClose ? ' tab-pill--no-close' : ''}${isClosing ? ' tab-pill--closing' : ''}${isMentioned ? ' tab-pill--mentioned' : ''}`}
        onClick={measuring ? undefined : (e) => {
          if (e.metaKey) {
            e.preventDefault();
            const label = tabLabels[id] ?? TAB_DATA[id]?.headingLarge ?? TAB_DATA[id]?.label ?? id;
            onCmdLSelect?.({ type: 'artifact', tabId: id, artifactLabel: label });
            return;
          }
          onTabChange(id);
        }}
        role={measuring ? undefined : 'tab'}
        aria-selected={measuring ? undefined : active}
      >
        {measuring ? (
          <span className="tab-pill__main">
            <span className="tab-pill__icon" aria-hidden>
              <Icon />
            </span>
            <span className="tab-pill__label" title={pillLabel}>
              {pillLabel}
            </span>
          </span>
        ) : (
          <div className="tab-pill__anim">
            <span className="tab-pill__main">
              <span className="tab-pill__icon" aria-hidden>
                <Icon />
              </span>
              <span className="tab-pill__label" title={pillLabel}>
                {pillLabel}
              </span>
            </span>
            <div className="tab-pill__closeLayer" aria-hidden={!canClose}>
              <div className="tab-pill__closeGrad" aria-hidden />
              <button
                type="button"
                className="tab-close"
                aria-label={`Close ${pillLabel}`}
                disabled={!canClose}
                onClick={(e) => {
                  handlePillCloseClick(e, id);
                }}
              >
                <CloseIcon size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="canvasWrap" className="panel-transition flex flex-col bg-surface-0" style={{ flex: '1 1 0%', minWidth: 320, minHeight: 0, position: 'relative' }}>
      <AnimatePresence key={chat.id} initial={false}>
        {showEmpty ? (
          <motion.div key="empty" data-canvas-state="empty" style={{ ...stateStyle, zIndex: 0, pointerEvents: 'none' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} transition={stateTransition}>
            <CanvasEmptyState cubePlaying={preparingChart} coverDuration={reducedMotion ? 0 : 332} />
          </motion.div>
        ) : (
          <motion.div key="artifacts" data-canvas-state="artifacts" style={{ ...stateStyle, zIndex: 1, background: 'var(--color-surface-0)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={stateTransition}>
            <div id="canvasArtifacts" className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
              <div
                id="tabBar"
                data-canvas-tabbar="v2"
                ref={tabBarRef}
                className="flex items-center w-full shrink-0 tab-bar-root"
                style={{
                  height: 56,
                  padding: '0 24px',
                  gap: 0,
                  position: 'relative',
                  zIndex: 4,
                  transition: 'box-shadow 0.2s ease',
                  background: 'transparent',
                }}
              >
                <div
                  ref={mainTrackRef}
                  className="tab-bar-track flex items-center min-w-0 flex-1"
                  style={{ gap: TAB_BAR_PILL_GAP_PX }}
                  role="tablist"
                >
                  {inlineIds.map((id) => renderTabPill(id))}
                  {showOverflowTrigger && (
                    <button
                      type="button"
                      ref={moreBtnRef}
                      className="tab-bar-more"
                      aria-haspopup="menu"
                      aria-expanded={overflowMenuPos !== null}
                      onMouseDown={(e) => {
                        // ContextMenu closes on document mousedown before this button's click.
                        // If React re-renders with the menu closed first, the click handler would
                        // see overflowMenuPos === null and reopen. Swallow mousedown on the trigger
                        // while open so only the click toggle runs (matches conv header menus).
                        if (overflowMenuPos !== null) e.stopPropagation();
                      }}
                      onClick={handleOverflowTriggerClick}
                    >
                      <span className="tab-bar-more__main">
                        <span className="tab-bar-more__label">
                          {overflowIds.length} more
                        </span>
                        <ChevronDownTiny />
                      </span>
                    </button>
                  )}
                </div>

                <div
                  ref={tabBarActionsRef}
                  className="tab-bar-actions"
                  aria-label="Canvas actions"
                  style={{ marginInlineStart: TAB_BAR_TRACK_TO_ACTIONS_GAP_PX }}
                >
                  {/* Order: Save → Toggle. Hidden items use display:none so no
                      phantom gaps; the container's fixed CSS width keeps track.clientWidth
                      stable so tab overflow count never changes on view-mode switch. */}
                  {showSaveBtn && (
                    <button
                      type="button"
                      className={`tab-bar-save-btn${editorDirty ? ' tab-bar-save-btn--dirty' : ''}`}
                      disabled={!editorDirty}
                      title={editorDirty ? 'Save changes' : 'No changes to save'}
                      onClick={handleSaveClick}
                    >
                      Save
                    </button>
                  )}
                  {showViewToggle && (
                    <div
                      className="tab-bar-view-toggle"
                      role="group"
                      aria-label="Artifact view mode"
                    >
                      <button
                        type="button"
                        className={`tab-bar-view-toggle__btn${artifactViewMode === 'preview' ? ' tab-bar-view-toggle__btn--selected' : ''}`}
                        aria-pressed={artifactViewMode === 'preview'}
                        onClick={() => setArtifactViewMode('preview')}
                        title="Preview"
                      >
                        <EyeOpenIcon size={11} />
                      </button>
                      <button
                        type="button"
                        className={`tab-bar-view-toggle__btn${artifactViewMode === 'code' ? ' tab-bar-view-toggle__btn--selected' : ''}`}
                        aria-pressed={artifactViewMode === 'code'}
                        onClick={() => setArtifactViewMode('code')}
                        title="Code"
                      >
                        <CanvasTabIconCode size={11} />
                      </button>
                    </div>
                  )}
                  {showEditorHeaderActions && (
                    <button
                      type="button"
                      className="tab-bar-actions-kebab"
                      aria-haspopup="menu"
                      aria-expanded={actionsMenuPos !== null}
                      title="More actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (actionsMenuPos) {
                          setActionsMenuPos(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActionsMenuPos({ x: rect.right - 140, y: rect.bottom + 4 });
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: actionsMenuPos ? 'var(--color-surface-3)' : 'transparent',
                        color: 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'background 150ms ease',
                      }}
                    >
                      <MenuDotsIcon size={14} />
                    </button>
                  )}
                </div>

                <div className="tab-bar-measure-strip" aria-hidden>
                  {displayOrder.map((id) => renderTabPill(id, { measuring: true }))}
                </div>
              </div>

              <ContextMenu
                isOpen={overflowMenuPos !== null}
                position={overflowMenuPos}
                onClose={closeOverflowMenu}
                className="item-popup--tab-overflow"
              >
                <div className="tab-overflow-menu" role="menu">
                  {overflowIds.map((id) => {
                  const Icon = TAB_ICONS[id];
                  const active = activeTab === id;
                  const overflowLabel = tabLabels[id] ?? TAB_DATA[id]?.label ?? id;
                  return (
                    <div
                      key={id}
                      className={`tab-overflow-row item-popup-row ${active ? 'tab-overflow-row--active' : ''}`}
                      role="menuitem"
                      onClick={() => {
                        const k = inlineTabCount;
                        kMinAfterPromotionRef.current = k;
                        onTabChange(id);
                        promoteOverflowTabToLastInline(id, k);
                        closeOverflowMenu();
                      }}
                    >
                      <span className="tab-overflow-row__icon" aria-hidden>
                        <Icon />
                      </span>
                      <span className="tab-overflow-row__label">{overflowLabel}</span>
                      <button
                        type="button"
                        className="tab-overflow-row__close"
                        aria-label={`Close ${overflowLabel}`}
                        disabled={!canCloseAnyTab}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canCloseAnyTab) return;
                          onCloseTab(id);
                          closeOverflowMenu();
                        }}
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  );
                  })}
                </div>
              </ContextMenu>

              <ContextMenu
                isOpen={actionsMenuPos !== null}
                position={actionsMenuPos}
                onClose={() => setActionsMenuPos(null)}
              >
                <div
                  className="item-popup-row"
                  onClick={() => setActionsMenuPos(null)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Download {TAB_DATA[activeTab]?.artifactType === 'code' ? '.sql' : '.md'}
                </div>
              </ContextMenu>

              <section id="canvas" data-artifact-type={tab.artifactType} data-view-mode={tab.artifactType === 'markdown' ? artifactViewMode : undefined} className="flex flex-col min-w-0 w-full overflow-y-auto" style={{ flex: 1, gap: 0 }}>
                {activeTab !== 'welcome' && !(tab.artifactType === 'markdown' && artifactViewMode === 'code') && (
                  <CanvasContentHeader
                    title={canvasTitle}
                    showSource={tab.artifactType !== 'markdown' && tab.artifactType !== 'code'}
                    sourceLabel={tab.sourceLabel}
                    sourceTooltip={tab.sourceTooltip}
                    sourceItems={tab.sourceItems}
                    onOpenSourceTab={onOpenSourceTab}
                    freshnessLabel={tab.freshnessLabel}
                  />
                )}

                <div id="canvasContent" className="flex flex-col flex-1 w-full min-h-0 min-w-0" style={{ position: 'relative' }}>
                  <div
                    id="canvasBody"
                    className="tab-content active flex flex-col"
                    style={{ minHeight: 0, flex: 1, position: 'relative' }}
                  >
                    {renderActiveCanvasBody()}
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
