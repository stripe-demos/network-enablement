'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { AccountApiPreview } from "./AccountApiPreview"
import { FieldHint } from "./AccountConfigurationForm"
import { AccountAvatar, CheckIcon, CountryBadge } from "./AccountConfigurationPrimitives"
import {
  getCapabilitiesForGroup,
  getConfigurationOptions,
  getDraftName,
  type AccountDetailsDraft,
  type AccountSource,
  type ConfigurationKind,
  type NetworkAccount,
  type UserPath,
} from "./model"

const SHOW_API_PREVIEW = true
const EXPAND_MS = 280
const EXPAND_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

function Expand({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <div
      className="grid [overflow-anchor:none]"
      inert={open ? undefined : true}
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: reduceMotion ? "none" : `grid-template-rows ${EXPAND_MS}ms ${EXPAND_EASE}`,
      }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

function ConfigurationCapabilityGroup({
  id,
  title,
  capabilities,
  expanded,
  onToggle,
  collapsible,
}: {
  id: string
  title: string
  capabilities: string[]
  expanded: boolean
  onToggle: () => void
  collapsible: boolean
}) {
  const showChildren = !collapsible || expanded
  const capabilityCount = capabilities.length
  const capabilityLabel = capabilityCount === 0 ? "" : capabilityCount === 1 ? "1 capability" : `${capabilityCount} capabilities`

  return (
    <div data-preview-configuration={id}>
      {collapsible ? (
        <button
          type="button"
          className="flex w-full items-center gap-[8px] text-left"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <CheckIcon />
          <span className="min-w-0 text-[12px] font-[600] leading-[16px] text-[#2C219E]">{title}</span>
          <span className="ml-auto flex items-center">
            <span className={`mr-[8px] text-[12px] leading-[16px] text-[#818DA0] transition-opacity duration-200 ${expanded ? "opacity-0" : "opacity-100"}`}>
              {capabilityLabel}
            </span>
            <svg className={`shrink-0 text-[#6C7688] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${expanded ? "rotate-180" : ""}`} width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      ) : (
        <div className="flex w-full items-center gap-[8px]">
          <CheckIcon />
          <span className="text-[12px] font-[600] leading-[16px] text-[#2C219E]">{title}</span>
        </div>
      )}
      {capabilities.length > 0 ? (
        <Expand open={showChildren}>
          <div className="ml-[8px] mt-[8px] border-l border-[#D4DEE9] pl-[16px]">
            <div className="flex flex-col gap-[8px]">
              {capabilities.map((capability) => (
                <div key={capability} data-preview-capability={capability} data-enabled="true" className="min-w-0">
                  <span className="text-[12px] leading-[18px] text-[#3C4F69]">{capability}</span>
                </div>
              ))}
            </div>
          </div>
        </Expand>
      ) : null}
    </div>
  )
}

function initialsFor(name: string) {
  if (!name || name === "New account") return "NA"
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function PreviewModeToggle({
  value,
  onChange,
}: {
  value: "dashboard" | "api"
  onChange: (next: "dashboard" | "api") => void
}) {
  const itemClass = (selected: boolean) =>
    `flex h-[32px] min-w-[108px] items-center justify-center gap-[6px] rounded-[6px] px-[14px] text-[12px] leading-[16px] tracking-[-0.02px] transition-colors ${
      selected ? "bg-[#F4F6F8] font-[600] text-[#1A2C44]" : "font-[500] text-[#6C7688] hover:text-[#1A2C44]"
    }`

  return (
    <div className="flex items-center rounded-[8px] border border-[#E6EAF0] bg-white p-[3px] shadow-[0_1px_2px_rgba(20,34,52,0.04),0_10px_28px_rgba(20,34,52,0.08)]">
      <button type="button" className={itemClass(value === "dashboard")} onClick={() => onChange("dashboard")} aria-pressed={value === "dashboard"}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 5h11M5.5 5v7.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Dashboard
      </button>
      <button type="button" className={itemClass(value === "api")} onClick={() => onChange("api")} aria-pressed={value === "api"}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M5 3.5L2.5 7 5 10.5M9 3.5L11.5 7 9 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        API
      </button>
    </div>
  )
}

function PreviewModeFrame({
  mode,
  dashboard,
  api,
  showShadow,
}: {
  mode: "dashboard" | "api"
  dashboard: ReactNode
  api: ReactNode
  showShadow: boolean
}) {
  const dashboardRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [height, setHeight] = useState<number>()
  const [animateHeight, setAnimateHeight] = useState(false)
  const modeRef = useRef(mode)
  const heightRef = useRef<number | undefined>(undefined)
  const animatingRef = useRef(false)

  const measure = (nextMode: "dashboard" | "api") => (
    (nextMode === "api" ? apiRef.current : dashboardRef.current)?.offsetHeight ?? 0
  )

  const applyHeight = (next: number, shouldAnimate: boolean) => {
    const current = heightRef.current
    if (current === next) return
    if (shouldAnimate && !reduceMotion && current && Math.abs(current - next) > 4) {
      animatingRef.current = true
      setAnimateHeight(true)
    } else {
      setAnimateHeight(false)
    }
    heightRef.current = next
    setHeight(next)
  }

  useLayoutEffect(() => {
    const next = measure(mode)
    if (!next) return
    const modeChanged = modeRef.current !== mode
    modeRef.current = mode
    applyHeight(next, modeChanged)
  }, [mode, reduceMotion])

  useEffect(() => {
    const dashboardPane = dashboardRef.current
    const apiPane = apiRef.current
    if (!dashboardPane || !apiPane) return
    const observer = new ResizeObserver(() => {
      if (animatingRef.current) return
      const next = measure(modeRef.current)
      if (next) applyHeight(next, false)
    })
    observer.observe(dashboardPane)
    observer.observe(apiPane)
    return () => observer.disconnect()
  }, [])

  const isApi = mode === "api"

  return (
    <div className={`overflow-hidden rounded-[14px] border transition-colors duration-300 ${
      isApi ? "border-[#16324F]" : "border-[#EBEEF1]"
    } ${showShadow || isApi ? "shadow-[0_14px_38px_rgba(20,34,52,0.10)]" : ""}`}>
      <motion.div
        className="relative overflow-hidden"
        initial={false}
        animate={{ height: height || "auto" }}
        transition={reduceMotion || !animateHeight
          ? { duration: 0 }
          : { duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => {
          animatingRef.current = false
          setAnimateHeight(false)
          const next = measure(modeRef.current)
          if (next) {
            heightRef.current = next
            setHeight(next)
          }
        }}
      >
        <div
          className="absolute inset-x-0 top-0 min-h-full w-full bg-white transition-opacity duration-300 ease-out motion-reduce:transition-none"
          style={{ opacity: isApi ? 0 : 1, pointerEvents: isApi ? "none" : "auto" }}
          aria-hidden={isApi}
        >
          <div ref={dashboardRef}>{dashboard}</div>
        </div>
        <div
          className="absolute inset-x-0 top-0 min-h-full w-full bg-[#0A2540] transition-opacity duration-300 ease-out motion-reduce:transition-none"
          style={{ opacity: isApi ? 1 : 0, pointerEvents: isApi ? "auto" : "none" }}
          aria-hidden={!isApi}
        >
          <div ref={apiRef}>{api}</div>
        </div>
      </motion.div>
    </div>
  )
}

function EmptyAccountPreview() {
  return (
    <div className="w-full rounded-[14px] border border-dashed border-[#C9D3DF] bg-white/70 px-[28px] py-[46px] text-center">
      <div className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#F1EEFF] text-[#675DFF]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M5.5 7.5h11M5.5 11h7M5.5 14.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><rect x="2.75" y="3.25" width="16.5" height="15.5" rx="3.25" stroke="currentColor" strokeWidth="1.5" /></svg>
      </div>
      <h3 className="mt-[14px] text-[14px] font-[600] leading-[20px] text-[#1A2C44]">Account configuration</h3>
      <p className="mx-auto mt-[5px] max-w-[310px] text-[12px] leading-[18px] text-[#596171]">As you create the account, its configurations and capabilities will appear here.</p>
    </div>
  )
}

export function AccountConfigurationPreview({
  source,
  selectedAccount,
  configurations,
  details,
  userPath,
}: {
  source: AccountSource
  selectedAccount: NetworkAccount | null
  configurations: ConfigurationKind[]
  details: AccountDetailsDraft
  userPath?: UserPath
}) {
  const isNewAccount = source === "new"
  const showEmpty = !isNewAccount && !selectedAccount
  const draftName = getDraftName(details) || "New account"
  const draftAccount: NetworkAccount = {
    id: "new-account",
    name: draftName,
    email: details.accountEmail,
    configurations: [],
    country: details.country === "United States" ? "US" as const : details.country === "Canada" ? "CA" as const : details.country === "United Kingdom" ? "UK" as const : "UK" as const,
    initials: initialsFor(draftName),
  }
  const account = isNewAccount ? draftAccount : selectedAccount ?? draftAccount
  const hasPopulatedDetail = Boolean(
    getDraftName(details)
    || details.accountEmail.trim()
    || details.country
    || configurations.length > 0,
  )
  const showPreviewShadow = !isNewAccount || hasPopulatedDetail
  const existingConfigurations = isNewAccount ? [] : account.configurations
  const effectiveConfigurations = Array.from(new Set([
    ...existingConfigurations,
    ...configurations,
  ]))
  const listedOptions = getConfigurationOptions(userPath)
  const hasGroups = listedOptions.some((option) => effectiveConfigurations.includes(option.id))
  const lastSelectedId = [...listedOptions].reverse().find((option) => effectiveConfigurations.includes(option.id))?.id
  const [previewMode, setPreviewMode] = useState<"dashboard" | "api">("dashboard")
  const existingKey = existingConfigurations.join(",")
  const selectedConfigIds = listedOptions
    .filter((option) => effectiveConfigurations.includes(option.id))
    .map((option) => option.id)
  const selectedConfigKey = selectedConfigIds.join(",")
  const [expandedIds, setExpandedIds] = useState<string[]>(() => [...existingConfigurations])
  const previewAccountKey = `${source}:${account.id}`
  const selectionRef = useRef({
    accountKey: previewAccountKey,
    ids: existingConfigurations,
  })

  useLayoutEffect(() => {
    const previous = selectionRef.current
    const accountChanged = previous.accountKey !== previewAccountKey
    const added = selectedConfigIds.filter((id) => !previous.ids.includes(id))
    selectionRef.current = {
      accountKey: previewAccountKey,
      ids: selectedConfigIds,
    }

    if (accountChanged) {
      setExpandedIds(existingKey.split(",").filter(Boolean))
      return
    }

    if (added.length === 0) return
    setExpandedIds((current) => Array.from(new Set([
      ...current,
      ...added,
    ])))
  }, [existingKey, previewAccountKey, selectedConfigKey])

  return (
    <div className="relative flex h-full w-full flex-col" data-configuration-preview data-preview-mode={previewMode}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="w-full max-w-[540px]">
      {showEmpty ? (
        <EmptyAccountPreview />
      ) : (
        <PreviewModeFrame
          mode={SHOW_API_PREVIEW ? previewMode : "dashboard"}
          showShadow={showPreviewShadow}
          dashboard={(
        <div>
          <div className="px-[22px] py-[18px]">
            <div className="flex items-center gap-[12px]">
              <AccountAvatar
                account={account}
                size={44}
                awaken={isNewAccount ? Boolean(getDraftName(details)) : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[8px]">
                  <p data-preview-account-name className="min-w-0 flex-1 truncate text-[16px] font-[650] leading-[22px] tracking-[-0.18px] text-[#1A2C44]">{account.name}</p>
                  {(!isNewAccount || details.country) ? <CountryBadge country={isNewAccount ? details.country : account.country} /> : null}
                </div>
                <p className="mt-[2px] flex min-w-0 items-center text-[12px] leading-[17px]">
                  <span className={`min-w-0 truncate ${account.email ? "text-[#596171]" : "text-[#818DA0]"}`}>
                    {account.email || "Add an account email"}
                  </span>
                  {!isNewAccount && account.id ? (
                    <>
                      <span className="shrink-0 px-[4px] text-[#818DA0]">·</span>
                      <span className="min-w-0 truncate text-[#596171]">{account.id}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#EBEEF1] px-[22px] py-[18px]">
            <div className="inline-flex items-center gap-[4px]">
              <p className="text-[13px] font-[600] leading-[22px] text-[#1A2C44]">Configurations and capabilities</p>
              <FieldHint label="Configurations and capabilities">
                A configuration represents what an account can do, and capabilities are the features it enables.
              </FieldHint>
            </div>
            <Expand open={!hasGroups}>
              <p className="mt-[6px] text-[12px] leading-[17px] text-[#818DA0]">
                As you select configurations in the form, its associated capabilities are added.
              </p>
            </Expand>
            <div className={hasGroups ? "mt-[12px]" : undefined}>
              {listedOptions.map((option) => {
                const selected = effectiveConfigurations.includes(option.id)
                const capabilities = option.id === "customer"
                  ? []
                  : getCapabilitiesForGroup(option.id, effectiveConfigurations, details.disabledCapabilities, details.additionalCapabilities)
                const isLast = option.id === lastSelectedId
                return (
                  <Expand key={option.id} open={selected}>
                    <div className={isLast ? undefined : "pb-[14px]"}>
                      <ConfigurationCapabilityGroup
                        id={option.id}
                        title={option.title}
                        capabilities={capabilities}
                        expanded={expandedIds.includes(option.id)}
                        onToggle={() => setExpandedIds((current) => (
                          current.includes(option.id)
                            ? current.filter((id) => id !== option.id)
                            : [...current, option.id]
                        ))}
                        collapsible={capabilities.length > 0}
                      />
                    </div>
                  </Expand>
                )
              })}
            </div>
          </div>
        </div>
          )}
          api={(
            <AccountApiPreview
              embedded
              source={source}
              selectedAccount={selectedAccount}
              configurations={configurations}
              details={details}
              userPath={userPath}
            />
          )}
        />
      )}
        </div>
      </div>
      {SHOW_API_PREVIEW && !showEmpty && userPath !== "direct" ? (
        <div className="flex shrink-0 justify-center pb-[8px] pt-[18px]">
          <PreviewModeToggle value={previewMode} onChange={setPreviewMode} />
        </div>
      ) : null}
    </div>
  )
}
