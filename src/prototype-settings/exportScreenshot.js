const UI_SELECTOR = '[data-wireframe-ui]';
const SCROLL_ATTR = 'data-wf-scroll';

// Cloned DOM can't keep scroll positions, so scrolled containers are marked
// beforehand and their children shifted in the clone instead.
function markScrolled() {
  const marked = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.scrollTop || el.scrollLeft) {
      el.setAttribute(SCROLL_ATTR, `${el.scrollLeft} ${el.scrollTop}`);
      marked.push(el);
    }
  }
  return () => marked.forEach(el => el.removeAttribute(SCROLL_ATTR));
}

function applyScroll(cloned) {
  if (!(cloned instanceof Element) || !cloned.hasAttribute(SCROLL_ATTR)) return;
  const [left, top] = cloned.getAttribute(SCROLL_ATTR).split(' ').map(Number);
  for (const child of cloned.children) child.style.translate = `${-left}px ${-top}px`;
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// The docked bar's strip isn't part of the page, so it isn't part of the shot.
function pageHeight() {
  const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ps-bar-h')) || 0;
  return window.innerHeight - bar;
}

/**
 * Downloads the visible page, without the prototype controls, as a grayscale PNG.
 * `holes` stay in color, except for the `covers` inside them, matching the
 * grayscale overlay's mask (see `colorRegions` in the engine).
 */
export async function exportScreenshot(name, { holes = [], covers = [] } = {}) {
  const { domToCanvas } = await import('modern-screenshot');
  const unmark = markScrolled();
  let shot;
  try {
    shot = await domToCanvas(document.documentElement, {
      width: window.innerWidth,
      height: pageHeight(),
      scale: window.devicePixelRatio,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      filter: node => !(node instanceof Element && node.matches(UI_SELECTOR)),
      onCloneEachNode: applyScroll,
    });
  } finally {
    unmark();
  }

  // Wireframe mode is grayscale through a backdrop filter, which cloned DOM can't render.
  const out = document.createElement('canvas');
  out.width = shot.width;
  out.height = shot.height;
  const ctx = out.getContext('2d');
  ctx.filter = 'grayscale(1)';
  ctx.drawImage(shot, 0, 0);
  const scale = shot.width / window.innerWidth;
  const region = rects => {
    const path = new Path2D();
    for (const r of rects) path.rect(r.left * scale, r.top * scale, (r.right - r.left) * scale, (r.bottom - r.top) * scale);
    return path;
  };
  for (const [rects, filter] of [[holes, 'none'], [covers, 'grayscale(1)']]) {
    if (!rects.length) continue;
    ctx.save();
    ctx.filter = filter;
    ctx.clip(region(rects));
    ctx.drawImage(shot, 0, 0);
    ctx.restore();
  }
  // The wireframe blocks live on the engine's own viewport-sized canvas.
  const blocks = document.querySelector('.wf-canvas');
  if (blocks) ctx.drawImage(blocks, 0, 0);

  const link = document.createElement('a');
  link.download = `${name}-${timestamp()}.png`;
  link.href = out.toDataURL('image/png');
  link.click();
}
