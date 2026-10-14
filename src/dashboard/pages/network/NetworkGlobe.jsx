// Hero for the network onboarding Welcome step: the top half of a dotted globe
// (after Figma "globe" in Sally's Sandbox, node 397:39348) that keeps turning
// while platforms, named and unnamed, connect to businesses they share all
// around the network. Drawn on a canvas with HTML labels; continents are procedural, so
// no map data ships with the prototype.
import { useEffect, useRef } from 'react'

const DEFAULT_HEIGHT = 220
// `height` sets the hero's height (220 in the dialog), or 'fill' to take the
// container's height. By default only the globe's top half shows, anchored to
// the bottom edge; `full` shows the whole globe, centered, with platforms and
// businesses spread into the southern hemisphere too. `legend` adds a key in
// the bottom-left corner.
//
// Besides platforms and their connected accounts, the globe shows Accounts v2
// accounts that are on the network without Connect: customers (teal) and
// recipients (amber). They have no platform links; they just twinkle.
// Light (white globe on light gray) is the default; dark matches the original
// Figma globe. Pass theme="dark" to switch back.
const THEMES = {
  light: {
    background: '#F1F4F8',
    body: [[0, '#F8F8FA'], [0.6, '#ECEBF8'], [1, '#B3B6F6']],
    rim: 'rgba(83,58,253,0.14)',
    dotAlpha: [0.45, 0.55],
    dotSize: 1.4,
    // Lines fade from the platform's end to the account's end.
    link: [[139, 131, 255], [86, 168, 255]],
    linkBoost: 1.6,
    yourLink: [[83, 58, 253], [86, 168, 255]],
    pulse: [83, 58, 253],
    business: '#56A8FF',
    businessRing: '#FFFFFF',
    businessGlow: 'rgba(86,168,255,0.28)',
    customer: '#1FB89A',
    recipient: '#F5A524',
    unnamed: '#8B83FF',
    ring: '#FFFFFF',
    haloYou: 'rgba(103,93,255,0.22)',
    haloOther: 'rgba(20,35,51,0.08)',
    label: { background: 'rgba(255,255,255,0.9)', border: '1px solid #E9F0F7', color: '#142333', boxShadow: '0 1px 2px rgba(20,35,51,0.08), 0 4px 10px rgba(20,35,51,0.06)' },
  },
  dark: {
    background: '#23252B',
    body: [[0, '#3D4049'], [1, '#2F3245']],
    rim: 'rgba(255,255,255,0.06)',
    dotAlpha: [0.25, 0.75],
    dotSize: 1.2,
    link: [[183, 177, 255], [255, 255, 255]],
    linkBoost: 1,
    yourLink: [[139, 131, 255], [183, 177, 255]],
    pulse: [255, 255, 255],
    business: '#FFFFFF',
    businessRing: null,
    businessGlow: 'rgba(255,255,255,0.18)',
    customer: '#5EE3C4',
    recipient: '#FFC566',
    unnamed: '#B7B1FF',
    ring: '#FFFFFF',
    haloYou: 'rgba(139,131,255,0.28)',
    haloOther: 'rgba(255,255,255,0.12)',
    label: { background: 'rgba(35,37,43,0.72)', border: '1px solid rgba(255,255,255,0.16)', color: '#FFFFFF', boxShadow: 'none' },
  },
}
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
const FULL_BAND = [Math.sin((-50 * Math.PI) / 180), Math.sin((64 * Math.PI) / 180)] // the same, with the whole globe in view

// Labeled platforms, spread around the globe by longitude offset from the front
// (radians; negative is to the left, so they turn into view later) and when
// they appear (ms).
const PLATFORMS = [
  { id: 'you', name: 'Rocketrides', tag: 'Your account', logo: `${ASSETS}/rocketrides.svg`, color: '#8B83FF', lon: 0, lat: 0.62, delay: 300 },
  { id: 'hertz', name: 'Hertz', logo: `${ASSETS}/hertz.svg`, color: '#FFD100', lon: -0.95, lat: 0.5, delay: 1100 },
  { id: 'shopify', name: 'Shopify', logo: `${ASSETS}/shopify.svg`, color: '#95BF47', lon: 1.05, lat: 0.55, delay: 1700 },
  { id: 'doordash', name: 'DoorDash', logo: `${ASSETS}/doordash.svg`, color: '#FF3008', lon: -2.3, lat: 0.72, delay: 2400 },
  { id: 'openai', name: 'OpenAI', logo: `${ASSETS}/openai.svg`, color: '#FFFFFF', lightColor: '#142333', lon: 2.45, lat: 0.6, delay: 3000 },
]
const UNNAMED_PLATFORMS = 8
const BUSINESSES = 42
// Network accounts outside Connect, per kind: [half globe, full globe].
const V2_ACCOUNTS = { customer: [14, 48], recipient: [10, 36] }
const TWINKLE = 2600       // ms for a customer or recipient to brighten and dim
const LINK_REACH = 1.0     // radians; businesses link to platforms within this arc
// Businesses shared by two named platforms. Rocketrides' accounts are also on
// Hertz and Shopify, and the chain continues round the globe, so the network
// effect reads at a glance.
const SHARED_PAIRS = [['you', 'hertz', 3], ['you', 'shopify', 3], ['hertz', 'doordash', 2], ['shopify', 'openai', 2], ['doordash', 'openai', 2]]

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

function buildWorld(full) {
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
  const band = full ? FULL_BAND : BAND
  const inBand = land.filter(p => p[1] > band[0] && p[1] < band[1])
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

  // Customers and recipients on the network (Accounts v2, not connected accounts).
  const v2 = Object.entries(V2_ACCOUNTS).flatMap(([kind, [half, whole]]) =>
    scatter(full ? whole : half, 0.1).map(p => ({ p, kind, delay: 2000 + rand() * 7000, phase: rand() * TWINKLE })),
  )
  return { land, platforms, businesses, links, v2 }
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

export default function NetworkGlobe({ theme = 'light', height = DEFAULT_HEIGHT, full = false, legend = false }) {
  const th = THEMES[theme] ?? THEMES.light
  const canvasRef = useRef(null)
  const labelRefs = useRef({})

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const world = buildWorld(full)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let width = canvas.parentElement.clientWidth
    let h = height === 'fill' ? canvas.parentElement.clientHeight : height
    let frame = 0

    const resize = () => {
      width = canvas.parentElement.clientWidth
      if (height === 'fill') h = canvas.parentElement.clientHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = now => {
      // With reduced motion, show the finished network without moving.
      const t = reduceMotion ? Infinity : now - start
      const R = full ? Math.min(width, h) / 2 - 24 : Math.min(width * 0.4, h - 16)
      const cx = width / 2
      const cy = full ? h / 2 : h + 4
      const rot = reduceMotion ? BASE_ROT : BASE_ROT + (t / 1000) * SPIN

      ctx.clearRect(0, 0, width, h)
      ctx.fillStyle = th.background
      ctx.fillRect(0, 0, width, h)

      // Globe body with a soft rim.
      const body = theme === 'dark'
        ? ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.6, R * 0.1, cx, cy, R)
        : ctx.createLinearGradient(0, cy - R, 0, full ? cy + R : cy)
      for (const [at, c] of th.body) body.addColorStop(at, c)
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = body
      ctx.fill()
      ctx.strokeStyle = th.rim
      ctx.lineWidth = 1
      ctx.stroke()

      // Continents.
      for (const p of world.land) {
        const s = project(p, rot, cx, cy, R)
        if (s.z <= 0 || s.y > h) continue
        const xn = (s.x - (cx - R)) / (2 * R)
        const yn = (cy - s.y) / R
        const [r, g, b] = gradientAt(Math.min(1, Math.max(0, 0.75 * xn + 0.25 * yn)))
        ctx.fillStyle = `rgba(${r},${g},${b},${th.dotAlpha[0] + th.dotAlpha[1] * s.z})`
        ctx.fillRect(s.x - th.dotSize / 2, s.y - th.dotSize / 2, th.dotSize, th.dotSize)
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
        const [fromRgb, toRgb] = mine ? th.yourLink : th.link
        const a = mine ? Math.min(1, alpha * 1.8) : Math.min(1, alpha * th.linkBoost)
        const p0 = project(l.from.p, rot, cx, cy, R)
        const p1 = project(l.to.p, rot, cx, cy, R)
        const gradient = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y)
        gradient.addColorStop(0, `rgba(${fromRgb},${a})`)
        gradient.addColorStop(1, `rgba(${toRgb},${a * 0.9})`)
        ctx.strokeStyle = gradient
        ctx.lineWidth = mine ? 1.3 : 1
        ctx.stroke()

        if (grown === 1 && alpha > 0.1) {
          const u = reduceMotion ? 0.5 : ((age + l.phase) % PULSE) / PULSE
          const s = project(arcPoint(l.from.p, l.to.p, u, l.omega), rot, cx, cy, R)
          if (s.z > 0) {
            ctx.beginPath()
            ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${th.pulse},${Math.min(1, alpha * 3)})`
            ctx.fill()
          }
          if (u > 0.9) l.to.glow = 1
        }
      }

      // Customers and recipients: smaller nodes that twinkle, with no links.
      for (const a of world.v2) {
        const k = reduceMotion ? 1 : easeOut((t - a.delay) / POP)
        if (k <= 0) continue
        const s = project(a.p, rot, cx, cy, R)
        if (s.z <= 0.03) continue
        const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(((t + a.phase) / TWINKLE) * Math.PI * 2)
        ctx.beginPath()
        ctx.arc(s.x, s.y, 2.1 * k, 0, Math.PI * 2)
        ctx.globalAlpha = Math.min(1, s.z * 2.5) * twinkle
        ctx.fillStyle = th[a.kind]
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Businesses (connected accounts): small sky-blue nodes, white on the dark theme.
      for (const b of world.businesses) {
        const k = reduceMotion ? 1 : easeOut((t - b.delay) / POP)
        if (k <= 0) continue
        const s = project(b.p, rot, cx, cy, R)
        if (s.z <= 0.03) continue
        const fade = Math.min(1, s.z * 2.5)
        if (b.glow) {
          ctx.beginPath()
          ctx.arc(s.x, s.y, 4.5, 0, Math.PI * 2)
          ctx.globalAlpha = fade
          ctx.fillStyle = th.businessGlow
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, (theme === 'light' ? 2.6 : 1.9) * k, 0, Math.PI * 2)
        ctx.globalAlpha = 0.9 * fade
        ctx.fillStyle = th.business
        ctx.fill()
        if (th.businessRing && k === 1) {
          ctx.strokeStyle = th.businessRing
          ctx.lineWidth = 1
          ctx.stroke()
        }
        ctx.globalAlpha = 1
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
          ctx.fillStyle = pl.id === 'you' ? th.haloYou : th.haloOther
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, (pl.named ? 4.5 : 3) * k, 0, Math.PI * 2)
        ctx.fillStyle = pl.named ? (theme === 'light' && pl.lightColor) || pl.color : th.unnamed
        ctx.fill()
        ctx.strokeStyle = th.ring
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
  }, [theme, th, height, full])

  return (
    <div
      role="img"
      aria-label="A turning globe of businesses on Stripe. Rocketrides shares businesses with Hertz and Shopify, which share others with DoorDash, OpenAI and more platforms on the network. Customers and recipients on the network appear alongside them."
      style={{ position: 'relative', height: height === 'fill' ? '100%' : height, borderRadius: 12, overflow: 'hidden', background: th.background }}
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
            background: th.label.background,
            border: th.label.border,
            boxShadow: th.label.boxShadow,
            backdropFilter: 'blur(6px)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            willChange: 'transform, opacity',
          }}
        >
          <img src={pl.logo} alt="" width="16" height="16" style={{ display: 'block', borderRadius: 4 }} />
          <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', color: th.label.color }}>{pl.name}</span>
          {pl.tag && (
            <span style={{ fontSize: 10, fontWeight: 500, lineHeight: '14px', padding: '0 5px', borderRadius: 9999, color: '#FFFFFF', background: '#533AFD' }}>
              {pl.tag}
            </span>
          )}
        </div>
      ))}
      {legend && (
        <ul
          aria-hidden="true"
          style={{ position: 'absolute', left: 16, bottom: 16, margin: 0, padding: '8px 12px', listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '4px 14px', borderRadius: 8, background: th.label.background, border: th.label.border, boxShadow: th.label.boxShadow, backdropFilter: 'blur(6px)' }}
        >
          {[
            ['Platforms', th.unnamed],
            ['Connected accounts', th.business],
            ['Customers', th.customer],
            ['Recipients', th.recipient],
          ].map(([label, fill]) => (
            <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, lineHeight: '16px', color: th.label.color }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: fill }} />
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
