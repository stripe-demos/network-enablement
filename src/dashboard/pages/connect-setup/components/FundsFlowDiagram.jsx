import { Icon } from './Icon';

/**
 * The funds-flow illustration that leads the "How payments move" group — a 1:1
 * port of the Figma `.platform_take_2` / `.marketplace_take_2` diagrams.
 *
 * Three 80×64 nodes sit at x = 0, 140, 280 inside a fixed 360×64 stage. Two
 * dashed connectors bridge the 60px gaps (x 80→140 and 220→280) at the vertical
 * midline, each carrying a small pill — a green "Payment" and a blue
 * "Fee"/"Transfer". The node that keeps the money (`highlight`) sits over a
 * soft pink→purple glow, drawn before the nodes so it reads as a halo spilling
 * out from behind the opaque card.
 *
 * The stage is a fixed pixel size on purpose: the coordinates are what make the
 * connectors line up, so the caller centers it rather than stretching it.
 */

const NODE_LEFT = [0, 140, 280];
const NODE_W = 80;
const NODE_H = 64;
const STAGE_W = 360;
const CONNECTOR_W = 60;

// The two dashed bridges, keyed by the gap they fill.
const CONNECTORS = [
  { left: NODE_W, center: NODE_W + CONNECTOR_W / 2 }, // 80 → 140, pill at 110
  { left: NODE_LEFT[2] - CONNECTOR_W, center: NODE_LEFT[2] - CONNECTOR_W / 2 }, // 220 → 280, pill at 250
];

const PILL_TONE = {
  // Feedback/{success,info}/{25,500} tokens from the Figma diagram.
  success: { background: '#EAFCDD', color: '#2B8700' },
  info: { background: '#E2FBFE', color: '#0072E9' },
};

export default function FundsFlowDiagram({ diagram, className = '' }) {
  const { nodes = [], connectors = [] } = diagram ?? {};

  return (
    <div className={`relative ${className}`} style={{ width: STAGE_W, height: NODE_H }}>
      {/* Dashed connectors + their pill labels. */}
      {CONNECTORS.map((connector, i) => {
        const meta = connectors[i];
        if (!meta) return null;
        const tone = PILL_TONE[meta.tone] ?? PILL_TONE.info;
        return (
          <div key={i}>
            <div
              className="absolute border-t border-dashed border-hairline"
              style={{ left: connector.left, width: CONNECTOR_W, top: NODE_H / 2 }}
            />
            <div
              className="absolute flex h-3 items-center rounded-[2px] px-1"
              style={{
                left: connector.center,
                top: NODE_H / 2,
                transform: 'translate(-50%, -50%)',
                background: tone.background,
              }}
            >
              <span
                className="whitespace-nowrap text-[8px] leading-none"
                style={{ color: tone.color, fontFamily: 'Menlo, Consolas, monospace' }}
              >
                {meta.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Nodes. */}
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center justify-center gap-1 rounded-[12px] bg-surface"
          style={{ left: NODE_LEFT[i], top: 0, width: NODE_W, height: NODE_H }}
        >
          <Icon
            name={node.icon}
            size="xxsmall"
            fill="currentColor"
            className={node.highlight ? 'text-icon-default' : 'text-icon-subdued'}
          />
          <span
            className={`text-[12px] leading-4 ${node.highlight ? 'text-default' : 'text-subdued'}`}
          >
            {node.label}
          </span>
        </div>
      ))}
    </div>
  );
}
