'use client'

import { useState, useEffect, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { getFormTokens } from "./formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useCustomerDisclosure } from "@/components/creation-workspace/customerDisclosure"
import { AddSmallIcon } from "@/components/ProductCatalogIcons"

/* Shared pieces for the "compose" disclosure pattern in the real billing forms
 * (Subscription, Invoice): a labelled region with dashed "+ Add" chips that reveal
 * a titled, collapsible block. No remove action — once added, a group stays. Chrome
 * is tuned per UI style via getFormTokens, matching the Simple/Customer compose look. */

function composeColors(isRefresh: boolean) {
  return {
    borderColor: isRefresh ? "#D8E1EA" : "#E3E8EF",
    dividerColor: isRefresh ? "#EAF0F6" : "#ECF1F6",
    // The revealed fields sit on the same light-gray surface we use to embed
    // toggled-on settings — the header row stays white, the fields below are grey.
    fieldsBg: isRefresh ? "#F6F9FC" : "#F6F8FA",
  }
}

// "Optional fields" — one line above the + chips / review rows, in the field-label style.
export function OptionalFieldsHeader() {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  return <span className={tokens.labelClass}>Optional fields</span>
}

// Dashed "+ Title" chip that opts a group in.
export function AddChip({ title, onClick }: { title: string; onClick: () => void }) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const chipClass = isRefresh
    ? "border-[#D8E1EA] text-[#526378] hover:border-[#2C219E] hover:text-[#2C219E] hover:bg-[#F6F9FC]"
    : "border-[#E3E8EF] text-[#697386] hover:border-[#533AFD] hover:text-[#533AFD] hover:bg-[#F7F8FA]"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-[6px] rounded-full border border-dashed px-[10px] py-[5px] text-[12px] font-[500] transition-colors ${chipClass}`}
    >
      <AddSmallIcon className="shrink-0" />
      {title}
    </button>
  )
}

// A titled, collapsible bordered block. Collapsed shows an optional summary line.
export function ComposeGroup({ title, open, onToggle, summary, children }: {
  title: string
  open: boolean
  onToggle: () => void
  summary?: ReactNode
  children: ReactNode
}) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const isRefresh = productFormStyle === "refresh"
  const { borderColor, dividerColor, fieldsBg } = composeColors(isRefresh)
  // Clip the reveal while its height animates, then allow overflow so an open dropdown/menu
  // inside the group can escape instead of being clipped by the collapse container.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    setSettled(false)
    if (!open) return
    const t = setTimeout(() => setSettled(true), 220)
    return () => clearTimeout(t)
  }, [open])
  return (
    <div className="rounded-[8px] border" style={{ borderColor }}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-[16px] py-[12px] text-left transition-colors hover:bg-[#FAFBFC]"
      >
        <div className="min-w-0">
          <h3 className={tokens.sectionTitle}>{title}</h3>
          {!open && summary != null && <div className={`mt-[2px] truncate ${tokens.helperClass}`}>{summary}</div>}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "none", color: "#8792A2" }}>
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className={`min-h-0 ${settled ? "overflow-visible" : "overflow-hidden"}`}>
          <div className="border-t px-[16px] py-[16px]" style={{ borderColor: dividerColor, backgroundColor: fieldsBg }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/* The shared "optional fields" disclosure block used by the real forms (Invoice, Coupon).
 * Essentials stay inline in the form; everything optional is passed here as a list of groups
 * and rendered per the Options-panel disclosure setting (useCustomerDisclosure):
 *  - 'pills' → "+ Title" ghost chips that reveal a ComposeGroup, one open at a time
 *  - 'rows'  → every group shown up front as a review row (title + live summary), Edit reveals
 *              its fields inline. Summaries make it clear what's been done vs left at default. */
export type OptionalGroup = {
  id: string
  title: string
  // One-line live summary shown when the group is collapsed (rows) or not open (pills).
  summary?: ReactNode
  render: () => ReactNode
}

export function OptionalGroups({ groups, hideHeader = false }: { groups: OptionalGroup[]; hideHeader?: boolean }) {
  const { productFormStyle } = useProductFormStyle()
  const { customerDisclosure } = useCustomerDisclosure()
  if (productFormStyle === "refresh") return <OptionalGroupsChevron groups={groups} hideHeader={hideHeader} />
  return customerDisclosure === "rows"
    ? <OptionalGroupsRows groups={groups} hideHeader={hideHeader} />
    : <OptionalGroupsPills groups={groups} hideHeader={hideHeader} />
}

function OptionalGroupsChevron({ groups, hideHeader = false }: { groups: OptionalGroup[]; hideHeader?: boolean }) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const { borderColor, dividerColor, fieldsBg } = composeColors(true)
  const isRefresh = productFormStyle === "refresh"
  const [open, setOpen] = useState<string | null>(null)
  const [settled, setSettled] = useState<string | null>(null)

  useEffect(() => {
    setSettled(null)
    if (open == null) return
    const t = setTimeout(() => setSettled(open), 250)
    return () => clearTimeout(t)
  }, [open])

  return (
    <div className={isRefresh ? "-mx-[28px] flex flex-col border-t border-[#EAF0F6]" : "flex flex-col gap-2"}>
      {!isRefresh && !hideHeader && <OptionalFieldsHeader />}
      {groups.map((g) => {
        const isOpen = open === g.id
        return (
          <div
            key={g.id}
            className={isRefresh ? "t-acc border-b border-[#EAF0F6] bg-white" : "t-acc rounded-[8px] border bg-white"}
            data-open={isOpen ? "true" : "false"}
            style={isRefresh ? undefined : { borderColor }}
          >
            <button
              type="button"
              className={isRefresh
                ? "t-acc-head flex w-full items-center justify-between gap-3 px-[28px] py-[18px] text-left transition-colors hover:bg-[#F6F9FC]"
                : "t-acc-head flex w-full items-center justify-between gap-3 px-[16px] py-[11px] text-left transition-colors hover:bg-[#F6F9FC]"}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : g.id)}
            >
              <div className="min-w-0">
                <h3 className={tokens.sectionTitle}>{g.title}</h3>
                {g.summary != null && <div className={`mt-[2px] truncate ${tokens.helperClass}`}>{g.summary}</div>}
              </div>
              <span className="t-acc-chevron shrink-0 text-[#8792A2]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <div className="t-acc-panel">
              <div className={`t-acc-panel-inner min-h-0 ${settled === g.id ? "!overflow-visible" : ""}`}>
                <div
                  className={isRefresh ? "border-t px-[28px] py-[18px]" : "border-t px-[16px] py-[16px]"}
                  style={{ borderColor: dividerColor, backgroundColor: fieldsBg }}
                >
                  {g.render()}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 'pills' — compose one group at a time via "+ Title" chips (the original Invoice behavior).
function OptionalGroupsPills({ groups, hideHeader = false }: { groups: OptionalGroup[]; hideHeader?: boolean }) {
  const [added, setAdded] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const remaining = groups.filter((g) => !added.includes(g.id))
  const addGroup = (id: string) => {
    setAdded((a) => (a.includes(id) ? a : [...a, id]))
    setOpen(id)
  }
  return (
    <div className="flex flex-col gap-2">
      {!hideHeader && <OptionalFieldsHeader />}
      <AnimatePresence initial={false}>
        {added.map((id) => {
          const group = groups.find((g) => g.id === id)!
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              <ComposeGroup
                title={group.title}
                open={open === id}
                onToggle={() => setOpen(open === id ? null : id)}
                summary={group.summary}
              >
                {group.render()}
              </ComposeGroup>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-[8px]">
          {remaining.map((g) => (
            <AddChip key={g.id} title={g.title} onClick={() => addGroup(g.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// 'rows' — every group is a defaulted review row; Edit reveals its fields in place.
function OptionalGroupsRows({ groups, hideHeader = false }: { groups: OptionalGroup[]; hideHeader?: boolean }) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"
  const { borderColor, dividerColor, fieldsBg } = composeColors(isRefresh)
  const accent = isRefresh ? "#2C219E" : "#533AFD"
  const editHover = isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F4F4FE]"
  const editSizeClass = isSail
    ? "text-[14px] font-[600] leading-[20px]"
    : isRefresh
      ? "text-[13px] font-[575] leading-[20px]"
      : "text-[11px] font-[600] leading-[16px]"
  const [open, setOpen] = useState<string | null>(null)
  // Once an opened row's expand animation settles, stop clipping it so a dropdown/menu
  // revealed inside (e.g. the product picker) can overflow the row instead of being cut off.
  const [settled, setSettled] = useState<string | null>(null)
  useEffect(() => {
    setSettled(null)
    if (open == null) return
    const t = setTimeout(() => setSettled(open), 220)
    return () => clearTimeout(t)
  }, [open])
  return (
    <div className="flex flex-col gap-[6px]">
      {!hideHeader && <OptionalFieldsHeader />}
      {groups.map((g) => {
        const isOpen = open === g.id
        return (
          <div key={g.id} className="rounded-[8px] border" style={{ borderColor }}>
            {/* Header row stays white; only the revealed content sits on the grey surface. */}
            <div className="flex items-center justify-between gap-2 px-[16px] py-[10px]">
              <div className="min-w-0">
                <h3 className={tokens.sectionTitle}>{g.title}</h3>
                {g.summary != null && <div className={`mt-[2px] truncate ${tokens.helperClass}`}>{g.summary}</div>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : g.id)}
                className={`shrink-0 rounded-[6px] px-[8px] py-[4px] transition-colors ${editSizeClass} ${editHover}`}
                style={{ color: accent }}
              >
                {isOpen ? "Done" : "Edit"}
              </button>
            </div>
            <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
              <div className={`min-h-0 ${settled === g.id ? "overflow-visible" : "overflow-hidden"}`}>
                <div className="rounded-b-[8px] border-t px-[16px] py-[16px]" style={{ borderColor: dividerColor, backgroundColor: fieldsBg }}>{g.render()}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
