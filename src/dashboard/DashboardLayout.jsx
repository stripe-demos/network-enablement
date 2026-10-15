import { dashboardStorage } from './lib/storage';
import { Outlet } from 'react-router-dom'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PrototypeProvider } from './contexts/PrototypeContext'
import { ChevronUpCircleIcon, ExplorerIcon, IconButton, ScrollArea, ToastProvider, TransferIcon, useFadeSlideIn, WarningIcon, WebhookIcon } from './ui'
import DashboardSidebar from './components/DashboardSidebar'
import DashboardToolbar from './components/DashboardToolbar'
import { useSidebarPrototypeControls } from './prototype/useSidebarPrototypeControls'
import { useSearchPrototypeControls } from './prototype/useSearchPrototypeControls'
import { useCollapsedPrototypeControls } from './prototype/useCollapsedPrototypeControls'
import { readPrototypeSidebarCollapsed, writePrototypeSidebarCollapsed } from './prototype/prototypeSidebarState'
import DashboardPrototypePanel from './prototype/DashboardPrototypePanel'
import NetworkOnboardingHost from './pages/network/NetworkOnboardingHost'
import ConnectSetupHost from './pages/connect-setup/ConnectSetupHost'
import FloatieStack from './pages/connect-setup/FloatieStack'
import EnablementFloatie from './enablement-module/EnablementFloatie'
import EnablementNudge from './enablement-module/EnablementNudge'
import { cappedGutter, isListViewPath } from './constants/layout'
import './dashboard.css'

const SIDEBAR_EXPANDED = 240
const SIDEBAR_COLLAPSED = 64

export default function DashboardLayout() {
  const { pathname, search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const prototypeView = searchParams.get('prototypeView')
  const isPrototypeFrame = prototypeView !== null
  const collapseDisabled = prototypeView === 'search' || prototypeView === 'chrome-search'
  const requestedCollapsed = searchParams.get('sidebar') === 'collapsed'
  const forceCollapsed = requestedCollapsed
  const isHome = pathname === '/' || pathname === '/onsite-home'
  const isComponentLibrary = pathname.startsWith('/components')
  const mainPadding = isHome ? 0 : `0 ${isListViewPath(pathname) || isComponentLibrary ? '24px' : cappedGutter(24)}`
  const [libraryNavExpanded, setLibraryNavExpanded] = useState(false)
  const [wasComponentLibrary, setWasComponentLibrary] = useState(isComponentLibrary)
  if (wasComponentLibrary !== isComponentLibrary) {
    setWasComponentLibrary(isComponentLibrary)
    setLibraryNavExpanded(false)
  }
  const [storedCollapsed, setCollapsed] = useState(() => {
    if (isPrototypeFrame) return readPrototypeSidebarCollapsed(prototypeView, forceCollapsed)
    return forceCollapsed || dashboardStorage.getItem('dashboard-sidebar-collapsed') === 'true'
  })
  const collapseContext = `${prototypeView ?? 'dashboard'}:${forceCollapsed}`
  const [previousCollapseContext, setPreviousCollapseContext] = useState(collapseContext)
  if (previousCollapseContext !== collapseContext) {
    setPreviousCollapseContext(collapseContext)
    if (isPrototypeFrame) setCollapsed(readPrototypeSidebarCollapsed(prototypeView, forceCollapsed))
    else if (forceCollapsed) setCollapsed(true)
  }
  // The component library is a focus view: the sidebar starts collapsed there
  // without touching the saved preference used by every other page.
  const collapsed = isComponentLibrary ? !libraryNavExpanded : storedCollapsed
  useSidebarPrototypeControls()
  useSearchPrototypeControls()
  const collapsedControls = useCollapsedPrototypeControls()
  const collapsedSidebarWidth = collapsedControls.collapsedWidth || SIDEBAR_COLLAPSED
  const sidebarWidth = collapsed ? collapsedSidebarWidth : SIDEBAR_EXPANDED
  // The prototype-tunable entrance plays on the first load only; in-dashboard
  // navigations use the page transition on <main> instead.
  const [initialPathname] = useState(pathname)
  const [hasNavigated, setHasNavigated] = useState(false)
  if (!hasNavigated && pathname !== initialPathname) setHasNavigated(true)
  const mainRef = useRef(null)
  useFadeSlideIn(mainRef, pathname)

  useEffect(() => {
    if (isPrototypeFrame) {
      const next = readPrototypeSidebarCollapsed(prototypeView, forceCollapsed)
      window.dispatchEvent(new CustomEvent('dashboard-sidebar-collapsed-change', { detail: next }))
      return
    }

    if (forceCollapsed) {
      dashboardStorage.setItem('dashboard-sidebar-collapsed', 'true')
      window.dispatchEvent(new CustomEvent('dashboard-sidebar-collapsed-change', { detail: true }))
    }
  }, [forceCollapsed, isPrototypeFrame, prototypeView])

  const toggleCollapsed = () => {
    if (isComponentLibrary) {
      setLibraryNavExpanded(e => !e)
      return
    }
    setCollapsed(c => {
      const next = !c
      if (isPrototypeFrame) {
        writePrototypeSidebarCollapsed(prototypeView, next)
      } else {
        dashboardStorage.setItem('dashboard-sidebar-collapsed', String(next))
      }
      window.dispatchEvent(new CustomEvent('dashboard-sidebar-collapsed-change', { detail: next }))
      return next
    })
  }

  return (
    <PrototypeProvider>
      <ToastProvider>
      <div className="dashboard-root flex h-screen overflow-hidden" style={{ position: 'relative' }}>
        <DashboardSidebar collapsed={collapsed} collapsedWidth={collapsedSidebarWidth} onToggleCollapse={toggleCollapsed} />

        {/* Collapse edge control — lives outside sidebar structure */}
        {!collapseDisabled && (
        <div
          className={`dash-sidebar-edge ${collapsed ? 'dash-sidebar-edge--collapsed' : 'dash-sidebar-edge--expanded'}`}
          onClick={toggleCollapsed}
          style={{
            position: 'absolute',
            left: sidebarWidth - 4,
            top: 0,
            // Stops at the workbench so the divider reads as running behind it.
            bottom: 'var(--dash-workbench-height, 48px)',
            width: 28,
            zIndex: 30,
            cursor: 'pointer',
            transition: 'left var(--prototype-sidebar-transition-ms, 200ms) cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {/* Pseudo divider line — replaces the real border on hover */}
          <div
            className="dash-sidebar-hover-line"
            style={{
              position: 'absolute',
              left: 4,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'transparent',
              transition: 'background var(--prototype-sidebar-fade-ms, 150ms) ease, left var(--prototype-sidebar-transition-ms, 350ms) cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          />
          {/* Tick mark — matches console railHandle: 2×14, sits 8px right of the divider */}
          <div
            className="dash-sidebar-tick"
            style={{
              position: 'absolute',
              top: '50%',
              left: 10,
              transform: 'translateY(-50%)',
              width: 2,
              height: 14,
              borderRadius: 1,
              background: '#7A8CA6',
              transition: 'opacity var(--prototype-sidebar-fade-ms, 150ms) ease, transform 0.2s cubic-bezier(0, 0, 0.2, 1)',
            }}
          />
          {/* Chevron + tooltip on hover */}
          <div
            className="dash-sidebar-collapse-ui"
            style={{
              position: 'absolute',
              top: '50%',
              left: 6,
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              opacity: 0,
              transition: 'opacity var(--prototype-sidebar-fade-ms, 150ms)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#596171', flexShrink: 0 }}>
              {collapsed
                ? <path d="M5.5 3.5L9 7L5.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M8.5 3.5L5 7L8.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
            <div style={{ background: '#1A2C44', color: '#fff', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', fontFamily: "'SF Pro Text', system-ui, sans-serif" }}>
              {collapsed ? 'Expand' : 'Collapse'}
            </div>
          </div>
        </div>
        )}

        {/* Dashboard content and its own Workbench bar. */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <div key={`content-${pathname}`} className={`flex-1 flex flex-col min-w-0 relative z-[1]${hasNavigated ? '' : ' dash-content-entrance'}${isHome ? ' dashboard-content-column--home' : ''}`}>
              {!isComponentLibrary && <DashboardToolbar />}
              <ScrollArea as="main" ref={mainRef} className="flex-1" viewportClassName={`pb-[48px]${isHome ? ' dashboard-main--home' : ''}`} viewportStyle={{ padding: mainPadding }}>
                {/* Home places its own nudge under the console input. */}
                {!isHome && <EnablementNudge style={{ marginTop: 16 }} />}
                <Suspense fallback={null}>
                  <Outlet />
                </Suspense>
              </ScrollArea>
            </div>

          </div>
          <div className="dashboard-developers-content-bar" data-wireframe-tone="dark">
            <IconButton variant="dark" label="Inspect" icon={<ExplorerIcon />} />
            <IconButton variant="dark" label="Errors" icon={<WarningIcon />} />
            <IconButton variant="dark" label="Logs" icon={<TransferIcon />} />
            <IconButton variant="dark" label="Webhooks" icon={<WebhookIcon />} />
            <IconButton variant="dark" label="Open Workbench" icon={<ChevronUpCircleIcon size={18} />} style={{ marginLeft: 20 }} />
          </div>
          {/* Portaled to <body> above the onboarding dialog. */}
          <DashboardPrototypePanel />
          <NetworkOnboardingHost />
          <ConnectSetupHost />
          {/* Bottom-right column for the Setup guide (Home) and Enablement floatie. */}
          <FloatieStack />
          <EnablementFloatie />
        </div>
      </div>
      </ToastProvider>
    </PrototypeProvider>
  )
}
