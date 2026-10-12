// Wireframe colors for prototypes that don't supply their own: soft grays on a
// light page, darker grays on a dark one, both keyed to the page's own
// background so the wireframe sits naturally on it.

const LIGHT = { block: '#E3E8EE', subtle: '#F6F8FA', border: '#E3E8EE', text: '#6A7383' };
const DARK = { block: '#252528', subtle: '#171719', border: '#2C2C30', text: '#A0A0AA' };
const WHITE = { r: 255, g: 255, b: 255 };

function parseColor(value) {
  const match = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  return alpha > 0 ? { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) } : null;
}

// The first opaque background on the body or page. Anything the browser reports
// in a format other than rgb() (e.g. a wide-gamut color) falls back to white.
function pageBackground() {
  for (const el of [document.body, document.documentElement]) {
    const color = parseColor(getComputedStyle(el).backgroundColor);
    if (color) return color;
  }
  return WHITE;
}

const isDark = ({ r, g, b }) => (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;

/** `light` or `dark`, matching the page's background. Used for the control theme. */
export function pageTheme() {
  return isDark(pageBackground()) ? 'dark' : 'light';
}

/** A complete wireframe palette based on the page's current background. */
export function derivePalette() {
  const background = pageBackground();
  const { r, g, b } = background;
  return { bg: `rgb(${r}, ${g}, ${b})`, ...(isDark(background) ? DARK : LIGHT) };
}
