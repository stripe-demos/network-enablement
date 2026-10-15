import { SetupTooltip } from './SetupTooltip';

/**
 * One choice inside an expanded SettingCard. The selected state thickens the
 * outline from 1px to 2px, but both weights are drawn as an inset ring rather
 * than a border so the card's box never changes size and the row can't reflow
 * when the selection moves.
 *
 * A disabled option can't be picked, dims its text, and — when a reason is
 * given — wraps in a SetupTooltip explaining why it's unavailable.
 */
export default function OptionCard({
  option,
  selected,
  onSelect,
  disabled = false,
  disabledReason,
  className = '',
}) {
  const handleKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  };

  const isSelected = selected && !disabled;
  const useTooltip = disabled && disabledReason;

  const card = (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      className={`rounded-[6px] px-2 py-[6px] transition-shadow duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(8,142,249,0.36)] ${
        disabled
          ? 'cursor-not-allowed bg-offset shadow-[inset_0_0_0_1px_var(--color-hairline)]'
          : isSelected
            ? 'cursor-pointer bg-surface shadow-[inset_0_0_0_2px_var(--color-brand)]'
            : 'cursor-pointer bg-surface shadow-[inset_0_0_0_1px_var(--color-hairline)] hover:bg-offset'
      } ${useTooltip ? 'h-full w-full' : className}`}
    >
      {/* Both lines are 12/16 in the design — only the weight and colour differ. */}
      <div className={disabled ? 'opacity-60' : ''}>
        <div
          className={`text-label-small-emphasized ${isSelected ? 'text-brand' : 'text-default'}`}
        >
          {option.label}
        </div>
        {option.description ? (
          <div className="mt-1 text-label-small text-subdued">{option.description}</div>
        ) : null}
      </div>
    </div>
  );

  if (useTooltip) {
    return (
      <SetupTooltip usePortal placement="bottom" variant="default" content={disabledReason} className={className}>
        {card}
      </SetupTooltip>
    );
  }

  return card;
}
