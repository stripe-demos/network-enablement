import { useCallback, useEffect, useRef, useState } from 'react'
import { color } from './tokens'

const MIN_THUMB = 24
const INSET = 2
const SCROLLING_MS = 900

/**
 * Vertical scroll container whose scrollbar floats over the content instead of
 * taking width from it, so content never shifts when overflow comes and goes.
 * The thumb shows while scrolling or hovering and can be dragged. The root gets
 * `data-scrolled` once scrolled off the top, for edge shadows on chrome above it.
 *
 * @param as             element for the scrolling viewport (e.g. 'main')
 * @param ref            forwarded to the viewport, the element that scrolls
 * @param className      layout classes for the outer box (e.g. 'flex-1')
 * @param viewportClassName / viewportStyle  padding etc. for the scrolling element
 */
export function ScrollArea({ as: Tag = 'div', ref, className = '', style, viewportClassName = '', viewportStyle, children }) {
  const viewportRef = useRef(null)
  const thumbRef = useRef(null)
  const [overflowing, setOverflowing] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [dragging, setDragging] = useState(false)

  const setViewport = useCallback((el) => {
    viewportRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }, [ref])

  const sync = useCallback(() => {
    const el = viewportRef.current
    const thumb = thumbRef.current
    if (!el || !thumb) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const over = scrollHeight - clientHeight > 1
    setOverflowing(over)
    setScrolled(over && scrollTop > 0)
    if (!over) return
    const track = clientHeight - INSET * 2
    const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * track)
    const top = (scrollTop / (scrollHeight - clientHeight)) * (track - height)
    thumb.style.height = `${height}px`
    thumb.style.transform = `translateY(${INSET + top}px)`
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    let idle
    const onScroll = () => {
      sync()
      setScrolling(true)
      clearTimeout(idle)
      idle = setTimeout(() => setScrolling(false), SCROLLING_MS)
    }
    const resize = new ResizeObserver(sync)
    const observeChildren = () => {
      resize.disconnect()
      resize.observe(el)
      for (const child of el.children) resize.observe(child)
    }
    const mutations = new MutationObserver(observeChildren)
    observeChildren()
    mutations.observe(el, { childList: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    sync()
    return () => {
      clearTimeout(idle)
      resize.disconnect()
      mutations.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [sync])

  const startDrag = (e) => {
    const el = viewportRef.current
    const thumb = thumbRef.current
    if (!el || !thumb) return
    e.preventDefault()
    thumb.setPointerCapture(e.pointerId)
    setDragging(true)
    const startY = e.clientY
    const startTop = el.scrollTop
    const track = el.clientHeight - INSET * 2 - thumb.offsetHeight
    const ratio = track > 0 ? (el.scrollHeight - el.clientHeight) / track : 0
    const move = (ev) => { el.scrollTop = startTop + (ev.clientY - startY) * ratio }
    const end = () => {
      setDragging(false)
      thumb.removeEventListener('pointermove', move)
      thumb.removeEventListener('pointerup', end)
      thumb.removeEventListener('pointercancel', end)
    }
    thumb.addEventListener('pointermove', move)
    thumb.addEventListener('pointerup', end)
    thumb.addEventListener('pointercancel', end)
  }

  return (
    <div
      className={`dui-scroll-area ${className}`.trim()}
      data-overflowing={overflowing || undefined}
      data-scrolled={scrolled || undefined}
      data-active={scrolling || dragging || undefined}
      style={style}
    >
      <Tag ref={setViewport} className={`dui-scroll-area__viewport ${viewportClassName}`.trim()} style={viewportStyle}>
        {children}
      </Tag>
      <div ref={thumbRef} className="dui-scroll-area__thumb" style={{ background: color.neutral300 }} onPointerDown={startDrag} aria-hidden="true" />
    </div>
  )
}
