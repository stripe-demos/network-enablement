import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG, CATEGORIES } from './catalog'
import { PageHeader, SearchField, color, type } from '@dashboard/ui'

const NAV_WIDTH = 200
const SECTION_SCROLL_MARGIN = 16
const SCROLL_DURATION_MS = 300

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function animateScrollTo(scroller, section, frameRef, lockUntilRef) {
  cancelAnimationFrame(frameRef.current)
  const start = scroller.scrollTop
  const maxScroll = scroller.scrollHeight - scroller.clientHeight
  const target = Math.min(maxScroll, Math.max(0,
    start + section.getBoundingClientRect().top - scroller.getBoundingClientRect().top - SECTION_SCROLL_MARGIN,
  ))
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const duration = reduceMotion ? 0 : SCROLL_DURATION_MS
  const t0 = performance.now()
  lockUntilRef.current = t0 + duration + 150
  const step = (now) => {
    const t = duration ? Math.min(1, (now - t0) / duration) : 1
    scroller.scrollTop = start + (target - start) * easeInOutCubic(t)
    if (t < 1) frameRef.current = requestAnimationFrame(step)
  }
  frameRef.current = requestAnimationFrame(step)
}

function CodeBlock({ code }) {
  const [copyStatus, setCopyStatus] = useState('Copy')
  const resetTimer = useRef(null)
  useEffect(() => () => clearTimeout(resetTimer.current), [])
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{ margin: 0, padding: '12px 16px', background: '#F8F9FB', borderTop: `1px solid ${color.neutral50}`, fontSize: 12, lineHeight: '18px', color: color.textStrong, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflowX: 'auto', borderRadius: '0 0 12px 12px' }}>
        {code}
      </pre>
      <button
        type="button"
        className="dui-btn dui-btn--ghost dui-btn--sm"
        style={{ position: 'absolute', top: 6, right: 6, height: 24, padding: '0 8px', fontSize: 12 }}
        onClick={async () => {
          clearTimeout(resetTimer.current)
          try {
            await navigator.clipboard.writeText(code)
            setCopyStatus('Copied')
          } catch {
            setCopyStatus('Couldn’t copy')
          }
          resetTimer.current = setTimeout(() => setCopyStatus('Copy'), 1200)
        }}
      >
        {copyStatus}
      </button>
    </div>
  )
}

function Entry({ entry }) {
  const Demo = entry.demo
  return (
    <section id={entry.id} style={{ scrollMarginTop: SECTION_SCROLL_MARGIN, marginBottom: 32 }}>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 4 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: color.text }}>{entry.name}</h3>
        <a href={`#${entry.id}`} style={{ fontSize: 12, color: color.subdued }}>#{entry.id}</a>
      </div>
      <p style={{ ...type.body, color: color.subdued, marginBottom: 12, maxWidth: 760 }}>
        {entry.description.split(/(`[^`]+`)/).map((part, i) =>
          part.startsWith('`') ? <code key={i} style={{ fontSize: 13, color: color.textStrong }}>{part.slice(1, -1)}</code> : part,
        )}
      </p>
      <div style={{ border: `1px solid ${color.neutral50}`, borderRadius: 12 }}>
        <div style={{ padding: 24, overflowX: 'auto' }}>
          <Demo />
        </div>
        <CodeBlock code={entry.code} />
      </div>
      {entry.props && (
        <table style={{ marginTop: 12, borderCollapse: 'collapse', fontSize: 13, lineHeight: '20px' }}>
          <tbody>
            {entry.props.map(([name, desc]) => (
              <tr key={name}>
                <td style={{ padding: '4px 16px 4px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  <code style={{ fontSize: 12, color: color.actionPrimary }}>{name}</code>
                </td>
                <td style={{ padding: '4px 0', color: color.subdued }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default function ComponentLibrary() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CATALOG
    return CATALOG.filter(e => `${e.name} ${e.category} ${e.description}`.toLowerCase().includes(q))
  }, [query])

  const byCategory = CATEGORIES
    .map(cat => [cat, filtered.filter(e => e.category === cat)])
    .filter(([, entries]) => entries.length)

  const contentRef = useRef(null)
  const clickLockUntil = useRef(0)
  const scrollFrame = useRef(0)

  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), [])
  const [activeId, setActiveId] = useState(() => window.location.hash.slice(1) || CATALOG[0]?.id)

  useEffect(() => {
    const root = contentRef.current
    const scroller = root?.closest('main')
    if (!scroller) return
    const update = () => {
      // A nav click jumps to the anchor; keep the clicked item selected even if
      // the section can't reach the top (e.g. the last few entries).
      if (performance.now() < clickLockUntil.current) return
      const sections = root.querySelectorAll('section[id]')
      if (!sections.length) return
      const threshold = scroller.getBoundingClientRect().top + 24
      let current = sections[0].id
      for (const s of sections) {
        if (s.getBoundingClientRect().top > threshold) break
        current = s.id
      }
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) {
        current = sections[sections.length - 1].id
      }
      setActiveId(current)
    }
    const frame = requestAnimationFrame(update)
    scroller.addEventListener('scroll', update, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', update)
    }
  }, [filtered])

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader
        title="Dashboard component library"
        style={{ paddingTop: 8 }}
        description={<>Everything the dashboard is built from. Import from <code style={{ color: color.actionPrimary }}>@dashboard/ui</code> — source lives in <code>src/dashboard/ui/</code>.</>}
      />

      <div className="flex gap-[40px]" style={{ marginTop: 24 }}>
        <nav style={{ width: NAV_WIDTH, flexShrink: 0, position: 'sticky', top: 16, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
          <SearchField value={query} onChange={setQuery} placeholder="Filter components" style={{ padding: '2px 12px', marginBottom: 16 }} />
          {byCategory.map(([cat, entries]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, lineHeight: '24px', fontWeight: 600, color: color.textStrong, marginBottom: 4 }}>{cat}</div>
              {entries.map(e => {
                const active = e.id === activeId
                return (
                  <a
                    key={e.id}
                    href={`#${e.id}`}
                    className="block"
                    aria-current={active ? 'location' : undefined}
                    onClick={(ev) => {
                      ev.preventDefault()
                      const section = document.getElementById(e.id)
                      const scroller = contentRef.current?.closest('main')
                      if (!section || !scroller) return
                      setActiveId(e.id)
                      animateScrollTo(scroller, section, scrollFrame, clickLockUntil)
                      history.replaceState(history.state, '', `#${e.id}`)
                    }}
                    style={{ fontSize: 13, lineHeight: '24px', fontWeight: active ? 600 : 400, color: active ? color.actionPrimary : color.textStrong, textDecoration: 'none' }}
                  >
                    {e.name}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        <div ref={contentRef} className="flex-1 min-w-0">
          {byCategory.map(([cat, entries]) => (
            <div key={cat}>
              <h2 style={{ ...type.sectionTitle, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${color.neutral50}` }}>{cat}</h2>
              {entries.map(e => <Entry key={e.id} entry={e} />)}
            </div>
          ))}
          {byCategory.length === 0 && <p style={{ ...type.body, color: color.subdued }}>No components match “{query}”.</p>}
        </div>
      </div>
    </div>
  )
}
