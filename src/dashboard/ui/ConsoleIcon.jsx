import { useEffect, useRef, useState } from 'react'
import { ConsoleBlob } from './ConsoleBlob'
import { useConsoleIconVariant } from './helpers'
import './ConsoleIcon.css'

// Console mark, drawn from the Rubik's cube art: two layers of cube tops. Hover
// plays one round trip: the bottom layer slides up under the top one, the tops
// tilt up into diamonds and turn back into a 2×2 grid of squares, then it all
// rebuilds. `thinking` loops: flash the tiles at random for 3s, then the round
// trip. Motion lives in ConsoleIcon.css, except variant="cube"'s turns (see CubeTurns).

// Grid quadrants as [x sign, y sign].
const SQUARES = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
// After the 45° turn the grid's top-left square sits at the top (n), and so on
// round. The bottom layer's n tile ends up exactly behind the top layer's s
// tile, so the two flash together.
const SLOTS = {
  top: ['n', 'e', 'w', 's'],
  bottom: ['s', 'be', 'bw', 'bs'],
}
// From ConsoleIcon.css: the collapse ends with the turn (380ms delay + 260ms), the
// expand with the drop (500ms delay + 380ms).
const EXPAND_MS = 880
const COLLAPSE_MS = 640
const FLASHING_MS = 3000
const FLASH_MS = 420

// variant="cube": after the fold, the eight tops become real 3D faces of an
// exploded 2×2×2 cube and twist like a Rubik's cube. First the two layers turn
// a quarter about the vertical axis in opposite directions; then the back-left
// and front-right slices turn a half about the down-right axis, also opposite.
// Every turn maps the cube onto itself, so it lands back on the resting image.
const TWIST_MS = 650
const SLICE_MS = 1000
const TURN_MS = TWIST_MS + SLICE_MS
// World units matching the CSS art: grid offset 3.5 × 0.88, layers ±2.5px on
// screen ÷ cos 35.26°, and the 5 × 0.88 tile less its rounded-join stroke.
const CELL = 3.08
const LAYER_Y = 3.062
const CORNER = 0.53
const HALF = 2.2 - CORNER / 2
const ISO_GROUND = Math.sin(Math.atan(Math.SQRT1_2))
const ISO_UP = Math.cos(Math.atan(Math.SQRT1_2))
const FACES = ['top', 'bottom'].flatMap((layer) => SQUARES.map(([sx, sz], i) => ({
  slot: SLOTS[layer][i],
  twistSign: layer === 'top' ? 1 : -1,
  center: [sx * CELL, sz * CELL],
  corners: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([cx, cz]) => [sx * CELL + cx * HALF, layer === 'top' ? LAYER_Y : -LAYER_Y, sz * CELL + cz * HALF]),
})))

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function cubePoints({ twistSign, center, corners }, twist, slice) {
  const a = twist * twistSign
  const [ca, sa] = [Math.cos(a), Math.sin(a)]
  // Which slice the block sits in once the layer twist has finished.
  const b = (center[0] * ca + center[1] * sa < 0 ? 1 : -1) * slice
  const [cb, sb] = [Math.cos(b), Math.sin(b)]
  return corners.map(([x0, y0, z0]) => {
    const x = x0 * ca + z0 * sa
    const z1 = -x0 * sa + z0 * ca
    const y = y0 * cb - z1 * sb
    const z = y0 * sb + z1 * cb
    const u = (x - z) * Math.SQRT1_2
    const v = (x + z) * Math.SQRT1_2
    return `${(8 + u).toFixed(3)},${(8 + v * ISO_GROUND - y * ISO_UP).toFixed(3)}`
  }).join(' ')
}

function CubeTurns({ svgRef }) {
  const groupRef = useRef(null)
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const pace = parseFloat(getComputedStyle(svgRef.current).getPropertyValue('--dui-console-icon-pace')) || 1
    const start = performance.now()
    let frame
    const draw = (now) => {
      const t = Math.min(TURN_MS, (now - start) / pace)
      const twist = easeInOut(Math.min(1, t / TWIST_MS)) * (Math.PI / 2)
      const slice = easeInOut(Math.max(0, t - TWIST_MS) / SLICE_MS) * Math.PI
      group.querySelectorAll('polygon').forEach((el, i) => el.setAttribute('points', cubePoints(FACES[i], twist, slice)))
      if (t < TURN_MS) frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [svgRef])

  return (
    <g ref={groupRef}>
      {FACES.map((face, i) => (
        <polygon
          key={i}
          data-slot={face.slot}
          points={cubePoints(face, 0, 0)}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={CORNER}
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Layer({ layer }) {
  return (
    <g className="dui-console-icon__tilt">
      <g className="dui-console-icon__turn">
        {SQUARES.map(([sx, sy], i) => (
          <rect
            key={`${sx}${sy}`}
            className="dui-console-icon__square"
            data-slot={SLOTS[layer][i]}
            x="-2.5"
            y="-2.5"
            width="5"
            height="5"
            rx="0.6"
            fill="currentColor"
            style={{ '--sx': sx, '--sy': sy }}
          />
        ))}
      </g>
    </g>
  )
}

// Blinks one visible tile out at a time, in random order, until `ms` is up.
function flashTiles(svg, ms, pace) {
  const slots = [...new Set(SLOTS.top.concat(SLOTS.bottom))]
  const end = performance.now() + ms - FLASH_MS * pace
  let last = null
  let timer
  const blip = () => {
    if (performance.now() > end) return
    const options = slots.filter((s) => s !== last)
    last = options[Math.floor(Math.random() * options.length)]
    svg.querySelectorAll(`[data-slot="${last}"]`).forEach((el) => el.animate(
      [{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }],
      { duration: FLASH_MS * pace, easing: 'ease-in-out' },
    ))
    timer = setTimeout(blip, (110 + Math.random() * 140) * pace)
  }
  blip()
  return () => {
    clearTimeout(timer)
    svg.querySelectorAll('[data-slot]').forEach((el) => el.getAnimations().forEach((a) => a.cancel()))
  }
}

// A pointer has to rest this long before a hover plays, so passing over doesn't.
const HOVER_INTENT_MS = 150
// Hover and focus won't replay within this long of the last play.
const REPLAY_COOLDOWN_MS = 4000

/**
 * @param size      16 or 24 (any number scales the 16-unit artwork)
 * @param thinking  loop the animation; when it turns off the loop finishes on the two layers
 * @param playOn    'hover' (default: a resting pointer or keyboard focus) or 'focus' (focus only)
 * @param still     never animate
 * @param variant   'cube' (the fold, then Rubik's cube layer and slice turns), 'base' (the fold only),
 *                  or 'blob' (the jelly character, see ConsoleBlob.jsx). Omit it to use the variant picked
 *                  on /components (useConsoleIconVariant).
 */
export function ConsoleIcon(props) {
  const picked = useConsoleIconVariant()
  const variant = props.variant ?? picked
  return variant === 'blob' ? <ConsoleBlob {...props} /> : <CubeIcon {...props} variant={variant} />
}

function CubeIcon({ size = 16, thinking = false, playOn = 'hover', still = false, variant = 'cube', label, className = '', style }) {
  const svgRef = useRef(null)
  const thinkingRef = useRef(thinking)
  useEffect(() => { thinkingRef.current = thinking }, [thinking])
  const lastPlayedRef = useRef(-Infinity)
  const cube = variant === 'cube'
  // rest → collapse → expand → (cube: turn) → (flash while thinking, else rest) → collapse …
  const [phase, setPhase] = useState('rest')
  if (thinking && !still && phase === 'rest' && !prefersReducedMotion()) setPhase('flash')

  useEffect(() => {
    const svg = svgRef.current
    const host = svg?.closest('.dui-console-icon-trigger') ?? svg
    if (!host || still) return
    let intent
    const play = () => {
      const now = performance.now()
      if (prefersReducedMotion() || now - lastPlayedRef.current < REPLAY_COOLDOWN_MS) return
      lastPlayedRef.current = now
      setPhase((p) => (p === 'rest' ? 'collapse' : p))
    }
    const enter = () => { intent = setTimeout(play, HOVER_INTENT_MS) }
    const leave = () => clearTimeout(intent)
    host.addEventListener('focusin', play)
    if (playOn === 'hover') {
      host.addEventListener('pointerenter', enter)
      host.addEventListener('pointerleave', leave)
    }
    return () => {
      clearTimeout(intent)
      host.removeEventListener('focusin', play)
      host.removeEventListener('pointerenter', enter)
      host.removeEventListener('pointerleave', leave)
    }
  }, [still, playOn])

  useEffect(() => {
    const svg = svgRef.current
    if (phase === 'rest' || !svg) return
    const pace = parseFloat(getComputedStyle(svg).getPropertyValue('--dui-console-icon-pace')) || 1
    const go = (next, ms) => {
      const t = setTimeout(() => setPhase(next()), ms * pace)
      return () => clearTimeout(t)
    }
    const settle = () => (thinkingRef.current ? 'flash' : 'rest')
    if (phase === 'collapse') return go(() => 'expand', COLLAPSE_MS)
    if (phase === 'expand') return go(cube ? () => 'turn' : settle, EXPAND_MS)
    if (phase === 'turn') return go(settle, TURN_MS)
    const stopFlash = flashTiles(svg, FLASHING_MS * pace, pace)
    const stopTimer = go(() => 'collapse', FLASHING_MS)
    return () => { stopFlash(); stopTimer() }
  }, [phase, cube])

  // Switching `thinking` off cuts the flashing short.
  useEffect(() => {
    if (phase !== 'flash' || thinking) return
    const t = setTimeout(() => setPhase('rest'), 0)
    return () => clearTimeout(t)
  }, [phase, thinking])

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={`dui-console-icon ${className}`.trim()}
      data-collapsed={phase === 'collapse' || undefined}
      data-thinking={thinking || undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={style}
    >
      {phase === 'turn' ? (
        <CubeTurns svgRef={svgRef} />
      ) : (
        <g className="dui-console-icon__lift">
          <g className="dui-console-icon__drop">
            <Layer layer="bottom" />
          </g>
          <Layer layer="top" />
        </g>
      )}
    </svg>
  )
}
