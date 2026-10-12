// Shared positioning and scroll fade for the conversation and design system.
// The surrounding scroll container determines where the dock sticks.
export function ComposerDock({ children, showFade = false, className = '', ...props }) {
  return (
    <div {...props} className={`composer-dock ${className}`}>
      <div
        aria-hidden="true"
        className="conversation-dock-fade"
        style={{ opacity: showFade ? 1 : 0 }}
      />
      {children}
    </div>
  );
}
