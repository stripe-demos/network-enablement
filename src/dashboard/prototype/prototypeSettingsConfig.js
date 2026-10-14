export const DASHBOARD_PROTOTYPE_SETTINGS = {
  theme: 'light',
  surface: 'dashboard',
  // The circle sits above the 48px Developers bar. With wireframe on, the
  // bar docks at the bottom edge and the page shrinks, Developers bar included.
  bottomOffset: 64,
  // Sized to the whole viewport (100vh) in Dashboard's own layout.
  fitSelectors: ['.dashboard-root', '.dash-sidebar-nav'],
  palette: {
    bg: '#FFFFFF',
    block: '#E3E8EE',
    subtle: '#F6F8FA',
    border: '#E3E8EE',
    text: '#6A7383',
    // The Developers bar (`data-wireframe-tone="dark"`) keeps its dark colors.
    darkBg: '#1B1F27',
    darkBlock: '#2B303B',
    darkBorder: '#2B303B',
  },
  // Customize picks these as a whole. `data-wireframe-role` marks Dashboard
  // components that have no stable class.
  charts: ['[data-wireframe-role="chart"]'],
  // Rendered outside their charts, so they're listed separately.
  chartHoverCards: ['[data-wireframe-role="chart-hover"]'],
  // Customize reveals these as a whole, like charts.
  pickGroups: ['.dashboard-home-console-input'],
  defaultFlowLabel: 'All dashboard',
  // The pen and bar are hidden. Pages marked `data-wireframe-default`
  // (Connect › Enablement) still show as wireframes.
  controls: false,
};
