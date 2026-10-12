import { useState } from 'react';

// Drag-to-resize handle between conversation and canvas.
// Double-click resets to baseline ratio (40/60).
// Direct port of #resizeHandle behavior from prototypes/main/index.html.
//
// Visual states (matches the original):
//   idle        — 1px bar at left:1, color var(--color-surface-2) (border-subtle)
//   hover       — 4px bar at left:0, color var(--color-border-rail) (medium gray)
//   dragging    — 4px bar at left:0, color var(--color-accent) (blurple — brand)

const BAR_IDLE = { left: 1, width: 1, backgroundColor: 'var(--color-surface-2)' };
const BAR_HOVER = { left: 0, width: 4, backgroundColor: 'var(--color-border-rail)' };
const BAR_DRAG = { left: 0, width: 4, backgroundColor: 'var(--color-accent)' };

export function ResizeHandle({ onResize, onReset }) {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);

  function handleMouseDown(e) {
    e.preventDefault();
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function move(ev) {
      onResize(ev.clientX);
    }
    function up() {
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  // Drag wins over hover so the brand color persists while dragging even if
  // the cursor briefly leaves the 4px hit area.
  const barShape = dragging ? BAR_DRAG : hovering ? BAR_HOVER : BAR_IDLE;

  return (
    <div
      id="resizeHandle"
      style={{ width: 4, cursor: 'col-resize', position: 'relative', flexShrink: 0, zIndex: 10 }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onDoubleClick={onReset}
    >
      <div
        id="resizeBar"
        data-state={dragging ? 'dragging' : hovering ? 'hover' : 'idle'}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          ...barShape,
          transition: 'background-color 0.15s ease',
        }}
      />
    </div>
  );
}
