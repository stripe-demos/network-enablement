import { Icon } from './Icon';

/**
 * The setup dialog's left rail (ported from connect-onboarding prototype4).
 * Each step carries a precomputed `status` ('complete' | 'active' | 'upcoming')
 * and may carry `subSteps` with the same shape — used to nest the dynamic
 * acknowledgment waivers under "Review setup".
 */

// Ring for the in-progress step: a mostly-drawn circle with a gap, so it reads
// as "underway" next to the dotted upcoming rings.
const ActiveRing = ({ className = 'size-4' }) => (
  <svg viewBox="0 0 16 16" className={`${className} text-brand`} aria-hidden="true">
    <circle
      cx="8"
      cy="8"
      r="6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="30 11"
      transform="rotate(-90 8 8)"
    />
  </svg>
);

const UpcomingRing = ({ className = 'size-4' }) => (
  <svg viewBox="0 0 16 16" className={`${className} text-neutral-200`} aria-hidden="true">
    <circle
      cx="8"
      cy="8"
      r="6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="2 3"
    />
  </svg>
);

function StatusMark({ status, small = false }) {
  if (status === 'complete') {
    return (
      <Icon
        name="checkCircleFilled"
        size={small ? 'xsmall' : 'small'}
        fill="currentColor"
        className="text-icon-brand"
      />
    );
  }
  if (status === 'active') return <ActiveRing className={small ? 'size-3.5' : 'size-4'} />;
  return <UpcomingRing className={small ? 'size-3.5' : 'size-4'} />;
}

// The vertical connector that drops from a step's dot to the next one. It runs
// centered under the 16px dot (x = 8px). A completed step draws a solid brand
// line toward the step below it; an active or upcoming step draws a dashed,
// muted line. Leave 2px of clear space after the 16px mark and before the next
// row's mark, including when this row grows to contain nested steps.
function Connector({ complete }) {
  return (
    <span
      aria-hidden="true"
      className={
        complete
          ? 'pointer-events-none absolute left-2 top-[18px] bottom-0.5 w-0.5 -translate-x-1/2 rounded-full bg-brand-500'
          : 'pointer-events-none absolute left-2 top-[18px] bottom-0.5 -translate-x-1/2 border-l border-dashed border-hairline'
      }
    />
  );
}

export default function StepRail({ steps = [], className = '' }) {
  return (
    <nav aria-label="Setup progress" className={`flex flex-col ${className}`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div key={step.label ?? index} className="relative flex flex-col pb-5 last:pb-0">
            {isLast ? null : <Connector complete={step.status === 'complete'} />}

            <div
              className="relative flex items-start gap-2"
              aria-current={step.status === 'active' ? 'step' : undefined}
            >
              <span className="flex size-4 shrink-0 items-center justify-center bg-surface">
                <StatusMark status={step.status} />
              </span>
              <span
                className={
                  step.status === 'active'
                    ? 'text-body-medium-emphasized text-brand'
                    : 'text-body-medium text-default'
                }
              >
                {step.label}
              </span>
            </div>

            {step.subSteps?.length ? (
              <div className="mt-2 ml-2 flex flex-col gap-2 pl-[18px]">
                {step.subSteps.map((sub, subIndex) => (
                  <div
                    key={sub.label ?? subIndex}
                    className="flex items-start gap-1.5"
                    aria-current={sub.status === 'active' ? 'step' : undefined}
                  >
                    <span className="flex size-3.5 shrink-0 items-center justify-center bg-surface">
                      <StatusMark status={sub.status} small />
                    </span>
                    <span
                      className={
                        sub.status === 'active'
                          ? 'text-body-small-emphasized text-brand'
                          : 'text-body-small text-subdued'
                      }
                    >
                      {sub.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
