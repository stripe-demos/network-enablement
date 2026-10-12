import { useState, useRef, useEffect, useId, useLayoutEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimatedThinkingIcon, ThinkingIcon } from '../prototype/ThinkingIcon.jsx'
import { getConsolePrompts } from '../data/consolePrompts'
import { usePrototype } from '../contexts/PrototypeContext'
import { useSearchPrototypeControls } from '../prototype/useSearchPrototypeControls'
import { useBlurpleLilacFocus, useBlurplePersistTrace, useBlurpleTrace, useEmphasizeGradient, useEmphasizeText, useGrowGradient, useHomeInputOption, usePersistToggleLabel, useRefreshGradient, useShowTooltip, useToggleAutoFocus, useTraceCursor, useTypeArrow } from '../prototype/useHomeInputOption'
import { syncPrototypeSidebarParam } from '../prototype/prototypeSidebarState'
import RotatingConsolePrompt from './RotatingConsolePrompt.jsx'
import { FocusTrace } from '../ui/FocusTrace'
import { DashboardThinkingIcon } from '../ui/DashboardThinkingIcon'
import { getDailyConsolePrompts, localDayKey } from '../data/dailyConsolePrompts'

const SEARCH_UI_COPY = {
  en: {
    defaultPlaceholder: 'Search',
    searchPlaceholder: 'Search',
    consolePlaceholder: 'Ask Console',
    persistedLabelPlaceholder: 'Ask anything',
    consoleButton: 'Ask Console',
    searchDashboard: 'Search dashboard',
    askConsole: 'Ask Console',
    askConsolePrefix: 'Ask Console:',
    suggestedPrompts: 'Suggestions',
    suggestedFilters: 'Filters',
    legal: 'Console is in preview, and AI can make mistakes.',
    viewAllResults: 'View all results',
    viewMoreFilters: 'View more filters',
    dismissPreviewNotice: 'Dismiss preview notice',
  },
  ja: {
    defaultPlaceholder: '検索',
    searchPlaceholder: '検索',
    consolePlaceholder: '何でも質問',
    persistedLabelPlaceholder: '何でも質問',
    consoleButton: 'Console に質問',
    searchDashboard: 'ダッシュボードを検索',
    askConsole: 'Console に質問',
    askConsolePrefix: 'Console に質問:',
    suggestedPrompts: '提案',
    suggestedFilters: 'フィルター',
    legal: 'Console はプレビュー版のため、誤りがある可能性があります。',
    viewAllResults: 'すべての結果を表示',
    viewMoreFilters: '他のフィルターを表示',
    dismissPreviewNotice: 'プレビュー通知を閉じる',
  },
  de: {
    defaultPlaceholder: 'Suchen',
    searchPlaceholder: 'Suchen',
    consolePlaceholder: 'Alles fragen',
    persistedLabelPlaceholder: 'Alles fragen',
    consoleButton: 'Console fragen',
    searchDashboard: 'Dashboard durchsuchen',
    askConsole: 'Console fragen',
    askConsolePrefix: 'Console fragen:',
    suggestedPrompts: 'Vorschläge',
    suggestedFilters: 'Filter',
    legal: 'Console ist eine Vorschauversion und kann Fehler machen.',
    viewAllResults: 'Alle Ergebnisse anzeigen',
    viewMoreFilters: 'Weitere Filter anzeigen',
    dismissPreviewNotice: 'Vorschauhinweis schließen',
  },
}

/* ── Icon components ────────────────────────────────────────────────────── */

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M5.25 2.333H3.5A1.167 1.167 0 002.333 3.5v7A1.167 1.167 0 003.5 11.667h7A1.167 1.167 0 0011.667 10.5V8.75" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.167 2.333h3.5v3.5" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.833 8.167l5.834-5.834" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function InspectIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <rect x="1.75" y="3.5" width="10.5" height="7.583" rx="1.167" stroke="#6C7688" strokeWidth="1.1"/>
      <path d="M4.083 6.417h1.75M4.083 8.75h3.5" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="3.5" cy="3.5" r="1" fill="#6C7688"/>
      <circle cx="7" cy="3.5" r="1" fill="#6C7688"/>
      <circle cx="10.5" cy="3.5" r="1" fill="#6C7688"/>
      <circle cx="3.5" cy="7" r="1" fill="#6C7688"/>
      <circle cx="7" cy="7" r="1" fill="#6C7688"/>
      <circle cx="10.5" cy="7" r="1" fill="#6C7688"/>
      <circle cx="3.5" cy="10.5" r="1" fill="#6C7688"/>
      <circle cx="7" cy="10.5" r="1" fill="#6C7688"/>
      <circle cx="10.5" cy="10.5" r="1" fill="#6C7688"/>
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="7" cy="4.667" r="2.333" stroke="#6C7688" strokeWidth="1.1"/>
      <path d="M2.333 12.25c0-2.578 2.09-4.667 4.667-4.667s4.667 2.09 4.667 4.667" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="7" cy="7" r="6" fill="#1B7E46"/>
      <path d="M4.5 7l1.75 1.75 3.25-3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M8.167 1.75H3.5A1.167 1.167 0 002.333 2.917v8.166A1.167 1.167 0 003.5 12.25h7a1.167 1.167 0 001.167-1.167V5.25L8.167 1.75z" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.167 1.75v3.5h3.5" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="7" cy="7" r="5.25" stroke="#6C7688" strokeWidth="1.1"/>
      <path d="M5.25 5.25a1.75 1.75 0 013.3.875c0 1.167-1.75 1.458-1.75 2.625" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="10.5" r="0.5" fill="#6C7688"/>
    </svg>
  )
}

function AppIcon({ color = '#6C7688' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <rect x="2.333" y="2.333" width="4.083" height="4.083" rx="1" stroke={color} strokeWidth="1.1"/>
      <rect x="7.583" y="2.333" width="4.083" height="4.083" rx="1" stroke={color} strokeWidth="1.1"/>
      <rect x="2.333" y="7.583" width="4.083" height="4.083" rx="1" stroke={color} strokeWidth="1.1"/>
      <rect x="7.583" y="7.583" width="4.083" height="4.083" rx="1" stroke={color} strokeWidth="1.1"/>
    </svg>
  )
}

function SwitchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M9.333 1.75L11.667 4.083 9.333 6.417" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.333 6.417V5.25a2.333 2.333 0 012.333-2.333h7" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.667 12.25L2.333 9.917 4.667 7.583" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.667 7.583v1.167a2.333 2.333 0 01-2.333 2.333h-7" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LetterIcon({ letter }) {
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: 14, height: 14, borderRadius: 3, background: '#533AFD', fontSize: 9, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
      {letter}
    </div>
  )
}

const PROMPT_LAUNCH_THINKING_MS = 1000

const ICON_MAP = {
  link: <LinkIcon />,
  inspect: <InspectIcon />,
  grid: <GridIcon />,
  person: <PersonIcon />,
  check: <CheckIcon />,
  doc: <DocIcon />,
  help: <HelpIcon />,
  app: <AppIcon />,
  switch: <SwitchIcon />,
}

const INPUT_TEXT_COLOR = '#1A2C44'
// Every ghost hint sits in the same place over the input; the colour itself
// lives in CSS on the inner text span, so hover can shift it.
const GHOST_TEXT_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '20px',
  letterSpacing: '-0.15px',
  fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif",
  // Clicks fall through to the input underneath.
  pointerEvents: 'none',
}
// Slack around the glyphs so the hover target is not unforgiving at its edges.
const HINT_HOVER_PADDING = 4

let hintMeasureCtx = null

// The native placeholder is a pseudo-element with no node to measure, so its box
// is derived from the input's content edge plus the width the text renders at.
function nativeHintBox(input) {
  if (!input || !input.placeholder) return null
  const styles = getComputedStyle(input)
  if (!hintMeasureCtx) hintMeasureCtx = document.createElement('canvas').getContext('2d')
  hintMeasureCtx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
  hintMeasureCtx.letterSpacing = styles.letterSpacing
  const rect = input.getBoundingClientRect()
  const left = rect.left + parseFloat(styles.paddingLeft || 0)
  const lineHeight = parseFloat(styles.lineHeight) || rect.height
  return {
    left,
    right: left + hintMeasureCtx.measureText(input.placeholder).width,
    top: rect.top + (rect.height - lineHeight) / 2,
    bottom: rect.top + (rect.height + lineHeight) / 2,
  }
}

/* ── Mock data ──────────────────────────────────────────────────────────── */

const MOCK_DATA = [
  {
    label: 'Switch to',
    items: [
      { icon: 'switch', text: 'Penny Delta', meta: 'acct_1Sn1AVGXTTg1jAcw' },
      { icon: 'letter:S', text: 'Stripe Shop', meta: 'acct_28DT58908KAxCGbLmxyZ' },
      { icon: 'switch', text: 'Stripe P-cards', meta: 'acct_1EPuJeHaZI8FDfFc' },
      { icon: 'switch', text: 'Rocket Rides', meta: 'acct_1Hx3kLRp6oZ2Nv' },
    ],
  },
  {
    label: 'Go to',
    items: [
      { text: 'Payments analytics' },
      { text: 'Transactions > Payments' },
      { text: 'Crypto onramp', badge: 'Preview' },
      { text: 'Balances' },
      { text: 'Customers' },
      { text: 'Product catalog > All products' },
      { text: 'Invoices' },
      { text: 'Subscriptions' },
      { text: 'Settings > Approvals' },
      { text: 'Settings > Team and security' },
      { text: 'Connect > Accounts' },
      { text: 'Billing > Overview' },
      { text: 'Tax > Registrations' },
      { text: 'Reporting > Revenue' },
      { text: 'Fraud tools' },
      { text: 'Terminal' },
    ],
  },
  {
    label: 'Payments',
    items: [
      { icon: 'check', text: '$0.50', meta: 'ch_3Tt9hzCICIKlj...', meta2: 'Jul 14', badge: 'Goldilocks' },
      { icon: 'check', text: '$0.50', meta: 'ch_3Tt9EoCICIKlj...', meta2: 'Jul 14', badge: 'Goldilocks' },
      { icon: 'check', text: '$0.99', meta: 'Subscription upd...', meta2: 'Jul 14', badge: 'Goldilocks' },
      { icon: 'check', text: '$1.00', meta: 'Payment for Invoi...', meta2: 'Jul 10', badge: 'Goldilocks' },
      { icon: 'check', text: '$39.00', meta: 'Subscription update', meta2: 'Jul 4', badge: 'Goldilocks' },
      { icon: 'check', text: '$5.55', meta: 'ch_3ToPOCCICIKlj...', meta2: 'Jul 1', badge: 'Goldilocks' },
      { icon: 'check', text: '$10.00', meta: 'py_3ToBN2CICIKlj...', meta2: 'Jul 1', badge: 'Goldilocks' },
      { icon: 'check', text: '$0.99', meta: 'Subscription upd...', meta2: 'Jun 14', badge: 'Goldilocks' },
      { icon: 'check', text: '$1.23', meta: 'ch_3TgReoCICIKlj...', meta2: 'Jun 9', badge: 'Goldilocks' },
      { icon: 'check', text: '$1.00', meta: 'Subscription crea...', meta2: 'Jun 4', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Accounts',
    items: [
      { icon: 'person', text: 'xgu+test@stripe.com', badge: 'Customer' },
      { icon: 'person', text: 'Xin', badge: 'Recipient' },
      { icon: 'person', text: 'jenny.rosen@example.com', badge: 'Customer' },
      { icon: 'person', text: 'alex.smith@example.com', badge: 'Customer' },
      { icon: 'person', text: 'sam.jones@example.com', badge: 'Customer' },
    ],
  },
  {
    label: 'Tax rates',
    items: [
      { icon: 'check', text: 'asdf – AL', meta: '12%', badge: 'Goldilocks' },
      { icon: 'check', text: 'Sales tax – CA', meta: '8.25%', badge: 'Goldilocks' },
      { icon: 'check', text: 'VAT – EU', meta: '20%', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Pricing plans',
    items: [
      { text: 'Ally\'s pro plan', meta: 'pro_plan', badge: 'Goldilocks' },
      { text: 'Starter plan', meta: 'starter_plan', badge: 'Goldilocks' },
      { text: 'Enterprise plan', meta: 'enterprise_plan', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Recipients',
    items: [
      { icon: 'person', text: 'jenny.chen@example.com', meta: 'Jenny Chen', badge: 'Goldilocks' },
      { icon: 'person', text: 'billing@example.com', meta: 'Initech Corp', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Prices',
    items: [
      { text: 'All possible usage types · price_1PcasK...', meta: '$0.00 / month', badge: 'Goldilocks' },
      { text: 'All possible usage types · price_1Pcarz...', meta: '$0.00 / month', badge: 'Goldilocks' },
      { text: 'Monthly Pizza Delivery · price_1Qx8K2...', meta: '$100.00 / month', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Invoice items',
    items: [
      { text: '$0.00', meta: 'ii_1MCkfACICIKjWvsu1...', meta2: 'Dec 8, 2022', badge: 'Goldilocks' },
      { text: '$50.00', meta: 'ii_1MCBVBCICIKjWvse...', meta2: 'Dec 6, 2022', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Meters',
    items: [
      { text: 'Allys meter 2', meta: 'mtr_61U6sQLYIOzYV', badge: 'Goldilocks' },
      { text: 'allysmeter', meta: 'mtr_61U6rIYgFvTC8i', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Products',
    items: [
      { icon: 'check', text: 'All possible usage types', meta: '4 prices', badge: 'Goldilocks' },
      { icon: 'check', text: 'Monthly Pizza Delivery', meta: '$100.00 / month', badge: 'Goldilocks' },
      { icon: 'check', text: 'Premium Support', meta: '$49.00 / month', badge: 'Goldilocks' },
    ],
  },
  {
    label: 'Installed apps',
    items: [
      { icon: 'app', text: 'Sync my Data' },
      { icon: 'app', text: 'Unitylukas' },
      { icon: 'app', text: 'Parcelcraft Shipping' },
      { icon: 'app', text: 'Cakes' },
      { icon: 'app', text: 'Tax Jar' },
    ],
  },
  {
    label: 'Help',
    items: [
      { icon: 'help', text: 'Help: Payouts' },
      { icon: 'help', text: 'Help: Payments' },
      { icon: 'help', text: 'Help: Privacy' },
      { icon: 'help', text: 'Help: Account' },
      { icon: 'help', text: 'Help: Taxes' },
      { icon: 'help', text: 'Help: Billing' },
      { icon: 'help', text: 'Help: Disputes' },
      { icon: 'help', text: 'Help: Connect' },
    ],
  },
  {
    label: 'Docs',
    items: [
      { icon: 'doc', text: 'See all products — Home' },
      { icon: 'doc', text: 'Stripe health alerts — Home' },
      { icon: 'doc', text: 'Accept a payment — Docs' },
      { icon: 'doc', text: 'Quickstart — Docs' },
      { icon: 'doc', text: 'Checkout integration — Docs' },
    ],
  },
  {
    label: 'Profiles',
    items: [
      { icon: 'letter:A', text: 'alaap.org', meta: '@alaap' },
      { icon: 'letter:A', text: 'Al-fissah', meta: '@al_fissah' },
    ],
  },
]

/* ── Suggested filters (empty-query state) ──────────────────────────────── */

const FILTERS = [
  { key: 'is:', example: 'is:customer', desc: 'object type' },
  { key: 'last4:', example: 'last4:2326', desc: 'last four digits of the card or account' },
  { key: 'date:', example: 'date:YYYY/MM/DD', desc: 'object created on date or range' },
  { key: 'email:', example: 'email:jenny@example.com', desc: 'email address' },
  { key: 'status:', example: 'status:canceled', desc: 'status of an object' },
  { key: 'profile:', example: 'profile:@username', desc: 'other business on Stripe' },
]

const FILTER_VALUES = {
  'is:': [
    'is:payment', 'is:captured', 'is:customer', 'is:customer_account',
    'is:guest', 'is:disputed', 'is:document', 'is:payment_intent',
    'is:payment_record', 'is:charge_from_payment_intent', 'is:subscription',
    'is:invoice', 'is:refund', 'is:payout', 'is:transfer',
  ],
  'last4:': ['last4:2326', 'last4:4242', 'last4:1234', 'last4:0000'],
  'date:': ['date:2024/01/01', 'date:2024/07/14', 'date:today', 'date:this_week', 'date:this_month'],
  'email:': ['email:jenny@example.com', 'email:alex.smith@example.com', 'email:sam.jones@example.com'],
  'status:': ['status:canceled', 'status:succeeded', 'status:failed', 'status:pending', 'status:active', 'status:incomplete'],
  'profile:': ['profile:@username', 'profile:@stripe', 'profile:@acme'],
}

/* ── Highlight matching substring ───────────────────────────────────────── */

function HighlightText({ text, query }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

/* ── Get icon element from string key ───────────────────────────────────── */

function getIcon(iconKey) {
  if (!iconKey) return null
  if (iconKey.startsWith('letter:')) {
    return <LetterIcon letter={iconKey.split(':')[1]} />
  }
  return ICON_MAP[iconKey] || null
}

/* ── Match + filter logic ───────────────────────────────────────────────── */

const MAX_CATEGORIES = 6
const MAX_ITEMS_PER_CATEGORY = 3

function getFilteredResults(query) {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()
  const results = []

  for (const category of MOCK_DATA) {
    if (results.length >= MAX_CATEGORIES) break

    const labelMatch = category.label.toLowerCase().includes(q.replace(/^is:/, ''))
    const matched = labelMatch
      ? category.items
      : category.items.filter(item => {
          const searchable = [item.text, item.meta, item.badge, item.meta2]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return searchable.includes(q)
        })

    if (matched.length > 0) {
      results.push({
        label: category.label,
        items: matched.slice(0, labelMatch ? 10 : MAX_ITEMS_PER_CATEGORY),
      })
    }
  }

  return results
}

/* ── Suggested filters row ──────────────────────────────────────────────── */

function getMatchingFilters(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()

  const matchedPrefix = Object.keys(FILTER_VALUES).find(prefix => q.startsWith(prefix))
  if (matchedPrefix) {
    const subQ = q.slice(matchedPrefix.length)
    return FILTER_VALUES[matchedPrefix]
      .filter(v => !subQ || v.toLowerCase().includes(q))
      .filter(v => v.toLowerCase() !== q)
      .map(v => ({ key: v, example: '', desc: '' }))
  }

  return FILTERS.filter(f =>
    f.key.toLowerCase().includes(q) ||
    f.example.toLowerCase().includes(q) ||
    f.desc.toLowerCase().includes(q)
  )
}

/* ── Rotating placeholder strings (separate mode only) ─────────────────── */
const SEARCH_PLACEHOLDERS = [
  'e.g. jenny@example.com',
  'e.g. cus_1Hx3kLRp…',
  'e.g. ch_3Tt9hz…',
  'e.g. last4:4242',
  'e.g. inv_1MCkfA…',
]

const CONSOLE_PLACEHOLDERS = [
  'Give me my daily brief',
  'Show me failed payments I should retry',
  "What's driving my dispute rate?",
  'Who are my top customers this quarter?',
  'How is my MRR trending?',
  'Catch me up — what happened since I was last here?',
]

const HERO_PROMPT_PLACEHOLDERS = [
  "How's my revenue trending?",
  'Show me failed payments from the last 7 days',
  'Find revenue opportunities I might be missing',
]

const ACT_PLACEHOLDERS = [
  'Refund payment for jenny@example.com',
  'Send invoice to alex.smith@example.com',
  'Create a subscription for the starter plan',
  'Retry all failed payments from last week',
  'Cancel sub_1Hx3kLRp and notify the customer',
]

const COMPACT_SEARCH_CLOSED_WIDTH = 420
const COMPACT_SEARCH_OPEN_WIDTH = 560

const SPOTLIGHT_SCROLL_FADE_MS = 140
// Focusing the field can nudge the scroll container as the popover opens.
const SPOTLIGHT_SCROLL_GRACE_MS = 220

// The callout is its own moment, so it holds until the page has finished
// arriving and then waits a beat longer rather than fading up in the middle of
// the dashboard painting in.
const SPOTLIGHT_SETTLE_MS = 700
// How long the emphasis band takes to cross the hint. Kept in step with
// home-search-hint-shimmer in dashboard.css.
const SHIMMER_DURATION_MS = 1400
// With Emphasize on the two are one sequence — band across the label, on through
// the keycap, then the card. The band's brand core has left the hint by about
// this far into the run; what remains is its shoulder fading out past the point
// you can see it. Handing off here rather than at the animation's formal end is
// what keeps the card on the sweep's heels instead of a third of a second behind
// it. Measured by scripts/measure-band-exit.mjs.
const SHIMMER_HANDOFF = 0.85

// Shared curve for search <-> Console state changes: quick, but eased all the way out.
const MODE_EASE = [0.32, 0.72, 0, 1]
const MODE_GHOST_TRANSITION = { duration: 0.2, ease: MODE_EASE }
const MODE_ICON_TRANSITION = { duration: 0.22, ease: MODE_EASE }
const MODE_SPOTLIGHT_TRANSITION = { duration: 0.22, ease: MODE_EASE }

// Focus tint for Console mode: a brand stroke over the Home search–Select
// shadow.
const SWIRL_DURATION_MS = 780
const SWIRL_EASING = 'cubic-bezier(0.2, 0, 0.25, 1)'
// Going back to Search crossfades the tint off in place: the purple layers fade
// away over the grey track they were laid on, so the outline changes colour
// without anything travelling. Arriving is an announcement and earns its sweep;
// leaving has nothing to say, and running the sweep backwards only read as
// jumpy. Kept in step with the transition on .home-search-bar__swirl-tint.
const SWIRL_EXIT_MS = 360
// Share of the outline lit by the leading sheen. The refresh tints run a much
// longer lead: rather than a bright sheen, their head is recoloured to the
// field's own grey (see CSS), so it reads as a grey cap that the blue-pink-orange
// gradient trails out of. It needs room to read as "grey for a bit" before the
// colour, and it lifts by the settle so the whole ring lands as the gradient.
const SWIRL_HEAD_RATIO = 0.06
// The refresh grey lead now lives in the sweep gradient itself (a grey start stop
// that morphs to colour on settle), so the leading cap is kept to the same small
// tip as the other tints — a long grey head on top of a grey-started gradient
// would just double the grey and muddy the front.
const SWIRL_HEAD_RATIO_REFRESH = 0.06
// Portion of the draw over which the outline eases up from transparent to
// opaque, so the colour fades onto the field as it begins rather than snapping
// on at full strength.
const SWIRL_FADE_IN_RATIO = 0.45
// Tints whose sweep is the three-stop brand gradient, and which draw with the
// grey leading cap described above.
const SWIRL_REFRESH_TINTS = new Set(['refreshGradient', 'refreshGrow', 'refreshTrace'])
// Reach of the darker pool that trails the pointer. Kept well under the field's
// width so the highlight stays local instead of washing the whole outline.
const SWIRL_POINTER_RADIUS = 110
// Fraction of the remaining distance closed each frame. Low enough to lag the
// pointer slightly, which is what makes the movement read as fluid.
const SWIRL_POINTER_EASE = 0.14
// Grace period after the cursor stops before the pool starts receding. Long
// enough to sit through the pauses in ordinary pointer movement.
const SWIRL_POINTER_IDLE_MS = 600
// Trace cursor: how close (px) the pointer has to be to an outline edge to keep
// the glow lit. Inside this band it rides the border; past it, in the body of
// the field, the glow recedes.
const SWIRL_BORDER_BAND = 18
// Trace cursor: how far the glow is squashed vertically. The reach stays wide
// horizontally (SWIRL_POINTER_RADIUS) but collapses in y, so the highlight
// spreads left and right along the nearest edge rather than flaring onto both
// the top and bottom of the outline at once.
const SWIRL_POINTER_VSQUISH = 0.24
// The focus treatments. Both run the grey-to-colour swirl and settle the
// outline on a gradient painted by the sweep itself (see the stops in
// DashboardHomeSearch's defs and the paint wiring in dashboard.css), so `border` here is
// only a fallback for the sliver of frame the overlay does not cover, and the
// settled colour proper lives in the gradient. `pointer` is the deeper shade the
// pool gathers along the typed text, once the sweep is home.
//   • blurpleLilac — sweeps in on blurple, settles to lilac.
//   • refreshGradient — settles on the three-stop brand gradient from Figma
//     (#533AFD → #F44BCC → #FF6118); the stops are fixed, so it has nothing to
//     hand over at the landing.
//   • refreshGrow — announces on the same three-stop gradient, then fades back
//     to the grey track; from there a colour arc grows with the typed query, so
//     `border` settles grey and the colour lives only in the growing arc.
//   • refreshTrace — announces and fades the same way, but from there a colour
//     pool follows the pointer around the field, so `border` settles grey and
//     `pointer` is the brand colour the pool carries.
//   • blurpleTrace — the blurple sibling of refreshTrace: the blurple-to-lilac
//     swirl announces and fades to grey, then a blurple pool follows the pointer.
//   • blurplePersistTrace — the two combined: the blurple-to-lilac gradient
//     settles and stays (like the persistent gradient), and the blurple pointer
//     pool traces the cursor on top of it, so the outline reads lilac with a
//     deeper blurple gathered wherever the cursor rides the border.
const FOCUS_TINTS = {
  blurpleLilac: { border: '#C3B6FB', pointer: '#675DFF' },
  refreshGradient: { border: '#533AFD', pointer: '#533AFD' },
  refreshGrow: { border: '#D4DEE9', pointer: '#533AFD' },
  refreshTrace: { border: '#D4DEE9', pointer: '#533AFD' },
  blurpleTrace: { border: '#D4DEE9', pointer: '#675DFF' },
  blurplePersistTrace: { border: '#C3B6FB', pointer: '#675DFF' },
}
const FOCUS_TINT_SHADOW = '0 2px 5px rgba(0, 0, 0, 0.08)'
// Tint keys are camelCase, matching the settings they come from; the modifiers
// they select are kebab, matching the rest of the stylesheet.
const tintModifier = (tint) => tint.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

function SearchPrototypeIcon({ icon, animated = false, migrating = false }) {
  if (icon === 'none') return null

  const opacity = 'var(--prototype-search-icon-opacity, 0.5)'

  if (icon === 'thinking') {
    return (
      <motion.span
        className="w-[12px] h-[12px] shrink-0 inline-flex items-center justify-center"
        style={{ opacity: animated ? 'var(--prototype-thinking-icon-opacity, 1)' : 'var(--prototype-search-icon-opacity, 0.5)' }}
        animate={migrating ? { x: [5, 0], rotate: [-24, 0], opacity: [0.25, 0.5] } : { x: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 560, damping: 34, mass: 0.6 }}
      >
        {animated ? (
          <AnimatedThinkingIcon size={12} color="#665EFD" className="home-search-input-thinking-icon" />
        ) : (
          <ThinkingIcon size={12} color="#474E5A" className="home-search-input-thinking-icon" />
        )}
      </motion.span>
    )
  }

  return (
    <img
      src="/dashboard-assets/icons/search-12.svg"
      alt=""
      className="w-[12px] h-[12px] shrink-0"
      style={{ opacity }}
    />
  )
}

/* Both glyphs stay mounted and crossfade, so neither one pops. */
function ModeCrossfadeIcon({ consoleMode }) {
  return (
    <span className="home-search-mode-icon" aria-hidden="true">
      <motion.span
        className="home-search-mode-icon__layer"
        initial={false}
        animate={{ opacity: consoleMode ? 0 : 1, scale: consoleMode ? 0.7 : 1 }}
        transition={MODE_ICON_TRANSITION}
      >
        <img src="/dashboard-assets/icons/search-12.svg" alt="" className="w-[12px] h-[12px]" />
      </motion.span>
      <motion.span
        className="home-search-mode-icon__layer"
        initial={false}
        animate={{ opacity: consoleMode ? 1 : 0, scale: consoleMode ? 1 : 0.7 }}
        transition={MODE_ICON_TRANSITION}
      >
        <ThinkingIcon size={12} color="#474E5A" className="home-search-input-thinking-icon" />
      </motion.span>
    </span>
  )
}

function OutlineModeButton({ active, showConsoleIcon = active, side = 'left', animated = true, onToggle }) {
  const iconInitial = animated
    ? { opacity: 0, scale: 0.62, rotate: showConsoleIcon ? -18 : 14 }
    : { opacity: 0, scale: 0.96, rotate: 0 }
  const iconAnimate = animated
    ? { opacity: 1, scale: [0.62, 1.16, 0.96, 1], rotate: 0 }
    : { opacity: 1, scale: 1, rotate: 0 }
  const iconTransition = animated
    ? { duration: 0.34, ease: [0.2, 0, 0.1, 1] }
    : { duration: 0.14, ease: [0.33, 1, 0.68, 1] }

  return (
    <button
      type="button"
      className={`home-search-outline-mode-button home-search-outline-mode-button--${side}${active ? ' home-search-outline-mode-button--active' : ''}`}
      aria-label={active ? 'Switch to search' : 'Switch to Console'}
      aria-pressed={active}
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <motion.span
        key={showConsoleIcon ? 'outline-console' : 'outline-search'}
        className="home-search-outline-mode-button__icon"
        initial={iconInitial}
        animate={iconAnimate}
        transition={iconTransition}
      >
        {showConsoleIcon ? (
          <ThinkingIcon size={13} color="currentColor" />
        ) : (
          <img src="/dashboard-assets/icons/search-12.svg" alt="" className="home-search-outline-mode-button__search-icon" />
        )}
      </motion.span>
    </button>
  )
}

function PaymentResultsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.25 4.25V10.75H14.25V4.25H4.25ZM2.75 4C2.75 3.30964 3.30964 2.75 4 2.75H14.5C15.1904 2.75 15.75 3.30964 15.75 4V11C15.75 11.6904 15.1904 12.25 14.5 12.25H4C3.30964 12.25 2.75 11.6904 2.75 11V4Z" fill="#3C4F69" />
      <path fillRule="evenodd" clipRule="evenodd" d="M1 5.25C1.41421 5.25 1.75 5.58579 1.75 6V12.5C1.75 12.9142 2.08579 13.25 2.5 13.25H12.5C12.9142 13.25 13.25 13.5858 13.25 14C13.25 14.4142 12.9142 14.75 12.5 14.75H2.5C1.25736 14.75 0.25 13.7426 0.25 12.5V6C0.25 5.58579 0.585786 5.25 1 5.25Z" fill="#3C4F69" />
      <path fillRule="evenodd" clipRule="evenodd" d="M8.5 7V8C8.5 8.41421 8.83579 8.75 9.25 8.75C9.66421 8.75 10 8.41421 10 8V7C10 6.58579 9.66421 6.25 9.25 6.25C8.83579 6.25 8.5 6.58579 8.5 7ZM7.25 7V8C7.25 9.10457 8.14543 10 9.25 10C10.3546 10 11.25 9.10457 11.25 8V7C11.25 5.89543 10.3546 5 9.25 5C8.14543 5 7.25 5.89543 7.25 7Z" fill="#3C4F69" />
    </svg>
  )
}

/* ── Plus mode mock data ────────────────────────────────────────────────── */

const MCP_SERVERS = [
  { name: 'Stripe API', desc: 'Payments & billing' },
  { name: 'Linear', desc: 'Issues & roadmap' },
  { name: 'GitHub', desc: 'Repos & PRs' },
  { name: 'Slack', desc: 'Team channels' },
  { name: 'Jira', desc: 'Project tracking' },
]

const SKILLS = [
  { name: 'Revenue analysis', desc: 'MRR, ARR, trends' },
  { name: 'Fraud detection', desc: 'Radar rules' },
  { name: 'Customer insights', desc: 'Segments & LTV' },
  { name: 'Billing automation', desc: 'Invoices & subs' },
  { name: 'Chargeback response', desc: 'Dispute evidence' },
]

/* ── Skeleton loading state ─────────────────────────────────────────────── */
const SKELETON_WIDTHS = [
  ['55%', '70%', '45%'],
  ['72%', '58%', '80%'],
  ['60%', '50%', '68%'],
]

function SkeletonSection({ widths, showDivider = false }) {
  return (
    <div>
      {showDivider && <div style={{ height: 1, background: '#EBEEF1', margin: '4px 8px' }} />}
      <div style={{ padding: '8px 8px 6px' }}>
        <div className="skeleton-bar" style={{ height: 13, width: 56 }} />
      </div>
      {widths.map((w, i) => (
        <div key={i} style={{ padding: '7px 8px' }}>
          <div className="skeleton-bar" style={{ height: 13, width: w }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonResults() {
  return (
    <div style={{ padding: '0 8px' }}>
      <SkeletonSection widths={SKELETON_WIDTHS[0]} />
      <SkeletonSection widths={SKELETON_WIDTHS[1]} showDivider />
      <SkeletonSection widths={SKELETON_WIDTHS[2]} showDivider />
    </div>
  )
}

/* ── Shared spotlight styles ─────────────────────────────────────────────── */

const spotlightSectionHeaderStyle = {
  padding: '8px 8px 4px',
  fontSize: 13,
  fontWeight: 600,
  color: '#353A44',
  lineHeight: '20px',
}

const spotlightRowTextStyle = {
  flex: 1,
  color: '#353A44',
  fontWeight: 400,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

function SpotlightSectionHeader({ children }) {
  return <div style={spotlightSectionHeaderStyle}>{children}</div>
}

const rowStyle = {
  padding: '6px 8px',
  borderRadius: 8,
  fontSize: 13,
  lineHeight: '20px',
  fontFamily: "'SF Pro Text', system-ui, sans-serif",
  background: 'transparent',
  border: 'none',
  transition: 'background 80ms ease',
  width: '100%',
}

function hoverIn(e) { e.currentTarget.style.background = '#F4F7FA' }
function hoverOut(e) {
  if (e.currentTarget.dataset.focused !== 'true') e.currentTarget.style.background = ''
}

/* ── Console section (inline in results list) ───────────────────────────── */
function ConsoleSection({
  query,
  showDivider,
  hideHeader = false,
  headerLabel = 'Console',
  showPromptIcon = false,
  hidePassthrough = false,
  staticPrompts = null,
  askConsolePrefix = 'Ask Console:',
  onLaunch,
  limit = 5,
}) {
  const { prompts: matchedPrompts } = useMemo(() => getConsolePrompts(query, limit), [query, limit])
  const hasQuery = query.trim().length > 0
  const prompts = !hasQuery && staticPrompts
    ? staticPrompts.map((text) => ({ text }))
    : matchedPrompts

  const passthroughItem = !hidePassthrough && hasQuery
    ? { text: query.trim(), passthrough: true }
    : null
  const passthroughRowStyle = {
    ...rowStyle,
    marginTop: showDivider ? 2 : 8,
  }

  if (prompts.length === 0 && !passthroughItem) return null

  return (
    <div>
      {showDivider && <div style={{ height: 1, background: '#EBEEF1', margin: '4px 8px' }} />}
      {passthroughItem && (
        <button
          data-item
          data-item-type="console"
          data-prompt-text={passthroughItem.text}
          className="flex items-center w-full text-left cursor-pointer gap-[8px]"
          style={passthroughRowStyle}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          onClick={() => onLaunch?.(passthroughItem.text)}
        >
          {showPromptIcon && <ThinkingIcon size={14} color="#706AE7" />}
          <span style={spotlightRowTextStyle}>
            {askConsolePrefix} <strong style={{ fontWeight: 600 }}>{passthroughItem.text}</strong>
          </span>
        </button>
      )}
      {passthroughItem && prompts.length > 0 && (
        <div style={{ height: 1, background: '#EBEEF1', margin: '4px 8px' }} />
      )}
      {prompts.length > 0 && !hideHeader && (
        <SpotlightSectionHeader>{headerLabel}</SpotlightSectionHeader>
      )}
      {prompts.map((s, i) => (
        <button
          key={i}
          data-item
          data-item-type="console"
          data-prompt-text={s.text}
          className="flex items-center w-full text-left cursor-pointer gap-[8px]"
          style={rowStyle}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          onClick={() => onLaunch?.(s.text)}
        >
          {showPromptIcon && <ThinkingIcon size={14} color="#706AE7" />}
          <span style={spotlightRowTextStyle}>
            {s.text}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Plus button (plus variant) ─────────────────────────────────────────── */

function PlusButton({ active, size = 22, onMouseDown }) {
  const iconSize = size <= 22 ? 9 : 11
  return (
    <button
      onMouseDown={onMouseDown}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: '#EBEEF1', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, outline: 'none', padding: 0,
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 10 10" fill="none"
        style={{ transform: active ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 180ms cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
        <path d="M5 1.5V8.5M1.5 5H8.5" stroke="#596171" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

/* ── Mode chip (plus variant) — icon-only, no text ───────────────────────── */

const CHIP_ICONS = {
  search: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="5.8" cy="5.8" r="3.6" stroke="#596171" strokeWidth="1.3"/>
      <path d="M9 9L12 12" stroke="#596171" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  console: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L8.4 5.6H12.8L9.2 8.1L10.6 12.2L7 9.7L3.4 12.2L4.8 8.1L1.2 5.6H5.6L7 1.5Z" stroke="#596171" strokeWidth="1.1" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  act: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.25" stroke="#596171" strokeWidth="1.1"/>
      <path d="M9.042 4.958L7.583 7.583L4.958 9.042L6.417 6.417L9.042 4.958Z" stroke="#596171" strokeWidth="1.1" strokeLinejoin="round"/>
      <circle cx="7" cy="7" r="0.8" fill="#596171"/>
    </svg>
  ),
}

function PlusChip({ type, exiting, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '0 6px 0 10px', height: 32, borderRadius: 8,
      background: 'white', border: '1px solid #D4DEE9', flexShrink: 0,
      animation: exiting
        ? 'chip-exit 150ms cubic-bezier(0.4, 0, 1, 1) forwards'
        : 'chip-enter 180ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
      pointerEvents: exiting ? 'none' : undefined,
    }}>
      {CHIP_ICONS[type]}
      <button
        onMouseDown={(e) => { e.preventDefault(); onRemove() }}
        style={{ display: 'flex', alignItems: 'center', padding: '3px 2px', background: 'none', border: 'none', cursor: 'pointer', color: '#9AA3B0', borderRadius: 3, lineHeight: 1 }}
      >
        <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Plus popover (plus variant) ─────────────────────────────────────────── */

const plusMenuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '7px 10px', borderRadius: 6,
  fontSize: 13, fontWeight: 400, color: '#1A2C44',
  cursor: 'pointer', background: 'transparent', border: 'none',
  width: '100%', textAlign: 'left',
  fontFamily: "'SF Pro Text', system-ui, sans-serif",
  transition: 'background 80ms',
}

function PlusPopover({ onSelectMode, onClose, barHeight, labels = SEARCH_UI_COPY.en }) {
  const [submenu, setSubmenu] = useState(null)
  const items = submenu === 'mcp' ? MCP_SERVERS : submenu === 'skills' ? SKILLS : null
  const hi = (e) => { e.currentTarget.style.background = '#F4F7FA' }
  const lo = (e) => { e.currentTarget.style.background = '' }

  return (
    <div style={{
      position: 'absolute', top: barHeight + 8, left: 0, width: 248,
      background: 'white', border: '1px solid #D4DEE9', borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      zIndex: 60, overflow: 'hidden',
    }}>
      {items ? (
        /* ── Sub-menu ── */
        <>
          <button style={{ ...plusMenuItemStyle, color: '#596171', gap: 6 }} onClick={() => setSubmenu(null)} onMouseEnter={hi} onMouseLeave={lo}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6L8 10" stroke="#596171" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{submenu === 'mcp' ? 'MCP Servers' : 'Skills'}</span>
          </button>
          <div style={{ height: 1, background: '#EBEEF1', margin: '0 10px' }} />
          <div style={{ padding: '4px' }}>
            {items.map(item => (
              <button key={item.name} style={plusMenuItemStyle} onMouseEnter={hi} onMouseLeave={lo}>
                <span style={{ flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 11, color: '#9AA3B0' }}>{item.desc}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* ── Main menu ── */
        <div style={{ padding: '4px' }}>
          {/* Modes */}
          <button style={plusMenuItemStyle} onMouseEnter={hi} onMouseLeave={lo} onMouseDown={(e) => { e.preventDefault(); onSelectMode('search'); onClose() }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="5.8" cy="5.8" r="3.8" stroke="#6C7688" strokeWidth="1.2"/>
              <path d="M9 9L12 12" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {labels.searchDashboard}
          </button>
          <button style={plusMenuItemStyle} onMouseEnter={hi} onMouseLeave={lo} onMouseDown={(e) => { e.preventDefault(); onSelectMode('console'); onClose() }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L8.4 5.6H12.8L9.2 8.1L10.6 12.2L7 9.7L3.4 12.2L4.8 8.1L1.2 5.6H5.6L7 1.5Z" stroke="#6C7688" strokeWidth="1.1" fill="none" strokeLinejoin="round"/>
            </svg>
            {labels.askConsole}
          </button>

          <div style={{ height: 1, background: '#EBEEF1', margin: '4px 6px' }} />

          {/* Attach (filler) */}
          <button style={plusMenuItemStyle} onMouseEnter={hi} onMouseLeave={lo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.75" y="2.917" width="10.5" height="8.167" rx="1.167" stroke="#6C7688" strokeWidth="1.1"/>
              <circle cx="4.667" cy="5.833" r="1.167" stroke="#6C7688" strokeWidth="1.1"/>
              <path d="M1.75 9.333l2.917-2.333 2.916 2.333 1.75-1.166 2.917 1.75" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Attach image</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#C4CDD6' }}>soon</span>
          </button>
          <button style={plusMenuItemStyle} onMouseEnter={hi} onMouseLeave={lo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8.167 1.75H3.5A1.167 1.167 0 002.333 2.917v8.166A1.167 1.167 0 003.5 12.25h7a1.167 1.167 0 001.167-1.167V5.25L8.167 1.75z" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.167 1.75v3.5h3.5" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Attach file</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#C4CDD6' }}>soon</span>
          </button>

          <div style={{ height: 1, background: '#EBEEF1', margin: '4px 6px' }} />

          {/* Tools */}
          <button style={plusMenuItemStyle} onMouseEnter={hi} onMouseLeave={lo} onMouseDown={(e) => { e.preventDefault(); setSubmenu('mcp') }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.75" y="1.75" width="4.667" height="4.667" rx="1" stroke="#6C7688" strokeWidth="1.1"/>
              <rect x="7.583" y="1.75" width="4.667" height="4.667" rx="1" stroke="#6C7688" strokeWidth="1.1"/>
              <rect x="1.75" y="7.583" width="4.667" height="4.667" rx="1" stroke="#6C7688" strokeWidth="1.1"/>
              <path d="M9.917 7.583v4.667M7.583 9.917h4.667" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            MCP Servers
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
              <path d="M4.5 3L7.5 6L4.5 9" stroke="#9AA3B0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button style={plusMenuItemStyle} onMouseEnter={hi} onMouseLeave={lo} onMouseDown={(e) => { e.preventDefault(); setSubmenu('skills') }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.167a5.833 5.833 0 100 11.666A5.833 5.833 0 007 1.167z" stroke="#6C7688" strokeWidth="1.1"/>
              <path d="M7 4.083v3.5l2.333 1.167" stroke="#6C7688" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Skills
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
              <path d="M4.5 3L7.5 6L4.5 9" stroke="#9AA3B0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Console launch button (hero search) ─────────────────────────────────── */

const closeMotionTransitions = {
  fluid: { duration: 0.22, ease: [0.2, 0, 0.1, 1] },
  snappy: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  soft: { duration: 0.26, ease: [0.33, 1, 0.68, 1] },
  spring: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  bounce: { type: 'spring', stiffness: 620, damping: 18, mass: 0.62 },
  'framer-smooth': { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  'framer-snappy': { type: 'spring', stiffness: 680, damping: 42, mass: 0.55 },
  'framer-snappy-rotate': { type: 'spring', stiffness: 680, damping: 42, mass: 0.55 },
  'framer-back': { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] },
  'framer-spring': { type: 'spring', stiffness: 500, damping: 30, mass: 0.75 },
  'framer-bouncy': { type: 'spring', stiffness: 560, damping: 16, mass: 0.65 },
}

function CloseGlyph({ active, motionPreset }) {
  const transition = closeMotionTransitions[motionPreset] || closeMotionTransitions.fluid
  const closedRotate = motionPreset === 'framer-snappy-rotate' ? -42 : -4
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
        scale: active ? 1 : 0.82,
        rotate: active ? 0 : closedRotate,
      }}
      transition={transition}
    >
      <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </motion.svg>
  )
}

function ConsoleToggleButton({
  active,
  morphEnabled = true,
  defaultStyle = 'gray',
  activeStyle = 'black',
  borderRadius = 4,
  fontSize = 12,
  label = 'Console',
  thinking = false,
  hideIcon = false,
  motionPreset = 'fluid',
  toggleXGrey = false,
  onClick,
}) {
  const showExitAffordance = active && morphEnabled && !thinking
  const labelText = label || 'Console'
  const toggleXOnly = defaultStyle === 'toggle-x'
  const textStringType = defaultStyle === 'text-string'
  const flipFlopType = defaultStyle === 'flip-flop' || defaultStyle === 'flip-flop-2'
  const flipFlopTextOnlyType = defaultStyle === 'flip-flop-2'
  const toggleSwitchType = defaultStyle === 'toggle'
  const visibleLabelText = flipFlopTextOnlyType
    ? (active ? 'Console mode' : 'Search mode')
    : (textStringType || flipFlopType) && active ? 'Search' : labelText
  const baseMeasureRef = useRef(null)
  const morphedMeasureRef = useRef(null)
  const wasActiveRef = useRef(active)
  const [measuredWidths, setMeasuredWidths] = useState({ base: 0, morphed: 0 })
  const [suppressExitHover, setSuppressExitHover] = useState(false)

  useLayoutEffect(() => {
    const baseMeasured = Math.ceil(baseMeasureRef.current?.scrollWidth || 0)
    const morphedMeasured = Math.ceil(morphedMeasureRef.current?.scrollWidth || 0)
    const base = toggleSwitchType ? 56 : (baseMeasured || 84)
    const morphed = toggleSwitchType ? 56 : textStringType
      ? (morphedMeasured || base)
      : flipFlopType
        ? Math.max(base, morphedMeasured || base)
        : toggleXOnly ? 30 : (morphedMeasured || base + 16)
    setMeasuredWidths((prev) => (
      prev.base === base && prev.morphed === morphed ? prev : { base, morphed }
    ))
  }, [fontSize, labelText, visibleLabelText, hideIcon, toggleXOnly, textStringType, flipFlopType, toggleSwitchType])

  useLayoutEffect(() => {
    if ((defaultStyle === 'cap' || defaultStyle === 'outline') && wasActiveRef.current && !active) {
      setSuppressExitHover(true)
      const timeout = window.setTimeout(() => setSuppressExitHover(false), 280)
      wasActiveRef.current = active
      return () => window.clearTimeout(timeout)
    }
    wasActiveRef.current = active
    if (active || (defaultStyle !== 'cap' && defaultStyle !== 'outline')) setSuppressExitHover(false)
  }, [active, defaultStyle])

  return (
    <button
      type="button"
      className={`home-search-console-toggle home-search-console-toggle--default-${defaultStyle}${flipFlopType ? ' home-search-console-toggle--flip-flop-variant' : ''} home-search-console-toggle--active-${activeStyle}${active ? ' home-search-console-toggle--active' : ''}${showExitAffordance ? ' home-search-console-toggle--morphed' : ''}${toggleXGrey ? ' home-search-console-toggle--toggle-x-grey' : ''}${thinking ? ' home-search-console-toggle--thinking' : ''}${suppressExitHover ? ' home-search-console-toggle--exiting' : ''}`}
      style={{
        '--home-search-console-button-radius': `${borderRadius}px`,
        '--home-search-console-button-width': measuredWidths.base ? `${measuredWidths.base}px` : 'max-content',
        '--home-search-console-button-morphed-width': measuredWidths.morphed ? `${measuredWidths.morphed}px` : 'max-content',
        '--home-search-console-button-cap-morphed-width': measuredWidths.base ? `${measuredWidths.base + 30}px` : 'max-content',
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      onClick={(e) => e.stopPropagation()}
      aria-label={thinking ? 'Launching Console' : active ? 'Exit prompt mode' : 'Open Console'}
      aria-pressed={active}
      aria-busy={thinking}
    >
      <span ref={baseMeasureRef} className="home-search-console-toggle__label home-search-console-toggle__label--measure" style={{ fontSize }} aria-hidden="true">
        {textStringType ? (
          <>
            <span className="home-search-console-toggle__text">{labelText}</span>
            <span className="home-search-console-toggle__keycap" aria-hidden="true">
              <span className="home-search-console-toggle__keycap-command">⌘</span>
              <span className="home-search-console-toggle__keycap-slash">/</span>
            </span>
          </>
        ) : flipFlopType ? (
          <>
            {!flipFlopTextOnlyType && <ThinkingIcon size={12} color="currentColor" />}
            <span className="home-search-console-toggle__text">{flipFlopTextOnlyType ? 'Search mode' : labelText}</span>
          </>
        ) : (
          <>
            {!hideIcon && <ThinkingIcon size={12} color="currentColor" />}
            {labelText}
          </>
        )}
      </span>
      <span ref={morphedMeasureRef} className="home-search-console-toggle__label home-search-console-toggle__label--measure home-search-console-toggle__label--morphed-measure" style={{ fontSize }} aria-hidden="true">
        {textStringType ? (
          <>
            <span className="home-search-console-toggle__text">{visibleLabelText}</span>
            <span className="home-search-console-toggle__keycap home-search-console-toggle__keycap--slash-only" aria-hidden="true">
              <span className="home-search-console-toggle__keycap-slash">/</span>
            </span>
          </>
        ) : flipFlopType ? (
          <>
            {!flipFlopTextOnlyType && <img src="/dashboard-assets/icons/search-12.svg" alt="" className="home-search-console-toggle__flip-icon" />}
            <span className="home-search-console-toggle__text">{visibleLabelText}</span>
          </>
        ) : (
          <>
            {!hideIcon && <ThinkingIcon size={12} color="currentColor" />}
            {visibleLabelText}
          </>
        )}
        {defaultStyle === 'cap' && (
          <span className="home-search-console-toggle__close home-search-console-toggle__close--measure" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </span>
      <span className="home-search-console-toggle__label" style={{ fontSize }}>
        {textStringType ? (
          <>
            <span className="home-search-console-toggle__text">{visibleLabelText}</span>
            <span className={`home-search-console-toggle__keycap${active ? ' home-search-console-toggle__keycap--slash-only' : ''}`} aria-hidden="true">
              {!active && <span className="home-search-console-toggle__keycap-command">⌘</span>}
              <span className="home-search-console-toggle__keycap-slash">/</span>
            </span>
          </>
        ) : flipFlopType ? (
          <motion.span
            key={active ? 'flip-search' : 'flip-console'}
            className="home-search-console-toggle__flip-content"
            initial={{ opacity: 0.65, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0.1, 1] }}
          >
            {!flipFlopTextOnlyType && (
              <span className="home-search-console-toggle__flip-icon-wrap">
                {active ? (
                  <img src="/dashboard-assets/icons/search-12.svg" alt="" className="home-search-console-toggle__flip-icon" />
                ) : (
                  <ThinkingIcon size={12} color="currentColor" />
                )}
              </span>
            )}
            <span className="home-search-console-toggle__text">{visibleLabelText}</span>
          </motion.span>
        ) : toggleSwitchType ? (
          <span className="home-search-console-toggle__switch" aria-hidden="true">
            <motion.span
              className="home-search-console-toggle__switch-thumb"
              initial={false}
              animate={{ x: active ? 28 : 0 }}
              transition={{ type: 'spring', stiffness: 620, damping: 36, mass: 0.55 }}
            />
            <motion.span
              className="home-search-console-toggle__switch-icon home-search-console-toggle__switch-icon--search"
              initial={false}
              animate={{
                opacity: active ? 0.48 : 1,
                scale: active ? 0.94 : [1, 0.9, 1.08, 1],
                rotate: active ? 0 : [0, -8, 7, 0],
              }}
              transition={{ duration: active ? 0.16 : 0.28, ease: [0.2, 0, 0.1, 1] }}
            >
              <img src="/dashboard-assets/icons/search-12.svg" alt="" className="home-search-console-toggle__switch-search-icon" />
            </motion.span>
            <motion.span
              className="home-search-console-toggle__switch-icon home-search-console-toggle__switch-icon--console"
              initial={false}
              animate={{
                opacity: active ? 1 : 0.48,
                scale: active ? [1, 0.9, 1.08, 1] : 0.94,
                rotate: active ? [0, 8, -7, 0] : 0,
              }}
              transition={{ duration: active ? 0.28 : 0.16, ease: [0.2, 0, 0.1, 1] }}
            >
              <ThinkingIcon size={12} color="currentColor" />
            </motion.span>
          </span>
        ) : (
          <>
            {!hideIcon && (thinking ? <AnimatedThinkingIcon size={12} color="currentColor" /> : <ThinkingIcon size={12} color="currentColor" />)}
            {visibleLabelText}
          </>
        )}
        {defaultStyle === 'cap' && morphEnabled && !thinking && (
          <span className="home-search-console-toggle__close" aria-hidden="true">
            <CloseGlyph active={showExitAffordance} motionPreset={motionPreset} />
          </span>
        )}
      </span>
      {defaultStyle !== 'cap' && !toggleSwitchType && morphEnabled && !thinking && (
        <span className="home-search-console-toggle__close" aria-hidden="true">
          <CloseGlyph active={showExitAffordance} motionPreset={motionPreset} />
        </span>
      )}
    </button>
  )
}

/* ── Ask Console switch (More → Toggle) ─────────────────────────────────── */

function AskConsoleSwitch({ checked, label, showLabel = true, disabled, onToggle, onMeasure }) {
  const switchRef = useRef(null)

  // Observed rather than measured once, so the field's padding tracks the
  // label as it collapses instead of jumping to the end state.
  useLayoutEffect(() => {
    const el = switchRef.current
    if (!el) return
    const report = () => onMeasure(Math.ceil(el.getBoundingClientRect().width))
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [onMeasure])

  return (
    <button
      ref={switchRef}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`home-search-ask-console-switch${checked ? ' home-search-ask-console-switch--on' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        onToggle()
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <AnimatePresence initial={false}>
        {showLabel && (
          <motion.span
            key="ask-console-label"
            className="home-search-ask-console-switch__label"
            initial={{ opacity: 0, width: 0, marginRight: 0 }}
            animate={{ opacity: 1, width: 'auto', marginRight: 8 }}
            exit={{ opacity: 0, width: 0, marginRight: 0 }}
            transition={MODE_GHOST_TRANSITION}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="home-search-ask-console-switch__track" aria-hidden="true">
        <span className="home-search-ask-console-switch__thumb" />
      </span>
    </button>
  )
}

/* ── Shortcut hint (More → Keyboard shortcut) ───────────────────────────── */

/* Kept in step with the keyframes in dashboard.css. */
const SHIMMER_ANIMATION = 'home-search-hint-shimmer'
// The band runs twice per arrival, with a clear beat between so the two passes
// read as a deliberate pair rather than one long smear.
const SHIMMER_PASSES = 2
const SHIMMER_GAP_MS = 1500

function ShortcutHint({ label, keys, onMeasure, onActivate, asButton = false, showArrow = false, shimmer = false, shimmerGradient = false }) {
  const hintRef = useRef(null)
  // More → Emphasize text. Latched on the way in and released when the sweep
  // reports back, so it runs once per arrival rather than for as long as the
  // spotlight happens to be up.
  const [shimmering, setShimmering] = useState(false)
  // Which pass is running (1..SHIMMER_PASSES); 0 while at rest. Tracked on a ref
  // so the gap timer can read it without re-arming this effect.
  const passRef = useRef(0)
  const gapTimerRef = useRef(0)
  useEffect(() => {
    if (shimmer) {
      passRef.current = 1
      setShimmering(true)
    } else {
      passRef.current = 0
      clearTimeout(gapTimerRef.current)
      setShimmering(false)
    }
    return () => clearTimeout(gapTimerRef.current)
  }, [shimmer])
  const shimmerClass = (base) =>
    shimmering
      ? ` ${base}--shimmer${shimmerGradient ? ` ${base}--shimmer-gradient` : ''}`
      : ''

  useLayoutEffect(() => {
    const el = hintRef.current
    if (!el) return
    const report = () => {
      const box = el.getBoundingClientRect()
      onMeasure(Math.ceil(box.width))
      // The shimmer is drawn in the hint's own coordinate space rather than
      // each glyph's, which is what lets one band carry from the label through
      // to the keycap instead of restarting in the middle. CSS can't reach
      // across elements for either figure, so they are published here.
      el.style.setProperty('--shimmer-w', `${box.width}px`)
      const keys = el.querySelector('.home-search-shortcut-hint__keys')
      if (keys) {
        el.style.setProperty('--shimmer-keys-at', `${keys.getBoundingClientRect().left - box.left}px`)
      }
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [onMeasure])

  const content = (
    <>
      {/* The measure copy sets the slot width; the animated copies stack on top,
          right-aligned, so the keycap beside them never shifts. */}
      <span className="home-search-shortcut-hint__label">
        <span className="home-search-shortcut-hint__label-measure">{label}</span>
        <AnimatePresence initial={false}>
          <motion.span
            key={label}
            className={`home-search-shortcut-hint__label-text${shimmerClass('home-search-shortcut-hint__label-text')}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODE_GHOST_TRANSITION}
            // Named, because motion drives the opacity on this same element.
            onAnimationEnd={(e) => {
              if (e.animationName !== SHIMMER_ANIMATION) return
              // Drop the class so the band clears, then bring it back after the
              // gap for the next pass. Re-adding the class is what restarts the
              // animation, so the timer is the whole of the space between passes.
              setShimmering(false)
              if (passRef.current > 0 && passRef.current < SHIMMER_PASSES) {
                clearTimeout(gapTimerRef.current)
                gapTimerRef.current = setTimeout(() => {
                  passRef.current += 1
                  setShimmering(true)
                }, SHIMMER_GAP_MS)
              }
            }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
      {/* Decorative even when clickable — the label alone names the control. */}
      <span className="home-search-shortcut-hint__keys" aria-hidden="true">
        {/* More → Arrow on type. Both stay mounted and trade opacity in CSS, so
            this swap can take its own gentler time without dragging out the
            mode change the shortcut glyphs animate below. */}
        <span className={`home-search-shortcut-hint__keys-glyph${showArrow ? ' home-search-shortcut-hint__keys-glyph--stood-down' : ''}`}>
          <AnimatePresence initial={false}>
            <motion.span
              key={keys}
              className={`home-search-shortcut-hint__keys-text${shimmerClass('home-search-shortcut-hint__keys-text')}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MODE_GHOST_TRANSITION}
            >
              {keys}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className={`home-search-shortcut-hint__keys-arrow${showArrow ? ' home-search-shortcut-hint__keys-arrow--shown' : ''}`} />
      </span>
    </>
  )

  // More → Hidden button and Arrow on type both turn the whole hint into a real
  // control across label and keycap alike. Which of them is live depends on the
  // moment, so the element is settled up front and only its manners change —
  // swapping tags mid-swap would remount the crossfade and cut it short.
  if (asButton) {
    return (
      <button
        ref={hintRef}
        type="button"
        className={`home-search-shortcut-hint${onActivate ? ' home-search-shortcut-hint--button' : ''}`}
        // Between spells it steps out of the way entirely, as the span does.
        disabled={!onActivate}
        aria-hidden={onActivate ? undefined : 'true'}
        // Focus already lives in the field; taking it would close the popover.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onActivate}
      >
        {content}
      </button>
    )
  }

  return (
    <span ref={hintRef} className="home-search-shortcut-hint" aria-hidden="true">
      {content}
    </span>
  )
}

/* ── Spotlight (More → Show tooltip) ────────────────────────────────────── */

/* Dismissals last for the session only, keyed by input variant. */
const dismissedSpotlightTips = new Set()

const SPOTLIGHT_TIP_COPY = {
  title: 'A smarter way to search',
  body: 'Go beyond standard navigation and ask open-ended questions with Console.',
}

/* Paced off the band the card follows in: the sweep travels at an even rate, so
   this is even too, rather than the hard deceleration it used to run — that
   curve covers most of its ground immediately and then drifts the last of the
   way in, which is what read as the card arriving slowly. */
const SPOTLIGHT_TIP_TRANSITION = { duration: 0.2, ease: [0.3, 0.3, 0.7, 0.7] }

function SpotlightTip({ onDismiss }) {
  return (
    <motion.div
      className="home-search-spotlight-tip"
      role="status"
      /* y stays in the animated values because motion's inline transform would
         otherwise clobber the centering transform from CSS. */
      initial={{ opacity: 0, x: -6, y: '-50%' }}
      animate={{ opacity: 1, x: 0, y: '-50%' }}
      exit={{ opacity: 0, x: -4, y: '-50%' }}
      transition={SPOTLIGHT_TIP_TRANSITION}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Arrow is drawn open on its base so it merges with the card border. */}
      <svg className="home-search-spotlight-tip__arrow" width="9" height="18" viewBox="0 0 9 18" fill="none" aria-hidden="true">
        <path d="M9 18L1.03 9.71C0.64 9.31 0.64 8.69 1.03 8.29L9 0" fill="#FFFFFF" stroke="#D4DEE9" />
      </svg>
      <div className="home-search-spotlight-tip__header">
        <span className="home-search-spotlight-tip__title">{SPOTLIGHT_TIP_COPY.title}</span>
        <button
          type="button"
          className="home-search-spotlight-tip__close"
          aria-label="Dismiss"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onDismiss}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="home-search-spotlight-tip__body">{SPOTLIGHT_TIP_COPY.body}</p>
    </motion.div>
  )
}

/* ── Mode toggle (separate/toggle variant) ──────────────────────────────── */

function ModeToggle({ consoleMode, onToggle }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onToggle() }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: 52,
        height: 24,
        borderRadius: 12,
        background: '#E8ECF1',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        outline: 'none',
      }}
    >
      {/* Sliding thumb */}
      <div style={{
        position: 'absolute',
        top: 2,
        left: consoleMode ? 28 : 2,
        width: 22,
        height: 20,
        borderRadius: 10,
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'left 180ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        pointerEvents: 'none',
      }} />
      {/* Search icon */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <circle cx="5" cy="5" r="3.2" stroke={consoleMode ? '#B0BAC8' : '#353A44'} strokeWidth="1.3"/>
          <path d="M7.8 7.8L10 10" stroke={consoleMode ? '#B0BAC8' : '#353A44'} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>
      {/* AI/sparkle icon */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.2 4.8H11L7.9 7L9.1 10.8L6 8.6L2.9 10.8L4.1 7L1 4.8H4.8L6 1Z" stroke={consoleMode ? '#533AFD' : '#B0BAC8'} strokeWidth="1.1" fill={consoleMode ? '#533AFD' : 'none'} strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  )
}

export default function DashboardHomeSearch({ compact = false, stickyActive = false, fixedMode = null }) {
  const prototype = usePrototype()
  const aiSearch = fixedMode ? 'separate' : prototype.aiSearch
  const tabStyle = fixedMode ? 'fixed' : prototype.tabStyle
  const searchControls = useSearchPrototypeControls()
  const activeBorderRadius = compact || stickyActive
    ? searchControls.stickyBorderRadius
    : searchControls.nonStickyBorderRadius
  const [homeInputOption] = useHomeInputOption()
  const [persistToggleLabel] = usePersistToggleLabel()
  const [toggleAutoFocus] = useToggleAutoFocus()
  const [showTooltip] = useShowTooltip(homeInputOption)
  const [blurpleLilacFocus] = useBlurpleLilacFocus(homeInputOption)
  const [refreshGradient] = useRefreshGradient(homeInputOption)
  const [growGradient] = useGrowGradient(homeInputOption)
  const [traceCursor] = useTraceCursor(homeInputOption)
  const [blurpleTrace] = useBlurpleTrace(homeInputOption)
  const [blurplePersistTrace] = useBlurplePersistTrace(homeInputOption)
  // The hint always doubles as a hidden button into Console; there is no longer
  // a control to switch it off.
  const hiddenButton = true
  const [typeArrow] = useTypeArrow(homeInputOption)
  const [emphasizeText] = useEmphasizeText(homeInputOption)
  const [emphasizeGradient] = useEmphasizeGradient(homeInputOption)
  const isButtonOption = homeInputOption === 'button'
  const isToggleOption = homeInputOption === 'toggle'
  const isShortcutOption = homeInputOption === 'shortcut'
  // Hero field only. `stickyActive` tracks the scroll, so the callout fades out
  // as the field shrinks away and fades back in when it returns to full size.
  // Emphasize text rides the same moment, hence the split: the two are one
  // announcement, and either switch can carry it alone.
  const spotlightMoment = !fixedMode && !compact
    && !stickyActive
    && (isToggleOption || isShortcutOption)
    && !dismissedSpotlightTips.has(homeInputOption)
  const navigate = useNavigate()
  const location = useLocation()
  const prototypeView = new URLSearchParams(location.search).get('prototypeView')
  const searchUiLanguage = prototypeView === 'search' ? searchControls.uiLanguage : 'en'
  const ui = SEARCH_UI_COPY[searchUiLanguage] || SEARCH_UI_COPY.en
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [switchableConsoleMode, setConsoleMode] = useState(false)
  const consoleMode = fixedMode ? fixedMode === 'console' : switchableConsoleMode
  const [settledSearch, setSettledSearch] = useState({ query: '', consoleMode: false })
  const loading = !!query.trim() && (settledSearch.query !== query || settledSearch.consoleMode !== consoleMode)
  const resolvedQuery = !query.trim() ? '' : consoleMode ? settledSearch.query : query
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [plusOpen, setPlusOpen] = useState(false)
  const [plusChip, setPlusChip] = useState(null)
  const [plusChipExiting, setPlusChipExiting] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [inputHovered, setInputHovered] = useState(false)
  const [promptDay, setPromptDay] = useState(localDayKey)
  const dailyPrompts = useMemo(() => getDailyConsolePrompts(promptDay), [promptDay])
  useEffect(() => {
    if (fixedMode !== 'console' || open || inputFocused || query) return
    let timer
    const refresh = () => {
      setPromptDay(localDayKey())
      clearTimeout(timer)
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(refresh, midnight - now + 50)
    }
    refresh()
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [fixedMode, open, inputFocused, query])
  const [hintHovered, setHintHovered] = useState(false)
  const [launchThinking, setLaunchThinking] = useState(false)
  const [spotlightBannerDismissed, setSpotlightBannerDismissed] = useState(false)
  const [spotlightDismissing, setSpotlightDismissing] = useState(false)
  const [askSwitchWidth, setAskSwitchWidth] = useState(0)
  const [shortcutHintWidth, setShortcutHintWidth] = useState(0)
  // The retired set is the source of truth; this only forces the re-render.
  const [, setTipRetired] = useState(0)
  const [spotlightHeight, setSpotlightHeight] = useState(null)
  const [spotlightModeShifting, setSpotlightModeShifting] = useState(false)
  const spotlightMeasureRef = useRef(null)
  const spotlightDismissTimerRef = useRef(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownContentRef = useRef(null)
  const placeholderTimerRef = useRef(null)
  const launchTimerRef = useRef(null)
  const heroPromptModeRef = useRef(false)

  useEffect(() => {
    return () => clearTimeout(launchTimerRef.current)
  }, [])

  // Held until the page has actually finished loading, then a beat longer, so
  // the callout arrives to a settled dashboard instead of racing it.
  const [pageSettled, setPageSettled] = useState(false)
  useEffect(() => {
    let settle = 0
    const start = () => { settle = window.setTimeout(() => setPageSettled(true), SPOTLIGHT_SETTLE_MS) }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      window.removeEventListener('load', start)
      clearTimeout(settle)
    }
  }, [])

  // With Emphasize on, the band and the card are one sequence rather than two
  // things that happen to land together: the purple crosses the label, carries
  // on through the keycap, and only then does the card come in behind it. The
  // wait re-arms every time the field returns to full size, since the band
  // replays too and the card should still be following it.
  const announcing = spotlightMoment && pageSettled
  // Either take on the shimmer arms the same choreography; the kind only
  // decides which band the hint paints.
  const emphasize = emphasizeText || emphasizeGradient
  // The shimmer is a one-time welcome: it plays its passes on the first hero
  // view and is then spent. Returning to search from Console brings the field
  // back to full size, but the band does not replay.
  const [shimmerConsumed, setShimmerConsumed] = useState(false)
  const emphasisSweeping = announcing && emphasize && !consoleMode && !shimmerConsumed
  useEffect(() => {
    if (!emphasisSweeping) return undefined
    // Spend it as the announcement ends — the user moving into Console or
    // scrolling the field away — so it cannot arm a second time.
    return () => setShimmerConsumed(true)
  }, [emphasisSweeping])
  const [sweepCleared, setSweepCleared] = useState(false)
  useEffect(() => {
    if (!emphasisSweeping) {
      setSweepCleared(false)
      return undefined
    }
    const done = window.setTimeout(
      () => setSweepCleared(true),
      SHIMMER_DURATION_MS * SHIMMER_HANDOFF,
    )
    return () => clearTimeout(done)
  }, [emphasisSweeping])
  const spotlightTipVisible = announcing && showTooltip && (!emphasisSweeping || sweepCleared)

  useEffect(() => {
    heroPromptModeRef.current = consoleMode && !compact
  }, [consoleMode, compact])


  // Reset console mode and plus state when variant changes
  useEffect(() => {
    if (aiSearch !== 'separate') setConsoleMode(false)
    if (aiSearch !== 'plus') { setPlusChip(null); setPlusOpen(false); setPlusChipExiting(null) }
  }, [aiSearch])

  // Reset selection with its inputs so an old row is never focused for a frame.
  const [focusContext, setFocusContext] = useState({ query, open })
  if (focusContext.query !== query || focusContext.open !== open) {
    setFocusContext({ query, open })
    setFocusedIdx(-1)
  }

  function getConsolePath() {
    const params = new URLSearchParams(location.search)
    syncPrototypeSidebarParam(params)
    params.delete('consoleEntry')
    params.delete('returnTo')

    if (location.pathname !== '/' && location.pathname !== '/onsite-home') {
      const sanitizedSearch = params.toString()
      params.set('returnTo', `${location.pathname}${sanitizedSearch ? `?${sanitizedSearch}` : ''}${location.hash || ''}`)
      params.set('consoleEntry', 'search')
    }

    const queryString = params.toString()
    return `/console${queryString ? `?${queryString}` : ''}`
  }

  // Apply focus highlight + data-focused marker to the right item after each render
  useLayoutEffect(() => {
    if (!dropdownContentRef.current) return
    const items = [...dropdownContentRef.current.querySelectorAll('[data-item]')]
    items.forEach((el, i) => {
      const active = i === focusedIdx
      el.style.background = active ? '#F4F7FA' : ''
      el.dataset.focused = active ? 'true' : ''
      if (active) el.scrollIntoView({ block: 'nearest' })
    })
  }, [focusedIdx, open, loading, query, resolvedQuery])

  // Rotate active helper text while the input is engaged.
  useEffect(() => {
    clearInterval(placeholderTimerRef.current)
    setPlaceholderIdx(0)
    const shouldRotate = !fixedMode && !query && (open || inputFocused) && searchControls.activeRotationEnabled
    if (!shouldRotate) return
    const items = consoleMode
      ? (aiSearch === 'plus' && plusChip === 'act' ? ACT_PLACEHOLDERS : CONSOLE_PLACEHOLDERS)
      : SEARCH_PLACEHOLDERS
    placeholderTimerRef.current = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % items.length)
    }, 2600)
    return () => clearInterval(placeholderTimerRef.current)
  }, [
    open,
    inputFocused,
    aiSearch,
    consoleMode,
    plusChip,
    query,
    searchControls.activeRotationEnabled,
    fixedMode,
  ])

  // One timer owns result settling. Derive loading immediately from the query
  // instead of cascading loading/resolution updates through two effects.
  useEffect(() => {
    if (!query.trim()) return
    const timer = setTimeout(() => setSettledSearch({ query, consoleMode }), consoleMode ? 500 : 160)
    return () => clearTimeout(timer)
  }, [query, consoleMode])

  const filteredResults = useMemo(() => getFilteredResults(query), [query])
  const matchingFilters = useMemo(() => getMatchingFilters(query), [query])
  // Use resolvedQuery for console scoring so score only updates after debounce settles
  const { score: consoleScore } = useMemo(() => getConsolePrompts(resolvedQuery), [resolvedQuery])
  const isFilterMode = useMemo(
    () => Object.keys(FILTER_VALUES).some((prefix) => query.startsWith(prefix)),
    [query]
  )

  const hasQuery = query.trim().length > 0
  // The arrow is a nudge toward Console, so it only shows for the kind of query
  // Console is for: a natural-language phrase (2+ spaces), and never for a
  // structured search that carries a `key:value` filter like `is:customer` or
  // `date:...`, which belongs in Search.
  const looksLikeConsoleQuery = (value) => {
    if (/[a-z][\w-]*:/i.test(value)) return false
    return value.trim().split(/\s+/).filter(Boolean).length >= 3
  }
  // Search side only — in Console the hint is the user's way back out.
  const shortcutArrowShowing = typeArrow && !consoleMode && hasQuery && looksLikeConsoleQuery(query)
  const heroExpanded = !compact && open && !plusOpen
  const inputActive = open || inputFocused
  // The toggle variant carries its mode on the switch, so the console hint
  // holds even when the field is idle (auto-focus off flips mode in place).
  const modeHintActive = inputActive || (isToggleOption && consoleMode)
  // Two focus treatments, offered to both the toggle and the shortcut. They are
  // held apart at the store (one outline, one colour), so this only breaks the
  // tie a hand-written link could still arrive with.
  const focusTintEligible = isToggleOption || isShortcutOption
  // Trace cursor is the default-on tint, so it sits LAST here as the fallback:
  // any tint a link turns on explicitly wins over it (the group is only made
  // exclusive at toggle-time, so a URL that names another tint doesn't also turn
  // Trace cursor off). With nothing else on, Trace cursor is the outline — the
  // decided default: the refresh swirl announces, fades to grey, then the
  // refresh-coloured pool follows the cursor.
  const focusTint = focusTintEligible && growGradient
    ? 'refreshGrow'
    : focusTintEligible && blurpleTrace
      ? 'blurpleTrace'
      : focusTintEligible && blurplePersistTrace
        ? 'blurplePersistTrace'
        : focusTintEligible && blurpleLilacFocus
          ? 'blurpleLilac'
          : focusTintEligible && refreshGradient
            ? 'refreshGradient'
            : focusTintEligible && traceCursor
              ? 'refreshTrace'
              : null
  const focusTintActive = !!focusTint && consoleMode && (!fixedMode || inputActive || launchThinking)
  // Leaving Console crossfades the outline off rather than dropping it, which
  // means the overlay has to outlive the state that put it there. It keeps its
  // own tint too, so turning the switch off mid-Console still fades out in the
  // colour that was actually on screen.
  const [swirl, setSwirl] = useState(null)
  const tintColors = FOCUS_TINTS[swirl?.tint ?? focusTint] ?? FOCUS_TINTS.blurpleLilac
  const swirlRef = useRef(null)

  useEffect(() => {
    if (focusTintActive) {
      setSwirl({ tint: focusTint, phase: 'in' })
      return undefined
    }
    // Only something already drawn has anything to unwind. Written so a repeat
    // pass leaves an unwind already under way alone rather than cutting it.
    let live = true
    setSwirl((current) => {
      if (!current) return null
      return current.phase === 'out' ? current : { ...current, phase: 'out' }
    })
    const done = setTimeout(() => { if (live) setSwirl(null) }, SWIRL_EXIT_MS)
    return () => { live = false; clearTimeout(done) }
  }, [focusTintActive, focusTint])
  // Colons from useId are legal in an id but awkward inside a url() reference.
  const swirlId = useId().replace(/:/g, '')
  const swirlGradientId = `swirl-pool-${swirlId}`
  const sweepGradientId = `swirl-sweep-${swirlId}`

  // Draws the purple on clockwise once per arrival. Dash offsets are measured
  // along the outline so the front travels at an even rate at any field width;
  // the length has to be read off the rect because Chrome ignores `pathLength`
  // on basic shapes.
  //
  // Only the arrival is drawn. Leaving is a crossfade handled in CSS, so this
  // deliberately keys off the tint alone: were it to re-run when the phase turns,
  // the cleanup would cancel these mid-flight and snap the outline to full before
  // the fade had started.
  useLayoutEffect(() => {
    const svg = swirlRef.current
    if (!svg || swirl?.phase !== 'in') return undefined
    const sweep = svg.querySelector('.home-search-bar__swirl-sweep')
    const head = svg.querySelector('.home-search-bar__swirl-head')
    const length = sweep?.getTotalLength() ?? 0
    if (!length) return undefined

    sweep.style.strokeDasharray = `${length} ${length}`
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sweep.style.strokeDashoffset = '0'
      return undefined
    }

    // The refresh tints keep their blue-pink-orange gradient fixed on the sweep;
    // the "grey then colour" reading comes from a grey cap leading the draw
    // rather than from recolouring the stops over time (which read as an abrupt
    // recolour). The head is that cap — recoloured to the field's grey in CSS —
    // so the newest-drawn edge is grey and the gradient trails out behind it.
    // It runs long (so there's grey "for a bit"), rides the front the whole way
    // round, and lifts as it lands, so once the swirl has looped the field is the
    // full gradient with the grey hidden — until leaving fades it back to grey.
    const isRefresh = SWIRL_REFRESH_TINTS.has(swirl.tint)
    const headLength = length * (isRefresh ? SWIRL_HEAD_RATIO_REFRESH : SWIRL_HEAD_RATIO)
    head.style.strokeDasharray = `${headLength} ${length - headLength}`
    const timing = { duration: SWIRL_DURATION_MS, easing: SWIRL_EASING, fill: 'forwards' }
    const sweepAnimation = sweep.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], timing)
    const running = [
      sweepAnimation,
      // The colour materialises onto the field rather than snapping on. The
      // refresh tints ride a single unbroken ramp that reaches full strength at
      // the instant the ring closes, so the draw, the grey→colour morph and the
      // arrival at full all land together and read as one motion. Other tints
      // keep the simple ease-in-from-transparent. No fill, so the sweep returns
      // to its resting opacity (which the settled fade-to-grey still owns) once
      // this is done.
      sweep.animate(
        isRefresh
          ? [
              // One continuous climb that ARRIVES at full exactly as the head
              // meets the tail, so coming to full strength and closing the loop
              // are the same moment rather than two. There is no plateau: it
              // rises quickly to about half (soft enough to sit with the grey
              // border and the grey cap while the colour is still morphing in),
              // then gains the rest gradually across the back half. Spreading
              // that last stretch over half the draw is what keeps the arrival
              // fluid — the earlier version front-loaded it and the completion
              // read as a separate event.
              { opacity: 0, offset: 0, easing: 'cubic-bezier(0.33, 0, 0.67, 1)' },
              { opacity: 0.46, offset: 0.12, easing: 'cubic-bezier(0.4, 0, 0.5, 1)' },
              { opacity: 0.74, offset: 0.5, easing: 'cubic-bezier(0.4, 0, 0.5, 1)' },
              { opacity: 1, offset: 1 },
            ]
          : [{ opacity: 0 }, { opacity: 1 }],
        isRefresh
          ? { duration: SWIRL_DURATION_MS, easing: 'linear' }
          : { duration: SWIRL_DURATION_MS * SWIRL_FADE_IN_RATIO, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      ),
      head.animate([{ strokeDashoffset: headLength }, { strokeDashoffset: headLength - length }], timing),
      // The grey cap holds full while it rides the front, then lifts over the
      // last stretch so the gradient it was trailing is all that's left. The
      // brighter sheen tints (blurple etc.) keep their fade-in-and-out sheen.
      head.animate(
        isRefresh
          ? [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.66 }, { opacity: 0, offset: 1 }]
          : [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 1, offset: 0.72 }, { opacity: 0 }],
        { duration: SWIRL_DURATION_MS, easing: 'linear', fill: 'forwards' },
      ),
    ]

    // Refresh tints draw wearing Line 2997 (grey start → colour) and morph to the
    // pure brand gradient (3857-197614) as they go. Crucially the morph runs
    // CONCURRENT with the draw and lands exactly as the loop closes — the grey
    // holds through the opening ~40% (so the line still "begins" grey) then eases
    // to colour over the back stretch. Doing it during the draw rather than on
    // settle is what removes the jump: by the time the ring is whole it is
    // already the pure gradient, so nothing recolours after the loop completes.
    if (isRefresh) {
      const greyStop = svg.querySelector('.home-search-bar__swirl-sweep-grey')
      const leadStop = svg.querySelector('.home-search-bar__swirl-sweep-lead')
      const midStop = svg.querySelector('.home-search-bar__swirl-sweep-mid')
      const morph = { duration: SWIRL_DURATION_MS, easing: 'linear', fill: 'forwards' }
      const hold = 0.42
      const morphEase = 'cubic-bezier(0.4, 0, 0.2, 1)'
      if (greyStop) {
        running.push(greyStop.animate(
          [{ stopColor: '#D4DEE9', offset: 0 }, { stopColor: '#D4DEE9', offset: hold, easing: morphEase }, { stopColor: '#533AFD', offset: 1 }],
          morph,
        ))
      }
      if (leadStop) {
        running.push(leadStop.animate(
          [{ stopColor: '#533AFD', offset: 0 }, { stopColor: '#533AFD', offset: hold, easing: morphEase }, { stopColor: '#F44BCC', offset: 1 }],
          morph,
        ))
      }
      if (midStop) {
        running.push(midStop.animate(
          [{ stopColor: '#F44BCC', offset: 0 }, { stopColor: '#F44BCC', offset: hold, easing: morphEase }, { stopColor: '#FA5672', offset: 1 }],
          morph,
        ))
      }
    }
    // Drop the dash once it has settled. The length was measured at this width,
    // so holding it would open a gap in the outline if the field later grows
    // (scrolling back up to the hero), and a plain stroke fits any size. Landing
    // is also where blurple-to-lilac hands over, so it is marked on the state
    // rather than the node: the field's own border follows the same change.
    sweepAnimation.finished
      .then(() => {
        sweep.style.strokeDasharray = 'none'
        setSwirl((current) => {
          // Nothing to hand over to if it has already been dismissed, and an
          // outline on its way out should fade in the colour it is wearing
          // rather than changing hue mid-fade.
          if (!current || current.settled || current.phase !== 'in') return current
          return { ...current, settled: true }
        })
      })
      .catch(() => {})

    return () => running.forEach((animation) => animation.cancel())
    // Swapping tints while Console is up re-runs the sweep, so the new colour
    // arrives the same way the first one did rather than cutting over in place.
  }, [swirl?.tint])

  // Pools the deeper purple at one point on the outline, fading back to the base
  // colour with distance. That point rides the end of what has been typed, so
  // the outline reacts to the query taking shape. Driven by moving the
  // gradient's centre rather than React state, so tracking costs no renders.
  useEffect(() => {
    const svg = swirlRef.current
    // Keyed to the overlay's own state rather than the mode, since the overlay
    // mounts a render later than the mode changes and there would be nothing to
    // attach to yet. An outline on its way out has stopped tracking anything.
    if (!svg || swirl?.phase !== 'in') return undefined
    // Grow on type answers the query with a growing arc, not a trailing pool.
    if (swirl?.tint === 'refreshGrow') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const pool = svg.querySelector('.home-search-bar__swirl-pool')
    const gradient = svg.querySelector('.home-search-bar__swirl-gradient')
    if (!pool || !gradient) return undefined

    let current = null
    let frame = 0
    let revealed = false
    let lit = false
    let idle = 0
    // Whether anything has actually asked for the pool yet. The pool answers
    // typing, so an untouched field should not be wearing one.
    let nudged = false

    const paint = () => {
      gradient.setAttribute('cx', String(current.x))
      gradient.setAttribute('cy', String(current.y))
      // Trace cursor squashes the glow in y so it runs along the edge nearest
      // the pointer instead of reaching across to the opposite one. Scaled
      // about the pointer's own y so the centre stays put as it moves.
      if (tracksPointer) {
        gradient.setAttribute(
          'gradientTransform',
          `translate(0 ${current.y}) scale(1 ${SWIRL_POINTER_VSQUISH}) translate(0 ${-current.y})`,
        )
      }
    }

    // Measured on a canvas rather than a mirror element so the reading costs no
    // layout. The context is reused; only the font is re-read, since the field
    // changes type size between its hero and compact states.
    let ruler = null
    const textWidth = (value, style) => {
      if (!ruler) ruler = document.createElement('canvas').getContext('2d')
      ruler.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      return ruler.measureText(value).width
    }

    // Where the typed text currently ends, in the overlay's own space. Clamped to
    // the field so a query long enough to scroll the input keeps the pool at the
    // edge instead of pushing it off the end of the outline.
    const textTarget = () => {
      const input = inputRef.current
      if (!input) return null
      const box = svg.getBoundingClientRect()
      const rect = input.getBoundingClientRect()
      const style = getComputedStyle(input)
      const start = rect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft)
      const end = start + textWidth(input.value, style) - input.scrollLeft
      return {
        x: Math.min(Math.max(end, rect.left), rect.right) - box.left,
        y: rect.top + rect.height / 2 - box.top,
      }
    }

    // Trace cursor (either palette) follows the pointer around the field; the
    // other tints ride the typed text. lastPointer is kept fresh by the listener
    // below.
    const tracksPointer =
      swirl?.tint === 'refreshTrace' ||
      swirl?.tint === 'blurpleTrace' ||
      swirl?.tint === 'blurplePersistTrace'
    let lastPointer = null
    const pointerTarget = () => {
      if (!lastPointer) return null
      const box = svg.getBoundingClientRect()
      // Clamped to the field, so the glow rides the nearest outline rather than
      // wandering off when the cursor strays past an edge.
      return {
        x: Math.min(Math.max(lastPointer.x, box.left), box.right) - box.left,
        y: Math.min(Math.max(lastPointer.y, box.top), box.bottom) - box.top,
      }
    }

    // Resolved against the live box rather than cached, since the field moves and
    // resizes underneath it.
    const localTarget = () => (tracksPointer ? pointerTarget() : textTarget())

    const step = () => {
      frame = 0
      const target = current && localTarget()
      if (!target) return
      current.x += (target.x - current.x) * SWIRL_POINTER_EASE
      current.y += (target.y - current.y) * SWIRL_POINTER_EASE
      paint()
      // Idle out once it has caught up, rather than holding a frame loop open.
      if (Math.hypot(target.x - current.x, target.y - current.y) > 0.4) {
        frame = requestAnimationFrame(step)
      }
    }

    // The pool belongs to something in motion, so it recedes once that rests —
    // a cursor that has stopped, or a query that has stopped growing.
    const dim = () => {
      lit = false
      pool.classList.remove('home-search-bar__swirl-pool--lit')
    }

    const light = () => {
      if (!revealed) return
      if (!lit) {
        // Coming back from a fade-out: put it where the action is rather than
        // easing in from wherever it went quiet.
        const target = localTarget()
        if (!target) return
        current = target
        paint()
        lit = true
        pool.classList.add('home-search-bar__swirl-pool--lit')
      }
      // Trace cursor holds as long as the pointer stays on the border; its fade
      // is driven by leaving the band, not by going still. The text-following
      // pools recede once typing pauses, so they keep the idle timer.
      if (tracksPointer) return
      clearTimeout(idle)
      idle = setTimeout(dim, SWIRL_POINTER_IDLE_MS)
    }

    // Take the first reading outright, since easing in from a stale spot would
    // send the pool sliding across the field.
    const track = () => {
      nudged = true
      if (!current) {
        const target = localTarget()
        if (!target) return
        current = target
        paint()
      }
      light()
      if (!frame) frame = requestAnimationFrame(step)
    }

    // Scrolling slides and resizes the field under whatever the pool is holding
    // onto, so it has to be re-solved against the new box. Snapped rather than
    // eased: nothing has actually moved relative to the field, and easing would
    // smear the pool along the outline for the length of the scroll.
    const handleScroll = () => {
      if (!current) return
      const target = localTarget()
      if (!target) return
      current = target
      paint()
    }

    // Held back until the sweep has laid the base colour down, so the pool
    // never darkens outline that has not been drawn yet.
    const reveal = setTimeout(() => {
      revealed = true
      // Typing or moving during the sweep still earns the pool; it just had to
      // wait for there to be an outline to darken.
      if (nudged) light()
    }, SWIRL_DURATION_MS)

    const input = inputRef.current
    const bar = svg.closest('.home-search-bar')
    // The hint ("Search /" / "Ask Console") and the toggle switch sit right on
    // the field's edge, so hovering them would otherwise light the corner. They
    // are their own controls, so the trace treats them as off-limits.
    const overControl = (e) => {
      const controls = bar?.querySelectorAll(
        '.home-search-shortcut-hint, .home-search-ask-console-switch',
      )
      if (!controls) return false
      for (const el of controls) {
        const r = el.getBoundingClientRect()
        if (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          return true
        }
      }
      return false
    }
    const handlePointerMove = (e) => {
      lastPointer = { x: e.clientX, y: e.clientY }
      // The hint and switch are their own hit targets; over them the trace stays
      // dark rather than flaring the corner they sit in.
      if (overControl(e)) {
        dim()
        return
      }
      // Keep the glow lit only while the pointer hugs an edge. Once it strays
      // into the body of the field the highlight recedes, and it comes back the
      // moment the pointer returns to the border — no idle timeout involved.
      const box = svg.getBoundingClientRect()
      const inside =
        e.clientX >= box.left &&
        e.clientX <= box.right &&
        e.clientY >= box.top &&
        e.clientY <= box.bottom
      const edgeGap = Math.min(
        e.clientX - box.left,
        box.right - e.clientX,
        e.clientY - box.top,
        box.bottom - e.clientY,
      )
      if (inside && edgeGap <= SWIRL_BORDER_BAND) {
        track()
      } else {
        dim()
      }
    }
    // Leaving the field lets the pool recede, the same as a cursor going still.
    const handlePointerLeave = () => { clearTimeout(idle); dim() }

    if (tracksPointer) {
      bar?.addEventListener('pointermove', handlePointerMove)
      bar?.addEventListener('pointerleave', handlePointerLeave)
    } else {
      input?.addEventListener('input', track)
      // Parked at the end of whatever is already in the field, so arriving in
      // Console with a query in hand does not start the pool from the far left.
      current = textTarget()
      if (current) paint()
    }
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => {
      input?.removeEventListener('input', track)
      bar?.removeEventListener('pointermove', handlePointerMove)
      bar?.removeEventListener('pointerleave', handlePointerLeave)
      document.removeEventListener('scroll', handleScroll, { capture: true })
      clearTimeout(reveal)
      clearTimeout(idle)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [swirl?.phase, swirl?.tint])

  // Dynamic type: after the announcement fades to grey, two colour arcs grow
  // from the field's left edge and sweep the top and bottom in concert, meeting
  // at the right as the query fills. Their reveal is driven by the dash offset
  // rather than React state, so it costs no renders; the ease lives on the CSS
  // transition. Layout effect so the arcs' initial (empty) length is in place
  // before paint, rather than flashing a full ring for a frame.
  useLayoutEffect(() => {
    const svg = swirlRef.current
    if (!svg || swirl?.phase !== 'in' || swirl?.tint !== 'refreshGrow') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const top = svg.querySelector('.home-search-bar__swirl-grow--top')
    const bottom = svg.querySelector('.home-search-bar__swirl-grow--bottom')
    if (!top || !bottom) return undefined

    // The colour answers typing directly: one character is one tenth of the ring,
    // so the arcs close completely once the query reaches this many characters
    // (spaces counted). A fixed count rather than a measured width keeps the fill
    // predictable and identical between the hero and compact type sizes.
    const FILL_AT_CHARS = 10

    // How full the arcs are, 0..1 — driven by how much has been typed.
    const fraction = () => {
      const input = inputRef.current
      if (!input) return 0
      return Math.min(input.value.length / FILL_AT_CHARS, 1)
    }

    // The two half-perimeter paths, from the left-middle to the right-middle:
    // one over the top, one under the bottom. Rebuilt from the live box since
    // the field moves and resizes (hero ↔ compact) underneath the overlay.
    const geometry = () => {
      const w = parseFloat(getComputedStyle(svg).getPropertyValue('--swirl-weight')) || 1
      const W = svg.clientWidth
      const H = svg.clientHeight
      if (!W || !H) return null
      const x = w / 2
      const y = w / 2
      const right = W - w / 2
      const foot = H - w / 2
      const midY = H / 2
      const r = Math.max(0, Math.min(activeBorderRadius - w / 2, (foot - y) / 2, (right - x) / 2))
      // sweep flag 1 (clockwise) carries the top over the corners; 0 carries the
      // bottom under them, so both open outward from the left edge.
      const topD = `M ${x} ${midY} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} `
        + `L ${right - r} ${y} A ${r} ${r} 0 0 1 ${right} ${y + r} L ${right} ${midY}`
      const bottomD = `M ${x} ${midY} L ${x} ${foot - r} A ${r} ${r} 0 0 0 ${x + r} ${foot} `
        + `L ${right - r} ${foot} A ${r} ${r} 0 0 0 ${right} ${foot - r} L ${right} ${midY}`
      return { topD, bottomD }
    }

    // Until the announcement swirl has landed and faded, the arcs stay fully
    // retracted with their easing suppressed — so the intro reads as the exact
    // same clockwise sweep the persistent gradient plays, with nothing of the
    // grow arcs flashing or retracting over the top of it. Only once settled do
    // they pick up the query and ease open.
    const settled = !!swirl?.settled

    const draw = (animate) => {
      const geo = geometry()
      if (!geo) return
      top.setAttribute('d', geo.topD)
      bottom.setAttribute('d', geo.bottomD)
      const f = settled ? fraction() : 0
      for (const path of [top, bottom]) {
        const len = path.getTotalLength?.() ?? 0
        if (!len) continue
        if (!animate) path.style.transition = 'none'
        path.style.strokeDasharray = String(len)
        path.style.strokeDashoffset = String(len * (1 - f))
        if (!animate) {
          // Flush the retracted state so restoring the transition below does not
          // animate this first placement — the grow should only ease on typing.
          void path.getBoundingClientRect()
          path.style.transition = ''
        }
      }
    }

    // First placement never animates; before settling it also stays hidden.
    draw(false)
    if (!settled) return undefined

    const apply = () => draw(true)
    const input = inputRef.current
    input?.addEventListener('input', apply)
    document.addEventListener('scroll', apply, { capture: true, passive: true })
    const observer = new ResizeObserver(apply)
    observer.observe(svg)
    return () => {
      input?.removeEventListener('input', apply)
      document.removeEventListener('scroll', apply, { capture: true })
      observer.disconnect()
    }
  }, [swirl?.phase, swirl?.tint, swirl?.settled, activeBorderRadius])
  // Applied inline because the hero, anchored, and sticky states each pin their
  // own border and shadow, and this treatment should hold across all of them.
  // Dropped the moment Console is left. The border underneath is covered by the
  // overlay's opaque grey track for the whole crossfade, so it goes back out of
  // sight and is already grey by the time the overlay lifts.
  const focusTintStyle = focusTintActive
    ? { borderColor: tintColors.border, boxShadow: FOCUS_TINT_SHADOW }
    : null
  const showRotatingPlaceholder = !fixedMode && !hasQuery && inputActive && searchControls.activeRotationEnabled
  const showPromptGhost = !fixedMode && !hasQuery && modeHintActive && consoleMode && !compact && !showRotatingPlaceholder
  const showSearchGhost = !fixedMode && !hasQuery && inputActive && !consoleMode && !compact && !showRotatingPlaceholder && !(aiSearch === 'separate' && tabStyle === 'toggle-l')
  const showDailyPrompt = fixedMode === 'console' && !query && !inputActive
  const iconOnlyButtonSearchCopy = ['toggle', 'outline-button', 'outline-button-right'].includes(searchControls.buttonStyleDefault)
    ? 'Search Rocketrides'
    : null
  const placeholderDefault = iconOnlyButtonSearchCopy || (searchUiLanguage === 'en' ? searchControls.placeholderDefault : ui.defaultPlaceholder)
  const searchPlaceholder = iconOnlyButtonSearchCopy || (searchUiLanguage === 'en' ? searchControls.searchPlaceholder : ui.searchPlaceholder)
  // With the label persisting on the switch, the hint avoids repeating it.
  const consolePlaceholder = isToggleOption && persistToggleLabel
    ? ui.persistedLabelPlaceholder
    : (searchUiLanguage === 'en' ? searchControls.consolePlaceholder : ui.consolePlaceholder)
  const inputPlaceholder = fixedMode ? (consoleMode ? 'Ask Console' : ui.searchPlaceholder) : modeHintActive
    ? (consoleMode ? consolePlaceholder : searchPlaceholder)
    : placeholderDefault

  const activeBorderRadiusPx = `${activeBorderRadius}px`
  const spotlightPopoverRadiusPx = '8px'
  const activeIcon = consoleMode
    ? searchControls.activeConsoleIcon
    : open
      ? searchControls.activeSearchIcon
      : searchControls.defaultIcon

  function enterPromptMode({ autoFocus = true } = {}) {
    if (fixedMode === 'search') return
    cancelSpotlightDismiss()
    setConsoleMode(true)
    setPlusOpen(false)
    // Without auto-focus the mode flips in place; suggestions wait for a click.
    if (!autoFocus) return
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function enterSearchMode() {
    if (fixedMode === 'console') return
    cancelSpotlightDismiss()
    setConsoleMode(false)
    setOpen(true)
    setPlusOpen(false)
    setFocusedIdx(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  useEffect(() => {
    if (fixedMode === 'console' || (compact && !fixedMode)) return

    function isTypingTarget(target) {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      return target.isContentEditable
    }

    function handleKeyDown(e) {
      if (e.key !== '/' || e.repeat) return
      // ⌘/ is the mode switch, so it has to work from inside our own field too.
      const inOwnInput = e.target === inputRef.current
      if (isTypingTarget(e.target) && !inOwnInput) return

      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        if (fixedMode === 'search') {
          enterSearchMode()
          return
        }
        if (consoleMode) {
          exitPromptMode({ keepSpotlightOpen: open })
        } else {
          enterPromptMode()
        }
        return
      }

      if (inOwnInput) {
        // A bare slash types normally, except on an empty Console field, where
        // the hint advertises it as the way back to Search.
        if (consoleMode && !inputRef.current?.value) {
          e.preventDefault()
          enterSearchMode()
        }
        return
      }
      if (e.altKey || e.shiftKey) return

      e.preventDefault()
      enterSearchMode()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [compact, consoleMode, open, fixedMode])

  useEffect(() => {
    if (fixedMode === 'console' || (compact && !fixedMode)) return

    // ⌘/ from the toolbar's capture-phase listener: acts as a mode switch.
    function handleDashboardFocusSearch() {
      if (fixedMode === 'search') {
        enterSearchMode()
        return
      }
      if (consoleMode) {
        exitPromptMode({ keepSpotlightOpen: open })
      } else {
        enterPromptMode()
      }
    }

    window.addEventListener('dashboard-focus-search', handleDashboardFocusSearch)
    return () => window.removeEventListener('dashboard-focus-search', handleDashboardFocusSearch)
  }, [compact, consoleMode, open, fixedMode])

  function renderSpotlightContent() {
    if (loading) return <SkeletonResults />

    if (consoleMode) {
      return (
        <ConsoleSection
          query={resolvedQuery || query}
          showDivider={false}
          headerLabel={searchUiLanguage === 'en' ? (searchControls.suggestedPromptHeaderCopy || 'Suggested prompts') : ui.suggestedPrompts}
          askConsolePrefix={ui.askConsolePrefix}
          hideHeader={searchControls.spotlightHideSuggestedHeader}
          hidePassthrough={false}
          staticPrompts={!hasQuery ? (fixedMode === 'console' ? dailyPrompts : !compact ? HERO_PROMPT_PLACEHOLDERS : null) : null}
          onLaunch={navigateToConsole}
          limit={5}
        />
      )
    }

    if (!hasQuery) {
      return (
        <>
          {!searchControls.spotlightHideSuggestedHeader && (
            <SpotlightSectionHeader>{searchUiLanguage === 'en' ? (searchControls.suggestedFilterHeaderCopy || 'Suggested filters') : ui.suggestedFilters}</SpotlightSectionHeader>
          )}
          {FILTERS.map((f) => (
            <button
              key={f.key}
              data-item
              className="flex items-center w-full text-left cursor-pointer"
              style={rowStyle}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
              onClick={() => fillQuery(f.key)}
            >
              <span style={filterKeyBadge}>{f.key}</span>
              <span style={{ flex: 1, color: '#353A44', fontWeight: 400 }}>{f.example}</span>
              <span style={{ color: '#9AA3B0', fontWeight: 400, marginLeft: 24, textAlign: 'right' }}>{f.desc}</span>
            </button>
          ))}
        </>
      )
    }

    const paymentQuery = query.trim()
    const paymentResultsRowStyle = {
      ...rowStyle,
      marginTop: 8,
    }

    return (
      <>
        <button
          data-item
          className="flex items-center w-full text-left cursor-pointer gap-[8px]"
          style={paymentResultsRowStyle}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          onClick={() => fillQuery(`is:payment ${paymentQuery}`)}
        >
          <PaymentResultsIcon />
          <span style={spotlightRowTextStyle}>
            Show only payment results for <strong style={{ fontWeight: 600 }}>{paymentQuery}</strong>
          </span>
        </button>
        <div style={{ height: 1, background: '#EBEEF1', margin: '4px 8px' }} />

        {(aiSearch === 'mixed' || (aiSearch === 'plus' && plusChip !== 'search')) && !isFilterMode && searchControls.consoleAutoSubmit === 'off' && consoleScore >= 2 && (
          <ConsoleSection
            query={query}
            showDivider={false}
            headerLabel={searchUiLanguage === 'en' ? (searchControls.suggestedPromptHeaderCopy || 'Suggested prompts') : ui.suggestedPrompts}
            askConsolePrefix={ui.askConsolePrefix}
            onLaunch={navigateToConsole}
          />
        )}

        {matchingFilters.length > 0 && (
          <div>
            {searchControls.consoleAutoSubmit === 'off' && consoleScore >= 2 && <div style={{ height: 1, background: '#EBEEF1', margin: '4px 8px' }} />}
            {!searchControls.spotlightHideSuggestedHeader && (
              <SpotlightSectionHeader>{searchUiLanguage === 'en' ? (searchControls.suggestedFilterHeaderCopy || 'Suggested filters') : ui.suggestedFilters}</SpotlightSectionHeader>
            )}
            {matchingFilters.slice(0, 8).map((f) => (
              <button
                key={f.key}
                data-item
                className="flex items-center w-full text-left cursor-pointer"
                style={rowStyle}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
                onClick={() => fillQuery(f.key)}
              >
                <span style={filterKeyBadge}>{f.key}</span>
                {f.example && <span style={{ flex: 1, color: '#353A44', fontWeight: 400 }}>{f.example}</span>}
                {f.desc && <span style={{ color: '#9AA3B0', fontWeight: 400, marginLeft: 24, textAlign: 'right' }}>{f.desc}</span>}
              </button>
            ))}
          </div>
        )}

        {filteredResults.map((cat, catIdx) => (
          <div key={cat.label}>
            {(catIdx > 0 || matchingFilters.length > 0 || ((aiSearch === 'mixed' || (aiSearch === 'plus' && plusChip !== 'search')) && searchControls.consoleAutoSubmit === 'off' && consoleScore >= 2)) && (
              <div style={{ height: 1, background: '#EBEEF1', margin: '4px 8px' }} />
            )}
            <SpotlightSectionHeader>{cat.label}</SpotlightSectionHeader>
            {cat.items.map((item, i) => (
              <button
                key={i}
                data-item
                className="flex items-center w-full text-left cursor-pointer gap-[8px]"
                style={rowStyle}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
                onClick={() => setOpen(false)}
              >
                {getIcon(item.icon)}
                <span style={spotlightRowTextStyle}>
                  <HighlightText text={item.text} query={query.trim()} />
                </span>
                {item.meta && (
                  <span style={{ color: '#9AA3B0', fontWeight: 400, marginLeft: 8, whiteSpace: 'nowrap', fontSize: 13, flexShrink: 0 }}>
                    {item.meta}
                  </span>
                )}
                {item.meta2 && (
                  <span style={{ color: '#9AA3B0', fontWeight: 400, marginLeft: 8, whiteSpace: 'nowrap', fontSize: 13, flexShrink: 0 }}>
                    {item.meta2}
                  </span>
                )}
                {item.badge && (
                  <span style={{ color: '#7D8BA4', fontWeight: 400, marginLeft: 8, whiteSpace: 'nowrap', fontSize: 13, flexShrink: 0 }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}

        {(aiSearch === 'mixed' || (aiSearch === 'plus' && plusChip !== 'search')) && !isFilterMode && searchControls.consoleAutoSubmit === 'off' && consoleScore < 2 && (
          <ConsoleSection
            query={query}
            showDivider={filteredResults.length > 0 || matchingFilters.length > 0}
            headerLabel={searchUiLanguage === 'en' ? (searchControls.suggestedPromptHeaderCopy || 'Suggested prompts') : ui.suggestedPrompts}
            askConsolePrefix={ui.askConsolePrefix}
            onLaunch={navigateToConsole}
          />
        )}

        {filteredResults.length === 0 && matchingFilters.length === 0 && searchControls.consoleAutoSubmit === 'off' && consoleScore >= 2 && (
          <div style={{ padding: '4px 16px 8px', fontSize: 13, color: '#9AA3B0', fontFamily: "'SF Pro Text', system-ui, sans-serif" }}>
            No other results for "{query}"
          </div>
        )}
        {filteredResults.length === 0 && matchingFilters.length === 0 && (searchControls.consoleAutoSubmit !== 'off' || consoleScore < 2) && (
          <div style={{ padding: '12px 16px 4px', fontSize: 13, color: '#9AA3B0', fontFamily: "'SF Pro Text', system-ui, sans-serif" }}>
            No results for "{query}"
          </div>
        )}
      </>
    )
  }

  function renderSpotlightFooter() {
    const spotlightFooterMode = searchControls.spotlightGrayBar || 'default'
    if (consoleMode && spotlightFooterMode === 'banner' && spotlightBannerDismissed) return null

    const footerClassName = [
      'home-search-spotlight-footer',
      consoleMode && spotlightFooterMode === 'small' ? 'home-search-spotlight-footer--small' : '',
      consoleMode && spotlightFooterMode === 'banner' ? 'home-search-spotlight-footer--banner' : '',
    ].filter(Boolean).join(' ')

    return (
      <div
        className={footerClassName}
        style={{ borderRadius: `0 0 ${spotlightPopoverRadiusPx} ${spotlightPopoverRadiusPx}` }}
      >
        <div className="home-search-spotlight-footer__row">
          {consoleMode ? (
            <>
              <span className="home-search-spotlight-footer__disclaimer">
                {searchUiLanguage === 'en' ? (searchControls.legalCopy || ui.legal) : ui.legal}
              </span>
              {spotlightFooterMode === 'banner' && (
                <button
                  type="button"
                  className="home-search-spotlight-footer__dismiss"
                  aria-label={ui.dismissPreviewNotice}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setSpotlightBannerDismissed(true)
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <button className="cursor-pointer" style={viewAllStyle}>
              {hasQuery ? ui.viewAllResults : ui.viewMoreFilters}
            </button>
          )}
        </div>
      </div>
    )
  }

  function exitPromptMode({ keepSpotlightOpen = false } = {}) {
    setConsoleMode(false)
    setOpen(keepSpotlightOpen)
    setFocusedIdx(-1)
    if (keepSpotlightOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setPlusOpen(false)
        if (launchThinking) return
        if (consoleMode) {
          inputRef.current?.blur()
          if (isToggleOption) {
            setOpen(false)
            setFocusedIdx(-1)
            return
          }
          exitPromptMode()
          return
        }
        setOpen(false)
        setFocusedIdx(-1)
      }
    }
    document.addEventListener('mouseup', handleClickOutside)
    document.addEventListener('focusin', handleClickOutside)
    return () => {
      document.removeEventListener('mouseup', handleClickOutside)
      document.removeEventListener('focusin', handleClickOutside)
    }
  }, [consoleMode, launchThinking, isToggleOption])

  function cancelSpotlightDismiss() {
    clearTimeout(spotlightDismissTimerRef.current)
    spotlightDismissTimerRef.current = null
    setSpotlightDismissing(false)
  }

  function dismissSpotlightOnScroll() {
    if (spotlightDismissTimerRef.current) return
    setSpotlightDismissing(true)
    setFocusedIdx(-1)
    setPlusOpen(false)
    inputRef.current?.blur()
    spotlightDismissTimerRef.current = setTimeout(() => {
      spotlightDismissTimerRef.current = null
      setSpotlightDismissing(false)
      setOpen(false)
    }, SPOTLIGHT_SCROLL_FADE_MS)
  }

  useEffect(() => () => clearTimeout(spotlightDismissTimerRef.current), [])

  useLayoutEffect(() => {
    if (compact || !isToggleOption) return
    const node = spotlightMeasureRef.current
    if (!node) return
    // Measure the untransformed border box. The popover sits at scale(0.965)
    // while closed, and getBoundingClientRect would fold that into the clamp,
    // cropping the footer once the popover opens back up to full size.
    const apply = (blockSize) => setSpotlightHeight(Math.ceil(blockSize))
    apply(node.offsetHeight)
    const observer = new ResizeObserver((entries) => {
      const borderBox = entries[0]?.borderBoxSize?.[0]
      apply(borderBox ? borderBox.blockSize : node.offsetHeight)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [compact, isToggleOption])

  // Only tween the popover height across a mode change, not on every keystroke.
  useEffect(() => {
    if (compact || !isToggleOption) return
    setSpotlightModeShifting(true)
    const timer = setTimeout(() => setSpotlightModeShifting(false), 280)
    return () => clearTimeout(timer)
  }, [consoleMode, compact, isToggleOption])

  useEffect(() => {
    if (compact || !open) return

    const armedAt = performance.now() + SPOTLIGHT_SCROLL_GRACE_MS

    // Capture phase so any scroll container on the page reaches us, not just `main`.
    function handleScroll(e) {
      if (performance.now() < armedAt) return
      const target = e.target === document ? document.scrollingElement : e.target
      if (target instanceof Node && wrapperRef.current?.contains(target)) return
      dismissSpotlightOnScroll()
    }

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', handleScroll, { capture: true })
  }, [compact, open])

  function retireSpotlightTip() {
    if (dismissedSpotlightTips.has(homeInputOption)) return
    dismissedSpotlightTips.add(homeInputOption)
    setTipRetired((n) => n + 1)
  }

  function fillQuery(value) {
    setQuery(value)
    if (value.trim()) retireSpotlightTip()
    inputRef.current?.focus()
  }

  function navigateToConsole(prompt) {
    const trimmed = prompt.trim()
    if (!trimmed || launchThinking) return
    retireSpotlightTip()

    if (consoleMode) {
      setQuery(trimmed)
      setOpen(false)
      setFocusedIdx(-1)
      setLaunchThinking(true)
      inputRef.current?.blur()

      clearTimeout(launchTimerRef.current)
      launchTimerRef.current = setTimeout(() => {
        navigate(getConsolePath(), { state: { launchPrompt: trimmed, thinking: true } })
      }, searchControls.promptLaunchThinkingMs ?? PROMPT_LAUNCH_THINKING_MS)
      return
    }

    setOpen(false)
    setQuery('')
    setConsoleMode(false)
    setFocusedIdx(-1)
    navigate(getConsolePath(), { state: { launchPrompt: trimmed, thinking: true } })
  }

  function launchFromKeyboard(items) {
    if (focusedIdx >= 0 && items[focusedIdx]?.dataset.itemType === 'console') {
      navigateToConsole(items[focusedIdx].dataset.promptText || query)
      return
    }
    if (query.trim()) navigateToConsole(query)
  }

  // Hero uses connected inline spotlight; compact keeps the floating dropdown.
  const showDropdown = compact && open && !plusOpen && !(
    consoleMode && !loading && resolvedQuery.trim() && consoleScore === 0
  )
  function clearChip(chipType, andThen) {
    setPlusChipExiting(chipType)
    setPlusChip(null)
    setConsoleMode(false)
    setTimeout(() => {
      setPlusChipExiting(null)
      if (andThen) andThen()
    }, 150)
  }

  const height = compact ? 36 : 48
  const px = compact ? 12 : 16
  const py = compact ? 0 : 8
  const buttonDefaultVisible = searchControls.buttonDefaultVisible && !(stickyActive && searchControls.buttonChromeHidden)
  const buttonVisible = !fixedMode && isButtonOption && (buttonDefaultVisible || inputActive || inputHovered)
  const chromeGreyActive = stickyActive && searchControls.buttonChromeGrey
  const buttonIconHidden = searchControls.buttonChromeHideIcon
  const flipFlopButtonActive = searchControls.buttonStyleDefault === 'flip-flop' || searchControls.buttonStyleDefault === 'flip-flop-2'
  const leftOutlineButtonActive = searchControls.buttonStyleDefault === 'outline-button'
  const rightOutlineButtonActive = searchControls.buttonStyleDefault === 'outline-button-right'
  const flipFlopHelperText = searchUiLanguage === 'en' ? (searchControls.consoleButtonCopy || 'Ask Console') : ui.consoleButton
  const spotlightSuggestionsClassName = [
    'home-search-spotlight-suggestions',
    searchControls.spotlightHideSuggestedHeader ? 'home-search-spotlight-suggestions--no-header' : '',
    consoleMode && searchControls.spotlightGrayBar === 'small' ? 'home-search-spotlight-suggestions--compact-footer' : '',
  ].filter(Boolean).join(' ')
  const spotlightAnimationClassName = `home-search-spotlight-popover--animation-${searchControls.spotlightAnimation}`

  // The ghost that carries the hint spans the whole row, so hover is measured
  // against the inner span that shrink-wraps the glyphs instead.
  const trackHintHover = (event) => {
    const bar = event.currentTarget
    const text = bar.querySelector('.home-search-hint-text')
    const box = text ? text.getBoundingClientRect() : nativeHintBox(bar.querySelector('input'))
    if (!box) {
      setHintHovered(false)
      return
    }
    const pad = HINT_HOVER_PADDING
    setHintHovered(
      event.clientX >= box.left - pad && event.clientX <= box.right + pad &&
      event.clientY >= box.top - pad && event.clientY <= box.bottom + pad
    )
  }

  return (
    <div ref={wrapperRef} data-input-mode={fixedMode || undefined} className={`relative${compact ? '' : ' home-search-wrapper'}${heroExpanded ? ' home-search-wrapper--open' : ''}`} style={{
      width: compact ? (open ? COMPACT_SEARCH_OPEN_WIDTH : COMPACT_SEARCH_CLOSED_WIDTH) : '100%',
      maxWidth: compact ? COMPACT_SEARCH_OPEN_WIDTH : undefined,
      minWidth: compact ? 318 : undefined,
      zIndex: compact ? undefined : 270,
      transition: compact ? 'width 250ms cubic-bezier(0.25, 0.1, 0.25, 1)' : undefined,
    }}>
      {/* Hero: input row stays in flow; spotlight pops over content below */}
      <div
        className={
          (compact
            ? `home-search-bar flex items-center gap-[8px] rounded-[6px] cursor-text${open ? ' home-search-bar--open' : ''}`
            : `home-search-bar home-search-bar--hero rounded-[6px]${open ? ' home-search-bar--open' : ''}${chromeGreyActive ? ' home-search-bar--chrome-grey' : ''}`
          ) + (hintHovered ? ' home-search-bar--hint-hover' : '')
        }
        style={
          compact
            ? {
                height,
                padding: `${py}px ${px}px`,
                backgroundColor: '#F4F7FA',
                outline: 'none',
                borderRadius: activeBorderRadiusPx,
                ...focusTintStyle,
              }
            : { borderRadius: activeBorderRadiusPx, ...focusTintStyle }
        }
        onClick={compact ? () => { if (!launchThinking) inputRef.current?.focus() } : undefined}
        onMouseEnter={() => setInputHovered(true)}
        onMouseLeave={() => { setInputHovered(false); setHintHovered(false) }}
        onPointerMove={trackHintHover}
      >
        {/* Mounting with the tinted state runs the sweep once per activation, and
            it stays up past the mode change to take the outline back off. */}
        {swirl && (
          <svg
            ref={swirlRef}
            className={`home-search-bar__swirl home-search-bar__swirl--${tintModifier(swirl.tint ?? 'blurpleLilac')}${swirl.settled ? ' home-search-bar__swirl--settled' : ''}${swirl.phase === 'out' ? ' home-search-bar__swirl--out' : ''}`}
            // The paint is published as a property because the id is per
            // instance, and no stylesheet can name it.
            style={{ '--swirl-radius': activeBorderRadiusPx, '--swirl-sweep-paint': `url(#${sweepGradientId})` }}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient
                className="home-search-bar__swirl-gradient"
                id={swirlGradientId}
                gradientUnits="userSpaceOnUse"
                r={SWIRL_POINTER_RADIUS}
                // Parked off-canvas until the pointer reports in, so the pool
                // cannot show up somewhere arbitrary on the first frame.
                cx="-9999"
                cy="-9999"
              >
                {/* The plateau covers the field's half-height, so the outline
                    nearest a pointer resting inside the field reaches full
                    strength rather than starting part-way down the falloff.
                    Trace cursor paints the outline with the brand gradient and
                    uses this radial only as a mask, so its stops are white —
                    luminance is what a mask reads — with the same falloff, which
                    reveals the gradient near the cursor and lets it dissolve into
                    the grey track with distance. */}
                {swirl.tint === 'refreshTrace' ? (
                  // The refresh palette poured out from the cursor: brand colours
                  // in the core, easing to transparent so the outline dissolves
                  // into the grey track with distance. Radiating the palette from
                  // the pointer keeps all three brand colours present wherever the
                  // cursor is, rather than the outline reading a single flat hue.
                  <>
                    <stop offset="0" stopColor="#533AFD" stopOpacity="1" />
                    <stop offset="0.32" stopColor="#533AFD" stopOpacity="1" />
                    <stop offset="0.58" stopColor="#F44BCC" stopOpacity="0.82" />
                    <stop offset="0.82" stopColor="#FF6118" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#FF6118" stopOpacity="0" />
                  </>
                ) : (
                  <>
                    <stop offset="0" stopColor={tintColors.pointer} stopOpacity="1" />
                    <stop offset="0.28" stopColor={tintColors.pointer} stopOpacity="1" />
                    <stop offset="0.6" stopColor={tintColors.pointer} stopOpacity="0.45" />
                    <stop offset="1" stopColor={tintColors.pointer} stopOpacity="0" />
                  </>
                )}
              </radialGradient>
              {/* The sweep is laid down as a gradient rather than a flat colour,
                  so as the dash reveals the perimeter each point picks up the
                  colour at its own position along the field. */}
              <linearGradient
                className="home-search-bar__swirl-sweep-gradient"
                id={sweepGradientId}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                {swirl.tint === 'refreshGradient' || swirl.tint === 'refreshGrow' || swirl.tint === 'refreshTrace' ? (
                  // Two brand references, one gradient. While the ring DRAWS ON it
                  // wears the designer's Line 2997 (3956-200767): the field's own
                  // grey (#D4DEE9) at the start easing into blue by the midpoint,
                  // then magenta, then orange — so the line "begins" grey and
                  // fades into the colour rather than snapping on. Once it SETTLES
                  // the stop-colours morph (in CSS, on the --settled class) to the
                  // pure brand gradient (3857-197614): #533AFD → #F44BCC → #FF6118,
                  // no grey. The offsets are fixed at 0 / 0.5 / 0.75 / 1 for both
                  // states so only the colours cross-fade — the 0.75 stop is the
                  // magenta→orange midpoint, present purely so the settled paint
                  // reproduces the pure three-stop run exactly.
                  <>
                    <stop className="home-search-bar__swirl-sweep-grey" offset="0" stopColor="#D4DEE9" />
                    <stop className="home-search-bar__swirl-sweep-lead" offset="0.5" stopColor="#533AFD" />
                    <stop className="home-search-bar__swirl-sweep-mid" offset="0.75" stopColor="#F44BCC" />
                    <stop className="home-search-bar__swirl-sweep-tail" offset="1" stopColor="#FF6118" />
                  </>
                ) : (
                  // Blurple to lilac: only the blurple end has anywhere to go
                  // when it settles. Colours are left to CSS.
                  <>
                    <stop className="home-search-bar__swirl-sweep-from" offset="0" />
                    <stop className="home-search-bar__swirl-sweep-to" offset="1" />
                  </>
                )}
              </linearGradient>
            </defs>
            <rect className="home-search-bar__swirl-track" />
            {/* Grouped so leaving fades all the purple as one, over the grey
                track. Fading the group rather than each layer keeps it clear of
                the opacity the head animates on itself. */}
            <g className="home-search-bar__swirl-tint">
              <rect className="home-search-bar__swirl-sweep" />
              <rect className="home-search-bar__swirl-head" />
              {swirl.tint === 'refreshGrow' ? (
                // Dynamic type: two mirrored arcs that start at the left edge
                // and sweep the top and bottom in concert as the query grows,
                // meeting at the right. Their geometry and reveal are driven
                // from JS; both are painted by the sweep gradient so they carry
                // the brand colours left to right.
                <>
                  <path className="home-search-bar__swirl-grow home-search-bar__swirl-grow--top" />
                  <path className="home-search-bar__swirl-grow home-search-bar__swirl-grow--bottom" />
                </>
              ) : (
                <rect className="home-search-bar__swirl-pool" stroke={`url(#${swirlGradientId})`} />
              )}
            </g>
          </svg>
        )}
        {/* Trace cursor announces with one lap of Console's orbiting border in
            place of the sweep (hidden in CSS), over the swirl's grey track:
            the slow lap, 25% quicker. */}
        {swirl?.tint === 'refreshTrace' && (
          <FocusTrace active={swirl.phase === 'in'} speed="fast" radius={activeBorderRadius} />
        )}
        <div
          className={compact ? 'dui-console-icon-trigger' : 'home-search-prompt-input-row dui-console-icon-trigger'}
          onClick={compact ? undefined : () => { if (!launchThinking) inputRef.current?.focus() }}
          style={
            compact
              ? { display: 'contents' }
              : isToggleOption && askSwitchWidth
                ? { '--home-search-ask-console-switch-width': `${askSwitchWidth}px` }
                : isShortcutOption && shortcutHintWidth
                  ? { '--home-search-shortcut-hint-width': `${shortcutHintWidth}px` }
                  : undefined
          }
        >
        {fixedMode ? (
          consoleMode ? (
            <DashboardThinkingIcon
              size={16}
              thinking={launchThinking}
              className="home-search-input-thinking-icon"
              style={{ color: launchThinking ? '#665EFD' : '#474E5A' }}
            />
          ) : <SearchPrototypeIcon icon="search" />
        ) : aiSearch === 'plus' ? (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <PlusButton
              active={plusOpen}
              size={compact ? 22 : 28}
              onMouseDown={(e) => { e.preventDefault(); setPlusOpen((v) => !v) }}
            />
            {(plusChip || plusChipExiting) && (
              <PlusChip
                key={plusChip || 'exiting'}
                type={plusChip || plusChipExiting}
                exiting={!plusChip && !!plusChipExiting}
                onRemove={() => {
                  setPlusOpen(true)
                  setOpen(false)
                  clearChip(plusChip)
                }}
              />
            )}
          </div>
        ) : isButtonOption && leftOutlineButtonActive ? (
          <OutlineModeButton
            active={consoleMode}
            showConsoleIcon={consoleMode}
            side="left"
            onToggle={() => {
              if (launchThinking) return
              if (consoleMode) {
                exitPromptMode({ keepSpotlightOpen: open })
              } else {
                enterPromptMode()
              }
              setOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          />
        ) : open && aiSearch === 'separate' && tabStyle === 'toggle-l' ? (
          <ModeToggle
            consoleMode={consoleMode}
            onToggle={() => {
              setConsoleMode((m) => !m)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          />
        ) : isToggleOption || isShortcutOption ? (
          <ModeCrossfadeIcon consoleMode={consoleMode} />
        ) : (
          rightOutlineButtonActive ? (
            <motion.span
              key={consoleMode ? 'right-outline-helper-console' : 'right-outline-helper-search'}
              className="home-search-helper-icon-motion"
              initial={{ opacity: 0.25, x: consoleMode ? 18 : -18, scale: 0.72, rotate: consoleMode ? 24 : -24 }}
              animate={{
                opacity: 1,
                x: [consoleMode ? 18 : -18, consoleMode ? -4 : 4, 0],
                scale: [0.72, 1.28, 0.92, 1],
                rotate: [consoleMode ? 24 : -24, consoleMode ? -10 : 10, 0],
              }}
              transition={{ duration: 0.46, ease: [0.2, 0, 0.1, 1] }}
            >
              <SearchPrototypeIcon
                icon={consoleMode ? 'thinking' : 'search'}
                animated={false}
                migrating={false}
              />
            </motion.span>
          ) : (
            <SearchPrototypeIcon
              icon={(buttonIconHidden || flipFlopButtonActive) && consoleMode ? 'thinking' : activeIcon}
              animated={buttonIconHidden && launchThinking}
              migrating={false}
            />
          )
        )}
        <div className="relative flex-1 min-w-0" style={{ height: compact ? 36 : 28 }}>
          <input
            ref={inputRef}
            type="text"
            aria-label={fixedMode === 'console' ? 'Ask Console' : fixedMode === 'search' ? 'Search dashboard' : undefined}
            aria-expanded={open}
            value={query}
            readOnly={launchThinking}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.trim()) retireSpotlightTip()
            }}
            onFocus={() => {
              if (launchThinking) return
              cancelSpotlightDismiss()
              setInputFocused(true)
              setOpen(true)
              setPlusOpen(false)
            }}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => {
              if (launchThinking) {
                e.preventDefault()
                return
              }
              if (e.key === 'Backspace' && aiSearch === 'plus' && plusChip && !query) {
                e.preventDefault()
                clearChip(plusChip)
                return
              }
              if (e.key === 'Tab' && !fixedMode) {
                e.preventDefault()
                setPlusChip(null)
                setPlusOpen(false)
                setFocusedIdx(-1)
                setConsoleMode((m) => !m)
                return
              }
              const items = dropdownContentRef.current
                ? [...dropdownContentRef.current.querySelectorAll('[data-item]')]
                : []
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (items.length === 0) return
                setFocusedIdx((i) => (i + 1) % items.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (items.length === 0) return
                setFocusedIdx((i) => (i <= 0 ? items.length - 1 : i - 1))
              } else if (e.key === 'Enter' && consoleMode) {
                e.preventDefault()
                launchFromKeyboard(items)
                setOpen(false)
                setFocusedIdx(-1)
              } else if (e.key === 'Enter' && focusedIdx >= 0 && items[focusedIdx]) {
                e.preventDefault()
                if (items[focusedIdx].dataset.itemType === 'console') {
                  navigateToConsole(items[focusedIdx].dataset.promptText || query)
                } else {
                  items[focusedIdx].click()
                }
                setFocusedIdx(-1)
              } else if (e.key === 'Escape') {
                e.preventDefault()
                if (launchThinking) return
                if (consoleMode && open && document.activeElement === inputRef.current) {
                  inputRef.current?.blur()
                  exitPromptMode()
                  return
                }
                if (document.activeElement === inputRef.current) {
                  inputRef.current?.blur()
                  setOpen(false)
                  setFocusedIdx(-1)
                  return
                }
                if (open) {
                  setOpen(false)
                } else if (consoleMode) {
                  exitPromptMode()
                } else {
                  setOpen(false)
                }
                setFocusedIdx(-1)
              }
            }}
            placeholder={showDailyPrompt || showRotatingPlaceholder || showPromptGhost || showSearchGhost ? '' : (aiSearch === 'separate' && tabStyle === 'toggle-l' ? '' : inputPlaceholder)}
            className={`w-full h-full text-[14px] font-normal leading-5 tracking-[-0.15px] outline-none bg-transparent ${launchThinking ? 'cursor-default' : 'cursor-text'}`}
            style={{ fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif", color: INPUT_TEXT_COLOR }}
          />
          {showDailyPrompt && (
            <RotatingConsolePrompt key={promptDay} prompts={dailyPrompts} />
          )}
          {/* toggle-l: static placeholder shown only when closed */}
          {aiSearch === 'separate' && tabStyle === 'toggle-l' && !query && !open && (
            <span style={{ ...GHOST_TEXT_STYLE }}>
              <span className="home-search-hint-text">{placeholderDefault}</span>
            </span>
          )}
          {/* Toggle option: one stacked ghost so the two labels crossfade instead of swapping. */}
          {isToggleOption && (showSearchGhost || showPromptGhost) && (
            <AnimatePresence initial={false}>
              <motion.span
                key={consoleMode ? 'ghost-console' : 'ghost-search'}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={MODE_GHOST_TRANSITION}
                style={{ ...GHOST_TEXT_STYLE }}
              >
                <span className="home-search-hint-text">
                  {consoleMode ? consolePlaceholder : searchPlaceholder}
                </span>
              </motion.span>
            </AnimatePresence>
          )}
          {!isToggleOption && showSearchGhost && (
            <span style={{ ...GHOST_TEXT_STYLE }}>
              <span className="home-search-hint-text">{searchPlaceholder}</span>
            </span>
          )}
          {!isToggleOption && showPromptGhost && (
            <span style={{ ...GHOST_TEXT_STYLE }}>
              <span className="home-search-hint-text">
                {flipFlopButtonActive ? flipFlopHelperText : consolePlaceholder}
              </span>
            </span>
          )}
          {showRotatingPlaceholder && (() => {
            const pool = consoleMode
              ? (aiSearch === 'plus' && plusChip === 'act' ? ACT_PLACEHOLDERS : CONSOLE_PLACEHOLDERS)
              : SEARCH_PLACEHOLDERS
            return (
              <span key={`${aiSearch}-${plusChip}-${consoleMode}-${placeholderIdx}`} className="placeholder-rotate">
                {pool[placeholderIdx]}
              </span>
            )
          })()}
        </div>
        {open && aiSearch === 'separate' && tabStyle === 'toggle-r' && (
          <ModeToggle
            consoleMode={consoleMode}
            onToggle={() => {
              setConsoleMode((m) => !m)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          />
        )}
        {!compact && buttonVisible && rightOutlineButtonActive && (
          <OutlineModeButton
            active={consoleMode}
            showConsoleIcon={!consoleMode}
            side="right"
            animated={false}
            onToggle={() => {
              if (launchThinking) return
              if (consoleMode) {
                exitPromptMode({ keepSpotlightOpen: open })
              } else {
                enterPromptMode()
              }
              setOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          />
        )}
        {!fixedMode && !compact && isToggleOption && (
          <AskConsoleSwitch
            checked={consoleMode}
            label={searchUiLanguage === 'en' ? (searchControls.consoleButtonCopy || 'Ask Console') : ui.consoleButton}
            showLabel={persistToggleLabel || !consoleMode}
            disabled={launchThinking}
            onMeasure={setAskSwitchWidth}
            onToggle={() => {
              if (launchThinking) return
              if (consoleMode) {
                exitPromptMode({ keepSpotlightOpen: open })
              } else {
                enterPromptMode({ autoFocus: toggleAutoFocus })
              }
            }}
          />
        )}
        {!fixedMode && !compact && isShortcutOption && (
          <ShortcutHint
            label={consoleMode
              ? (searchUiLanguage === 'en' ? (searchControls.searchPlaceholder || 'Search') : ui.searchPlaceholder)
              : (searchUiLanguage === 'en' ? (searchControls.consoleButtonCopy || 'Ask Console') : ui.consoleButton)}
            keys={consoleMode ? '/' : '⌘/'}
            showArrow={shortcutArrowShowing}
            // Only ever sweeps "Ask Console" — in Console the label is the exit.
            shimmer={emphasisSweeping}
            shimmerGradient={emphasizeGradient}
            onMeasure={setShortcutHintWidth}
            asButton={hiddenButton || typeArrow}
            onActivate={hiddenButton || shortcutArrowShowing ? () => {
              if (launchThinking) return
              retireSpotlightTip()
              // Once the arrow is up the hint reads as "send this", so send it
              // rather than just opening Console on an empty prompt.
              if (shortcutArrowShowing) navigateToConsole(query)
              else if (consoleMode) exitPromptMode({ keepSpotlightOpen: open })
              else enterPromptMode()
            } : undefined}
          />
        )}
        {!compact && isButtonOption && buttonVisible && !leftOutlineButtonActive && !rightOutlineButtonActive && (
          <ConsoleToggleButton
            active={consoleMode}
            morphEnabled={searchControls.buttonMorphEnabled}
            defaultStyle={searchControls.buttonStyleDefault}
            activeStyle={searchControls.buttonStyleActive}
            borderRadius={searchControls.buttonBorderRadius}
            fontSize={searchControls.buttonFontSize}
            label={searchUiLanguage === 'en' ? searchControls.consoleButtonCopy : ui.consoleButton}
            thinking={launchThinking}
            hideIcon={buttonIconHidden}
            motionPreset={searchControls.buttonTextEasing}
            toggleXGrey={searchControls.buttonToggleXGrey}
            onClick={() => {
              if (launchThinking) return
              if (consoleMode) {
                if (
                  searchControls.buttonStyleDefault === 'toggle-x'
                  && searchControls.buttonToggleXClearInput
                  && query.trim()
                ) {
                  setQuery('')
                  setConsoleMode(false)
                  setOpen(true)
                  setFocusedIdx(-1)
                  setTimeout(() => inputRef.current?.focus(), 0)
                  return
                }
                exitPromptMode({ keepSpotlightOpen: open })
                return
              }
              if (searchControls.consoleAutoSubmit !== 'off' && query.trim()) {
                const delay = searchControls.consoleAutoSubmit === 'beat' ? 1000 : 0
                setConsoleMode(true)
                inputRef.current?.blur()
                setOpen(false)
                if (delay > 0) {
                  setLaunchThinking(true)
                  clearTimeout(launchTimerRef.current)
                  launchTimerRef.current = setTimeout(() => {
                    navigateToConsole(query.trim())
                  }, delay)
                } else {
                  navigateToConsole(query.trim())
                }
                return
              }
              enterPromptMode()
            }}
          />
        )}
        </div>
        <AnimatePresence>
          {spotlightTipVisible && <SpotlightTip onDismiss={retireSpotlightTip} />}
        </AnimatePresence>
      </div>

      {!compact && (
        <div className={`home-search-spotlight-popover ${spotlightAnimationClassName}${heroExpanded ? ' home-search-spotlight-popover--open' : ''}${spotlightDismissing ? ' home-search-spotlight-popover--dismissing' : ''}`}>
          <div className="home-search-spotlight-popover__inner" style={{ borderRadius: spotlightPopoverRadiusPx }}>
            {isToggleOption ? (
              <div
                className={`home-search-spotlight-popover__sizer${spotlightModeShifting ? ' home-search-spotlight-popover__sizer--shifting' : ''}`}
                style={spotlightHeight != null ? { height: spotlightHeight } : undefined}
              >
                <div ref={spotlightMeasureRef}>
                  <motion.div
                    key={consoleMode ? 'spotlight-console' : 'spotlight-search'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={MODE_SPOTLIGHT_TRANSITION}
                  >
                    <div ref={dropdownContentRef} className={spotlightSuggestionsClassName}>
                      {renderSpotlightContent()}
                    </div>
                    {renderSpotlightFooter()}
                  </motion.div>
                </div>
              </div>
            ) : (
              <>
                <div ref={dropdownContentRef} className={spotlightSuggestionsClassName}>
                  {renderSpotlightContent()}
                </div>
                {renderSpotlightFooter()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Plus popover */}
      {plusOpen && aiSearch === 'plus' && (
        <PlusPopover
          barHeight={height}
          labels={ui}
          onSelectMode={(mode) => {
            setPlusChip(mode)
            setConsoleMode(mode === 'console' || mode === 'act')
            setOpen(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          onClose={() => setPlusOpen(false)}
        />
      )}

      {/* Floating dropdown — compact toolbar only */}
      {showDropdown && (
        <div
          className="absolute left-0 bg-white rounded-[12px] z-50 flex flex-col"
          style={{
            top: height + 4,
            width: '100%',
            border: '1px solid #D4DEE9',
            borderRadius: spotlightPopoverRadiusPx,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            maxHeight: 640,
          }}
        >
          <div
            ref={dropdownContentRef}
            style={{ flex: 1, overflowY: 'auto', padding: consoleMode ? '8px 0 8px' : '8px 0 0' }}
          >
            <div style={{ padding: '0 8px' }}>
              {renderSpotlightContent()}
            </div>
          </div>
          {renderSpotlightFooter()}
        </div>
      )}
    </div>
  )
}

/* ── Shared styles ──────────────────────────────────────────────────────── */

const filterKeyBadge = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 4,
  background: '#F4F7FA',
  color: '#6C7688',
  fontWeight: 500,
  fontFamily: "'SF Mono', ui-monospace, monospace",
  fontSize: 12,
  lineHeight: '18px',
  marginRight: 8,
  flexShrink: 0,
}

const viewAllStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: '#533AFD',
  lineHeight: '20px',
  letterSpacing: '-0.15px',
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: "'SF Pro Text', system-ui, sans-serif",
}
