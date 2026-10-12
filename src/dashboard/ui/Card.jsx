import { createContext, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { color, type } from './tokens'
import { ChevronDownIcon, InfoIcon } from './icons'
import { OverflowMenu } from './OverflowMenu'
import { FocusTrace } from './FocusTrace'

/**
 * White card with the Home overview padding. `bordered` adds a 12px-radius outline for standalone use.
 * `menu` (OverflowMenu items) adds a "…" button at the top right, shown on hover;
 * `menuLabel` names it. `highlighted` loops the Console focus ring (FocusTrace) around
 * the card, e.g. while it's the Console panel's context. `eyebrow` adds a small
 * grey tab label attached to the card's top-left edge (e.g. "For your business").
 */
export function Card({ children, bordered = false, menu, menuLabel, highlighted, eyebrow, style }) {
  const surfaceStyle = eyebrow ? { borderTopLeftRadius: 0, ...style } : style
  const card = <CardSurface bordered={bordered} menu={menu} menuLabel={menuLabel} highlighted={highlighted} style={surfaceStyle}>{children}</CardSurface>
  if (!eyebrow) return card
  return (
    <div className="flex flex-col items-start">
      <span style={{ ...type.caption, color: color.subdued, background: color.neutral25, borderRadius: '4px 4px 0 0', padding: '2px 6px' }}>{eyebrow}</span>
      <div style={{ alignSelf: 'stretch' }}>{card}</div>
    </div>
  )
}

const TRAY_CARD_RADIUS = 8
const CardGridRadius = createContext(0)

function CardSurface({ children, bordered, menu, menuLabel, highlighted, style }) {
  const hasMenu = Boolean(menu?.length)
  const gridRadius = useContext(CardGridRadius)
  const radius = bordered ? 12 : gridRadius
  return (
    <div
      className={hasMenu ? 'dui-overflow-host' : undefined}
      data-wireframe-frame="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: color.surface,
        padding: '16px 24px 24px',
        ...(hasMenu || highlighted !== undefined ? { position: 'relative' } : null),
        ...(radius ? { borderRadius: radius } : null),
        ...(bordered ? { border: `1px solid ${color.neutral50}` } : null),
        ...style,
      }}
    >
      {children}
      {highlighted !== undefined && <FocusTrace active={highlighted} speed="loop" radius={radius} />}
      {hasMenu && (
        <OverflowMenu
          items={menu}
          label={menuLabel ? `More options for ${menuLabel}` : 'More options'}
          menuLabel={menuLabel}
          reveal="hover"
          style={{ position: 'absolute', top: 16, right: 20 }}
        />
      )}
    </div>
  )
}

/** Card title row with optional info icon and right-aligned action. */
export function CardHeader({ title, info = true, action }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[8px]">
        <span style={type.label}>{title}</span>
        {info && <InfoIcon />}
      </div>
      {action}
    </div>
  )
}

const footerText = { fontSize: 13, fontWeight: 400, lineHeight: '20px' }

/**
 * Secondary link pinned to the bottom of a Card ("View all customers"), however
 * short the content above it. Keeps at least 12px of space above. `note` adds
 * plain text on the left ("Updated yesterday") and moves the link to the right.
 * align: 'left' (default) | 'right' — where the link sits when there's no note.
 */
export function CardFooterLink({ children, onClick, href, note, align = 'left' }) {
  const props = { onClick, className: 'dui-card-footer-link', style: footerText }
  let link = <span {...props}>{children}</span>
  if (href?.startsWith('/')) link = <Link to={href} {...props}>{children}</Link>
  else if (href) link = <a href={href} {...props}>{children}</a>
  return (
    <div className={`flex items-center gap-[12px] ${note == null && align === 'right' ? 'justify-end' : 'justify-between'}`} style={{ marginTop: 'auto', paddingTop: 12 }}>
      {note != null && <span style={{ ...footerText, color: color.subdued }}>{note}</span>}
      {link}
    </div>
  )
}

/** Big number with an optional delta (positive deltas render green, negative red). */
export function CardMetric({ value, delta }) {
  const negative = typeof delta === 'string' && delta.trim().startsWith('-')
  return (
    <div className="flex items-baseline gap-[4px]" style={{ marginTop: 3 }}>
      <span style={type.metricLarge}>{value}</span>
      {delta && <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '16px', color: negative ? color.negative : color.positive }}>{delta}</span>}
    </div>
  )
}

/**
 * Grid of cards. Children are usually <Card>s.
 *
 * variant: 'hairline' (cards joined by 1px lines) | 'tray' (rounded cards on a
 * grey tray with 8px padding and gaps — the Home "Performance" grid)
 */
export function CardGrid({ columns = 3, variant = 'hairline', children, style }) {
  const tray = variant === 'tray'
  return (
    <div
      className={tray ? 'grid gap-[8px]' : 'grid gap-[1px]'}
      data-wireframe-frame={tray ? 'tray' : undefined}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        borderRadius: 12,
        background: tray ? color.neutral25 : color.neutral50,
        ...(tray ? { padding: 8 } : { overflow: 'hidden', border: `1px solid ${color.neutral50}` }),
        ...style,
      }}
    >
      <CardGridRadius.Provider value={tray ? TRAY_CARD_RADIUS : 0}>{children}</CardGridRadius.Provider>
    </div>
  )
}

/**
 * Label / value rows separated by hairlines (Failed payments, Top customers).
 *
 * rows: [{ label, meta?, description?, value?, badge?, onClick? }]
 *   description: second line under the label; the row becomes a two-line
 *     item with a semibold label and value (Home "Failed payments")
 *   badge: node shown instead of `value` (e.g. <Badge tone="critical">Failed</Badge>)
 * linkLabels: render labels in the action color (e.g. customer emails)
 * For a "View all" link under the list, follow it with a <CardFooterLink>.
 */
export function KeyValueList({ rows, linkLabels = false, style }) {
  return (
    <div className="flex flex-col" style={style}>
      {rows.map((r, i) => {
        const stacked = r.description != null
        return (
          <div
            key={r.id ?? i}
            className="flex items-center justify-between gap-[12px]"
            onClick={r.onClick}
            style={{ padding: stacked ? '10px 0' : '8px 0', borderBottom: i < rows.length - 1 ? `1px solid ${color.neutral50}` : 'none', cursor: r.onClick ? 'pointer' : undefined }}
          >
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-[8px] min-w-0">
                <span className="truncate" style={{ fontSize: 13, lineHeight: '20px', fontWeight: stacked ? 600 : 400, color: linkLabels ? color.actionPrimary : stacked ? color.textStrong : color.text }}>{r.label}</span>
                {r.meta != null && <span style={{ fontSize: 12, color: color.subdued }}>{r.meta}</span>}
              </div>
              {stacked && <span className="truncate" style={{ fontSize: 12, lineHeight: '16px', color: color.subdued }}>{r.description}</span>}
            </div>
            {r.badge ?? <span style={{ fontSize: 13, fontWeight: stacked ? 600 : 500, color: color.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{r.value}</span>}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Headline stat: label (optionally a dropdown), value, caption, and an
 * optional right-aligned link — the Home "Net volume" / "USD Balance" blocks.
 *
 * size: 'lg' (20px value) | 'md' (16px subdued value)
 * live: the value slides in each time it changes (a live-updating figure)
 */
export function Stat({ label, value, caption, dropdown = false, action, size = 'lg', live = false, style }) {
  const [shown, setShown] = useState(value)
  const [ticks, setTicks] = useState(0)
  if (shown !== value) {
    setShown(value)
    if (live) setTicks((n) => n + 1)
  }
  return (
    <div style={style}>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-[8px]">
          <span style={type.label}>{label}</span>
          {dropdown && <ChevronDownIcon />}
        </div>
        {action}
      </div>
      <div style={{ marginTop: 4 }}>
        <div style={size === 'lg' ? type.metricLarge : type.metricMedium}>
          <span key={ticks} className={ticks ? 'dui-value-tick' : undefined} style={{ display: 'inline-block' }}>{value}</span>
        </div>
        {caption && <div style={type.caption}>{caption}</div>}
      </div>
    </div>
  )
}

/**
 * Clickable Stat label with a chevron, for a Stat whose label opens a menu or
 * picker. Pass it as `label` (and leave `dropdown` off); it takes a ref, so it
 * can be a SelectMenu `trigger` or a DatePicker anchor.
 */
export function StatDropdown({ children, ...rest }) {
  return (
    <button type="button" className="dui-stat-trigger" {...rest}>
      {children}
      <ChevronDownIcon />
    </button>
  )
}

/** Inline action-colored text link. */
export function TextLink({ children, onClick, href, style }) {
  const props = { onClick, className: 'dui-link', style: { fontSize: 14, lineHeight: '20px', letterSpacing: '-0.15px', ...style } }
  if (href?.startsWith('/')) return <Link to={href} {...props}>{children}</Link>
  if (href) return <a href={href} {...props}>{children}</a>
  return <span {...props}>{children}</span>
}
