import { color, type } from './tokens'

/**
 * Page title row: <h1> plus right-aligned actions. Optional breadcrumb above
 * and a description below. Matches the DashboardListViewTemplate page header.
 */
export function PageHeader({ title, breadcrumb, description, actions, style }) {
  return (
    <div style={{ paddingTop: 16, ...style }}>
      {breadcrumb && (
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', letterSpacing: '-0.15px', color: color.actionPrimary, marginBottom: 2 }}>
          {breadcrumb}
        </div>
      )}
      <div className="flex items-center justify-between" style={{ minHeight: 44 }}>
        <h1 style={{ ...type.pageTitle, color: color.textHeading, letterSpacing: '0.38px' }}>{title}</h1>
        {actions && <div className="flex items-center gap-[8px]">{actions}</div>}
      </div>
      {description && <p style={{ ...type.body, color: color.subdued, marginTop: 4 }}>{description}</p>}
    </div>
  )
}

/**
 * Section <h2> with optional right-aligned actions and a hairline divider below.
 * size: 'lg' (20px, default) | 'md' (16px)
 */
export function SectionHeader({ title, actions, divider = true, size = 'lg', style }) {
  return (
    <div style={style}>
      <div className="flex items-center justify-between">
        <h2 style={size === 'md' ? type.subsectionTitle : type.sectionTitle}>{title}</h2>
        {actions && <div className="flex items-center gap-[8px]">{actions}</div>}
      </div>
      {divider && <Divider style={{ marginTop: 8 }} />}
    </div>
  )
}

export function Divider({ vertical = false, style }) {
  return vertical
    ? <div style={{ width: 1, alignSelf: 'stretch', background: color.neutral100, ...style }} />
    : <div style={{ height: 1, background: color.neutral50, ...style }} />
}

/** Horizontal or vertical flex stack with a fixed gap. */
export function Stack({ direction = 'column', gap = 16, align, justify, wrap = false, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: direction, gap, alignItems: align, justifyContent: justify, flexWrap: wrap ? 'wrap' : undefined, ...style }}>
      {children}
    </div>
  )
}

/** Centered placeholder for empty lists and unbuilt areas. */
export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: '48px 24px', gap: 8 }}>
      {icon}
      <div style={type.label}>{title}</div>
      {description && <div style={{ ...type.body, color: color.subdued, maxWidth: 360 }}>{description}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

/** Gray "well" container (used around filters in list pages). */
export function Well({ children, style }) {
  return (
    <div style={{ background: color.wellBackground, outline: `1px solid ${color.borderSubtle}`, borderRadius: 12, padding: 8, ...style }}>
      {children}
    </div>
  )
}
