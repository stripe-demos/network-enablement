import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BarChart } from './BarChart';
import { Chart } from './Chart';

function defaultRowSizes(n) {
  if (n === 2) return [1, 1];
  if (n === 3) return [1, 2];
  if (n === 4) return [2, 2];
  return Array(n).fill(1);
}

/** Split flat panels array into rows according to rowSizes. */
function buildRows(panels, rowSizes) {
  let i = 0;
  return rowSizes.map((size) => panels.slice(i, (i += size)));
}

function MultiChartPanelChart({ panel, plotSize, onRemove, onExpand, onRename, onElementHover, onCmdLSelect, freshnessLabel }) {
  const key = `${panel.id}-${plotSize}`;
  if (panel.chartVariant === 'bar') {
    return (
      <BarChart
        key={key}
        title={panel.headingLarge}
        subtitle={panel.sub}
        legendLabel={panel.legendLabel ?? 'Volume'}
        barDataKey={panel.barDataKey ?? 'queueDepth'}
        plotSize={plotSize}
        onRemove={onRemove}
        onExpand={onExpand}
        onRename={onRename}
        tabId={panel.id}
        onElementHover={onElementHover}
        onCmdLSelect={onCmdLSelect}
        freshnessLabel={freshnessLabel}
      />
    );
  }
  return (
    <Chart
      key={key}
      title={panel.headingLarge}
      subtitle={panel.sub}
      series1Label={panel.series1Label ?? 'Past 30 days'}
      series2Label={panel.series2Label ?? 'Previous period'}
      chartDataKey={panel.chartDataKey ?? 'default'}
      plotSize={plotSize}
      onRemove={onRemove}
      onExpand={onExpand}
      onRename={onRename}
      tabId={panel.id}
      artifactLabel={panel.headingLarge}
      onElementHover={onElementHover}
      onCmdLSelect={onCmdLSelect}
      freshnessLabel={freshnessLabel}
    />
  );
}

/**
 * @param {object} props
 * @param {Array<object>} props.panels
 * @param {(next: object[]) => void} props.onPanelsChange
 * @param {number[]} [props.rowSizes]
 * @param {(panelId: string) => void} [props.onRemovePanel]
 * @param {(panel: object) => void} [props.onExpandPanel]
 */
// Per-panel freshness shown in each chart's overflow menu, so a multi-chart
// can surface that its panels were generated at different times.
const FRESHNESS_PER_CHART = {
  'multi4-p0': 'Data as of 1 hour ago',
  'multi4-p1': 'Data as of 3 hours ago',
  'multi4-p2': 'Data as of 30 min ago',
  'multi4-p3': 'Data as of 15 min ago',
};

export function MultiChartLayout({ panels, onPanelsChange, rowSizes, onRemovePanel, onExpandPanel, mentionedPanelIds = new Set(), onElementHover, onCmdLSelect, freshnessPerChart = true }) {
  const safePanels = useMemo(() => (Array.isArray(panels) ? panels : []), [panels]);
  const n = safePanels.length;

  const effectiveRowSizes = useMemo(() => {
    if (Array.isArray(rowSizes) && rowSizes.length > 0 && rowSizes.reduce((a, b) => a + b, 0) === n) {
      return rowSizes;
    }
    return defaultRowSizes(n);
  }, [rowSizes, n]);

  const currentRows = useMemo(() => buildRows(safePanels, effectiveRowSizes), [safePanels, effectiveRowSizes]);

  const [removingId, setRemovingId] = useState(null);
  const removeSnapRef = useRef(null);
  const removeTimerRef = useRef(null);
  const prevPanelCountRef = useRef(safePanels.length);
  const cellRefs = useRef({});
  const registerCell = useCallback((id, element) => {
    if (element) cellRefs.current[id] = element;
    else delete cellRefs.current[id];
  }, []);
  useEffect(() => () => clearTimeout(removeTimerRef.current), []);

  // Fade out the removing cell, snapshot remaining positions, then commit removal.
  const handleRemoveWithAnimation = useCallback((panelId) => {
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    setRemovingId(String(panelId));
    removeTimerRef.current = setTimeout(() => {
      const snap = {};
      for (const [id, el] of Object.entries(cellRefs.current)) {
        if (String(id) !== String(panelId)) snap[id] = el.getBoundingClientRect();
      }
      removeSnapRef.current = snap;
      setRemovingId(null);
      onRemovePanel?.(panelId);
      removeTimerRef.current = null;
    }, 160);
  }, [onRemovePanel]);

  // FLIP remaining cells after a panel is removed.
  useLayoutEffect(() => {
    const prevCount = prevPanelCountRef.current;
    const curCount = safePanels.length;
    prevPanelCountRef.current = curCount;
    if (curCount >= prevCount || !removeSnapRef.current) return;

    const snap = removeSnapRef.current;
    removeSnapRef.current = null;

    const animations = [];
    for (const [id, el] of Object.entries(cellRefs.current)) {
      const oldRect = snap[id];
      if (!oldRect) continue;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      animations.push({ el, dx, dy });
    }
    if (animations.length === 0) return;

    for (const { el, dx, dy } of animations) {
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    let rafId;
    let cleanupTimer;
    rafId = requestAnimationFrame(() => {
      for (const { el } of animations) {
        el.style.transition = 'transform 220ms cubic-bezier(0.25, 0, 0.25, 1)';
        el.style.transform = '';
      }
      cleanupTimer = setTimeout(() => {
        for (const { el } of animations) {
          el.style.transition = '';
        }
      }, 240);
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(cleanupTimer);
      for (const { el } of animations) {
        el.style.transition = '';
        el.style.transform = '';
      }
    };
  }, [safePanels]);

  if (n < 2 || n > 4) return null;

  return (
    <div className="multi-chart-dnd">
      <div className="multi-chart-cq-wrap">
        <div className="multi-chart-rows">
          {currentRows.map((row) => (
            <div key={row.map((p) => p.id).join(',')} className="multi-chart-row-group">
              <div className="multi-chart-row">
                {row.map((panel) => {
                  const plotSize = row.length === 1 ? 'hero' : 'half';
                  return (
                    <ChartCell
                      key={panel.id}
                      panel={panel}
                      plotSize={plotSize}
                      registerCell={registerCell}
                      isRemoving={String(panel.id) === removingId}
                      isMentioned={mentionedPanelIds.has(String(panel.id))}
                      onRemovePanel={handleRemoveWithAnimation}
                      onExpandPanel={onExpandPanel}
                      onRenamePanel={onPanelsChange ? (panelId, newTitle) => {
                        onPanelsChange(safePanels.map((p) => String(p.id) === String(panelId) ? { ...p, headingLarge: newTitle } : p));
                      } : undefined}
                      onElementHover={onElementHover}
                      onCmdLSelect={onCmdLSelect}
                      freshnessLabel={freshnessPerChart ? FRESHNESS_PER_CHART[panel.id] : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCell({ panel, plotSize, registerCell, isRemoving, isMentioned, onRemovePanel, onExpandPanel, onRenamePanel, onElementHover, onCmdLSelect, freshnessLabel }) {
  const setCellRef = useCallback((el) => {
    registerCell(String(panel.id), el);
  }, [panel.id, registerCell]);

  return (
    <div
      ref={setCellRef}
      className={`multi-chart-cell${isRemoving ? ' multi-chart-cell--removing' : ''}${isMentioned ? ' multi-chart-cell--mentioned' : ''}`}
    >
      <MultiChartPanelChart
        panel={panel}
        plotSize={plotSize}
        onRemove={onRemovePanel ? () => onRemovePanel(panel.id) : undefined}
        onExpand={onExpandPanel ? () => onExpandPanel(panel) : undefined}
        onRename={onRenamePanel ? (newTitle) => onRenamePanel(panel.id, newTitle) : undefined}
        onElementHover={onElementHover}
        onCmdLSelect={onCmdLSelect}
        freshnessLabel={freshnessLabel}
      />
    </div>
  );
}
