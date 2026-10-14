// Prototype controls: a floating dark circle beside the wireframe-mode pen that
// opens a dark control panel.
//
// Layering: the network onboarding dialog is a full-screen overlay (z-index
// 10020), but the panel has to stay usable over it so step 3 versions can be
// switched live. So the trigger and panel are portaled to <body> at z-index
// 10040.
//
// Sections come from PROTOTYPE_PANEL_SECTIONS in prototypePanelSections.js.
//
// Open by default, so the controls are in view while demoing. It stays open
// until closed with its button, the close button or Escape.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PROTOTYPE_PANEL_SECTIONS } from './prototypePanelSections'

function SlidersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h7M13 4h1M2 12h1M7 12h7M2 8h3M9 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="4" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="12" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function DashboardPrototypePanel() {
  const [open, setOpen] = useState(true)
  // Only an open from the trigger moves focus into the panel, not the default.
  const focusOnOpen = useRef(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const titleId = useId()
  const panelId = useId()

  const close = useCallback(({ restoreFocus = false } = {}) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!open) return undefined
    if (focusOnOpen.current) panelRef.current?.focus({ preventScroll: true })
    // Capture phase, so Escape in the panel closes it before an open dialog
    // sees it. Escape elsewhere is left to the page (the panel is open by default).
    const onKey = event => {
      if (event.key !== 'Escape') return
      if (!panelRef.current?.contains(document.activeElement) && document.activeElement !== triggerRef.current) return
      event.preventDefault()
      event.stopPropagation()
      close({ restoreFocus: true })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, close])

  return createPortal(
    <>
      <button
        ref={triggerRef}
        type="button"
        className="dash-proto-trigger"
        data-wireframe-tone="dark"
        // The trigger and panel stay real on pages shown as wireframes.
        data-wireframe-show=""
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Prototype controls"
        title="Prototype controls"
        onClick={() => {
          focusOnOpen.current = true
          setOpen(o => !o)
        }}
      >
        <SlidersIcon />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="dash-proto-panel"
          data-wireframe-tone="dark"
          data-wireframe-show=""
        >
          <header className="dash-proto-panel__header">
            <h2 id={titleId} className="dash-proto-panel__title">Prototype controls</h2>
            <button type="button" className="dash-proto-panel__close" aria-label="Close prototype controls" title="Close" onClick={() => close({ restoreFocus: true })}>
              <CloseIcon />
            </button>
          </header>
          {PROTOTYPE_PANEL_SECTIONS.map(({ id, title, Component }) => (
            <section key={id} className="dash-proto-panel__section" aria-label={title}>
              <h3 className="dash-proto-panel__section-title">{title}</h3>
              <Component />
            </section>
          ))}
        </div>
      )}
    </>,
    document.body,
  )
}
