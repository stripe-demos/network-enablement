import { EntryLink } from "@/components/landing/EntryLink"
import type { DemoKey, Step } from "@/components/landing/entryPoints"

// The page's chip style, so steps read like the rest of the landing page.
const STEP_CLASS =
  "inline-flex cursor-pointer items-center rounded-full border border-[#D5DEE7] bg-white px-[16px] pt-[7px] pb-[8px] text-[15px] font-[500] leading-[16px] text-[#3F5064] transition-colors hover:border-[#C1CCD7] hover:bg-[#F6F8FA] hover:text-[#142234]"

// Joins one step's rounded right end to the next step's rounded left end,
// with a dot on each end.
function Connector() {
  return (
    <span aria-hidden="true" className="relative z-10 -mx-[3px] flex w-[30px] shrink-0 items-center">
      <span className="size-[6px] shrink-0 rounded-full bg-[#C1CCD7]" />
      <span className="h-px flex-1 bg-[#C1CCD7]" />
      <span className="size-[6px] shrink-0 rounded-full bg-[#C1CCD7]" />
    </span>
  )
}

// One row of a journey table: the flow's name, its steps, and a link that
// starts the flow at its first step.
export function JourneyFlow({ title, steps, onOpenDemo }: { title: string; steps: Step[]; onOpenDemo: (demo: DemoKey) => void }) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center">
      <h3 className="w-[220px] shrink-0 text-[16px] font-[500] leading-[1.3] text-[#142234]">{title}</h3>
      <ol className="flex flex-1 flex-wrap items-center gap-y-2.5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-center">
            {index > 0 ? <Connector /> : null}
            <EntryLink target={step.target} onOpenDemo={onOpenDemo} label={`Open ${step.title}`} className={STEP_CLASS}>
              {step.title}
            </EntryLink>
          </li>
        ))}
      </ol>
      <EntryLink
        target={steps[0].target}
        onOpenDemo={onOpenDemo}
        label={`Open the ${title.toLowerCase()} flow`}
        className="group inline-flex shrink-0 cursor-pointer items-center gap-[4px] text-[15px] font-[500] text-[#533AFD] hover:text-[#2C219E]"
      >
        Open flow
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:translate-x-[2px]">
          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </EntryLink>
    </div>
  )
}
