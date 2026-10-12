// NavRow — generic icon + label row atom.
// Used in the sidebar bottom rail (Settings, Dashboard) and the settings nav list.
// Supports an optional collapsed tooltip (pass `railOpen` + `tooltipRef` for rail behavior).

export function NavRow({ icon, label, active, railOpen, tooltipRef, onClick, className }) {
  const showTooltip = typeof railOpen !== 'undefined' && tooltipRef;

  return (
    <div
      className={`nav-row flex items-center${className ? ' ' + className : ''}`}
      data-tooltip={label}
      onClick={onClick}
      onMouseEnter={showTooltip ? (e) => {
        if (railOpen) return;
        const tip = tooltipRef.current;
        if (!tip) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const railRect = e.currentTarget.closest('#iconRail')?.getBoundingClientRect();
        if (!railRect) return;
        tip.textContent = label;
        tip.style.left = railRect.right - 4 + 'px';
        tip.style.top = rect.top + rect.height / 2 + 'px';
        tip.style.transition = 'opacity 150ms ease, transform 150ms ease';
        tip.style.transform = 'translateY(-50%) translateX(0)';
        tip.style.opacity = '1';
      } : undefined}
      onMouseLeave={showTooltip ? () => {
        const tip = tooltipRef.current;
        if (!tip) return;
        tip.style.transition = 'opacity 500ms ease, transform 500ms ease';
        tip.style.opacity = '0';
        tip.style.transform = 'translateY(-50%) translateX(-4px)';
      } : undefined}
      style={{
        padding: '4px 8px 4px 6px',
        gap: 10,
        overflow: 'hidden',
        borderRadius: 6,
        cursor: 'pointer',
        height: 32,
        background: active ? 'var(--color-surface-2)' : 'transparent',
      }}
    >
      <span className="shrink-0 flex items-center justify-center" style={{ width: 16, height: 16, color: active ? 'var(--color-icon-default)' : 'var(--color-text-tertiary)', overflow: 'hidden' }}>{icon}</span>
      <span
        className="nav-row-label"
        style={{
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.6,
          color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
          ...(typeof railOpen !== 'undefined' ? { opacity: railOpen ? 1 : 0, transition: 'opacity 150ms ease' } : {}),
        }}
      >
        {label}
      </span>
    </div>
  );
}
