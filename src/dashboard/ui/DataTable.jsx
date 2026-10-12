import { Checkbox } from './Inputs'
import { StatusBadge } from './Badge'
import { color } from './tokens'

const headerCell = {
  padding: '8px 16px',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '16px',
  color: color.subdued,
  borderBottom: `1px solid ${color.borderSubtle}`,
  whiteSpace: 'nowrap',
  background: color.surface,
}

const bodyCell = {
  padding: '10px 16px',
  fontSize: 14,
  lineHeight: '20px',
  letterSpacing: '-0.15px',
  color: color.textStrong,
  borderBottom: `1px solid ${color.borderSubtle}`,
  whiteSpace: 'nowrap',
}

/**
 * Lightweight table with the list-page look. For full list pages (views,
 * filters, column settings, bulk actions) use DashboardListViewTemplate + a config file
 * instead — see README.
 *
 * columns: [{ id, label, align?, width?, type?: 'text' | 'status' | 'currency' | 'muted', render?(row) }]
 * rows:    array of objects keyed by column id (an `id` field is used as the React key)
 * selectable + selected (Set of ids) + onSelectedChange(Set) for checkboxes
 * onRowClick(row) makes rows clickable
 */
export function DataTable({ columns, rows, selectable = false, selected, onSelectedChange, onRowClick, emptyMessage = 'No results' }) {
  const selectedSet = selected ?? new Set()
  const allSelected = rows.length > 0 && rows.every(r => selectedSet.has(r.id))
  const someSelected = !allSelected && rows.some(r => selectedSet.has(r.id))

  const toggleAll = () => onSelectedChange?.(allSelected ? new Set() : new Set(rows.map(r => r.id)))
  const toggleOne = id => {
    const next = new Set(selectedSet)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelectedChange?.(next)
  }

  const renderCell = (col, row) => {
    if (col.render) return col.render(row)
    const v = row[col.id]
    if (v == null || v === '') return <span style={{ color: color.disabled }}>—</span>
    switch (col.type) {
      case 'status': return <StatusBadge status={String(v)} />
      case 'currency': return <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
      case 'muted': return <span style={{ color: color.subdued }}>{v}</span>
      default: return v
    }
  }

  return (
    <table className={`dui-table w-full${onRowClick ? ' dui-table--hover dui-table--clickable' : ' dui-table--hover'}`} style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {selectable && (
            <th style={{ ...headerCell, width: 40, paddingRight: 0 }}>
              <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
            </th>
          )}
          {columns.map(col => (
            <th key={col.id} style={{ ...headerCell, textAlign: col.align ?? 'left', width: col.width }}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ ...bodyCell, color: color.subdued, textAlign: 'center', padding: '32px 16px' }}>{emptyMessage}</td>
          </tr>
        )}
        {rows.map((row, i) => (
          <tr key={row.id ?? i} onClick={() => onRowClick?.(row)}>
            {selectable && (
              <td style={{ ...bodyCell, width: 40, paddingRight: 0 }} onClick={e => e.stopPropagation()}>
                <Checkbox checked={selectedSet.has(row.id)} onChange={() => toggleOne(row.id)} />
              </td>
            )}
            {columns.map(col => (
              <td key={col.id} style={{ ...bodyCell, textAlign: col.align ?? 'left' }}>{renderCell(col, row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
