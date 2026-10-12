// MessageIndicator — the small 8x8 square dot rendered to the left of an
// assistant response. Highlights to the icon-primary color when it is the
// latest reply in the chat; reverts to the muted dark gray once a newer
// reply is added below it.

const COLOR_LATEST = 'var(--color-icon-default)'; // matches the original Tailwind 'icon-primary' token
const COLOR_OLDER = 'var(--color-border-default)';

export function MessageIndicator({ isLatest = false }) {
  return (
    <div className="message-indicator shrink-0" style={{ paddingTop: 7 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '1.5px',
          background: isLatest ? COLOR_LATEST : COLOR_OLDER,
          transition: 'background 250ms ease',
        }}
      />
    </div>
  );
}
