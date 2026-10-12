import { Popover } from './Pickers'
import { color } from './tokens'

/** Keyboard shortcut as a row of keycaps, e.g. keys={['c', 'i']}. */
export function KeyboardShortcut({ keys }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 2 }} aria-label={`Shortcut ${keys.join(' then ')}`}>
      {keys.map((k, i) => (
        <kbd
          key={`${k}-${i}`}
          style={{
            minWidth: 18, height: 20, padding: '0 5px', borderRadius: 4,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: color.neutral25, color: color.text,
            fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: 12, lineHeight: '16px',
          }}
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}

/**
 * Popover list of actions, each with a leading icon, a blurple label, and an
 * optional keyboard shortcut (the toolbar "+" create menu). Controlled like Popover.
 *
 * items: [{ label, icon?, shortcut?: string[], onSelect? }]
 */
export function ActionMenu({ anchorRef, open, onClose, items, align = 'center', label, style }) {
  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} align={align} gap={8} role="menu" label={label} style={{ minWidth: 240, padding: 8, borderRadius: 8, ...style }}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className="dui-menu-item"
          onClick={() => { item.onSelect?.(); onClose() }}
          style={{ gap: 12, minHeight: 32, padding: '6px 8px', color: color.actionPrimary }}
        >
          {item.icon && <span style={{ display: 'inline-flex', flexShrink: 0, color: color.subdued }}>{item.icon}</span>}
          <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
          {item.shortcut && <KeyboardShortcut keys={item.shortcut} />}
        </button>
      ))}
    </Popover>
  )
}
