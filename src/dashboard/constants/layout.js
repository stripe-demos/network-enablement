export const HOME_CONTENT_GUTTER = 40

/** List views (full-bleed tables) span the window; every other page caps at this width. */
export const CONTENT_MAX_WIDTH = 1280
const LIST_VIEW_PREFIXES = ['/transactions', '/customers', '/product-catalog']
export const isListViewPath = (pathname) => LIST_VIEW_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
/** Inline padding that keeps at least `gutter` px and centers a CONTENT_MAX_WIDTH column (100% = the padded box's container). */
export const cappedGutter = (gutter) => `max(${gutter}px, calc((100% - ${CONTENT_MAX_WIDTH}px) / 2))`
export const HOME_TOOLBAR_HEIGHT = 60
export const HOME_COMPACT_SEARCH_HEIGHT = 36
/** Top offset of the compact toolbar search — hero search aligns here when stuck */
export const HOME_TOOLBAR_SEARCH_TOP = (HOME_TOOLBAR_HEIGHT - HOME_COMPACT_SEARCH_HEIGHT) / 2
/** DashboardSidebar account header + nav padding — h1 top aligns with Home nav item */
export const HOME_SIDEBAR_ACCOUNT_HEIGHT = 60
export const HOME_SIDEBAR_NAV_PADDING = 16
export const HOME_HERO_ALIGN_TOP = HOME_SIDEBAR_ACCOUNT_HEIGHT + HOME_SIDEBAR_NAV_PADDING
