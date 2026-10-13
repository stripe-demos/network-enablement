// Hero for the network onboarding Welcome step: the top half of a dotted globe
// (after Figma "globe" in Sally's Sandbox, node 397:39348) that keeps turning
// while platforms, named and unnamed, connect to businesses they share all
// around the network. Drawn on a canvas with HTML labels; continents are procedural, so
// no map data ships with the prototype.
import { useEffect, useRef } from 'react'

const HEIGHT = 220
const BACKGROUND = '#23252B'
const DOT_COUNT = 9000
const LAND_THRESHOLD = 0.53
const BASE_ROT = 0.6
const SPIN = 0.11          // radians per second, about one turn a minute
const TILT = 0.38          // radians, tips the north pole toward the viewer
const ASSETS = '/dashboard-assets/network'
const GROW = 900           // ms for a connection to draw
const FADE = 700           // ms for a connection to fade
const POP = 450            // ms for a node to pop in
const PULSE = 2200         // ms for a pulse to travel a connection
const BAND = [Math.sin((18 * Math.PI) / 180), Math.sin((64 * Math.PI) / 180)] // latitudes that pass through view

// Labeled platforms, spread around the globe by longitude offset from the front
// (radians; negative is to the left, so they turn into view later) and when
// they appear (ms).
const PLATFORMS = [
  { id: 'you', name: 'Rocketrides', tag: 'Your account', logo: `${ASSETS}/rocketrides.svg`, color: '#8B83FF', lon: 0, lat: 0.62, delay: 300 },
  { id: 'hertz', name: 'Hertz', logo: `${ASSETS}/hertz.svg`, color: '#FFD100', lon: -0.95, lat: 0.5, delay: 1100 },
  { id: 'shopify', name: 'Shopify', logo: `${ASSETS}/shopify.svg`, color: '#95BF47', lon: 1.05, lat: 0.55, delay: 1700 },
  { id: 'doordash', name: 'DoorDash', logo: `${ASSETS}/doordash.svg`, color: '#FF3008', lon: -2.3, lat: 0.72, delay: 2400 },
  { id: 'openai', name: 'OpenAI', logo: `${ASSETS}/openai.svg`, color: '#FFFFFF', lon: 2.45, lat: 0.6, delay: 3000 },
]
const UNNAMED_PLATFORMS = 8
const BUSINESSES = 42
const LINK_REACH = 1.0     // radians; businesses link to platforms within this arc
// Businesses shared by two named platforms. Rocketrides' accounts are also on
// Hertz and Shopify, and the chain continues round the globe, so the network
// effect reads at a glance.
const SHARED_PAIRS = [['you', 'hertz', 3], ['you', 'shopify', 3], ['hertz', 'doordash', 2], ['shopify', 'openai', 2], ['doordash', 'openai', 2]]
const YOUR_LINK = [183, 177, 255]

// Figma's dot gradient runs blue (bottom left) through magenta to orange (top right).
const GRADIENT = [
  [0, [61, 43, 255]],
  [0.4, [166, 43, 224]],
  [0.7, [240, 40, 122]],
  [1, [255, 90, 31]],
]

function gradientAt(t) {
  for (let i = 1; i < GRADIENT.length; i++) {
    const [t1, c1] = GRADIENT[i]
    const [t0, c0] = GRADIENT[i - 1]
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0)
      return [0, 1, 2].map(j => Math.round(c0[j] + (c1[j] - c0[j]) * k))
    }
  }
  return GRADIENT[GRADIENT.length - 1][1]
}

// Deterministic 3D value noise, so continents are the same on every load.
function hash(x, y, z) {
  let h = x * 374761393 + y * 668265263 + z * 2147483647
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
const smooth = t => t * t * (3 - 2 * t)
function valueNoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi)
  const lerp = (a, b, t) => a + (b - a) * t
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz)
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  )
}
function landNoise([x, y, z]) {
  let sum = 0, amp = 0.55, freq = 1.6
  for (let i = 0; i < 4; i++) {
    sum += amp * valueNoise(x * freq + 11, y * freq + 7, z * freq + 3)
    amp *= 0.5
    freq *= 2.1
  }
  return sum / 1.03
}

// Small seeded PRNG for picking node positions.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const fromLatLon = (lat, lon) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]
const angle = (a, b) => Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))

function buildWorld() {
  const land = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < DOT_COUNT; i++) {
    const y = 1 - (i / (DOT_COUNT - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    const p = [Math.cos(theta) * r, y, Math.sin(theta) * r]
    // Keep the poles mostly empty, like a real globe.
    if (Math.abs(y) < 0.86 && landNoise(p) > LAND_THRESHOLD) land.push(p)
  }

  const rand = mulberry32(16) // seed picked for an even spread of links by longitude
  const inBand = land.filter(p => p[1] > BAND[0] && p[1] < BAND[1])
  const placed = []
  // Random land points in the visible band, kept a minimum arc apart.
  const scatter = (count, gap) => {
    const out = []
    for (let tries = 0; out.length < count && tries < count * 60; tries++) {
      const p = inBand[Math.floor(rand() * inBand.length)]
      if (placed.some(q => angle(p, q) < gap)) continue
      placed.push(p)
      out.push(p)
    }
    return out
  }

  // The front of the globe at the starting rotation is longitude -BASE_ROT.
  const named = PLATFORMS.map(pl => ({ ...pl, p: fromLatLon(pl.lat, pl.lon - BASE_ROT), named: true }))
  placed.push(...named.map(n => n.p))
  const unnamed = scatter(UNNAMED_PLATFORMS, 0.5).map(p => ({ p, named: false, delay: 1500 + rand() * 4500 }))
  const platforms = [...named, ...unnamed]
  const byId = Object.fromEntries(named.map(n => [n.id, n]))

  const makeLink = (pl, b, extraDelay = 0) => ({
    from: pl,
    to: b,
    start: Math.max(pl.delay, b.delay) + POP * 0.6 + extraDelay + rand() * 600,
    period: 5000 + rand() * 5000,
    offset: rand() * 4000,
    phase: rand() * PULSE,
    omega: angle(pl.p, b.p),
  })

  // Shared businesses sit between their two platforms, nudged off the line.
  const links = []
  const shared = []
  for (const [a, b, count] of SHARED_PAIRS) {
    const pa = byId[a].p, pb = byId[b].p
    const omega = angle(pa, pb)
    const axis = [pa[1] * pb[2] - pa[2] * pb[1], pa[2] * pb[0] - pa[0] * pb[2], pa[0] * pb[1] - pa[1] * pb[0]]
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1)
      const k0 = Math.sin((1 - t) * omega) / Math.sin(omega)
      const k1 = Math.sin(t * omega) / Math.sin(omega)
      const nudge = (rand() - 0.5) * 0.5
      const raw = [0, 1, 2].map(j => pa[j] * k0 + pb[j] * k1 + axis[j] * nudge)
      const len = Math.hypot(...raw)
      const business = { p: raw.map(v => v / len), delay: Math.max(byId[a].delay, byId[b].delay) + 500 + i * 350, glow: 0, shared: true }
      shared.push(business)
      placed.push(business.p)
      links.push(makeLink(byId[a], business), makeLink(byId[b], business, 300))
    }
  }

  // Everyone else links to its nearest platform, and about a third are shared
  // by two. Every link loops on its own cycle so lines keep forming all round.
  const others = scatter(BUSINESSES, 0.16).map(p => ({ p, delay: 2600 + rand() * 6000, glow: 0 }))
  for (const b of others) {
    const near = platforms
      .map(pl => ({ pl, omega: angle(pl.p, b.p) }))
      .filter(x => x.omega < LINK_REACH)
      .sort((u, v) => u.omega - v.omega)
      .slice(0, rand() < 0.3 ? 2 : 1)
    for (const { pl } of near) links.push(makeLink(pl, b))
  }
  const businesses = [...shared, ...others]
  return { land, platforms, businesses, links }
}

const easeOut = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

// Spin around the vertical axis, then tilt toward the viewer.
function project([x, y, z], rot, cx, cy, R) {
  const cr = Math.cos(rot), sr = Math.sin(rot)
  const x1 = x * cr + z * sr
  const z1 = -x * sr + z * cr
  const ct = Math.cos(TILT), st = Math.sin(TILT)
  const y2 = y * ct - z1 * st
  const z2 = y * st + z1 * ct
  return { x: cx + R * x1, y: cy - R * y2, z: z2 }
}

// Point along the great circle from a to b, lifted off the surface mid-arc.
function arcPoint(a, b, t, omega) {
  const s = Math.sin(omega)
  const k0 = Math.sin((1 - t) * omega) / s
  const k1 = Math.sin(t * omega) / s
  const lift = 1 + (0.06 + 0.16 * (omega / Math.PI)) * Math.sin(Math.PI * t)
  return [0, 1, 2].map(j => (a[j] * k0 + b[j] * k1) * lift)
}

export default function NetworkGlobe() {
  const canvasRef = useRef(null)
  const labelRefs = useRef({})

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const world = buildWorld()
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let width = canvas.parentElement.clientWidth
    let frame = 0

    const resize = () => {
      width = canvas.parentElement.clientWidth
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(HEIGHT * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${HEIGHT}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = now => {
      // With reduced motion, show the finished network without moving.
      const t = reduceMotion ? Infinity : now - start
      const R = Math.min(width * 0.4, HEIGHT - 16)
      const cx = width / 2
      const cy = HEIGHT + 4
      const rot = reduceMotion ? BASE_ROT : BASE_ROT + (t / 1000) * SPIN

      ctx.clearRect(0, 0, width, HEIGHT)
      ctx.fillStyle = BACKGROUND
      ctx.fillRect(0, 0, width, HEIGHT)

      // Globe body with a soft rim.
      const body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.6, R * 0.1, cx, cy, R)
      body.addColorStop(0, '#3D4049')
      body.addColorStop(1, '#2F3245')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = body
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Continents.
      for (const p of world.land) {
        const s = project(p, rot, cx, cy, R)
        if (s.z <= 0 || s.y > HEIGHT) continue
        const xn = (s.x - (cx - R)) / (2 * R)
        const yn = (cy - s.y) / R
        const [r, g, b] = gradientAt(Math.min(1, Math.max(0, 0.75 * xn + 0.25 * yn)))
        ctx.fillStyle = `rgba(${r},${g},${b},${0.25 + 0.75 * s.z})`
        ctx.fillRect(s.x - 0.6, s.y - 0.6, 1.2, 1.2)
      }

      for (const b of world.businesses) b.glow = 0

      // Connections: draw in, carry pulses, fade, and come back on their own loop.
      for (const l of world.links) {
        let grown = 1, alpha = 0.3, age = Infinity
        if (!reduceMotion) {
          if (t < l.start) continue
          age = t - l.start
          const c = (age + l.offset) % l.period
          if (age < GROW) grown = easeOut(age / GROW)
          else if (c < GROW) grown = easeOut(c / GROW)
          const fadeAt = l.period - FADE - 600
          if (age >= GROW && c > fadeAt) {
            alpha = 0.3 * Math.max(0, 1 - (c - fadeAt) / FADE)
            if (alpha === 0) continue
          }
          if (grown < 1) alpha = 0.6
        }
        const steps = 32
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= Math.ceil(steps * grown); i++) {
          const s = project(arcPoint(l.from.p, l.to.p, Math.min(grown, i / steps), l.omega), rot, cx, cy, R)
          if (s.z < 0) { started = false; continue }
          if (started) ctx.lineTo(s.x, s.y)
          else { ctx.moveTo(s.x, s.y); started = true }
        }
        if (!started) continue
        // Rocketrides' own connections are tinted so they read as yours.
        const mine = l.from.id === 'you'
        ctx.strokeStyle = mine ? `rgba(${YOUR_LINK},${Math.min(1, alpha * 1.8)})` : `rgba(255,255,255,${alpha})`
        ctx.lineWidth = mine ? 1.3 : 1
        ctx.stroke()

        if (grown === 1 && alpha > 0.1) {
          const u = reduceMotion ? 0.5 : ((age + l.phase) % PULSE) / PULSE
          const s = project(arcPoint(l.from.p, l.to.p, u, l.omega), rot, cx, cy, R)
          if (s.z > 0) {
            ctx.beginPath()
            ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha * 3)})`
            ctx.fill()
          }
          if (u > 0.9) l.to.glow = 1
        }
      }

      // Businesses: small white nodes.
      for (const b of world.businesses) {
        const k = reduceMotion ? 1 : easeOut((t - b.delay) / POP)
        if (k <= 0) continue
        const s = project(b.p, rot, cx, cy, R)
        if (s.z <= 0.03) continue
        const fade = Math.min(1, s.z * 2.5)
        if (b.glow) {
          ctx.beginPath()
          ctx.arc(s.x, s.y, 4.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${0.18 * fade})`
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, 1.9 * k, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`
        ctx.fill()
      }

      // Platforms: lavender rings for unnamed ones; named ones get a halo and an HTML label.
      for (const pl of world.platforms) {
        const k = reduceMotion ? 1 : easeOut((t - pl.delay) / POP)
        const s = project(pl.p, rot, cx, cy, R)
        const fade = Math.min(1, Math.max(0, (s.z - 0.05) / 0.25))
        if (pl.named) {
          const label = labelRefs.current[pl.id]
          if (label) {
            label.style.opacity = String(k * Math.min(1, Math.max(0, (s.z - 0.15) / 0.2)))
            label.style.transform = `translate(${s.x}px, ${s.y - 12 + (1 - k) * 6}px) translate(-50%, -100%)`
          }
        }
        if (k <= 0 || fade <= 0) continue
        ctx.globalAlpha = fade
        if (pl.named) {
          const halo = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t / 420 + pl.delay)
          ctx.beginPath()
          ctx.arc(s.x, s.y, (9 + halo * 3) * k, 0, Math.PI * 2)
          ctx.fillStyle = pl.id === 'you' ? 'rgba(139,131,255,0.28)' : 'rgba(255,255,255,0.12)'
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, (pl.named ? 4.5 : 3) * k, 0, Math.PI * 2)
        ctx.fillStyle = pl.named ? pl.color : '#B7B1FF'
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = pl.named ? 1.5 : 1
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      if (!reduceMotion) frame = requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(() => {
      resize()
      if (reduceMotion) draw(performance.now())
    })
    observer.observe(canvas.parentElement)
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      role="img"
      aria-label="A turning globe of businesses on Stripe. Rocketrides shares businesses with Hertz and Shopify, which share others with DoorDash, OpenAI and more platforms on the network."
      style={{ position: 'relative', height: HEIGHT, borderRadius: 12, overflow: 'hidden', background: BACKGROUND }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {PLATFORMS.map(pl => (
        <div
          key={pl.id}
          ref={el => { labelRefs.current[pl.id] = el }}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px 4px 4px',
            borderRadius: 9999,
            background: 'rgba(35,37,43,0.72)',
            border: '1px solid rgba(255,255,255,0.16)',
            backdropFilter: 'blur(6px)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            willChange: 'transform, opacity',
          }}
        >
          <img src={pl.logo} alt="" width="16" height="16" style={{ display: 'block', borderRadius: 4 }} />
          <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', color: '#FFFFFF' }}>{pl.name}</span>
          {pl.tag && (
            <span style={{ fontSize: 10, fontWeight: 500, lineHeight: '14px', padding: '0 5px', borderRadius: 9999, color: '#FFFFFF', background: '#533AFD' }}>
              {pl.tag}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
