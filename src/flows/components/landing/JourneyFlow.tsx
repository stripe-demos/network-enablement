import { EntryLink } from "@/components/landing/EntryLink"
import { openFlowTarget, type DemoKey, type Flow } from "@/components/landing/entryPoints"

// The page's chip style, so steps read like the rest of the landing page.
const STEP_CLASS =
  "inline-flex cursor-pointer items-center whitespace-nowrap rounded-full border border-[#D5DEE7] bg-white px-[12px] py-[6px] text-[13px] font-[500] leading-[16px] text-[#3F5064] transition-colors hover:border-[#C1CCD7] hover:bg-[#F6F8FA] hover:text-[#142234]"

const TITLE_CLASS = "w-[220px] shrink-0 text-[16px] font-[500] leading-[1.3] text-[#142234]"

// Runs from one step's right end to the next step's left end.
function Connector() {
  return (
    <svg aria-hidden="true" width="20" height="10" viewBox="0 0 20 10" fill="none" className="shrink-0">
      <path d="M0 5H18M18 5L14.5 1.5M18 5L14.5 8.5" stroke="#C1CCD7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Ties a sub-flow to its parent: down from the parent's title, then across to
// the sub-flow's title.
function Elbow() {
  return (
    <svg aria-hidden="true" width="14" height="16" viewBox="0 0 14 16" fill="none" className="absolute bottom-1/2 left-[4px] -mb-[4px]">
      <path d="M1 0V11C1 13.2091 2.79086 15 5 15H14" stroke="#C1CCD7" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function FlowRow({ flow, parent, onOpenDemo }: { flow: Flow; parent?: string; onOpenDemo: (demo: DemoKey) => void }) {
  const { title, steps, comingSoon } = flow
  const nested = parent !== undefined
  const flowName = nested ? `${parent}, ${title}` : title
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
            <EntryLink target={step.target} onOpenDemo={onOpenDemo} label={`Open ${step.title}`} className={STEP_CLASS}>
              {step.title}
            </EntryLink>
          </li>
        ))}
      </ol>
      {comingSoon ? (
        <span className="inline-flex shrink-0 cursor-not-allowed items-center rounded-full border border-[#E4EAEF] bg-[#F7F9FB] px-[12px] py-[4px] text-[13px] font-[500] text-[#9AA8B5]">
          Coming soon
        </span>
      ) : (
        <EntryLink
          target={openFlowTarget(flow)}
          onOpenDemo={onOpenDemo}
          label={`Open the ${flowName.toLowerCase()} flow`}
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
// starts the flow at its first step (or "Coming soon" until it's built). A
// flow with sub-flows shows its name, then each sub-flow indented under it.
export function JourneyFlow({ flow, onOpenDemo }: { flow: Flow; onOpenDemo: (demo: DemoKey) => void }) {
  if (!flow.children) {
    return (
      <div className="px-6 py-5">
        <FlowRow flow={flow} onOpenDemo={onOpenDemo} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2.5 px-6 py-5">
      <h3 className={TITLE_CLASS}>{flow.title}</h3>
      <div className="flex flex-col gap-4">
        {flow.children.map((child) => (
          <FlowRow key={child.title} flow={child} parent={flow.title} onOpenDemo={onOpenDemo} />
        ))}
      </div>
    </div>
  )
}
