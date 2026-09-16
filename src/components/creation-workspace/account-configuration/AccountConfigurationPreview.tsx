'use client'

import { motion } from "framer-motion"
import { useState } from "react"

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

const PREVIEW_CAPABILITY_LIMIT = 2

function ConfigurationCapabilityGroup({
  id,
  title,
  capabilities,
  defaultExpanded,
  collapsible,
}: {
  id: string
  title: string
  capabilities: string[]
  defaultExpanded: boolean
  collapsible: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)
  const visibleCapabilities = showAll ? capabilities : capabilities.slice(0, PREVIEW_CAPABILITY_LIMIT)
  const hiddenCount = capabilities.length - visibleCapabilities.length
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
          onClick={() => setExpanded((current) => !current)}
        >
          <CheckIcon />
          <span className="min-w-0 text-[12px] font-[600] leading-[16px] text-[#2C219E]">{title}</span>
          <span className="ml-auto flex items-center">
            {capabilityLabel ? (
              <span
                className={`overflow-hidden whitespace-nowrap text-[12px] leading-[16px] text-[#818DA0] transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  expanded ? "mr-0 max-w-0 opacity-0" : "mr-[8px] max-w-[140px] opacity-100"
                }`}
              >
                {capabilityLabel}
              </span>
            ) : null}
            <svg className={`shrink-0 text-[#6C7688] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${expanded ? "rotate-180" : ""}`} width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
        <motion.div
          initial={false}
          animate={showChildren ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="ml-[8px] mt-[8px] border-l border-[#D4DEE9] pl-[16px]">
            <div className="flex flex-col gap-[8px]">
            {visibleCapabilities.map((capability) => (
              <div key={capability} data-preview-capability={capability} data-enabled="true" className="min-w-0">
                <span className="text-[12px] leading-[18px] text-[#3C4F69]">{capability}</span>
              </div>
            ))}
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  className="self-start text-[12px] font-[600] leading-[16px] text-[#533AFD] hover:text-[#4730E0]"
                  onClick={() => setShowAll(true)}
                >
                  Show {hiddenCount} more
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

function initialsFor(name: string) {
  if (!name || name === "New account") return "NA"
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function EmptyAccountPreview() {
  return (
    <div className="w-full max-w-[440px] rounded-[14px] border border-dashed border-[#C9D3DF] bg-white/70 px-[28px] py-[46px] text-center">
      <div className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#F1EEFF] text-[#675DFF]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M5.5 7.5h11M5.5 11h7M5.5 14.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><rect x="2.75" y="3.25" width="16.5" height="15.5" rx="3.25" stroke="currentColor" strokeWidth="1.5" /></svg>
      </div>
      <h3 className="mt-[14px] text-[14px] font-[600] leading-[20px] text-[#1A2C44]">Account configuration</h3>
      <p className="mx-auto mt-[5px] max-w-[310px] text-[12px] leading-[18px] text-[#596171]">Choose an existing account or create a new one. Its configurations and capabilities will appear here.</p>
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
  if (!isNewAccount && !selectedAccount) return <EmptyAccountPreview />
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
  const existingConfigurations = isNewAccount ? [] : account.configurations
  const effectiveConfigurations = Array.from(new Set([
    ...existingConfigurations,
    ...configurations,
  ]))
  const effectiveOptions = getConfigurationOptions(userPath).filter((option) => effectiveConfigurations.includes(option.id))
  const previewGroups = [
    ...effectiveOptions.map((option) => ({
      id: option.id,
      title: option.title,
      capabilities: option.id === "customer"
        ? []
        : getCapabilitiesForGroup(option.id, effectiveConfigurations, details.disabledCapabilities, details.additionalCapabilities),
    })),
    ...(getCapabilitiesForGroup("other", effectiveConfigurations, details.disabledCapabilities, details.additionalCapabilities).length > 0
      ? [{
          id: "other",
          title: "Other",
          capabilities: getCapabilitiesForGroup("other", effectiveConfigurations, details.disabledCapabilities, details.additionalCapabilities),
        }]
      : []),
  ]
  return (
    <div className="w-full max-w-[540px]" data-configuration-preview>
      <div className="overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white shadow-[0_14px_38px_rgba(20,34,52,0.10)]">
        <div className="px-[22px] py-[18px]">
          <div className="flex items-start gap-[12px]">
            <AccountAvatar account={account} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-[6px]">
                <p data-preview-account-name className="truncate text-[16px] font-[650] leading-[22px] tracking-[-0.18px] text-[#1A2C44]">{account.name}</p>
                {isNewAccount ? <span data-preview-account-status className="rounded-full bg-[#F1F6FB] px-[7px] py-[2px] text-[10px] font-[600] leading-[14px] text-[#526378]">Draft</span> : null}
              </div>
              <p className="mt-[2px] flex min-w-0 items-baseline text-[12px] leading-[17px] text-[#596171]">
                <span className="shrink-0">{account.email || "Add an account email"}</span>
                {!isNewAccount && account.id ? (
                  <>
                    <span className="mx-[6px] shrink-0">·</span>
                    <span className="min-w-0 truncate font-mono">{account.id}</span>
                  </>
                ) : null}
              </p>
            </div>
            {(!isNewAccount || details.country) ? <CountryBadge country={isNewAccount ? details.country : account.country} /> : null}
          </div>
        </div>

        <div className="border-t border-[#ECF1F6] px-[22px] py-[18px]">
          <p className="text-[13px] font-[600] leading-[18px] text-[#1A2C44]">Configurations</p>
          <p className="mt-[4px] text-[12px] leading-[18px] text-[#818DA0]">A configuration defines what an account can do, and capabilities are the features it enables.</p>
          {effectiveOptions.length > 0 ? (
            <div className="mt-[12px] flex flex-col gap-[14px]">
              {previewGroups.map((group, index) => (
                <ConfigurationCapabilityGroup
                  key={group.id}
                  id={group.id}
                  title={group.title}
                  capabilities={group.capabilities}
                  defaultExpanded={index === 0}
                  collapsible={group.capabilities.length > 0}
                />
              ))}
            </div>
          ) : (
            <p className="mt-[7px] text-[12px] leading-[18px] text-[#818DA0]">Select configurations in the form to build this account setup.</p>
          )}
        </div>
      </div>
    </div>
  )
}
