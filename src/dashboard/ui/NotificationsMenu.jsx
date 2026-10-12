import { useState } from 'react'
import { Popover } from './Pickers'
import { ScrollArea } from './ScrollArea'
import { color } from './tokens'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Action required' },
  { id: 'update', label: 'Updates' },
]

function FilterTile({ label, count, selected, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className="dui-notification-filter"
      style={{
        flex: 1, minWidth: 0, textAlign: 'left', padding: '6px 10px', borderRadius: 6, background: color.surface, cursor: 'pointer',
        border: `1px solid ${selected ? color.brand500 : color.neutral100}`,
        boxShadow: selected ? `0 0 0 1px ${color.brand500}` : 'none',
      }}
    >
      <div className="truncate" style={{ fontSize: 13, fontWeight: 600, lineHeight: '18px', color: selected ? color.actionPrimary : color.text }}>{label}</div>
      <div style={{ fontSize: 14, lineHeight: '20px', color: color.text, fontVariantNumeric: 'tabular-nums' }}>{count}</div>
    </button>
  )
}

function NotificationRow({ item }) {
  return (
    <div
      className="dui-notification-row"
      style={{ position: 'relative', padding: '14px 20px', borderBottom: `1px solid ${color.neutral50}` }}
    >
      {item.kind === 'action' && <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: color.attentionAccent }} />}
      <div className="flex items-baseline justify-between gap-[12px]">
        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', letterSpacing: '-0.15px', color: color.textStrong }}>{item.title}</span>
        {item.time && <span style={{ fontSize: 12, lineHeight: '16px', color: color.subdued, flexShrink: 0 }}>{item.time}</span>}
      </div>
      <p style={{ margin: '2px 0 0', fontSize: 14, lineHeight: '20px', letterSpacing: '-0.15px', color: color.text }}>{item.body}</p>
    </div>
  )
}

/**
 * DashboardToolbar bell dropdown: "Notifications" heading, All / Action required /
 * Updates filter tiles with counts, and a scrolling list. Action-required items
 * carry an orange bar on their leading edge. Controlled like Popover.
 *
 * notifications: [{ id, kind: 'action' | 'update', title, body, time? }]
 */
export function NotificationsMenu({ anchorRef, open, onClose, notifications, align = 'center' }) {
  const [filter, setFilter] = useState('all')
  const counts = {
    all: notifications.length,
    action: notifications.filter((n) => n.kind === 'action').length,
    update: notifications.filter((n) => n.kind === 'update').length,
  }
  const shown = filter === 'all' ? notifications : notifications.filter((n) => n.kind === filter)

  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} align={align} gap={8} label="Notifications" style={{ width: 420, padding: 0, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${color.neutral50}` }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: '28px', letterSpacing: '-0.3px', color: color.textStrong }}>Notifications</h2>
        <div role="tablist" aria-label="Filter notifications" className="flex gap-[8px]" style={{ marginTop: 16 }}>
          {FILTERS.map((f) => (
            <FilterTile key={f.id} label={f.label} count={counts[f.id]} selected={filter === f.id} onClick={() => setFilter(f.id)} />
          ))}
        </div>
      </div>
      <ScrollArea style={{ maxHeight: 'min(480px, calc(100vh - 220px))' }}>
        {shown.map((n) => <NotificationRow key={n.id} item={n} />)}
        {!shown.length && <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 14, lineHeight: '20px', color: color.subdued }}>You're all caught up</div>}
      </ScrollArea>
    </Popover>
  )
}
