// Wireframe mode stays dark in Console, using its dark surface tokens.
export const CONSOLE_PROTOTYPE_SETTINGS = {
  theme: 'dark',
  surface: 'console',
  palette: {
    bg: '#101012',
    block: '#252528',
    subtle: '#171719',
    border: '#2C2C30',
    text: '#A0A0AA',
  },
  // Customize picks these as a whole.
  charts: ['.chart-shell__subtitle', '.chart-area', '.chart-legend'],
  defaultFlowLabel: 'All Console',
};
