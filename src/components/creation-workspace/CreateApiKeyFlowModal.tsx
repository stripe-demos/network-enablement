'use client'

import { useEffect, useState, type MouseEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"

import {
  API_KEY_CATEGORIES,
  ApiKeyKeyDetailsEditor,
  ApiKeyPermissionTree,
  ApiKeyPermissionsEditor,
  ApiKeyPreview,
  CreateApiKeyForm,
  computeAccessForStrategy,
  countGrants,
  defaultApiKeyData,
  type ApiKeyData,
} from "./forms/CreateApiKeyForm"
import { getFormTokens } from "./forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

/**
 * The API-key flow starts in Standard mini: setup on the left and a live summary on
 * the right. Custom permissions promotes the same surface into the Advanced pattern,
 * adding the source tree and resource editor without losing the preview or draft state.
 */
export function CreateApiKeyFlowModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<ApiKeyData>(defaultApiKeyData)
  const [advanced, setAdvanced] = useState(false)
  const [advancedView, setAdvancedView] = useState<"key-details" | "permissions">("permissions")
  const [activeCategoryId, setActiveCategoryId] = useState(API_KEY_CATEGORIES[0].id)
  const [query, setQuery] = useState("")
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set())
  const [rationaleOpen, setRationaleOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const isRefresh = productFormStyle === "refresh"

  const accent = isRefresh ? "#2C219E" : "#533AFD"
  const { total } = countGrants(data.access)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncPreference = () => setReduceMotion(mediaQuery.matches)
    syncPreference()
    mediaQuery.addEventListener("change", syncPreference)
    return () => mediaQuery.removeEventListener("change", syncPreference)
  }, [])

  const updateData = (patch: Partial<ApiKeyData>) => {
    setData((current) => ({ ...current, ...patch }))
    if (patch.name !== undefined && patch.name.trim()) setErrorFields(new Set())
  }

  const openAdvanced = () => {
    setData((current) => ({
      ...current,
      strategy: "custom",
      access: current.strategy === "custom" ? current.access : computeAccessForStrategy("custom"),
    }))
    setAdvancedView("permissions")
    setAdvanced(true)
  }

  const handleCreate = () => {
    if (!data.name.trim()) {
      setErrorFields(new Set(["name"]))
      // Surface the name field where the user is — the Key details view in Advanced,
      // or the setup form otherwise. Never drop them out of Advanced.
      if (advanced) setAdvancedView("key-details")
      window.setTimeout(() => document.getElementById("api-key-name")?.focus(), 340)
      return
    }
    if (total === 0) return
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="api-key-backdrop"
        className="fixed inset-0 z-40 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        onClick={onClose}
      />

      <motion.div
        key="api-key-positioner"
        className={`fixed inset-0 z-50 flex items-center justify-center ${advanced ? "p-0" : "p-[24px]"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
      >
        <motion.div
          className={`t-resize flex flex-col overflow-hidden bg-white ${advanced ? "max-h-none max-w-none rounded-none border-0 shadow-none" : "max-h-[calc(100vh-48px)] max-w-[calc(100vw-48px)] rounded-[12px] border border-[#E3E8EF] shadow-[0px_20px_60px_rgba(20,34,52,0.16),0px_4px_16px_rgba(20,34,52,0.1)]"}`}
          style={{
            width: advanced ? "100vw" : "920px",
            height: advanced ? "100vh" : "680px",
          }}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(event: MouseEvent) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Create secret key"
        >
          <header className={`flex h-[57px] shrink-0 items-center justify-between gap-[16px] border-b bg-white ${advanced ? "border-[#EAF0F6] px-[16px]" : "border-[#ECF1F6] px-[20px]"}`}>
            <div className="min-w-0 flex-1">
              <h1 className={advanced ? "truncate text-[15px] font-[675] leading-[20px] tracking-[-0.15px] text-[#142234]" : tokens.modalTitleClass}>
                {advanced ? data.name.trim() || "Create secret key" : "Create secret key"}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-[8px]">
              <button type="button" className={tokens.secondaryButtonClass} onClick={onClose}>Discard</button>
              <button
                type="button"
                className={`${tokens.primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                disabled={total === 0}
                onClick={handleCreate}
              >
                Create key
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
              <AnimatePresence initial={false}>
                {advanced && (
                  <motion.div
                    key="api-key-tree"
                    className="h-full shrink-0 overflow-hidden"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ApiKeyPermissionTree
                      activeCategoryId={activeCategoryId}
                      keyDetailsActive={advancedView === "key-details" && !query.trim()}
                      onSelectKeyDetails={() => {
                        setAdvancedView("key-details")
                        setQuery("")
                      }}
                      onSelectCategory={(categoryId) => {
                        setActiveCategoryId(categoryId)
                        setAdvancedView("permissions")
                        setQuery("")
                      }}
                      access={data.access}
                      query={query}
                      onQueryChange={(next) => {
                        setQuery(next)
                        if (next.trim()) setAdvancedView("permissions")
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.main
                layout
                className={`min-w-0 shrink-0 ${advanced ? "flex overflow-hidden border-r border-[#EAF0F6] bg-white" : "overflow-y-auto border-r border-[#ECF1F6] bg-white"}`}
                style={{ width: advanced ? 475 : 430 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {advanced ? (
                    <motion.div key="advanced-editor" className="flex min-h-0 flex-1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
                      {advancedView === "key-details" && !query.trim() ? (
                        <ApiKeyKeyDetailsEditor
                          data={data}
                          onChange={updateData}
                          errorFields={errorFields.size ? errorFields : undefined}
                        />
                      ) : (
                        <ApiKeyPermissionsEditor
                          data={data}
                          onChange={updateData}
                          activeCategoryId={activeCategoryId}
                          query={query}
                        />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="standard-setup" className="px-[22px] py-[20px]" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
                      <CreateApiKeyForm
                        data={data}
                        onChange={updateData}
                        onOpenCustomPermissions={openAdvanced}
                        errorFields={errorFields.size ? errorFields : undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.main>

              <motion.aside
                layout
                className={`refresh-microdot-canvas min-w-0 overflow-y-auto bg-[#F4F7FA] ${advanced ? "flex-1" : "shrink-0 border-l border-[#E6ECF1]"}`}
                style={{ width: advanced ? undefined : 490 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`flex min-h-full justify-center ${advanced ? "items-center px-[48px] py-[40px]" : "items-center px-[34px] py-[28px]"}`}>
                  <ApiKeyPreview data={data} detailed={advanced} />
                </div>
              </motion.aside>
          </div>
        </motion.div>
      </motion.div>

      <motion.button
        key="api-key-rationale-trigger"
        type="button"
        className="fixed bottom-[56px] left-[8px] z-[70] flex h-[40px] items-center gap-[8px] rounded-full border border-[#D5DEE7] bg-white px-[16px] text-[13px] font-[500] text-[#142234] shadow-[0_6px_20px_-6px_rgba(10,16,28,0.3),0_2px_6px_-2px_rgba(10,16,28,0.2)]"
        style={rationaleOpen ? { backgroundColor: accent, borderColor: accent, color: "white" } : undefined}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        onClick={() => setRationaleOpen((current) => !current)}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className={rationaleOpen ? "text-white" : "text-[#533AFD]"} aria-hidden="true">
          <path d="M8 1.6a4.4 4.4 0 0 0-2.7 7.9c.4.3.6.8.6 1.3v.4h4.2v-.4c0-.5.2-1 .6-1.3A4.4 4.4 0 0 0 8 1.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6.6 13.4h2.8M7.1 14.8h1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {rationaleOpen ? "Hide rationale" : "Why this design"}
      </motion.button>

      <AnimatePresence>
        {rationaleOpen && <RationalePopover onClose={() => setRationaleOpen(false)} />}
      </AnimatePresence>
    </AnimatePresence>
  )
}

function RationalePopover({ onClose }: { onClose: () => void }) {
  return (
    <motion.aside
      className="fixed bottom-[108px] left-[16px] z-[75] flex max-h-[min(70vh,560px)] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[12px] border border-[#DDE5EC] bg-white shadow-[0_20px_56px_rgba(20,34,52,.2)]"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-[12px] border-b border-[#ECF1F6] px-[18px] py-[15px]">
        <div>
          <h2 className="text-[15px] font-[650] leading-[20px] text-[#1A2C44]">Why this design</h2>
          <p className="mt-[2px] text-[11px] leading-[16px] text-[#6C7688]">Standard mini until the permission model needs Advanced.</p>
        </div>
        <button type="button" aria-label="Close rationale" className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-[#6C7688] hover:bg-[#F5F6F8]" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="m2.5 2.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div className="flex flex-col gap-[16px] overflow-y-auto px-[18px] py-[16px] text-[12px] leading-[18px] text-[#3F5064]">
        <RationaleSection title="One continuous review">
          The right-hand preview shows the finished key—its name, note, and what it can do. That removes the original final review step without hiding its information.
        </RationaleSection>
        <RationaleSection title="Right-sized by default">
          Templates and the two broad-access choices fit comfortably in Standard mini. Most people can create a useful key without entering the full matrix.
        </RationaleSection>
        <RationaleSection title="Complexity earns space">
          Custom permissions expands the same surface into Advanced. The source taxonomy becomes tree navigation, the form becomes a searchable resource editor, and the preview stays put.
        </RationaleSection>
        <RationaleSection title="Draft state is preserved">
          Moving between setup and custom permissions never resets the key name, note, usage, or selected grants. The transition changes the workspace, not the object being created.
        </RationaleSection>
        <div className="rounded-[8px] border border-[#E4DFFF] bg-[#F8F6FF] px-[11px] py-[9px] text-[#4A3AA8]">
          <span className="font-[650]">Pattern path:</span> Standard mini → Advanced, with one persistent preview across both.
        </div>
      </div>
    </motion.aside>
  )
}

function RationaleSection({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h3 className="text-[11px] font-[650] uppercase leading-[16px] tracking-[0.05em] text-[#533AFD]">{title}</h3>
      <p className="mt-[4px]">{children}</p>
    </section>
  )
}
