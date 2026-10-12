import { lazy, useState } from 'react'

const pages = []

// A route component whose code loads on demand. Once `preloadPages()` (or an
// earlier visit) has fetched it, it renders straight away without suspending,
// so navigating to it never flashes the Suspense fallback.
export function lazyPage(load) {
  let Loaded = null
  let pending = null
  const preload = () => {
    pending ??= load().then((Component) => { Loaded = Component; return { default: Component } })
    return pending
  }
  const Lazy = lazy(preload)
  function Page(props) {
    // Fixed per mount: swapping Lazy for Loaded later would remount the page.
    const [Component] = useState(() => Loaded ?? Lazy)
    return <Component {...props} />
  }
  pages.push(preload)
  return Page
}

// Fetch every lazy page once the first-load entrance animations have played
// (evaluating a page module mid-animation can drop frames) and the browser is
// idle.
export function preloadPages() {
  let cancelled = false
  let idleId
  const run = () => { if (!cancelled) pages.forEach((preload) => preload().catch(() => {})) }
  // A frame in, so the page's CSS animations exist to be waited on.
  const frame = requestAnimationFrame(() => {
    const entrances = document.getAnimations()
      .filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime))
      .map((a) => a.finished)
    const cap = new Promise((resolve) => setTimeout(resolve, 2000))
    Promise.race([Promise.allSettled(entrances), cap]).then(() => {
      if (cancelled) return
      idleId = 'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1000 }) : setTimeout(run, 200)
    })
  })
  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
    if ('cancelIdleCallback' in window) cancelIdleCallback(idleId)
    else clearTimeout(idleId)
  }
}
