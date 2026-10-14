import { EntryLink } from "@/components/landing/EntryLink"
import { openFlowTarget, type DemoKey, type Flow } from "@/components/landing/entryPoints"

// The page's chip style, so steps read like the rest of the landing page.
const STEP_CLASS =
  "inline-flex cursor-pointer items-center whitespace-nowrap rounded-full border border-[#D5DEE7] bg-white px-[12px] py-[6px] text-[13px] font-[500] leading-[16px] text-[#3F5064] transition-colors hover:border-[#C1CCD7] hover:bg-[#F6F8FA] hover:text-[#142234]"

const PLACEHOLDER_CLASS =
  "inline-flex cursor-default items-center whitespace-nowrap rounded-full border border-dashed border-[#C1CCD7] bg-[#F7F9FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[16px] text-[#9AA8B5]"

const TITLE_CLASS = "w-[260px] shrink-0 text-[16px] font-[500] leading-[1.3] text-[#142234]"

// Runs from one step's right end to the next step's left end.
function Connector() {
  return (
    <svg aria-hidden="true" width="20" height="10" viewBox="0 0 20 10" fill="none" className="shrink-0">
      <path d="M0 5H18M18 5L14.5 1.5M18 5L14.5 8.5" stroke="#C1CCD7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Ties a sub-flow to its parent: down from above, then across to its title.
function Elbow() {
  return (
    <svg aria-hidden="true" width="14" height="16" viewBox="0 0 14 16" fill="none" className="absolute bottom-1/2 left-[4px] -mb-[4px]">
      <path d="M1 0V11C1 13.2091 2.79086 15 5 15H14" stroke="#C1CCD7" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function FlowRow({ flow, nested, onOpenDemo }: { flow: Flow; nested?: boolean; onOpenDemo: (demo: DemoKey) => void }) {
  const { title, steps, comingSoon } = flow
  const openTarget = openFlowTarget(flow)
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className={`${TITLE_CLASS} relative ${nested ? "pl-[26px]" : ""}`}>
        {nested ? <Elbow /> : null}
        <h3>{title}</h3>
      </div>
      {/* One line, so steps stay connected; scrolls sideways when narrow. */}
      <ol className="flex min-w-0 flex-1 items-center overflow-x-auto py-[2px]">
        {steps.map((step, index) => (
          <li key={index} className="flex shrink-0 items-center">
            {index > 0 ? <Connector /> : null}
            {step.target ? (
              <EntryLink target={step.target} onOpenDemo={onOpenDemo} label={`Open ${step.title}`} className={STEP_CLASS}>
                {step.title}
              </EntryLink>
            ) : (
              <span className={PLACEHOLDER_CLASS}>{step.title}</span>
            )}
          </li>
        ))}
      </ol>
      {comingSoon || !openTarget ? (
        <span className="inline-flex shrink-0 cursor-not-allowed items-center rounded-full border border-[#E4EAEF] bg-[#F7F9FB] px-[12px] py-[4px] text-[13px] font-[500] text-[#9AA8B5]">
          Coming soon
        </span>
      ) : (
        <EntryLink
          target={openTarget}
          onOpenDemo={onOpenDemo}
          label={`Open the ${title.toLowerCase()} flow`}
          className="group inline-flex shrink-0 cursor-pointer items-center gap-[4px] text-[15px] font-[500] text-[#533AFD] hover:text-[#2C219E]"
        >
          Open flow
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:translate-x-[2px]">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </EntryLink>
      )}
    </div>
  )
}

// One row of a journey table: the flow's name, its steps, and a link that
// starts the flow at its first step (or "Coming soon" until it's built), with
// any sub-flows indented under it.
export function JourneyFlow({ flow, onOpenDemo }: { flow: Flow; onOpenDemo: (demo: DemoKey) => void }) {
  return (
    <div className="flex flex-col gap-2.5 px-6 py-5">
      <FlowRow flow={flow} onOpenDemo={onOpenDemo} />
      {flow.children ? (
        <div className="flex flex-col gap-4">
          {flow.children.map((child) => (
            <FlowRow key={child.title} flow={child} nested onOpenDemo={onOpenDemo} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
