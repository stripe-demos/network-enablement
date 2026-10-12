export function TaskLiveText({ text, active = true }) {
  // Keep one glyph layer mounted when a task finishes. Both states use the
  // same font rasterization; only the highlight layer changes.
  return <span className="text-shimmer task-live-text" data-active={active} title={text} style={{ '--spread': `${text.length * 2}px` }}>{text}</span>;
}
