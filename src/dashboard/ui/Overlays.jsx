import { cloneElement, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { color, shadow } from './tokens'

const tooltipStyle = {
  backgroundColor: color.tooltip,
  color: '#FFFFFF',
  padding: '4px 8px',
  borderRadius: 6,
  fontSize: 14,
  lineHeight: '20px',
  letterSpacing: '-0.15px',
  whiteSpace: 'nowrap',
  zIndex: 9999,
  pointerEvents: 'none',
  position: 'fixed',
  transform: 'translateX(-50%)',
}

/** Dark tooltip shown 8px below its single child on hover. Portalled so it never clips. */
export function Tooltip({ label, children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 8, left: r.left + r.width / 2 })
  }
  return (
    <>
      <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} style={{ display: 'inline-flex' }}>
        {children}
      </span>
      {pos && createPortal(<div style={{ ...tooltipStyle, top: pos.top, left: pos.left }}>{label}</div>, document.body)}
    </>
  )
}

const popoverStyle = {
  position: 'fixed',
  zIndex: 10000,
  background: '#FFFFFF',
  borderRadius: 8,
  boxShadow: shadow.popover,
  border: `1px solid ${color.neutral100}`,
  padding: 4,
  minWidth: 160,
  maxWidth: 320,
  animation: 'dui-popover-in 150ms cubic-bezier(0.2, 0, 0.1, 1) both',
}

/**
 * Dropdown menu anchored to `trigger` (a single element). Closes on outside
 * click, Escape, or after selecting an item.
 *
 * items: [{ label, onSelect?, tone?: 'default' | 'critical', group?: string }]
 *        `group` starts a new labelled section.
 * align: 'left' | 'right' edge of the trigger to align with
 */
export function Menu({ trigger, items, align = 'right' }) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState(null)

  const close = useCallback(() => setPos(null), [])
  const toggle = () => {
    if (pos) return close()
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    setPos(align === 'right' ? { top: r.bottom + 4, right: window.innerWidth - r.right } : { top: r.bottom + 4, left: r.left })
  }

  useEffect(() => {
    if (!pos) return
    const onDown = e => {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) close()
    }
    const onKey = e => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pos, close])

  return (
    <>
      {cloneElement(trigger, { ref: triggerRef, onClick: toggle, 'aria-expanded': Boolean(pos) })}
      {pos && createPortal(
        <div ref={menuRef} role="menu" style={{ ...popoverStyle, ...pos, transformOrigin: align === 'right' ? 'top right' : 'top left' }}>
          {items.map((item, i) => (
            <div key={item.label}>
              {item.group && (
                <>
                  {i > 0 && <div style={{ height: 1, background: color.neutral50, margin: '4px -4px' }} />}
                  <div style={{ padding: '4px 8px', fontSize: 12, fontWeight: 600, color: color.subdued }}>{item.group}</div>
                </>
              )}
              <button
                type="button"
                role="menuitem"
                className="dui-menu-item"
                style={{ color: item.tone === 'critical' ? color.negative : color.textButton }}
                onClick={() => { item.onSelect?.(); close() }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

const ToastContext = createContext(() => {})

/**
 * Wrap a subtree in <ToastProvider> and call `const toast = useToast()` then
 * `toast('Saved')`. DashboardLayout already provides one.
 */
export function ToastProvider({ children, duration = 2400 }) {
  const [message, setMessage] = useState(null)
  const timer = useRef(null)
  const show = useCallback(text => {
    clearTimeout(timer.current)
    setMessage({ text, key: Date.now() })
    timer.current = setTimeout(() => setMessage(null), duration)
  }, [duration])
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <AnimatePresence>
          {message && <Toast key={message.key}>{message.text}</Toast>}
        </AnimatePresence>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}

/** The toast surface itself — exported for static previews. */
export function Toast({ children, inline = false }) {
  const base = {
    background: color.toast,
    color: '#FFFFFF',
    borderRadius: 6,
    padding: '12px 16px',
    fontSize: 14,
    lineHeight: '20px',
    letterSpacing: '-0.15px',
    whiteSpace: 'nowrap',
    boxShadow: '0px 5px 15px 0px rgba(0,0,0,0.12), 0px 15px 35px 0px rgba(48,49,61,0.08)',
  }
  if (inline) return <div style={{ ...base, display: 'inline-block' }}>{children}</div>
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
      style={{ ...base, position: 'fixed', bottom: 64, left: '50%', translateX: '-50%', zIndex: 10002, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Right-hand slide-over panel (detail views, create flows).
 * Controlled with `open` / `onClose`.
 */
export function Drawer({ open, onClose, title, children, footer, width = 480 }) {
  useLayoutEffect(() => {
    if (!open) return
    const onKey = e => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-scrim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,44,68,0.24)', zIndex: 10010 }}
          />
          <motion.aside
            key="drawer-panel"
            initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
            style={{ position: 'fixed', top: 8, right: 8, bottom: 8, width, background: '#FFFFFF', borderRadius: 12, boxShadow: shadow.popover, zIndex: 10011, display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: `1px solid ${color.neutral50}` }}>
              <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: color.text }}>{title}</span>
              <button type="button" aria-label="Close" onClick={onClose} className="dui-btn dui-btn--ghost dui-btn--icon" style={{ color: color.subdued }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 2.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{children}</div>
            {footer && <div className="flex justify-end gap-[8px]" style={{ padding: '12px 20px', borderTop: `1px solid ${color.neutral50}` }}>{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
