import { Icon } from './Icon';

/**
 * One prompt-strength chip under the textarea, in three states: `checking`
 * (spinner), satisfied (filled brand check) and unsatisfied (hollow check).
 *
 * The spinner is Sail's — the icon set has no `spinner` glyph, so the arc is inlined
 * from the Figma instance `1568:400608`: a 12px, 270° arc, 0.75 stroke, fading
 * from `#4F566B` to 30% along its length. The gradient stroke is why this can't
 * be a `currentColor` icon; the stops are `--color-neutral-600`, which tracks
 * dark mode.
 *
 * // motion: prompt-strength
 */
function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="animate-[chipSpin_700ms_linear_infinite]">
      <defs>
        <linearGradient id="chip-spinner" x1="11.25" y1="3.35" x2="3.53" y2="13.06" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" />
          <stop offset="0.427" stopColor="currentColor" stopOpacity="0.56" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M11.25 6C11.25 4.96165 10.9421 3.94661 10.3652 3.08326C9.78834 2.2199 8.9684 1.54699 8.00909 1.14963C7.04978 0.752272 5.99418 0.648305 4.97578 0.850877C3.95738 1.05345 3.02191 1.55346 2.28769 2.28769C1.55346 3.02192 1.05345 3.95738 0.850877 4.97578C0.648305 5.99418 0.752272 7.04978 1.14963 8.00909C1.54699 8.9684 2.2199 9.78834 3.08326 10.3652C3.94661 10.9421 4.96165 11.25 6 11.25"
        stroke="url(#chip-spinner)"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CheckChip({ label, satisfied = false, checking = false }) {
  return (
    <span className="flex items-center gap-1 text-label-small text-subdued">
      {checking ? (
        <span className="flex size-3 shrink-0 items-center justify-center text-neutral-600">
          <Spinner />
        </span>
      ) : (
        <Icon
          name={satisfied ? 'checkCircleFilled' : 'checkCircle'}
          size="xsmall"
          fill="currentColor"
          className={satisfied ? 'text-icon-brand' : 'text-icon-subdued'}
        />
      )}
      {label}
    </span>
  );
}
