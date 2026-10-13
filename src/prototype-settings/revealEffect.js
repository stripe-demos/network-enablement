// The "outline dissolve" that plays when wireframe turns on. A ring sweeps
// outward from the pen button. Along its leading edge the blocks are bare
// purple outlines; behind it the outlines fade while the fill comes in, until
// the finished wireframe is left. `playLeave` is the same sweep run backward
// when wireframe turns off.
//
// It stays light on purpose: nothing is measured or laid out here. Each frame
// draws the engine's finished canvas (a GPU copy) a few times through ring
// clips, plus one outline pass over the engine's existing shapes, on a single
// extra canvas that is removed when the effect ends.

const DURATION_MS = 720;
const TAU = Math.PI * 2;
const OUTLINE_WIDTH = 1.25;
// Distance behind the leading edge at which a block is fully filled.
const SETTLED = 240;
// From the leading edge inward: outlines first, then the fill takes over.
const BANDS = [
  { from: 0, to: 70, stroke: 1, fill: 0 },
  { from: 70, to: 150, stroke: 0.5, fill: 0.45 },
  { from: 150, to: SETTLED, stroke: 0.22, fill: 0.85 },
];

export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const easeOut = t => 1 - (1 - t) ** 3;

function reachFrom(origin) {
  return Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  ) + SETTLED;
}

/**
 * Creates the effect canvas and returns `paint(front)`, which draws the dissolve
 * with its leading edge `front` pixels from the origin.
 *
 * @param source       the engine's canvas, whose finished frame is the fill
 * @param getPaths     returns the engine's current block shapes, for the outlines
 * @param origin       `{ x, y }` in viewport pixels where the ring starts
 * @param outlinesOnly skip the fill, for when something else supplies it
 */
function createPainter({ source, getPaths, origin, color, outlinesOnly = false }) {
  const fx = document.createElement('canvas');
  fx.className = 'wf-fx';
  fx.setAttribute('data-wireframe-ui', '');
  fx.setAttribute('aria-hidden', 'true');
  // On <html>, after the grayscale overlay, so the purple isn't desaturated.
  document.documentElement.appendChild(fx);
  const ctx = fx.getContext('2d');

  function ring(outer, inner) {
    const path = new Path2D();
    path.arc(origin.x, origin.y, outer, 0, TAU);
    if (inner > 0) {
      path.moveTo(origin.x + inner, origin.y);
      path.arc(origin.x, origin.y, inner, 0, TAU);
    }
    return path;
  }

  function paint(front) {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (fx.width !== width * dpr || fx.height !== height * dpr) {
      fx.width = width * dpr;
      fx.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!outlinesOnly && front > SETTLED) {
      ctx.save();
      ctx.clip(ring(front - SETTLED, 0));
      ctx.drawImage(source, 0, 0, width, height);
      ctx.restore();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = OUTLINE_WIDTH;
    const paths = getPaths();
    for (const band of BANDS) {
      const outer = front - band.from;
      if (outer <= 0) continue;
      ctx.save();
      ctx.clip(ring(outer, Math.max(front - band.to, 0)), 'evenodd');
      if (band.fill && !outlinesOnly) {
        ctx.globalAlpha = band.fill;
        ctx.drawImage(source, 0, 0, width, height);
      }
      ctx.globalAlpha = band.stroke;
      for (const path of paths) ctx.stroke(path);
      ctx.restore();
    }
  }

  return { fx, paint };
}

/**
 * @param source   the engine's canvas, whose finished frame is the fill
 * @param getPaths returns the engine's current block shapes, for the outlines
 * @param origin   `{ x, y }` in viewport pixels where the ring starts
 * @param reverse  play backward: the ring contracts back into the origin
 * @returns `cancel()`, which removes the effect without calling `onDone`
 */
export function playReveal({ source, getPaths, origin, color, reverse = false, onDone }) {
  const { fx, paint } = createPainter({ source, getPaths, origin, color });
  const reach = reachFrom(origin);
  const started = performance.now();
  let frame = 0;

  function end() {
    cancelAnimationFrame(frame);
    fx.remove();
  }

  function step(now) {
    const t = Math.min((now - started) / DURATION_MS, 1);
    // Backward is the same sweep with time reversed.
    paint(reach * easeOut(reverse ? 1 - t : t));
    if (t < 1) {
      frame = requestAnimationFrame(step);
    } else {
      end();
      onDone?.();
    }
  }

  frame = requestAnimationFrame(step);
  return end;
}

/**
 * Turns wireframe off without the real page showing through the blocks. The
 * browser snapshots the page while it still looks like a wireframe, `teardown()`
 * restores the real page underneath, and the snapshot is wiped away by a ring
 * contracting into `origin`: the real UI only shows where the ring has passed.
 * The leading edge is feathered like the dissolve, with outlines drawn over it.
 *
 * The docked bar and the pen button stay live on their own layers, so they keep
 * animating while the snapshot retreats (see "Leaving wireframe" in the CSS).
 *
 * @returns whether it started; when false, `teardown` has not been called
 */
export function playLeave({ getPaths, origin, color, mask, teardown, onDone }) {
  if (!document.startViewTransition) return false;

  const root = document.documentElement;
  // React has already dropped its grayscale overlay, but the snapshot needs it.
  const gray = document.createElement('div');
  gray.className = 'ps-grayscale';
  gray.setAttribute('data-wireframe-ui', '');
  gray.setAttribute('aria-hidden', 'true');
  // Picks shown in color stay in color in the snapshot.
  if (mask) gray.style.mask = mask;
  root.appendChild(gray);

  root.setAttribute('data-ps-leaving', '');
  root.style.setProperty('--ps-leave-x', `${origin.x}px`);
  root.style.setProperty('--ps-leave-y', `${origin.y}px`);

  const reach = reachFrom(origin);
  root.style.setProperty('--ps-leave-start', `${reach}px`);
  let painter = null;
  let frame = 0;

  function cleanup() {
    cancelAnimationFrame(frame);
    painter?.fx.remove();
    gray.remove();
    root.removeAttribute('data-ps-leaving');
    root.style.removeProperty('--ps-leave-x');
    root.style.removeProperty('--ps-leave-y');
    root.style.removeProperty('--ps-leave-start');
  }

  const transition = document.startViewTransition(() => {
    teardown();
    gray.remove();
    painter = createPainter({ getPaths, origin, color, outlinesOnly: true });
    painter.paint(reach);
  });

  transition.ready
    .then(() => {
      const started = performance.now();
      // The outlines follow the same curve as the snapshot's ring in the CSS
      // (`ps-leave-ring`): 1 - t³ is the dissolve's ease-out run backward.
      const front = t => reach * (1 - t ** 3);
      const step = now => {
        const t = Math.min((now - started) / DURATION_MS, 1);
        painter?.paint(front(t));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    })
    .catch(() => {});

  transition.finished.finally(() => {
    cleanup();
    onDone?.();
  });
  return true;
}
