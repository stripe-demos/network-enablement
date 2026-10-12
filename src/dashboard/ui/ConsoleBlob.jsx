import { useEffect, useId, useRef } from 'react'
import { color } from './tokens'

// ConsoleIcon variant="blob": a glowing jelly with two eyes. The outline is 64
// radii round the centre, each on its own spring, so moving between poses
// wobbles like jelly. Hover waves through blob → star → lump and back in about
// 1.5s; `thinking` loops through the same poses at a slower beat, the eyes and
// the pink hot spot moving with each one.

const TAU = Math.PI * 2
const N = 64
const R = 30
const C = 50
const FLOOR = C + R * 0.9
const ANGLES = Array.from({ length: N }, (_, i) => (i / N) * TAU)

const rounded = (n) => (t) => (Math.abs(Math.cos(t)) ** n + Math.abs(Math.sin(t)) ** n) ** (-1 / n)
const squircle = rounded(4.2)
const softSquare = rounded(3.2)

// Radius as a fraction of R by angle (0 = right, clockwise since SVG y points
// down); eyes and hot spot as offsets from the centre in R.
const POSES = {
  rest: { r: (t) => 0.9 * squircle(t), eyes: [-0.24, -0.5], hot: [0, -0.62] },
  blob: {
    r: (t) => 0.9 * softSquare(t) * (1 + 0.1 * Math.cos(t + 0.85) + 0.05 * Math.cos(2 * t + 2.4) + 0.04 * Math.cos(3 * t - 0.6)),
    eyes: [0.5, -0.12],
    hot: [0.35, -0.5],
  },
  star: { r: (t) => 0.85 + 0.15 * Math.cos(5 * t + Math.PI / 2), eyes: [-0.05, -0.42], hot: [0, -0.55] },
  lump: {
    r: (t) => 0.88 * (1 + 0.08 * Math.cos(t + 0.6) + 0.055 * Math.cos(5 * t + 5.5) + 0.04 * Math.cos(2 * t + 0.2)),
    eyes: [0.5, 0.55],
    hot: [0.45, 0.3],
  },
}
const RADII = Object.fromEntries(Object.entries(POSES).map(([k, p]) => [k, ANGLES.map(p.r)]))
const THINKING = ['blob', 'star', 'lump', 'rest']
const BEAT_MS = 1100
const WAVE = ['blob', 'star', 'lump', 'rest']
const WAVE_STEP_MS = 380

// [rest value, stiffness, damping]. Underdamped on purpose: the overshoot is the jelly.
const SPRINGS = {
  sx: [1, 260, 14], sy: [1, 260, 14], bob: [0, 220, 16], rot: [0, 120, 13], blink: [1, 1400, 60],
  ex: [POSES.rest.eyes[0], 170, 18], ey: [POSES.rest.eyes[1], 170, 18],
  hx: [POSES.rest.hot[0], 60, 14], hy: [POSES.rest.hot[1], 60, 14],
}
// Neighbouring radii settle at slightly different rates, so a morph ripples.
const RADIUS_STIFFNESS = ANGLES.map((t) => 150 * (1 + 0.25 * Math.sin(3 * t)))
const RADIUS_DAMPING = 11

const lerp = (a, b, t) => a + (b - a) * t

function smoothPath(pts) {
  const n = pts.length
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]]
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  return `${d}Z`
}

// Squash and stretch are anchored on the floor so the jelly stays sat down.
function geometry({ radii, sx, sy, bob, rot, ex, ey, hx, hy, blink }) {
  const a = (rot * Math.PI) / 180
  const [ca, sa] = [Math.cos(a), Math.sin(a)]
  const place = (x, y) => [C + (x * ca - y * sa) * sx, FLOOR + (C + x * sa + y * ca - FLOOR) * sy + bob]
  const pts = radii.map((r, i) => place(R * r * Math.cos(ANGLES[i]), R * r * Math.sin(ANGLES[i])))
  return { d: smoothPath(pts), eyes: place(ex * R, ey * R), hot: place(hx * R, hy * R), blink }
}

const restValues = () => ({ ...Object.fromEntries(Object.entries(SPRINGS).map(([k, [x]]) => [k, x])), radii: RADII.rest })
const REST = geometry(restValues())
const eyeTransform = ({ eyes, blink }) => `translate(${eyes[0].toFixed(2)} ${eyes[1].toFixed(2)}) scale(1 ${blink.toFixed(3)})`

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function createMotion(svg, nodes) {
  const springs = Object.fromEntries(Object.entries(SPRINGS).map(([k, [x, stiff, damp]]) => [k, { x, v: 0, to: x, stiff, damp }]))
  const radii = { x: [...RADII.rest], v: new Array(N).fill(0), to: [...RADII.rest] }
  const timers = new Set()
  let frame = 0
  let last = 0
  let thinking = false
  let beat = 0
  const pace = () => parseFloat(getComputedStyle(svg).getPropertyValue('--dui-console-icon-pace')) || 1

  const tick = (now) => {
    const p = pace()
    const dt = Math.min(1 / 30, (now - last) / 1000) / p
    last = now
    let moving = false
    for (const s of Object.values(springs)) {
      s.v += (s.stiff * (s.to - s.x) - s.damp * s.v) * dt
      s.x += s.v * dt
      moving ||= Math.abs(s.to - s.x) > 1e-3 || Math.abs(s.v) > 1e-3
    }
    for (let i = 0; i < N; i++) {
      radii.v[i] += (RADIUS_STIFFNESS[i] * (radii.to[i] - radii.x[i]) - RADIUS_DAMPING * radii.v[i]) * dt
      radii.x[i] += radii.v[i] * dt
      moving ||= Math.abs(radii.to[i] - radii.x[i]) > 1e-4 || Math.abs(radii.v[i]) > 1e-3
    }
    const values = Object.fromEntries(Object.entries(springs).map(([k, s]) => [k, s.x]))
    if (thinking) {
      const breath = Math.sin((now / p / 1000) * TAU * 1.3) * 0.025
      values.sy *= 1 + breath
      values.sx *= 1 - breath * 0.6
    }
    const g = geometry({ ...values, radii: radii.x })
    nodes.shape.setAttribute('d', g.d)
    nodes.fill.setAttribute('cx', g.hot[0].toFixed(2))
    nodes.fill.setAttribute('cy', g.hot[1].toFixed(2))
    nodes.eyes.setAttribute('transform', eyeTransform(g))
    frame = moving || thinking ? requestAnimationFrame(tick) : 0
  }
  const wake = () => {
    if (frame) return
    last = performance.now()
    frame = requestAnimationFrame(tick)
  }
  const set = (values) => {
    Object.entries(values).forEach(([k, v]) => { springs[k].to = v })
    wake()
  }
  const pose = (name, amount = 1) => {
    const { eyes, hot } = POSES[name]
    const rest = POSES.rest
    radii.to = RADII[name].map((r, i) => lerp(RADII.rest[i], r, amount))
    set({ ex: lerp(rest.eyes[0], eyes[0], amount), ey: lerp(rest.eyes[1], eyes[1], amount), hx: lerp(rest.hot[0], hot[0], amount), hy: lerp(rest.hot[1], hot[1], amount) })
  }
  const at = (ms, fn) => {
    const t = setTimeout(() => { timers.delete(t); fn() }, ms * pace())
    timers.add(t)
  }
  const clear = () => { timers.forEach(clearTimeout); timers.clear() }
  const blink = () => { set({ blink: 0.1 }); at(90, () => set({ blink: 1 })) }

  const nextBeat = () => {
    const name = THINKING[beat++ % THINKING.length]
    set({ sx: 1.08, sy: 0.9 })
    at(120, () => { pose(name); set({ sx: 1, sy: 1, rot: name === 'star' ? -6 : 0 }) })
    if (Math.random() < 0.6) at(BEAT_MS * (0.5 + Math.random() * 0.3), blink)
    at(BEAT_MS, nextBeat)
  }

  return {
    wave() {
      if (thinking) return
      clear()
      WAVE.forEach((name, i) => at(i * WAVE_STEP_MS, () => {
        set({ sx: 1.06, sy: 0.92 })
        at(70, () => { pose(name); set({ sx: 1, sy: 1, rot: name === 'star' ? -6 : 0 }) })
      }))
      at(WAVE.length * WAVE_STEP_MS + 200, blink)
    },
    think(on) {
      if (on === thinking) return
      thinking = on
      clear()
      if (on) {
        beat = 0
        nextBeat()
      } else {
        pose('rest')
        set({ sx: 1, sy: 1, bob: 0, rot: 0, blink: 1 })
      }
    },
    stop() {
      clear()
      cancelAnimationFrame(frame)
    },
  }
}

const HOVER_INTENT_MS = 120
const REPLAY_COOLDOWN_MS = 2500

export function ConsoleBlob({ size = 16, thinking = false, playOn = 'hover', still = false, label, className = '', style }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const svgRef = useRef(null)
  const shapeRef = useRef(null)
  const fillRef = useRef(null)
  const eyesRef = useRef(null)
  const motionRef = useRef(null)
  const id = (name) => `dui-blob-${uid}-${name}`
  const url = (name) => `url(#${id(name)})`
  // Small icons get bigger eyes so the face still reads; big ones get the halftone and floor glow.
  // At 8px each eye needs to be about a pixel, and the glow is kept light so it doesn't smear the shape.
  const tiny = size <= 10
  const eyeScale = tiny ? 3.4 : size <= 24 ? 2.2 : size <= 48 ? 1.5 : 1
  const eyeGap = (tiny ? 2.6 : 3.4) * eyeScale
  const halftone = size >= 32
  const reflection = size >= 64
  const c = color.consoleBlob

  useEffect(() => {
    const svg = svgRef.current
    if (still || !svg) return
    const motion = createMotion(svg, { shape: shapeRef.current, fill: fillRef.current, eyes: eyesRef.current })
    motionRef.current = motion
    const host = svg.closest('.dui-console-icon-trigger') ?? svg
    let intent
    let lastPlayed = -Infinity
    const play = () => {
      const now = performance.now()
      if (prefersReducedMotion() || now - lastPlayed < REPLAY_COOLDOWN_MS) return
      lastPlayed = now
      motion.wave()
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
      motion.stop()
      motionRef.current = null
    }
  }, [still, playOn])

  useEffect(() => {
    motionRef.current?.think(thinking && !prefersReducedMotion())
  }, [thinking, still, playOn])

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="18 18 64 64"
      className={`dui-console-icon dui-console-blob ${className}`.trim()}
      data-thinking={thinking || undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={style}
    >
      <defs>
        <path ref={shapeRef} id={id('shape')} d={REST.d} />
        <radialGradient ref={fillRef} id={id('fill')} gradientUnits="userSpaceOnUse" cx={REST.hot[0]} cy={REST.hot[1]} r="58">
          <stop offset="0" stopColor={c.hot} />
          <stop offset="0.2" stopColor={c.hot} />
          <stop offset="0.52" stopColor={c.violet} />
          <stop offset="0.88" stopColor={c.pale} />
        </radialGradient>
        <clipPath id={id('clip')}><use href={`#${id('shape')}`} /></clipPath>
        <filter id={id('glow')} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={id('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" /></filter>
        {halftone && (
          <>
            <pattern id={id('dots')} width="2.4" height="2.4" patternUnits="userSpaceOnUse">
              <rect x="0.6" y="0.6" width="1.1" height="1.1" rx="0.3" fill={c.pale} />
            </pattern>
            <mask id={id('halo')}>
              <use href={`#${id('shape')}`} fill="white" stroke="white" strokeWidth="5" filter={url('soft')} />
            </mask>
          </>
        )}
      </defs>
      {reflection && (
        <>
          <filter id={id('floor')} filterUnits="userSpaceOnUse" x="0" y={FLOOR - 10} width="100" height="50"><feGaussianBlur stdDeviation="6" /></filter>
          <ellipse cx={C} cy={FLOOR + 14} rx={R * 0.9} ry={4} fill={c.glow} opacity={0.3} filter={url('floor')} />
        </>
      )}
      <use href={`#${id('shape')}`} fill={c.glow} opacity={tiny ? 0.4 : 0.75} filter={url('glow')} />
      <use href={`#${id('shape')}`} fill={url('fill')} />
      <g clipPath={url('clip')}>
        <use href={`#${id('shape')}`} fill="none" stroke={c.pale} strokeWidth="8" opacity={0.85} filter={url('soft')} />
      </g>
      {halftone && <rect x="0" y="0" width="100" height="100" fill={url('dots')} mask={url('halo')} opacity={0.4} style={{ mixBlendMode: 'screen' }} />}
      <g ref={eyesRef} transform={eyeTransform(REST)} fill={c.eye}>
        <ellipse cx={-eyeGap} cy="0" rx={1.25 * eyeScale} ry={1.7 * eyeScale} />
        <ellipse cx={eyeGap} cy="0" rx={1.25 * eyeScale} ry={1.7 * eyeScale} />
      </g>
    </svg>
  )
}
