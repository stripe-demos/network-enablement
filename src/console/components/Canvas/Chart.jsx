import { useLayoutEffect, useRef, useState } from 'react';
import { ChartCardHeader } from './ChartCardHeader';
import { clientPointToSvg, svgUserToWrapOffset } from './chartSvgGeometry';

// Line chart — Console Spec (Figma 16396:62677) + tooltip 16399:31662.

const DAY_LABELS = [
  'Dec 1', 'Dec 2', 'Dec 3', 'Dec 4', 'Dec 5', 'Dec 6', 'Dec 7', 'Dec 8', 'Dec 9', 'Dec 10',
  'Dec 11', 'Dec 12', 'Dec 13', 'Dec 14', 'Dec 15', 'Dec 16', 'Dec 17', 'Dec 18', 'Dec 19', 'Dec 20',
  'Dec 21', 'Dec 22', 'Dec 23', 'Dec 24', 'Dec 25', 'Dec 26', 'Dec 27', 'Dec 28', 'Dec 29', 'Dec 30', 'Dec 31',
];

/**
 * Named datasets — each chart variant can pick a different one.
 * `s1` = current/series-1, `s2` = previous/series-2 (62 points, 2 per day).
 * `formatY` formats Y-axis tick labels; `formatTip` formats tooltip values.
 */
const CHART_DATASETS = {
  /** Default: revenue ($K), used by the standalone Revenue chart. */
  default: {
    s1: [
      29200, 29600, 30000, 30400, 30800, 30200, 29800, 29200, 28600, 28100, 27800, 28000,
      28200, 28600, 29000, 29800, 30600, 30900, 31200, 31500, 31800, 32400, 33000, 33600,
      34200, 33900, 33600, 33400, 33200, 33500, 33800, 34200, 34600, 34900, 35200, 34800,
      34400, 34000, 33600, 33800, 34000, 34100, 34200, 34800, 35400, 34700, 34000, 33700,
      33400, 33000, 32600, 32200, 31800, 32100, 32400, 32800, 33200, 33800, 34400, 34700,
      35000, 35500,
    ],
    s2: [
      28800, 29200, 29600, 30200, 30800, 31100, 31400, 31100, 30800, 30500, 30200, 29800,
      29400, 29200, 29000, 28600, 28200, 28800, 29400, 29800, 30200, 30600, 31000, 31300,
      31600, 31400, 31200, 31000, 30800, 31100, 31400, 31700, 32000, 31600, 31200, 30800,
      30400, 30600, 30800, 31000, 31200, 31600, 32000, 31700, 31400, 31000, 30600, 30400,
      30200, 30800, 31400, 31800, 32200, 32400, 32600, 32700, 32800, 32500, 32200, 31800,
      31400, 31700,
    ],
    formatY: (v) => {
      const n = Math.round(v);
      return Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
    },
    formatTip: (v) => `$${(v / 1000).toFixed(1)}K`,
  },

  /** Request volume in req/min — hero chart on Platform metrics tab. */
  requestVolume: {
    s1: [
       9200,  9450,  9800, 10200, 10600, 10200,  9900,  9400,  8900,  8600,  8400,  8700,
       9000,  9400,  9900, 10400, 11000, 11400, 11800, 12100, 12400, 12900, 13300, 13700,
      14100, 13800, 13500, 13300, 13000, 13200, 13500, 13900, 14200, 14500, 14500, 14200,
      13900, 13600, 13200, 13400, 13600, 13700, 13800, 14200, 14500, 13900, 13200, 13000,
      12700, 12300, 11900, 11500, 11200, 11500, 11800, 12200, 12600, 13100, 13700, 14000,
      14300, 14500,
    ],
    s2: [
       8800,  9100,  9400,  9900, 10300, 10600, 10900, 10700, 10400, 10100,  9800,  9500,
       9200,  9000,  8800,  8500,  8200,  8700,  9200,  9600,  9900, 10300, 10700, 11000,
      11300, 11100, 10900, 10700, 10500, 10700, 10900, 11200, 11500, 11200, 10900, 10500,
      10100, 10300, 10500, 10700, 10900, 11200, 11600, 11300, 10900, 10500, 10100,  9900,
       9700, 10200, 10800, 11200, 11600, 11800, 12000, 12100, 12200, 11900, 11600, 11300,
      10900, 11100,
    ],
    formatY: (v) => {
      const n = Math.round(v);
      return Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
    },
    formatTip: (v) => `${(v / 1000).toFixed(1)}K rpm`,
  },

  /** Error rate % — success/error rate chart. Spike simulates a brief incident. */
  successRate: {
    s1: [
      0.45, 0.38, 0.52, 0.41, 0.37, 0.49, 0.55, 0.62, 1.20, 2.80, 3.40, 2.10,
      1.20, 0.80, 0.60, 0.52, 0.48, 0.43, 0.41, 0.39, 0.42, 0.45, 0.43, 0.40,
      0.38, 0.41, 0.44, 0.39, 0.42, 0.40, 0.38, 0.44, 0.48, 0.42, 0.39, 0.41,
      0.43, 0.40, 0.42, 0.38, 0.40, 0.43, 0.41, 0.39, 0.38, 0.44, 0.42, 0.39,
      0.41, 0.38, 0.43, 0.40, 0.42, 0.38, 0.41, 0.44, 0.40, 0.42, 0.39, 0.41,
      0.38, 0.40,
    ],
    s2: [
      0.38, 0.42, 0.40, 0.45, 0.39, 0.43, 0.41, 0.44, 0.38, 0.42, 0.40, 0.43,
      0.41, 0.39, 0.42, 0.44, 0.40, 0.38, 0.43, 0.41, 0.39, 0.42, 0.44, 0.40,
      0.38, 0.43, 0.41, 0.39, 0.42, 0.40, 0.44, 0.38, 0.43, 0.41, 0.39, 0.42,
      0.44, 0.40, 0.38, 0.43, 0.41, 0.39, 0.42, 0.44, 0.40, 0.38, 0.43, 0.41,
      0.39, 0.42, 0.40, 0.44, 0.38, 0.43, 0.41, 0.39, 0.42, 0.40, 0.44, 0.38,
      0.43, 0.41,
    ],
    formatY: (v) => `${v.toFixed(1)}%`,
    formatTip: (v) => `${v.toFixed(2)}%`,
  },

  /** Active merchants (K) — north-star growth metric. */
  northStar: {
    s1: [
      42000, 42400, 42900, 43500, 44200, 44800, 45300, 45700, 46000, 46200, 46100, 46400,
      46800, 47300, 47900, 48500, 49100, 49600, 50000, 50300, 50700, 51200, 51800, 52400,
      53000, 53400, 53700, 54000, 54200, 54600, 55100, 55700, 56300, 56800, 57200, 57500,
      57700, 57900, 58100, 58400, 58800, 59300, 59800, 60200, 60500, 60700, 60800, 60900,
      61000, 61200, 61500, 61800, 62100, 62300, 62400, 62500, 62600, 62700, 62800, 62900,
      63000, 63100,
    ],
    s2: [
      30000, 30400, 30900, 31500, 32100, 32700, 33200, 33600, 33900, 34100, 34200, 34500,
      34900, 35400, 35900, 36400, 36900, 37300, 37600, 37900, 38300, 38800, 39400, 40000,
      40600, 41000, 41300, 41600, 41800, 42200, 42700, 43300, 43900, 44400, 44800, 45100,
      45300, 45400, 45500, 45700, 46000, 46500, 46900, 47300, 47500, 47700, 47800, 47900,
      48000, 48200, 48500, 48800, 49100, 49300, 49400, 49500, 49600, 49700, 49800, 49900,
      50000, 50100,
    ],
    formatY: (v) => {
      const n = Math.round(v);
      return Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
    },
    formatTip: (v) => `${Math.round(v / 1000)}K`,
  },

  /** API latency in ms — p99 and p50. Spike in p99 simulates a brief regression. */
  latency: {
    s1: [
      185, 192, 188, 195, 201, 198, 205, 215, 280, 380, 420, 340,
      260, 225, 210, 205, 200, 195, 190, 188, 192, 196, 194, 190,
      188, 192, 196, 191, 195, 193, 190, 196, 202, 195, 191, 194,
      198, 194, 197, 191, 195, 199, 196, 193, 191, 198, 195, 192,
      194, 191, 196, 193, 197, 191, 194, 199, 193, 197, 192, 195,
      190, 193,
    ],
    s2: [
       48,  51,  49,  52,  55,  53,  57,  61,  58,  54,  52,  55,
       57,  60,  62,  65,  67,  69,  68,  67,  69,  71,  70,  68,
       66,  69,  71,  68,  71,  69,  66,  71,  74,  69,  66,  70,
       73,  69,  72,  67,  71,  74,  71,  68,  66,  72,  70,  67,
       69,  67,  71,  68,  72,  67,  70,  74,  68,  72,  67,  70,
       65,  69,
    ],
    formatY: (v) => `${Math.round(v)}ms`,
    formatTip: (v) => `${Math.round(v)}ms`,
  },
};

const PAD = { top: 10, right: 40, bottom: 36, left: 10 };
const Y_DIVS = 4;
const X_TICKS = 8;
/** Consistent gap (px) between the data highlight line and the tooltip edge. */
const TOOLTIP_GAP = 16;
const TOOLTIP_EDGE = 8; // min gap from the plot's outer edges
const TOOLTIP_EST_W = 200; // fallback width before the tooltip has measured

/**
 * Position the tooltip a consistent `TOOLTIP_GAP` away from the vertical
 * highlight line. It is placed on whichever side of the line has more room,
 * and the gap is ALWAYS preserved — the tooltip is never clamped back across
 * the line, so the line (and the cursor tracking it) is never obscured. If the
 * chosen side is too narrow the tooltip simply overflows outward (the plot area
 * is overflow-visible), which is preferable to covering the cursor.
 */
function computeTooltipPos(anchorLeft, anchorTop, wrap, tooltipEl) {
  const tw = tooltipEl?.offsetWidth || TOOLTIP_EST_W;
  const th = tooltipEl?.offsetHeight || 120;
  // Place on the side of the line with more available space.
  const placeRight = wrap.clientWidth - anchorLeft >= anchorLeft;
  const tooltipLeft = placeRight
    ? anchorLeft + TOOLTIP_GAP // left edge sits GAP to the right of the line
    : anchorLeft - TOOLTIP_GAP - tw; // right edge sits GAP to the left of the line
  const tooltipTop = Math.max(
    TOOLTIP_EDGE,
    Math.min(anchorTop - th / 2, wrap.clientHeight - th - TOOLTIP_EDGE),
  );
  return { tooltipLeft, tooltipTop };
}

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {string} [props.series1Label]
 * @param {string} [props.series2Label]
 * @param {keyof typeof CHART_DATASETS} [props.chartDataKey]
 * @param {'full' | 'hero' | 'half'} [props.plotSize]
 * @param {boolean} [props.standalone] — true when rendered as the only chart on a tab; suppresses header.
 */
export function Chart({
  title = 'Chart title',
  subtitle = 'Sub text',
  series1Label = 'Past 30 days',
  series2Label = 'Previous period',
  chartDataKey = 'default',
  plotSize,
  standalone = false,
  onRemove,
  onExpand,
  onRename,
  tabId,
  artifactLabel,
  onCmdLSelect,
  onElementHover,
  freshnessLabel,
}) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const tooltipRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState({ w: 600, h: 240 });
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

  const ds = CHART_DATASETS[chartDataKey] ?? CHART_DATASETS.default;
  const S1 = ds.s1;
  const S2 = ds.s2;

  const w = size.w;
  const h = size.h;
  const plotLeft = PAD.left;
  const plotRight = w - PAD.right;
  const plotTop = PAD.top;
  const plotBottom = h - PAD.bottom;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const all = [...S1, ...S2];
  const minV = Math.min(...all) * (Math.min(...all) >= 0 ? 0.9 : 1.1);
  const maxV = Math.max(...all) * 1.05;
  const range = maxV - minV || 1;

  const x = (i) => plotLeft + (i / (S1.length - 1)) * plotW;
  const y = (v) => plotBottom - ((v - minV) / range) * plotH;

  useLayoutEffect(() => {
    setHover((prev) => {
      if (!prev) return prev;
      const svg = svgRef.current;
      const wrap = wrapRef.current;
      if (!svg || !wrap) return prev;
      const yy = plotBottom - ((S1[prev.idx] - minV) / range) * plotH;
      const anchor = svgUserToWrapOffset(svg, wrap, prev.px, yy);
      const { tooltipLeft, tooltipTop } = computeTooltipPos(anchor.left, anchor.top, wrap, tooltipRef.current);
      return { ...prev, tooltipLeft, tooltipTop };
    });
    // Re-anchor tooltip when plot box changes; scalars come from the render that scheduled this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when measured size changes
  }, [size.w, size.h]);

  const pathD = (data) => {
    if (data.length < 2) return '';
    const pts = data.map((v, i) => [x(i), y(v)]);
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      d += ` L${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
    }
    return d;
  };

  const path1 = pathD(S1);
  const path2 = pathD(S2);

  const gridYs = [];
  for (let k = 0; k <= Y_DIVS; k++) {
    gridYs.push(plotTop + (k / Y_DIVS) * plotH);
  }

  const xTickXs = [];
  for (let t = 0; t < X_TICKS; t++) {
    xTickXs.push(plotLeft + (t / (X_TICKS - 1)) * plotW);
  }

  const compactX = w < 480;
  const xTickMeta = xTickXs.map((tx, ti) => {
    const dataIdx = Math.round((ti / (X_TICKS - 1)) * (S1.length - 1));
    const dayIdx = Math.min(DAY_LABELS.length - 1, Math.max(0, Math.floor(dataIdx / 2)));
    const full = DAY_LABELS[dayIdx];
    const short = full.replace(/^Dec\s+/, '');
    return { tx, label: compactX ? short : full };
  });

  const yTickValues = [];
  for (let k = 0; k <= Y_DIVS; k++) {
    yTickValues.push(maxV - (k / Y_DIVS) * range);
  }

  function handleMove(e) {
    const svg = svgRef.current;
    if (!svg || w < 1) return;
    const loc = clientPointToSvg(svg, e.clientX, e.clientY);
    const mxSvg = loc.x;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < S1.length; i += 2) {
      const d = Math.abs(x(i) - mxSvg);
      if (d < closestDist) {
        closestDist = d;
        closest = i;
      }
    }
    const px = x(closest);
    const wrap = wrapRef.current;
    let tooltipLeft = 8;
    let tooltipTop = 8;
    if (wrap) {
      const anchor = svgUserToWrapOffset(svg, wrap, px, y(S1[closest]));
      const pos = computeTooltipPos(anchor.left, anchor.top, wrap, tooltipRef.current);
      tooltipLeft = pos.tooltipLeft;
      tooltipTop = pos.tooltipTop;
    }
    setHover({ idx: closest, px: x(closest), tooltipLeft, tooltipTop });
    const dayLabel = DAY_LABELS[Math.floor(closest / 2)];
    onElementHover?.({ type: 'element', tabId, artifactLabel: artifactLabel ?? title, value: dayLabel });
  }

  const tip = hover;

  const dateStr = tip ? `${DAY_LABELS[Math.floor(tip.idx / 2)]}, 2026` : '';

  const plotAreaClass =
    `chart-area chart-area--line${plotSize === 'hero' ? ' chart-area--plot-hero' : ''}${plotSize === 'half' ? ' chart-area--plot-half' : ''}`;

  return (
    <div
      className={`chart-shell${overflowMenuOpen ? ' chart-shell--menu-open' : ''}${standalone ? ' chart-shell--standalone' : ''}`}
      onClick={onCmdLSelect ? (e) => {
        if (!e.metaKey) return;
        if (hover) {
          const dayLabel = DAY_LABELS[Math.floor(hover.idx / 2)];
          onCmdLSelect({ type: 'element', tabId, artifactLabel: artifactLabel ?? title, value: dayLabel });
        } else {
          onCmdLSelect({ type: 'artifact', tabId, artifactLabel: artifactLabel ?? title });
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
            onClick={hover ? (e) => {
              if (!e.metaKey) return;
              const dayLabel = DAY_LABELS[Math.floor(hover.idx / 2)];
              onCmdLSelect?.({ type: 'element', tabId, artifactLabel: artifactLabel ?? title, value: dayLabel });
            } : undefined}
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
            {xTickMeta.map(({ tx, label }, ti) => (
              <g key={`xt${ti}`}>
                <line
                  x1={tx}
                  y1={plotBottom}
                  x2={tx}
                  y2={plotBottom - 4}
                  className="chart-x-tick"
                />
                <text className="chart-x-label" x={tx} y={h - 6} textAnchor="middle">
                  {label}
                </text>
              </g>
            ))}
            <path d={path2} className="chart-line chart-line--cat2" />
            <path d={path1} className="chart-line chart-line--cat1" />
            {hover ? (
              <>
                <line
                  className="chart-needle chart-needle--visible"
                  x1={hover.px}
                  x2={hover.px}
                  y1={plotTop}
                  y2={plotBottom}
                />
                <circle
                  className="chart-dot chart-dot--visible chart-dot--cat2"
                  cx={hover.px}
                  cy={y(S2[hover.idx])}
                  r={4}
                />
                <circle
                  className="chart-dot chart-dot--visible chart-dot--cat1"
                  cx={hover.px}
                  cy={y(S1[hover.idx])}
                  r={4}
                />
              </>
            ) : null}
          </svg>
          {tip ? (
            <div
              ref={tooltipRef}
              className="chart-tooltip chart-tooltip--spec visible"
              style={{ left: tip.tooltipLeft, top: tip.tooltipTop }}
            >
              <div className="chart-tooltip__date">{dateStr}</div>
              <div className="chart-tooltip__body">
                <div className="chart-tooltip__col chart-tooltip__col--labels">
                  <div className="chart-tooltip__series">
                    <span className="chart-tooltip__swatch chart-tooltip__swatch--cat1" />
                    <span className="chart-tooltip__seriesLabel">{series1Label}</span>
                  </div>
                  <div className="chart-tooltip__series">
                    <span className="chart-tooltip__swatch chart-tooltip__swatch--cat2" />
                    <span className="chart-tooltip__seriesLabel">{series2Label}</span>
                  </div>
                </div>
                <div className="chart-tooltip__col chart-tooltip__col--values">
                  <div className="chart-tooltip__value">{ds.formatTip(S1[tip.idx])}</div>
                  <div className="chart-tooltip__value">{ds.formatTip(S2[tip.idx])}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="chart-legend chart-legend--line">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch chart-legend-swatch--cat1" />
            <span>{series1Label}</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch chart-legend-swatch--cat2" />
            <span>{series2Label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
