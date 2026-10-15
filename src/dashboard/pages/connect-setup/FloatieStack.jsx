// The bottom-right column the floaties share (Setup guide on Home, the
// Enablement floatie everywhere). Mounted once in DashboardLayout and portaled
// to <body> so page transforms don't capture the fixed positioning. Panels
// portal into it (floatieStackNode.js); CSS `order` keeps the Enablement floatie
// above the Setup guide whichever mounts first.
import { createPortal } from 'react-dom';
import { font } from '@dashboard/ui';
import { GUIDE_BOTTOM, GUIDE_RIGHT, GUIDE_WIDTH, setFloatieStackNode } from './floatieStackNode';

export default function FloatieStack() {
  return createPortal(
    <div data-wireframe-show="" className="text-default" style={{ fontFamily: font.text, WebkitFontSmoothing: 'antialiased' }}>
      {/* The column itself ignores clicks so the gap between floaties doesn't block the page. */}
      <div
        ref={setFloatieStackNode}
        className="fixed z-40 flex flex-col"
        style={{ right: GUIDE_RIGHT, bottom: GUIDE_BOTTOM, width: GUIDE_WIDTH, gap: 8, pointerEvents: 'none' }}
      />
    </div>,
    document.body
  );
}
