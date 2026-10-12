import { useLayoutEffect, useRef, useState } from 'react';
import { ChartCardHeader } from './ChartCardHeader';
import { clientPointToSvg, svgUserToWrapOffset } from './chartSvgGeometry';

const PAD = { top: 10, right: 40, bottom: 36, left: 10 };
const Y_DIVS = 4;

/**
 * Named bar-chart datasets. `barRel` = relative heights (0–1 of plot area).
 * `maxVal` drives the Y-axis range. `formatY` formats tick labels.
 */
const BAR_DATASETS = {
  /** Queue-depth view by hour. */
  queueDepth: {
    barRel: [0.82, 0.48, 0.68, 0.42, 0.36],
    maxVal: 200,
    xLabels: ['00:00', '06:00', '12:00', '18:00', '24:00'],
    formatY: (v) => String(Math.round(v)),
  },
  /** Conversion funnel — 8-step user journey (Visit → Retain). */
  conversion: {
    barRel: [1.0, 0.78, 0.63, 0.54, 0.44, 0.35, 0.27, 0.20],
    maxVal: 100,
    xLabels: ['Visit', 'Register', 'Verify', 'Onboard', 'Go live', 'Charge', 'Return', 'Retain'],
    formatY: (v) => `${Math.round(v)}%`,
  },
  /** Throughput by region in req/s. */
  throughput: {
    barRel: [0.72, 0.55, 0.88, 0.32, 0.61],
    maxVal: 4800,
    xLabels: ['US', 'EU', 'APAC', 'LATAM', 'Other'],
    formatY: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(Math.round(v))),
  },
};

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {string} [props.legendLabel]
 * @param {keyof typeof BAR_DATASETS} [props.barDataKey]
 * @param {'full' | 'hero' | 'half'} [props.plotSize]
 * @param {boolean} [props.standalone] — true when rendered as the only chart on a tab; suppresses header.
 */
export function BarChart({
  title = 'Chart title',
  subtitle = 'Sub text',
  legendLabel = 'Label',
  barDataKey = 'queueDepth',
  dataset,
  plotSize,
  standalone = false,
  onRemove,
  onExpand,
  onRename,
  tabId,
  onCmdLSelect,
  onElementHover,
  freshnessLabel,
}) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 240 });
  const [hover, setHover] = useState(null);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const nw = Math.max(1, wrap.clientWidth || 600);
      const nh = Math.max(1, wrap.clientHeight || 240);
      setSize((prev) => {
        if (Math.abs(prev.w - nw) < 0.5 && Math.abs(prev.h - nh) < 0.5) return prev;
        return { w: nw, h: nh };
      });
    };
    measure();
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [plotSize]);

  const ds = dataset ?? BAR_DATASETS[barDataKey] ?? BAR_DATASETS.queueDepth;

  const w = size.w;
  const h = size.h;
  const plotLeft = PAD.left;
  const plotRight = w - PAD.right;
  const plotTop = PAD.top;
  const plotBottom = h - PAD.bottom;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const gridYs = [];
  for (let k = 0; k <= Y_DIVS; k++) {
    gridYs.push(plotTop + (k / Y_DIVS) * plotH);
  }

  const yTickValues = [];
  for (let k = 0; k <= Y_DIVS; k++) {
    yTickValues.push(ds.maxVal - (k / Y_DIVS) * ds.maxVal);
  }

  const barCount = ds.barRel.length;
  const edgeGap = 8;
  const betweenGap = barCount > 6 ? 5 : 8;
  const totalGaps = edgeGap * 2 + betweenGap * (barCount - 1);
  const barW = (plotW - totalGaps) / barCount;
  const bars = ds.barRel.map((rel, i) => {
    const bx = plotLeft + edgeGap + i * (barW + betweenGap);
    const bh = rel * plotH;
    const by = plotBottom - bh;
    return { bx, by, bw: barW, bh };
  });

  function handleMove(e) {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const loc = clientPointToSvg(svg, e.clientX, e.clientY);
    const mx = loc.x;
    let hitIdx = -1;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      if (mx >= b.bx && mx <= b.bx + b.bw) { hitIdx = i; break; }
    }
    if (hitIdx === -1) { setHover(null); onElementHover?.(null); return; }
    const b = bars[hitIdx];
    const anchor = svgUserToWrapOffset(svg, wrap, b.bx + b.bw / 2, b.by);
    const maxLeft = Math.max(80, wrap.clientWidth - 200);
    setHover({
      idx: hitIdx,
      tooltipLeft: Math.min(Math.max(anchor.left - 70, 8), maxLeft),
      tooltipTop: Math.max(anchor.top - 84, 8),
    });
    onElementHover?.({ type: 'element', tabId, artifactLabel: title, value: ds.xLabels[hitIdx] ?? String(hitIdx + 1) });
  }

  const tip = hover;

  const plotAreaClass =
    `chart-area chart-area--bar${plotSize === 'hero' ? ' chart-area--plot-hero' : ''}${plotSize === 'half' ? ' chart-area--plot-half' : ''}`;

  return (
    <div
      className={`chart-shell${overflowMenuOpen ? ' chart-shell--menu-open' : ''}${standalone ? ' chart-shell--standalone' : ''}`}
      onClick={onCmdLSelect ? (e) => {
        if (!e.metaKey) return;
        if (hover) {
          onCmdLSelect({ type: 'element', tabId, artifactLabel: title, value: ds.xLabels[hover.idx] ?? String(hover.idx + 1) });
        } else {
          onCmdLSelect({ type: 'artifact', tabId, artifactLabel: title });
        }
      } : undefined}
    >
      {!standalone && (
        <ChartCardHeader
          title={title}
          subtitle={subtitle}
          onMenuOpenChange={setOverflowMenuOpen}
          onRemove={onRemove}
          onExpand={onExpand}
          onRename={onRename}
          freshnessLabel={freshnessLabel}
        />
      )}
      <div className="chart-shell__chartBlock">
        <div className={plotAreaClass} ref={wrapRef}>
          <svg
            ref={svgRef}
            className="chart-svg"
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMove}
            onMouseLeave={() => {
              setHover(null);
              onElementHover?.(null);
            }}
          >
            {gridYs.map((gy, k) => (
              <line
                key={`g${k}`}
                x1={plotLeft}
                y1={gy}
                x2={plotRight}
                y2={gy}
                className={k === Y_DIVS ? 'chart-grid-line chart-grid-line--baseline' : 'chart-grid-line'}
              />
            ))}
            {gridYs.map((gy, k) => (
              <text key={`yl${k}`} className="chart-y-label" x={w - 6} y={gy + 4} textAnchor="end">
                {ds.formatY(yTickValues[k])}
              </text>
            ))}
            {bars.map((b, i) => (
              <rect
                key={`bar${i}`}
                x={b.bx}
                y={b.by}
                width={b.bw}
                height={b.bh}
                className="chart-bar"
                rx={0}
              />
            ))}
            {bars.map((b, i) => (
              <g key={`tick${i}`}>
                <line
                  x1={b.bx + b.bw / 2}
                  y1={plotBottom}
                  x2={b.bx + b.bw / 2}
                  y2={plotBottom - 4}
                  className="chart-x-tick"
                />
                <text className="chart-x-label" x={b.bx + b.bw / 2} y={h - 6} textAnchor="middle">
                  {ds.xLabels[i] ?? String(i + 1)}
                </text>
              </g>
            ))}
          </svg>
          {tip ? (
            <div
              className="chart-tooltip chart-tooltip--spec visible"
              style={{ left: tip.tooltipLeft, top: tip.tooltipTop }}
            >
              <div className="chart-tooltip__date">{ds.xLabels[tip.idx] ?? String(tip.idx + 1)}</div>
              <div className="chart-tooltip__body">
                <div className="chart-tooltip__col chart-tooltip__col--labels">
                  <div className="chart-tooltip__series">
                    <span className="chart-tooltip__swatch chart-tooltip__swatch--cat1" />
                    <span className="chart-tooltip__seriesLabel">{legendLabel}</span>
                  </div>
                </div>
                <div className="chart-tooltip__col chart-tooltip__col--values">
                  <div className="chart-tooltip__value">{ds.formatY(ds.barRel[tip.idx] * ds.maxVal)}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="chart-legend chart-legend--bar">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch chart-legend-swatch--cat1" />
            <span>{legendLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
