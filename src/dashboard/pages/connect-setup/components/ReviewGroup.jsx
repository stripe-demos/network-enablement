import { Icon } from './Icon';

/**
 * A titled group of setting cards. The group itself is the offset-coloured
 * surface with 4px of padding; the cards inside sit on `bg-surface` with their
 * own hairline border, so the 4px padding and 4px gaps read as the separation
 * between them rather than divider rules.
 *
 * `icon` accepts either an `Icon` name or a ready-made node.
 */
export default function ReviewGroup({ icon, label, warning, children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-[8px] bg-offset p-[4px] ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        {typeof icon === 'string' ? (
          <Icon
            name={icon}
            size="xxsmall"
            fill="currentColor"
            className="shrink-0 text-icon-default"
          />
        ) : (
          icon
        )}
        <span className="text-body-small text-default">{label}</span>

        {/* Shown while editing a setting whose change cascades into another. */}
        {warning ? (
          <span className="ml-auto flex items-center gap-1 text-attention">
            <span className="text-label-small-emphasized">{warning}</span>
            <Icon name="warning" size="xsmall" fill="currentColor" className="shrink-0" />
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-[4px]">{children}</div>
    </div>
  );
}
