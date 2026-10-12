import { useEffect } from 'react';
import { usePresence } from 'framer-motion';
import { ConsoleLegalFooter } from '../ConsoleLegalFooter';
import { RubiksCube } from '../Conversation/RubiksCube';

// Shared empty canvas: a still Rubik’s Cube and keyboard shortcuts.
// Preparation draws attention here; keep spinning through response streaming
// and the incoming canvas's entrance so there is no idle beat before delivery.

// Empty-state shortcut reference, ordered to match the New-page composition.
const SHORTCUTS = [
  {
    label: 'New conversation',
    badges: [
      { text: '⌘', size: 20 },
      { text: '/', size: 20 },
    ],
  },
  { label: 'Search conversations', badges: [{ text: '⌘', size: 20 }, { text: 'K', size: 20 }] },
  { label: 'Slash commands', badges: [{ text: '/', size: 20 }] },
  { label: 'Change theme', badges: [{ text: '/theme' }] },
  { label: 'Submit feedback', badges: [{ text: '/feedback' }] },
];

export function CanvasEmptyState({ cubePlaying = false, coverDuration = 0 }) {
  const [isPresent, safeToRemove] = usePresence();
  useEffect(() => {
    if (isPresent) return;
    // The empty layer stays opaque below the artifact while it fades in.
    // Register with AnimatePresence so an unchanged opacity doesn't remove
    // the cube before the new canvas has covered it.
    const timer = setTimeout(() => safeToRemove?.(), coverDuration);
    return () => clearTimeout(timer);
  }, [isPresent, safeToRemove, coverDuration]);
  return (
    <div
      className="flex flex-col bg-surface-0"
      style={{ flex: '1 1 0%', minWidth: 320, minHeight: 0, position: 'relative' }}
    >
      <section
        id="canvasEmptyState"
        className="flex flex-col bg-surface-0 min-w-0 overflow-hidden"
        style={{ flex: 1, minHeight: 0, position: 'relative' }}
      >
        <div className="canvas-empty-layout">
          <div className="canvas-empty-cube intro-cube">
            <RubiksCube playing={cubePlaying} loop />
          </div>
          <div className="canvas-empty-shortcuts">
            {SHORTCUTS.map(shortcut => <ShortcutRow key={shortcut.label} {...shortcut} />)}
          </div>
        </div>
        {/* Legal footer — pinned to the bottom of the panel, NOT
            inside the centered container, so the cube + shortcut
            stack stays optically centered regardless of the
            footer's presence or wrap state. The links are visual
            only (no href) per the design brief. */}
        <ConsoleLegalFooter />
      </section>
    </div>
  );
}

// Single row in the shortcut list — left-aligned label, right-aligned
// badge(s). The "New conversation" row has two side-by-side badges
// (⌘ + /); Search also uses two badges (⌘ + K).
function ShortcutRow({ label, badges }) {
  return (
    <div className="flex items-center justify-between w-full">
      <span
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: 'var(--color-text-tertiary)',
          lineHeight: 1.6,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {badges.length === 1 ? (
        <Badge {...badges[0]} />
      ) : (
        <div className="flex items-center" style={{ gap: 8 }}>
          {badges.map((b, i) => (
            <Badge key={i} {...b} />
          ))}
        </div>
      )}
    </div>
  );
}

// Single-key badges use a square cell; slash commands size to their text.
function Badge({ text, size }) {
  const isSquare = typeof size === 'number';
  return (
    <div
      className="flex items-center justify-center"
      style={{
        background: 'var(--color-surface-1)',
        borderRadius: 4,
        padding: isSquare ? 0 : '2px 6px',
        gap: 4,
        width: isSquare ? size : undefined,
        height: isSquare ? size : undefined,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 400,
          // Use the system text font for badges so the special
          // characters (⌘, ↑, ↓) render as the OS-native glyphs
          // rather than substituted Inter codepoints. Inter is fine
          // for Latin text (matches /feedback, Space, Soon).
          fontFamily:
            "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
          color: 'var(--color-text-tertiary)',
          lineHeight: '16px',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    </div>
  );
}
