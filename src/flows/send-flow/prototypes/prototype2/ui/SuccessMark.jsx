import React from 'react';

/**
 * 72px brand circle inside a lighter halo ring, per 429:227684 — with a pop-in
 * and a confetti burst on mount.
 *
 * The pieces are laid out deterministically rather than randomly: `Math.random`
 * would give a different burst on every re-render, and a fixed ring reads as
 * designed rather than accidental. Each piece carries its own travel vector as
 * CSS custom properties so one keyframe rule animates all of them.
 */

/** Ring sits between the 72px disc and the 104px halo edge. */
const RING_RADIUS = 41;
const RING_LENGTH = Number((2 * Math.PI * RING_RADIUS).toFixed(2));

const PIECE_COUNT = 14;
const INNER_RADIUS = 56; // just outside the halo, so pieces appear to leave it
const OUTER_RADIUS = 104;

/** Confetti colours: brand, plus the badge greens/ambers already in the theme. */
const COLOURS = [
  'var(--color-action)',
  'var(--color-action-link)',
  'var(--color-brand-300, #a9a1ff)',
  'var(--color-badge-success-text, #227f4b)',
  'var(--color-badge-warning-text, #a15c07)',
];

const PIECES = Array.from({ length: PIECE_COUNT }, (_, i) => {
  // Evenly spaced, offset a little each turn so it doesn't look like a clock face.
  const angle = (i / PIECE_COUNT) * Math.PI * 2 + (i % 2 ? 0.22 : -0.12);
  const distance = INNER_RADIUS + ((i * 37) % (OUTER_RADIUS - INNER_RADIUS));
  return {
    id: i,
    dx: `${Math.round(Math.cos(angle) * distance)}px`,
    dy: `${Math.round(Math.sin(angle) * distance)}px`,
    spin: `${(i % 2 ? 1 : -1) * (140 + ((i * 53) % 220))}deg`,
    colour: COLOURS[i % COLOURS.length],
    // Alternating shapes: a couple of long ribbons among round dots.
    square: i % 3 === 0,
    delay: `${(i % 5) * 26}ms`,
  };
});

/**
 * @param {number} [countdown]  ms for the ring to close. Turns the flourish into
 *   a progress meter — the caller advances when it lands, so this is the only
 *   sign the screen isn't waiting for you.
 */
export default function SuccessMark({ countdown }) {
  const timing = countdown
    ? { style: { '--sail-timer': `${countdown}ms` }, ring: 'sail-ring-timer' }
    : { style: undefined, ring: 'sail-ring-draw' };

  return (
    <span
      className="relative mx-auto flex h-[104px] w-[104px] items-center justify-center"
      style={timing.style}
    >
      {/* Burst layer, behind the mark and non-interactive. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {PIECES.map((p) => (
          <span
            key={p.id}
            className={`sail-confetti absolute left-1/2 top-1/2 block ${
              p.square ? 'h-2.5 w-1 rounded-[1px]' : 'h-1.5 w-1.5 rounded-full'
            }`}
            style={{
              backgroundColor: p.colour,
              animationDelay: p.delay,
              '--sail-dx': p.dx,
              '--sail-dy': p.dy,
              '--sail-spin': p.spin,
            }}
          />
        ))}
      </span>

      {/* Halo: pops in with the disc, then breathes indefinitely. */}
      <span className="sail-halo-breathe absolute inset-0 rounded-full bg-action-tint/60 ring-1 ring-action-tint" />

      {/* Ring flourish: draws clockwise from 12 o'clock, then fades. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 104 104"
        className="pointer-events-none absolute inset-0 -rotate-90"
      >
        <circle
          className={timing.ring}
          cx="52"
          cy="52"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--color-action)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          style={{ '--sail-ring-length': RING_LENGTH }}
        />
      </svg>

      {/* The sparkle rides the ring's leading edge: same duration, same start
          angle, so it reads as drawing the line rather than orbiting near it. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          countdown ? 'sail-sparkle-timer' : 'sail-sparkle-orbit'
        }`}
      >
        <span
          className={`absolute left-1/2 top-0 block h-1.5 w-1.5 rounded-full bg-white ${
            countdown ? 'sail-sparkle-dot-timer' : 'sail-sparkle-dot'
          }`}
          style={{
            marginTop: 52 - RING_RADIUS - 3,
            marginLeft: -3,
            boxShadow:
              '0 0 6px 2px var(--color-action), 0 0 2px 0 var(--color-action-link)',
          }}
        />
      </span>

      <span className="sail-mark-pop relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-action">
        <span className="sail-check-in flex">
          <CheckMark />
        </span>
      </span>
    </span>
  );
}

/**
 * The tick, at 40px inside the 72px disc — SailIcons' largest preset is 24px,
 * which reads undersized against the reference. Round caps and joins, so it
 * matches the weight of the drawn ring.
 */
function CheckMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="h-10 w-10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10.5 21.5 17 28l12.5-16"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
