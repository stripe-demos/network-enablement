'use client'

import { useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { getFormTokens } from "./shared/formTokens"
import { Checkbox } from "./shared/Checkbox"
import { SegmentedControl } from "@/components/SegmentedControl"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { useChildSettingStyle, getChildSettingContentClass, getChildSettingFillClass } from "@/components/creation-workspace/childSettingStyle"

type ApiAccessPolicyFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string) => void
}

type AccessMethod = "ip" | "advanced"

const ACCESS_POLICY_DOCS = "https://docs.stripe.com/keys/access-policies"

// The flagged request's conditions (Figma "Review and confirm safe conditions").
const SAFE_CONDITIONS = [
  { id: "ip", label: "IP address", value: "203.0.113.42" },
  { id: "client", label: "Client", value: "Chrome" },
  { id: "country", label: "Country", value: "🇺🇸 United States" },
  { id: "asn", label: "ASN", value: "AS7224 (AWS)" },
]
const SAFE_CONDITION_IDS = SAFE_CONDITIONS.map((c) => c.id)
// The IP that was just confirmed safe — pre-fills the policy allowlist.
const SAFE_IP = "203.0.113.42"

// Keys the policy can be assigned to (Figma "Assign your policy to keys").
const POLICY_KEYS = [
  { id: "jane", name: "Jane's API key", secret: "rk_live_…sfet", permissions: "Restricted", accessPolicy: "None" },
  { id: "k1", name: "Billing worker", secret: "rk_live_…ewje", permissions: "Restricted", accessPolicy: "None" },
  { id: "k2", name: "Analytics reader", secret: "sk_live_…wrwe", permissions: "Full", accessPolicy: "None" },
  { id: "k3", name: "Webhook handler", secret: "rk_live_…dfdg", permissions: "Restricted", accessPolicy: "IP allowlist" },
  { id: "k4", name: "Mobile backend", secret: "rk_live_…wer4", permissions: "Full", accessPolicy: "None" },
  { id: "k5", name: "Reporting exporter", secret: "sk_live_…fgfd", permissions: "Restricted", accessPolicy: "None" },
]
const POLICY_KEY_IDS = POLICY_KEYS.map((k) => k.id)

export function defaultApiAccessPolicyData(): Record<string, any> {
  return {
    safeConditions: [...SAFE_CONDITION_IDS],
    createPolicy: false,
    name: "",
    description: "",
    accessMethod: "ip" as AccessMethod,
    ips: [],
    countries: [],
    denyThreats: true,
    keyIds: [], // assigning keys is optional — start with none selected
  }
}

function Expandable({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Reused verbatim from CouponForm's Toggle.
function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const { productFormStyle } = useProductFormStyle()
  const t = getFormTokens(productFormStyle).toggle
  const isRefresh = productFormStyle === "refresh"
  const [hasInteracted, setHasInteracted] = useState(false)
  if (isRefresh) {
    return (
      <button
        type="button"
        className={`t-toggle group relative shrink-0 rounded-full border ${t.trackClass} ${checked ? t.onClass : t.offClass} ${hasInteracted ? "is-init" : ""}`}
        data-on={checked ? "true" : "false"}
        onClick={() => {
          setHasInteracted(true)
          onChange(!checked)
        }}
        role="switch"
        aria-checked={checked}
      >
        <span className={`t-toggle-thumb absolute left-0 rounded-full bg-white shadow-[0_1px_1px_rgba(33,37,44,0.16)] ${t.knobClass}`} />
      </button>
    )
  }
  return (
    <button
      type="button"
      className={`group relative shrink-0 rounded-full border transition-colors ${t.trackClass} ${checked ? t.onClass : t.offClass}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute rounded-full bg-white shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-all ${t.knobClass} ${
          checked ? `${t.knobOnPos} ${t.knobOnBorder}` : `${t.knobOffPos} ${t.knobOffBorder}`
        }`}
      />
    </button>
  )
}

// Pill-chip input — the tag pattern from SubscriptionForm's MultiSelectDropdown.
function ChipInput({ values, onChange, placeholder }: { values: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const { productFormStyle } = useProductFormStyle()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const [draft, setDraft] = useState("")

  const boxClass = isRefresh
    ? "border-[#D5DEE7] focus-within:border-[#A0C8F0] focus-within:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"
    : isSail
      ? "border-[#D8DEE4] focus-within:border-[#088EF9] focus-within:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
      : "border-[#D8DEE4] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7]"
  const textClass = isRefresh
    ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B]"
    : isSail
      ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0]"
      : "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688]"
  const boxSizingClass = isSail ? "min-h-[72px] p-[8px]" : isRefresh ? "min-h-[64px] p-[8px]" : "min-h-[52px] p-[6px]"
  const chipClass = isSail
    ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#596171]"
    : isRefresh
      ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#526378]"
      : "text-[11px] font-[400] leading-[16px] text-[#596171]"

  const commit = () => {
    const seen = new Set(values)
    const parts = draft
      .split(",")
      .map((p) => p.trim())
      .filter((p) => {
        if (!p || seen.has(p)) return false
        seen.add(p)
        return true
      })
    if (parts.length) onChange([...values, ...parts])
    setDraft("")
  }

  return (
    <div className={`flex w-full flex-wrap content-start gap-[4px] rounded-[6px] border bg-white transition-all ${boxSizingClass} ${boxClass}`}>
      {values.map((value) => (
        <span
          key={value}
          className={`flex items-center gap-[4px] rounded-full border border-[#D8DEE4] bg-[#F6F8FA] px-[8px] py-[2px] ${chipClass}`}
        >
          {value}
          <button
            type="button"
            className="text-[#9CA3B0] hover:text-[#596171]"
            onClick={() => onChange(values.filter((v) => v !== value))}
            aria-label={`Remove ${value}`}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M2 2L6 6M6 2L2 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <input
        className={`min-w-[120px] flex-1 bg-transparent px-[2px] outline-none ${textClass}`}
        placeholder={values.length ? "" : placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            commit()
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}

export function ApiAccessPolicyForm({ data, onChange }: ApiAccessPolicyFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { childSettingStyle } = useChildSettingStyle()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"

  const labelClass = tokens.labelClass
  const inputClass = tokens.inputClass
  const textareaClass = tokens.textareaClass
  const helperClass = tokens.helperClass
  const toggleRowClass = tokens.toggleRow

  const set = (key: string, value: unknown) => onChange({ [key]: value })

  const selectedConditions: string[] = data.safeConditions ?? SAFE_CONDITION_IDS
  const allConditionsSelected = selectedConditions.length === SAFE_CONDITIONS.length
  const createPolicy = Boolean(data.createPolicy)
  const accessMethod: AccessMethod = data.accessMethod ?? "ip"
  const ips: string[] = data.ips ?? []
  const countries: string[] = data.countries ?? []
  const denyThreats = data.denyThreats ?? true
  const keyIds: string[] = data.keyIds ?? []
  const allKeysSelected = keyIds.length === POLICY_KEYS.length

  // Child-setting treatment (indent/rail/tint/filled) — mirrors CouponForm.
  const toggleBlockGap = isSail ? "gap-[16px]" : isRefresh ? "gap-[12px]" : "gap-[10px]"
  const toggleBlockPad = isSail ? "px-[16px] py-[16px]" : isRefresh ? "px-[12px] py-[12px]" : "px-[12px] py-[10px]"
  const toggleBlockSurface = isRefresh ? "bg-[#F6F9FC]" : "bg-[#F6F8FA]"
  const childBlock = (enabled: boolean) =>
    `flex flex-col ${toggleBlockGap} ${getChildSettingFillClass(childSettingStyle, enabled, { surface: toggleBlockSurface, padding: toggleBlockPad })}`
  const childContent = getChildSettingContentClass(childSettingStyle, {
    surface: toggleBlockSurface,
    padding: toggleBlockPad,
    isRefresh,
  })

  const docsLinkClass = isRefresh
    ? "text-[#1C1E54] transition-colors hover:text-[#142234]"
    : "text-[#533AFD] transition-colors hover:text-[#4730E0]"

  const tableBorder = isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"
  const tableHeadBg = "bg-white"
  const tableHeadCell = isSail
    ? "py-[8px] text-left text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#6C7688]"
    : isRefresh
      ? "py-[8px] text-left text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#526378]"
      : "py-[8px] text-left text-[12px] font-[400] leading-[16px] text-[#6C7688]"
  const tableNameCell = isSail
    ? "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
    : isRefresh
      ? "text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234]"
      : "text-[12px] font-[500] leading-[16px] text-[#1A2C44]"
  const tableValueCell = isSail
    ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#596171]"
    : isRefresh
      ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#526378]"
      : "text-[12px] font-[400] leading-[16px] text-[#596171]"
  const tableSecretCell = isSail
    ? "font-mono text-[13px] leading-[20px] text-[#6C7688]"
    : isRefresh
      ? "font-mono text-[12px] leading-[20px] text-[#526378]"
      : "font-mono text-[11px] leading-[16px] text-[#6C7688]"
  const checkboxHeadCell = isSail ? "w-[40px] py-[10px] pl-[12px]" : "w-[40px] py-[8px] pl-[12px]"
  const checkboxBodyCell = isSail ? "py-[10px] pl-[12px]" : "py-[9px] pl-[12px]"
  const bodyCellPadding = isSail ? "py-[10px]" : "py-[9px]"
  const rowBorder = isRefresh ? "border-[#F1F5F9]" : "border-[#F0F3F7]"

  const toggleCondition = (id: string) =>
    set("safeConditions", selectedConditions.includes(id) ? selectedConditions.filter((c) => c !== id) : [...selectedConditions, id])
  const toggleAllConditions = (next: boolean) => set("safeConditions", next ? [...SAFE_CONDITION_IDS] : [])
  const toggleKey = (id: string) =>
    set("keyIds", keyIds.includes(id) ? keyIds.filter((k) => k !== id) : [...keyIds, id])
  const toggleAllKeys = (next: boolean) => set("keyIds", next ? [...POLICY_KEY_IDS] : [])

  const onCreatePolicyChange = (next: boolean) => {
    // Pre-fill the allowlist with the IP just confirmed safe, so the policy starts useful.
    if (next && ips.length === 0) onChange({ createPolicy: true, ips: [SAFE_IP] })
    else set("createPolicy", next)
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {/* 1 — Review the flagged request's safe conditions */}
      <div className="flex flex-col gap-[2px]">
        <label className={labelClass}>Safe conditions</label>
        <p className={helperClass}>Requests that match these conditions won&apos;t be flagged.</p>
        <div className={`mt-[6px] overflow-hidden rounded-[8px] border bg-white ${tableBorder}`}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className={`border-b ${tableBorder} ${tableHeadBg}`}>
                <th className={`${checkboxHeadCell} align-middle`}>
                  <Checkbox checked={allConditionsSelected} onChange={toggleAllConditions} />
                </th>
                <th className={`${tableHeadCell} pr-[8px]`}>Condition</th>
                <th className={`${tableHeadCell} pr-[12px]`}>Value</th>
              </tr>
            </thead>
            <tbody>
              {SAFE_CONDITIONS.map((c) => (
                <tr key={c.id} className={`border-b ${rowBorder} last:border-b-0`}>
                  <td className={`${checkboxBodyCell} align-middle`}>
                    <Checkbox checked={selectedConditions.includes(c.id)} onChange={() => toggleCondition(c.id)} />
                  </td>
                  <td className={`${bodyCellPadding} pr-[8px] ${tableNameCell}`}>{c.label}</td>
                  <td className={`${bodyCellPadding} pr-[12px] ${tableValueCell}`}>{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2 — Optionally harden the key with an access policy */}
      <div className={childBlock(createPolicy)}>
        <div className={toggleRowClass}>
          <span>
            Access policy
            {" · "}
            <a className={docsLinkClass} href={ACCESS_POLICY_DOCS} target="_blank" rel="noreferrer">Docs</a>
          </span>
          <Toggle checked={createPolicy} onChange={onCreatePolicyChange} />
        </div>

        <Expandable show={createPolicy}>
          <div className={`${childContent} flex flex-col gap-[16px]`}>
            {/* Details */}
            <div className="flex flex-col gap-[4px]">
              <label className={labelClass}>Policy name</label>
              <input
                className={inputClass}
                placeholder="e.g. Production servers only"
                value={data.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className={labelClass}>Description</label>
              <textarea
                className={textareaClass}
                placeholder="Add context for teammates who manage this policy"
                value={data.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            {/* Access controls */}
            <div className="flex flex-col gap-[8px]">
              <label className={labelClass}>Access method</label>
              <SegmentedControl
                value={accessMethod}
                onChange={(v) => set("accessMethod", v)}
                options={["ip", "advanced"] as const}
                getDisplayValue={(v) => (v === "ip" ? "IP addresses" : "Advanced network")}
              />
              <p className={helperClass}>
                {accessMethod === "ip"
                  ? "Limit key access to specific IP addresses or ranges."
                  : "Limit access by ASN and country, and deny common threats."}
              </p>
            </div>

            {accessMethod === "ip" ? (
              <div className="flex flex-col gap-[4px]">
                <label className={labelClass}>IP addresses</label>
                <ChipInput values={ips} onChange={(v) => set("ips", v)} placeholder="192.168.1.1, 10.0.0.0/24" />
                <p className={helperClass}>You&apos;ll only be able to use this key from these addresses or ranges.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-[4px]">
                  <label className={labelClass}>Allowed countries</label>
                  <ChipInput values={countries} onChange={(v) => set("countries", v)} placeholder="United States, Canada" />
                  <p className={helperClass}>Requests from outside these countries are blocked.</p>
                </div>
                <div className={toggleRowClass}>
                  <span>Deny common threats</span>
                  <Toggle checked={denyThreats} onChange={(v) => set("denyThreats", v)} />
                </div>
              </>
            )}

            {/* Assign to keys */}
            <div className="flex flex-col gap-[4px]">
              <label className={labelClass}>Assign to keys</label>
              <p className={helperClass}>Select the keys this policy applies to.</p>
              <div className={`mt-[4px] overflow-x-auto overflow-y-hidden rounded-[8px] border bg-white ${tableBorder}`}>
                <table className="w-full min-w-[440px] border-collapse text-left">
                  <thead>
                    <tr className={`border-b ${tableBorder} ${tableHeadBg}`}>
                      <th className={`${checkboxHeadCell} align-middle`}>
                        <Checkbox checked={allKeysSelected} onChange={toggleAllKeys} />
                      </th>
                      <th className={`${tableHeadCell} pr-[8px]`}>Name</th>
                      <th className={`${tableHeadCell} pr-[8px]`}>Key secret</th>
                      <th className={`${tableHeadCell} pr-[8px]`}>Permissions</th>
                      <th className={`${tableHeadCell} pr-[12px]`}>Access policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {POLICY_KEYS.map((k) => (
                      <tr key={k.id} className={`border-b ${rowBorder} last:border-b-0`}>
                        <td className={`${checkboxBodyCell} align-middle`}>
                          <Checkbox checked={keyIds.includes(k.id)} onChange={() => toggleKey(k.id)} />
                        </td>
                        <td className={`${bodyCellPadding} pr-[8px] ${tableNameCell} whitespace-nowrap`}>{k.name}</td>
                        <td className={`${bodyCellPadding} pr-[8px] ${tableSecretCell} whitespace-nowrap`}>{k.secret}</td>
                        <td className={`${bodyCellPadding} pr-[8px] ${tableValueCell} whitespace-nowrap`}>{k.permissions}</td>
                        <td className={`${bodyCellPadding} pr-[12px] ${tableValueCell} whitespace-nowrap`}>{k.accessPolicy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Expandable>
      </div>
    </div>
  )
}
