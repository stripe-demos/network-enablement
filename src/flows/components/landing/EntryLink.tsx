import type { ReactNode } from "react"

import type { DemoKey, EntryTarget } from "@/components/landing/entryPoints"

// Dashboard entries are real links (new tab, copy link); creation flows open
// over the landing page as before.
export function EntryLink({
  target,
  onOpenDemo,
  className,
  label,
  children,
}: {
  target: EntryTarget
  onOpenDemo: (demo: DemoKey) => void
  className: string
  label: string
  children: ReactNode
}) {
  if (target.kind === "href") {
    return (
      <a href={target.href} className={className} aria-label={label}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={className} aria-label={label} onClick={() => onOpenDemo(target.demo)}>
      {children}
    </button>
  )
}
