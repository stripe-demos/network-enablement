import { ChevronDownIcon, ChevronUpDownIcon, XCircleIcon } from './icons'
import { color } from './tokens'

/**
 * Dashboard button.
 *
 * variant: 'secondary' (default, list-page header) | 'primary' | 'ghost' | 'destructive'
 *          | 'action' (Home-page outline button with drop shadow)
 * size:    'md' (14px semibold, default) | 'sm' (13px medium — Home controls)
 * icon:    node rendered before the label
 * chevron: show a trailing dropdown chevron
 */
export function Button({
  variant = 'secondary',
  size,
  icon,
  chevron = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const resolvedSize = size ?? (variant === 'action' ? 'sm' : 'md')
  return (
    <button
      type={type}
      className={`dui-btn dui-btn--${variant} dui-btn--${resolvedSize} ${className}`}
      {...rest}
    >
      {icon}
      {children}
      {chevron && <ChevronDownIcon className="ml-[2px]" />}
    </button>
  )
}

/** Square 28×28 icon-only button. Always pass a `label` for the tooltip/aria. */
export function IconButton({ icon, label, variant = 'secondary', className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`dui-btn dui-btn--${variant} dui-btn--icon ${className}`}
      {...rest}
    >
      {icon}
    </button>
  )
}

/**
 * Rounded 24px filter pill used in "Date range / Daily / Compare" rows.
 * onClear: replaces `icon` with an ⊗ that calls it without triggering the pill's onClick
 *          (e.g. removing a comparison). Pass `clearLabel` for its aria-label.
 */
export function FilterPill({ icon, chevron = false, active = false, onClear, clearLabel = 'Remove', children, ...rest }) {
  return (
    <button type="button" className={`dui-filter-pill${active ? ' dui-filter-pill--active' : ''}`} {...rest}>
      {onClear ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={clearLabel}
          className="dui-filter-pill__clear"
          onClick={(e) => { e.stopPropagation(); onClear() }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            e.stopPropagation()
            onClear()
          }}
        >
          <XCircleIcon />
        </span>
      ) : icon}
      {children}
      {chevron && <ChevronDownIcon style={{ width: 10, height: 10 }} />}
    </button>
  )
}

/** "Label | Value" content for a FilterPill, e.g. Date range | Last 7 days. Omit `label` for a value-only pill ("Daily"). */
export function FilterPillValue({ label, value }) {
  return (
    <>
      {label && (
        <>
          <span style={{ color: color.subdued }}>{label}</span>
          <span style={{ width: 1, height: 12, background: color.neutral100, margin: '0 2px', display: 'inline-block' }} />
        </>
      )}
      <span style={{ color: color.actionPrimary }}>{value}</span>
    </>
  )
}

/** Outline select-style button with an up/down stepper chevron. */
export function SelectButton({ children, ...rest }) {
  return (
    <Button variant="action" {...rest}>
      {children}
      <ChevronUpDownIcon className="ml-[2px]" />
    </Button>
  )
}
