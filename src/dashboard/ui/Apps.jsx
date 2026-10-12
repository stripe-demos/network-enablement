import { color, shadow, type } from './tokens'
import { ExternalIcon } from './icons'

/**
 * Square app logo. Without `src` it falls back to the app's initial on a
 * slate tile. `badge` adds the purple "new activity" dot on the corner.
 */
export function AppIcon({ src, name, size = 48, badge = false, raised = false }) {
  const radius = size >= 40 ? 8 : 5
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, width: size, height: size }}>
      <span
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: src ? color.surface : color.appTile,
          boxShadow: raised ? shadow.button : undefined,
          color: color.surface,
          fontSize: Math.round(size * 0.5),
          lineHeight: 1,
        }}
      >
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', display: 'block' }} /> : name?.[0]}
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 1px ${color.neutral50}`, pointerEvents: 'none' }} />
      </span>
      {badge && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: color.appBadge,
            boxShadow: `0 0 0 2px ${color.surface}`,
          }}
        />
      )}
    </span>
  )
}

const LIST_ITEM_SIZES = {
  md: { icon: 40, gap: 16, text: { fontSize: 14, lineHeight: '20px', letterSpacing: -0.15 }, descGap: 2 },
  sm: { icon: 28, gap: 12, text: { fontSize: 13, lineHeight: '18px', letterSpacing: -0.08 }, descGap: 0 },
}

/**
 * Marketplace row: logo, name, one-line pitch, and an action link on the
 * right (e.g. "Install"). `external` adds an arrow for off-Stripe installs.
 * size: 'md' (40px logo, menus) | 'sm' (28px logo, 13px text — Apps overview)
 */
export function AppListItem({ icon, name, description, actionLabel = 'Install', external = false, onAction, size = 'md' }) {
  const s = LIST_ITEM_SIZES[size] ?? LIST_ITEM_SIZES.md
  return (
    <div className="flex items-start" style={{ gap: s.gap }}>
      <AppIcon src={icon} name={name} size={s.icon} raised />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...s.text, fontWeight: 600, color: color.text }}>{name}</div>
        {description && <div style={{ ...s.text, color: color.subdued, marginTop: s.descGap }}>{description}</div>}
      </div>
      <button type="button" className="dui-app-action" style={s.text} onClick={onAction}>
        {actionLabel}
        {external && <ExternalIcon size={size === 'sm' ? 10 : 12} />}
      </button>
    </div>
  )
}

/** Icon well + purple title + description. For promo links at the foot of a menu. */
export function LinkListItem({ icon, title, description, onClick }) {
  return (
    <button type="button" className="dui-link-row" onClick={onClick}>
      <span
        className="dui-link-row__well"
        style={{ width: 48, height: 48, borderRadius: 8, background: color.neutral25, color: color.actionPrimary }}
      >
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', letterSpacing: -0.31, color: color.actionPrimary }}>{title}</span>
        {description && <span style={{ ...type.body, color: color.text }}>{description}</span>}
      </span>
    </button>
  )
}
