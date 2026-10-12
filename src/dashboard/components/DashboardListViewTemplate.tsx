import { dashboardRelativePath } from '../lib/dashboardRouting';
import { dashboardStorage } from '../lib/storage';
'use client';

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, memo, startTransition, Fragment } from 'react';
import { flushSync, createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePrototype } from '@dashboard/contexts/PrototypeContext';
import { DashboardConsoleActionBar } from '@dashboard/components/DashboardConsoleActionBar';
import type { PageConfig, ColumnDef, TabConfig, FilterDef, PageAction, RowAction } from '@dashboard/lib/listview/types';
import { COLUMN_SIZE_PX } from '@dashboard/lib/listview/types';
import { useFadeSlideIn } from '@dashboard/ui/Transition';
import { useDashboardConsole } from '@dashboard/ui/DashboardConsoleLink';
import { FocusTrace } from '@dashboard/ui/FocusTrace';
import { color as uiColor } from '@dashboard/ui/tokens';

// Default transition for all animations
const DEFAULT_TRANSITION = 'all 250ms cubic-bezier(0.2, 0, 0.1, 1)';

/** Maximum auto-measured width for Fit columns before they clip. */
const FIT_MAX_WIDTH = 280;

/**
 * Resolves a column's default pixel width.
 * Returns 0 for Fit columns — a sentinel meaning "auto-size to content".
 * Fit is the default for any column without an explicit defaultWidth or non-Fit defaultSize.
 * Once the user drags to resize a Fit column it becomes a normal fixed-pixel width.
 */
const colDefaultWidth = (c: ColumnDef): number => {
  if (c.defaultWidth != null) return c.defaultWidth;
  if (c.defaultSize && c.defaultSize !== 'Fit') return COLUMN_SIZE_PX[c.defaultSize];
  return 0; // Fit (auto-size to content, capped at FIT_MAX_WIDTH)
};

/** Case-insensitive substring search — the expected behaviour for a data table searchbox. */
const substringMatch = (text: string, query: string): boolean =>
  text.toLowerCase().includes(query.toLowerCase());

/**
 * Resolves the actual data-row keys that should be searched for a given column.
 * Columns with custom `dataKeys` (e.g. `subtext`) store content under different
 * keys from the column ID, so we must look those up explicitly.
 */
function getSearchKeys(col: { id: string; type: string; dataKeys?: Record<string, string> }): string[] {
  switch (col.type) {
    case 'subtext': {
      const main = col.dataKeys?.['amount'] ?? `${col.id}-amt`;
      const sub  = col.dataKeys?.['sub']    ?? `${col.id}-sub`;
      return [main, sub];
    }
    case 'currency':
      return [col.dataKeys?.['value'] ?? col.id];
    default:
      return [col.id];
  }
}

/** Measures the minimum column width needed to fully show the header label. */
const getColMinWidth = (colId: string, colLabels: Record<string, string>): number => {
  const text = colLabels[colId] ?? colId;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 60;
  ctx.font = '600 12px "SF Pro Text", system-ui, -apple-system, sans-serif';
  const textWidth = ctx.measureText(text).width;
  return Math.ceil(textWidth) + 32; // 16px padding on each side
};

interface ViewChip {
  id: string;
  label: string;
  count?: string;
  selected: boolean;
}

interface FilterChip {
  id: string;
  filterName: string;
  /** Defaults to 'multi-select' when reading old localStorage data */
  filterType?: 'date' | 'single-select' | 'multi-select' | 'value';
  selectedValues: string[];
  // date-specific
  dateOp?: string;
  dateVal?: string;
  dateUnit?: string;
  dateTz?: string;
  // value-specific
  valueOp?: string;
  valueInput?: string;
}

// ─── Filter helpers ──────────────────────────────────────────────────────────

function dateUnitToMs(n: number, unit: string): number {
  switch (unit) {
    case 'days':   return n * 86_400_000;
    case 'weeks':  return n * 7 * 86_400_000;
    case 'months': return n * 30 * 86_400_000;
    case 'years':  return n * 365 * 86_400_000;
    default:       return 0;
  }
}

/** Middle-truncated ID for the page-header copy chip (matches List Views Figma). */
function truncateMiddleId(s: string, headChars = 14, tailChars = 5): string {
  if (s.length <= headChars + tailChars + 3) return s;
  return `${s.slice(0, headChars)}...${s.slice(-tailChars)}`;
}

function PageHeaderCopyIdField({ fullId }: { fullId: string }) {
  const [phase, setPhase] = useState<'idle' | 'copied'>('idle');
  const [hover, setHover] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTipPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullId).catch(() => {});
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('copied');
    timerRef.current = setTimeout(() => setPhase('idle'), 1500);
    updateTipPos();
  };

  const showTooltip = hover;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title={fullId}
        onClick={handleCopy}
        onMouseEnter={() => {
          setHover(true);
          updateTipPos();
        }}
        onMouseMove={updateTipPos}
        onMouseLeave={() => setHover(false)}
        className="flex cursor-pointer items-center gap-[8px] rounded-[6px] border border-solid px-[8px] py-[4px]"
        style={{
          background: '#F4F7FA',
          borderColor: hover ? '#D4DEE9' : '#ECF1F6',
          maxWidth: 'min(280px, 38vw)',
          flexShrink: 1,
          minWidth: 0,
          transition: 'border-color 100ms cubic-bezier(0.2, 0, 0.1, 1)',
        }}
      >
        <span
          className="min-w-0 truncate text-[14px] leading-5 tracking-[-0.15px]"
          style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', color: '#596171', fontWeight: 400 }}
        >
          {truncateMiddleId(fullId)}
        </span>
        <div style={{ position: 'relative', width: '12px', height: '12px', flexShrink: 0 }}>
          <AnimatePresence mode="sync" initial={false}>
            {phase === 'copied' ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.6021 1.67472C11.8681 1.92097 11.884 2.33617 11.6378 2.60211L4.60654 10.1959C4.47921 10.3334 4.29916 10.4099 4.11178 10.4061C3.9244 10.4023 3.74757 10.3186 3.62589 10.1761L0.344642 6.33233C0.109325 6.05667 0.142027 5.64245 0.417684 5.40713C0.693341 5.17182 1.10757 5.20452 1.34288 5.48017L4.14493 8.76258L10.6747 1.71039C10.921 1.44445 11.3362 1.42848 11.6021 1.67472Z" fill="#474E5A" />
                </svg>
              </motion.span>
            ) : (
              <motion.span
                key="clipboard"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img src="/dashboard-assets/icons/clipboard12.svg" alt="" style={{ width: '12px', height: '12px', display: 'block', flexShrink: 0 }} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>
      {typeof document !== 'undefined' && showTooltip && createPortal(
        <div style={{
          position: 'fixed',
          top: tooltipPos.y,
          left: tooltipPos.x,
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
        >
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0.1, 1] }}
            style={{
              background: '#3C4F69',
              borderRadius: '4px',
              padding: '4px 8px',
              whiteSpace: 'nowrap',
              fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '-0.15px',
              color: 'white',
              boxShadow: '0px 2px 5px 0px rgba(64,68,82,0.08), 0px 3px 9px 0px rgba(64,68,82,0.08)',
            }}
          >
            {phase === 'copied' ? 'Copied' : 'Copy to clipboard'}
          </motion.div>
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * Applies an array of FilterChips to a set of rows.
 * Rows must include machine-readable companion fields:
 *   - `<filterId>-ts`  (Unix ms timestamp) for date filters
 *   - `<filterId>-raw` (number)            for value filters
 * If a companion field is absent, that filter passes the row through unchanged.
 */
function applyFilterChips(
  rows: { row: Record<string, unknown>; originalIndex: number }[],
  chips: FilterChip[],
): { row: Record<string, unknown>; originalIndex: number }[] {
  if (chips.length === 0) return rows;
  return rows.filter(({ row }) =>
    chips.every(fc => {
      const type = fc.filterType ?? 'multi-select';

      if (type === 'multi-select' || type === 'single-select') {
        const val = String(row[fc.id] ?? '');
        return fc.selectedValues.includes(val);
      }

      if (type === 'date') {
        const ts = row[`${fc.id}-ts`] as number | undefined;
        if (ts == null || !fc.dateVal?.trim()) return true;
        const n = parseInt(fc.dateVal, 10);
        if (isNaN(n) || n <= 0) return true;
        const offset = dateUnitToMs(n, fc.dateUnit ?? 'days');
        const now = Date.now();
        const threshold = now - offset;
        switch (fc.dateOp) {
          case 'is in the last': return ts >= threshold;
          case 'is before':      return ts < threshold;
          case 'is after':       return ts > threshold;
          case 'is equal to': {
            // "exactly N units ago" — match within one day window
            return ts >= threshold && ts < threshold + 86_400_000;
          }
          default: return true;
        }
      }

      if (type === 'value') {
        if (!fc.valueInput?.trim()) return true;
        // Prefer the raw numeric companion field; fall back to parsing the display string
        const rawKey = `${fc.id}-raw`;
        const rowVal = row[rawKey] != null
          ? Number(row[rawKey])
          : parseFloat(String(row[fc.id] ?? '').replace(/[$,\s]/g, ''));
        const inputVal = parseFloat(fc.valueInput.replace(/[$,\s]/g, ''));
        if (isNaN(rowVal) || isNaN(inputVal)) return true;
        switch (fc.valueOp ?? 'is equal to') {
          case 'is equal to':      return rowVal === inputVal;
          case 'is not equal to':  return rowVal !== inputVal;
          case 'is greater than':  return rowVal > inputVal;
          case 'is less than':     return rowVal < inputVal;
          case 'contains':         return String(row[fc.id] ?? '').includes(fc.valueInput);
          case 'does not contain': return !String(row[fc.id] ?? '').includes(fc.valueInput);
          default: return true;
        }
      }

      return true;
    }),
  );
}

/** Returns the human-readable value portion of a filter chip label */
function filterChipValue(chip: FilterChip): string {
  const type = chip.filterType ?? 'multi-select';
  if (type === 'date') {
    return [chip.dateOp, chip.dateVal, chip.dateUnit].filter(Boolean).join(' ');
  }
  if (type === 'value') {
    return [chip.valueOp, chip.valueInput].filter(Boolean).join(' ');
  }
  return chip.selectedValues.join(', ');
}

// ─── Fallback defaults (used when config doesn't override) ───────────────────
const DEFAULT_VIEW_CHIPS: ViewChip[] = [
  { id: '1', label: 'All',            selected: true  },
  { id: '2', label: 'Default View 1', selected: false },
  { id: '3', label: 'Default View 2', selected: false },
  { id: '4', label: 'Default View 3', selected: false },
];
const DEFAULT_PINNED_IDS = ['1', '2', '3', '4'];

function lsGet<T>(key: string): T | null {
  try { const v = typeof window !== 'undefined' ? dashboardStorage.getItem(key) : null; return v ? JSON.parse(v) : null; } catch { return null; }
}
/** Guarantee the 'all' chip is always at index 0, regardless of saved order. */
function ensureAllFirst(chips: ViewChip[]): ViewChip[] {
  const allChip = chips.find(c => c.id === 'all');
  if (!allChip) return chips;
  return [allChip, ...chips.filter(c => c.id !== 'all')];
}
function lsSet(key: string, value: unknown) {
  try { dashboardStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / SSR */ }
}

// ─── Memoised table row ────────────────────────────────────────────────────────
// Defined outside DashboardListViewTemplate so React.memo works correctly — the component
// identity is stable across re-renders of the parent.

type TableRowData = Record<string, unknown>;

const DEFAULT_STATUS_STYLE: React.CSSProperties = {
  background: '#f4f7fa', color: '#50617a', outline: '1px solid #d4dee9',
};

// Measure text width using an offscreen canvas (font must match cell typography)
let _measureCtx: CanvasRenderingContext2D | null = null;
function measureText(text: string, font: string): number {
  if (typeof document === 'undefined') return 0;
  if (!_measureCtx) {
    const canvas = document.createElement('canvas');
    _measureCtx = canvas.getContext('2d');
  }
  if (!_measureCtx) return 0;
  _measureCtx.font = font;
  return _measureCtx.measureText(text).width;
}

// Given all agg items and available pixel width, return [visibleItems, hiddenCount]
function computeAggVisible(items: string[], availableWidth: number): [string[], number] {
  const FONT = '14px "SF Pro Text", system-ui, -apple-system, sans-serif';
  const GAP = 4;       // gap between text and badge
  const BADGE_PADDING = 12; // 6px left + 6px right
  const SEP = ', ';
  const sepW = measureText(SEP, FONT);

  // Estimate badge width for "+N" (N = number of hidden items)
  const badgeWidth = (n: number) => measureText(`+${n}`, FONT) + BADGE_PADDING + 2; // +2 for border

  let usedWidth = 0;
  let visible: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const itemW = measureText(items[i], FONT);
    const remaining = items.length - i - 1;
    // If this is not the last item, we might still need a badge after it
    const badgeW = remaining > 0 ? GAP + badgeWidth(remaining) : 0;
    const separatorW = i > 0 ? sepW : 0;
    const needed = separatorW + itemW + badgeW;

    if (usedWidth + needed <= availableWidth) {
      usedWidth += separatorW + itemW;
      visible.push(items[i]);
    } else {
      // Can't fit this item — back up and check if the badge fits for the remaining + this item
      const hiddenCount = items.length - i;
      // If we have at least one visible item, show badge
      if (visible.length > 0) {
        return [visible, hiddenCount];
      }
      // Nothing fit yet (first label + reserved "+N" width often overflows narrow columns).
      // Never show only "+N" with zero visible labels: always keep at least this item; the cell
      // truncates with ellipsis and the badge counts the rest (or +0 for one oversize label).
      const rest = items.length - i - 1;
      return [[items[i]], Math.max(0, rest)];
    }
  }

  return [visible, 0];
}

interface TableRowProps {
  row: TableRowData;
  originalIndex: number;
  isSelected: boolean;
  prevSelected: boolean;
  nextSelected: boolean;
  isLastRow: boolean;
  isZebra: boolean;
  isSkeletonLoading: boolean;
  dragColId: string | null;
  columnOrder: string[];
  visibleColumns: Set<string>;
  wrapCells: boolean;
  onToggleSelect: (i: number) => void;
  hasSelectionRef: React.RefObject<boolean>;
  onRowClick: (e: React.MouseEvent, i: number) => void;
  frozenColumns: Set<string>;
  columnWidths: Record<string, number>;
  columnDragStyle: 'ui' | 'glass';
  columnDefs: ColumnDef[];
  rowActions: RowAction[];
  onRowAction?: (action: RowAction, row: TableRowData) => void;
  /** The row is the Console panel's context: it wears the looping focus ring. */
  consoleFocused?: boolean;
  bulkSelectCheckboxes: boolean;
  rowHref?: string | null;
}

function MoreMenuItem({ label, color, onSelect }: { label: string; color: string; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        padding: '6px 10px',
        borderRadius: '6px',
        background: hovered ? '#F4F7FA' : 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '20px',
        letterSpacing: '-0.15px',
        color,
        transition: 'background 100ms',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}

/** Plain rule under a `dividerAfter` item, matching the Home card menus' separator. */
const MENU_DIVIDER_STYLE: React.CSSProperties = {
  height: '1px',
  margin: '2px 8px',
  background: uiColor.neutral50,
};

/** Substitutes `{field}` tokens in a RowAction's `consolePrompt` with the row's values. */
function fillRowPrompt(template: string, row: Record<string, unknown>): string {
  return template.replace(/\{([\w-]+)\}/g, (token, key: string) => {
    const value = row[key];
    return value == null ? token : String(value);
  });
}

/**
 * Renders a list of menu items, automatically splitting them into groups when an
 * item carries a `group` field. The first group has no divider; subsequent groups
 * get a top-border separator + label row — matching the view-management popover style.
 * An item with `dividerAfter` gets a plain rule below it instead.
 */
function renderMoreMenuItems<T extends { label: string; color: string; group?: string; dividerAfter?: boolean }>(
  items: T[],
  onClose: () => void,
  onSelect?: (item: T) => void,
) {
  // Split into groups: each new `group` value starts a new section.
  type Section = { label: string | null; items: typeof items };
  const sections: Section[] = [];
  for (const item of items) {
    if (item.group !== undefined || sections.length === 0) {
      sections.push({ label: item.group ?? null, items: [item] });
    } else {
      sections[sections.length - 1].items.push(item);
    }
  }

  return (
    <>
      {sections.map((section, sIdx) => (
        <div
          key={sIdx}
          style={sIdx > 0 ? { borderTop: '1px solid #D8DEE4', marginTop: '4px', paddingTop: '4px' } : undefined}
        >
          {section.label && (
            <div style={{
              padding: '6px 10px',
              fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
              fontSize: '12px',
              fontWeight: 700,
              lineHeight: '20px',
              color: '#273951',
              userSelect: 'none',
            }}>
              {section.label}
            </div>
          )}
          {section.items.map(item => (
            <Fragment key={item.label}>
              <MoreMenuItem
                label={item.label}
                color={item.color}
                onSelect={() => { onSelect?.(item); onClose(); }}
              />
              {item.dividerAfter && <div role="separator" style={MENU_DIVIDER_STYLE} />}
            </Fragment>
          ))}
        </div>
      ))}
    </>
  );
}

const TableRow = memo(function TableRow({
  row, originalIndex, isSelected, prevSelected, nextSelected, isLastRow,
  isZebra, isSkeletonLoading, dragColId, columnOrder, visibleColumns,
  wrapCells, onToggleSelect, hasSelectionRef, onRowClick, frozenColumns, columnWidths, columnDragStyle,
  columnDefs, rowActions, onRowAction, consoleFocused = false, bulkSelectCheckboxes, rowHref,
}: TableRowProps) {
  const router = useRouter();
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [idCopyPhase, setIdCopyPhase] = useState<'idle' | 'copied'>('idle');
  const [idIconHover, setIdIconHover] = useState(false);
  const [isRowHovered, setIsRowHovered] = useState(false);
  const [linkHover, setLinkHover] = useState(false);
  const [infoTextHover, setInfoTextHover] = useState(false);
  const idCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [idTooltipPos, setIdTooltipPos] = useState({ x: 0, y: 0 });
  const idChipRef = useRef<HTMLButtonElement>(null);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moreMenuPos, setMoreMenuPos] = useState({ top: 0, right: 0 });
  const [moreMenuHover, setMoreMenuHover] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);


  const [infoTooltipVisible, setInfoTooltipVisible] = useState(false);
  const [infoTooltipPos, setInfoTooltipPos] = useState({ x: 0, y: 0 });
  const infoIconRef = useRef<HTMLSpanElement>(null);
  const infoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showInfoTooltip = () => {
    if (infoHideTimerRef.current) clearTimeout(infoHideTimerRef.current);
    if (!infoIconRef.current) return;
    const rect = infoIconRef.current.getBoundingClientRect();
    setInfoTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 6 });
    setInfoTooltipVisible(true);
  };

  const scheduleHideInfoTooltip = () => {
    infoHideTimerRef.current = setTimeout(() => setInfoTooltipVisible(false), 80);
  };

  const handleIdCopy = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    if (idCopyTimerRef.current) clearTimeout(idCopyTimerRef.current);
    setIdCopyPhase('copied');
    idCopyTimerRef.current = setTimeout(() => {
      setIdCopyPhase('idle');
    }, 1500);
  };

  const openMoreMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!moreButtonRef.current) return;
    const rect = moreButtonRef.current.getBoundingClientRect();
    setMoreMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMoreMenuOpen(true);
  };

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node) &&
        moreButtonRef.current && !moreButtonRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreMenuOpen]);

  const isRowActive = isRowHovered || moreMenuOpen;

  const rowBgType = isSelected ? 'selected' : 'white';
  // Only round corners on selected rows; regular rows are flat (border provides visual separation)
  const tlr = (isSelected && !prevSelected) ? '8px' : '0px';
  const blr = (isSelected && !nextSelected) ? '8px' : '0px';
  const trr = (isSelected && !prevSelected) ? '8px' : '0px';
  const brr = (isSelected && !nextSelected) ? '8px' : '0px';

  const cellBg: React.CSSProperties = {
    borderBottom: isLastRow
      ? 'none'
      : isSelected
        ? (nextSelected ? '1px solid #F7F5FD' : '1px solid white')
        : '1px solid #ECF1F6',
  };
  const truncBg: React.CSSProperties = {
    ...cellBg, overflow: 'hidden',
    textOverflow: isSkeletonLoading ? 'clip' : 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const wrapOrTruncBg: React.CSSProperties = {
    ...cellBg,
    overflow: wrapCells ? 'visible' : 'hidden',
    textOverflow: wrapCells || isSkeletonLoading ? 'clip' : 'ellipsis',
    whiteSpace: wrapCells ? 'normal' : 'nowrap',
  };
  const firstCellStyle: React.CSSProperties = { ...cellBg, borderTopLeftRadius: tlr, borderBottomLeftRadius: blr, position: 'sticky', left: 0, zIndex: 2 };
  const lastCellStyle:  React.CSSProperties = { ...cellBg, borderTopRightRadius: trr, borderBottomRightRadius: brr };

  return (
    <>
    <tr
      ref={rowRef}
      data-row-bg={rowBgType}
      className={`h-[44px]${!isSelected ? ' row-hoverable' : ''}${moreMenuOpen ? ' row-force-hover' : ''}`}
      style={rowHref ? { cursor: 'pointer' } : undefined}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
      onMouseDown={e => { if (bulkSelectCheckboxes && hasSelectionRef.current && (e.metaKey || e.ctrlKey || e.shiftKey)) e.preventDefault(); }}
      onClick={e => {
        if (rowHref && !hasSelectionRef.current) { router.push(rowHref); return; }
        if (bulkSelectCheckboxes && hasSelectionRef.current && (e.metaKey || e.ctrlKey || e.shiftKey)) onRowClick(e, originalIndex);
      }}
    >
      {bulkSelectCheckboxes && (
      <td style={{ ...firstCellStyle, width: '40px', height: '40px', padding: 0, verticalAlign: 'middle' }}>
        {/* L1: white blocker */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: (isRowActive && !isSelected) ? '-1px' : 0, width: '12px', background: 'white', pointerEvents: 'none' }} />
        {/* L2: perma rounded cap — always visible, carries row bg + rounded corners */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: (isRowActive && !isSelected) ? '-1px' : 0, width: '12px', background: 'var(--bg)', borderRadius: isSelected ? `${tlr} 0 0 ${blr}` : '8px 0 0 8px', pointerEvents: 'none' }} />
        {/* L3: gradient scrim — scaleX-compressed to ~8px cap by default, expands on scroll */}
        <div className="left-scrim" style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '88px', borderRadius: isSelected ? `${tlr} 0 0 ${blr}` : '8px 0 0 8px', pointerEvents: 'none' }} />
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {isSkeletonLoading ? (
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'white', border: '1px solid #F5F6F8' }} />
          ) : (
            <img
              src={isSelected ? '/dashboard-assets/icons/checkboxSelected.svg' : '/dashboard-assets/icons/checkboxPassive.svg'}
              alt={isSelected ? 'Selected' : 'Unselected'}
              style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0, cursor: 'pointer' }}
              onMouseDown={e => { if (hasSelectionRef.current && (e.metaKey || e.ctrlKey || e.shiftKey)) e.preventDefault(); }}
              onClick={e => {
                e.stopPropagation();
                if (hasSelectionRef.current && (e.metaKey || e.ctrlKey || e.shiftKey)) {
                  onRowClick(e, originalIndex);
                } else {
                  onToggleSelect(originalIndex);
                }
              }}
            />
          )}
        </div>
      </td>
      )}

      {isSkeletonLoading ? (
        /* Skeleton: one cell spanning all columns */
        <td colSpan={100} style={{ ...lastCellStyle, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '160px', height: '16px', borderRadius: '6px', background: '#F8F9FB', pointerEvents: 'none' }} />
        </td>
      ) : (
      <>
      {(() => {
        const firstVisibleColId = columnOrder.find(id => visibleColumns.has(id));
        // Only the rightmost frozen column gets the right-side separator border.
        const lastFrozenColId = [...columnOrder].reverse().find(id => visibleColumns.has(id) && frozenColumns.has(id));
        return columnOrder.flatMap(colId => {
        if (!visibleColumns.has(colId)) return [];
        const isFirstCol = colId === firstVisibleColId;
        const draggedOpacity = 0;
        const contentFade: React.CSSProperties = {
          opacity: dragColId === colId ? draggedOpacity : 1,
          transition: dragColId === colId ? 'opacity 150ms cubic-bezier(0.2, 0, 0.1, 1)' : 'opacity 200ms cubic-bezier(0.2, 0, 0.1, 1)',
        };

        // Frozen column positioning uses CSS custom properties set on the <table> element
        // (--fl-{colId}) rather than inline computed values. This lets column-drag update
        // all frozen positions with a single DOM write instead of a full React re-render.
        const isFrozen = frozenColumns.has(colId);
        const frozenBorderRight = (isFrozen && colId === lastFrozenColId) ? '1px solid #E0E6EF' : undefined;
        const stickyBase: React.CSSProperties = isFrozen
          ? { position: 'sticky', left: `var(--fl-${colId})`, zIndex: 2 }
          : {};

        const colDef = columnDefs.find(c => c.id === colId);
        const cellVal = row[colId];
        const isCellEmpty = cellVal === '' || cellVal === null || cellVal === undefined;
        const nullSpan = <span style={{ ...contentFade, color: '#8C95A6' }}>–</span>;
        switch (colDef?.type ?? colId) {
          case 'icon-box': return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : (
                <div style={{ ...contentFade, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: isSelected ? (isRowHovered ? '#E0D9FB' : '#EFECFC') : isRowActive ? '#ECF1F6' : '#F4F7FA', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'none' }}>
                    <img src={colDef?.iconSrc ?? '/dashboard-assets/icons/product16.svg'} alt="" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <span style={{ fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(cellVal)}</span>
                </div>
              )}
            </td>,
          ];
          case 'image': return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : (
                <div style={{ ...contentFade, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src="/dashboard-assets/icons/whiteTee.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(cellVal)}</span>
                </div>
              )}
            </td>,
          ];
          case 'inline-icon': return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : (
                <div style={{ ...contentFade, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={colDef?.iconSrc ?? '/dashboard-assets/icons/product16.svg'} alt="" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span style={{ fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(cellVal)}</span>
                </div>
              )}
            </td>,
          ];
          case 'link': return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : (
                <span
                  style={{ ...contentFade, fontWeight: isFirstCol ? 600 : 400, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: wrapCells ? 'normal' : 'nowrap', textDecoration: 'underline', textDecorationColor: linkHover ? '#1A2C44' : '#95A4BA', cursor: 'pointer' }}
                  className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]"
                  onMouseEnter={() => setLinkHover(true)}
                  onMouseLeave={() => setLinkHover(false)}
                >{String(cellVal)}</span>
              )}
            </td>,
          ];
          case 'currency': {
            const valKey  = colDef?.dataKeys?.['value'] ?? colId;
            const codeKey = colDef?.dataKeys?.['code']  ?? `${colId}-code`;
            const isCurrencyEmpty = row[valKey] === '' || row[valKey] === null || row[valKey] === undefined;
            return [
              <td key={`${colId}-val`} data-col-id={colId} className="pl-[16px] pr-[4px] text-right" style={{ ...truncBg, position: 'relative', ...stickyBase }}>
                {isCurrencyEmpty ? nullSpan : <span style={{ ...contentFade, fontVariantNumeric: 'tabular-nums', display: 'inline-block', fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(row[valKey])}</span>}
              </td>,
              <td key={`${colId}-code`} data-col-id={colId} className="pl-[4px] pr-[16px] text-right" style={{ ...cellBg, ...(isFrozen ? { position: 'sticky', left: `var(--fl-${colId}-code)`, zIndex: 2, borderRight: frozenBorderRight } : {}) }}>
                {isCurrencyEmpty ? null : <span style={contentFade} className="text-[14px] font-normal leading-5 text-[#50617A]">{String(row[codeKey] ?? '')}</span>}
              </td>,
            ];
          }
          case 'color-coded': {
            const valKey = colDef?.dataKeys?.['value']    ?? colId;
            const posKey = colDef?.dataKeys?.['positive'] ?? `${colId.replace('color-coded', 'color')}-positive`;
            const isPos  = Boolean(row[posKey]);
            const isColorCodedEmpty = row[valKey] === '' || row[valKey] === null || row[valKey] === undefined;
            return [
              <td key={colId} data-col-id={colId} className="px-[16px] text-right" style={{ ...truncBg, ...stickyBase, borderRight: frozenBorderRight }}>
                {isColorCodedEmpty ? nullSpan : <span style={{ ...contentFade, fontVariantNumeric: 'tabular-nums', fontWeight: isFirstCol ? 600 : 400, color: isPos ? '#1A5C1F' : '#991B1B' }} className="text-[14px] leading-5 tracking-[-0.15px]">{isPos ? '+' : '-'}{String(row[valKey])}</span>}
              </td>,
            ];
          }
          case 'numerical': return [
            <td key={colId} data-col-id={colId} className="px-[16px] text-right" style={{ ...truncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : <span style={{ ...contentFade, fontVariantNumeric: 'tabular-nums', fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(cellVal)}</span>}
            </td>,
          ];
          case 'status': {
            const statusVal   = String(row[colId] ?? '');
            const badgeStyle  = colDef?.statusMap?.[statusVal] ?? DEFAULT_STATUS_STYLE;
            return [
              <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...cellBg, ...stickyBase, borderRight: frozenBorderRight }}>
                {isCellEmpty ? nullSpan : <span className="text-[12px] font-normal inline-flex items-center" style={{ height: '20px', borderRadius: '4px', padding: '2px 6px', whiteSpace: 'nowrap', ...badgeStyle, ...contentFade }}>{statusVal}</span>}
              </td>,
            ];
          }
          case 'color-text': {
            const colorTextVal = String(row[colId] ?? '');
            const colorTextColor = colDef?.statusMap?.[colorTextVal]?.color ?? '#1A2C44';
            return [
              <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...cellBg, ...stickyBase, borderRight: frozenBorderRight }}>
                {isCellEmpty ? nullSpan : <span className="text-[14px] leading-5 tracking-[-0.15px]" style={{ ...contentFade, fontWeight: isFirstCol ? 600 : 400, color: colorTextColor, whiteSpace: 'nowrap' }}>{colorTextVal}</span>}
              </td>,
            ];
          }
          case 'brand-icon': {
            const secondaryKey = colDef?.dataKeys?.['secondary'] ?? `${colId}-secondary`;
            const hasSecondary = Boolean(row[secondaryKey]);
            const secondaryIconSrc = colDef?.secondaryIconSrc ?? '/dashboard-assets/icons/link.svg';
            // Prepend extra bullets to compensate for the missing secondary icon (16px + 4px gap)
            // so the numbers always line up regardless of icon count.
            const brandDisplayVal = hasSecondary ? String(cellVal) : `•••${String(cellVal)}`;
            return [
              <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
                {isCellEmpty ? nullSpan : (
                  <div style={{ ...contentFade, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {hasSecondary && <img src={secondaryIconSrc} alt="" style={{ flexShrink: 0, display: 'block' }} />}
                      <img src={colDef?.iconSrc ?? '/dashboard-assets/icons/brandIcon16.svg'} alt="" style={{ flexShrink: 0, display: 'block' }} />
                    </div>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: isFirstCol ? 600 : 400, paddingLeft: hasSecondary ? 0 : 1 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{brandDisplayVal}</span>
                  </div>
                )}
              </td>,
            ];
          }
          case 'location': return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : (
                <div style={{ ...contentFade, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={colDef?.iconSrc ?? '/dashboard-assets/icons/usIcon16.svg'} alt="" style={{ width: '16px', height: '16px', flexShrink: 0, borderRadius: '2px' }} />
                  <span style={{ fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(cellVal)}</span>
                </div>
              )}
            </td>,
          ];
          case 'id': {
            const showTooltip = idIconHover && !dragColId;
            return [
              <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...truncBg, ...stickyBase, borderRight: frozenBorderRight }}>
                <div style={{ ...contentFade, display: 'flex', alignItems: 'center' }}>
                  <button
                    ref={idChipRef}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: isSelected ? (isRowHovered ? '#E0D9FB' : '#EFECFC') : '#F4F7FA',
                      border: `1px solid ${isSelected ? (isRowHovered ? '#E0D9FB' : '#EFECFC') : (idIconHover ? '#D4DEE9' : '#ECF1F6')}`,
                      borderRadius: '6px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      transition: 'none',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (!idChipRef.current) return;
                      const rect = idChipRef.current.getBoundingClientRect();
                      setIdTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
                      handleIdCopy(String(row[colId] ?? ''));
                    }}
                    onMouseEnter={() => {
                      setIdIconHover(true);
                      if (!idChipRef.current) return;
                      const rect = idChipRef.current.getBoundingClientRect();
                      setIdTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
                    }}
                    onMouseLeave={() => setIdIconHover(false)}
                  >
                    <span
                      style={{ fontWeight: isFirstCol ? 600 : 400, fontSize: '14px', lineHeight: '20px', letterSpacing: '-0.15px', color: '#1A2C44', overflow: 'hidden', textOverflow: 'clip', whiteSpace: 'nowrap' }}
                    >{String(row[colId] ?? '')}</span>
                    {/* Icon slot — crossfades between clipboard and check */}
                    <div style={{ position: 'relative', width: '12px', height: '12px', flexShrink: 0 }}>
                      <AnimatePresence mode="sync" initial={false}>
                        {idCopyPhase === 'copied' ? (
                          <motion.span
                            key="check"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M11.6021 1.67472C11.8681 1.92097 11.884 2.33617 11.6378 2.60211L4.60654 10.1959C4.47921 10.3334 4.29916 10.4099 4.11178 10.4061C3.9244 10.4023 3.74757 10.3186 3.62589 10.1761L0.344642 6.33233C0.109325 6.05667 0.142027 5.64245 0.417684 5.40713C0.693341 5.17182 1.10757 5.20452 1.34288 5.48017L4.14493 8.76258L10.6747 1.71039C10.921 1.44445 11.3362 1.42848 11.6021 1.67472Z" fill="#474E5A"/>
                            </svg>
                          </motion.span>
                        ) : (
                          <motion.span
                            key="clipboard"
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <img src="/dashboard-assets/icons/clipboard12.svg" alt="" style={{ width: '12px', height: '12px', display: 'block', flexShrink: 0 }} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </div>
                {/* Tooltip — rendered inline but positioned fixed via portal */}
                {typeof document !== 'undefined' && showTooltip && createPortal(
                  <div style={{
                    position: 'fixed',
                    top: idTooltipPos.y,
                    left: idTooltipPos.x,
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    pointerEvents: 'none',
                  }}>
                    <motion.div
                      key={idCopyPhase}
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15, ease: [0.2, 0, 0.1, 1] }}
                      style={{
                        background: '#3C4F69',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        whiteSpace: 'nowrap',
                        fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                        fontSize: '14px',
                        lineHeight: '20px',
                        letterSpacing: '-0.15px',
                        color: 'white',
                        boxShadow: '0px 2px 5px 0px rgba(64,68,82,0.08), 0px 3px 9px 0px rgba(64,68,82,0.08)',
                      }}
                    >
                      {idCopyPhase === 'copied' ? 'Copied' : 'Copy to clipboard'}
                    </motion.div>
                  </div>,
                  document.body
                )}
              </td>,
            ];
          }
          case 'date': return [
            <td key={colId} data-col-id={colId} colSpan={2} className="pl-[16px] pr-[16px] text-left" style={{ ...truncBg, whiteSpace: 'nowrap', ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : <span style={{ ...contentFade, fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(cellVal)}</span>}
            </td>,
          ];
          case 'agg-list': {
            const listKey = colDef?.dataKeys?.['list'] ?? `${colId.replace('agg-list', 'agg')}-all`;
            const aggItems = Array.isArray(row[listKey]) ? (row[listKey] as string[]) : [];
            const cellPadding = 32; // 16px left + 16px right
            const availW = (columnWidths[colId] || 200) - cellPadding; // 0 = Fit sentinel, fall back to 200
            const [aggVisible, aggHidden] = computeAggVisible(aggItems, availW);
            return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...cellBg, overflow: 'hidden', ...stickyBase, borderRight: frozenBorderRight }}>
              {aggItems.length === 0 ? nullSpan : (
                <div style={{ ...contentFade, display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                  {aggVisible.length > 0 && (
                    <span style={{ fontWeight: isFirstCol ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{aggVisible.join(', ')}</span>
                  )}
                  {aggHidden > 0 && (
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '2px 6px',
                        borderRadius: '6px', fontSize: '12px', lineHeight: '16px',
                        color: '#50617A', flexShrink: 0, whiteSpace: 'nowrap',
                        background: isSelected ? (isRowHovered ? '#E0D9FB' : '#EFECFC') : (isRowHovered ? '#ECF1F6' : '#F4F7FA'),
                      }}
                    >
                      +{aggHidden}
                    </span>
                  )}
                </div>
              )}
            </td>,
          ];}
          case 'subtext': {
            const amtKey = colDef?.dataKeys?.['amount'] ?? `${colId}-amt`;
            const subKey = colDef?.dataKeys?.['sub']    ?? `${colId}-sub`;
            const isSubtextEmpty = row[amtKey] === '' || row[amtKey] === null || row[amtKey] === undefined;
            return [
              <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
                {isSubtextEmpty ? nullSpan : (
                  <div style={{ ...contentFade, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, lineHeight: 1, minWidth: 0 }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: isFirstCol ? 600 : 400, overflow: 'hidden', textOverflow: wrapCells ? 'clip' : 'ellipsis', whiteSpace: wrapCells ? 'normal' : 'nowrap' }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(row[amtKey])}</span>
                    <span className="text-[12px] leading-4" style={{ color: '#50617A', overflow: 'hidden', textOverflow: wrapCells ? 'clip' : 'ellipsis', whiteSpace: wrapCells ? 'normal' : 'nowrap' }}>{String(row[subKey] ?? '')}</span>
                  </div>
                )}
              </td>,
            ];
          }
          case 'basic-text':
          case 'metadata': return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...truncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : <span style={{ ...contentFade, fontWeight: isFirstCol ? 600 : 400 }} className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]">{String(cellVal)}</span>}
            </td>,
          ];
          case 'more-info': return [
            <td key={colId} data-col-id={colId} className="px-[16px]" style={{ ...wrapOrTruncBg, ...stickyBase, borderRight: frozenBorderRight }}>
              {isCellEmpty ? nullSpan : <div style={{ ...contentFade, display: 'flex', alignItems: 'center' }}>
                <span
                  ref={infoIconRef}
                  style={{
                    fontWeight: isFirstCol ? 600 : 400,
                    textDecorationLine: 'underline',
                    textDecorationStyle: 'dotted',
                    textDecorationColor: infoTextHover ? '#1A2C44' : '#95A4BA',
                    textUnderlineOffset: '3px',
                    cursor: 'default',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: wrapCells ? 'normal' : 'nowrap',
                  }}
                  className="text-[14px] leading-5 tracking-[-0.15px] text-[#1A2C44]"
                  onMouseEnter={() => { setInfoTextHover(true); showInfoTooltip(); }}
                  onMouseLeave={() => { setInfoTextHover(false); scheduleHideInfoTooltip(); }}
                >{String(cellVal)}</span>
              </div>}
              {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                  {infoTooltipVisible && (
                    <div key="info-tip" style={{ position: 'fixed', top: infoTooltipPos.y, left: infoTooltipPos.x, transform: 'translateX(-50%)', zIndex: 9999, pointerEvents: 'none', width: 'max-content', maxWidth: '300px' }}>
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97, transition: { duration: 0.1, ease: [0.2, 0, 0.1, 1] } }}
                        transition={{ duration: 0.15, ease: [0.2, 0, 0.1, 1] }}
                        onMouseEnter={() => { if (infoHideTimerRef.current) clearTimeout(infoHideTimerRef.current); }}
                        onMouseLeave={scheduleHideInfoTooltip}
                        style={{
                          transformOrigin: 'top center',
                          pointerEvents: 'auto',
                          background: 'white',
                          border: '1px solid #D4DEE9',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          boxShadow: '0px 2px 5px 0px rgba(64,68,82,0.08), 0px 3px 9px 0px rgba(64,68,82,0.08)',
                          maxWidth: '300px',
                          fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                        }}
                      >
                        <div style={{
                          fontSize: '14px', fontWeight: 400, lineHeight: '20px',
                          letterSpacing: '-0.15px', color: '#1A2C44',
                          display: '-webkit-box', WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}>
                          {String(row[colDef?.dataKeys?.['tooltip'] ?? `${colId}-tooltip`] ?? '<Additional info>')}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </td>,
          ];
          default: return [];
        }
        });
      })()}

      {/* True filler — absorbs remaining table width so data columns stay at exact pixel widths */}
      <td style={{ ...cellBg }} />
      {/* Sticky right endcap — must be last cell so it sits at the far right edge */}
      <td style={{ ...lastCellStyle, backgroundColor: 'transparent', position: 'sticky', right: 0, zIndex: 2 }}>
        {/* L1: white blocker */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: (isRowActive && !isSelected) ? '-1px' : 0, width: '12px', background: 'white', pointerEvents: 'none' }} />
        {/* L2: perma rounded cap — always visible, carries row bg + rounded corners */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: (isRowActive && !isSelected) ? '-1px' : 0, width: '12px', background: 'var(--bg)', borderRadius: isSelected ? `0 ${trr} ${brr} 0` : '0 8px 8px 0', pointerEvents: 'none' }} />
        {/* L3: gradient scrim — scaleX-compressed to ~8px cap by default, expands on scroll/hover */}
        <div className="right-scrim" style={{ position: 'absolute', right: '8px', top: 0, bottom: 0, width: '88px', borderRadius: isSelected ? `0 ${trr} ${brr} 0` : '0 8px 8px 0', pointerEvents: 'none' }} />
        {(rowActions ?? []).length > 0 && (
        <div className="more-icon-container" style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <button
            ref={moreButtonRef}
            style={{
              width: '28px', height: '28px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: moreMenuOpen || moreMenuHover ? '#EBEEF1' : 'none',
              borderRadius: '6px',
              transition: 'background 150ms',
            }}
            onMouseEnter={() => setMoreMenuHover(true)}
            onMouseLeave={() => setMoreMenuHover(false)}
            onClick={openMoreMenu}
          >
            <img src="/dashboard-assets/icons/more-16.svg" alt="More" style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
        )}
      </td>
      </>
      )}
    </tr>
    <FocusTrace active={consoleFocused} target={rowRef} speed="loop" radius={8} />
    {/* More menu */}
    {typeof document !== 'undefined' && moreMenuOpen && createPortal(
      <div
        ref={moreMenuRef}
        style={{
          position: 'fixed',
          top: moreMenuPos.top,
          right: moreMenuPos.right,
          zIndex: 10000,
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0px 15px 35px 0px rgba(48,49,61,0.08), 0px 5px 15px 0px rgba(0,0,0,0.12)',
          border: '1px solid #D8DEE4',
          padding: '4px',
          width: 'max-content',
          minWidth: '120px',
          maxWidth: '320px',
          fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
          animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
          transformOrigin: 'top right',
        }}
      >
        {renderMoreMenuItems(rowActions, () => setMoreMenuOpen(false), action => onRowAction?.(action, row))}
      </div>,
      document.body
    )}
    </>
  );
});

const CHIP_SHADOW_UNSELECTED = '0px 0px 0px 1px #EBEEF1, 0px 2px 3px 0px rgba(33,37,44,0)';
const CHIP_SHADOW_HOVER      = '0px 0px 0px 1px #D4DEE9, 0px 2px 3px 0px rgba(33,37,44,0)';
const CHIP_SHADOW_SELECTED   = '0px 0px 0px 2px #1A2C44, 0px 2px 3px 0px rgba(33,37,44,0.16)';
const CHIP_SHADOW_TRANSITION = { duration: 0.15, ease: [0.2, 0, 0.1, 1] as const };

// ── Collapse spring configs ─────────────────────────────────────────────────
// All positional properties (x, width, marginRight) share the same spring so
// the button expanding and the search bar shrinking are perfectly synced.
// Tune stiffness / damping here.
const SPRING_COLLAPSE_SCROLL    = { type: 'spring' as const, stiffness: 420, damping: 28 };
const SPRING_COLLAPSE_UNPINNED  = { type: 'spring' as const, stiffness: 320, damping: 26 };

// ── CollapsedListSelector ────────────────────────────────────────────────────
// Memoized so that unrelated M15Page state changes (hover, search, row data)
// don't re-render this component during the entry/exit animation.
const CollapsedListSelector = memo(function CollapsedListSelector({
  visible, allUnpinned, suppressAnim, chipLabel, chipCount, isHovered, isOpen,
  setRef, onOpen, onHoverIn, onHoverOut,
  configChanged, savePhase, saveAsName, onNameChange, onOpenNaming, onSave, onCancelNaming,
}: {
  visible: boolean;
  allUnpinned: boolean;
  suppressAnim?: boolean;
  chipLabel: string;
  chipCount?: string;
  isHovered: boolean;
  isOpen: boolean;
  setRef: (el: HTMLButtonElement | null) => void;
  onOpen: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  configChanged: boolean;
  savePhase: 'idle' | 'naming' | 'committing';
  saveAsName: string;
  onNameChange: (v: string) => void;
  onOpenNaming: () => void;
  onSave: () => void;
  onCancelNaming: () => void;
}) {
  const spring = allUnpinned ? SPRING_COLLAPSE_UNPINNED : SPRING_COLLAPSE_SCROLL;
  const isNaming = savePhase === 'naming';
  const textColor = configChanged ? '#596171' : '#1A2C44';

  return (
    // Always mounted — visibility is driven by the animate prop so Framer Motion
    // reads the transition from the current committed render (no async clone race).
    <motion.div
      style={{ flexShrink: 0, overflow: 'hidden' }}
      initial={false}
      animate={visible
        ? { width: 'auto', opacity: 1, marginRight: 0 }
        : { width: 0, opacity: 0, marginRight: -8 }}
      transition={suppressAnim ? { duration: 0 } : {
        ...spring,
        marginRight: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.1 },
      }}
    >
          {isNaming ? (
            /* ── Naming state: full chip becomes an input + Save ── */
            <div
              className="flex items-center bg-white"
              style={{
                height: '44px',
                padding: '8px 8px 8px 12px',
                gap: '4px',
                border: '2px solid #675DFF',
                borderRadius: '8px',
                overflow: 'hidden',
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              <input
                autoFocus
                type="text"
                placeholder="Name your view"
                value={saveAsName}
                onChange={e => onNameChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onSave();
                  if (e.key === 'Escape') onCancelNaming();
                }}
                className="text-[14px] font-normal leading-[20px] tracking-[-0.15px] text-[#1A2C44] placeholder:text-[#9AA3B0] outline-none bg-transparent"
                style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', width: '145px', flex: '1 0 auto', minWidth: 0 }}
              />
              <button
                onClick={onCancelNaming}
                className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] cursor-pointer bg-transparent border-none outline-none shrink-0"
                style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', padding: '0 4px', color: '#50617A' }}
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#533AFD] cursor-pointer bg-transparent border-none outline-none shrink-0"
                style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', padding: '0 4px' }}
              >
                Save
              </button>
            </div>
          ) : (
            /* ── Default / changes-made state ── */
            <button
              ref={setRef}
              onClick={onOpen}
              onMouseEnter={onHoverIn}
              onMouseLeave={onHoverOut}
              className="flex items-center rounded-[12px] cursor-pointer bg-white overflow-hidden"
              style={{
                gap: '8px',
                padding: configChanged ? '11px 8px 11px 12px' : '11px 12px',
                width: '100%',
                border: `1px solid ${isHovered || isOpen ? '#D4DEE9' : '#EBEEF1'}`,
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                outlineOffset: '0px',
                transition: 'border-color 100ms cubic-bezier(0.2, 0, 0.1, 1)',
              }}
            >
              <span className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] whitespace-nowrap" style={{ color: textColor }}>
                {chipLabel}
              </span>
              {chipCount && (
                <span className="text-[14px] font-normal leading-[20px] tracking-[-0.15px] whitespace-nowrap tabular-nums" style={{ color: textColor }}>
                  {chipCount}
                </span>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#474E5A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {configChanged && (
                <>
                  {/* Vertical divider */}
                  <div style={{ width: '1px', height: '16px', background: '#EBEEF1', flexShrink: 0 }} />
                  {/* Plus icon — opens naming mode */}
                  <div
                    role="button"
                    aria-label="Save as new view"
                    onClick={e => { e.stopPropagation(); onOpenNaming(); }}
                    className="flex items-center justify-center cursor-pointer shrink-0"
                    style={{ padding: '4px', borderRadius: '4px' }}
                  >
                    <img src="/dashboard-assets/icons/add12.svg" alt="" style={{ width: '12px', height: '12px', display: 'block', filter: 'brightness(0) saturate(100%) invert(28%) sepia(89%) saturate(3000%) hue-rotate(237deg) brightness(95%) contrast(105%)' }} />
                  </div>
                </>
              )}
            </button>
          )}
    </motion.div>
  );
});

const ViewChipButton = memo(function ViewChipButton({
  chip,
  isDragging,
  onMouseDown,
  onClick,
  verticalPadding = 8,
}: {
  chip: ViewChip;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClick: () => void;
  verticalPadding?: number;
}) {
  const [scope, animateChip] = useAnimate<HTMLButtonElement>();
  // Track previous selected state so we only animate on genuine changes, not re-renders
  const prevSelectedRef = useRef<boolean | null>(null);

  // Set initial box-shadow synchronously before paint — no animation
  useLayoutEffect(() => {
    if (!scope.current) return;
    scope.current.style.boxShadow = chip.selected ? CHIP_SHADOW_SELECTED : CHIP_SHADOW_UNSELECTED;
    prevSelectedRef.current = chip.selected;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate only when chip.selected genuinely changes (not on re-renders from parent)
  useEffect(() => {
    if (!scope.current || prevSelectedRef.current === chip.selected) return;
    prevSelectedRef.current = chip.selected;
    animateChip(scope.current, {
      boxShadow: chip.selected ? CHIP_SHADOW_SELECTED : CHIP_SHADOW_UNSELECTED,
    }, CHIP_SHADOW_TRANSITION);
  }, [chip.selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      ref={scope}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onMouseEnter={() => {
        if (!chip.selected && scope.current)
          animateChip(scope.current, { boxShadow: CHIP_SHADOW_HOVER }, CHIP_SHADOW_TRANSITION);
      }}
      onMouseLeave={() => {
        if (scope.current)
          animateChip(scope.current, {
            boxShadow: chip.selected ? CHIP_SHADOW_SELECTED : CHIP_SHADOW_UNSELECTED,
          }, CHIP_SHADOW_TRANSITION);
      }}
      className="relative flex rounded-[8px] bg-white cursor-pointer"
      style={{
        width: '100%',
        opacity: isDragging ? 0 : 1,
        fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: `${verticalPadding}px 12px` }}>
        <span
          suppressHydrationWarning
          className={`text-[14px] font-semibold leading-[20px] tracking-[-0.15px] shrink-0 ${
            chip.selected ? 'text-[#1A2C44]' : 'text-[#596171]'
          }`}
        >
          {chip.label}
        </span>
        {chip.count && (
          <span
            className={`text-[14px] font-normal leading-[20px] tracking-[-0.15px] shrink-0 ${
              chip.selected ? 'text-[#1A2C44]' : 'text-[#596171]'
            }`}
          >
            {chip.count}
          </span>
        )}
      </div>
    </button>
  );
});

// ─── Page component ────────────────────────────────────────────────────────────

/**
 * Merges saved column visibility with the current tab's column definitions.
 * - Columns that no longer exist in the config are dropped.
 * - Columns that are new (not in the saved state) are added using their `defaultVisible` setting.
 * This makes saved state resilient to config changes (column additions/removals/renames).
 */
function mergeVisibleColumns(savedVisible: string[], tabCols: TabConfig['columns']): Set<string> {
  const currentIds = new Set(tabCols.map(c => c.id));
  const savedSet = new Set(savedVisible);
  const valid = savedVisible.filter(id => currentIds.has(id));
  const added = tabCols.filter(c => !savedSet.has(c.id) && c.defaultVisible !== false).map(c => c.id);
  return new Set([...valid, ...added]);
}

/**
 * Merges saved column widths with defaults for any new columns not in the saved state.
 */
function mergeColumnWidths(
  savedWidths: Record<string, number>,
  tabCols: TabConfig['columns'],
): Record<string, number> {
  const defaults = Object.fromEntries(tabCols.map(c => [c.id, colDefaultWidth(c)]));
  return { ...defaults, ...savedWidths };
}

function getTabDefaultChips(tab: TabConfig): ViewChip[] {
  // "All" is always the first chip and is never part of defaultViewChips.
  // allViewConfig lets a tab set default sort/columns for it without polluting the named chip list.
  const allChip: ViewChip = { id: 'all', label: 'All', selected: false, ...(tab.allViewConfig ?? {}) };

  // Guard against stale configs that may have placed 'all' inside defaultViewChips.
  const namedChips = (tab.defaultViewChips ?? []).filter(c => c.id !== 'all');
  const base: ViewChip[] = namedChips.length > 0
    ? (namedChips as ViewChip[])
    : DEFAULT_VIEW_CHIPS.filter(c => c.id !== '1');

  return [allChip, ...base].map((c, i) => ({ ...c, selected: i === 0 }));
}

export default function DashboardListViewTemplate({
  config,
  /** If provided, tab clicks push `<basePath>/<tabId>` to the browser URL. */
  basePath,
  /** Tab ID to activate on mount (and when it changes via browser navigation). */
  initialTabId,
}: {
  config: PageConfig;
  basePath?: string;
  initialTabId?: string;
}) {
  const router = useRouter();
  const [activeTabIdx, setActiveTabIdx] = useState(() => {
    if (!initialTabId) return 0;
    const idx = config.tabs.findIndex(t => t.tabId === initialTabId);
    return idx >= 0 ? idx : 0;
  });

  // Handle browser back/forward when basePath routing is active.
  // Tab clicks use history.pushState (no Next.js navigation), so we must
  // listen for popstate ourselves to keep the tab in sync.
  useEffect(() => {
    if (!basePath) return;
    const handlePop = () => {
      const seg = dashboardRelativePath(window.location.pathname).startsWith(`${basePath}/`)
        ? dashboardRelativePath(window.location.pathname).slice(basePath.length + 1).split('/')[0]
        : '';
      const idx = config.tabs.findIndex(t => t.tabId === seg);
      if (idx >= 0) setActiveTabIdx(idx);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [basePath, config.tabs]); // eslint-disable-line react-hooks/exhaustive-deps
  const [analyzeTooltipVisible, setAnalyzeTooltipVisible] = useState(false);
  const [analyzeHovered, setAnalyzeHovered] = useState(false);
  const [analyzeTooltipPos, setAnalyzeTooltipPos] = useState({ top: 0, left: 0 });
  const analyzeBtnRef = useRef<HTMLButtonElement>(null);
  const [exportTooltipVisible, setExportTooltipVisible] = useState(false);
  const [exportHovered, setExportHovered] = useState(false);
  const [exportTooltipPos, setExportTooltipPos] = useState({ top: 0, left: 0 });
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const [createHovered, setCreateHovered] = useState(false);
  const [pageActionsOverflowOpen, setPageActionsOverflowOpen] = useState(false);
  const [promotedActionHovered, setPromotedActionHovered] = useState(false);
  const [pageActionsOverflowPos, setPageActionsOverflowPos] = useState({ top: 0, right: 0 });
  const [pageActionsOverflowHover, setPageActionsOverflowHover] = useState(false);
  const [moreTooltipPos, setMoreTooltipPos] = useState({ top: 0, left: 0 });
  const pageActionsOverflowBtnRef = useRef<HTMLButtonElement>(null);
  const pageActionsOverflowMenuRef = useRef<HTMLDivElement>(null);
  const activeTab = config.tabs[activeTabIdx];
  // Header and tab bar stay put; everything under the tab bar replays the
  // page enter motion when the tab changes.
  const tabBarRef = useRef<HTMLDivElement>(null);
  useFadeSlideIn(tabBarRef, activeTabIdx, { target: 'nextSiblings' });
  const bulkSelectCheckboxes = activeTab.bulkSelectCheckboxes !== false;
  const CHECKBOX_COL_WIDTH = bulkSelectCheckboxes ? 40 : 0;

  // 'all' is always the first pinned chip — never let config or localStorage move it.
  const withAllFirst = (ids: string[]): string[] => ['all', ...ids.filter(id => id !== 'all')];

  const defaultViewChips: ViewChip[] = getTabDefaultChips(activeTab);
  const defaultPinnedIds: string[] = withAllFirst(activeTab.defaultPinnedIds ?? defaultViewChips.map(c => c.id));
  // IDs of chips that ship with the page config. These cannot be renamed or deleted.
  const predefinedChipIds = new Set(defaultViewChips.map(c => c.id));
  // The first (primary) chip acts as "All" — it is always pinned and not draggable.
  const primaryChipId = defaultViewChips[0]?.id ?? '';

  const LS = {
    chips:   `${config.pageId}-${activeTab.tabId}-list-chips`,
    pinned:  `${config.pageId}-${activeTab.tabId}-pinned-ids`,
    configs: `${config.pageId}-${activeTab.tabId}-chip-configs`,
    default: `${config.pageId}-${activeTab.tabId}-default-chip`,
  };

  // Initialise from localStorage synchronously so the very first render already
  // has the stored chip set. This ensures AnimatePresence initial={false} can
  // suppress all enter animations on page navigation — if we deferred to a
  // useEffect, the post-mount hydration re-render would make stored/custom chips
  // look "new" to AnimatePresence and trigger their slide-in animation.
  const [viewChips, setViewChips] = useState<ViewChip[]>(() => {
    const storedDefault = lsGet<string>(LS.default);
    const resolvedDefaultId = storedDefault ?? defaultViewChips[0]?.id ?? '1';
    const storedChips = lsGet<ViewChip[]>(LS.chips);
    if (storedChips) {
      return ensureAllFirst(storedChips.map(chip => {
        const def = defaultViewChips.find(d => d.id === chip.id);
        return { ...(def ? { ...chip, count: def.count } : chip), selected: chip.id === resolvedDefaultId };
      }));
    }
    return defaultViewChips.map(c => ({ ...c, selected: c.id === resolvedDefaultId }));
  });
  // Tracks which tab index the current viewChips/pinnedViewIds state belongs to.
  // When activeTabIdx differs, it means we're in the stale intermediate render
  // before useLayoutEffect corrects the chip state — use tab defaults directly
  // so AnimatePresence sees the correct chip IDs from the very first render.
  const [viewChipsTabIdx, setViewChipsTabIdx] = useState(activeTabIdx);
  // Stays true through render #2 and Framer Motion's async rAF so exit/enter
  // animations are fully suppressed during a tab switch.
  const [suppressTabAnim, setSuppressTabAnim] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [hoveredChipId, setHoveredChipId] = useState<string | null>(null);
  const [dragChipId, setDragChipId] = useState<string | null>(null);
  const [isMoreButtonHovered, setIsMoreButtonHovered] = useState(false);
  const handleMoreButtonHoverIn  = useCallback(() => setIsMoreButtonHovered(true), []);
  const handleMoreButtonHoverOut = useCallback(() => setIsMoreButtonHovered(false), []);
  const [defaultChipId, setDefaultChipId] = useState<string>(() => lsGet<string>(LS.default) ?? defaultViewChips[0]?.id ?? '');
  const [isViewsPopoverOpen, setIsViewsPopoverOpen] = useState(false);
  const [pinnedViewIds, setPinnedViewIds] = useState<Set<string>>(() => {
    const storedPinned = lsGet<string[]>(LS.pinned);
    return new Set(withAllFirst(storedPinned ?? defaultPinnedIds));
  });

  // tabSwitchPending: true during render #1 (before the layout effect settles state).
  // suppressTabAnim: true during render #2 and Framer Motion's async rAF (set in
  //   the layout effect alongside state resets, cleared after 2 rAFs).
  // suppressAnim: the single source of truth — used everywhere animation suppression
  //   is needed during a tab switch.
  const tabSwitchPending = viewChipsTabIdx !== activeTabIdx;
  const suppressAnim = tabSwitchPending || suppressTabAnim;

  // During a tab switch use the incoming tab's defaults for chip/pinned data.
  // This keeps allUnpinned (and therefore AnimatePresence-driven visibility) stable
  // across ALL renders of the switch (renders #1, #2, and while suppressTabAnim is true),
  // preventing spurious enter/exit animations.
  const displayViewChips = suppressAnim ? getTabDefaultChips(activeTab) : viewChips;
  const displayPinnedIds = suppressAnim
    ? new Set(withAllFirst(activeTab.defaultPinnedIds ?? getTabDefaultChips(activeTab).map((c) => c.id)))
    : pinnedViewIds;
  const [hoveredMoreBtnId, setHoveredMoreBtnId] = useState<string | null>(null);
  const [hoveredListRowId, setHoveredListRowId] = useState<string | null>(null);
  const [listActionsChipId, setListActionsChipId] = useState<string | null>(null);
  const [submenuAnchor, setSubmenuAnchor] = useState<{ top: number; right: number; left: number } | null>(null);
  const [chipContextMenu, setChipContextMenu] = useState<{ chipId: string; x: number; y: number } | null>(null);
  const chipContextMenuRef = useRef<HTMLDivElement>(null);
  const [chipRenameId, setChipRenameId] = useState<string | null>(null);
  const [chipRenameValue, setChipRenameValue] = useState('');
  const chipRenameInputRef = useRef<HTMLInputElement>(null);
  const [renameChipId, setRenameChipId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [chipFilterAnchor, setChipFilterAnchor] = useState<{ left: number; top: number; height: number } | null>(null);
  const [hoveredFilterChipId, setHoveredFilterChipId] = useState<string | null>(null);
  const [pressedFilterChipId, setPressedFilterChipId] = useState<string | null>(null);
  const [isFilterBtnHovered, setIsFilterBtnHovered] = useState(false);
  const [showScrollGradient, setShowScrollGradient] = useState(false);
  const [showTopScrollGradient, setShowTopScrollGradient] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'subpage'>('main');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [filterChips, setFilterChips] = useState<FilterChip[]>([]);
  // Per-type filter input state (populated when opening a subpage)
  const [filterDateOp, setFilterDateOp] = useState('is in the last');
  const [filterDateVal, setFilterDateVal] = useState('');
  const [filterDateUnit, setFilterDateUnit] = useState('days');
  const [filterDateTz, setFilterDateTz] = useState<'GMT-8' | 'UTC'>('GMT-8');
  const [filterSingleVal, setFilterSingleVal] = useState('');
  const [filterValueOp, setFilterValueOp] = useState('is equal to');
  const [filterValueInput, setFilterValueInput] = useState('');
  const [isMoreChipsOpen, setIsMoreChipsOpen] = useState(false);
  const [savePhase, setSavePhase] = useState<'idle' | 'naming' | 'committing'>('idle');
  const [saveAsName, setSaveAsName] = useState('');
  const [isSelectingChip, setIsSelectingChip] = useState(false);
  const saveAsInputRef = useRef<HTMLInputElement>(null);
  const saveTextRef = useRef<HTMLButtonElement>(null);
  const saveContainerRef = useRef<HTMLDivElement>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const lastClickedIndexRef = useRef<number | null>(null);
  const hasSelectionRef = useRef<boolean>(false);
  const [barVisible, setBarVisible] = useState(false);
  const [barExiting, setBarExiting] = useState(false);
  const barExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [omnibarOpen, setOmnibarOpen] = useState(false);
  // Snapshot of bar content — frozen when exit begins so content doesn't change during fade-out
  const barSnapshotRef = useRef({ selectedCount: 0, refundableCount: 0 });
  const barRowDataRef = useRef<Record<string, unknown>[]>([]);
  const [columnMenu, setColumnMenu] = useState<{ colId: string; x: number; y: number } | null>(null);
  const [sortCol, setSortCol] = useState<string | null>(activeTab.allViewConfig?.sortCol ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(activeTab.allViewConfig?.sortDir ?? 'asc');
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);
  // Frozen column list for the settings popover — captured once when the popover
  // opens so toggling visibility doesn't reorder the list while the user is editing.
  // The live `visibleColumns` state still drives checkbox state immediately.
  const [popoverColumns, setPopoverColumns] = useState<ColumnDef[]>([]);
  const [wrapCells, setWrapCells] = useState(false);
  const [saveBadge, setSaveBadge] = useState<{ x: number; y: number } | null>(null);
  const [saveToast, setSaveToast] = useState<{ label: string } | null>(null);
  // Suppresses the save indicator for any programmatic column-state reset (mount,
  // tab switch, chip selection). Set to true before calling the state setters;
  // the auto-save effect reads it and clears it.
  // Suppresses the save indicator for programmatic column-state resets that happen
  // AFTER the initialization window (tab switch, chip selection).
  const suppressSaveIndicatorRef = useRef(false);
  // True only AFTER the first two animation frames have elapsed. Any autosave
  // effect runs that fire before this point are initialization artifacts and must
  // be ignored, regardless of how many renders React batches on mount.
  const postInitRef = useRef(false);
  const [paginationPage, setPaginationPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isTableLoading, setIsTableLoading] = useState(true);
  // The shimmer keeps pulsing through its fade-out, then stops so the hidden
  // overlay isn't repainting the table every frame.
  const [shimmerRunning, setShimmerRunning] = useState(true);
  if (isTableLoading && !shimmerRunning) setShimmerRunning(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const chipRowSectionRef = useRef<HTMLDivElement>(null);
  const stickyBarRef = useRef<HTMLDivElement>(null);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);
  const isScrolledRef = useRef(false);
  const shimmerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadActiveRef = useRef(true);
  const { foreverLoading, columnDragStyle, columnResizeStyle, simulateNoHScroll, autosaveIndicator, consoleAction, setConsoleAction, rowStatusOverrides, consoleControlledSelection, setConsoleControlledSelection, pendingRows } = usePrototype();
  // Row actions carrying a `consolePrompt` dock the Console panel with that
  // prompt, and the row's entity as its context.
  const { askConsole } = useDashboardConsole();
  const [, setAskedRow] = useState<Record<string, unknown> | null>(null);
  const handleRowAction = useCallback((action: RowAction, row: Record<string, unknown>) => {
    if (!action.consolePrompt) return;
    const entity = action.consoleContext?.(row);
    setAskedRow(entity ? row : null);
    askConsole({
      prompt: typeof action.consolePrompt === 'function' ? action.consolePrompt(row) : fillRowPrompt(action.consolePrompt, row),
      row: entity ? { label: entity } : undefined,
    });
  }, [askConsole]);
  const noSearch = config.noSearch ?? false;
  const includeViewTotals = config.includeViewTotals ?? true;
  const autoCollapseOnStick = true;
  const [pageSizeMenuOpen, setPageSizeMenuOpen] = useState(false);
  const pageSizeMenuRef = useRef<HTMLDivElement>(null);
  const pageSizeTriggerRef = useRef<HTMLButtonElement>(null);

  // Pagination overlay visibility
  const [paginationShown, setPaginationShown] = useState(false);
  const [paginationSticky, setPaginationSticky] = useState(false);
  const [paginationLeft, setPaginationLeft] = useState(0);
  const [tableClientWidth, setTableClientWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1440);
  const paginationOverlayRef = useRef<HTMLDivElement>(null);
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(activeTab.columns.map(c => [c.id, colDefaultWidth(c)]))
  );

  const openColumnMenu = (e: React.MouseEvent<HTMLTableCellElement>, colId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setColumnMenu({ colId, x: rect.left, y: rect.bottom + 4 });
  };

  const startResize = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    const startX = e.clientX;
    // Fit columns (width === 0) have no stored pixel width yet — read from the DOM.
    const rawWidth = columnWidths[colId];
    const startWidth = rawWidth === 0
      ? (tableElRef.current?.querySelector<HTMLTableCellElement>(`th[data-col-id="${colId}"]`)?.offsetWidth ?? COLUMN_SIZE_PX.M)
      : rawWidth;
    const startDividerX = lastColDivider.current.x;
    const minWidth = getColMinWidth(colId, colLabels);
    setResizingCol(colId);
    document.body.classList.add('col-resizing');

    // Capture frozen-column order at drag start (stable for the lifetime of this drag)
    const isFrozenCol = frozenColumns.has(colId);
    const frozenOrder = columnOrder.filter(id => visibleColumns.has(id) && frozenColumns.has(id));
    // Snapshot of widths for non-resized columns (used when updating frozen offsets)
    const widthSnapshot = { ...columnWidths };

    let liveWidth = startWidth; // local variable — no React state during drag

    const onMove = (ev: MouseEvent) => {
      liveWidth = Math.max(minWidth, startWidth + ev.clientX - startX);

      // ── Direct DOM: update the <col> width — zero React re-renders ──────────
      const tableEl = tableElRef.current;
      if (tableEl) {
        const col = tableEl.querySelector<HTMLElement>(`col[data-col-id="${colId}"]`);
        if (col) {
          // currency cols: main <col> is (width - 56), the 56px code sub-col is fixed
          col.style.width = colMeta[colId]?.type === 'currency'
            ? `${liveWidth - 56}px`
            : `${liveWidth}px`;
        }
        // ── Update frozen left CSS vars if this column is frozen ──────────────
        if (isFrozenCol) {
          let left = 40;
          for (const id of frozenOrder) {
            const w = id === colId ? liveWidth : (widthSnapshot[id] ?? 160);
            tableEl.style.setProperty(`--fl-${id}`, `${left}px`);
            if (colMeta[id]?.type === 'currency') {
              tableEl.style.setProperty(`--fl-${id}-code`, `${left + w - 56}px`);
            }
            left += w;
          }
        }
      }

      // Only React update during drag: the divider line position (tiny — TableRow memo
      // prevents any row from re-rendering since columnWidths prop is unchanged)
      const x = startDividerX + (liveWidth - startWidth);
      lastColDivider.current = { colId, x };
      setColDivider({ colId, x });
    };

    const onUp = () => {
      // Single React commit for the final width
      setColumnWidths(prev => ({ ...prev, [colId]: liveWidth }));
      setResizingCol(null);
      document.body.classList.remove('col-resizing');
      document.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true });
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() =>
    new Set(activeTab.columns.filter(c => c.defaultVisible !== false).map(c => c.id))
  );
  const initialColOrder = activeTab.columns.map(c => c.id);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColOrder);
  const [frozenColumns, setFrozenColumns] = useState<Set<string>>(new Set());
  const columnOrderRef = useRef<string[]>(initialColOrder);

  // ── Reset all tab-scoped state when the active tab changes ────────────────
  // Tracks the last *committed* (painted) tab index. During the re-render
  // triggered by a tab switch it lags one cycle behind activeTabIdx, which lets
  // chip motion elements detect they should skip their entry animation.

  // Synchronously reset all per-tab state before the browser paints so the user
  // never sees a stale-column intermediate frame when switching tabs.
  const prevTabIdxRef = useRef(activeTabIdx);
  useLayoutEffect(() => {
    if (prevTabIdxRef.current === activeTabIdx) return;
    prevTabIdxRef.current = activeTabIdx;

    const tab = config.tabs[activeTabIdx];
    const chips = getTabDefaultChips(tab);
    const pinned = withAllFirst(tab.defaultPinnedIds ?? chips.map(c => c.id));

    // Load saved column settings for the incoming tab from localStorage so that
    // (a) column customisations are restored when switching tabs, and
    // (b) chipSettingsRef is re-seeded for the new tab so subsequent saves don't
    //     corrupt the outgoing tab's persisted data.
    const incomingChipKey = `${config.pageId}-${tab.tabId}-chip-settings-v2`;
    let incomingChipSettings: Record<string, { columnWidths: Record<string, number>; visibleColumns: string[]; columnOrder?: string[] }> = {};
    try {
      const stored = dashboardStorage.getItem(incomingChipKey);
      if (stored) incomingChipSettings = JSON.parse(stored);
    } catch { /* noop */ }
    chipSettingsRef.current = incomingChipSettings;

    const incomingDefaultChipId = chips[0]?.id ?? '1';
    const savedForIncoming = incomingChipSettings[incomingDefaultChipId];

    setViewChips(chips);
    setViewChipsTabIdx(activeTabIdx);
    setSuppressTabAnim(true);
    setPinnedViewIds(new Set(pinned));
    setDefaultChipId(incomingDefaultChipId);
    suppressSaveIndicatorRef.current = true;

    if (savedForIncoming) {
      setColumnWidths(mergeColumnWidths(savedForIncoming.columnWidths, tab.columns));
      setVisibleColumns(mergeVisibleColumns(savedForIncoming.visibleColumns, tab.columns));
      if (savedForIncoming.columnOrder) {
        const allColIds = tab.columns.map(c => c.id);
        const merged = [...savedForIncoming.columnOrder, ...allColIds.filter(id => !savedForIncoming.columnOrder!.includes(id))];
        setColumnOrder(merged);
        columnOrderRef.current = merged;
      } else {
        const newOrder = tab.columns.map(c => c.id);
        setColumnOrder(newOrder);
        columnOrderRef.current = newOrder;
      }
    } else {
      setColumnWidths(Object.fromEntries(tab.columns.map(c => [c.id, colDefaultWidth(c)])));
      setVisibleColumns(new Set(tab.columns.filter(c => c.defaultVisible !== false).map(c => c.id)));
      const newOrder = tab.columns.map(c => c.id);
      setColumnOrder(newOrder);
      columnOrderRef.current = newOrder;
    }
    setFrozenColumns(new Set());
    setFilterChips([]);
    setSearchValue('');
    setDebouncedSearch('');
    setSelectedRows(new Set());
    lastClickedIndexRef.current = null;
    setPaginationPage(1);
    setSortCol(null);
    setSortDir('asc');

    // Re-seed chip filter configs for the incoming tab so predefined chip filters
    // are always available regardless of which tab was active at mount time.
    const incoming = (tab.defaultViewChips ?? []).filter(c => c.id !== 'all');
    const tabFilters = tab.filters ?? [];
    const freshConfigs: Record<string, { filters: FilterChip[]; searchQuery: string; sortCol?: string | null; sortDir?: 'asc' | 'desc' }> = {
      // 'all' chip always reset to allViewConfig values.
      all: {
        filters: [],
        searchQuery: '',
        sortCol: tab.allViewConfig?.sortCol ?? null,
        sortDir: (tab.allViewConfig?.sortDir ?? 'asc') as 'asc' | 'desc',
      },
      ...Object.fromEntries(
        incoming.map(c => [c.id, {
          filters: (c.filters ?? []).map(f => ({
            ...f,
            filterName: f.filterName ?? tabFilters.find(fd => fd.id === f.id)?.label ?? f.id,
            selectedValues: f.selectedValues ?? [],
          })) as FilterChip[],
          searchQuery: '',
          sortCol: c.sortCol ?? null,
          sortDir: c.sortDir ?? 'asc' as const,
        }])
      ),
    };
    // Preserve any user-created chip configs that were already in the ref.
    const existingIds = new Set(['all', ...incoming.map(c => c.id)]);
    for (const [id, cfg] of Object.entries(chipListConfigsRef.current)) {
      if (!existingIds.has(id)) freshConfigs[id] = cfg;
    }
    chipListConfigsRef.current = freshConfigs;
  }, [activeTabIdx, config.tabs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Returns the sticky `left` offset (px) for a frozen column, accounting for
  // the optional checkbox column and all frozen columns that precede it in order.
  const getFrozenLeft = useCallback((colId: string): number => {
    let left = CHECKBOX_COL_WIDTH;
    for (const id of columnOrder) {
      if (!visibleColumns.has(id)) continue;
      if (id === colId) break;
      if (frozenColumns.has(id)) left += columnWidths[id] ?? 160;
    }
    return left;
  }, [columnOrder, visibleColumns, frozenColumns, columnWidths, CHECKBOX_COL_WIDTH]);
  const [dragColId, setDragColId] = useState<string | null>(null);
  const ghostElRef = useRef<HTMLDivElement | null>(null);
  const ghostPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragColHappenedRef = useRef(false);
  const dragColClickOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // First visible data row index at drag start — used to mirror scroll state in ghost
  const dragGhostRowOffsetRef = useRef(0);
  const flipSnapRef = useRef<Record<string, number> | null>(null);
  const lineIndicatorRef = useRef<HTMLDivElement | null>(null);
  const linePendingOrderRef = useRef<string[] | null>(null);
  const lineDropIdxRef = useRef<number>(-1);
  const lineAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chip FLIP drag refs ────────────────────────────────────────────────────
  const chipRowRef = useRef<HTMLDivElement>(null);
  // Tracks the chip ID just committed from the save flow — skips its enter animation
  const justCommittedChipIdRef = useRef<string | null>(null);
  const chipGhostRef = useRef<HTMLDivElement | null>(null);
  const chipGhostPosRef = useRef({ x: 0, y: 0 });
  const chipGhostSizeRef = useRef({ w: 0, h: 0 });
  const chipDragHappenedRef = useRef(false);
  const chipDragIdRef = useRef<string | null>(null);
  const chipCurrentOrderRef = useRef<string[]>([]);
  const chipFLIPSnapRef = useRef<Record<string, number>>({}); // chipId → left px before reorder

  // ── Chip row scroll scrim refs / state ─────────────────────────────────────
  const noSearchScrollRef = useRef<HTMLDivElement>(null);
  const chipRowScrollRef = useRef<HTMLDivElement>(null);
  const [noSearchScrims, setNoSearchScrims] = useState({ left: false, right: false });
  const [chipRowScrims, setChipRowScrims] = useState({ left: false, right: false });

  useEffect(() => {
    const el = noSearchScrollRef.current;
    if (!el) return;
    const check = () => setNoSearchScrims({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, [noSearch, activeTabIdx]);

  useEffect(() => {
    const el = chipRowScrollRef.current;
    if (!el) return;
    const check = () => setChipRowScrims({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, [noSearch, activeTabIdx]);

  // Derived from active tab — recomputed whenever the active tab changes
  const allColumns = activeTab.columns.map(c => ({ id: c.id, label: c.label, type: c.type, isMetadata: c.isMetadata }));
  const colLabels: Record<string, string> = Object.fromEntries(activeTab.columns.map(c => [c.id, c.label]));
  // Types that are inherently right-aligned — header follows cell alignment automatically.
  const RIGHT_ALIGNED_TYPES = new Set(['numerical', 'currency', 'color-coded']);
  const colMeta: Record<string, { label: string; align: 'left' | 'right'; colSpan?: number; type: string }> =
    Object.fromEntries(activeTab.columns.map(c => [c.id, {
      label: c.label,
      align: c.align ?? (RIGHT_ALIGNED_TYPES.has(c.type) ? 'right' : 'left'),
      colSpan: c.colSpan,
      type: c.type,
    }]));

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const sortedColumns = [
    // Visible columns: user's drag order
    ...columnOrder
      .filter(id => visibleColumns.has(id))
      .flatMap(id => { const c = allColumns.find(col => col.id === id); return c ? [c] : []; }),
    // Hidden columns: alphabetical
    ...allColumns.filter(c => !visibleColumns.has(c.id)).sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const toggleRowSelected = useCallback((i: number) => {
    if (!bulkSelectCheckboxes) return;
    setConsoleControlledSelection(false);
    lastClickedIndexRef.current = i;
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }, [bulkSelectCheckboxes, setConsoleControlledSelection]);

  const filteredRowsRef = useRef<{ row: Record<string, unknown>; originalIndex: number }[]>([]);

  const handleRowClick = useCallback((e: React.MouseEvent, originalIndex: number) => {
    if (!bulkSelectCheckboxes) return;
    if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl+click: toggle individual row
      toggleRowSelected(originalIndex);
    } else if (e.shiftKey) {
      // Shift+click: select range from last clicked to this row (in filtered display order)
      const anchor = lastClickedIndexRef.current;
      const rows = filteredRowsRef.current;
      if (anchor === null) { toggleRowSelected(originalIndex); return; }
      const anchorPos = rows.findIndex(r => r.originalIndex === anchor);
      const currPos   = rows.findIndex(r => r.originalIndex === originalIndex);
      if (anchorPos === -1 || currPos === -1) { toggleRowSelected(originalIndex); return; }
      const start = Math.min(anchorPos, currPos);
      const end   = Math.max(anchorPos, currPos);
      setSelectedRows(prev => {
        const next = new Set(prev);
        rows.slice(start, end + 1).forEach(r => next.add(r.originalIndex));
        return next;
      });
      lastClickedIndexRef.current = originalIndex;
    }
  }, [bulkSelectCheckboxes, toggleRowSelected]);


  useEffect(() => {
    if (bulkSelectCheckboxes) return;
    setSelectedRows(new Set());
    lastClickedIndexRef.current = null;
  }, [bulkSelectCheckboxes, activeTabIdx]);

  // Canonical config per chip — filters + search query.
  // Table settings auto-save; filters/search do NOT auto-save.
  // Stored in a ref so mutations (e.g. from saveNewView) survive re-renders.

  // Resolve filterName from the tab's FilterDef list if not provided explicitly.
  const resolveFilterName = useCallback((f: { id: string; filterName?: string }) => {
    if (f.filterName) return f.filterName;
    return activeTab.filters?.find(fd => fd.id === f.id)?.label ?? f.id;
  }, [activeTab.filters]);

  const chipListConfigsRef = useRef<Record<string, { filters: FilterChip[]; searchQuery: string; sortCol?: string | null; sortDir?: 'asc' | 'desc' }>>(
    Object.fromEntries([
      // 'all' chip always gets its own entry; seeded from allViewConfig when provided.
      ['all', {
        filters: [],
        searchQuery: '',
        sortCol: activeTab.allViewConfig?.sortCol ?? null,
        sortDir: (activeTab.allViewConfig?.sortDir ?? 'asc') as 'asc' | 'desc',
      }],
      // Named view chips follow.
      ...(activeTab.defaultViewChips ?? []).filter(c => c.id !== 'all').map(c => [c.id, {
        filters: (c.filters ?? []).map(f => ({ ...f, filterName: resolveFilterName(f), selectedValues: f.selectedValues ?? [] })),
        searchQuery: '',
        sortCol: c.sortCol ?? null,
        sortDir: c.sortDir ?? 'asc' as const,
      }]),
    ])
  );
  const chipListConfigs = chipListConfigsRef.current;

  // v2: bumped when column-width defaults changed (S/M/L refactor) to wipe stale saved widths.
  // Keyed by tabId so tabs with overlapping chip ids don't overwrite each other's column layouts.
  const CHIP_SETTINGS_KEY = `${config.pageId}-${activeTab.tabId}-chip-settings-v2`;
  const chipSettingsRef = useRef<Record<string, { columnWidths: Record<string, number>; visibleColumns: string[]; columnOrder?: string[] }>>(
    (() => {
      try {
        const stored = typeof window !== 'undefined' ? dashboardStorage.getItem(CHIP_SETTINGS_KEY) : null;
        return stored ? JSON.parse(stored) : {};
      } catch { return {}; }
    })()
  );

  // On mount: hydrate all persisted state then apply the resolved default chip's config.
  // Merged into a single effect so that the default chip ID, its filter config, and its
  // table settings are all resolved from localStorage together before any state is set —
  // avoiding a race where an earlier effect reads the pre-hydration initial chip selection.
  useEffect(() => {
    // 1. Resolve default chip ID
    const storedDefault = lsGet<string>(LS.default);
    const resolvedDefaultId = storedDefault ?? defaultViewChips[0]?.id ?? '1';
    if (storedDefault) setDefaultChipId(storedDefault);

    // 2. Restore pinned IDs
    const storedPinned = lsGet<string[]>(LS.pinned);
    if (storedPinned) setPinnedViewIds(new Set(withAllFirst(storedPinned)));

    // 3. Restore per-chip filter configs into the ref
    const storedConfigs = lsGet<Record<string, { filters: FilterChip[]; searchQuery: string }>>(LS.configs);
    if (storedConfigs) Object.assign(chipListConfigsRef.current, storedConfigs);

    // 4. Restore view chips, forcing selection onto the resolved default
    const storedChips = lsGet<ViewChip[]>(LS.chips);
    if (storedChips) {
      setViewChips(ensureAllFirst(storedChips.map(chip => {
        const def = defaultViewChips.find(d => d.id === chip.id);
        return { ...(def ? { ...chip, count: def.count } : chip), selected: chip.id === resolvedDefaultId };
      })));
    } else {
      setViewChips(prev => prev.map(c => ({ ...c, selected: c.id === resolvedDefaultId })));
    }

    // 5. Apply the resolved chip's table settings (column widths / visibility / order).
    //    Merge with current config so added/removed columns don't break saved state.
    const savedSettings = chipSettingsRef.current[resolvedDefaultId];
    if (savedSettings) {
      setColumnWidths(mergeColumnWidths(savedSettings.columnWidths, activeTab.columns));
      setVisibleColumns(mergeVisibleColumns(savedSettings.visibleColumns, activeTab.columns));
      if (savedSettings.columnOrder) {
        const savedOrder = savedSettings.columnOrder;
        const allColIds = activeTab.columns.map(c => c.id);
        const merged = [...savedOrder, ...allColIds.filter(id => !savedOrder.includes(id))];
        columnOrderRef.current = merged;
        setColumnOrder(merged);
      }
    }

    // 6. Apply the resolved chip's filter/search config — must come AFTER step 3
    //    so chipListConfigsRef.current already has the persisted overrides merged in.
    const cfg = chipListConfigsRef.current[resolvedDefaultId];
    setFilterChips(cfg?.filters ?? []);
    setSearchValue(cfg?.searchQuery ?? '');
    setDebouncedSearch(cfg?.searchQuery ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open the postInitRef gate after two animation frames. Any autosave effect
  // runs that fire before this point are initialization artifacts (initial render
  // + localStorage hydration re-renders) and must not show the indicator.
  useEffect(() => {
    let id2: number;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => { postInitRef.current = true; });
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, []);

  // Auto-focus Save As input when it opens
  useEffect(() => {
    if (savePhase === 'naming') saveAsInputRef.current?.focus();
  }, [savePhase]);

  // Auto-focus + select-all rename input when it opens
  useEffect(() => {
    if (renameChipId) {
      // slight delay so the panel slide finishes before focus
      setTimeout(() => { renameInputRef.current?.focus(); renameInputRef.current?.select(); }, 180);
    }
  }, [renameChipId]);

  // Keep a mutable ref to viewChips so drag-event closures always see the latest value
  const viewChipsRef = useRef<typeof viewChips>(viewChips);
  useEffect(() => { viewChipsRef.current = viewChips; }, [viewChips]);

  // Persist view chips (labels, custom chips, selected state)
  useEffect(() => { lsSet(LS.chips, viewChips); }, [viewChips]);

  // Persist pinned view IDs
  useEffect(() => { lsSet(LS.pinned, Array.from(pinnedViewIds)); }, [pinnedViewIds]);

  // Persist default chip
  useEffect(() => { lsSet(LS.default, defaultChipId); }, [defaultChipId]);

  // Auto-save table settings only (not filters) on every change
  useEffect(() => {
    // Suppress during initialization window (first 2 frames after mount)
    if (!postInitRef.current) return;
    // Suppress for programmatic resets (tab switch, chip selection).
    // Also skip the localStorage write so that resetting to defaults never
    // overwrites previously-saved custom column state.
    if (suppressSaveIndicatorRef.current) { suppressSaveIndicatorRef.current = false; return; }

    const currentId = viewChips.find(c => c.selected)?.id;
    if (currentId) {
      chipSettingsRef.current[currentId] = {
        columnWidths,
        visibleColumns: Array.from(visibleColumns),
        columnOrder,
      };
      try {
        dashboardStorage.setItem(CHIP_SETTINGS_KEY, JSON.stringify(chipSettingsRef.current));
      } catch { /* storage unavailable */ }
    }

    const selectedChip = viewChips.find(c => c.selected);
    const chipEl = selectedChip
      ? document.querySelector(`[data-chip-id="${selectedChip.id}"]`)
      : null;

    if (autosaveIndicator === 'badge') {
      if (chipEl) {
        const rect = chipEl.getBoundingClientRect();
        setSaveBadge({ x: rect.right - 10, y: rect.top - 10 });
      }
      const t1 = setTimeout(() => setSaveBadge(null), 700);
      // Dismiss eagerly on cleanup so that if this effect re-runs (deps changed)
      // but the next run is suppressed, the indicator doesn't get stuck on screen.
      // React 18 batches the setSaveBadge(null) with any subsequent setSaveBadge(...)
      // in the same flush, so there is no visible flash when a new badge immediately follows.
      return () => { clearTimeout(t1); setSaveBadge(null); };
    } else {
      setSaveToast({ label: selectedChip?.label ?? 'view' });
      const t1 = setTimeout(() => setSaveToast(null), 5200);
      return () => { clearTimeout(t1); setSaveToast(null); };
    }
  }, [columnWidths, visibleColumns, columnOrder]); // eslint-disable-line react-hooks/exhaustive-deps
  const viewsPopoverRef = useRef<HTMLDivElement>(null);
  const viewSubmenuRef = useRef<HTMLDivElement>(null);
  // Shared by the chip-row more button and the sticky-bar collapsed button.
  // Using a set-only callback ref prevents React's unmount cleanup from nulling
  // it out when the exiting button's AnimatePresence animation finishes (200ms
  // after the entering button has already claimed the ref).
  const viewsMoreBtnRef = useRef<HTMLButtonElement>(null);
  const setViewsMoreBtnRef = useCallback((el: HTMLButtonElement | null) => {
    if (el) viewsMoreBtnRef.current = el;
  }, []);

  // Fixed position for the views popover — computed from the trigger button's viewport rect
  // at open time. position:fixed decouples it from the chip row so chip exit animations
  // can't drag it off screen.
  const [popoverFixedPos, setPopoverFixedPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // ── Pagination overlay ────────────────────────────────────────────────────

  const isAtTableBottom = () => {
    const el = tableScrollRef.current;
    return !!el && el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
  };

  // Show pagination when user scrolls to the bottom of the table
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (scrollbarDragging.current) return; // horizontal drag — don't disturb pagination
      if (isAtTableBottom()) {
        setPaginationShown(true);
      } else if (!paginationSticky) {
        setPaginationShown(false);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [paginationSticky]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show pagination when cursor enters the 16px zone just above the footer bar
  // (viewport bottom - 48px GlobalFooter - 16px trigger = viewport bottom - 64px)
  useEffect(() => {
    const TRIGGER_Y = 64; // px from viewport bottom
    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY > window.innerHeight - TRIGGER_Y) {
        // Only trigger if mouse is horizontally over the content area
        if (tableOuterRef.current && e.clientX >= tableOuterRef.current.getBoundingClientRect().left) {
          setPaginationShown(true);
        }
      }
    };
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track content area left edge for fixed pagination positioning.
  // useLayoutEffect ensures layout is computed before the first measurement,
  // avoiding the race condition where getBoundingClientRect returns 0.
  // We observe tableScrollRef (the flex-1 container) rather than tableOuterRef
  // so the ResizeObserver fires when flexbox resolves the container's width.
  useLayoutEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setPaginationLeft(rect.left);
      setTableClientWidth(rect.width);
      setWindowWidth(window.innerWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // ── Write frozen column left offsets as CSS custom properties on the <table> element.
  // Using CSS vars instead of inline React styles means frozen positions update via a
  // single DOM write per column rather than re-rendering every row, and direct DOM
  // writes during column-drag won't be overwritten by React (since these props aren't
  // in any React style object).
  useLayoutEffect(() => {
    const tableEl = tableElRef.current;
    if (!tableEl) return;
    let left = CHECKBOX_COL_WIDTH; // checkbox col width when bulk select is enabled
    for (const id of columnOrder) {
      if (!visibleColumns.has(id)) continue;
      if (!frozenColumns.has(id)) continue;
      // Fit sentinel (0): read the actual rendered th width from the DOM.
      const stored = columnWidths[id] ?? 0;
      const w = stored === 0
        ? (tableEl.querySelector<HTMLTableCellElement>(`th[data-col-id="${id}"]`)?.offsetWidth ?? 160)
        : stored;
      tableEl.style.setProperty(`--fl-${id}`, `${left}px`);
      // currency-type columns also need a --fl-{id}-code var for the code sub-cell
      if (colMeta[id]?.type === 'currency') {
        tableEl.style.setProperty(`--fl-${id}-code`, `${left + w - 56}px`);
      }
      left += w;
    }
  }, [columnOrder, visibleColumns, frozenColumns, columnWidths, CHECKBOX_COL_WIDTH]);

  // ── Fit columns: measure inner-content width from the DOM to avoid the
  // CSS table-auto "absorb all remaining space" behaviour.
  // Depends on isTableLoading so it only fires once real data cells are in the DOM —
  // skeleton rows use a single colSpan-100 placeholder with no per-column data-col-id.
  // Skips columns that already carry a stored pixel width (user-resized / from localStorage).
  useLayoutEffect(() => {
    if (isTableLoading) return; // skeleton still showing — no real cells to measure yet

    const tableEl = tableElRef.current;
    if (!tableEl) return;

    const fitColIds = activeTab.columns
      .filter(c => colDefaultWidth(c) === 0)
      .map(c => c.id);
    if (fitColIds.length === 0) return;

    const SIDE_PAD = 32; // 16px left + 16px right (px-[16px] class)

    setColumnWidths(prev => {
      const updates: Record<string, number> = {};

      for (const colId of fitColIds) {
        // Skip columns already carrying a stored pixel width.
        if ((prev[colId] ?? 0) !== 0) continue;

        const type = colMeta[colId]?.type ?? '';
        let maxW = 0;

        // Measure content width using Range.getBoundingClientRect() — this reports the
        // actual laid-out text width even when table-layout:fixed collapses the column
        // to 0px, bypassing the visual clipping imposed by overflow:hidden on the cell.
        const measureEl = (el: HTMLElement | null): number => {
          if (!el) return 0;
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getBoundingClientRect().width;
        };

        // Header: measure the label at its natural (unwrapped) width via canvas.
        // Using Range on the DOM span is unreliable here — the column starts at 0px
        // so the browser wraps long labels, and the Range only returns the longest
        // wrapped line rather than the full single-line width we actually need.
        const th = tableEl.querySelector<HTMLElement>(`th[data-col-id="${colId}"]`);
        if (th) {
          const label = colMeta[colId]?.label ?? colId;
          const labelW = measureText(label, '600 12px "SF Pro Text", system-ui, -apple-system, sans-serif');
          // Account for sort icon (10px icon + 4px margin) when this column is sorted.
          const sortExtra = sortCol === colId ? 14 : 0;
          const hdrNatural = Math.ceil(labelW) + SIDE_PAD + sortExtra;
          maxW = Math.max(maxW, type === 'currency' ? hdrNatural - 56 : hdrNatural);
        }

        // Data cells: measure inner element content width.
        // Range.selectNodeContents measures text ink only — it misses any padding on the
        // inner element itself (e.g. status badge has padding: 2px 6px). Read the actual
        // computed horizontal padding from the inner element and add it explicitly.
        // Currency value td uses pl-[16px] pr-[4px] = 20px total horizontal padding.
        const tds = Array.from(tableEl.querySelectorAll<HTMLElement>(`td[data-col-id="${colId}"]`));
        for (const td of tds) {
          const inner = td.firstElementChild as HTMLElement | null;
          const cellPad = type === 'currency' ? 20 : SIDE_PAD;
          const cs = inner ? getComputedStyle(inner) : null;
          const innerPad = cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 0;
          maxW = Math.max(maxW, measureEl(inner) + cellPad + (isNaN(innerPad) ? 0 : innerPad));
        }

        if (maxW > 0) {
          // Add 16px breathing room, then clamp to FIT_MAX_WIDTH.
          // Currency stored width = value-cell width + 56px fixed code sub-cell.
          const clampedW = Math.min(maxW + 16, FIT_MAX_WIDTH);
          updates[colId] = type === 'currency' ? clampedW + 56 : clampedW;
        }
      }

      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  // isTableLoading gates execution so we only measure real cells, never skeleton.
  // activeTab.tabId resets eligibility (prev[colId] back to 0) on tab switches.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab.tabId, isTableLoading]);

  // ── Track sticky bar height so the table header can stick just below it.
  // Writes directly to a CSS custom property instead of React state so the
  // ResizeObserver never triggers a re-render during the collapse animation.
  useEffect(() => {
    const el = stickyBarRef.current;
    if (!el) return;
    const setH = () => tableScrollRef.current?.style.setProperty('--sticky-bar-h', el.offsetHeight + 'px');
    const ro = new ResizeObserver(setH);
    ro.observe(el);
    setH();
    return () => ro.disconnect();
  }, []);


  // isScrolled detection via scroll listener.
  // We bail out when scrollTop hasn't changed so horizontal-only scroll events
  // are completely ignored — IntersectionObserver rootMargin gets clipped by
  // the browser at viewport width, making it unreliable for horizontal immunity.
  useEffect(() => {
    const root = tableScrollRef.current;
    const sentinel = stickyTriggerRef.current;
    if (!root || !sentinel) return;

    let prevScrollTop = root.scrollTop;

    const check = (scrollTop: number) => {
      const sentinelTop =
        sentinel.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        scrollTop;
      const newScrolled = scrollTop >= sentinelTop;
      if (newScrolled !== isScrolledRef.current) {
        isScrolledRef.current = newScrolled;
        setIsScrolled(newScrolled);
      }
    };

    const onScroll = () => {
      const scrollTop = root.scrollTop;
      if (scrollTop === prevScrollTop) return; // horizontal-only — skip
      prevScrollTop = scrollTop;
      check(scrollTop);
    };

    check(root.scrollTop); // cover any already-scrolled state on mount
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      isScrolledRef.current = false;
      setIsScrolled(false);
    };
  }, [autoCollapseOnStick]);

  const openViewsPopover = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Read position from the clicked element directly — avoids stale-ref issues
    // when the trigger button swaps between the chip row and the sticky bar.
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const mainEl = btn.closest('main');
    const mainLeft = mainEl ? mainEl.getBoundingClientRect().left : 0;
    const contentRight = window.innerWidth - 24;
    const POPOVER_W = 320;
    // Left-align the popover with the trigger button, clamped to viewport bounds
    const left = Math.max(mainLeft, Math.min(rect.left, contentRight - POPOVER_W));
    setPopoverFixedPos({ top: rect.bottom + 8, left });
    setIsViewsPopoverOpen(v => !v);
  }, []);

  const filterMenuRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const filterSubpageRef = useRef<HTMLDivElement>(null);
  const moreChipsButtonRef = useRef<HTMLButtonElement>(null);
  const moreChipsMenuRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fixedScrollbarRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const scrollbarDragging = useRef(false);
  const tableElRef = useRef<HTMLTableElement>(null);
  const [hasTableOverflow, setHasTableOverflow] = useState(false);
  // Detect whether the user's device can scroll horizontally (trackpad / Magic Mouse).
  // We sniff the first wheel event with deltaX != 0, then persist the result in
  // localStorage so trackpad users don't see the scrollbar on subsequent visits.
  const [hasHScrollCapability, setHasHScrollCapability] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return dashboardStorage.getItem('hasHScrollCapability') === '1';
  });
  useEffect(() => {
    if (hasHScrollCapability) return; // already detected — nothing to listen for
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) {
        setHasHScrollCapability(true);
        dashboardStorage.setItem('hasHScrollCapability', '1');
        window.removeEventListener('wheel', onWheel);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [hasHScrollCapability]);
  // Show the scrollbar when the table overflows AND the user lacks hscroll capability
  // (or the prototype toggle forces it on).
  const SCROLLBAR_H = 16; // matches .fixed-scrollbar height in globals.css
  const showScrollbar = hasTableOverflow && (!hasHScrollCapability || simulateNoHScroll);
  const tableSettingsRef = useRef<HTMLDivElement>(null);
  const tableSettingsBtnRef = useRef<HTMLButtonElement>(null);
  const [tableScrollState, setTableScrollState] = useState({ showLeft: false, showRight: false });
  const tableOuterRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [colDivider, setColDivider] = useState<{ colId: string; x: number } | null>(null);
  const lastColDivider = useRef<{ colId: string; x: number }>({ colId: '', x: 0 });
  // Header-mode: tracks which column the mouse is anywhere inside (for display only; colDivider still gates resize)
  const [headerHoverCol, setHeaderHoverCol] = useState<{ colId: string; x: number } | null>(null);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  // Cached column boundary positions — recomputed only when layout changes, not per-mousemove
  const colBoundariesRef = useRef<{ colId: string; x: number }[]>([]);

  const visibleSlotCount = filterChips.length <= 2 ? filterChips.length : 1;
  const visibleChips = filterChips.slice(0, visibleSlotCount);
  const hiddenChips = filterChips.slice(visibleSlotCount);

  // Whether all non-primary chips are unpinned → collapse the chip row.
  // Always derived from displayViewChips/displayPinnedIds so the value is stable
  // across all renders during a tab switch (suppressAnim window), preventing
  // spurious enter/exit animations.
  const allUnpinned = displayViewChips
    .filter(c => c.id !== (displayViewChips[0]?.id ?? ''))
    .every(c => !displayPinnedIds.has(c.id));

  const selectedChip = viewChips.find(c => c.selected);

  // Determine whether current filters/search differ from the selected chip's canonical config
  const selectedChipId = selectedChip?.id ?? '';
  const canonicalConfig = chipListConfigs[selectedChipId] ?? { filters: [], searchQuery: '', sortCol: null, sortDir: 'asc' as const };
  const configChanged = useMemo(() => {
    if (isSelectingChip) return false;
    if (searchValue !== canonicalConfig.searchQuery) return true;
    if (sortCol !== (canonicalConfig.sortCol ?? null)) return true;
    if (sortDir !== (canonicalConfig.sortDir ?? 'asc')) return true;
    if (filterChips.length !== canonicalConfig.filters.length) return true;
    return filterChips.some((fc, i) => {
      const cf = canonicalConfig.filters[i];
      return JSON.stringify(fc) !== JSON.stringify(cf);
    });
  }, [isSelectingChip, searchValue, sortCol, sortDir, filterChips, canonicalConfig]);


  // Build filter definitions: explicit tab.filters takes priority; otherwise derive from columns.
  const filterDefs: FilterDef[] = activeTab.filters !== undefined
    ? activeTab.filters
    : activeTab.columns
        .filter(c => c.filterOptions !== undefined)
        .map(c => ({
          id: c.id,
          label: c.label,
          type: 'multi-select' as const,
          options: c.filterOptions ?? [],
        }));

  // Labels shown in the main filter menu list
  const filterOptions = filterDefs.map(f => f.label);

  // The definition for whichever filter is currently open in the subpage
  const subpageFilterDef: FilterDef | null = filterDefs.find(f => f.label === selectedFilter) ?? null;

  // Options for multi-select / single-select subpages
  const subpageOptions =
    subpageFilterDef && (subpageFilterDef.type === 'multi-select' || subpageFilterDef.type === 'single-select')
      ? subpageFilterDef.options
      : [];

  const handleFilterClick = (filterLabel: string) => {
    const def = filterDefs.find(f => f.label === filterLabel) ?? null;
    const existing = filterChips.find(c => c.filterName === filterLabel);
    setSelectedFilter(filterLabel);
    setCurrentPage('subpage');
    // Pre-fill from existing chip so re-opening shows the last applied value
    if (def?.type === 'multi-select') {
      setSelectedOptions(existing?.selectedValues ?? []);
    } else if (def?.type === 'single-select') {
      setFilterSingleVal(existing?.selectedValues?.[0] ?? def.options[0] ?? '');
    } else if (def?.type === 'date') {
      setFilterDateOp(existing?.dateOp ?? 'is in the last');
      setFilterDateVal(existing?.dateVal ?? '');
      setFilterDateUnit(existing?.dateUnit ?? 'days');
      setFilterDateTz((existing?.dateTz as 'GMT-8' | 'UTC') ?? 'GMT-8');
    } else if (def?.type === 'value') {
      setFilterValueOp(existing?.valueOp ?? 'is equal to');
      setFilterValueInput(existing?.valueInput ?? '');
    } else {
      setSelectedOptions([]);
    }
  };

  const handleBack = () => {
    if (chipFilterAnchor) {
      setIsFilterMenuOpen(false);
      setCurrentPage('main');
      setSelectedFilter(null);
      setChipFilterAnchor(null);
    } else {
      setCurrentPage('main');
      setSelectedFilter(null);
    }
  };

  const handleApply = () => {
    const def = subpageFilterDef;
    const dismiss = () => { setIsFilterMenuOpen(false); setCurrentPage('main'); setChipFilterAnchor(null); };

    if (!def || !selectedFilter) { dismiss(); return; }

    let newChip: FilterChip;

    if (def.type === 'multi-select') {
      if (selectedOptions.length === 0) { dismiss(); return; }
      newChip = { id: def.id, filterName: def.label, filterType: 'multi-select', selectedValues: selectedOptions };
    } else if (def.type === 'single-select') {
      if (!filterSingleVal) { dismiss(); return; }
      newChip = { id: def.id, filterName: def.label, filterType: 'single-select', selectedValues: [filterSingleVal] };
    } else if (def.type === 'date') {
      if (!filterDateVal.trim()) { dismiss(); return; }
      newChip = {
        id: def.id, filterName: def.label, filterType: 'date', selectedValues: [],
        dateOp: filterDateOp, dateVal: filterDateVal, dateUnit: filterDateUnit, dateTz: filterDateTz,
      };
    } else { // value
      if (!filterValueInput.trim()) { dismiss(); return; }
      newChip = {
        id: def.id, filterName: def.label, filterType: 'value', selectedValues: [],
        valueOp: filterValueOp, valueInput: filterValueInput,
      };
    }

    const existingIdx = filterChips.findIndex(c => c.filterName === selectedFilter);
    if (existingIdx >= 0) {
      const updated = [...filterChips];
      updated[existingIdx] = newChip;
      setFilterChips(updated);
    } else {
      setFilterChips([...filterChips, newChip]);
    }
    dismiss();
  };

  const removeFilterChip = (chipId: string) => {
    setFilterChips(prev => prev.filter(c => c.id !== chipId));
  };

  const toggleOption = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  // Sync container height to the active panel, cap at 320px
  useLayoutEffect(() => {
    const container = filterContainerRef.current;
    const subpage = filterSubpageRef.current;
    if (!container || !subpage) return;

    if (currentPage === 'subpage') {
      // Measure natural (unconstrained) height of subpage content
      subpage.style.height = 'auto';
      void subpage.offsetHeight; // force reflow before reading
      const naturalH = Math.min(subpage.scrollHeight, 320);
      // Set an EXACT height on the container so the subpage never inherits
      // the (potentially taller) main-page flow height
      container.style.height = naturalH + 'px';
      container.style.minHeight = '';
      // Subpage fills the container exactly
      subpage.style.height = '100%';
    } else {
      subpage.style.height = '';
      container.style.height = '';
      container.style.minHeight = '';
    }
  }, [currentPage]);

  // Handle scroll to show/hide gradients
  useEffect(() => {
    // When returning to the main page the multi-select subpage releases
    // scrollContainerRef (sets it to null), so React never re-fires the main
    // page's ref assignment.  Explicitly clear stale gradient state here so
    // the scrim never shows incorrectly on the main filter list.
    if (currentPage === 'main') {
      setShowScrollGradient(false);
      setShowTopScrollGradient(false);
    }

    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
        setShowScrollGradient(!isAtBottom);
        setShowTopScrollGradient(scrollTop > 0);
      }
    };

    const scrollEl = scrollContainerRef.current;
    if (scrollEl) {
      handleScroll(); // Check initial state
      scrollEl.addEventListener('scroll', handleScroll);
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, [isFilterMenuOpen, currentPage]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterMenuOpen(false);
        setCurrentPage('main');
        setChipFilterAnchor(null);
      }
      
      if (
        moreChipsMenuRef.current &&
        !moreChipsMenuRef.current.contains(event.target as Node) &&
        moreChipsButtonRef.current &&
        !moreChipsButtonRef.current.contains(event.target as Node)
      ) {
        setIsMoreChipsOpen(false);
      }

      if (
        tableSettingsRef.current &&
        !tableSettingsRef.current.contains(event.target as Node) &&
        tableSettingsBtnRef.current &&
        !tableSettingsBtnRef.current.contains(event.target as Node)
      ) {
        setIsTableSettingsOpen(false);
      }

      if (
        viewsPopoverRef.current &&
        !viewsPopoverRef.current.contains(event.target as Node) &&
        (!viewsMoreBtnRef.current || !viewsMoreBtnRef.current.contains(event.target as Node)) &&
        (!viewSubmenuRef.current || !viewSubmenuRef.current.contains(event.target as Node))
      ) {
        setIsViewsPopoverOpen(false);
        setListActionsChipId(null);
        setSubmenuAnchor(null);
        setRenameChipId(null);
      }

      if (
        savePhase === 'naming' &&
        saveContainerRef.current &&
        !saveContainerRef.current.contains(event.target as Node)
      ) {
        closeNaming();
      }
    };

    if (isFilterMenuOpen || isMoreChipsOpen || isTableSettingsOpen || isViewsPopoverOpen || savePhase === 'naming') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterMenuOpen, isMoreChipsOpen, isTableSettingsOpen, isViewsPopoverOpen, savePhase]);

  // Close chip-anchored filter popover on window scroll or resize
  useEffect(() => {
    if (!chipFilterAnchor) return;
    const close = () => { setIsFilterMenuOpen(false); setCurrentPage('main'); setChipFilterAnchor(null); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [chipFilterAnchor]);

  // Clear the tab-switch animation suppression after 2 rAFs — enough time for
  // Framer Motion's async exit/enter animation frame to pick up duration:0.
  useEffect(() => {
    if (!suppressTabAnim) return;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => { setSuppressTabAnim(false); });
    });
    return () => cancelAnimationFrame(id);
  }, [suppressTabAnim]);

  // Freeze the column order for the settings popover when it opens.
  // Columns re-sort only after close so toggling doesn't cause visual thrash.
  useEffect(() => {
    if (isTableSettingsOpen) setPopoverColumns(sortedColumns);
  }, [isTableSettingsOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isViewsPopoverOpen) {
      setListActionsChipId(null);
      setSubmenuAnchor(null);
      setHoveredListRowId(null);
      setHoveredMoreBtnId(null);
    }
  }, [isViewsPopoverOpen]);

  useEffect(() => {
    if (!columnMenu) return;
    const handleDown = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setColumnMenu(null);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [columnMenu]);

  useEffect(() => {
    if (!chipContextMenu) return;
    const handleDown = (e: MouseEvent) => {
      if (chipContextMenuRef.current && !chipContextMenuRef.current.contains(e.target as Node)) {
        setChipContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [chipContextMenu]);

  useEffect(() => {
    if (!pageSizeMenuOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (
        pageSizeMenuRef.current && !pageSizeMenuRef.current.contains(e.target as Node) &&
        pageSizeTriggerRef.current && !pageSizeTriggerRef.current.contains(e.target as Node)
      ) {
        setPageSizeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [pageSizeMenuOpen]);

  // Shimmer loading trigger — fires on mount and whenever data-driving state changes.
  // Trigger the shimmer overlay. Clears after one render tick so the CSS
  // transition handles the fade-out — no artificial delay added.
  const triggerShimmer = () => {
    // Don't interfere with the initial load skeleton
    if (initialLoadActiveRef.current) return;
    if (shimmerTimerRef.current) clearTimeout(shimmerTimerRef.current);
    setIsTableLoading(true);
    // Don't set a timeout if foreverLoading is active — stay loading forever
    if (!foreverLoading) {
      shimmerTimerRef.current = setTimeout(() => setIsTableLoading(false), 400);
    }
  };

  // Smooth 200ms scroll-to-top for the main scroll container
  const scrollToTableTop = () => {
    const el = tableScrollRef.current;
    if (!el || el.scrollTop === 0) return;
    // Trigger expand animation immediately, in sync with the scroll
    setIsScrolled(false);
    const start = el.scrollTop;
    const startTime = performance.now();
    const duration = 300;
    const raf = (time: number) => {
      const t = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.scrollTop = start * (1 - eased);
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  };

  // When foreverLoading is toggled on, immediately show shimmer and keep it.
  // When toggled off, hide shimmer.
  useEffect(() => {
    if (foreverLoading) {
      if (shimmerTimerRef.current) clearTimeout(shimmerTimerRef.current);
      setIsTableLoading(true);
    } else {
      if (shimmerTimerRef.current) clearTimeout(shimmerTimerRef.current);
      setIsTableLoading(false);
    }
  }, [foreverLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // initial load — skeleton rows shown to simulate real-world load time
    setIsTableLoading(true);
    const t = setTimeout(() => {
      initialLoadActiveRef.current = false;
      setIsTableLoading(false);
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tabMountedRef = useRef(false);
  useEffect(() => { // tab change — skeleton rows shown to simulate real-world load time
    if (!tabMountedRef.current) { tabMountedRef.current = true; return; }
    initialLoadActiveRef.current = true;
    setIsTableLoading(true);
    setIsInitialLoad(true);
    if (shimmerTimerRef.current) clearTimeout(shimmerTimerRef.current);
    const t = setTimeout(() => {
      initialLoadActiveRef.current = false;
      setIsTableLoading(false);
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [activeTabIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollToTableTop(); }, [debouncedSearch]);  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { scrollToTableTop(); }, [filterChips]);      // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { scrollToTableTop(); }, [paginationPage]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { /* pageSize change — no scroll reset */ }, [pageSize]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { scrollToTableTop(); }, [sortCol, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setTableScrollState({
        showLeft: scrollLeft > 0,
        showRight: scrollLeft < scrollWidth - clientWidth - 1,
      });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  // Overflow detection — runs independently of the scrollbar element being mounted.
  // This must be separate from the bar-sync effect so hasTableOverflow is set even
  // before the scrollbar div exists in the DOM.
  useEffect(() => {
    const table = tableScrollRef.current;
    if (!table) return;
    const check = () => setHasTableOverflow(table.scrollWidth > table.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(table);
    const tableEl = table.querySelector('table');
    if (tableEl) ro.observe(tableEl);
    return () => ro.disconnect();
  }, []);

  // Custom scrollbar — renders a track+thumb that mirror the table's horizontal scroll.
  // Bar left/width come from React state (paginationLeft/tableClientWidth) so dimensions
  // are correct on the very first paint. This effect only handles thumb positioning and
  // scroll/drag/click interaction. Re-runs when showScrollbar or tableClientWidth changes.
  useEffect(() => {
    const table = tableScrollRef.current;
    const bar = fixedScrollbarRef.current;
    const thumb = scrollbarThumbRef.current;
    if (!table || !bar || !thumb) return;

    const updateThumb = () => {
      const maxScroll = table.scrollWidth - table.clientWidth;
      if (maxScroll <= 0) { thumb.style.opacity = '0'; return; }
      thumb.style.opacity = '1';
      const trackWidth = bar.clientWidth;
      const thumbWidth = Math.max(40, trackWidth * (table.clientWidth / table.scrollWidth));
      const thumbLeft = (table.scrollLeft / maxScroll) * (trackWidth - thumbWidth);
      thumb.style.width = `${thumbWidth}px`;
      thumb.style.transform = `translateX(${thumbLeft}px) translateY(-50%)`;
    };

    updateThumb();
    table.addEventListener('scroll', updateThumb, { passive: true });

    // Drag the thumb to scroll
    const onThumbMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      scrollbarDragging.current = true;
      const startX = e.clientX;
      const startScrollLeft = table.scrollLeft;
      const maxScroll = table.scrollWidth - table.clientWidth;
      const trackWidth = bar.clientWidth;
      const thumbWidth = Math.max(40, trackWidth * (table.clientWidth / table.scrollWidth));
      const scrollPerPx = maxScroll / (trackWidth - thumbWidth);
      thumb.style.transition = 'none';
      const onMouseMove = (ev: MouseEvent) => {
        table.scrollLeft = Math.max(0, Math.min(maxScroll, startScrollLeft + (ev.clientX - startX) * scrollPerPx));
      };
      const onMouseUp = () => {
        scrollbarDragging.current = false;
        thumb.style.transition = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    thumb.addEventListener('mousedown', onThumbMouseDown);

    // Click on track (not thumb) to jump scroll
    const onTrackClick = (e: MouseEvent) => {
      if (e.target === thumb) return;
      const trackWidth = bar.clientWidth;
      const maxScroll = table.scrollWidth - table.clientWidth;
      const rect = bar.getBoundingClientRect();
      table.scrollLeft = ((e.clientX - rect.left) / trackWidth) * maxScroll;
    };
    bar.addEventListener('click', onTrackClick);

    // Re-compute thumb whenever column widths or viewport changes
    const ro = new ResizeObserver(updateThumb);
    ro.observe(table);
    const tableEl = table.querySelector('table');
    if (tableEl) ro.observe(tableEl);

    return () => {
      table.removeEventListener('scroll', updateThumb);
      thumb.removeEventListener('mousedown', onThumbMouseDown);
      bar.removeEventListener('click', onTrackClick);
      ro.disconnect();
    };
  }, [showScrollbar]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableMouseMove = (e: React.MouseEvent) => {
    if (resizingCol) return; // divider is driven by startResize during an active drag
    if (dragColId) return;   // skip divider detection while reordering columns
    if (!tableOuterRef.current || !theadRef.current) return;
    const outerRect = tableOuterRef.current.getBoundingClientRect();
    const mouseX = e.clientX - outerRect.left;

    // Only show the resize cursor / divider when hovering over the header row
    const theadRect = theadRef.current.getBoundingClientRect();
    const inHeader = e.clientY >= theadRect.top && e.clientY <= theadRect.bottom;

    if (inHeader) {
      // Use cached boundaries — no getBoundingClientRect per frame
      const near = colBoundariesRef.current.find(b => Math.abs(mouseX - b.x) <= 16) ?? null;
      if (near) {
        lastColDivider.current = near;
        document.body.classList.add('col-resizing');
        if (near.colId !== colDivider?.colId) setColDivider(near);
      } else {
        document.body.classList.remove('col-resizing');
        if (colDivider !== null) setColDivider(null);
      }
    } else {
      document.body.classList.remove('col-resizing');
      if (colDivider !== null) setColDivider(null);
    }

    // Header mode: track the column the mouse is anywhere inside for display purposes
    if (columnResizeStyle === 'header') {
      if (inHeader) {
        // Find the first boundary whose right edge is to the right of the mouse —
        // that means the mouse is inside that column.
        const hovered = colBoundariesRef.current.find(b => mouseX <= b.x) ?? null;
        if (hovered) {
          if (hovered.colId !== headerHoverCol?.colId) setHeaderHoverCol(hovered);
        } else {
          if (headerHoverCol !== null) setHeaderHoverCol(null);
        }
      } else {
        if (headerHoverCol !== null) setHeaderHoverCol(null);
      }
    }
  };

  const handleTableMouseLeave = () => {
    if (!resizingCol) {
      setColDivider(null);
      setHeaderHoverCol(null);
      document.body.classList.remove('col-resizing');
    }
  };


  const pendingForPage = pendingRows.filter(p => p.pageId === config.pageId).map(p => p.row);
  const baseRows = Object.keys(rowStatusOverrides).length > 0
    ? activeTab.data.map((row, i) => rowStatusOverrides[i] !== undefined ? { ...row, status: rowStatusOverrides[i] } : row)
    : activeTab.data;
  const tableRows = pendingForPage.length > 0 ? [...pendingForPage, ...baseRows] : baseRows;

  const refField = activeTab.refundableField ?? 'status';
  const refValue = activeTab.refundableValue ?? 'Active';
  const refundableSelected = Array.from(selectedRows).filter(i => tableRows[i]?.[refField] === refValue).length;

  const deleteChip = (id: string) => {
    const chip = viewChips.find(c => c.id === id);
    if (!chip) return;
    // If deleting the currently selected chip, fall back to the first available chip
    if (chip.selected) {
      const fallback = viewChips.find(c => c.id !== id);
      if (fallback) selectChip(fallback.id);
    }
    setViewChips(prev => prev.filter(c => c.id !== id));
    setPinnedViewIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    delete chipListConfigsRef.current[id];
    delete chipSettingsRef.current[id];
    lsSet(LS.configs, chipListConfigsRef.current);
    setListActionsChipId(null);
    setIsViewsPopoverOpen(false);
  };

  const selectChip = (id: string) => {
    triggerShimmer();
    scrollToTableTop();
    // Save current chip's table settings
    const currentId = viewChips.find(c => c.selected)?.id;
    if (currentId) {
      chipSettingsRef.current[currentId] = {
        columnWidths,
        visibleColumns: Array.from(visibleColumns),
        columnOrder,
      };
    }

    // Urgent: update chip selection and reset save state — allows the box-shadow animation to start
    // immediately. isSelectingChip suppresses configChanged during the deferred transition window.
    setViewChips(prev => prev.map(chip => ({ ...chip, selected: chip.id === id })));
    setSavePhase('idle');
    setSaveAsName('');
    setIsSelectingChip(true);

    // Deferred: loading column config / filters / search triggers heavy table re-renders
    // (shimmer + 238 rows re-rendering). Wrapping in startTransition lets React yield to the
    // browser between render slices, so the 150ms animation frames can run unblocked.
    startTransition(() => {
      setIsSelectingChip(false);
      const saved = chipSettingsRef.current[id];
      if (saved) {
        suppressSaveIndicatorRef.current = true;
        setColumnWidths(saved.columnWidths);
        setVisibleColumns(new Set(saved.visibleColumns));
        if (saved.columnOrder) {
          const savedOrder = saved.columnOrder;
          const allColIds = activeTab.columns.map(c => c.id);
          const merged = [...savedOrder, ...allColIds.filter(id => !savedOrder.includes(id))];
          columnOrderRef.current = merged;
          setColumnOrder(merged);
        }
      } else {
        // No user-saved state — check if the chip config defines a default column set
        const chipDef = (activeTab.defaultViewChips ?? []).find(d => d.id === id);
        if (chipDef?.columns) {
          const allColIds = activeTab.columns.map(c => c.id);
          const defCols = chipDef.columns.filter((c: string) => allColIds.includes(c));
          suppressSaveIndicatorRef.current = true;
          setVisibleColumns(new Set(defCols));
          const merged = [...defCols, ...allColIds.filter(c => !defCols.includes(c))];
          columnOrderRef.current = merged;
          setColumnOrder(merged);
        }
      }
      const cfg = chipListConfigs[id];
      setFilterChips(cfg?.filters ?? []);
      setSearchValue(cfg?.searchQuery ?? '');
      setDebouncedSearch(cfg?.searchQuery ?? '');
      setSortCol(cfg?.sortCol ?? null);
      setSortDir(cfg?.sortDir ?? 'asc');
    });
  };

  // React to Console actions — brief shimmer before applying the action
  useEffect(() => {
    if (!consoleAction) return;
    if (consoleAction.type === 'select-chip') {
      const chip = viewChips.find(c => c.label === consoleAction.chipLabel);
      if (chip) {
        setIsTableLoading(true);
        const t = setTimeout(() => { selectChip(chip.id); setConsoleAction(null); }, 600);
        return () => clearTimeout(t);
      }
    } else if (consoleAction.type === 'select-rows') {
      setIsTableLoading(true);
      const t = setTimeout(() => {
        setSelectedRows(new Set(consoleAction.indices));
        setConsoleControlledSelection(true);
        setConsoleAction(null);
        setTimeout(() => setIsTableLoading(false), 400);
      }, 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consoleAction]);

  // `?view=<chip id or label>` (e.g. /transactions/payments?view=failed) opens on that view chip.
  // The param is stripped afterwards so later chip changes aren't overridden on refresh.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view')?.toLowerCase();
    if (!view) return;
    const chip = viewChips.find(c => c.id === view || c.label.toLowerCase() === view);
    if (chip) selectChip(chip.id);
    params.delete('view');
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitSave = (name: string) => {
    const newId = `custom-${Date.now()}`;
    // Mark before state update so the motion.div sees it on first render
    justCommittedChipIdRef.current = newId;
    chipListConfigs[newId] = { filters: [...filterChips], searchQuery: searchValue, sortCol, sortDir };
    lsSet(LS.configs, chipListConfigs); // persist custom chip filter config
    const newChip: ViewChip = { id: newId, label: name, selected: true };
    setViewChips(prev => [...prev.map(c => ({ ...c, selected: false })), newChip]);
    // Only pin the new view if we're currently showing chips (not in collapsed/allUnpinned mode)
    const currentAllUnpinned = viewChips.filter(c => c.id !== primaryChipId).every(c => !pinnedViewIds.has(c.id));
    if (!currentAllUnpinned) {
      setPinnedViewIds(prev => { const next = new Set(prev); next.add(newId); return next; });
    }
    setSavePhase('idle');
    setSaveAsName('');
    // Clear after mount so subsequent re-renders aren't affected
    requestAnimationFrame(() => { justCommittedChipIdRef.current = null; });
  };

  const SAVE_EASING = 'cubic-bezier(0.2, 0, 0.1, 1)';
  // paddingLeft of the text button in each phase — used to align FLIP by text position, not box edge
  const SAVE_BTN_IDLE_PL = 30;
  const SAVE_BTN_NAMING_PL = 6;

  const openNaming = () => {
    const el = saveContainerRef.current;
    const textBtn = saveTextRef.current;
    if (!el || !textBtn) return;

    const startW = el.offsetWidth;
    const startRect = textBtn.getBoundingClientRect();

    // Immediately apply naming layout so we can measure button's new position
    flushSync(() => setSavePhase('naming'));

    // Lock container to start width, force reflow, then measure button's end position
    el.style.transition = 'none';
    el.style.width = `${startW}px`;
    el.getBoundingClientRect();
    const endRect = textBtn.getBoundingClientRect();
    // Compensate for the padding difference so the text (not the box edge) starts in place
    const deltaX = startRect.left - endRect.left + (SAVE_BTN_IDLE_PL - SAVE_BTN_NAMING_PL);

    // Jump button back so its text aligns with the idle "Save as" text position
    textBtn.style.transition = 'none';
    textBtn.style.transform = `translateX(${deltaX}px)`;
    el.getBoundingClientRect();

    // Animate both container and button to their naming positions
    requestAnimationFrame(() => {
      el.style.transition = `width 220ms ${SAVE_EASING}`;
      el.style.width = '240px';
      textBtn.style.transition = `transform 220ms ${SAVE_EASING}`;
      textBtn.style.transform = 'translateX(0px)';
    });
    setTimeout(() => {
      textBtn.style.transition = '';
      textBtn.style.transform = '';
    }, 225);
  };

  const closeNaming = () => {
    const el = saveContainerRef.current;
    const textBtn = saveTextRef.current;
    // In the collapsed state the expanded save container isn't mounted — just reset state.
    if (!el || !textBtn) { setSavePhase('idle'); setSaveAsName(''); return; }

    const startW = el.offsetWidth;
    const startRect = textBtn.getBoundingClientRect();

    // Immediately apply idle layout
    flushSync(() => { setSavePhase('idle'); setSaveAsName(''); });

    // Lock to naming width so we can measure button position in idle layout at that width
    el.style.transition = 'none';
    el.style.width = `${startW}px`;
    el.getBoundingClientRect();
    const endRectAtStart = textBtn.getBoundingClientRect();

    // Measure natural idle width
    el.style.width = 'max-content';
    el.getBoundingClientRect();
    const endW = el.offsetWidth;

    // Compensate for padding difference so the text aligns with where "Save" was
    const deltaX = startRect.left - endRectAtStart.left - (SAVE_BTN_IDLE_PL - SAVE_BTN_NAMING_PL);
    textBtn.style.transition = 'none';
    textBtn.style.transform = `translateX(${deltaX}px)`;
    el.style.width = `${startW}px`;
    el.getBoundingClientRect();

    // Animate both to idle positions
    requestAnimationFrame(() => {
      el.style.transition = `width 220ms ${SAVE_EASING}`;
      el.style.width = `${endW}px`;
      textBtn.style.transition = `transform 220ms ${SAVE_EASING}`;
      textBtn.style.transform = 'translateX(0px)';
    });
    setTimeout(() => {
      el.style.width = '';
      el.style.transition = '';
      textBtn.style.transition = '';
      textBtn.style.transform = '';
    }, 225);
  };

  const handleSave = () => {
    const name = saveAsName.trim();
    if (!name) return;
    const el = saveContainerRef.current;
    if (!el) return;

    // Switch to committing phase — renders chip label content, removes naming content from flow
    flushSync(() => setSavePhase('committing'));

    // Measure the chip's natural width now that the label is in the DOM
    el.style.transition = 'none';
    el.style.width = 'max-content';
    el.getBoundingClientRect();
    const targetW = el.offsetWidth;

    // Reset to naming width, then animate to chip width
    el.style.width = '240px';
    el.getBoundingClientRect();

    requestAnimationFrame(() => {
      el.style.transition = `width 200ms ${SAVE_EASING}, box-shadow 200ms cubic-bezier(0.2, 0, 0.1, 1)`;
      el.style.width = `${targetW}px`;
      // Morph border from purple pill to chip-selected shadow
      el.style.boxShadow = '0 0 0 2px #1A2C44, 0px 2px 3px 0px rgba(33,37,44,0.16)';
    });

    setTimeout(() => { commitSave(name); }, 210);
  };

  const handleChipMouseDown = (e: React.MouseEvent, chipId: string) => {
    if (e.button !== 0) return;
    if (chipId === primaryChipId) return; // primary "All" chip is always first — not draggable
    e.preventDefault();

    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Capture pinned/selected state at mousedown (won't change during drag)
    const capturedPinnedIds = new Set(pinnedViewIds);

    chipGhostPosRef.current = { x: rect.left, y: rect.top };
    chipGhostSizeRef.current = { w: rect.width, h: rect.height };
    chipDragHappenedRef.current = false;
    chipDragIdRef.current = chipId;

    // Initial displayed order
    const getDisplayed = () => [...viewChipsRef.current]
      .filter(c => capturedPinnedIds.has(c.id) || c.selected)
      .sort((a, b) => (capturedPinnedIds.has(a.id) ? 0 : 1) - (capturedPinnedIds.has(b.id) ? 0 : 1));

    chipCurrentOrderRef.current = getDisplayed().map(c => c.id);

    // Capture each chip's rendered width at mousedown — same approach as capturedDomWidths
    // for columns. Re-used on every frame instead of querying the DOM each time.
    const capturedChipWidths: Record<string, number> = {};
    if (chipRowRef.current) {
      chipRowRef.current.querySelectorAll<HTMLElement>('[data-chip-id]').forEach(el => {
        capturedChipWidths[el.dataset.chipId!] = el.getBoundingClientRect().width;
      });
    }
    const CHIP_GAP = 8; // matches gap-[8px] on the flex row

    // Hysteresis state — persists across all mousemove events for this drag
    let chipFinalIdx = -1;          // insertion slot in withoutDragged space
    let prevChipCenterX: number | null = null;

    const onMouseMove = (me: MouseEvent) => {
      if (!chipDragHappenedRef.current) {
        if (Math.abs(me.clientX - startX) < 5) return;
        chipDragHappenedRef.current = true;
        setDragChipId(chipId);
        document.body.style.cursor = 'grabbing';
      }

      // Move ghost
      const ghostX = me.clientX - offsetX;
      const ghostY = me.clientY - offsetY;
      chipGhostPosRef.current = { x: ghostX, y: ghostY };
      if (chipGhostRef.current) {
        chipGhostRef.current.style.left = `${ghostX}px`;
        chipGhostRef.current.style.top  = `${ghostY}px`;
      }

      if (!chipRowRef.current) return;

      const currentOrder = chipCurrentOrderRef.current;
      const ghostCenterX = ghostX + chipGhostSizeRef.current.w / 2;

      // Build left-edge positions of non-dragged chips based on current logical order
      // and captured widths. The dragged slot still occupies space in the flex row,
      // so its width is included when it precedes other chips — same as leftEdgesNd
      // for columns.
      const rowLeft = chipRowRef.current.getBoundingClientRect().left;
      const ndLeftEdges: number[] = [];
      const ndWidths: number[] = [];
      let cumX = rowLeft;
      for (const id of currentOrder) {
        const w = capturedChipWidths[id] ?? chipGhostSizeRef.current.w;
        if (id === chipId) { cumX += w + CHIP_GAP; continue; }
        ndLeftEdges.push(cumX);
        ndWidths.push(w);
        cumX += w + CHIP_GAP;
      }
      const Nnd = ndLeftEdges.length;

      // Initialise on first move: find the correct slot by scanning from the left
      if (chipFinalIdx === -1) {
        chipFinalIdx = 0;
        for (let i = 0; i < Nnd; i++) {
          if (ghostCenterX > ndLeftEdges[i] + 0.1 * ndWidths[i]) chipFinalIdx = i + 1;
          else break;
        }
        prevChipCenterX = ghostCenterX;
      }

      // RIGHT: advance when ghost center crosses 10%-from-left of the next chip
      while (chipFinalIdx < Nnd) {
        const thr = ndLeftEdges[chipFinalIdx] + 0.1 * ndWidths[chipFinalIdx];
        if ((prevChipCenterX ?? ghostCenterX) <= thr && ghostCenterX > thr) chipFinalIdx++;
        else break;
      }
      // LEFT: retreat when ghost center crosses 90%-from-left (= 10%-from-right) of the previous chip
      while (chipFinalIdx > 0) {
        const thr = ndLeftEdges[chipFinalIdx - 1] + 0.9 * ndWidths[chipFinalIdx - 1];
        if ((prevChipCenterX ?? ghostCenterX) >= thr && ghostCenterX < thr) chipFinalIdx--;
        else break;
      }
      prevChipCenterX = ghostCenterX;

      // Build new order; bail if unchanged
      const withoutDragged = currentOrder.filter(id => id !== chipId);
      const newOrder = [...withoutDragged];
      // Never allow a chip to be placed before "All" (id '1') which is always first
      const allFirstIdx = withoutDragged[0] === primaryChipId ? 1 : 0;
      newOrder.splice(Math.max(allFirstIdx, Math.min(chipFinalIdx, withoutDragged.length)), 0, chipId);
      if (newOrder.join(',') === currentOrder.join(',')) return;

      // Snapshot current positions for FLIP (before React re-renders)
      chipRowRef.current.querySelectorAll<HTMLElement>('[data-chip-id]').forEach(nd => {
        chipFLIPSnapRef.current[nd.dataset.chipId!] = nd.getBoundingClientRect().left;
      });

      chipCurrentOrderRef.current = newOrder;

      // Apply new order to viewChips
      const chips = viewChipsRef.current;
      const newDisplayed = newOrder.map(id => chips.find(c => c.id === id)!).filter(Boolean);
      const displayedIds = new Set(newOrder);
      const rest = chips.filter(c => !displayedIds.has(c.id));
      setViewChips([...newDisplayed, ...rest]);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      chipDragHappenedRef.current = false;
      chipDragIdRef.current = null;
      chipCurrentOrderRef.current = [];
      chipFLIPSnapRef.current = {};
      setDragChipId(null);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleColMouseDown = (e: React.MouseEvent, colId: string) => {
    if (e.button !== 0) return;
    if (colDivider !== null) { startResize(e, colDivider.colId); return; } // Resize from header only
    e.preventDefault();
    dragColHappenedRef.current = false;
    const startX = e.clientX;

    // Capture state at mousedown — stable for the whole drag
    const capturedVisible = visibleColumns;
    // Read actual rendered widths from DOM — state values can diverge from the
    // real layout (table algorithm, min-width, etc.) and cause cumulative drift.
    const capturedDomWidths: Record<string, number> = {};
    theadRef.current?.querySelectorAll<HTMLElement>('th[data-col-id]').forEach(th => {
      capturedDomWidths[th.dataset.colId!] = th.getBoundingClientRect().width;
    });
    // Original visible column order — stable throughout drag
    const capturedVisibleOrder = columnOrderRef.current.filter(c => visibleColumns.has(c));
    // Non-dragged columns in original order — relative order never changes (only dragged col moves)
    const withoutDraggedCaptured = capturedVisibleOrder.filter(c => c !== colId);
    // Mutable: updated synchronously after each FLIP so thresholds always reflect
    // the current column layout rather than the original pre-drag layout.
    let currentVisibleOrder = capturedVisibleOrder;

    // Hysteresis state — persists across all mousemove events for this drag
    // dragFinalIdx is in withoutDragged space: 0 = before all, N-1 = after all
    let dragFinalIdx = -1;
    let prevDragCenterX: number | null = null;

    const thRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragColClickOffsetRef.current = {
      x: e.clientX - thRect.left,
      y: e.clientY - thRect.top,
    };

    document.body.style.userSelect = 'none';

    const onMouseMove = (me: MouseEvent) => {
      if (!dragColHappenedRef.current) {
        if (Math.abs(me.clientX - startX) < 5) return;
        dragColHappenedRef.current = true;
        ghostPosRef.current = { x: me.clientX, y: me.clientY };
        // Capture which row is at the top of the visible table body so the ghost mirrors scroll state.
        // stickyBarHeight + theadHeight are CSS top-values relative to tableScrollRef, so add
        // tableScrollRef's viewport top to convert to the same coordinate space as getBoundingClientRect.
        {
          const tbody = theadRef.current?.closest('table')?.querySelector('tbody');
          const tbodyTop = tbody?.getBoundingClientRect().top ?? 0;
          const scrollContainerTop = tableScrollRef.current?.getBoundingClientRect().top ?? 0;
          const stickyBarH = parseFloat(tableScrollRef.current?.style.getPropertyValue('--sticky-bar-h') || '0');
          const stickyBottom = scrollContainerTop + stickyBarH + (theadRef.current?.offsetHeight ?? 32);
          const scrolledPx = Math.max(0, stickyBottom - tbodyTop);
          dragGhostRowOffsetRef.current = Math.floor(scrolledPx / 44);
        }
        setDragColId(colId);
        document.body.style.cursor = 'grabbing';
        // Hide any active resize divider and clear the col-resize cursor
        setColDivider(null);
        document.body.classList.remove('col-resizing');
      }

      // Move ghost directly in DOM — bypasses React, keeps FLIP animations undisturbed
      if (ghostElRef.current) {
        const { x: ox, y: oy } = dragColClickOffsetRef.current;
        ghostElRef.current.style.left = `${me.clientX - ox - 8}px`;
        ghostElRef.current.style.top  = `${me.clientY - oy - 8}px`;
      } else {
        ghostPosRef.current = { x: me.clientX, y: me.clientY };
      }

      const tableEl = theadRef.current?.closest('table') as HTMLElement | null;
      if (!tableEl || !theadRef.current) return;

      // ── Left-edge positions of NON-DRAGGED columns ──────────────────────────
      // Use `currentVisibleOrder` (updated after each FLIP) so thresholds track
      // actual post-FLIP positions rather than stale original positions.
      // Use `capturedDomWidths` (measured from DOM at mousedown) for accurate
      // widths — state values can differ from the real layout.
      const colWidth = capturedDomWidths[colId] ?? 160;
      const dragCenterX = me.clientX - dragColClickOffsetRef.current.x + colWidth / 2;
      const tableLeft = tableEl.getBoundingClientRect().left + CHECKBOX_COL_WIDTH;
      const leftEdgesNd: number[] = [];
      const colWidthsNd: number[] = [];
      let ndCumX = tableLeft;
      for (const c of currentVisibleOrder) {
        if (c === colId) { ndCumX += capturedDomWidths[c] ?? 160; continue; }
        leftEdgesNd.push(ndCumX);
        colWidthsNd.push(capturedDomWidths[c] ?? 160);
        ndCumX += capturedDomWidths[c] ?? 160;
      }
      const Nnd = leftEdgesNd.length; // = currentVisibleOrder.length - 1

      // ── Initialise on first move: find the correct finalIdx slot ─────────────
      if (dragFinalIdx === -1) {
        dragFinalIdx = 0;
        for (let i = 0; i < Nnd; i++) {
          if (dragCenterX > leftEdgesNd[i] + 0.1 * colWidthsNd[i]) dragFinalIdx = i + 1;
          else break;
        }
        prevDragCenterX = dragCenterX;
      }

      // ── Hysteretic crossing-based snap: 10% from each side ──────────────────
      // RIGHT: fires when drag center crosses the 10%-from-left mark going rightward.
      while (dragFinalIdx < Nnd) {
        const threshold = leftEdgesNd[dragFinalIdx] + 0.1 * colWidthsNd[dragFinalIdx];
        if ((prevDragCenterX ?? dragCenterX) <= threshold && dragCenterX > threshold) dragFinalIdx++;
        else break;
      }
      // LEFT: fires when drag center crosses the 10%-from-right mark (= 90% from left) going leftward.
      while (dragFinalIdx > 0) {
        const threshold = leftEdgesNd[dragFinalIdx - 1] + 0.9 * colWidthsNd[dragFinalIdx - 1];
        if ((prevDragCenterX ?? dragCenterX) >= threshold && dragCenterX < threshold) dragFinalIdx--;
        else break;
      }
      prevDragCenterX = dragCenterX;

      // ── Build new visible order from withoutDragged + insertion at dragFinalIdx ─
      const finalIdx = dragFinalIdx;
      const newVisibleOrder = [...withoutDraggedCaptured];
      newVisibleOrder.splice(Math.min(finalIdx, withoutDraggedCaptured.length), 0, colId);

      // ── Skip if logical order hasn't changed ────────────────────────────────
      // Compare against currentVisibleOrder (logical state), NOT the DOM.
      // The DOM can be stale between React renders: using it caused a new FLIP to
      // fire on every mousemove frame until React re-rendered, constantly clearing
      // and restarting the animation so it appeared broken during fast drags.
      if (newVisibleOrder.join(',') === currentVisibleOrder.join(',')) return;

      // ── FLIP snapshot: clear transforms → measure natural positions ───────
      theadRef.current.querySelectorAll<HTMLElement>('th[data-col-id]').forEach(th => {
        th.style.transition = 'none'; th.style.transform = '';
      });
      tableEl.querySelectorAll<HTMLElement>('td[data-col-id]').forEach(td => {
        td.style.transition = 'none'; td.style.transform = '';
      });
      theadRef.current.getBoundingClientRect(); // force layout
      const snap: Record<string, number> = {};
      theadRef.current.querySelectorAll<HTMLElement>('th[data-col-id]').forEach(th => {
        const id = th.dataset.colId!;
        if (id !== colId) snap[id] = th.getBoundingClientRect().left;
      });
      flipSnapRef.current = snap;

      // Sync currentVisibleOrder immediately so the next mousemove frame computes
      // thresholds from the new (post-FLIP) column layout, not the pre-FLIP layout.
      currentVisibleOrder = newVisibleOrder;
      // Rebuild full order: use columnOrderRef for hidden-column positions (stable),
      // replace all visible slots with newVisibleOrder.
      let vi = 0;
      setColumnOrder(columnOrderRef.current.map(c => capturedVisible.has(c) ? newVisibleOrder[vi++] : c));
    };

    const onMouseUp = () => {
      setDragColId(null);
      ghostPosRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setTimeout(() => { dragColHappenedRef.current = false; }, 0);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 200ms debounce for search input
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchValue), 200);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchValue]);

  // Keep columnOrderRef in sync so mouse-drag closures always read the latest order
  useEffect(() => { columnOrderRef.current = columnOrder; }, [columnOrder]);

  // Drive bulk-action-bar enter / exit animations
  useEffect(() => {
    if (selectedRows.size > 0) {
      if (consoleControlledSelection) return; // bar suppressed — Console owns this selection
      if (barExitTimerRef.current) { clearTimeout(barExitTimerRef.current); barExitTimerRef.current = null; }
      setBarExiting(false);
      setBarVisible(true);
    } else {
      if (barVisible) {
        setBarExiting(true);
        barExitTimerRef.current = setTimeout(() => {
          setBarVisible(false);
          setBarExiting(false);
          barExitTimerRef.current = null;
        }, 250);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRows.size]);

  // Cache column boundary x-positions so mousemove doesn't call getBoundingClientRect every frame.
  // Recompute after any layout change: column order, visibility, or width.
  // Skip during active column drag — the final width commits on mouseup, which re-runs this.
  useEffect(() => {
    if (resizingCol) return;
    if (!tableOuterRef.current || !theadRef.current) return;
    const outerRect = tableOuterRef.current.getBoundingClientRect();
    const visibleColOrder = columnOrder.filter(c => visibleColumns.has(c));
    const ths = Array.from(theadRef.current.querySelectorAll('th'));
    const thOffset = bulkSelectCheckboxes ? 1 : 0;
    colBoundariesRef.current = visibleColOrder.slice(0, -1).map((colId, i) => {
      const th = ths[i + thOffset];
      return th ? { colId, x: th.getBoundingClientRect().right - outerRect.left } : null;
    }).filter((b): b is { colId: string; x: number } => b !== null);
  }, [columnOrder, visibleColumns, columnWidths, resizingCol, bulkSelectCheckboxes]);

  // FLIP animation: after columnOrder re-render, slide non-dragged columns to their new positions
  useLayoutEffect(() => {
    const snap = flipSnapRef.current;
    if (!snap || !theadRef.current) return;
    flipSnapRef.current = null;

    const ease = 'cubic-bezier(0.2, 0, 0.1, 1)';
    const table = theadRef.current.closest('table');

    // Compute per-column delta from <th> positions only (single source of truth for each column).
    // tds use the same delta as their column header — avoids wrong offsets for sub-span cells.
    const colDeltas: Record<string, number> = {};
    theadRef.current.querySelectorAll<HTMLElement>('th[data-col-id]').forEach(th => {
      const id = th.dataset.colId!;
      if (!(id in snap)) return;
      const delta = snap[id] - th.getBoundingClientRect().left;
      if (Math.abs(delta) < 1) return;
      colDeltas[id] = delta;
      th.style.transition = 'none';
      th.style.transform = `translateX(${delta}px)`;
    });

    // Apply the same per-column delta to every td in that column
    if (table) {
      table.querySelectorAll<HTMLElement>('td[data-col-id]').forEach(td => {
        const id = td.dataset.colId!;
        if (!(id in colDeltas)) return;
        td.style.transition = 'none';
        td.style.transform = `translateX(${colDeltas[id]}px)`;
      });
    }

    // Force reflow so the browser registers the starting transforms before the animation
    theadRef.current.getBoundingClientRect();

    // Animate each moved element to its natural position
    const transition = `transform 250ms ${ease}`;
    theadRef.current.querySelectorAll<HTMLElement>('th[data-col-id]').forEach(th => {
      if (!(th.dataset.colId! in colDeltas)) return;
      th.style.transition = transition;
      th.style.transform = '';
    });
    const animatedTds: HTMLElement[] = [];
    if (table) {
      table.querySelectorAll<HTMLElement>('td[data-col-id]').forEach(td => {
        if (!(td.dataset.colId! in colDeltas)) return;
        // The CSS hover rule uses `transition: background-color !important` which beats a regular
        // inline style, causing the transform to snap on hovered rows. Using setProperty with
        // 'important' ensures the transform transition wins for the duration of the animation.
        td.style.setProperty('transition', transition, 'important');
        td.style.transform = '';
        animatedTds.push(td);
      });
    }
    // Remove the !important transition after the animation so hover bg-color transitions work normally
    setTimeout(() => {
      animatedTds.forEach(td => td.style.removeProperty('transition'));
    }, 260);
  }, [columnOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // FLIP animation for chip reordering — runs after each viewChips state update during drag
  useLayoutEffect(() => {
    const snap = chipFLIPSnapRef.current;
    if (Object.keys(snap).length === 0 || !chipRowRef.current) return;
    chipFLIPSnapRef.current = {};

    const chipEls = Array.from(chipRowRef.current.querySelectorAll<HTMLElement>('[data-chip-id]'));

    // Apply inverse transforms (old position → new position) with no transition
    chipEls.forEach(el => {
      const id = el.dataset.chipId!;
      if (id === chipDragIdRef.current) return; // dragged slot stays invisible; skip
      const oldLeft = snap[id];
      if (oldLeft === undefined) return;
      const newLeft = el.getBoundingClientRect().left;
      const dx = oldLeft - newLeft;
      if (Math.abs(dx) < 1) return;
      el.style.transition = 'none';
      el.style.transform = `translateX(${dx}px)`;
    });

    chipRowRef.current.getBoundingClientRect(); // force reflow

    // Animate each moved chip to its natural position
    chipEls.forEach(el => {
      if (el.dataset.chipId === chipDragIdRef.current) return;
      if (!el.style.transform) return;
      el.style.transition = 'transform 200ms cubic-bezier(0.2, 0, 0.1, 1)';
      el.style.transform = '';
    });
  }, [viewChips]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 when search query or filters change
  useEffect(() => {
    setPaginationPage(1);
  }, [debouncedSearch, filterChips]);

  // Resolved data-row keys to search across. Recomputed each render (cheap, no memo needed),
  // ensuring it is always in sync with the active tab without any stale-closure risk.
  const searchableKeys = activeTab.columns.filter(c => c.searchable).flatMap(getSearchKeys);

  // Per-chip row counts — recomputed whenever the data, chip list, active filters, or searchable keys change.
  const chipRowCounts = useMemo(() => {
    const counts: Record<string, string> = {};
    const total = tableRows.length;
    viewChips.forEach(chip => {
      const cfg = chipListConfigsRef.current[chip.id];
      if (!cfg || (cfg.filters.length === 0 && !cfg.searchQuery.trim())) {
        counts[chip.id] = total.toLocaleString();
        return;
      }
      let rows = tableRows.map((row, originalIndex) => ({ row, originalIndex }));
      if (cfg.searchQuery.trim()) {
        const q = cfg.searchQuery.trim();
        rows = rows.filter(({ row }) => searchableKeys.some(key => substringMatch(String(row[key] ?? ''), q)));
      }
      rows = applyFilterChips(rows, cfg.filters);
      counts[chip.id] = rows.length.toLocaleString();
    });
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRows, viewChips, filterChips]); // eslint-disable-line react-hooks/exhaustive-deps

  const allFilteredRows = useMemo(() => {
    const q = debouncedSearch.trim();
    let rows = tableRows.map((row, originalIndex) => ({ row, originalIndex }));
    if (q) {
      rows = rows.filter(({ row }) => searchableKeys.some(key => substringMatch(String(row[key] ?? ''), q)));
    }
    return applyFilterChips(rows, filterChips);
  // searchableKeys is derived inline each render so it doesn't need to be in deps
  }, [debouncedSearch, tableRows, filterChips]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedRows = useMemo(() => {
    if (!sortCol) return allFilteredRows;
    return [...allFilteredRows].sort((a, b) => {
      const av = String(a.row[sortCol] ?? '');
      const bv = String(b.row[sortCol] ?? '');
      return sortDir === 'asc'
        ? av.localeCompare(bv, undefined, { numeric: true })
        : bv.localeCompare(av, undefined, { numeric: true });
    });
  }, [allFilteredRows, sortCol, sortDir]);

  const TOTAL_RESULTS = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(TOTAL_RESULTS / pageSize));

  // Whether the Console action bar is currently showing (any state)
  const consoleBarActive = barVisible || omnibarOpen || (selectedChip != null && selectedChip.id !== primaryChipId && selectedRows.size === 0);
  const filteredRows = useMemo(
    () => sortedRows.slice((paginationPage - 1) * pageSize, paginationPage * pageSize),
    [sortedRows, paginationPage, pageSize]
  );
  filteredRowsRef.current = filteredRows;

  // allSelected / someSelected are relative to the current page
  const filteredIndices = filteredRows.map(r => r.originalIndex);
  const allSelected = filteredIndices.length > 0 && filteredIndices.every(i => selectedRows.has(i));
  const someSelected = filteredIndices.some(i => selectedRows.has(i)) && !allSelected;
  // Keep ref in sync so TableRow event handlers can read the latest value without causing re-renders
  hasSelectionRef.current = bulkSelectCheckboxes && selectedRows.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(prev => {
        const next = new Set(prev);
        filteredIndices.forEach(i => next.delete(i));
        return next;
      });
    } else {
      setSelectedRows(prev => {
        const next = new Set(prev);
        filteredIndices.forEach(i => next.add(i));
        return next;
      });
    }
  };



  const renderViewsPopoverContent = () => {
    const FONT = 'SF Pro Text, system-ui, -apple-system, sans-serif';
    const sortedChips = [...viewChips].sort((a, b) => {
      const aPinned = pinnedViewIds.has(a.id) ? 0 : 1;
      const bPinned = pinnedViewIds.has(b.id) ? 0 : 1;
      return aPinned - bPinned;
    });
    const visibleChips = sortedChips.filter(c => pinnedViewIds.has(c.id));
    const hiddenChips = sortedChips.filter(c => !pinnedViewIds.has(c.id));

    const handleInlineRenameSave = () => {
      const trimmed = renameValue.trim();
      if (!trimmed) return;
      setViewChips(prev => prev.map(c => c.id === renameChipId ? { ...c, label: trimmed } : c));
      setRenameChipId(null);
    };

    const renderRow = (chip: (typeof viewChips)[0]) => {
      const isPinned = pinnedViewIds.has(chip.id);
      const isAll = chip.id === primaryChipId;
      const isRenaming = renameChipId === chip.id;
      const isDefault = defaultChipId === chip.id;
      // "All" when it IS the default has no actionable menu items
      const hasNoOptions = isAll && isDefault;

      return (
        <div
          key={chip.id}
          className={`view-row${isRenaming ? ' view-row-renaming' : ''}`}
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center',
            height: '36px',
            padding: '0 2px',
            borderRadius: '6px',
            ...(listActionsChipId === chip.id && !isRenaming ? { backgroundColor: '#F4F7FA' } : {}),
            outline: isRenaming ? '2px solid #D4DEE9' : 'none',
            outlineOffset: isRenaming ? '-2px' : undefined,
          }}
        >
          {isRenaming ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', minWidth: 0 }}>
              <input
                ref={renameInputRef}
                autoFocus
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleInlineRenameSave();
                  if (e.key === 'Escape') setRenameChipId(null);
                }}
                onMouseDown={e => e.stopPropagation()}
                style={{
                  flex: 1, minWidth: 0,
                  background: 'none', border: 'none', outline: 'none', padding: 0,
                  fontFamily: FONT, fontSize: '14px', fontWeight: 400,
                  lineHeight: '20px', letterSpacing: '-0.15px', color: '#1A2C44',
                }}
              />
              <button
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                onClick={handleInlineRenameSave}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0,
                  fontFamily: FONT, fontSize: '14px', fontWeight: 600,
                  lineHeight: '20px', letterSpacing: '-0.15px', color: '#533AFD',
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <>
              {/* Label */}
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => { selectChip(chip.id); setIsViewsPopoverOpen(false); }}
                style={{
                  flex: 1, minWidth: 0,
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  padding: '6px 8px',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  flex: 1, minWidth: 0,
                  fontFamily: FONT, fontSize: '14px', fontWeight: 400,
                  lineHeight: '20px', letterSpacing: '-0.15px', color: '#1A2C44',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {chip.label}
                </span>
              </button>

              {/* Inline right side: badge + check — no pointer events */}
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, pointerEvents: 'none' }}>
                {isDefault && (
                  <span style={{
                    flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center',
                    height: '20px', padding: '0 6px',
                    marginRight: '4px',
                    borderRadius: '4px',
                    background: '#F5F6F8',
                    outline: '1px solid #D8DEE4', outlineOffset: '0px',
                    fontFamily: FONT, fontSize: '12px', fontWeight: 400,
                    lineHeight: '16px', color: '#474E5A',
                    whiteSpace: 'nowrap',
                  }}>
                    Default
                  </span>
                )}
                {chip.selected && (
                  <div style={{
                    width: '28px', height: '28px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img src="/dashboard-assets/icons/checkCircleFilled.svg" alt="" style={{ width: '12px', height: '12px' }} />
                  </div>
                )}
              </div>

              {/* More button — hidden when there are no menu options */}
              {!hasNoOptions && (
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    if (listActionsChipId === chip.id) {
                      setListActionsChipId(null);
                      setSubmenuAnchor(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setSubmenuAnchor({ top: rect.top, left: rect.left, right: rect.right });
                      setListActionsChipId(chip.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredMoreBtnId(chip.id)}
                  onMouseLeave={() => setHoveredMoreBtnId(null)}
                  style={{
                    width: '28px', height: '28px', flexShrink: 0,
                    background: (hoveredMoreBtnId === chip.id || listActionsChipId === chip.id) ? '#ECF1F6' : 'none',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, borderRadius: '6px',
                    transition: 'background 120ms',
                  }}
                >
                  <img src="/dashboard-assets/icons/more-12.svg" alt="" style={{ width: '12px', height: '12px' }} />
                </button>
              )}

            </>
          )}
        </div>
      );
    };

    // allHidden: only "All" remains visible — show everything under the "Hidden" header, no divider
    // mixed: some visible, some hidden — show visible first, then divider + "Hidden" header + hidden
    // none hidden: flat list, no header
    const allHidden = hiddenChips.length > 0 && visibleChips.length <= 1;
    const mixed = hiddenChips.length > 0 && visibleChips.length > 1;

    return (
      <div onMouseDown={() => { setListActionsChipId(null); setSubmenuAnchor(null); }}>
        {allHidden ? (
          <div style={{ padding: '4px' }}>
            {[...visibleChips, ...hiddenChips].map(renderRow)}
          </div>
        ) : mixed ? (
          <>
            <div style={{ padding: '4px' }}>
              {visibleChips.map(renderRow)}
            </div>
            <div style={{ borderTop: '1px solid #D8DEE4', padding: '4px' }}>
              <div style={{
                padding: '6px 10px',
                fontFamily: FONT, fontSize: '12px', fontWeight: 700,
                lineHeight: '20px', color: '#273951',
              }}>
                Hidden
              </div>
              {hiddenChips.map(renderRow)}
            </div>
          </>
        ) : (
          <div style={{ padding: '4px' }}>
            {visibleChips.map(renderRow)}
          </div>
        )}
      </div>
    );
  };


  // Chip row inner content — shared between the two placement modes below.
  const renderChipScrollScrims = (
    scrims: { left: boolean; right: boolean },
    scrollRef: React.RefObject<HTMLDivElement | null>,
  ) => (
    <>
      <AnimatePresence>
        {scrims.left && (
          <motion.div
            key="scrim-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ position: 'absolute', left: -4, top: -2, bottom: -2, width: '104px', zIndex: 2, display: 'flex', alignItems: 'center', paddingLeft: '4px', pointerEvents: 'none' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #fff 55%, transparent)' }} />
            <button
              style={{ position: 'relative', flexShrink: 0, pointerEvents: 'auto', width: '28px', height: '28px', borderRadius: '8px', background: 'white', border: '1px solid #EBEEF1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 150ms, border-color 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F7FA'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4DEE9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#EBEEF1'; }}
              onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            >
              <img src="/dashboard-assets/icons/arrowRight12.svg" alt="Scroll left" style={{ width: '12px', height: '12px', transform: 'scaleX(-1)' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scrims.right && (
          <motion.div
            key="scrim-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ position: 'absolute', right: -4, top: -2, bottom: -2, width: '104px', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '4px', pointerEvents: 'none' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, #fff 55%, transparent)' }} />
            <button
              style={{ position: 'relative', flexShrink: 0, pointerEvents: 'auto', width: '28px', height: '28px', borderRadius: '8px', background: 'white', border: '1px solid #EBEEF1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 150ms, border-color 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F7FA'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4DEE9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#EBEEF1'; }}
              onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            >
              <img src="/dashboard-assets/icons/arrowRight12.svg" alt="Scroll right" style={{ width: '12px', height: '12px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // When autoCollapseOnStick is OFF, this is rendered inside stickyBarRef (sticks with bar).
  // When autoCollapseOnStick is ON, this is rendered outside stickyBarRef (scrolls away, M1 style).
  const renderViewChipRowInner = () => (
    <div ref={chipRowSectionRef} className="py-[8px]">
    <div style={{ position: 'relative' }}>
    <div ref={chipRowScrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', paddingTop: '2px', paddingBottom: '2px', marginTop: '-2px', marginBottom: '-2px', marginLeft: '-2px', paddingLeft: '2px', marginRight: '-2px', paddingRight: '2px' }}>
    <div className="flex items-start" style={{ width: 'max-content' }}>
      <div ref={chipRowRef} className="flex items-start">
      <AnimatePresence key={activeTabIdx} initial={false}>
      {[...displayViewChips]
        .filter(chip => displayPinnedIds.has(chip.id) || chip.selected)
        .sort((a, b) => {
          if (a.id === primaryChipId) return -1;
          if (b.id === primaryChipId) return 1;
          const aPinned = displayPinnedIds.has(a.id) ? 0 : 1;
          const bPinned = displayPinnedIds.has(b.id) ? 0 : 1;
          return aPinned - bPinned;
        })
        .map((chip) => (
        <motion.div
          key={chip.id}
          layout
          data-chip-id={chip.id}
          suppressHydrationWarning
          style={{ flexShrink: 0 }}
          initial={justCommittedChipIdRef.current === chip.id ? false : { width: 0, opacity: 0, x: 8, marginRight: 0 }}
          animate={{ width: 'auto', opacity: 1, x: 0, marginRight: 8 }}
          exit={{ width: 0, opacity: 0, x: 8, marginRight: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
          onContextMenu={e => {
            e.preventDefault();
            const isAll = chip.id === primaryChipId;
            const hasNoOptions = isAll && defaultChipId === chip.id;
            if (hasNoOptions) return;
            setChipContextMenu({ chipId: chip.id, x: e.clientX, y: e.clientY });
          }}
        >
          {chipRenameId === chip.id ? (
            <div
              className="relative flex rounded-[8px] bg-white cursor-pointer"
              style={{
                boxShadow: CHIP_SHADOW_SELECTED,
                height: '36px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
              }}
            >
              <input
                ref={chipRenameInputRef}
                autoFocus
                type="text"
                value={chipRenameValue}
                onChange={e => setChipRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const trimmed = chipRenameValue.trim();
                    if (trimmed) setViewChips(prev => prev.map(c => c.id === chipRenameId ? { ...c, label: trimmed } : c));
                    setChipRenameId(null);
                  }
                  if (e.key === 'Escape') setChipRenameId(null);
                }}
                onMouseDown={e => e.stopPropagation()}
                className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#1A2C44] outline-none bg-transparent"
                style={{ paddingLeft: '12px', flex: '1', minWidth: '60px' }}
              />
              <button
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                onClick={() => {
                  const trimmed = chipRenameValue.trim();
                  if (trimmed) setViewChips(prev => prev.map(c => c.id === chipRenameId ? { ...c, label: trimmed } : c));
                  setChipRenameId(null);
                }}
                className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#533AFD] cursor-pointer bg-transparent border-none outline-none shrink-0"
                style={{ paddingLeft: '6px', paddingRight: '12px', height: '100%', display: 'flex', alignItems: 'center' }}
              >
                Save
              </button>
            </div>
          ) : (
            <ViewChipButton
              chip={{ ...chip, count: includeViewTotals ? chipRowCounts[chip.id] : undefined }}
              isDragging={dragChipId === chip.id}
              onMouseDown={e => handleChipMouseDown(e, chip.id)}
              onClick={() => selectChip(chip.id)}
            />
          )}
        </motion.div>
      ))}
      </AnimatePresence>
      </div>

      {/* Save As button */}
      {configChanged && (
        <div
          ref={saveContainerRef}
          className="relative bg-white flex items-center rounded-[8px]"
          style={{
            boxShadow: '0 0 0 2px #533AFD, 0px 2px 3px 0px rgba(33,37,44,0.16)',
            height: '36px',
            overflow: 'hidden',
            animation: 'filterChipIn 220ms cubic-bezier(0.2, 0, 0.1, 1) forwards',
            whiteSpace: 'nowrap',
          }}
        >
          <img
            src="/dashboard-assets/icons/add.svg"
            alt=""
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '12px',
              pointerEvents: 'none',
              filter: 'brightness(0) saturate(100%) invert(24%) sepia(98%) saturate(1500%) hue-rotate(237deg) brightness(90%) contrast(105%)',
              opacity: savePhase === 'idle' ? 1 : 0,
              transition: 'opacity 150ms cubic-bezier(0.2, 0, 0.1, 1)',
            }}
          />
          {savePhase === 'naming' && (
            <input
              ref={saveAsInputRef}
              type="text"
              placeholder="Name your view"
              value={saveAsName}
              onChange={e => setSaveAsName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') closeNaming(); }}
              className="text-[14px] font-normal leading-[20px] tracking-[-0.15px] text-[#1A2C44] placeholder:text-[#9AA3B0] outline-none bg-transparent"
              style={{
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                paddingLeft: '12px',
                flex: '1',
                minWidth: 0,
              }}
            />
          )}
          {savePhase === 'committing' && (
            <span
              className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
              style={{
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                paddingLeft: '12px',
                paddingRight: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              {saveAsName}
            </span>
          )}
          {savePhase === 'naming' && (
            <button
              onClick={closeNaming}
              className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] cursor-pointer bg-transparent border-none outline-none shrink-0"
              style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', padding: '0 4px', height: '100%', display: 'flex', alignItems: 'center', color: '#50617A' }}
            >
              Cancel
            </button>
          )}
          <button
            ref={saveTextRef}
            onClick={savePhase === 'naming' ? handleSave : savePhase === 'idle' ? openNaming : undefined}
            className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#533AFD] cursor-pointer bg-transparent border-none outline-none shrink-0"
            style={{
              fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
              paddingLeft: savePhase === 'naming' ? '4px' : '30px',
              paddingRight: '12px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              position: savePhase === 'committing' ? 'absolute' : undefined,
              opacity: savePhase === 'committing' ? 0 : 1,
              pointerEvents: savePhase === 'committing' ? 'none' : undefined,
            }}
          >
            {savePhase === 'naming' ? 'Save' : 'Save as'}
          </button>
        </div>
      )}

      {/* More button */}
      <div className="relative" style={{ marginLeft: configChanged ? '8px' : '0' }}>
        <button
          ref={setViewsMoreBtnRef}
          onMouseEnter={() => setIsMoreButtonHovered(true)}
          onMouseLeave={() => setIsMoreButtonHovered(false)}
          onClick={e => openViewsPopover(e)}
          className="relative bg-white flex items-center justify-center w-[36px] h-[36px] rounded-[8px] cursor-pointer"
          style={{ transition: DEFAULT_TRANSITION }}
        >
          <div
            className="absolute rounded-[8px] pointer-events-none inset-0"
            style={{
              outlineWidth: '1px',
              outlineStyle: 'solid',
              outlineColor: isMoreButtonHovered || isViewsPopoverOpen ? '#D4DEE9' : '#EBEEF1',
              transition: 'outline-color 250ms cubic-bezier(0.2, 0, 0.1, 1)',
            }}
          />
          <img src="/dashboard-assets/icons/more-16.svg" alt="More" style={{ width: '16px', height: '16px' }} className="relative z-10" />
        </button>
      </div>
    </div>
    {renderChipScrollScrims(chipRowScrims, chipRowScrollRef)}
    </div>
    </div>
    </div>
  );

  useEffect(() => {
    if (!pageActionsOverflowOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        pageActionsOverflowMenuRef.current && !pageActionsOverflowMenuRef.current.contains(e.target as Node) &&
        pageActionsOverflowBtnRef.current && !pageActionsOverflowBtnRef.current.contains(e.target as Node)
      ) {
        setPageActionsOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pageActionsOverflowOpen]);

  return (
    <div className="h-full flex flex-col bg-white" style={{ overflowX: 'clip' }}>
      <style>{`
        @property --shimmer-s1 { syntax: '<number>'; inherits: false; initial-value: 0.8; }
        @property --shimmer-s2 { syntax: '<number>'; inherits: false; initial-value: 0;   }
        @property --shimmer-s3 { syntax: '<number>'; inherits: false; initial-value: 0;   }
      `}</style>
      <style>{`
        @keyframes shimmerPulse {
          0%      { --shimmer-s1: 0.8; --shimmer-s2: 0;   --shimmer-s3: 0;   }
          33.33%  { --shimmer-s1: 0;   --shimmer-s2: 0.8; --shimmer-s3: 0;   }
          66.66%  { --shimmer-s1: 0;   --shimmer-s2: 0;   --shimmer-s3: 0.8; }
          100%    { --shimmer-s1: 0.8; --shimmer-s2: 0;   --shimmer-s3: 0;   }
        }

        @keyframes floatingBarIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes floatingBarOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to   { opacity: 0; transform: translateX(-50%) translateY(12px); }
        }

        @keyframes filterChipIn {
          from {
            max-width: 0;
            opacity: 0;
            overflow: hidden;
          }
          to {
            max-width: 500px;
            opacity: 1;
            overflow: visible;
          }
        }

        @keyframes chipLabelFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes ghostCardIn {
          from { background-color: transparent; box-shadow: none; }
          to   { background-color: #ffffff; box-shadow: 0px 4px 50px 0px rgba(0,0,0,0.10); }
        }

        @keyframes ghostGlassIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Popover opening below its control (control is above) */
        @keyframes popoverIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }


        /* Popover opening above its control (control is below) */
        @keyframes popoverInUp {
          from { opacity: 0; transform: translateY(8px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0)   scale(1);   }
        }

        .toggle-switch {
          width: 32px;
          height: 18px;
          border-radius: 9px;
          background: #D1D9E0;
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 250ms cubic-bezier(0.2, 0, 0.1, 1);
          border: none;
          outline: none;
        }
        .toggle-switch.on {
          background: #675DFF;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          transition: transform 250ms cubic-bezier(0.2, 0, 0.1, 1);
        }
        .toggle-switch.on::after {
          transform: translateX(14px);
        }

      `}</style>

      {/* ── Everything below scrolls inside tableScrollRef ──────────────────── */}
      <div
        ref={tableScrollRef}
        className={`table-scroll-hidden-native flex flex-col flex-1 min-h-0 mx-[24px]${tableScrollState.showLeft ? ' scroll-left' : ''}${tableScrollState.showRight ? ' scroll-right' : ''}`}
        style={{ overflow: 'auto', paddingBottom: consoleBarActive ? '140px' : '44px', transition: 'padding-bottom 0.25s cubic-bezier(0.2, 0, 0.1, 1)' }}
      >

      {/* Page Title Row — naturally scrolls away inside tableScrollRef */}
      <div ref={titleRef} className={config.tabs.length > 1 ? 'pt-[8px]' : 'py-[8px]'} style={{ position: 'sticky', left: 0, paddingLeft: '2px', paddingRight: '2px' }}>
        {config.breadcrumb && (
          <div style={{ paddingBottom: '2px' }}>
            {config.breadcrumb.href ? (
              <a
                href={config.breadcrumb.href}
                style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#533AFD', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#3D2BC9')}
                onMouseLeave={e => (e.currentTarget.style.color = '#533AFD')}
              >
                {config.breadcrumb.label}
              </a>
            ) : (
              <span style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#533AFD' }}>
                {config.breadcrumb.label}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between h-[44px]">
          <h1
            className="text-[#1A1F2E]"
            style={{ fontFamily: 'SF Pro Display, SF Pro Text, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: '28px', lineHeight: '36px', letterSpacing: '0.38px' }}
          >
            {config.pageTitle}
          </h1>
          <div className="flex items-center gap-[8px]">
            {config.pageCopyId ? (
              <>
                <PageHeaderCopyIdField fullId={config.pageCopyId} />
                {/* Vertical separator: gap-[8px] + px-[8px] here = 16px chip→line and line→actions; 8px between action controls. */}
                <div
                  className="flex shrink-0 items-center self-center px-[8px]"
                  role="presentation"
                  aria-hidden
                >
                  <div className="h-[20px] w-px bg-[#D8DEE4]" />
                </div>
              </>
            ) : null}
            {/* Order: More → Analyze → Export → [promoted pill] → Create */}
            {(() => {
              const actions = config.pageActions ?? [];
              const hasCreate = Boolean(activeTab.createActionLabel);
              const promoted = actions.length > 0 && !hasCreate ? actions[0] : null;
              const menuActions = actions.length > 0
                ? (!hasCreate ? actions.slice(1) : actions)
                : [];
              const showMore = menuActions.length > 0;

              // Shared tooltip style
              const tooltipStyle: React.CSSProperties = {
                backgroundColor: '#1A2C44',
                color: '#FFFFFF',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '-0.15px',
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap',
                zIndex: 9999,
                pointerEvents: 'none',
              };

              // Shared icon button style factory
              const iconBtnStyle = (hovered: boolean): React.CSSProperties => ({
                outline: `1px solid ${hovered ? '#95A4BA' : '#D4DEE9'}`,
                outlineOffset: '0px',
                backgroundColor: hovered ? '#F5F6F8' : 'white',
                transition: 'outline-color 100ms cubic-bezier(0.2, 0, 0.1, 1), background-color 100ms cubic-bezier(0.2, 0, 0.1, 1)',
              });

              // Helper: compute centred-below position for a button ref
              const btnTooltipPos = (ref: React.RefObject<HTMLButtonElement | null>) => {
                if (!ref.current) return { top: 0, left: 0 };
                const r = ref.current.getBoundingClientRect();
                return { top: r.bottom + 8, left: r.left + r.width / 2 };
              };

              return (
                <>
                  {/* More icon button */}
                  {showMore && (
                    <button
                      ref={pageActionsOverflowBtnRef}
                      onMouseEnter={() => {
                        setPageActionsOverflowHover(true);
                        setMoreTooltipPos(btnTooltipPos(pageActionsOverflowBtnRef));
                      }}
                      onMouseLeave={() => setPageActionsOverflowHover(false)}
                      onClick={() => {
                        if (!pageActionsOverflowBtnRef.current) return;
                        const rect = pageActionsOverflowBtnRef.current.getBoundingClientRect();
                        setPageActionsOverflowPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        setPageActionsOverflowOpen(v => !v);
                      }}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] cursor-pointer"
                      style={iconBtnStyle(pageActionsOverflowOpen || pageActionsOverflowHover)}
                    >
                      <img src="/dashboard-assets/icons/more12.svg" alt="More" style={{ width: '12px', height: '12px' }} />
                    </button>
                  )}
                  {/* Analyze icon button */}
                  <button
                    ref={analyzeBtnRef}
                    onMouseEnter={() => {
                      setAnalyzeTooltipVisible(true);
                      setAnalyzeHovered(true);
                      setAnalyzeTooltipPos(btnTooltipPos(analyzeBtnRef));
                    }}
                    onMouseLeave={() => { setAnalyzeTooltipVisible(false); setAnalyzeHovered(false); }}
                    className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] cursor-pointer"
                    style={iconBtnStyle(analyzeHovered)}
                  >
                    <img src="/dashboard-assets/icons/barChart12.svg" alt="Analyze" style={{ width: '12px', height: '12px' }} />
                  </button>
                  {/* Export icon button */}
                  <button
                    ref={exportBtnRef}
                    onMouseEnter={() => {
                      setExportTooltipVisible(true);
                      setExportHovered(true);
                      setExportTooltipPos(btnTooltipPos(exportBtnRef));
                    }}
                    onMouseLeave={() => { setExportTooltipVisible(false); setExportHovered(false); }}
                    className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] cursor-pointer"
                    style={iconBtnStyle(exportHovered)}
                  >
                    <img src="/dashboard-assets/icons/export12.svg" alt="Export" style={{ width: '12px', height: '12px' }} />
                  </button>
                  {/* Promoted action pill — first pageAction when there is no create button */}
                  {promoted && (
                    <button
                      onMouseEnter={() => setPromotedActionHovered(true)}
                      onMouseLeave={() => setPromotedActionHovered(false)}
                      className="flex items-center px-[8px] py-[4px] rounded-[6px] cursor-pointer text-[14px] font-semibold"
                      style={{
                        fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                        color: '#273951',
                        letterSpacing: '-0.15px',
                        lineHeight: '20px',
                        outline: `1px solid ${promotedActionHovered ? '#95A4BA' : '#D4DEE9'}`,
                        outlineOffset: '0px',
                        backgroundColor: promotedActionHovered ? '#F5F6F8' : 'white',
                        transition: 'outline-color 100ms cubic-bezier(0.2, 0, 0.1, 1), background-color 100ms cubic-bezier(0.2, 0, 0.1, 1)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {promoted.label}
                    </button>
                  )}
                  {/* Portalled tooltips — fixed position avoids overflow:auto clipping */}
                  {typeof document !== 'undefined' && pageActionsOverflowHover && !pageActionsOverflowOpen && createPortal(
                    <div style={{ ...tooltipStyle, position: 'fixed', top: moreTooltipPos.top, left: moreTooltipPos.left, transform: 'translateX(-50%)' }}>More</div>,
                    document.body
                  )}
                  {typeof document !== 'undefined' && analyzeTooltipVisible && createPortal(
                    <div style={{ ...tooltipStyle, position: 'fixed', top: analyzeTooltipPos.top, left: analyzeTooltipPos.left, transform: 'translateX(-50%)' }}>Analyze</div>,
                    document.body
                  )}
                  {typeof document !== 'undefined' && exportTooltipVisible && createPortal(
                    <div style={{ ...tooltipStyle, position: 'fixed', top: exportTooltipPos.top, left: exportTooltipPos.left, transform: 'translateX(-50%)' }}>Export</div>,
                    document.body
                  )}
                  {/* More menu popover */}
                  {typeof document !== 'undefined' && pageActionsOverflowOpen && createPortal(
                    <div
                      ref={pageActionsOverflowMenuRef}
                      style={{
                        position: 'fixed',
                        top: pageActionsOverflowPos.top,
                        right: pageActionsOverflowPos.right,
                        zIndex: 10000,
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0px 15px 35px 0px rgba(48,49,61,0.08), 0px 5px 15px 0px rgba(0,0,0,0.12)',
                        border: '1px solid #D8DEE4',
                        padding: '4px',
                        width: 'max-content',
                        minWidth: '120px',
                        maxWidth: '320px',
                        fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                        animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
                        transformOrigin: 'top right',
                      }}
                    >
                      {renderMoreMenuItems(
                        menuActions.map(a => ({ ...a, color: '#273951' })),
                        () => setPageActionsOverflowOpen(false),
                      )}
                    </div>,
                    document.body
                  )}
                </>
              );
            })()}
            {/* Primary action button — omitted when the tab defines no createActionLabel */}
            {activeTab.createActionLabel && (
              <button
                onMouseEnter={() => setCreateHovered(true)}
                onMouseLeave={() => setCreateHovered(false)}
                className="flex items-center gap-[6px] px-[8px] py-[4px] rounded-[6px] cursor-pointer text-[14px] font-semibold"
                style={{
                  fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                  color: '#273951',
                  letterSpacing: '-0.15px',
                  lineHeight: '20px',
                  outline: `1px solid ${createHovered ? '#95A4BA' : '#D4DEE9'}`,
                  outlineOffset: '0px',
                  backgroundColor: createHovered ? '#F5F6F8' : 'white',
                  transition: 'outline-color 100ms cubic-bezier(0.2, 0, 0.1, 1), background-color 100ms cubic-bezier(0.2, 0, 0.1, 1)',
                }}
              >
                <img src="/dashboard-assets/icons/add12.svg" alt="" style={{ width: '12px', height: '12px' }} />
                {activeTab.createActionLabel}
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Tab Bar — only rendered when the page has 2+ tabs */}
        {config.tabs.length > 1 && (
          <div ref={tabBarRef} style={{ position: 'sticky', left: 0, paddingLeft: '2px', paddingRight: '2px', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, borderBottom: '1px solid #EBEEF1' }}>
              {config.tabs.map((tab, idx) => {
                const isActive = idx === activeTabIdx;
                // M1.5 template (m15) keeps every tab navigable for the full system demo.
                const isTabDisabled = Boolean(tab.placeholder) && config.pageId !== 'm15';
                const labelColor = isTabDisabled
                  ? '#BAC8DA'
                  : isActive
                    ? '#1A2C44'
                    : '#6A7383';
                return (
                  <button
                    key={tab.tabId}
                    type="button"
                    aria-disabled={isTabDisabled}
                    tabIndex={isTabDisabled ? -1 : 0}
                    onClick={() => {
                      if (isTabDisabled) return;
                      setActiveTabIdx(idx);
                      if (basePath) {
                        router.push(`${basePath}/${tab.tabId}`);
                      }
                    }}
                    style={{
                      /* No bottom padding here — it lives on the inner span so
                         the absolute underline's bottom:0 lands at the border line. */
                      padding: '10px 12px 0',
                      marginLeft: idx === 0 ? '-11px' : 0,
                      background: 'transparent',
                      border: 'none',
                      cursor: isTabDisabled ? 'default' : 'pointer',
                      fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: '-0.15px',
                      fontWeight: 600,
                      color: labelColor,
                      transition: 'color 150ms',
                      outline: 'none',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      pointerEvents: isTabDisabled ? 'none' : 'auto',
                    }}
                  >
                    {/* inline-block span shrinks to text width — underline inherits that width */}
                    <span style={{ display: 'inline-block', position: 'relative', paddingBottom: '10px' }}>
                      {tab.label}
                      {isActive && !isTabDisabled && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: '#1A2C44',
                            borderRadius: '2px 2px 0 0',
                          }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chip Row — auto-collapse mode.
            Gated on !isScrolled: when the bar has stuck, the chip row is already
            off-screen so we drop it from the DOM instantly (no exit animation).
            AnimatePresence (initial={false}) handles the allUnpinned expand/collapse
            animation, and ensures no enter animation when scrolling back up. */}
        {autoCollapseOnStick && !noSearch && !isScrolled && (
        <AnimatePresence initial={false}>
          {!allUnpinned && (
          <div style={{ position: 'sticky', left: 0, paddingLeft: '2px', paddingRight: '2px' }}>
          <motion.div
            key="chip-row-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={suppressAnim ? { duration: 0 } : { duration: 0.15, ease: [0.2, 0, 0.1, 1] }}
            style={{ overflow: 'hidden', marginLeft: '-2px', paddingLeft: '2px', marginRight: '-2px', paddingRight: '2px' }}
          >
            {renderViewChipRowInner()}
          </motion.div>
          </div>
          )}
        </AnimatePresence>
        )}

        {/* Zero-height sentinel — IntersectionObserver fires the instant this crosses
            the scroll container top, which is the exact moment the sticky bar sticks. */}
        <div ref={stickyTriggerRef} style={{ height: 0 }} />

        {/* Search Row — sticky container; holds both chip row and search/filter row */}
        {/* Top padding is 1px when the chip row sits inside this bar (keeps it tight).
            When collapsed (chips scrolled away or all unpinned), the search bar is the
            topmost element so we give it 9px (8px extra) of breathing room. */}
        <div ref={stickyBarRef} style={{
          position: 'sticky', top: 0, left: 0, zIndex: 50,
          background: 'white',
          padding: '8px 2px 8px 0',
        }}>
        {/* List Chip Row — AnimatePresence conditional render (mirrors M1 working pattern) */}
        {!autoCollapseOnStick && !noSearch && (
        <AnimatePresence initial={false}>
          {!allUnpinned && (
          <motion.div
            key="chip-row-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={suppressAnim ? { duration: 0 } : { duration: 0.15, ease: [0.2, 0, 0.1, 1] }}
            style={{ overflow: 'hidden', marginLeft: '-2px', paddingLeft: '2px', marginRight: '-2px', paddingRight: '2px' }}
          >
            {renderViewChipRowInner()}
          </motion.div>
          )}
        </AnimatePresence>
        )}
        <div className="flex gap-[8px] items-center">

          {noSearch ? (
            /* No-search layout: chip row + more button scroll horizontally together */
            <>
            <div className="flex-1 min-w-0" style={{ position: 'relative' }}>
            <div ref={noSearchScrollRef} className="no-search-chip-scroll" style={{ overflowX: 'auto', scrollbarWidth: 'none', paddingTop: '2px', paddingBottom: '2px', marginTop: '-2px', marginBottom: '-2px', marginLeft: '-2px', paddingLeft: '2px' }}>
              <div className="flex items-start" style={{ width: 'max-content', paddingLeft: '2px', paddingRight: '4px' }}>
              <div ref={chipRowRef} className="flex items-start">
                <AnimatePresence key={activeTabIdx} initial={false}>
                {[...displayViewChips]
                  .filter(chip => displayPinnedIds.has(chip.id) || chip.selected)
                  .sort((a, b) => {
                    if (a.id === primaryChipId) return -1;
                    if (b.id === primaryChipId) return 1;
                    const aPinned = displayPinnedIds.has(a.id) ? 0 : 1;
                    const bPinned = displayPinnedIds.has(b.id) ? 0 : 1;
                    return aPinned - bPinned;
                  })
                  .map((chip) => (
                  <motion.div
                    key={chip.id}
                    layout
                    data-chip-id={chip.id}
                    suppressHydrationWarning
                    style={{ flexShrink: 0 }}
                    initial={justCommittedChipIdRef.current === chip.id ? false : { width: 0, opacity: 0, x: 8, marginRight: 0 }}
                    animate={{ width: 'auto', opacity: 1, x: 0, marginRight: 8 }}
                    exit={{ width: 0, opacity: 0, x: 8, marginRight: 0 }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
                    onContextMenu={e => {
                      e.preventDefault();
                      const isAll = chip.id === primaryChipId;
                      const hasNoOptions = isAll && defaultChipId === chip.id;
                      if (hasNoOptions) return;
                      setChipContextMenu({ chipId: chip.id, x: e.clientX, y: e.clientY });
                    }}
                  >
                    {chipRenameId === chip.id ? (
                      <div
                        className="relative flex rounded-[8px] bg-white cursor-pointer"
                        style={{
                          boxShadow: CHIP_SHADOW_SELECTED,
                          height: '36px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          whiteSpace: 'nowrap',
                          fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                        }}
                      >
                        <input
                          ref={chipRenameInputRef}
                          autoFocus
                          type="text"
                          value={chipRenameValue}
                          onChange={e => setChipRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const trimmed = chipRenameValue.trim();
                              if (trimmed) setViewChips(prev => prev.map(c => c.id === chipRenameId ? { ...c, label: trimmed } : c));
                              setChipRenameId(null);
                            }
                            if (e.key === 'Escape') setChipRenameId(null);
                          }}
                          onMouseDown={e => e.stopPropagation()}
                          className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#1A2C44] outline-none bg-transparent"
                          style={{ paddingLeft: '12px', flex: '1', minWidth: '60px' }}
                        />
                        <button
                          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                          onClick={() => {
                            const trimmed = chipRenameValue.trim();
                            if (trimmed) setViewChips(prev => prev.map(c => c.id === chipRenameId ? { ...c, label: trimmed } : c));
                            setChipRenameId(null);
                          }}
                          className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#533AFD] cursor-pointer bg-transparent border-none outline-none shrink-0"
                          style={{ paddingLeft: '6px', paddingRight: '12px', height: '100%', display: 'flex', alignItems: 'center' }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <ViewChipButton
                        chip={{ ...chip, count: includeViewTotals ? chipRowCounts[chip.id] : undefined }}
                        isDragging={dragChipId === chip.id}
                        onMouseDown={e => handleChipMouseDown(e, chip.id)}
                        onClick={() => selectChip(chip.id)}
                      />
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>

              {/* Save As button */}
              {configChanged && (
                <div
                  ref={saveContainerRef}
                  className="relative bg-white flex items-center rounded-[8px]"
                  style={{
                    boxShadow: '0 0 0 2px #533AFD, 0px 2px 3px 0px rgba(33,37,44,0.16)',
                    height: '36px',
                    overflow: 'hidden',
                    animation: 'filterChipIn 220ms cubic-bezier(0.2, 0, 0.1, 1) forwards',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/dashboard-assets/icons/add.svg"
                    alt=""
                    style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      width: '12px', height: '12px', pointerEvents: 'none',
                      filter: 'brightness(0) saturate(100%) invert(24%) sepia(98%) saturate(1500%) hue-rotate(237deg) brightness(90%) contrast(105%)',
                      opacity: savePhase === 'idle' ? 1 : 0,
                      transition: 'opacity 150ms cubic-bezier(0.2, 0, 0.1, 1)',
                    }}
                  />
                  {savePhase === 'naming' && (
                    <input
                      ref={saveAsInputRef}
                      type="text"
                      placeholder="Name your view"
                      value={saveAsName}
                      onChange={e => setSaveAsName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') closeNaming(); }}
                      className="text-[14px] font-normal leading-[20px] tracking-[-0.15px] text-[#1A2C44] placeholder:text-[#9AA3B0] outline-none bg-transparent"
                      style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', paddingLeft: '12px', flex: '1', minWidth: 0 }}
                    />
                  )}
                  {savePhase === 'committing' && (
                    <span
                      className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
                      style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', paddingLeft: '12px', paddingRight: '12px', whiteSpace: 'nowrap' }}
                    >
                      {saveAsName}
                    </span>
                  )}
                  {savePhase === 'naming' && (
                    <button
                      onClick={closeNaming}
                      className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] cursor-pointer bg-transparent border-none outline-none shrink-0"
                      style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', padding: '0 4px', height: '100%', display: 'flex', alignItems: 'center', color: '#50617A' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    ref={saveTextRef}
                    onClick={savePhase === 'naming' ? handleSave : savePhase === 'idle' ? openNaming : undefined}
                    className="text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#533AFD] cursor-pointer bg-transparent border-none outline-none shrink-0"
                    style={{
                      fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                      paddingLeft: savePhase === 'naming' ? '4px' : '30px',
                      paddingRight: '12px',
                      height: '100%',
                      display: 'flex', alignItems: 'center',
                      position: savePhase === 'committing' ? 'absolute' : undefined,
                      opacity: savePhase === 'committing' ? 0 : 1,
                      pointerEvents: savePhase === 'committing' ? 'none' : undefined,
                    }}
                  >
                    {savePhase === 'naming' ? 'Save' : 'Save as'}
                  </button>
                </div>
              )}

              {/* More button — inline after chips */}
              <div className="relative flex-shrink-0" style={{ paddingRight: '2px', marginLeft: configChanged ? '8px' : '0px' }}>
                <button
                  ref={setViewsMoreBtnRef}
                  onMouseEnter={() => setIsMoreButtonHovered(true)}
                  onMouseLeave={() => setIsMoreButtonHovered(false)}
                  onClick={e => openViewsPopover(e)}
                  className="relative bg-white flex items-center justify-center cursor-pointer"
                  style={{ width: '36px', height: '36px', borderRadius: '8px', transition: DEFAULT_TRANSITION }}
                >
                  <div
                    className="absolute pointer-events-none inset-0"
                    style={{
                      borderRadius: '8px',
                      outlineWidth: '1px', outlineStyle: 'solid',
                      outlineColor: isMoreButtonHovered || isViewsPopoverOpen ? '#D4DEE9' : '#EBEEF1',
                      transition: 'outline-color 250ms cubic-bezier(0.2, 0, 0.1, 1)',
                    }}
                  />
                  <img src="/dashboard-assets/icons/more-16.svg" alt="More" style={{ width: '16px', height: '16px' }} className="relative z-10" />
                </button>
              </div>
              </div>{/* close max-content inner wrapper */}
            </div>{/* close scroll container */}
            {renderChipScrollScrims(noSearchScrims, noSearchScrollRef)}
            </div>{/* close relative wrapper */}
            </>
          ) : (
            <>
          {/* Collapsed lists button */}
          <CollapsedListSelector
            visible={allUnpinned || (autoCollapseOnStick && isScrolled && !noSearch)}
            allUnpinned={allUnpinned}
            suppressAnim={suppressAnim}
            chipLabel={selectedChip?.label ?? 'All'}
            chipCount={selectedChip && includeViewTotals ? chipRowCounts[selectedChip.id] : undefined}
            isHovered={isMoreButtonHovered}
            isOpen={isViewsPopoverOpen}
            setRef={setViewsMoreBtnRef}
            onOpen={openViewsPopover}
            onHoverIn={handleMoreButtonHoverIn}
            onHoverOut={handleMoreButtonHoverOut}
            configChanged={configChanged}
            savePhase={savePhase}
            saveAsName={saveAsName}
            onNameChange={setSaveAsName}
            onOpenNaming={() => setSavePhase('naming')}
            onSave={() => { const name = saveAsName.trim(); if (name) commitSave(name); }}
            onCancelNaming={() => { setSavePhase('idle'); setSaveAsName(''); }}
          />

          {/* Search Bar */}
          <div
            className="search-bar flex-1 relative flex items-center gap-[8px] rounded-[12px] cursor-text"
            style={{ padding: '8px 16px' }}
            onClick={() => searchInputRef.current?.focus()}
          >
            <img src="/dashboard-assets/icons/search-12.svg" alt="Search" className="w-[12px] h-[12px] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, email, etc."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 min-w-0 h-[28px] text-[14px] font-normal leading-5 tracking-[-0.15px] text-[#1A2C44] placeholder:text-[#9AA3B0] outline-none bg-transparent cursor-text"
              style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif' }}
            />
            {/* Clear button — only when text is present */}
            {searchValue && (
              <button
                onClick={e => { e.stopPropagation(); setSearchValue(''); setDebouncedSearch(''); }}
                className="search-clear-btn flex items-center justify-center shrink-0 cursor-pointer"
                style={{ width: '28px', height: '28px', border: 'none', padding: 0, margin: '0 -8px 0 0', borderRadius: '6px' }}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          </>
          )}

          {/* Filter Well */}
          {filterDefs.length > 0 && (
          <div className="relative bg-[#F8F9FB]" style={{ outline: '1px solid #ECF1F6', outlineOffset: '0px', borderRadius: noSearch ? '10px' : '12px', padding: noSearch ? '6px' : '8px' }}>
            <div className="flex items-center" style={{ gap: noSearch ? '6px' : undefined }}>
              {/* Filter chips - show up to 2, animated by framer motion */}
              <AnimatePresence initial={false}>
                {visibleChips.map((chip) => (
                  <motion.div
                    key={chip.id}
                    style={{ overflow: 'hidden', flexShrink: 0 }}
                    initial={{ width: 0, opacity: 0, x: 8, marginRight: 0 }}
                    animate={{ width: 'auto', opacity: 1, x: 0, marginRight: noSearch ? 0 : 8 }}
                    exit={{ width: 0, opacity: 0, x: 8, marginRight: 0 }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
                  >
                    <div
                      className="relative flex gap-[8px] h-[28px] items-center px-[8px] py-[6px] rounded-[6px] overflow-hidden cursor-pointer"
                      style={(() => {
                        const isOpen = isFilterMenuOpen && chipFilterAnchor && selectedFilter === chip.filterName;
                        const isHov = !isOpen && hoveredFilterChipId === chip.id;
                        const isPrs = !isOpen && pressedFilterChipId === chip.id;
                        return {
                          width: 'max-content',
                          maxWidth: '280px',
                          fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                          boxShadow: `inset 0 0 0 1px ${isOpen || isHov || isPrs ? '#D4DEE9' : '#EBEEF1'}`,
                          backgroundColor: isOpen || isPrs ? '#F4F7FA' : 'white',
                          transition: 'box-shadow 0.1s, background-color 0.1s',
                        };
                      })()}
                      onMouseEnter={() => setHoveredFilterChipId(chip.id)}
                      onMouseLeave={() => { setHoveredFilterChipId(null); setPressedFilterChipId(null); }}
                      onMouseDown={() => setPressedFilterChipId(chip.id)}
                      onMouseUp={() => setPressedFilterChipId(null)}
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setChipFilterAnchor({ left: rect.left, top: rect.top, height: rect.height });
                        handleFilterClick(chip.filterName);
                        setIsFilterMenuOpen(true);
                      }}
                    >
                      {/* Cancel icon */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFilterChip(chip.id); }}
                        className="w-[12px] h-[12px] flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="5.5" fill="#6C7688" stroke="#6C7688"/>
                          <path d="M4 4L8 8M8 4L4 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>

                      {/* Filter name */}
                      <span className="text-[12px] font-semibold leading-4 tracking-[-0.024px] text-[#6C7688] shrink-0">
                        {chip.filterName}
                      </span>

                      {/* Divider */}
                      <div className="w-[1px] h-[8px] bg-[#D8DEE4] shrink-0" />

                      {/* Selected values */}
                      <span className="text-[12px] font-semibold leading-4 tracking-[-0.024px] text-[#533AFD] min-w-0 truncate">
                        {filterChipValue(chip)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* More chips aggregate button + overflow menu */}
              {/* The outer div is `relative` so the popup can escape the animation wrapper's overflow:hidden */}
              <AnimatePresence initial={false}>
              {hiddenChips.length > 0 && (
                <div className="relative" style={{ flexShrink: 0, marginRight: noSearch ? 0 : 8 }}>
                  <motion.div
                    style={{ overflow: 'hidden' }}
                    initial={{ width: 0, opacity: 0, x: 8 }}
                    animate={{ width: 'auto', opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: 8 }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
                  >
                    <button
                      ref={moreChipsButtonRef}
                      onClick={() => setIsMoreChipsOpen(!isMoreChipsOpen)}
                      className="relative bg-white flex gap-[8px] h-[28px] items-center px-[8px] py-[6px] rounded-[6px] cursor-pointer hover:bg-[#F5F6F8]"
                      style={{
                        fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                        transition: DEFAULT_TRANSITION,
                        boxShadow: `inset 0 0 0 1px ${isMoreChipsOpen ? '#D4DEE9' : '#EBEEF1'}`,
                        whiteSpace: 'nowrap',
                        backgroundColor: isMoreChipsOpen ? '#F4F7FA' : undefined,
                      }}
                    >
                      <span className="text-[12px] font-semibold leading-4 tracking-[-0.024px] text-[#533AFD]">
                        {hiddenChips.length} more
                      </span>
                    </button>
                  </motion.div>

                  {/* Overflow popover — rendered outside the overflow:hidden motion wrapper */}
                  {isMoreChipsOpen && (
                    <div
                      ref={moreChipsMenuRef}
                      className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-white rounded-[8px] z-50 p-[12px] flex flex-col gap-[8px]"
                      style={{
                        border: '1px solid #D8DEE4',
                        boxShadow: '0px 5px 15px 0px rgba(0,0,0,0.12), 0px 15px 35px 0px rgba(48,49,61,0.08)',
                        animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
                        transformOrigin: 'top center',
                        willChange: 'transform, opacity',
                      }}
                    >
                      {hiddenChips.map((chip) => (
                        <button
                          key={chip.id}
                          onClick={() => {
                            setIsMoreChipsOpen(false);
                            setIsFilterMenuOpen(true);
                            handleFilterClick(chip.filterName);
                          }}
                          className="relative bg-white inline-flex gap-[8px] h-[28px] items-center px-[8px] py-[6px] rounded-[6px] whitespace-nowrap cursor-pointer hover:bg-[#F5F6F8] w-full text-left"
                          style={{
                            fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                            border: '1px solid #EBEEF1',
                            transition: DEFAULT_TRANSITION,
                          }}
                        >
                          {/* Cancel icon */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFilterChip(chip.id);
                              if (hiddenChips.length === 1) setIsMoreChipsOpen(false);
                            }}
                            className="w-[12px] h-[12px] flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5.5" fill="#6C7688" stroke="#6C7688"/>
                              <path d="M4 4L8 8M8 4L4 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </span>

                          {/* Filter name */}
                          <span className="text-[12px] font-semibold leading-4 tracking-[-0.024px] text-[#6C7688] shrink-0">
                            {chip.filterName}
                          </span>

                          {/* Divider */}
                          <div className="w-[1px] h-[8px] bg-[#D8DEE4] shrink-0" />

                          {/* Selected values */}
                          <span className="text-[12px] font-semibold leading-4 tracking-[-0.024px] text-[#533AFD] shrink-0">
                            {filterChipValue(chip)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </AnimatePresence>
              
              {/* Add filter button */}
              <button
                ref={filterButtonRef}
                onClick={() => { setIsFilterMenuOpen(prev => !prev); setChipFilterAnchor(null); setCurrentPage('main'); }}
                onMouseEnter={() => setIsFilterBtnHovered(true)}
                onMouseLeave={() => setIsFilterBtnHovered(false)}
                className="relative flex gap-[8px] h-[28px] items-center px-[10px] py-[6px] rounded-[6px] cursor-pointer"
                style={{
                  backgroundColor: isFilterMenuOpen ? '#F4F7FA' : '#ffffff',
                  outline: `1px solid ${isFilterMenuOpen || isFilterBtnHovered ? '#D4DEE9' : '#EBEEF1'}`,
                  outlineOffset: '0px',
                  transition: 'background-color 100ms cubic-bezier(0.2, 0, 0.1, 1), outline-color 100ms cubic-bezier(0.2, 0, 0.1, 1)',
                }}
              >
                <img src="/dashboard-assets/icons/add-8.svg" alt="" style={{ width: '8px', height: '8px' }} />
                <span
                  className="text-[12px] font-semibold leading-4 tracking-[-0.024px] text-[#6C7688]"
                  style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif' }}
                >
                  Filter
                </span>
              </button>
            </div>

            {/* Filter Menu Popover */}
            {isFilterMenuOpen && (
              <div
                ref={filterMenuRef}
                className="bg-white rounded-[8px] shadow-[0px_5px_15px_0px_rgba(0,0,0,0.12),0px_15px_35px_0px_rgba(48,49,61,0.08)] overflow-hidden z-50 w-[260px]"
                style={chipFilterAnchor ? {
                  position: 'fixed',
                  left: chipFilterAnchor.left,
                  top: chipFilterAnchor.top + chipFilterAnchor.height + 8,
                  outline: '1px solid #D8DEE4',
                  outlineOffset: '0px',
                  animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
                  transformOrigin: 'top left',
                  willChange: 'transform, opacity',
                  maxHeight: '320px',
                } : {
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: '8px',
                  outline: '1px solid #D8DEE4',
                  outlineOffset: '0px',
                  animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
                  transformOrigin: 'top center',
                  willChange: 'transform, opacity',
                  maxHeight: '320px',
                }}
              >
                {/* Animated content container */}
                <div ref={filterContainerRef} className="relative overflow-hidden">
                  {/* Main page */}
                  <div
                    ref={contentRef}
                    className={`transition-transform duration-[100ms]`}
                    style={{
                      transform: currentPage === 'main' ? 'translateX(0)' : 'translateX(-100%)',
                      transitionTimingFunction: 'cubic-bezier(0.2, 0, 0.1, 1)'
                    }}
                  >
                    {/* Header + rows — single container with 4px padding */}
                    <div style={{ padding: '4px', position: 'relative' }}>
                      {/* Heading row */}
                      <div style={{ padding: '6px 10px' }}>
                        <p
                          style={{ 
                            fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            lineHeight: '20px',
                            color: '#1A2C44',
                            margin: 0,
                          }}
                        >
                          Filter
                        </p>
                      </div>

                      {/* Top scrim — appears below heading when rows have scrolled */}
                      {currentPage === 'main' && showTopScrollGradient && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none"
                          style={{
                            top: '36px', // heading row height (6+20+6 = 32px line + 4px padding = 36px)
                            height: '24px',
                            background: 'linear-gradient(to bottom, white, rgba(255,255,255,0))',
                            zIndex: 1,
                          }}
                        />
                      )}

                      {/* Scrollable option rows */}
                      <div 
                        ref={scrollContainerRef}
                        className="relative overflow-y-auto max-h-[280px]"
                      >
                        {filterOptions.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleFilterClick(option)}
                            className="w-full flex items-start px-[10px] py-[6px] rounded-[4px] hover:bg-[#F5F6F8] text-left cursor-pointer"
                            style={{ transition: DEFAULT_TRANSITION }}
                          >
                            <span
                              className="text-[14px] font-normal leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
                              style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif' }}
                            >
                              {option}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Gradient Scrim - only visible when not at bottom */}
                    {currentPage === 'main' && showScrollGradient && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[43px] pointer-events-none"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0), white)'
                        }}
                      />
                    )}
                  </div>

                  {/* Subpage - positioned absolutely to overlay; height is ref-controlled */}
                  <div
                    ref={filterSubpageRef}
                    className="absolute top-0 left-0 w-full transition-transform duration-[100ms] flex flex-col"
                    style={{
                      transform: currentPage === 'subpage' ? 'translateX(0)' : 'translateX(100%)',
                      transitionTimingFunction: 'cubic-bezier(0.2, 0, 0.1, 1)',
                    }}
                  >
                    {/* Header with back button */}
                    <div className="pt-[12px] px-[12px] flex items-center gap-[8px]">
                      {!chipFilterAnchor && (
                        <button
                          onClick={handleBack}
                          className="relative w-[28px] h-[28px] flex items-center justify-center rounded-[6px] hover:bg-[#F5F6F8] cursor-pointer"
                          style={{ 
                            transition: DEFAULT_TRANSITION,
                            outline: '1px solid #D8DEE4',
                            outlineOffset: '0px'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8L10 4" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                      <p
                        className="flex-1"
                        style={{ 
                          fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          lineHeight: '20px',
                          color: '#1A2C44',
                          margin: 0,
                        }}
                      >
                        {selectedFilter}
                      </p>
                    </div>

                    {/* ── Multi-select: scrollable checkbox list ── */}
                    {(subpageFilterDef?.type === 'multi-select' || subpageFilterDef == null) && (
                      <>
                        <div className="relative">
                          <div
                            ref={currentPage === 'subpage' ? scrollContainerRef : null}
                            className="overflow-y-auto pt-[16px] px-[4px]"
                            style={{ maxHeight: '280px', paddingBottom: showScrollGradient ? '68px' : '0' }}
                          >
                            {subpageOptions.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => toggleOption(option)}
                                className="w-full flex items-start gap-[6px] px-[10px] py-[6px] rounded-[4px] hover:bg-[#F5F6F8] text-left cursor-pointer"
                                style={{ transition: DEFAULT_TRANSITION }}
                              >
                                <div className="flex items-center justify-center h-[20px] shrink-0">
                                  <img
                                    src={selectedOptions.includes(option) ? '/dashboard-assets/icons/checkboxSelected.svg' : '/dashboard-assets/icons/checkboxPassive.svg'}
                                    alt=""
                                    style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0 }}
                                  />
                                </div>
                                <span
                                  className="text-[14px] font-normal leading-[20px] tracking-[-0.15px] text-[#1A2C44] flex-1"
                                  style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif' }}
                                >
                                  {option}
                                </span>
                              </button>
                            ))}
                          </div>
                          {currentPage === 'subpage' && showScrollGradient && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-[68px] pointer-events-none"
                              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), white)' }}
                            />
                          )}
                        </div>
                        <div className="sticky bottom-0 bg-white flex flex-col gap-[12px] pb-[12px] pt-[4px] px-[12px] mt-auto">
                          <button onClick={handleApply} className="w-full h-[28px] bg-[#675DFF] rounded-[6px] text-white text-[14px] font-semibold leading-[20px] tracking-[-0.15px] hover:bg-[#5648E0] cursor-pointer" style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', boxShadow: '0px 1px 1px 0px rgba(47, 14, 99, 0.32)', transition: DEFAULT_TRANSITION }}>Apply</button>
                        </div>
                      </>
                    )}

                    {/* ── Single-select: one-option dropdown ── */}
                    {subpageFilterDef?.type === 'single-select' && (
                      <>
                        <div style={{ padding: '16px 12px 12px' }}>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={filterSingleVal}
                              onChange={e => setFilterSingleVal(e.target.value)}
                              className="w-full bg-white border border-[#D8DEE4] hover:border-[#99A5B8] active:bg-[#F5F6F8] focus:outline-none cursor-pointer"
                              style={{
                                height: '28px', borderRadius: '6px',
                                padding: '0 26px 0 8px',
                                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                                fontSize: '14px', fontWeight: 600, letterSpacing: '-0.15px', color: '#1A2C44',
                                appearance: 'none',
                              }}
                            >
                              {subpageOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <img src="/dashboard-assets/icons/arrowUpDown12.svg" alt="" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: '12px', height: '12px' }} />
                          </div>
                        </div>
                        <div style={{ padding: '4px 12px 12px' }}>
                          <button onClick={handleApply} className="w-full h-[28px] bg-[#675DFF] rounded-[6px] text-white text-[14px] font-semibold leading-[20px] tracking-[-0.15px] hover:bg-[#5648E0] cursor-pointer" style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', boxShadow: '0px 1px 1px 0px rgba(47, 14, 99, 0.32)', transition: DEFAULT_TRANSITION }}>Apply</button>
                        </div>
                      </>
                    )}

                    {/* ── Date: operator + value + unit + timezone ── */}
                    {subpageFilterDef?.type === 'date' && (() => {
                      const FONT = 'SF Pro Text, system-ui, -apple-system, sans-serif';
                      const selectStyle: React.CSSProperties = {
                        height: '28px', borderRadius: '6px',
                        padding: '0 26px 0 8px',
                        fontFamily: FONT, fontSize: '14px', fontWeight: 600,
                        letterSpacing: '-0.15px', color: '#1A2C44',
                        appearance: 'none', cursor: 'pointer',
                      };
                      const SELECT_CLS = 'bg-white border border-[#D8DEE4] hover:border-[#99A5B8] active:bg-[#F5F6F8] focus:outline-none';
                      const SelectIcon = () => (
                        <img src="/dashboard-assets/icons/arrowUpDown12.svg" alt="" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: '12px', height: '12px' }} />
                      );
                      return (
                        <>
                          {/* Body */}
                          <div style={{ padding: '16px 4px 12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 8px' }}>

                              {/* Operator select */}
                              <div style={{ position: 'relative' }}>
                                <select
                                  value={filterDateOp}
                                  onChange={e => setFilterDateOp(e.target.value)}
                                  className={`w-full ${SELECT_CLS}`}
                                  style={selectStyle}
                                >
                                  {['is in the last', 'is equal to', 'is before', 'is after', 'is between'].map(o => (
                                    <option key={o}>{o}</option>
                                  ))}
                                </select>
                                <SelectIcon />
                              </div>

                              {/* Value + unit row */}
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {/* → arrow icon */}
                                <svg style={{ flexShrink: 0, color: '#474E5A' }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M1.5 6H10.5M10.5 6L7.5 3M10.5 6L7.5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>

                                {/* Number input — hide browser spinners via inline style */}
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={filterDateVal}
                                  onChange={e => setFilterDateVal(e.target.value.replace(/[^0-9]/g, ''))}
                                  onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
                                  style={{
                                    flex: 1, height: '28px', minWidth: 0,
                                    border: '1px solid #D8DEE4', borderRadius: '6px',
                                    padding: '0 8px', outline: 'none',
                                    fontFamily: FONT, fontSize: '14px',
                                    color: '#1A2C44', backgroundColor: 'white',
                                    boxShadow: '0px 1px 1px 0px rgba(33, 37, 44, 0.16)',
                                  }}
                                />

                                {/* Unit select — 70px fixed */}
                                <div style={{ position: 'relative', width: '70px', flexShrink: 0 }}>
                                  <select
                                    value={filterDateUnit}
                                    onChange={e => setFilterDateUnit(e.target.value)}
                                    className={SELECT_CLS}
                                    style={{ ...selectStyle, width: '70px' }}
                                  >
                                    {['days', 'weeks', 'months', 'years'].map(u => (
                                      <option key={u}>{u}</option>
                                    ))}
                                  </select>
                                  <SelectIcon />
                                </div>
                              </div>

                              {/* Time zone row */}
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ flex: 1, fontFamily: FONT, fontSize: '14px', lineHeight: '20px', letterSpacing: '-0.15px', color: '#596171' }}>
                                  Time zone
                                </span>
                                {(['GMT-8', 'UTC'] as const).map(tz => {
                                  const active = filterDateTz === tz;
                                  return (
                                    <button
                                      key={tz}
                                      onClick={() => setFilterDateTz(tz)}
                                      style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                      {/* Radio circle with top-shadow */}
                                      <div style={{ paddingTop: '3px', flexShrink: 0 }}>
                                        <div style={{
                                          width: '14px', height: '14px', borderRadius: '50%',
                                          border: `1px solid ${active ? '#675DFF' : '#D8DEE4'}`,
                                          backgroundColor: 'white',
                                          boxShadow: '0px 1px 1px 0px rgba(33, 37, 44, 0.16)',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          transition: 'border-color 120ms',
                                        }}>
                                          {active && (
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#675DFF' }} />
                                          )}
                                        </div>
                                      </div>
                                      <span style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 600, lineHeight: '20px', letterSpacing: '-0.15px', color: '#1A2C44' }}>
                                        {tz}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                            </div>
                          </div>

                          {/* Apply footer */}
                          <div style={{ padding: '4px 12px 12px' }}>
                            <button
                              onClick={handleApply}
                              className="w-full h-[28px] bg-[#675DFF] rounded-[6px] text-white text-[14px] font-semibold leading-[20px] tracking-[-0.15px] hover:bg-[#5648E0] cursor-pointer"
                              style={{ fontFamily: FONT, boxShadow: '0px 1px 1px 0px rgba(47, 14, 99, 0.32)', transition: DEFAULT_TRANSITION }}
                            >
                              Apply
                            </button>
                          </div>
                        </>
                      );
                    })()}

                    {/* ── Value: operator + free-text input ── */}
                    {subpageFilterDef?.type === 'value' && (() => {
                      const selStyle: React.CSSProperties = {
                        height: '28px', borderRadius: '6px',
                        padding: '0 26px 0 8px', fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                        fontSize: '14px', fontWeight: 600, letterSpacing: '-0.15px', color: '#1A2C44',
                        cursor: 'pointer', appearance: 'none',
                      };
                      return (
                        <>
                          <div style={{ padding: '16px 12px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Operator dropdown */}
                            <div style={{ position: 'relative' }}>
                              <select value={filterValueOp} onChange={e => setFilterValueOp(e.target.value)} className="w-full bg-white border border-[#D8DEE4] hover:border-[#99A5B8] active:bg-[#F5F6F8] focus:outline-none" style={selStyle}>
                                {['is equal to', 'is not equal to', 'is greater than', 'is less than', 'contains', 'does not contain'].map(o => <option key={o}>{o}</option>)}
                              </select>
                              <img src="/dashboard-assets/icons/arrowUpDown12.svg" alt="" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: '12px', height: '12px' }} />
                            </div>
                            {/* Value input */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <svg style={{ flexShrink: 0 }} width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <input
                                type="text"
                                value={filterValueInput}
                                onChange={e => setFilterValueInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
                                style={{
                                  flex: 1, height: '28px', border: '1px solid #D8DEE4', borderRadius: '6px',
                                  padding: '0 8px', fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                                  fontSize: '14px', color: '#1A2C44', backgroundColor: 'white', outline: 'none',
                                  minWidth: 0,
                                }}
                              />
                            </div>
                          </div>
                          <div style={{ padding: '4px 12px 12px' }}>
                            <button onClick={handleApply} className="w-full h-[28px] bg-[#675DFF] rounded-[6px] text-white text-[14px] font-semibold leading-[20px] tracking-[-0.15px] hover:bg-[#5648E0] cursor-pointer" style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', boxShadow: '0px 1px 1px 0px rgba(47, 14, 99, 0.32)', transition: DEFAULT_TRANSITION }}>Apply</button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Table Controls */}
          <div className="relative">
            <button
              ref={tableSettingsBtnRef}
              onClick={() => setIsTableSettingsOpen(v => !v)}
              className="table-settings-btn flex items-center justify-center cursor-pointer"
              style={{ width: noSearch ? '40px' : '44px', height: noSearch ? '40px' : '44px', borderRadius: noSearch ? '10px' : '12px', background: 'white' }}
            >
              <img src="/dashboard-assets/icons/table-controls.svg" alt="Table Controls" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            </button>

            {/* Table Settings Popover */}
            {isTableSettingsOpen && (
              <div
                ref={tableSettingsRef}
                className="absolute right-0 z-50 bg-white rounded-[12px] overflow-hidden"
                style={{
                  top: 'calc(100% + 8px)',
                  width: '280px',
                  maxHeight: '480px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                  fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                  animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
                  transformOrigin: 'top center',
                  willChange: 'transform, opacity',
                }}
              >
                {/* Header */}
                <div className="py-[8px] shrink-0">
                  <div className="px-[12px] py-[6px]">
                    <span style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', fontSize: '14px', fontWeight: 600, lineHeight: '20px', color: '#1A2C44' }}>Table settings</span>
                  </div>
                </div>
                <div style={{ height: '1px', background: '#EBEEF1', flexShrink: 0 }} />

                {/* Scrollable body */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {/* Wrap cells */}
                  <div className="py-[8px]">
                    <div className="flex items-center justify-between px-[12px] py-[6px]">
                      <span className="text-[14px] font-normal leading-5 text-[#1A2C44]">Wrap cells</span>
                      <button
                        className={`toggle-switch${wrapCells ? ' on' : ''}`}
                        onClick={() => setWrapCells(v => !v)}
                      />
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#EBEEF1' }} />

                  {/* Columns */}
                  <div className="py-[8px]">
                    <span className="block px-[15px] py-[4px] text-[12px] font-[600] leading-[16px] text-[#596171]">Columns</span>
                    <div className="px-[4px]">
                      {popoverColumns.map(col => {
                        const isOn = visibleColumns.has(col.id);
                        return (
                          <button
                            key={col.id}
                            onClick={() => toggleColumn(col.id)}
                            className="w-full flex items-center gap-[6px] px-[12px] py-[6px] hover:bg-[#F5F6F8] cursor-pointer rounded-[4px]"
                            style={{ background: 'none', border: 'none', textAlign: 'left' }}
                          >
                            {/* Mini checkbox */}
                            <img
                              src={isOn ? '/dashboard-assets/icons/checkboxSelected.svg' : '/dashboard-assets/icons/checkboxPassive.svg'}
                              alt=""
                              style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0 }}
                            />
                            <span className={`flex-1 min-w-0 text-[14px] leading-5 ${isOn ? 'text-[#1A2C44] font-normal' : 'text-[#8C95A6] font-normal'}`}>
                              {col.label}
                            </span>
                            {(col.type === 'metadata' || col.isMetadata) && (
                              <span style={{ flexShrink: 0, fontSize: '12px', fontWeight: 400, lineHeight: '16px', borderRadius: '4px', padding: '2px 6px', background: '#f4f7fa', color: '#50617a', outline: '1px solid #d4dee9' }}>
                                Metadata
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Views popover — single render, position:fixed so it's independent of which trigger opened it */}
      {isViewsPopoverOpen && (
        <div
          ref={viewsPopoverRef}
          className="fixed z-[200] bg-white rounded-[8px]"
          style={{
            top: popoverFixedPos.top,
            left: popoverFixedPos.left,
            width: '320px',
            border: '1px solid #D8DEE4',
            boxShadow: '0px 15px 35px rgba(48,49,61,0.08), 0px 5px 15px rgba(0,0,0,0.12)',
            fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
            animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
            transformOrigin: 'top center',
            willChange: 'transform, opacity',
          }}
        >
          {renderViewsPopoverContent()}
        </div>
      )}

      {/* List row submenu — rendered as a fixed sibling so it's unaffected by the popover's willChange/transform stacking context */}
      {isViewsPopoverOpen && listActionsChipId && submenuAnchor && (() => {
        const activeChip = viewChips.find(c => c.id === listActionsChipId);
        if (!activeChip) return null;
        const isDefaultAll = activeChip.id === primaryChipId;
        const isPredefined = predefinedChipIds.has(activeChip.id);
        const isPinned = pinnedViewIds.has(activeChip.id);
        const SUBMENU_W = 160;
        const GAP = 8;
        const fitsRight = (submenuAnchor.right + GAP + SUBMENU_W) <= window.innerWidth;
        const fixedLeft = fitsRight
          ? submenuAnchor.right + GAP
          : submenuAnchor.left - GAP - SUBMENU_W;
        const items: { label: string; color: string; hoverBg: string; onClick: () => void }[] = [
          ...(!isDefaultAll ? [{
            label: isPinned ? 'Hide' : 'Show on page',
            color: '#1A2C44', hoverBg: '#F4F7FA',
            onClick: () => {
              setPinnedViewIds(prev => {
                const next = new Set(prev);
                if (next.has(activeChip.id)) {
                  next.delete(activeChip.id);
                  if (activeChip.selected) selectChip(primaryChipId);
                } else {
                  next.add(activeChip.id);
                }
                return next;
              });
              setListActionsChipId(null); setSubmenuAnchor(null);
            },
          }] : []),
          {
            label: defaultChipId === activeChip.id ? 'Default' : 'Make default',
            color: defaultChipId === activeChip.id ? '#667691' : '#1A2C44', hoverBg: '#F4F7FA',
            onClick: () => {
              if (defaultChipId !== activeChip.id) setDefaultChipId(activeChip.id);
              setListActionsChipId(null); setSubmenuAnchor(null);
            },
          },
          ...(!isPredefined ? [
            {
              label: 'Rename', color: '#1A2C44', hoverBg: '#F4F7FA',
              onClick: () => {
                setRenameValue(activeChip.label);
                setRenameChipId(activeChip.id);
                setListActionsChipId(null); setSubmenuAnchor(null);
              },
            },
            {
              label: 'Delete', color: '#C0123C', hoverBg: '#FFF5F7',
              onClick: () => deleteChip(activeChip.id),
            },
          ] : []),
        ];
        return (
          <div
            ref={viewSubmenuRef}
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: submenuAnchor.top,
              left: fixedLeft,
              zIndex: 300,
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #D8DEE4',
              boxShadow: '0px 15px 35px 0px rgba(48,49,61,0.08), 0px 5px 15px 0px rgba(0,0,0,0.12)',
              minWidth: `${SUBMENU_W}px`,
              fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
            }}
          >
            <div style={{ padding: '4px' }}>
              {items.map(item => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px', border: 'none', cursor: 'pointer',
                    borderRadius: '4px', background: 'transparent',
                    fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                    fontSize: '14px', fontWeight: 400,
                    lineHeight: '20px', letterSpacing: '-0.15px', color: item.color,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = item.hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Placeholder empty state */}
      {activeTab.placeholder && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 16px', fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
            <span style={{ fontFamily: 'SF Pro Display, SF Pro Text, system-ui, sans-serif', fontSize: 20, fontWeight: 700, lineHeight: '28px', letterSpacing: '0.3px', color: '#000' }}>Add your first &lt;thing&gt;</span>
            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.15px', color: '#596171' }}>(This is a placeholder empty state)</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '4px 8px', background: '#675DFF', border: '1px solid #675DFF', borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, letterSpacing: '-0.15px', lineHeight: '20px', cursor: 'default', boxShadow: '0px 1px 1px 0px rgba(47,14,99,0.32)', fontFamily: 'inherit' }}>
            <img src="/dashboard-assets/icons/add12.svg" alt="" style={{ width: 12, height: 12, filter: 'brightness(0) invert(1)' }} />
            Add &lt;thing&gt;
          </button>
        </div>
      )}

      {/* Table */}
      <div
        ref={tableOuterRef}
        className="relative pt-[8px]"
        style={{ display: activeTab.placeholder ? 'none' : undefined }}
        onMouseMove={handleTableMouseMove}
        onMouseLeave={handleTableMouseLeave}
      >
        {/* Shimmer overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            pointerEvents: 'none', overflow: 'hidden',
            opacity: isTableLoading ? 1 : 0,
            transition: 'opacity 250ms cubic-bezier(0.2, 0, 0.1, 1)',
          }}
          onTransitionEnd={(e) => { if (e.target === e.currentTarget && !isTableLoading) setShimmerRunning(false); }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,var(--shimmer-s1)) 0%, rgba(255,255,255,var(--shimmer-s2)) 50%, rgba(255,255,255,var(--shimmer-s3)) 100%)',
            animation: shimmerRunning ? 'shimmerPulse 2s linear infinite' : 'none',
          }} />
        </div>

      <table
        ref={tableElRef}
        className={`data-table border-separate border-spacing-0${dragColId ? ' no-row-hover' : ''}`}
        style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', tableLayout: 'fixed', width: '100%', fontVariantNumeric: 'tabular-nums', userSelect: resizingCol ? 'none' : 'auto', borderSpacing: 0, position: 'relative', marginBottom: '20px' }}
      >
        <colgroup>
          {bulkSelectCheckboxes ? <col style={{ width: '40px' }} /> : null}
          {columnOrder.flatMap(colId => {
            if (!visibleColumns.has(colId)) return [];
            // Skip stale column IDs that don't belong to the current tab
            if (!colMeta[colId]) return [];
            const colType = colMeta[colId]?.type;
            // width === 0 is the Fit sentinel: omit the width style so the browser auto-sizes.
            const fitCol = (columnWidths[colId] ?? 0) === 0;
            if (colType === 'currency') return [
              <col key={`col-${colId}-val`}  data-col-id={colId} style={fitCol ? {} : { width: `${(columnWidths[colId] ?? 200) - 56}px` }} />,
              <col key={`col-${colId}-code`} style={{ width: '56px' }} />,
            ];
            if (colType === 'date') return [
              <col key={`col-${colId}-1`} style={{ width: '1px' }} />,
              <col key={`col-${colId}-2`} data-col-id={colId} style={fitCol ? {} : { width: `${columnWidths[colId]}px` }} />,
            ];
            return [<col key={`col-${colId}`} data-col-id={colId} style={fitCol ? {} : { width: `${columnWidths[colId]}px` }} />];
          })}
          <col />
          <col style={{ width: '40px' }} />
        </colgroup>
        <thead
          ref={theadRef}
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
          style={{
            position: 'sticky', top: 'var(--sticky-bar-h, 0px)', zIndex: 4,
            boxShadow: isScrolled ? '0 8px 32px 0px rgba(255,255,255,1)' : 'none',
            transition: 'box-shadow 150ms cubic-bezier(0.2, 0, 0.1, 1)',
          }}
        >
          {(() => {
            const hdrBase = 'text-[12px] font-semibold leading-4 tracking-[0px]';
            const hdrBg: React.CSSProperties = {
              position: 'relative',
            };

            const sortIcon = (colId: string) => {
              if (sortCol !== colId) return null;
              return (
                <img
                  src="/dashboard-assets/icons/arrowDown.svg"
                  alt=""
                  style={{
                    display: 'inline',
                    width: '10px',
                    height: '10px',
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                    position: 'relative',
                    top: '-1px',
                    flexShrink: 0,
                    transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none',
                  }}
                />
              );
            };

            const visibleColOrder = columnOrder.filter(c => visibleColumns.has(c));
            const lastVisibleColId = visibleColOrder[visibleColOrder.length - 1];

            return (
              <tr className="h-[32px]" style={{ backgroundColor: '#FFFFFF' }}>
                {bulkSelectCheckboxes ? (
                <th
                  style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #ECF1F6', position: 'sticky', left: 0, zIndex: 3, width: '40px', padding: 0, textAlign: 'center', verticalAlign: 'middle' }}
                >
                  {/* L1: white blocker */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px', background: 'white', pointerEvents: 'none' }} />
                  {/* L2: perma rounded cap */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px', background: 'white', borderRadius: '8px 0 0 8px', pointerEvents: 'none' }} />
                  {/* L3: gradient scrim */}
                  <div className="header-left-scrim" style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '88px', borderRadius: '8px 0 0 8px', pointerEvents: 'none' }} />
                  <div style={{ width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={toggleSelectAll}>
                    <img
                      src={allSelected ? '/dashboard-assets/icons/checkboxSelected.svg' : someSelected ? '/dashboard-assets/icons/checkboxIndeterminate.svg' : '/dashboard-assets/icons/checkboxPassive.svg'}
                      alt="Select all"
                      style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0 }}
                    />
                  </div>
                </th>
                ) : null}
                {(() => {
                  // Only the rightmost frozen column gets the right-side separator border.
                  const lastFrozenHdrColId = [...columnOrder].reverse().find(id => visibleColumns.has(id) && frozenColumns.has(id));
                  return columnOrder.map(colId => {
                  if (!visibleColumns.has(colId)) return null;
                  const meta = colMeta[colId];
                  // colMeta only contains the active tab's columns — stale columnOrder IDs
                  // from the previous tab are skipped until the layout effect corrects state.
                  if (!meta) return null;
                  const isFrozenHdr = frozenColumns.has(colId);
                  const frozenHdrStyle: React.CSSProperties = isFrozenHdr
                    ? { position: 'sticky', left: `var(--fl-${colId})`, zIndex: 3, backgroundColor: '#FFFFFF', borderRight: colId === lastFrozenHdrColId ? '1px solid #E0E6EF' : undefined }
                    : {};
                  return (
                    <th
                      key={colId}
                      data-col-id={colId}
                      colSpan={meta.colSpan}
                      className={`col-header px-[16px] text-${meta.align} ${hdrBase}`}
                      style={{ ...hdrBg, ...frozenHdrStyle }}
                      onMouseDown={e => handleColMouseDown(e, colId)}
                      onClick={e => { if (!dragColHappenedRef.current) openColumnMenu(e, colId); }}
                    >
                      <span style={{ opacity: (isTableLoading || foreverLoading || dragColId === colId) ? 0 : 1, transition: isTableLoading ? 'none' : 'opacity 150ms cubic-bezier(0.2, 0, 0.1, 1)' }}>
                        {meta.label}{sortIcon(colId)}
                      </span>
                      {columnResizeStyle === 'header' && colId !== lastVisibleColId && (
                        <div style={{
                          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                          width: '1px', height: '12px', background: '#D4DEE9', pointerEvents: 'none',
                          opacity: (isHeaderHovered || resizingCol === colId) ? 1 : 0,
                          transition: 'opacity 200ms cubic-bezier(0.2, 0, 0.1, 1)',
                        }} />
                      )}
                    </th>
                  );
                });
                })()}
                {/* True filler — absorbs remaining table width so data columns stay at exact pixel widths */}
                <th style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #ECF1F6' }} />
                {/* Sticky right endcap for header — must be last cell so it sits at the far right edge */}
                <th style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #ECF1F6', position: 'sticky', right: 0, zIndex: 3, width: '40px' }}>
                  {/* L1: white blocker */}
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '12px', background: 'white', pointerEvents: 'none' }} />
                  {/* L2: perma rounded cap */}
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '12px', background: 'white', borderRadius: '0 8px 8px 0', pointerEvents: 'none' }} />
                  {/* L3: gradient scrim */}
                  <div className="header-right-scrim" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '88px', borderRadius: '0 8px 8px 0', pointerEvents: 'none' }} />
                </th>
              </tr>
            );
          })()}
        </thead>
        <tbody style={{ opacity: (isTableLoading && !isInitialLoad) ? 0 : 1, transition: (isTableLoading && !isInitialLoad) ? 'none' : 'opacity 100ms cubic-bezier(0.2, 0, 0.1, 1)' }}>
          {filteredRows.map(({ row, originalIndex }, i) => (
            <TableRow
              key={originalIndex}
              row={row}
              originalIndex={originalIndex}
              isSelected={selectedRows.has(originalIndex)}
              prevSelected={selectedRows.has(filteredRows[i - 1]?.originalIndex ?? -1)}
              nextSelected={selectedRows.has(filteredRows[i + 1]?.originalIndex ?? -1)}
              isLastRow={i === filteredRows.length - 1}
              isZebra={false}
              isSkeletonLoading={(isTableLoading && isInitialLoad) || foreverLoading}
              dragColId={dragColId}
              columnOrder={columnOrder}
              visibleColumns={visibleColumns}
              wrapCells={wrapCells}
              onToggleSelect={toggleRowSelected}
              hasSelectionRef={hasSelectionRef}
              onRowClick={handleRowClick}
              frozenColumns={frozenColumns}
              columnWidths={columnWidths}
              columnDragStyle={columnDragStyle}
              columnDefs={activeTab.columns}
              rowActions={activeTab.rowActions ?? []}
              onRowAction={handleRowAction}
              consoleFocused={false}
              bulkSelectCheckboxes={bulkSelectCheckboxes}
              rowHref={
                activeTab.rowHrefField && activeTab.rowHrefMap
                  ? (activeTab.rowHrefMap[row[activeTab.rowHrefField] as string] ?? activeTab.rowHrefDefault ?? null)
                  : (activeTab.rowHrefDefault ?? null)
              }
            />
          ))}
        </tbody>
      </table>
        {/* Full-height column hover/resize divider — only used in 'full' resize mode */}
        {columnResizeStyle === 'full' && (
          <div
            className="absolute"
            style={{
              top: '8px',
              bottom: '8px',
              left: `${(colDivider ?? lastColDivider.current).x}px`,
              width: '24px',
              transform: 'translateX(-12px)',
              opacity: colDivider !== null || resizingCol !== null ? 1 : 0,
              transition: 'opacity 200ms cubic-bezier(0.2, 0, 0.1, 1)',
              zIndex: 15,
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ width: '1px', background: resizingCol ? '#D4DEE9' : '#ECF1F6', transition: 'background 100ms cubic-bezier(0.2, 0, 0.1, 1)' }} />
          </div>
        )}

      </div>

      </div>{/* end tableScrollRef */}

      {/* Floating action bar — Console AI-native */}
      {(() => {
        // Filter context: non-"all" view chip with no rows selected
        const isFilterView = selectedChip != null && selectedChip.id !== primaryChipId;
        const filterContext = isFilterView ? { label: selectedChip!.label, count: TOTAL_RESULTS } : null;
        const filterBarActive = filterContext != null && selectedRows.size === 0;

        if (!(barVisible || omnibarOpen || filterBarActive) || !bulkSelectCheckboxes) return null;

        // Keep snapshot fresh while bar is active; freeze it once exit begins
        if (!barExiting) {
          if (selectedRows.size > 0) {
            barSnapshotRef.current = { selectedCount: selectedRows.size, refundableCount: refundableSelected };
            barRowDataRef.current = Array.from(selectedRows)
              .map(i => tableRows[i])
              .filter((r): r is Record<string, unknown> => r != null);
          } else if (omnibarOpen || filterBarActive) {
            barRowDataRef.current = [];
          }
        }

        // Below 1220px, shift the bar up when pagination is visible so they don't overlap.
        const paginationActive = (paginationShown || paginationSticky) && windowWidth < 1220;
        const paginationShift = 48 + (showScrollbar ? SCROLLBAR_H - 1 : 0);
        const restY = paginationActive ? -paginationShift : 0;
        const exitY = paginationActive ? -(paginationShift - 12) : 12;
        const initY = paginationActive ? -(paginationShift - 12) : 12;

        const BAR_WIDTH = 660;

        return (
          <motion.div
            initial={{ opacity: 0, y: initY }}
            animate={{ opacity: barExiting ? 0 : 1, y: barExiting ? exitY : restY }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0.1, 1] }}
            style={{
              position: 'fixed',
              bottom: '32px',
              left: `calc(${paginationLeft / 2}px + 50vw - ${BAR_WIDTH / 2}px)`,
              width: `${BAR_WIDTH}px`,
              zIndex: 10000,
              background: '#0D0F12',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0px 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            <DashboardConsoleActionBar
              rowData={barRowDataRef.current}
              filterContext={selectedRows.size === 0 ? filterContext : null}
              onClear={() => { setSelectedRows(new Set()); setOmnibarOpen(false); lastClickedIndexRef.current = null; }}
            />
          </motion.div>
        );
      })()}

      {/* Column header context menu */}
      {columnMenu && (
        <div
          ref={columnMenuRef}
          style={{
            position: 'fixed',
            top: columnMenu.y,
            left: columnMenu.x,
            zIndex: 200,
            background: 'white',
            border: '1px solid #D8DEE4',
            borderRadius: '8px',
            boxShadow: '0px 5px 15px 0px rgba(0,0,0,0.12), 0px 15px 35px 0px rgba(48,49,61,0.08)',
            minWidth: '180px',
            overflow: 'hidden',
            padding: '4px',
            animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
            transformOrigin: 'top center',
            willChange: 'transform, opacity',
          }}
        >
          {[
            {
              label: 'Sort ascending',
              icon: <img src="/dashboard-assets/icons/up16.svg" width={16} height={16} alt="" style={{ display: 'block' }} />,
              action: () => { setSortCol(columnMenu.colId); setSortDir('asc'); setColumnMenu(null); },
            },
            {
              label: 'Sort descending',
              icon: <img src="/dashboard-assets/icons/down16.svg" width={16} height={16} alt="" style={{ display: 'block' }} />,
              action: () => { setSortCol(columnMenu.colId); setSortDir('desc'); setColumnMenu(null); },
            },
            {
              label: frozenColumns.has(columnMenu.colId) ? 'Unpin' : 'Pin',
              icon: <img src="/dashboard-assets/icons/pin16.svg" width={16} height={16} alt="" style={{ display: 'block' }} />,
              action: () => {
                const colId = columnMenu.colId;
                if (!frozenColumns.has(colId)) {
                  // Move the column to just after any already-frozen columns, then mark it frozen.
                  setColumnOrder(prev => {
                    const without = prev.filter(id => id !== colId);
                    const insertAt = without.filter(id => frozenColumns.has(id)).length;
                    without.splice(insertAt, 0, colId);
                    return without;
                  });
                  setFrozenColumns(prev => { const n = new Set(prev); n.add(colId); return n; });
                } else {
                  // Unfreeze: remove from frozen set; column stays in its current position.
                  setFrozenColumns(prev => {
                    const next = new Set(prev);
                    next.delete(colId);
                    return next;
                  });
                }
                setColumnMenu(null);
              },
            },
            {
              label: 'Hide',
              icon: <img src="/dashboard-assets/icons/hide16.svg" width={16} height={16} alt="" style={{ display: 'block' }} />,
              action: () => {
                setVisibleColumns(prev => { const n = new Set(prev); n.delete(columnMenu.colId); return n; });
                setColumnMenu(null);
              },
            },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onMouseDown={(e) => { e.preventDefault(); action(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '6px 10px',
                background: 'none', border: 'none', borderRadius: '4px',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: '"SF Pro Text", system-ui, -apple-system, sans-serif',
                fontSize: '14px', fontWeight: 400, color: '#1A2C44',
                letterSpacing: '-0.15px', lineHeight: '20px',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F6F8')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', flexShrink: 0 }}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Custom horizontal scrollbar — sits above the GlobalFooter for non-trackpad users */}
      {showScrollbar && (
        <div
          ref={fixedScrollbarRef}
          className="fixed-scrollbar"
          style={{ left: paginationLeft, width: tableClientWidth }}
        >
          <div ref={scrollbarThumbRef} className="fixed-scrollbar-thumb" />
        </div>
      )}

      {/* ── Pagination overlay ─────────────────────────────────────────────────
          position:fixed at bottom-0 (z-9998, behind GlobalFooter at z-9999).
          Slides up translateY(-48px) to sit just above the GlobalFooter.
          Three triggers: scroll-to-table-bottom, hover bottom-32px, sticky-after-page-turn. */}
      <div
        ref={paginationOverlayRef}
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: paginationLeft,
          right: 0,
          zIndex: 9998,
          background: 'white',
          fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
          transform: (paginationShown || paginationSticky) ? `translateY(-${48 + (showScrollbar ? SCROLLBAR_H - 1 : 0)}px)` : 'translateY(8px)',
          transition: 'transform 200ms cubic-bezier(0.2, 0, 0.1, 1)',
          willChange: 'transform',
        }}
        onMouseEnter={() => setPaginationShown(true)}
        onMouseLeave={() => {
          setPaginationSticky(false);
          if (!isAtTableBottom()) setPaginationShown(false);
        }}
      >
        <div style={{ borderTop: '1px solid #ECF1F6', display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 24px', position: 'relative' }}>
          {/* Arrows — left side */}
          {/* Prev button */}
          <button
            onClick={() => { setPaginationPage(p => Math.max(1, p - 1)); setPaginationSticky(true); }}
            disabled={paginationPage === 1}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '10px', borderRadius: '4px', border: 'none', background: 'none',
              cursor: paginationPage === 1 ? 'default' : 'pointer',
              opacity: paginationPage === 1 ? 0.5 : 1,
              transition: 'opacity 150ms cubic-bezier(0.2, 0, 0.1, 1)',
            }}
            aria-label="Previous page"
          >
            <img src="/dashboard-assets/icons/chevronRight8.svg" alt="" style={{ width: '8px', height: '8px', display: 'block', transform: 'rotate(180deg)' }} />
          </button>
          {/* Next button */}
          <button
            onClick={() => { setPaginationPage(p => Math.min(totalPages, p + 1)); setPaginationSticky(true); }}
            disabled={paginationPage >= totalPages}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '10px', borderRadius: '4px', border: 'none', background: 'none',
              cursor: paginationPage >= totalPages ? 'default' : 'pointer',
              opacity: paginationPage >= totalPages ? 0.5 : 1,
              transition: 'opacity 150ms cubic-bezier(0.2, 0, 0.1, 1)',
            }}
            aria-label="Next page"
          >
            <img src="/dashboard-assets/icons/chevronRight8.svg" alt="" style={{ width: '8px', height: '8px', display: 'block' }} />
          </button>

          {/* Results count — right of arrows */}
          <div style={{ position: 'relative' }}>
            <button
              ref={pageSizeTriggerRef}
              onClick={() => setPageSizeMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '6px 8px', borderRadius: '6px', border: 'none',
                background: pageSizeMenuOpen ? '#F4F7FA' : 'transparent',
                cursor: 'pointer',
                fontSize: '12px', fontWeight: 400, lineHeight: '16px', color: '#596171',
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                transition: 'background 100ms cubic-bezier(0.2, 0, 0.1, 1)',
              }}
              onMouseEnter={e => { if (!pageSizeMenuOpen) e.currentTarget.style.background = '#F4F7FA'; }}
              onMouseLeave={e => { if (!pageSizeMenuOpen) e.currentTarget.style.background = 'transparent'; }}
            >
              {TOTAL_RESULTS === 0
                ? 'No results'
                : `${((paginationPage - 1) * pageSize + 1).toLocaleString()}–${Math.min(paginationPage * pageSize, TOTAL_RESULTS).toLocaleString()} of ${TOTAL_RESULTS.toLocaleString()} results`}
            </button>
            {/* Rows-per-page popover */}
            {pageSizeMenuOpen && (
              <div
                ref={pageSizeMenuRef}
                style={{
                  position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 200,
                  background: 'white', border: '1px solid #D8DEE4', borderRadius: '8px',
                  boxShadow: '0px 5px 15px 0px rgba(0,0,0,0.12), 0px 15px 35px 0px rgba(48,49,61,0.08)',
                  minWidth: '140px', overflow: 'hidden', padding: '4px',
                  animation: 'popoverInUp 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
                  transformOrigin: 'bottom center', willChange: 'transform, opacity',
                }}
              >
                <div style={{ padding: '6px 10px', fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1A2C44', lineHeight: '20px' }}>
                  Rows per page
                </div>
                {[25, 50, 100].map(size => (
                  <button
                    key={size}
                    onMouseDown={e => { e.preventDefault(); setPageSize(size); setPaginationPage(1); setPageSizeMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '6px 10px', background: 'none', border: 'none',
                      borderRadius: '4px', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                      fontSize: '14px', fontWeight: 400, color: '#1A2C44', letterSpacing: '-0.15px', lineHeight: '20px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F6F8')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>{size}</span>
                    {pageSize === size && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3.5C8.5 5.5 7 7.5 5.5 9L2 6" stroke="#533AFD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chip right-click context menu */}
      {chipContextMenu && (() => {
        const chip = viewChips.find(c => c.id === chipContextMenu.chipId);
        if (!chip) return null;
        const isDefaultAll = chip.id === primaryChipId;
        const isPredefined = predefinedChipIds.has(chip.id);
        const FONT = 'SF Pro Text, system-ui, -apple-system, sans-serif';
        const isPinned = pinnedViewIds.has(chip.id);
        const menuItems: { label: string; color: string; hoverBg: string; onClick: () => void }[] = [
          ...(!isDefaultAll ? [
            {
              label: isPinned ? 'Hide' : 'Show on page',
              color: '#1A2C44',
              hoverBg: '#F4F7FA',
              onClick: () => {
                setPinnedViewIds(prev => {
                  const next = new Set(prev);
                  if (next.has(chip.id)) {
                    next.delete(chip.id);
                    if (chip.selected) selectChip(primaryChipId);
                  } else {
                    next.add(chip.id);
                  }
                  return next;
                });
                setChipContextMenu(null);
              },
            },
          ] : []),
          {
            label: defaultChipId === chip.id ? 'Default' : 'Make default',
            color: defaultChipId === chip.id ? '#667691' : '#1A2C44',
            hoverBg: '#F4F7FA',
            onClick: () => {
              if (defaultChipId !== chip.id) { setDefaultChipId(chip.id); }
              setChipContextMenu(null);
            },
          },
          ...(!isPredefined ? [
            {
              label: 'Rename',
              color: '#1A2C44',
              hoverBg: '#F4F7FA',
              onClick: () => { setChipRenameValue(chip.label); setChipRenameId(chip.id); setChipContextMenu(null); },
            },
            {
              label: 'Delete',
              color: '#C0123C',
              hoverBg: '#FFF5F7',
              onClick: () => { deleteChip(chip.id); setChipContextMenu(null); },
            },
          ] : []),
        ];
        // Clamp so menu doesn't go off-screen
        const menuW = 160, menuH = menuItems.length * 36 + 8;
        const x = Math.min(chipContextMenu.x, window.innerWidth - menuW - 8);
        const y = Math.min(chipContextMenu.y, window.innerHeight - menuH - 8);
        return (
          <div
            ref={chipContextMenuRef}
            style={{
              position: 'fixed', top: y, left: x, zIndex: 10001,
              background: 'white', borderRadius: '8px',
              border: '1px solid #D8DEE4',
              boxShadow: '0px 15px 35px 0px rgba(48,49,61,0.08), 0px 5px 15px 0px rgba(0,0,0,0.12)',
              minWidth: `${menuW}px`, padding: '4px',
              fontFamily: FONT,
              animation: 'popoverIn 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
              transformOrigin: 'top left',
            }}
          >
            {menuItems.map(item => (
              <button
                key={item.label}
                onMouseDown={e => { e.preventDefault(); item.onClick(); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 10px', border: 'none', borderRadius: '4px',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: FONT, fontSize: '14px', fontWeight: 400,
                  color: item.color, letterSpacing: '-0.15px', lineHeight: '20px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = item.hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {item.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Column drag ghost — full column lifted, follows cursor */}
      {dragColId && (() => {
        const colWidth = columnWidths[dragColId] || 160; // 0 = Fit sentinel, fall back to 160
        const ghostColDef = activeTab.columns.find(c => c.id === dragColId);
        const isRight = (ghostColDef?.align ?? 'left') === 'right';

        const renderGhostCell = (ghostColId: string, row: TableRowData) => {
          const base: React.CSSProperties = {
            fontSize: '14px', fontWeight: 400, color: '#1A2C44',
            letterSpacing: '-0.15px', lineHeight: '20px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          };
          const gColDef = activeTab.columns.find(c => c.id === ghostColId);
          switch (gColDef?.type ?? ghostColId) {
            case 'currency': {
              const vKey = gColDef?.dataKeys?.['value'] ?? ghostColId;
              const cKey = gColDef?.dataKeys?.['code']  ?? `${ghostColId}-code`;
              return (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4px' }}>
                  <span style={{ ...base, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{String(row[vKey] ?? '')}</span>
                  <span style={{ ...base, color: '#50617A' }}>{String(row[cKey] ?? '')}</span>
                </div>
              );
            }
            case 'status': {
              const statusVal  = String(row[ghostColId] ?? '');
              const badgeStyle = gColDef?.statusMap?.[statusVal] ?? DEFAULT_STATUS_STYLE;
              return (
                <span style={{ fontSize: '12px', fontWeight: 400, display: 'inline-flex', alignItems: 'center', padding: '0 8px', height: '20px', borderRadius: '4px', whiteSpace: 'nowrap', ...badgeStyle }}>
                  {statusVal}
                </span>
              );
            }
            case 'color-text': {
              const ctVal   = String(row[ghostColId] ?? '');
              const ctColor = gColDef?.statusMap?.[ctVal]?.color ?? '#1A2C44';
              return <span style={{ ...base, color: ctColor }}>{ctVal}</span>;
            }
            case 'color-coded': {
              const vKey = gColDef?.dataKeys?.['value'] ?? ghostColId;
              const pKey = gColDef?.dataKeys?.['positive'] ?? `${ghostColId.replace('color-coded', 'color')}-positive`;
              const isPos = Boolean(row[pKey]);
              return <span style={{ ...base, display: 'block', textAlign: 'right', color: isPos ? '#1A5C1F' : '#991B1B', fontVariantNumeric: 'tabular-nums' }}>{isPos ? '+' : '-'}{String(row[vKey] ?? '')}</span>;
            }
            case 'numerical':
              return <span style={{ ...base, display: 'block', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{String(row[ghostColId] ?? '')}</span>;
            case 'basic-text':
            case 'metadata':
              return <span style={base}>{String(row[ghostColId] ?? '')}</span>;
            case 'icon-box':
              return <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F4F7FA', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={gColDef?.iconSrc ?? '/dashboard-assets/icons/product16.svg'} alt="" style={{ width: '16px', height: '16px', display: 'block' }} /></div><span style={base}>{String(row[ghostColId] ?? '')}</span></div>;
            case 'image':
              return <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}><img src="/dashboard-assets/icons/whiteTee.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div><span style={base}>{String(row[ghostColId] ?? '')}</span></div>;
            case 'date':        return <span style={base}>{String(row[ghostColId] ?? '')}</span>;
            case 'inline-icon': return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><img src={gColDef?.iconSrc ?? '/dashboard-assets/icons/product16.svg'} alt="" style={{ width: '16px', height: '16px', flexShrink: 0 }} /><span style={base}>{String(row[ghostColId] ?? '')}</span></div>;
            case 'link':        return <span style={base}>{String(row[ghostColId] ?? '')}</span>;
            case 'brand-icon': {
              const gSecondaryKey = gColDef?.dataKeys?.['secondary'] ?? `${ghostColId}-secondary`;
              const gHasSecondary = Boolean(row[gSecondaryKey]);
              const gSecondaryIconSrc = gColDef?.secondaryIconSrc ?? '/dashboard-assets/icons/link.svg';
              const gBrandDisplayVal = gHasSecondary ? String(row[ghostColId] ?? '') : `•••${String(row[ghostColId] ?? '')}`;
              return <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{gHasSecondary && <img src={gSecondaryIconSrc} alt="" style={{ flexShrink: 0, display: 'block' }} />}<img src={gColDef?.iconSrc ?? '/dashboard-assets/icons/brandIcon16.svg'} alt="" style={{ flexShrink: 0, display: 'block' }} /><span style={base}>{gBrandDisplayVal}</span></div>;
            }
            case 'location':    return <span style={base}>{String(row[ghostColId] ?? '')}</span>;
            case 'id':          return <span style={{ ...base, fontSize: '14px' }}>{String(row[ghostColId] ?? '')}</span>;
            case 'agg-list': {
              const listKey  = gColDef?.dataKeys?.['list'] ?? `${ghostColId.replace('agg-list', 'agg')}-all`;
              const gItems   = Array.isArray(row[listKey]) ? (row[listKey] as string[]) : [];
              const [gVis, gHid] = computeAggVisible(gItems, (columnWidths[ghostColId] || 200) - 32); // 0 = Fit sentinel
              return <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{gVis.length > 0 && <span style={base}>{gVis.join(', ')}</span>}{gHid > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', border: '1px solid #ECF1F6', borderRadius: '4px', fontSize: '12px', lineHeight: '16px', color: '#50617A', flexShrink: 0, whiteSpace: 'nowrap' }}>+{gHid}</span>}</div>;
            }
            case 'subtext': { const amtKey = gColDef?.dataKeys?.['amount'] ?? `${ghostColId}-amt`; return <span style={base}>{String(row[amtKey] ?? '')}</span>; }
            case 'more-info':   return <span style={base}>{String(row[ghostColId] ?? '')}</span>;
            default:            return null;
          }
        };

        const initPos = ghostPosRef.current;
        const ox = dragColClickOffsetRef.current.x;
        const oy = dragColClickOffsetRef.current.y;
        const isGlass = columnDragStyle === 'glass';

        return (
          <div
            ref={ghostElRef}
            style={{
              position: 'fixed',
              left: initPos ? initPos.x - ox - 8 : -9999,
              top: initPos ? initPos.y - oy - 8 : -9999,
              // Clip to visible viewport — prevents the ghost from hanging below the footer
              // when many rows remain. ghostTop ≈ initPos.y - oy - 8; subtract 48px footer.
              maxHeight: initPos ? `calc(100vh - ${initPos.y - oy - 8}px - 48px)` : undefined,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 9999,
              borderRadius: '16px',
              padding: '8px',
              animation: isGlass ? 'ghostGlassIn 150ms cubic-bezier(0.2, 0, 0.1, 1) forwards' : 'ghostCardIn 150ms cubic-bezier(0.2, 0, 0.1, 1) forwards',
              width: `${colWidth + 16}px`,
              userSelect: 'none',
              fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
              ...(isGlass ? {
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                background: 'rgba(250,250,250,0.5)',
                border: '1px solid white',
                boxShadow: '0px 4px 50px 0px rgba(0,0,0,0.1)',
              } : {}),
            }}
          >
            {/* Header */}
            <div style={{
              backgroundColor: '#fff',
              borderBottom: '1px solid #ECF1F6',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isRight ? 'flex-end' : 'flex-start',
              padding: '0 8px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#596171', letterSpacing: '-0.024px', lineHeight: '16px', whiteSpace: 'nowrap' }}>
                {colMeta[dragColId].label}
              </span>
            </div>
            {/* Rows — start from the first visible row to mirror the scrolled state */}
            {filteredRows.slice(dragGhostRowOffsetRef.current).map(({ row }, i) => (
              <div key={i} style={{
                backgroundColor: isGlass ? 'transparent' : '#fff',
                borderBottom: isGlass ? undefined : '1px solid #ECF1F6',
                borderRadius: '0px',
                padding: '12px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isRight ? 'flex-end' : 'flex-start',
                overflow: 'hidden',
                opacity: isGlass ? 0 : 1,
              }}>
                {renderGhostCell(dragColId, row)}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Chip drag ghost — elevated card that follows the cursor */}
      {dragChipId && (() => {
        const chip = viewChips.find(c => c.id === dragChipId);
        if (!chip) return null;
        const FONT = 'SF Pro Text, system-ui, -apple-system, sans-serif';
        return (
          <div
            ref={chipGhostRef}
            style={{
              position: 'fixed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'white',
              border: '1px solid #EBEEF1',
              boxShadow: '0px 15px 35px rgba(48,49,61,0.08), 0px 5px 15px rgba(0,0,0,0.12)',
              pointerEvents: 'none',
              zIndex: 9999,
              left: `${chipGhostPosRef.current.x}px`,
              top: `${chipGhostPosRef.current.y}px`,
              fontFamily: FONT,
              whiteSpace: 'nowrap',
              cursor: 'grabbing',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, lineHeight: '20px', letterSpacing: '-0.15px', color: '#596171' }}>
              {chip.label}
            </span>
            {includeViewTotals && chipRowCounts[chip.id] && (
              <span style={{ fontSize: '14px', fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.15px', color: '#596171' }}>
                {chipRowCounts[chip.id]}
              </span>
            )}
          </div>
        );
      })()}

      {/* Drop line indicator for Line drag mode */}
      <div
        ref={lineIndicatorRef}
        style={{
          display: 'none',
          position: 'fixed',
          width: '2px',
          backgroundColor: '#1A2C44',
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translateX(-1px)',
          borderRadius: '1px',
        }}
      />

      {/* Save badge — portalled to body, pops at the top-right corner of the selected chip */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {saveBadge && (
            <motion.img
              key="chip-save-badge"
              src="/dashboard-assets/icons/checkCircleFilledStroked.svg"
              alt=""
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: -45 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
              style={{
                position: 'fixed',
                top: saveBadge.y,
                left: saveBadge.x,
                width: 20,
                height: 20,
                pointerEvents: 'none',
                zIndex: 10002,
              }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Save toast — portalled to body, slides up from bottom-center above the footer */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {saveToast && (
            <motion.div
              key="chip-save-toast"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
              style={{
                position: 'fixed',
                bottom: '16px',
                left: '50%',
                translateX: '-50%',
                zIndex: 10002,
                background: '#273951',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '20px',
                letterSpacing: '-0.15px',
                fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0px 5px 15px 0px rgba(0,0,0,0.12), 0px 15px 35px 0px rgba(48,49,61,0.08)',
              }}
            >
              {`Changes saved to "${saveToast.label}"`}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
