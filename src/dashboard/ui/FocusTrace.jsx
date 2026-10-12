import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { color } from './tokens'
import { FOCUS_TRACE_SPEEDS } from './focusTraceSpeeds'
import './FocusTrace.css'

// Kept in step with FocusTrace.css.
const EXIT_MS = 280
// The band is drawn as short dashes that travel together, each one slice of
// the color.consoleOrbit ramp. Degrees are a share of the outline (360 = the
// whole way round), so the band moves at an even pace on any shape.
const SLICES = 72

const parseRgba = (value) => value.match(/[\d.]+/g).map(Number)

function orbitColorAt(deg) {
  const stops = color.consoleOrbit
  const i = Math.max(0, stops.findIndex(([d]) => d >= deg) - 1)
  const [d0, c0] = stops[i]
  const [d1, c1] = stops[Math.min(i + 1, stops.length - 1)]
  const t = d1 === d0 ? 0 : Math.min(1, Math.max(0, (deg - d0) / (d1 - d0)))
  const [r0, g0, b0, a0] = parseRgba(c0)
  const [r1, g1, b1, a1] = parseRgba(c1)
  const mix = (a, b) => a + (b - a) * t
  return { stroke: `rgb(${mix(r0, r1)}, ${mix(g0, g1)}, ${mix(b0, b1)})`, opacity: mix(a0, a1) }
}

const BAND_FROM = color.consoleOrbit[0][0]
const BAND_TO = color.consoleOrbit[color.consoleOrbit.length - 1][0]
const BASE = orbitColorAt(BAND_TO)
const BAND = Array.from({ length: SLICES }, (_, i) => {
  const from = BAND_FROM + ((BAND_TO - BAND_FROM) * i) / SLICES
  const to = BAND_FROM + ((BAND_TO - BAND_FROM) * (i + 1)) / SLICES
  return { from, to, ...orbitColorAt((from + to) / 2) }
})

// Clockwise from the top edge, just past the top-left corner. `radii` is
// [top-left, top-right, bottom-right, bottom-left].
function outline(w, h, radii, inset) {
  const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r - inset, (x1 - x0) / 2, (y1 - y0) / 2)))
  const arc = (r, x, y) => (r ? ` A${r},${r} 0 0 1 ${x},${y}` : '')
  const d = `M${x0 + tl},${y0} H${x1 - tr}${arc(tr, x1, y0 + tr)} V${y1 - br}${arc(br, x1 - br, y1)} H${x0 + bl}${arc(bl, x0, y1 - bl)} V${y0 + tl}${arc(tl, x0 + tl, y0)} Z`
  const length = 2 * (x1 - x0 + y1 - y0) + (Math.PI / 2 - 2) * (tl + tr + br + bl)
  return { d, length }
}

function clippingAncestors(el) {
  const list = []
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node)
    if (overflowX !== 'visible' || overflowY !== 'visible') list.push(node)
  }
  return list
}

// Corners the box shares with a rounded clipping ancestor (a card in the
// corner of CardGrid) take that ancestor's inner radius, so the ring follows
// the visible curve instead of being cut off by it.
function cornerRadii(el, rect, radius) {
  const radii = [radius, radius, radius, radius]
  for (const clip of clippingAncestors(el)) {
    const s = getComputedStyle(clip)
    const cr = clip.getBoundingClientRect()
    const bt = parseFloat(s.borderTopWidth), br = parseFloat(s.borderRightWidth)
    const bb = parseFloat(s.borderBottomWidth), bl = parseFloat(s.borderLeftWidth)
    const near = (a, b) => Math.abs(a - b) < 1
    const top = near(rect.top, cr.top + bt), bottom = near(rect.bottom, cr.bottom - bb)
    const left = near(rect.left, cr.left + bl), right = near(rect.right, cr.right - br)
    const inner = (value, a, b) => Math.max(0, parseFloat(value) - Math.max(a, b))
    const corners = [
      [top && left, inner(s.borderTopLeftRadius, bt, bl)],
      [top && right, inner(s.borderTopRightRadius, bt, br)],
      [bottom && right, inner(s.borderBottomRightRadius, bb, br)],
      [bottom && left, inner(s.borderBottomLeftRadius, bb, bl)],
    ]
    corners.forEach(([shared, r], i) => { if (shared) radii[i] = Math.max(radii[i], r) })
  }
  return radii
}

// A fixed box over `target`, trimmed horizontally to what its scrolling
// ancestors show (so a wide table row's ring hugs the visible row), with the
// vertical overflow clipped rather than reshaped.
function useTrackedBox(target, enabled) {
  const [box, setBox] = useState(null)
  useEffect(() => {
    const el = target?.current
    if (!enabled || !el) return undefined
    const clips = clippingAncestors(el)
    let frame
    const tick = () => {
      const r = el.getBoundingClientRect()
      let left = r.left, right = r.right, top = -Infinity, bottom = Infinity
      for (const c of clips) {
        const cr = c.getBoundingClientRect()
        left = Math.max(left, cr.left)
        right = Math.min(right, cr.right)
        top = Math.max(top, cr.top)
        bottom = Math.min(bottom, cr.bottom)
      }
      const next = {
        left, top: r.top, width: Math.max(0, right - left), height: r.height,
        clipTop: Math.max(0, top - r.top), clipBottom: Math.max(0, r.bottom - bottom),
      }
      setBox((prev) => (prev && Object.keys(next).every((k) => Math.abs(prev[k] - next[k]) < 0.5) ? prev : next))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [target, enabled])
  return enabled ? box : null
}

/**
 * Console's orbiting focus border (from the growth-studio chart cards): a
 * purple band trailing pink and yellow travels around an object's outline
 * over a faint neutral ring, while Console is looking at it (e.g. a card or
 * table row asked about). Fades in and out with `active`; holds still under
 * reduced motion.
 *
 * Inline: drop it in a `position: relative` box and it fills it.
 * Follow: pass `target` (a ref) and it overlays that element from document.body,
 * for things like table rows that can't host an overlay.
 *
 * `speed` picks the effect (FOCUS_TRACE_SPEEDS): 'slow', 'medium' and 'fast' make one
 * lap, fading the band in as it sets off and out as it arrives back; 'loop'
 * keeps orbiting while active. `duration` overrides the lap time in ms.
 */
export function FocusTrace({ active, target, speed = 'loop', duration: durationOverride, radius = 8, weight = 1.5 }) {
  const preset = FOCUS_TRACE_SPEEDS[speed] ?? FOCUS_TRACE_SPEEDS.loop
  const duration = durationOverride ?? preset.duration
  const { loops } = preset
  const [mounted, setMounted] = useState(active)
  if (active && !mounted) setMounted(true)
  useEffect(() => {
    if (active || !mounted) return undefined
    const id = setTimeout(() => setMounted(false), EXIT_MS)
    return () => clearTimeout(id)
  }, [active, mounted])

  const svgRef = useRef(null)
  const [size, setSize] = useState(null)
  const following = Boolean(target)
  const box = useTrackedBox(target, mounted && following)

  // A looping band has no end to wait for, so it can sit paused while scrolled
  // out of view. One-lap runs always play through: callers time off them.
  const loopsForever = !Number.isFinite(loops)
  const [offscreen, setOffscreen] = useState(false)
  useEffect(() => {
    const el = following ? target?.current : svgRef.current
    if (!mounted || !loopsForever || !el) return undefined
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
    observer.observe(el)
    return () => { observer.disconnect(); setOffscreen(false) }
  }, [mounted, loopsForever, following, target])
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!mounted || following || !svg) return undefined
    const measure = () => {
      const r = svg.getBoundingClientRect()
      const radii = cornerRadii(svg, r, radius)
      setSize((prev) => (
        prev && prev.w === r.width && prev.h === r.height && prev.radii.every((v, i) => v === radii[i])
          ? prev
          : { w: r.width, h: r.height, radii }
      ))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [mounted, following, radius])

  if (!mounted) return null

  const w = following ? box?.width : size?.w
  const h = following ? box?.height : size?.h
  const radii = following ? [radius, radius, radius, radius] : size?.radii
  const shape = w && h ? outline(w, h, radii, weight / 2) : null
  const px = (deg) => (shape.length * deg) / 360
  const svg = (
    <svg
      ref={svgRef}
      className={`dui-focus-trace${following ? ' dui-focus-trace--follow' : ''}${active ? '' : ' dui-focus-trace--out'}${offscreen ? ' dui-focus-trace--offscreen' : ''}`}
      style={{
        '--trace-length': `${shape?.length ?? 0}px`,
        '--trace-duration': `${duration}ms`,
        '--trace-loops': Number.isFinite(loops) ? loops : 'infinite',
        ...(following && box ? {
          left: box.left, top: box.top, width: box.width, height: box.height,
          clipPath: `inset(${box.clipTop}px 0 ${box.clipBottom}px 0)`,
        } : null),
      }}
      aria-hidden="true"
      focusable="false"
    >
      {shape && (
        <g fill="none" strokeWidth={weight}>
          <path d={shape.d} stroke={BASE.stroke} strokeOpacity={BASE.opacity} />
          <g className={`dui-focus-trace__band${Number.isFinite(loops) ? ' dui-focus-trace__band--once' : ''}`}>
            {BAND.map(({ from, to, stroke, opacity }) => {
              // A hair of overlap so neighbouring slices don't leave seams.
              const len = px(to - from) + 0.5
              return (
                <path
                  key={from}
                  d={shape.d}
                  stroke={stroke}
                  strokeOpacity={opacity}
                  strokeDasharray={`${len} ${shape.length - len}`}
                  style={{ '--trace-start': `${px(from)}px` }}
                />
              )
            })}
          </g>
        </g>
      )}
    </svg>
  )
  return following ? createPortal(svg, document.body) : svg
}
