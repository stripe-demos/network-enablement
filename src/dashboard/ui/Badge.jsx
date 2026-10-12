import { status as statusPalette } from './tokens'
import { DEFAULT_STATUS_TONES } from './helpers'

/**
 * Status badge (20px tall, 12px text) — same rendering as the `status`
 * column type in DashboardListViewTemplate.
 *
 * tone: 'success' | 'warning' | 'critical' | 'info' | 'default'
 */
export function Badge({ tone = 'default', children, style }) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        height: 20,
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 12,
        fontWeight: 400,
        whiteSpace: 'nowrap',
        ...(statusPalette[tone] ?? statusPalette.default),
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Badge whose tone is derived from its label text. */
export function StatusBadge({ status, map = DEFAULT_STATUS_TONES }) {
  return <Badge tone={map[status] ?? 'default'}>{status}</Badge>
}
