'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { AccountApiPreview } from "./AccountApiPreview"
import { AccountAvatar, CheckIcon, CountryBadge, useCardCreateTypeScale } from "./AccountConfigurationPrimitives"
import {
  EMAIL_PATTERN,
  getCapabilitiesForGroup,
  getConfigurationOptions,
  getDraftName,
  type AccountDetailsDraft,
  type AccountSource,
  type ConfigurationKind,
  type NetworkAccount,
  type PayoutMethod,
  type UserPath,
} from "./model"

const SHOW_API_PREVIEW = true
const EXPAND_MS = 280
const EXPAND_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

type PreviewMode = "dashboard" | "api"

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
}: {
  id: string
  title: string
  capabilities: string[]
}) {
  const type = useCardCreateTypeScale()
  const capabilityCount = capabilities.length
  const capabilityLabel = capabilityCount === 0 ? "" : capabilityCount === 1 ? "1 capability" : `${capabilityCount} capabilities`
  const previewLimit = 6
  const [showAll, setShowAll] = useState(false)
  const visibleCapabilities = showAll || capabilityCount <= previewLimit
    ? capabilities
    : capabilities.slice(0, previewLimit)
  const hiddenCount = capabilityCount - visibleCapabilities.length

  return (
    <div data-preview-configuration={id}>
      <div className="flex w-full items-center gap-[8px]">
        <CheckIcon />
        <span className={type.previewConfig}>{title}</span>
      </div>
      {capabilityCount > 0 ? (
        <div className="ml-[24px] mt-[10px] border-l border-[#E3E8EF] pl-[12px]">
          <p className="mb-[6px] text-[12px] font-[400] leading-[16px] text-[#818DA0]">{capabilityLabel}</p>
          <div className="flex flex-col gap-[6px]">
            {visibleCapabilities.map((capability) => (
              <div key={capability} data-preview-capability={capability} data-enabled="true" className="min-w-0">
                <span className={type.previewCapability}>{capability}</span>
              </div>
            ))}
          </div>
          {hiddenCount > 0 ? (
            <button
              type="button"
              className={`mt-[6px] ${type.previewEmpty} hover:text-[#4730E0]`}
              onClick={() => setShowAll(true)}
            >
              Show {hiddenCount} more
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function paymentMethodLabel(name: string) {
  const stripped = name.replace(/ payments$/i, "").trim()
  return stripped.toLowerCase() === "card" ? "card" : stripped
}

function joinPhraseList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ""
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function acceptPaymentsPhrase(capabilities: string[]) {
  const names = capabilities.map(paymentMethodLabel)
  if (names.length === 0) return "accept payments from its own users"
  if (names.length <= 3) return `use ${joinPhraseList(names)} to accept payments from its own users`
  const others = names.length - 3
  return `use ${names[0]}, ${names[1]}, ${names[2]}, and ${others} other way${others === 1 ? "" : "s"} to accept payments from its own users`
}

const PAYOUT_DESTINATION: Record<PayoutMethod, string> = {
  "stripe-balance": "Stripe balance",
  "bank-account": "bank account",
  "debit-card": "debit card",
}

function sendMoneyDestination(payoutMethods: PayoutMethod[]) {
  const labels = payoutMethods.map((method) => PAYOUT_DESTINATION[method]).filter(Boolean)
  if (labels.length === 0) return "this account"
  if (labels.length === 1) return `this account's ${labels[0]}`
  if (labels.length === 2) return `this account's ${labels[0]} or ${labels[1]}`
  return `this account's ${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`
}

const PLATFORM_NAME = "Mindbody"

function sendMoneyPhrase(payoutMethods: PayoutMethod[], also: boolean) {
  const alsoWord = also ? " also" : ""
  return `${PLATFORM_NAME} can${alsoWord} send money to ${sendMoneyDestination(payoutMethods)}.`
}

function describeFundsFlow({
  merchant,
  customer,
  recipient,
  merchantCapabilities,
  payoutMethods,
  accountName,
}: {
  merchant: boolean
  customer: boolean
  recipient: boolean
  merchantCapabilities: string[]
  payoutMethods: PayoutMethod[]
  accountName?: string
}) {
  const subject = accountName?.trim() && accountName !== "New account" ? accountName.trim() : "This account"
  const collect = merchant
    ? `${subject} can ${acceptPaymentsPhrase(merchantCapabilities)}.`
    : ""
  const payYou = merchant
    ? `It can then use this money to pay ${PLATFORM_NAME} a one-time or recurring subscription fee.`
    : `${subject} can pay ${PLATFORM_NAME} a one-time or recurring subscription fee.`
  const fromYou = sendMoneyPhrase(payoutMethods, false)
  const alsoFromYou = sendMoneyPhrase(payoutMethods, true)

  if (merchant && customer && recipient) return `${collect} ${payYou} ${alsoFromYou}`
  if (merchant && customer) return `${collect} ${payYou}`
  if (merchant && recipient) return `${collect} ${alsoFromYou}`
  if (customer && recipient) return `${payYou} ${alsoFromYou}`
  if (merchant) return collect
  if (customer) return payYou
  if (recipient) return fromYou
  return ""
}

function FundsFlowLines({
  configurations,
  merchantCapabilities,
  payoutMethods,
  userPath,
  accountName,
}: {
  configurations: ConfigurationKind[]
  merchantCapabilities: string[]
  payoutMethods: PayoutMethod[]
  userPath?: UserPath
  accountName?: string
}) {
  const type = useCardCreateTypeScale()
  const merchant = userPath !== "direct" && configurations.includes("merchant")
  const customer = configurations.includes("customer")
  const recipient = configurations.includes("recipient")
  const summary = describeFundsFlow({
    merchant,
    customer,
    recipient,
    merchantCapabilities,
    payoutMethods,
    accountName,
  })
  if (!summary) return null
  return <p className={type.previewCapability}>{summary}</p>
}

function initialsFor(name: string) {
  if (!name || name === "New account") return "NA"
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function PreviewModeToggle({
  value,
  onChange,
  showApi,
}: {
  value: PreviewMode
  onChange: (next: PreviewMode) => void
  showApi: boolean
}) {
  const type = useCardCreateTypeScale()
  const itemClass = (selected: boolean) =>
    `flex h-[32px] items-center justify-center gap-[6px] rounded-[6px] px-[12px] ${type.previewToggle} transition-colors ${
      selected ? "bg-[#F4F6F8] font-[600] text-[#1A2C44]" : "font-[500] text-[#6C7688] hover:text-[#1A2C44]"
    }`

  return (
    <div className="flex items-center rounded-[8px] border border-[#E6EAF0] bg-white p-[3px] shadow-[0_1px_2px_rgba(20,34,52,0.04),0_10px_28px_rgba(20,34,52,0.08)]">
      <button type="button" className={itemClass(value === "dashboard")} onClick={() => onChange("dashboard")} aria-pressed={value === "dashboard"}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 5h11M5.5 5v7.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Preview
      </button>
      {showApi ? (
        <button type="button" className={itemClass(value === "api")} onClick={() => onChange("api")} aria-pressed={value === "api"}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3.5L2.5 7 5 10.5M9 3.5L11.5 7 9 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          API
        </button>
      ) : null}
    </div>
  )
}

function PreviewModeFrame({
  mode,
  dashboard,
  api,
  showShadow,
}: {
  mode: PreviewMode
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

  const measure = (nextMode: PreviewMode) => {
    if (nextMode === "api") return apiRef.current?.offsetHeight ?? 0
    return dashboardRef.current?.offsetHeight ?? 0
  }

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
    const panes = [dashboardRef.current, apiRef.current].filter(Boolean) as HTMLDivElement[]
    if (panes.length === 0) return
    const observer = new ResizeObserver(() => {
      if (animatingRef.current) return
      const next = measure(modeRef.current)
      if (next) applyHeight(next, false)
    })
    panes.forEach((pane) => observer.observe(pane))
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
          style={{ opacity: mode === "dashboard" ? 1 : 0, pointerEvents: mode === "dashboard" ? "auto" : "none" }}
          aria-hidden={mode !== "dashboard"}
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
  const type = useCardCreateTypeScale()
  return (
    <div className="w-full rounded-[14px] border border-dashed border-[#C9D3DF] bg-white/70 px-[28px] py-[46px] text-center">
      <div className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#F1EEFF] text-[#675DFF]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M5.5 7.5h11M5.5 11h7M5.5 14.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><rect x="2.75" y="3.25" width="16.5" height="15.5" rx="3.25" stroke="currentColor" strokeWidth="1.5" /></svg>
      </div>
      <h3 className={`mt-[14px] ${type.previewSection}`}>Account configuration</h3>
      <p className={`mx-auto mt-[5px] max-w-[310px] ${type.previewEmpty}`}>As you create the account, its configurations and capabilities will appear here.</p>
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
  const type = useCardCreateTypeScale()
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
  const [emailSettled, setEmailSettled] = useState(false)
  useEffect(() => {
    if (!EMAIL_PATTERN.test(details.accountEmail.trim())) {
      setEmailSettled(false)
      return
    }
    const timeout = window.setTimeout(() => setEmailSettled(true), 500)
    return () => window.clearTimeout(timeout)
  }, [details.accountEmail])
  const visibleConfigurations = configurations
  const hasPopulatedDetail = Boolean(
    getDraftName(details)
    || emailSettled
    || details.country
    || configurations.length > 0,
  )
  const showPreviewShadow = !isNewAccount || hasPopulatedDetail
  const existingConfigurations = isNewAccount ? [] : account.configurations
  const effectiveConfigurations = Array.from(new Set([
    ...existingConfigurations,
    ...visibleConfigurations,
  ]))
  const listedOptions = getConfigurationOptions(userPath)
  const hasGroups = listedOptions.some((option) => effectiveConfigurations.includes(option.id))
  const lastSelectedId = [...listedOptions].reverse().find((option) => effectiveConfigurations.includes(option.id))?.id
  const [previewMode, setPreviewMode] = useState<PreviewMode>("dashboard")
  const showApi = SHOW_API_PREVIEW && userPath !== "direct"
  return (
    <div className="relative flex h-full w-full flex-col" data-configuration-preview data-preview-mode={previewMode}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="w-full max-w-[540px]">
      {showEmpty ? (
        <EmptyAccountPreview />
      ) : (
        <PreviewModeFrame
          mode={previewMode === "api" && !showApi ? "dashboard" : previewMode}
          showShadow={showPreviewShadow}
          dashboard={(
        <div>
          <div className="px-[22px] py-[18px]">
            <div className="flex items-center gap-[12px]">
              <AccountAvatar
                account={account}
                size={44}
                awaken={isNewAccount ? details.accountEmail.trim().length > 0 : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[8px]">
                  <p data-preview-account-name className={`min-w-0 flex-1 truncate ${type.previewName}`}>{account.name}</p>
                  {(!isNewAccount || details.country) ? <CountryBadge country={isNewAccount ? details.country : account.country} /> : null}
                </div>
                <p className={`mt-[2px] flex min-w-0 items-center ${type.previewMeta}`}>
                  <span className={`min-w-0 truncate ${account.email ? "text-[#596171]" : "text-[#818DA0]"}`}>
                    {account.email || "email@example.com"}
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

          <div className="mx-[22px] border-t border-[#F0F3F7]" />
          <div className="px-[22px] py-[18px]">
            <p className={type.previewSection}>Configurations</p>
            <Expand open={!hasGroups}>
              <p className={`mt-[6px] ${type.previewMeta} text-[#818DA0]`}>
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
                      />
                    </div>
                  </Expand>
                )
              })}
            </div>
            <Expand open={hasGroups}>
              <div className="mt-[28px]">
                <p className={type.previewSection}>Funds flow</p>
                <div className="mt-[8px]">
                  <FundsFlowLines
                    configurations={effectiveConfigurations}
                    merchantCapabilities={getCapabilitiesForGroup("merchant", effectiveConfigurations, details.disabledCapabilities, details.additionalCapabilities)}
                    payoutMethods={details.payoutMethods}
                    userPath={userPath}
                    accountName={account.name}
                  />
                </div>
              </div>
            </Expand>
          </div>
        </div>
          )}
          api={(
            <AccountApiPreview
              embedded
              source={source}
              selectedAccount={selectedAccount}
              configurations={visibleConfigurations}
              details={details}
              userPath={userPath}
            />
          )}
        />
      )}
        </div>
      </div>
      {!showEmpty ? (
        <div className="flex shrink-0 justify-center pb-[8px] pt-[18px]">
          <PreviewModeToggle value={previewMode} onChange={setPreviewMode} showApi={showApi} />
        </div>
      ) : null}
    </div>
  )
}
