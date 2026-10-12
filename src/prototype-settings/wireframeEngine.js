// Converts the live page into a wireframe without touching layout. Styles in
// prototypeSettings.css flatten colors once each element is classified with
// `data-wf`; text, icons, and media are painted as rounded blocks on a canvas
// overlay so each line of text keeps its exact position and width. Text inside
// elements matching `keep` (marked `data-wf-keep`) stays real.

import { playLeave, playReveal, prefersReducedMotion } from './revealEffect';

const UI_SELECTOR = '[data-wireframe-ui]';
// Areas that stay dark in a light wireframe, using the palette's dark colors.
const DARK_ZONE = '[data-wireframe-tone="dark"]';
// Content shown at full fidelity in Custom mode (see customPicker.js).
const REVEALED = '[data-wf-reveal], [data-wf-preview]';
const SKIPPED_TAGS = new Set(['script', 'style', 'noscript', 'template', 'title', 'textarea', 'select', 'option']);
const SHAPE_TAGS = new Set(['rect', 'path', 'circle', 'ellipse', 'polygon', 'polyline', 'line']);
const TEXT_FIELDS = 'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="number"], input[type="tel"], input[type="url"], input[type="password"]';
const ICON_MAX_SIZE = 40;
const CONTROL_MAX_HEIGHT = 48;
const CONTROL_MAX_WIDTH = 400;
const OPAQUE_ALPHA = 0.9;
const TEXT_BAR_RATIO = 0.62;
// Kept text below this contrast against the wireframe background (e.g. white
// text from a bar that was dark) switches to the palette's text color.
const MIN_KEPT_CONTRAST = 2;
const RADIUS = 4;
// Keep redrawing briefly after each change so CSS transitions settle. Changes
// that can't start a transition (scrolling, hovering, previews) need far fewer.
const SETTLE_FRAMES = 12;
const QUICK_SETTLE_FRAMES = 3;
// A redraw longer than this makes the engine wait before the next one, so it
// never takes more than a fraction of the page's frame time (see `tick`).
const TICK_BUDGET_MS = 6;
const TICK_BACKOFF = 1.5;
// A page that animates through inline styles (a rotating placeholder, a number
// ticking up) changes `style` on every frame. Those changes are followed at most
// this often, once each, instead of keeping the engine redrawing every frame.
const ANIMATION_GAP_MS = 80;

function alphaOf(color) {
  if (!color || color === 'transparent') return 0;
  const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
  if (slash) return slash[2] ? Number(slash[1]) / 100 : Number(slash[1]);
  const rgba = color.match(/^rgba\(.*,\s*([\d.]+)\)$/);
  return rgba ? Number(rgba[1]) : 1;
}

function luminance(color) {
  const hex = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  const rgb = hex ? hex.slice(1).map(h => parseInt(h, 16)) : color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)?.slice(1).map(Number);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function hasPaint(value) {
  return value && value !== 'none' && alphaOf(value) > 0;
}

function kindOf(el) {
  if (el instanceof SVGElement) {
    if (el.localName === 'svg') {
      const { width, height } = el.getBoundingClientRect();
      if (!width && !height) return null;
      return width <= ICON_MAX_SIZE && height <= ICON_MAX_SIZE ? 'icon' : 'chart';
    }
    const svg = el.closest('svg[data-wf]');
    if (!svg) return null;
    if (svg.dataset.wf === 'icon' || !SHAPE_TAGS.has(el.localName)) return 'plain';
    const style = getComputedStyle(el);
    const paint = ['shape'];
    if (hasPaint(style.fill)) paint.push('paint-fill');
    if (hasPaint(style.stroke)) paint.push('paint-stroke');
    return paint.join(' ');
  }

  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  if (['img', 'video', 'canvas', 'iframe'].includes(el.localName)) return 'media';

  const style = getComputedStyle(el);
  if (style.backgroundImage.includes('url(') && !el.firstElementChild && !el.textContent.trim()) return 'media';
  if (alphaOf(style.backgroundColor) < OPAQUE_ALPHA) return 'plain';
  return rect.height <= CONTROL_MAX_HEIGHT && rect.width <= CONTROL_MAX_WIDTH ? 'control' : 'surface';
}

function pseudoKindOf(el, pseudo) {
  const style = getComputedStyle(el, pseudo);
  if (style.content === 'none' || style.content === 'normal') return null;
  if (alphaOf(style.backgroundColor) < OPAQUE_ALPHA) return 'plain';
  const width = parseFloat(style.width);
  const height = parseFloat(style.height);
  // Small opaque pseudo-elements are usually dots, thumbs, or markers.
  return height <= CONTROL_MAX_HEIGHT && width <= CONTROL_MAX_WIDTH ? 'block' : 'surface';
}

const SIDES = [['Top', 't'], ['Right', 'r'], ['Bottom', 'b'], ['Left', 'l']];

// Elements that can paint over other content. Everything else stays in its own
// place in the flow, so text it doesn't overlap never needs a hit test. Hit
// tests look straight through pointer-transparent and hidden elements, so
// those never count as covering anything.
const LAYER_POSITIONS = new Set(['fixed', 'absolute', 'sticky']);
const isLayer = style => (
  style.pointerEvents !== 'none'
  && style.visibility === 'visible'
  && (LAYER_POSITIONS.has(style.position) || style.transform !== 'none' || (style.position !== 'static' && style.zIndex !== 'auto'))
);

const hasLine = (style, width) => style !== 'none' && style !== 'hidden' && parseFloat(width) > 0;

// Which edges draw a line, for `data-wf-border` (all evened out to 1px in CSS):
// border sides, and box-shadow rings (no offset or blur) that stand in for
// borders. A ring on top of a border would double it, so it's dropped. Borders
// can't be evened out in CSS alone: Tailwind gives every element a solid,
// zero-width border style.
function borderFlagsOf(style) {
  const flags = SIDES.filter(([side]) => hasLine(style[`border${side}Style`], style[`border${side}Width`])).map(([, flag]) => flag);
  if (style.boxShadow !== 'none') {
    const rings = style.boxShadow.split(/,(?![^(]*\))/).filter(shadow => {
      const [x = 0, y = 0, blur = 0, spread = 0] = (shadow.match(/-?[\d.]+px/g) ?? []).map(parseFloat);
      return !x && !y && !blur && spread > 0;
    });
    if (rings.length) {
      if (flags.length) flags.push('no-ring');
      else flags.push(rings.some(r => r.includes('inset')) ? 'ring-inset' : 'ring');
    }
  }
  return flags.join(' ');
}

function isVisible(el) {
  return el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
}

// Neighboring strings on a line (e.g. a bold label and the sentence after it)
// would almost touch, so they're pulled apart to at least this gap.
const MIN_TEXT_GAP = 8;
const MIN_TEXT_WIDTH = 4;

function spacedOut(parts) {
  const lines = new Map();
  for (const part of parts) {
    const key = Math.round((part.top + part.bottom) / 2);
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push(part);
  }
  for (const line of lines.values()) {
    line.sort((a, b) => a.left - b.left);
    for (let i = 1; i < line.length; i += 1) {
      const before = line[i - 1];
      const after = line[i];
      const gap = after.left - before.right;
      if (gap >= MIN_TEXT_GAP || gap < -MIN_TEXT_GAP) continue;
      const trim = (MIN_TEXT_GAP - gap) / 2;
      before.right = Math.max(before.left + MIN_TEXT_WIDTH, before.right - trim);
      after.left = Math.min(after.right - MIN_TEXT_WIDTH, after.left + trim);
    }
  }
  return parts;
}

const splitTopLevel = value => value.split(/,(?![^(]*\))/).map(part => part.trim());

// Gray-only gradients are fades and scrims that hide content scrolling beneath
// them (e.g. Console's composer dock), so they stay; colorful ones are stripped.
function isNeutralGradient(backgroundImage) {
  if (!backgroundImage.includes('gradient(') || backgroundImage.includes('url(')) return false;
  const colors = backgroundImage.match(/rgba?\([^)]*\)/g) ?? [];
  return colors.every(color => {
    const [r, g, b, a = 1] = color.match(/[\d.]+/g).map(Number);
    return a === 0 || Math.max(r, g, b) - Math.min(r, g, b) <= 24;
  });
}

const GRADIENT_SIDES = { top: 0, right: 90, bottom: 180, left: 270 };

// Opacity of a fade's first linear gradient at a viewport point, or 0 if it can't tell.
function fadeAlphaAt(style, rect, x, y) {
  const body = style.backgroundImage.match(/linear-gradient\((.*)\)/)?.[1];
  if (!body) return 0;
  const parts = splitTopLevel(body);
  let angle = 180;
  if (parts[0].startsWith('to ')) angle = GRADIENT_SIDES[parts.shift().slice(3)] ?? 180;
  else if (parts[0].endsWith('deg')) angle = Math.round(parseFloat(parts.shift()) / 90) * 90 % 360;
  const vertical = angle === 0 || angle === 180;
  const length = vertical ? rect.height : rect.width;
  const offset = { 0: rect.bottom - y, 90: x - rect.left, 180: y - rect.top, 270: rect.right - x }[angle];
  const t = offset / length;
  const stops = parts.map((part, i) => {
    const alpha = part.startsWith('transparent') ? 0 : alphaOf(part.match(/rgba?\([^)]*\)/)?.[0]);
    const position = part.match(/(-?[\d.]+)(px|%)\s*$/);
    const at = position ? (position[2] === '%' ? Number(position[1]) / 100 : Number(position[1]) / length) : i / Math.max(1, parts.length - 1);
    return { alpha, at };
  });
  let previous = stops[0];
  for (const stop of stops) {
    if (t <= stop.at) {
      const span = stop.at - previous.at;
      return span > 0 ? previous.alpha + (stop.alpha - previous.alpha) * ((t - previous.at) / span) : stop.alpha;
    }
    previous = stop;
  }
  return previous.alpha;
}

// Fades that ignore the pointer are invisible to `elementsFromPoint`, so their
// mostly opaque parts are checked separately.
function isUnderFade(el, x, y, fades) {
  return fades.some(({ fade, style, rect }) => (
    !fade.contains(el) && !el.contains(fade)
    && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    && fadeAlphaAt(style, rect, x, y) * Number(style.opacity) >= 0.5
  ));
}

// The topmost page element at a point. Prototype controls (e.g. a dialog
// backdrop) never hide the page beneath them. `elementFromPoint` is several times
// cheaper than the full stack, which is only needed under a control.
function pageElementAt(x, y) {
  const top = document.elementFromPoint(x, y);
  if (top && !top.closest(UI_SELECTOR)) return top;
  return document.elementsFromPoint(x, y).find(node => !node.closest(UI_SELECTOR));
}

function isOnTop(el, x, y) {
  const hit = pageElementAt(x, y);
  return Boolean(hit) && (hit === el || el.contains(hit) || hit.contains(el));
}

const textFilter = {
  acceptNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
    if (SKIPPED_TAGS.has(node.localName) || node.matches(UI_SELECTOR) || node.matches(REVEALED) || node.hasAttribute('data-wf-keep')) {
      return NodeFilter.FILTER_REJECT;
    }
    return NodeFilter.FILTER_SKIP;
  },
};

// `intro` is `{ x, y }` where the outline dissolve starts (the pen button), or
// nothing to turn wireframe on without it (e.g. on page load).
// A wireframe that is waiting out its `delay` before leaving (see `stop`).
let pendingLeave = null;

export function startWireframe({ palette, keep: initialKeep = '', intro }) {
  pendingLeave?.();
  // A previous run's outro can still be fading out.
  document.querySelectorAll('.wf-canvas[data-leaving], .wf-fx').forEach(el => el.remove());
  let keep = initialKeep;
  const root = document.documentElement;
  const cssVar = name => `--wf-${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`;
  for (const [name, value] of Object.entries(palette)) root.style.setProperty(cssVar(name), value);
  root.dataset.wireframe = 'on';

  const canvas = document.createElement('canvas');
  canvas.className = 'wf-canvas';
  canvas.setAttribute('data-wireframe-ui', '');
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const measureCtx = document.createElement('canvas').getContext('2d');
  const range = document.createRange();

  let frame = 0;
  let settleFrames = 0;
  let stopped = false;
  let pendingIntro = intro && !prefersReducedMotion() ? intro : null;
  let reveal = null;
  const accent = palette.accent ?? '#675DFF';
  const currentShapes = () => [blocks, darkBlocks];
  const bgLuminance = luminance(palette.bg);
  // Lets CSS pick, e.g., the Custom cursor that reads on this surface.
  root.dataset.wfSurface = bgLuminance > 0.5 ? 'light' : 'dark';
  const darkBgLuminance = palette.darkBg ? luminance(palette.darkBg) : bgLuminance;
  const contrastChecked = new WeakSet();
  const inDarkZone = el => Boolean(palette.darkBg && el.closest(DARK_ZONE));

  function checkKeptContrast(root) {
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (contrastChecked.has(el)) continue;
      contrastChecked.add(el);
      if (![...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.data.trim())) continue;
      const textLuminance = luminance(getComputedStyle(el).color);
      const background = inDarkZone(el) ? darkBgLuminance : bgLuminance;
      if (textLuminance !== null && contrast(textLuminance, background) < MIN_KEPT_CONTRAST) {
        el.setAttribute('data-wf-contrast', '');
      }
    }
  }

  function classify() {
    if (keep) {
      for (const el of document.body.querySelectorAll(keep)) {
        if (!el.hasAttribute('data-wf-keep')) el.setAttribute('data-wf-keep', '');
        checkKeptContrast(el);
      }
    }
    for (const el of document.body.querySelectorAll(':not([data-wf])')) {
      if (el.closest(UI_SELECTOR)) continue;
      const kind = kindOf(el);
      if (!kind) continue;
      el.dataset.wf = kind;
      if (el instanceof SVGElement) continue;
      const before = pseudoKindOf(el, '::before');
      const after = pseudoKindOf(el, '::after');
      if (before) el.dataset.wfBefore = before;
      if (after) el.dataset.wfAfter = after;
    }
    // Measured while unmarked, so the evened-out widths and stripped gradients
    // never feed back in.
    for (const el of document.body.querySelectorAll(':not([data-wf-border])')) {
      if (el instanceof SVGElement || el.closest(UI_SELECTOR)) continue;
      const style = getComputedStyle(el);
      el.dataset.wfBorder = borderFlagsOf(style);
      if (isLayer(style)) el.dataset.wfLayer = '';
      else delete el.dataset.wfLayer;
      if (style.backgroundImage === 'none') delete el.dataset.wfGradient;
      else el.dataset.wfGradient = style.backgroundClip !== 'text' && isNeutralGradient(style.backgroundImage) ? 'fade' : 'strip';
    }
  }

  function visibleFades() {
    const fades = [];
    for (const fade of document.querySelectorAll('[data-wf-gradient="fade"]')) {
      const style = getComputedStyle(fade);
      if (style.pointerEvents !== 'none' || !Number(style.opacity) || !isVisible(fade)) continue;
      fades.push({ fade, style, rect: fade.getBoundingClientRect() });
    }
    return fades;
  }

  // A class or style change can change borders and backgrounds anywhere beneath it.
  function remeasure(records) {
    for (const record of records) {
      if (record.type !== 'attributes' || !['class', 'style'].includes(record.attributeName)) continue;
      const target = record.target;
      if (!(target instanceof Element)) continue;
      for (const el of [target, ...target.querySelectorAll('[data-wf-border]')]) {
        el.removeAttribute('data-wf-border');
        el.removeAttribute('data-wf-gradient');
      }
    }
  }

  let blocks = new Path2D();
  let darkBlocks = new Path2D();

  function addBlock(el, x, y, width, height) {
    const path = inDarkZone(el) ? darkBlocks : blocks;
    path.roundRect(x, y, width, height, Math.min(RADIUS, width / 2, height / 2));
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    blocks = new Path2D();
    darkBlocks = new Path2D();
    const fades = visibleFades();
    const layers = [];
    for (const el of document.querySelectorAll('[data-wf-layer]')) {
      const r = el.getBoundingClientRect();
      if (r.width >= 1 && r.height >= 1 && r.bottom > 0 && r.top < height && r.right > 0 && r.left < width) {
        layers.push({ el, left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }

    const inViewport = r => r.bottom > 0 && r.top < height && r.right > 0 && r.left < width;

    // The visible area left after every ancestor that hides overflow (collapsed
    // sections, scroll areas, cards) has clipped it.
    const viewport = { left: 0, top: 0, right: width, bottom: height };
    const clips = new Map();
    function clipOf(el) {
      if (!el || el === document.body) return viewport;
      if (clips.has(el)) return clips.get(el);
      const style = getComputedStyle(el);
      let clip = style.position === 'fixed' ? viewport : clipOf(el.parentElement);
      const clipsX = style.overflowX !== 'visible';
      const clipsY = style.overflowY !== 'visible';
      if (clipsX || clipsY) {
        const r = el.getBoundingClientRect();
        clip = {
          left: clipsX ? Math.max(clip.left, r.left) : clip.left,
          right: clipsX ? Math.min(clip.right, r.right) : clip.right,
          top: clipsY ? Math.max(clip.top, r.top) : clip.top,
          bottom: clipsY ? Math.min(clip.bottom, r.bottom) : clip.bottom,
        };
      }
      clips.set(el, clip);
      return clip;
    }

    // The part of a block its clip leaves visible, if it's also on top.
    function visiblePart(el, clip, x, y, w, h) {
      const left = Math.max(x, clip.left);
      const right = Math.min(x + w, clip.right);
      const top = Math.max(y, clip.top);
      const bottom = Math.min(y + h, clip.bottom);
      if (right - left < 1 || bottom - top < 1) return null;
      const middle = (top + bottom) / 2;
      const center = (left + right) / 2;
      if (isUnderFade(el, center, middle, fades)) return null;
      // Hit tests are the costliest thing here, so only text that a layer
      // overlaps gets one. Pointer-transparent content (like a rotating
      // placeholder over an input) always does: hit tests look through it.
      if (!layerOver(el, left, top, right, bottom) && !ignoresPointer(el)) return { el, left, top, right, bottom };
      if (!isOnTop(el, center, middle)) return null;
      const shownLeft = Math.max(left, uncoveredEdge(el, left + 1, middle, 'right') ?? left);
      const shownRight = Math.min(right, uncoveredEdge(el, right - 1, middle, 'left') ?? right);
      if (shownRight - shownLeft < 1) return null;
      return { el, left: shownLeft, top, right: shownRight, bottom };
    }

    const passive = new Map();
    function ignoresPointer(el) {
      if (!passive.has(el)) passive.set(el, getComputedStyle(el).pointerEvents === 'none');
      return passive.get(el);
    }

    // Whether some other layer (menu, dialog, sticky bar...) covers part of the area.
    function layerOver(el, left, top, right, bottom) {
      return layers.some(layer => (
        layer.left < right && layer.right > left && layer.top < bottom && layer.bottom > top
        && !layer.el.contains(el) && !el.contains(layer.el)
      ));
    }

    // Where a block's end is covered by something else (e.g. an open menu), the
    // coverer's facing edge, so the block stops there.
    function uncoveredEdge(el, x, y, side) {
      const hit = pageElementAt(x, y);
      if (!hit || hit === el || el.contains(hit) || hit.contains(el)) return null;
      return hit.getBoundingClientRect()[side];
    }

    function addVisible(el, clip, x, y, w, h) {
      const part = visiblePart(el, clip, x, y, w, h);
      if (part) addBlock(el, part.left, part.top, part.right - part.left, part.bottom - part.top);
    }

    const textParts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, textFilter);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.data.trim()) continue;
      const parent = node.parentElement;
      if (!parent.hasAttribute('data-wf-text')) parent.setAttribute('data-wf-text', '');
      const bounds = parent.getBoundingClientRect();
      if (!inViewport(bounds) || !isVisible(parent)) continue;
      range.selectNodeContents(node);
      const clip = clipOf(parent);
      for (const r of range.getClientRects()) {
        const left = Math.max(r.left, bounds.left);
        const right = Math.min(r.right, bounds.right);
        if (right - left < 1 || r.height < 1) continue;
        const barHeight = Math.max(4, Math.round(r.height * TEXT_BAR_RATIO));
        const part = visiblePart(parent, clip, left, r.top + (r.height - barHeight) / 2, right - left, barHeight);
        if (part) textParts.push(part);
      }
    }
    for (const part of spacedOut(textParts)) {
      addBlock(part.el, part.left, part.top, part.right - part.left, part.bottom - part.top);
    }

    for (const el of document.querySelectorAll('[data-wf="icon"], [data-wf="media"]')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || !inViewport(r) || el.closest(REVEALED)) continue;
      if (el.parentElement && !isVisible(el.parentElement)) continue;
      addVisible(el, clipOf(el.parentElement), r.left, r.top, r.width, r.height);
    }

    // Field values and placeholders aren't text nodes, so measure them.
    for (const field of document.querySelectorAll(TEXT_FIELDS)) {
      const text = field.value || field.placeholder;
      if (!text || field.closest(`[data-wf-keep], [data-wireframe-ui], ${REVEALED}`)) continue;
      const r = field.getBoundingClientRect();
      if (!r.width || !r.height || !inViewport(r) || !isVisible(field)) continue;
      const style = getComputedStyle(field);
      measureCtx.font = style.font;
      const padLeft = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
      const padRight = parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth);
      const textWidth = Math.min(measureCtx.measureText(text.split('\n')[0]).width, r.width - padLeft - padRight);
      if (textWidth < 1) continue;
      const barHeight = Math.max(4, Math.round(parseFloat(style.fontSize) * 1.2 * TEXT_BAR_RATIO));
      const top = field.localName === 'textarea'
        ? r.top + parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth) + (parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2) / 2 - barHeight / 2
        : r.top + (r.height - barHeight) / 2;
      addVisible(field, clipOf(field), r.left + padLeft, top, textWidth, barHeight);
    }

    ctx.fillStyle = palette.block;
    ctx.fill(blocks);
    if (palette.darkBlock) {
      ctx.fillStyle = palette.darkBlock;
      ctx.fill(darkBlocks);
    }
  }

  // The dissolve starts once there is a finished frame to dissolve into. The
  // canvas keeps drawing underneath; it is just hidden until the effect ends.
  function startIntro() {
    canvas.style.visibility = 'hidden';
    reveal = playReveal({
      source: canvas,
      getPaths: currentShapes,
      origin: pendingIntro,
      color: accent,
      onDone: () => {
        canvas.style.visibility = '';
        reveal = null;
      },
    });
    pendingIntro = null;
  }

  // After a slow redraw the engine sits out a few frames, so on a heavy page it
  // never starves the page's own animations and scrolling.
  let nextTickAt = 0;

  function tick() {
    frame = 0;
    if (performance.now() < nextTickAt) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const started = performance.now();
    classify();
    draw();
    if (pendingIntro) startIntro();
    const took = performance.now() - started;
    nextTickAt = took > TICK_BUDGET_MS ? started + took * (1 + TICK_BACKOFF) : 0;
    settleFrames -= 1;
    if (settleFrames > 0) frame = requestAnimationFrame(tick);
  }

  function schedule(frames = SETTLE_FRAMES) {
    if (stopped) return;
    settleFrames = Math.max(settleFrames, frames);
    if (!frame) frame = requestAnimationFrame(tick);
  }
  const scheduleQuick = () => schedule(QUICK_SETTLE_FRAMES);

  // One redraw per `ANIMATION_GAP_MS` at most, however many style changes arrive.
  let lastAnimationRedraw = 0;
  let animationTimer = 0;
  function scheduleAnimation() {
    if (stopped) return;
    const wait = lastAnimationRedraw + ANIMATION_GAP_MS - performance.now();
    if (wait > 0) {
      if (!animationTimer) {
        animationTimer = setTimeout(() => {
          animationTimer = 0;
          scheduleAnimation();
        }, wait);
      }
      return;
    }
    lastAnimationRedraw = performance.now();
    schedule(1);
  }

  // Picking and previewing content only changes what's revealed, which the
  // next redraw already shows.
  const REVEAL_ATTRIBUTES = new Set(['data-wf-reveal', 'data-wf-preview']);
  const observer = new MutationObserver(records => {
    remeasure(records);
    const revealOnly = records.every(r => r.type === 'attributes' && REVEAL_ATTRIBUTES.has(r.attributeName));
    const styleOnly = records.every(r => r.type === 'attributes' && r.attributeName === 'style');
    // Swapped text and nodes don't start the CSS transitions that classes do, so
    // they settle quickly.
    const contentOnly = records.every(r => r.type !== 'attributes' || r.attributeName === 'style');
    if (styleOnly) scheduleAnimation();
    else schedule(revealOnly || contentOnly ? QUICK_SETTLE_FRAMES : SETTLE_FRAMES);
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'open', 'data-wf-reveal', 'data-wf-preview'],
  });

  const documentEvents = ['scroll', 'input', 'transitionend', 'animationend', 'pointerover', 'pointerout'];
  for (const type of documentEvents) document.addEventListener(type, scheduleQuick, { capture: true, passive: true });
  window.addEventListener('resize', scheduleQuick);
  document.fonts?.ready.then(() => schedule());
  schedule();

  // Changes what stays real without tearing the engine down and reclassifying
  // the whole page (e.g. when switching between editing and done).
  function setKeep(next) {
    if (next === keep) return;
    keep = next;
    for (const el of document.querySelectorAll('[data-wf-keep], [data-wf-text]')) {
      el.removeAttribute('data-wf-keep');
      el.removeAttribute('data-wf-text');
    }
    schedule();
  }

  // `outro` is `{ x, y }` where the dissolve ends: the wireframe is wiped away
  // by a ring contracting into that point, so the real page only shows where the
  // ring has passed. `delay` keeps the wireframe up (and redrawing) that long
  // first, e.g. while the docked bar slides away and the page grows back, so
  // the wireframe being dissolved has neither.
  function stopWireframe({ outro, delay = 0 } = {}) {
    const canLeave = Boolean(outro) && !pendingIntro && !prefersReducedMotion();
    if (canLeave && delay > 0 && document.startViewTransition) {
      schedule(Math.ceil(delay / 16) + 2);
      const timer = setTimeout(() => finish(outro), delay);
      // Turned back on before the delay is up: skip straight to the end.
      pendingLeave = () => {
        clearTimeout(timer);
        finish(null);
      };
      return;
    }
    finish(canLeave ? outro : null);
  }

  function finish(outro) {
    pendingLeave = null;
    if (outro) {
      classify();
      draw();
    }
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(animationTimer);
    reveal?.();
    reveal = null;
    observer.disconnect();
    for (const type of documentEvents) document.removeEventListener(type, scheduleQuick, { capture: true });
    window.removeEventListener('resize', scheduleQuick);
    const leaving = Boolean(outro);
    // The wireframe look is restored in one go, once the browser has taken its
    // snapshot of it (see `playLeave`).
    if (leaving && playLeave({
      getPaths: currentShapes,
      origin: outro,
      color: accent,
      teardown: () => {
        canvas.remove();
        restorePage();
      },
    })) {
      return;
    }
    if (leaving) {
      canvas.style.visibility = 'hidden';
      canvas.setAttribute('data-leaving', '');
      playReveal({
        source: canvas,
        getPaths: currentShapes,
        origin: outro,
        color: accent,
        reverse: true,
        onDone: () => canvas.remove(),
      });
    } else {
      canvas.remove();
    }
    restorePage();
  }

  function restorePage() {
    delete root.dataset.wireframe;
    delete root.dataset.wfSurface;
    for (const name of Object.keys(palette)) root.style.removeProperty(cssVar(name));
    for (const el of document.querySelectorAll('[data-wf], [data-wf-keep], [data-wf-text], [data-wf-contrast], [data-wf-border]')) {
      delete el.dataset.wf;
      delete el.dataset.wfBorder;
      delete el.dataset.wfLayer;
      delete el.dataset.wfGradient;
      delete el.dataset.wfBefore;
      delete el.dataset.wfAfter;
      delete el.dataset.wfKeep;
      delete el.dataset.wfText;
      delete el.dataset.wfContrast;
    }
  }

  return { stop: stopWireframe, setKeep };
}
