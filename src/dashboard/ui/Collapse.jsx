import './ui.css'

/**
 * Accordion reveal: animates its children's height open and closed (ease in
 * and out, 200ms by default). Closed content stays mounted but is inert, so
 * it's skipped by focus and screen readers.
 */
export function Collapse({ open, duration = 200, children }) {
  return (
    <div
      className="dui-collapse"
      data-open={open ? '' : undefined}
      style={{ '--dui-collapse-duration': `${duration}ms` }}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="dui-collapse__inner">{children}</div>
    </div>
  )
}
