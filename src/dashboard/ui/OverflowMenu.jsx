import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { color } from './tokens'
import './OverflowMenu.css'

const MENU_GAP = 4
const MENU_EDGE = 8

function MoreGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5Z" fill="currentColor" />
      <path d="M13.5 9.5C14.3284 9.5 15 8.82843 15 8C15 7.17157 14.3284 6.5 13.5 6.5C12.6716 6.5 12 7.17157 12 8C12 8.82843 12.6716 9.5 13.5 9.5Z" fill="currentColor" />
      <path d="M2.5 9.5C3.32843 9.5 4 8.82843 4 8C4 7.17157 3.32843 6.5 2.5 6.5C1.67157 6.5 1 7.17157 1 8C1 8.82843 1.67157 9.5 2.5 9.5Z" fill="currentColor" />
    </svg>
  )
}

function OverflowMenuItem({ label, onSelect }) {
  // Arrow-key focus reuses the hover highlight, as in the table menus.
  const [active, setActive] = useState(false)
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onClick={onSelect}
      style={{
        padding: '6px 10px',
        borderRadius: 6,
        background: active ? color.neutral25 : 'transparent',
        cursor: 'pointer',
        fontSize: 14,
        lineHeight: '20px',
        letterSpacing: -0.15,
        color: color.text,
        transition: 'background 100ms',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      {label}
    </div>
  )
}

/**
 * "…" button that opens a fixed, portalled menu (the Home Performance card
 * menu). Flips above the button when there's no room below; arrow keys walk
 * the items, Enter picks, Escape closes; scrolling or resizing closes it.
 *
 * items: [{ label, onSelect? } | { divider: true }]
 * label: the button's aria-label (e.g. "More options for Gross volume")
 * reveal: 'hover' hides the button until a `.dui-overflow-host` ancestor is
 *         hovered or focused (Card does this when given `menu`)
 */
export function OverflowMenu({ items, label = 'More options', menuLabel, reveal = 'always', style }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0, above: false })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  const toggle = () => {
    if (open) { setOpen(false); return }
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + MENU_GAP, right: Math.max(MENU_EDGE, document.documentElement.clientWidth - rect.right), above: false })
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open || !menuRef.current || !buttonRef.current) return
    // offset sizes ignore the entry animation's scale.
    const menu = { width: menuRef.current.offsetWidth, height: menuRef.current.offsetHeight }
    const button = buttonRef.current.getBoundingClientRect()
    const { clientWidth: vw, clientHeight: vh } = document.documentElement
    const fitsBelow = button.bottom + MENU_GAP + menu.height <= vh - MENU_EDGE
    const fitsAbove = button.top - MENU_GAP - menu.height >= MENU_EDGE
    const above = !fitsBelow && fitsAbove
    const top = above
      ? button.top - MENU_GAP - menu.height
      : Math.max(MENU_EDGE, Math.min(button.bottom + MENU_GAP, vh - MENU_EDGE - menu.height))
    const right = Math.min(Math.max(MENU_EDGE, vw - button.right), vw - MENU_EDGE - menu.width)
    if (top !== pos.top || right !== pos.right || above !== pos.above) setPos({ top, right, above })
  }, [open, pos])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return
      const els = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])
      if (els.length === 0) return
      const current = els.indexOf(document.activeElement)
      if (e.key === 'Enter') {
        if (current === -1) return
        e.preventDefault()
        els[current].click()
        return
      }
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      const next = current === -1 ? (step === 1 ? 0 : els.length - 1) : (current + step + els.length) % els.length
      els[next].focus()
    }
    // The menu is fixed to the viewport, so it can't follow its button.
    const onViewportChange = () => setOpen(false)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`dui-overflow-trigger${reveal === 'hover' ? ' dui-overflow-trigger--reveal' : ''}${open ? ' dui-overflow-trigger--open' : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        style={style}
      >
        <MoreGlyph />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={menuLabel}
          className={`dui-overflow-menu${pos.above ? ' dui-overflow-menu--above' : ''}`}
          style={{ top: pos.top, right: pos.right }}
        >
          {items.map((item, i) => (item.divider
            ? <div key={`divider-${i}`} role="separator" className="dui-overflow-menu__divider" />
            : <OverflowMenuItem key={item.label} label={item.label} onSelect={() => { close(); item.onSelect?.() }} />
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
