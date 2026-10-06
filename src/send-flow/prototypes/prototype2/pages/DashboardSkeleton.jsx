import React from 'react';

/**
 * Dashboard chrome for the payout detail page — 502:63579 ("Primary nav" and
 * "Top bar Skelly").
 *
 * The frames draw the nav and topbar as grey placeholders rather than real
 * navigation, and that's exactly how they're built here: this prototype has no
 * dashboard, and inventing one would imply routes that don't exist. The bars are
 * decorative, so the whole thing is hidden from assistive tech.
 *
 * Measurements from the frame: 240px nav, 60px topbar, 1280px page.
 */
export default function DashboardSkeleton({ children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Nav />
      <div className="min-w-0 flex-1">
        <TopBar />
        {/* 32px left, 40px right — the content stretches rather than being centred. */}
        <main className="pb-10 pl-8 pr-10 pt-6">{children}</main>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div
      aria-hidden="true"
      className="w-60 shrink-0 border-r border-hairline px-5 py-3"
    >
      {/* Account switcher */}
      <div className="mb-8 flex items-center gap-2">
        <Bar className="h-6 w-6 rounded-control" />
        <Bar className="h-4 w-28" />
      </div>

      {/* Two groups of nav items, then a shorter one — as the frame stacks them */}
      {[5, 4, 3].map((count, group) => (
        <div key={group} className="mb-7 space-y-3">
          {group > 0 && <Bar className="mb-4 h-3 w-16" />}
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Bar className="h-4 w-4 rounded-[3px]" />
              <Bar
                className={`h-3.5 ${['w-20', 'w-28', 'w-24', 'w-32', 'w-16'][i % 5]}`}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TopBar() {
  return (
    <div
      aria-hidden="true"
      className="flex h-[60px] items-center justify-between border-b border-hairline px-8"
    >
      <Bar className="h-9 w-[360px] rounded-control" />
      <div className="flex items-center gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <Bar key={i} className="h-9 w-9 rounded-control" />
        ))}
      </div>
    </div>
  );
}

/** One placeholder bar. Panel fill rather than a grey literal. */
function Bar({ className = '' }) {
  return <span className={`block rounded-full bg-panel ${className}`} />;
}
