// Dashboard design tokens. Values come from the Figma-matched Home page and
// the DashboardListViewTemplate list pages — use these instead of raw hex values.

export const color = {
  // Text
  text:            '#353A44',
  textStrong:      '#1A2C44',
  textHeading:     '#1A1F2E',
  textButton:      '#273951',
  subdued:         '#596171',
  muted:           '#6A7383',
  placeholder:     '#9AA3B0',
  disabled:        '#BAC8DA',

  // Brand / action
  actionPrimary:   '#533AFD',
  brand500:        '#675DFF',
  brand500Hover:   '#5648E0',
  brand300:        '#8B83FF',
  brand50:         '#EBE8FF',

  // Neutrals
  neutral25:       '#F5F6F8',
  neutral50:       '#EBEEF1',
  neutral100:      '#D8DEE4',
  neutral300:      '#95A4BA',
  neutral400:      '#7D8BA4',
  borderDefault:   '#D4DEE9',
  borderSubtle:    '#ECF1F6',
  wellBackground:  '#F8F9FB',
  surface:         '#FFFFFF',

  // App marketplace
  appTile:         '#4F5B76',
  appBadge:        '#B7A5FF',

  // Feedback
  attentionAccent: '#FCAF4F', // Sail color.hue.orange.200 — "action required" notification bar
  positive:        '#1B7E46',
  negative:        '#C0123C',
  tooltip:         '#1A2C44',
  toast:           '#273951',

  // Data viz series, in order
  chart: ['#675DFF', '#8B83FF', '#0055BC', '#33BBFF', '#FF8C21'],
  // Payment outcome series (Dashboard Payments card), in display order
  paymentStatus: {
    succeeded:  '#9A65FF',
    uncaptured: '#0055BC',
    refunded:   '#00A1C2',
    disputed:   '#ED6802',
    failed:     '#B3073D',
  },

  // Console's orbiting focus border (growth-studio ChartCard), as [degrees from
  // the band's peak, colour]: a ramp up behind it, purple → pink → yellow ahead,
  // then a faint neutral the rest of the way round.
  consoleOrbit: [
    [-80, 'rgba(236, 241, 246, 0.15)'],
    [0, 'rgba(124, 92, 255, 0.95)'],
    [28, 'rgba(224, 108, 186, 0.85)'],
    [55, 'rgba(240, 212, 138, 0.7)'],
    [90, 'rgba(236, 241, 246, 0.35)'],
    [140, 'rgba(236, 241, 246, 0.15)'],
  ],

  // ConsoleIcon variant="blob": the glowing jelly character.
  consoleBlob: {
    hot:    '#F53DE2',
    violet: '#C05AF0',
    pale:   '#F4DEFA',
    glow:   '#E83BE3',
    eye:    '#14051F',
    night:  '#130423',
  },
}

/** Status badge palettes. Same values as `lib/listview/statusStyles.ts`. */
export const status = {
  success:  { background: '#eafcdd', color: '#217005', outline: '1px solid #a8f170' },
  warning:  { background: '#fdf8c9', color: '#b13600', outline: '1px solid #fbd992' },
  critical: { background: '#fef4f6', color: '#c0123c', outline: '1px solid #fbd3dc' },
  default:  { background: '#f4f7fa', color: '#50617a', outline: '1px solid #d4dee9' },
  info:     { background: '#E2FBFE', color: '#045AD0', outline: '1px solid #A7E7FC' },
}

export const font = {
  text:    "'SF Pro Text', 'SF Pro', system-ui, -apple-system, sans-serif",
  display: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, sans-serif",
}

const lnum = '"lnum" 1, "pnum" 1'

/** Typography presets — spread into `style`. */
export const type = {
  pageTitle:    { fontFamily: font.display, fontSize: 28, fontWeight: 700, lineHeight: '36px', letterSpacing: 0.1, color: color.text, fontFeatureSettings: lnum },
  sectionTitle: { fontFamily: font.display, fontSize: 20, fontWeight: 700, lineHeight: '28px', letterSpacing: 0.1, color: color.text, fontFeatureSettings: lnum },
  subsectionTitle: { fontSize: 16, fontWeight: 700, lineHeight: '24px', letterSpacing: -0.31, color: color.text },
  metricLarge:  { fontFamily: font.display, fontSize: 20, fontWeight: 400, lineHeight: '28px', letterSpacing: 0.3, color: color.text, fontFeatureSettings: lnum },
  metricMedium: { fontSize: 16, fontWeight: 400, lineHeight: '24px', letterSpacing: -0.31, color: color.subdued, fontFeatureSettings: lnum },
  label:        { fontSize: 14, fontWeight: 600, lineHeight: '20px', letterSpacing: -0.15, color: color.text },
  body:         { fontSize: 14, fontWeight: 400, lineHeight: '20px', letterSpacing: -0.15, color: color.text },
  bodySmall:    { fontSize: 13, fontWeight: 400, lineHeight: '20px', color: color.text },
  caption:      { fontSize: 12, fontWeight: 400, lineHeight: '16px', color: color.subdued },
  link:         { fontSize: 14, fontWeight: 600, lineHeight: '20px', letterSpacing: -0.15, color: color.actionPrimary, cursor: 'pointer' },
}

export const radius = { sm: 4, md: 6, lg: 8, xl: 12, pill: 20 }

export const shadow = {
  button:       '0 1px 0.5px rgba(33,37,44,0.06)',
  control:      '0px 1px 1px 0px rgba(33,37,44,0.16)',
  buttonPrimary:'0px 1px 1px 0px rgba(47,14,99,0.32)',
  popover:      '0px 15px 35px 0px rgba(48,49,61,0.08), 0px 5px 15px 0px rgba(0,0,0,0.12)',
}

export const ease = {
  standard: 'cubic-bezier(0.2, 0, 0.1, 1)',
  fast: '100ms cubic-bezier(0.2, 0, 0.1, 1)',
  inOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
}
