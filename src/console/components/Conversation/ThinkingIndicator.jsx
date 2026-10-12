export function ThinkingIndicator({ label = 'Thinking…' }) {
  return (
    <div data-chat-nav className="chat-thinking flex items-center w-full" role="status" style={{ gap: 6, padding: '5px 0' }}>
      <span className="think-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <span key={index} className="think-dot" />)}
      </span>
      <span className="text-shimmer" style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
