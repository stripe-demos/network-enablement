import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// ContextMenu — generic floating popup positioned at viewport (x, y)
// coordinates and rendered into <body> via a portal so it can escape
// any clipping ancestor. Closes on click-outside or Escape.
//
// Visual styling comes from `.item-popup` in src/index.css (the same
// class the original prototype used), so this matches the original
// blurred-dark overflow menu look 1:1.
//
// Props:
//   isOpen   — controlled open state
//   position — { x, y } in viewport coords (left/top of menu)
//   onClose  — called on outside click / Escape
//   style    — optional inline style merged onto the .item-popup wrapper.
//              Used by callers (e.g. ChatItemMenu's delete-confirm flow)
//              to fade the whole popup out before unmount.
//   children — menu rows
//   className — optional extra class on the `.item-popup` root
export function ContextMenu({ isOpen, position, onClose, children, style, className }) {
  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e) {
      // Anything inside an open menu has the .item-popup ancestor; clicks
      // landing elsewhere should dismiss the menu.
      if (!e.target.closest('.item-popup')) {
        onClose();
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    // Use mousedown (not click) so the trigger button's click handler can
    // still toggle the menu off in the same gesture.
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  return createPortal(
    <div
      className={className ? `item-popup ${className}` : 'item-popup'}
      style={{
        display: 'block',
        left: position.x,
        top: position.y,
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}
