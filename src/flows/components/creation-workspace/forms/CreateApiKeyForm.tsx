'use client'

import { useDeferredValue, useMemo, type ReactNode } from "react"

import { ScrollWithFade } from "@/components/ScrollWithFade"
import { SegmentedControl } from "@/components/SegmentedControl"
import { getFormTokens } from "./shared/formTokens"
import { CustomSelect } from "./shared/CustomSelect"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

export type Access = "none" | "read" | "write"
export type PermissionStrategy = "template" | "safe_full" | "full" | "custom"

export type ApiKeyResource = {
  id: string
  name: string
  description: string
  endpoints: string[]
  readOnly?: boolean
  sensitive?: boolean
}

export type ApiKeyCategory = {
  id: string
  name: string
  resources: ApiKeyResource[]
}

export type ApiKeyData = {
  name: string
  note: string
  strategy: PermissionStrategy
  templateId: string
  access: Record<string, Access>
}

export const API_KEY_DOCS = "https://docs.stripe.com/keys/permissions"

const resource = (
  id: string,
  name: string,
  description: string,
  endpoints: string[],
  options?: Pick<ApiKeyResource, "readOnly" | "sensitive">,
): ApiKeyResource => ({ id, name, description, endpoints, ...options })

// A representative Stripe API surface with the same source taxonomy as the Figma
// permissions editor. The prototype keeps enough rows to exercise navigation,
// filtering, endpoint chips, read-only resources, and sensitive-operation warnings.
export const API_KEY_CATEGORIES: ApiKeyCategory[] = [
  {
    id: "core",
    name: "Core",
    resources: [
      resource("account_links", "Account Links", "Create single-use links for account onboarding and updates.", ["/v1/account_links"]),
      resource("balance", "Balances", "View the current balance of your Stripe account.", ["/v1/balance"], { readOnly: true }),
      resource("balance_transactions", "Balance transaction sources", "Inspect activity that moves money through your Stripe balance.", ["/v1/balance_transactions"]),
      resource("charges", "Charges and refunds", "Create charges, issue refunds, and inspect payment activity.", ["/v1/charges", "/v1/refunds"]),
      resource("confirmation_tokens", "Confirmation tokens", "Use confirmation tokens to collect payment details safely.", ["/v1/confirmation_tokens/:id"]),
      resource("customers", "Customers", "Create and update saved customer, billing, and payment information.", ["/v1/customers", "/v1/customer_sessions", "/v2/core/accounts"]),
      resource("disputes", "Disputes", "Manage disputes and submit evidence for contested payments.", ["/v1/disputes"]),
      resource("events", "Events", "Read the account activity stream used by integrations and webhooks.", ["/v1/events"], { readOnly: true }),
      resource("files", "Files", "Upload and retrieve files used across Stripe resources.", ["/v1/files"]),
      resource("payment_intents", "Payment Intents", "Create and confirm payments across supported payment methods.", ["/v1/payment_intents"]),
      resource("payment_methods", "Payment methods", "Create and attach cards, bank accounts, and wallets.", ["/v1/payment_methods"]),
      resource("payouts", "Payouts", "Send funds from your Stripe balance to a bank account.", ["/v1/payouts"], { sensitive: true }),
    ],
  },
  {
    id: "billing",
    name: "Billing",
    resources: [
      resource("invoices", "Invoices", "Create, finalize, send, and pay customer invoices.", ["/v1/invoices"]),
      resource("subscriptions", "Subscriptions", "Create and manage recurring customer subscriptions.", ["/v1/subscriptions"]),
      resource("products", "Products", "Manage the products and services in your catalog.", ["/v1/products"]),
      resource("prices", "Prices", "Define recurring and one-time prices for products.", ["/v1/prices"]),
      resource("coupons", "Coupons and promotion codes", "Create discounts and customer-facing promotion codes.", ["/v1/coupons", "/v1/promotion_codes"]),
      resource("credit_notes", "Credit notes", "Adjust finalized invoices and customer balances.", ["/v1/credit_notes"]),
      resource("quotes", "Quotes", "Create and accept proposed pricing for customers.", ["/v1/quotes"]),
      resource("meters", "Billing meters", "Configure meters for usage-based billing.", ["/v1/billing/meters"]),
    ],
  },
  {
    id: "checkout",
    name: "Checkout",
    resources: [
      resource("checkout_sessions", "Checkout Sessions", "Create and retrieve hosted Checkout sessions.", ["/v1/checkout/sessions"]),
      resource("checkout_domains", "Checkout domains", "Register domains used by embedded Checkout.", ["/v1/checkout/domains"]),
    ],
  },
  {
    id: "climate",
    name: "Climate",
    resources: [
      resource("climate_orders", "Climate orders", "Purchase carbon removal from the Climate marketplace.", ["/v1/climate/orders"]),
      resource("climate_products", "Climate products", "Browse available carbon removal products.", ["/v1/climate/products"], { readOnly: true }),
    ],
  },
  {
    id: "connect",
    name: "Connect",
    resources: [
      resource("accounts", "Connected accounts", "Create and manage accounts connected to your platform.", ["/v1/accounts"]),
      resource("application_fees", "Application fees", "Inspect fees collected by your platform.", ["/v1/application_fees"], { readOnly: true }),
      resource("transfers", "Transfers", "Move funds to connected accounts.", ["/v1/transfers"], { sensitive: true }),
      resource("topups", "Top-ups", "Add funds to your Stripe balance.", ["/v1/topups"], { sensitive: true }),
      resource("capabilities", "Capabilities", "Request and inspect account capabilities.", ["/v1/accounts/:id/capabilities"]),
    ],
  },
  {
    id: "financial_connections",
    name: "Financial Connections",
    resources: [
      resource("fc_accounts", "Financial accounts", "Access permissioned bank account data.", ["/v1/financial_connections/accounts"]),
      resource("fc_sessions", "Sessions", "Create sessions that collect a customer's bank account.", ["/v1/financial_connections/sessions"]),
      resource("fc_transactions", "Transactions", "Refresh and read bank account transactions.", ["/v1/financial_connections/transactions"], { readOnly: true }),
    ],
  },
  {
    id: "iam",
    name: "IAM",
    resources: [
      resource("api_keys", "API keys", "Create and manage restricted API keys.", ["/v1/api_keys"], { sensitive: true }),
      resource("roles", "Roles", "Read account roles and their assigned permissions.", ["/v1/roles"], { readOnly: true }),
    ],
  },
  {
    id: "identity",
    name: "Identity",
    resources: [
      resource("verification_sessions", "Verification Sessions", "Create identity verification sessions.", ["/v1/identity/verification_sessions"]),
      resource("verification_reports", "Verification reports", "Read the results of identity checks.", ["/v1/identity/verification_reports"], { readOnly: true }),
    ],
  },
  {
    id: "issuing",
    name: "Issuing",
    resources: [
      resource("issuing_cards", "Cards", "Create, update, and replace issued cards.", ["/v1/issuing/cards"], { sensitive: true }),
      resource("cardholders", "Cardholders", "Manage people and businesses that hold cards.", ["/v1/issuing/cardholders"]),
      resource("authorizations", "Authorizations", "Approve and inspect real-time card spend.", ["/v1/issuing/authorizations"]),
      resource("issuing_transactions", "Transactions", "Read completed Issuing card transactions.", ["/v1/issuing/transactions"], { readOnly: true }),
    ],
  },
  {
    id: "orders",
    name: "Orders",
    resources: [
      resource("orders", "Orders", "Create and manage commerce orders.", ["/v1/orders"]),
      resource("order_returns", "Order returns", "Create and inspect returned order items.", ["/v1/order_returns"]),
    ],
  },
  {
    id: "payment_links",
    name: "Payment Links",
    resources: [
      resource("payment_links", "Payment Links", "Create and update shareable payment pages.", ["/v1/payment_links"]),
    ],
  },
  {
    id: "payment_orders",
    name: "Payment Orders",
    resources: [
      resource("payment_records", "Payment records", "Read normalized payment records across payment flows.", ["/v1/payment_records"], { readOnly: true }),
      resource("payment_attempts", "Payment attempts", "Inspect individual attempts associated with a payment.", ["/v1/payment_attempts"], { readOnly: true }),
    ],
  },
  {
    id: "radar",
    name: "Radar",
    resources: [
      resource("early_fraud_warnings", "Early fraud warnings", "Read network-provided fraud warnings.", ["/v1/radar/early_fraud_warnings"], { readOnly: true }),
      resource("reviews", "Reviews", "Approve or close payments held for manual review.", ["/v1/reviews"]),
      resource("value_lists", "Value lists", "Manage custom allow and block lists.", ["/v1/radar/value_lists"]),
    ],
  },
  {
    id: "reporting",
    name: "Reporting",
    resources: [
      resource("report_runs", "Report runs", "Generate and retrieve financial reports.", ["/v1/reporting/report_runs"]),
      resource("report_types", "Report types", "Read the report formats available to your account.", ["/v1/reporting/report_types"], { readOnly: true }),
    ],
  },
  {
    id: "sigma",
    name: "Sigma",
    resources: [
      resource("sigma_queries", "Saved queries", "Read saved Sigma queries and their metadata.", ["/v1/sigma/scheduled_query_runs"], { readOnly: true }),
    ],
  },
  {
    id: "stripe_apps",
    name: "Stripe Apps",
    resources: [
      resource("apps_secrets", "App secrets", "Store and retrieve secrets for installed Stripe Apps.", ["/v1/apps/secrets"]),
      resource("apps_authorizations", "App authorizations", "Inspect account authorizations for Stripe Apps.", ["/v1/apps/authorizations"], { readOnly: true }),
    ],
  },
  {
    id: "stripe_cli",
    name: "Stripe CLI permissions",
    resources: [
      resource("cli_sessions", "CLI sessions", "Create short-lived sessions used by the Stripe CLI.", ["/v1/stripe_cli/sessions"]),
    ],
  },
  {
    id: "tax",
    name: "Tax",
    resources: [
      resource("tax_calculations", "Calculations", "Calculate tax for customer transactions.", ["/v1/tax/calculations"]),
      resource("tax_transactions", "Transactions", "Create reversals and inspect recorded tax transactions.", ["/v1/tax/transactions"]),
      resource("tax_registrations", "Registrations", "Manage the jurisdictions where you collect tax.", ["/v1/tax/registrations"]),
    ],
  },
  {
    id: "terminal",
    name: "Terminal",
    resources: [
      resource("readers", "Readers", "Register and manage in-person card readers.", ["/v1/terminal/readers"]),
      resource("locations", "Locations", "Manage the locations where readers operate.", ["/v1/terminal/locations"]),
      resource("connection_tokens", "Connection tokens", "Create tokens used by Terminal SDKs.", ["/v1/terminal/connection_tokens"]),
    ],
  },
  {
    id: "webhook",
    name: "Webhook",
    resources: [
      resource("webhook_endpoints", "Webhook endpoints", "Create and update destinations that receive Stripe events.", ["/v1/webhook_endpoints"]),
    ],
  },
]

const ALL_RESOURCES = API_KEY_CATEGORIES.flatMap((category) =>
  category.resources.map((item) => ({ ...item, categoryId: category.id })),
)

type ApiKeyTemplate = {
  id: string
  name: string
  description: string
  rules: Record<string, Access>
}

export const API_KEY_TEMPLATES: ApiKeyTemplate[] = [
  { id: "one_time", name: "One-time payments", description: "Checkout, Payment Links, and custom payment forms", rules: { core: "write", checkout: "write", payment_links: "write", radar: "read", reporting: "read", webhook: "write" } },
  { id: "subscriptions", name: "Subscriptions and billing", description: "Recurring billing, invoices, and usage-based pricing", rules: { core: "write", billing: "write", checkout: "write", reporting: "read", webhook: "write" } },
  { id: "platform", name: "Platform and marketplace", description: "Connected accounts, transfers, and payouts", rules: { core: "write", connect: "write", billing: "read", reporting: "read", webhook: "write" } },
  { id: "terminal", name: "In-person payments", description: "Terminal readers, locations, and payments", rules: { core: "write", terminal: "write", reporting: "read", webhook: "write" } },
  { id: "reporting", name: "Reporting and analytics", description: "Read-only access for finance and reconciliation", rules: { core: "read", billing: "read", connect: "read", reporting: "read", radar: "read", tax: "read" } },
]

const capForResource = (level: Access, item: ApiKeyResource): Access =>
  item.readOnly && level === "write" ? "read" : level

export function computeAccessForTemplate(templateId: string): Record<string, Access> {
  const template = API_KEY_TEMPLATES.find((item) => item.id === templateId) ?? API_KEY_TEMPLATES[0]
  return Object.fromEntries(
    ALL_RESOURCES.map((item) => [item.id, capForResource(template.rules[item.categoryId] ?? "none", item)]),
  )
}

export function computeAccessForStrategy(strategy: PermissionStrategy, templateId = "one_time") {
  if (strategy === "template") return computeAccessForTemplate(templateId)
  if (strategy === "custom") return Object.fromEntries(ALL_RESOURCES.map((item) => [item.id, "none" as Access]))
  return Object.fromEntries(
    ALL_RESOURCES.map((item) => [
      item.id,
      strategy === "safe_full" && item.sensitive ? "none" : capForResource("write", item),
    ]),
  )
}

export function defaultApiKeyData(): ApiKeyData {
  return {
    name: "",
    note: "",
    strategy: "template",
    templateId: "one_time",
    access: computeAccessForTemplate("one_time"),
  }
}

export function countGrants(access: Record<string, Access>) {
  let read = 0
  let write = 0
  for (const item of ALL_RESOURCES) {
    const value = access[item.id] ?? "none"
    if (value === "read") read += 1
    if (value === "write") write += 1
  }
  return { read, write, total: read + write }
}

export function apiKeyGrantSummary(access: Record<string, Access>) {
  const { read, write, total } = countGrants(access)
  if (total === 0) return "No permissions selected"
  return `${total} permissions · ${read} read, ${write} write`
}

export function categoryGrantSummary(category: ApiKeyCategory, access: Record<string, Access>) {
  const values = category.resources.map((item) => access[item.id] ?? "none")
  const granted = values.filter((value) => value !== "none").length
  const read = values.filter((value) => value === "read").length
  const write = values.filter((value) => value === "write").length
  const uniform = values.every((value) => value === values[0]) ? values[0] : undefined
  return { granted, read, write, uniform }
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="m9.5 9.5 2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// Name + note — the key's identity. Shared by the simple form and the Advanced
// "Key details" editor panel so the fields never leave the experience.
function ApiKeyDetailsFields({
  data,
  onChange,
  errorFields,
  autoFocus,
}: {
  data: ApiKeyData
  onChange: (patch: Partial<ApiKeyData>) => void
  errorFields?: Set<string>
  autoFocus?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[4px]">
        <label htmlFor="api-key-name" className={tokens.labelClass}>Name</label>
        <input
          id="api-key-name"
          autoFocus={autoFocus}
          className={errorFields?.has("name") ? tokens.errorInputClass : tokens.inputClass}
          placeholder="Production server"
          value={data.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        {errorFields?.has("name") ? (
          <p className="text-[11px] leading-[16px] text-[#DF1B41]">Enter a name for this key.</p>
        ) : (
          <p className={tokens.helperClass}>Name the key for the place or service that will use it.</p>
        )}
      </div>
      <div className="flex flex-col gap-[4px]">
        <label htmlFor="api-key-note" className={tokens.labelClass}>Note</label>
        <textarea
          id="api-key-note"
          className={`${tokens.textareaClass} min-h-[64px]`}
          placeholder="Where this key is used or stored"
          value={data.note}
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </div>
    </div>
  )
}

// The Advanced-mode "Key details" view — the same name/note form, shown in the editor
// column (selected from the tree) rather than dropping back to the simple modal.
export function ApiKeyKeyDetailsEditor({
  data,
  onChange,
  errorFields,
}: {
  data: ApiKeyData
  onChange: (patch: Partial<ApiKeyData>) => void
  errorFields?: Set<string>
}) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 px-[16px] pt-[12px]">
        <h2 className="truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">Key details</h2>
      </div>
      <ScrollWithFade enabled={isRefresh} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-[12px]">
        <div className="px-4">
          <ApiKeyDetailsFields data={data} onChange={onChange} errorFields={errorFields} autoFocus />
        </div>
      </ScrollWithFade>
    </div>
  )
}

type SetupFormProps = {
  data: ApiKeyData
  onChange: (patch: Partial<ApiKeyData>) => void
  onOpenCustomPermissions: () => void
  errorFields?: Set<string>
}

export function CreateApiKeyForm({ data, onChange, onOpenCustomPermissions, errorFields }: SetupFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isRefresh = productFormStyle === "refresh"
  const accent = isRefresh ? "#2C219E" : "#533AFD"

  const selectStrategy = (strategy: PermissionStrategy) => {
    onChange({ strategy, access: computeAccessForStrategy(strategy, data.templateId) })
  }
  const selectTemplate = (templateId: string) =>
    onChange({ strategy: "template", templateId, access: computeAccessForTemplate(templateId) })

  type PermissionMode = "template" | "full_access" | "custom"
  const permissionMode: PermissionMode = data.strategy === "template"
    ? "template"
    : data.strategy === "custom"
      ? "custom"
      : "full_access"
  const selectPermissionMode = (mode: PermissionMode) => {
    if (mode === "template") selectStrategy("template")
    else if (mode === "custom") selectStrategy("custom")
    else selectStrategy("safe_full")
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <ApiKeyDetailsFields data={data} onChange={onChange} errorFields={errorFields} autoFocus />

      <section className="flex flex-col gap-[10px]">
        <div className="flex items-center justify-between gap-[12px]">
          <label className={tokens.labelClass}>Permissions</label>
          <a href={API_KEY_DOCS} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] font-[500] leading-[16px] hover:underline" style={{ color: accent }}>Docs</a>
        </div>

        <SegmentedControl
          value={permissionMode}
          onChange={selectPermissionMode}
          options={["template", "full_access", "custom"] as const}
          getDisplayValue={(value) => value === "template" ? "Template" : value === "full_access" ? "Full access" : "Custom"}
          variantOverride="segmented"
        />

        {data.strategy === "template" && (
          <div className="flex flex-col gap-[4px]">
            <span className="block text-[11px] font-[500] leading-[16px] text-[#3C4F69]">Template</span>
            <CustomSelect
              label=""
              value={data.templateId}
              onChange={selectTemplate}
              options={API_KEY_TEMPLATES.map((template) => ({ value: template.id, label: template.name }))}
            />
            <p className="text-[10px] leading-[14px] text-[#6C7688]">{API_KEY_TEMPLATES.find((template) => template.id === data.templateId)?.description}</p>
          </div>
        )}

        {permissionMode === "full_access" && (
          <p className="text-[11px] leading-[16px] text-[#6C7688]">Broad access without payouts, key management, or card issuing.</p>
        )}

        {data.strategy === "custom" && (
          <div className="flex flex-col items-start gap-[8px]">
            <p className="text-[11px] leading-[16px] text-[#6C7688]">Choose access for individual API resources.</p>
            <button type="button" className={tokens.secondaryButtonClass} onClick={onOpenCustomPermissions}>
              Edit permissions
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

type PermissionTreeProps = {
  activeCategoryId: string
  keyDetailsActive: boolean
  onSelectKeyDetails: () => void
  onSelectCategory: (categoryId: string) => void
  access: Record<string, Access>
  query: string
  onQueryChange: (query: string) => void
}

export function ApiKeyPermissionTree({ activeCategoryId, keyDetailsActive, onSelectKeyDetails, onSelectCategory, access, query, onQueryChange }: PermissionTreeProps) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const visibleCategories = useMemo(() => {
    if (!deferredQuery) return API_KEY_CATEGORIES
    return API_KEY_CATEGORIES.filter((category) =>
      category.name.toLowerCase().includes(deferredQuery) ||
      category.resources.some((item) =>
        item.name.toLowerCase().includes(deferredQuery) ||
        item.description.toLowerCase().includes(deferredQuery) ||
        item.endpoints.some((endpoint) => endpoint.toLowerCase().includes(deferredQuery)),
      ),
    )
  }, [deferredQuery])

  // Mirror the pricing-plan sidebar (PlanSidebarNav): soft-tint active rows (not purple
  // text), indentation instead of a border rail, a glyph per node, and a Filter… input.
  const textPrimary = isRefresh ? "text-[#142234]" : "text-[#1A2C44]"
  const textSecondary = isRefresh ? "text-[#526378]" : "text-[#6C7688]"
  const hoverBg = isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F4F7FA]"
  const activeBg = isRefresh ? "bg-[#F1F6FB]" : "bg-[#F7F5FD]"
  const rowBase = isRefresh
    ? `flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[13px] font-[400] leading-[20px] tracking-[-0.065px] ${textPrimary}`
    : `flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[400] leading-[16px] ${textPrimary}`
  const filterInputClass = isRefresh
    ? "w-full rounded-[6px] border border-[#D5DEE7] bg-white pl-[30px] pr-[12px] py-[6px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"
    : "w-full rounded-[6px] border border-[#D8DEE4] bg-white pl-[30px] pr-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none transition-all focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"

  return (
    <nav aria-label="Secret key settings" className="group/nav flex h-full w-[280px] flex-col overflow-hidden border-r border-[#EAF0F6] bg-white pt-[12px]">
      <div className="shrink-0 px-[8px] pb-[4px]">
        <div className="relative flex items-center">
          <span className={`pointer-events-none absolute left-[10px] ${textSecondary}`}><SearchIcon /></span>
          <input
            aria-label="Filter permissions"
            className={filterInputClass}
            placeholder="Filter permissions"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[8px] pb-[12px]">
        <div className="flex flex-col gap-[2px]">
          {/* Key details — the root; selecting it shows the name/note form in the editor */}
          <button
            type="button"
            className={`${rowBase} pl-[30px] ${isRefresh ? "font-[600]" : "font-[500]"} ${keyDetailsActive ? activeBg : hoverBg}`}
            onClick={onSelectKeyDetails}
          >
            <span className="min-w-0 flex-1 truncate">Key details</span>
          </button>

          {/* Permission categories — nested under Key details */}
          {visibleCategories.map((category) => {
            const selected = !keyDetailsActive && category.id === activeCategoryId && !deferredQuery
            const { granted } = categoryGrantSummary(category, access)
            return (
              <button
                key={category.id}
                type="button"
                className={`${rowBase} pl-[30px] justify-between ${selected ? activeBg : hoverBg}`}
                onClick={() => onSelectCategory(category.id)}
              >
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                {granted > 0 && (
                  <span className={`flex h-[18px] shrink-0 items-center rounded-[5px] px-[6px] text-[10px] font-[500] leading-[14px] ${isRefresh ? "bg-[#EAF0F6] text-[#526378]" : "bg-[#EBEEF1] text-[#596171]"}`}>{granted}</span>
                )}
              </button>
            )
          })}
          {visibleCategories.length === 0 && (
            <div className={`ml-[30px] rounded-[6px] border px-[8px] py-[8px] text-[12px] font-[400] ${isRefresh ? "border-[#EAF0F6] text-[#526378]" : "border-[#EBEEF1] text-[#6C7688]"}`}>No results</div>
          )}
        </div>
      </div>
    </nav>
  )
}

type PermissionsEditorProps = {
  data: ApiKeyData
  onChange: (patch: Partial<ApiKeyData>) => void
  activeCategoryId: string
  query: string
}

export function ApiKeyPermissionsEditor({ data, onChange, activeCategoryId, query }: PermissionsEditorProps) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const normalizedQuery = useDeferredValue(query.trim().toLowerCase())
  const activeCategory = API_KEY_CATEGORIES.find((category) => category.id === activeCategoryId) ?? API_KEY_CATEGORIES[0]
  const rows = normalizedQuery
    ? API_KEY_CATEGORIES.flatMap((category) => category.resources.map((item) => ({ ...item, categoryName: category.name }))).filter((item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.endpoints.some((endpoint) => endpoint.toLowerCase().includes(normalizedQuery)),
      )
    : activeCategory.resources.map((item) => ({ ...item, categoryName: activeCategory.name }))

  const updateAccess = (resourceId: string, value: Access) =>
    onChange({ strategy: "custom", access: { ...data.access, [resourceId]: value } })

  const updateCategory = (value: Access) => {
    const next = { ...data.access }
    for (const item of activeCategory.resources) next[item.id] = capForResource(value, item)
    onChange({ strategy: "custom", access: next })
  }

  const categorySummary = categoryGrantSummary(activeCategory, data.access)
  const bulkValue = categorySummary.uniform
  // When a category has a mix of access levels there's no single value to select, which
  // would leave the segmented control with no highlighted chip. Show an explicit "Mixed"
  // segment so the control always reflects a state; the other segments still bulk-apply.
  const categoryAccessValue = bulkValue ?? "mixed"
  const categoryAccessOptions = (bulkValue ? ["none", "read", "write"] : ["mixed", "none", "read", "write"]) as readonly string[]

  const tokens = getFormTokens(productFormStyle)
  const helperClass = "text-[11px] font-[400] leading-[16px] text-[#667691]"

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 px-[16px] pt-[12px]">
        <h2 className="truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{normalizedQuery ? "Search results" : activeCategory.name}</h2>
      </div>

      <ScrollWithFade enabled={isRefresh} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-[12px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          {!normalizedQuery && (
            <>
              <div className="flex flex-col gap-[6px] px-4">
                <span className={tokens.labelClass}>Category access</span>
                <SegmentedControl
                  key={categoryAccessValue}
                  value={categoryAccessValue}
                  onChange={(value) => { if (value !== "mixed") updateCategory(value as Access) }}
                  options={categoryAccessOptions}
                  getDisplayValue={(value) => value === "mixed" ? "Mixed" : value === "none" ? "None" : value === "read" ? "Read all" : "Write all"}
                  fitContent
                />
                <p className={helperClass}>{categorySummary.granted} selected · {categorySummary.read} read, {categorySummary.write} write</p>
              </div>
              <div className="mx-4 border-t border-[#EBEEF1]" />
            </>
          )}

          {rows.map((item) => {
            const value = data.access[item.id] ?? "none"
            return (
              <div key={item.id} className="flex flex-col gap-[6px] px-4">
                <span className="flex flex-wrap items-center gap-x-[6px] gap-y-[2px]">
                  <span className={tokens.labelClass}>{item.name}</span>
                  {item.sensitive && <span className="rounded-full bg-[#FFF4E5] px-[6px] py-[1px] text-[9px] font-[600] leading-[12px] text-[#9C5A00]">Sensitive</span>}
                </span>
                <SegmentedControl
                  value={value}
                  onChange={(next) => updateAccess(item.id, next as Access)}
                  options={(item.readOnly ? ["none", "read"] : ["none", "read", "write"]) as readonly Access[]}
                  getDisplayValue={(next) => next === "none" ? "None" : next === "read" ? "Read" : "Write"}
                  fitContent
                />
                <p className={helperClass}>
                  {normalizedQuery && <span className="text-[#8792A2]">{item.categoryName} · </span>}
                  {item.description}
                </p>
              </div>
            )
          })}
          {rows.length === 0 && (
            <div className="mx-[16px] flex min-h-[180px] flex-col items-center justify-center gap-[7px] rounded-[8px] bg-[#F6F9FC] px-[24px] text-center">
              <span className="text-[#8792A2]"><SearchIcon /></span>
              <p className="text-[12px] font-[600] text-[#1A2C44]">No matching resources</p>
              <p className="text-[11px] leading-[16px] text-[#6C7688]">Try a resource name or endpoint, such as “customers” or “/v1/events”.</p>
            </div>
          )}
        </div>
      </ScrollWithFade>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <span className="shrink-0 text-[12px] font-[400] leading-[16px] text-[#8792A2]">{label}</span>
      <span className="min-w-0 truncate text-right text-[12px] font-[500] leading-[16px] text-[#3C4257]">{children}</span>
    </div>
  )
}

// A live preview of the key being created — a single calm "identity" card, matching the
// weight of CouponPreview / BuyButtonPreview. It shows the result object (name + note +
// what it can do), not a metrics dashboard. Style-agnostic: the preview is the artifact,
// not form chrome, so it doesn't track the UI-style toggle.
export function ApiKeyPreview({ data, detailed = false }: { data: ApiKeyData; detailed?: boolean }) {
  const { read, write, total } = countGrants(data.access)
  const name = data.name.trim()
  const note = data.note.trim()
  const showAccessDetails = detailed || total > 0
  // In Advanced mode the preview fills the pane with the granted-permission breakdown,
  // mirroring the pricing-plan preview. Every configured strategy shows its concrete
  // grants so users can inspect the resulting access before creating the key.
  const grantedCategories = showAccessDetails
    ? API_KEY_CATEGORIES.map((category) => ({ category, ...categoryGrantSummary(category, data.access) })).filter((entry) => entry.granted > 0)
    : []
  const strategyLabel = data.strategy === "template"
    ? API_KEY_TEMPLATES.find((template) => template.id === data.templateId)?.name ?? "Template"
    : data.strategy === "safe_full"
      ? "Full access—except sensitive"
      : data.strategy === "full"
        ? "Full access"
        : "Custom permissions"
  const accessSummary = total === 0
    ? "No permissions"
    : `${total} permission${total === 1 ? "" : "s"} · ${read} read, ${write} write`

  return (
    <div className="flex w-full items-center justify-center">
      <div className={`${detailed ? "w-full min-w-[400px] max-w-[760px]" : showAccessDetails ? "w-[400px]" : "w-[288px]"} ${showAccessDetails ? "max-h-[calc(100vh-160px)] overflow-y-auto" : "overflow-hidden"} rounded-[14px] border border-[#E3E8EF] bg-white shadow-[0_12px_32px_rgba(20,34,52,0.12)]`}>
        <div className="px-[20px] pb-[16px] pt-[20px]">
          <div className="min-w-0">
            <p className={`truncate text-[14px] font-[600] leading-[20px] ${name ? "text-[#1A2C44]" : "text-[#A3ACB9]"}`}>{name || "Untitled secret key"}</p>
            <p className={`mt-[2px] line-clamp-2 text-[12px] leading-[16px] ${note ? "text-[#68778B]" : "italic text-[#A3ACB9]"}`}>{note || "Add a note to explain where this key is used."}</p>
          </div>
        </div>

        <div className="border-t border-[#EDF1F5]" />

        <div className="flex flex-col gap-[11px] px-[20px] py-[16px]">
          <DetailRow label="Permissions">{strategyLabel}</DetailRow>
          <DetailRow label="Access">{accessSummary}</DetailRow>
        </div>

        {showAccessDetails && (
          <>
            <div className="border-t border-[#EDF1F5]" />
            <div className="px-[20px] py-[16px]">
              <div className="flex items-center justify-between gap-[10px]">
                <p className="text-[13px] font-[600] leading-[18px] text-[#1A2C44]">Included access</p>
                {total > 0 && (
                  <span className="shrink-0 rounded-full bg-[#EEF1F6] px-[8px] py-[2px] text-[11px] font-[500] leading-[14px] text-[#596171]">{total} {total === 1 ? "permission" : "permissions"}</span>
                )}
              </div>
              {grantedCategories.length === 0 ? (
                <p className="mt-[10px] text-[12px] leading-[16px] text-[#8792A2]">No permissions selected yet.</p>
              ) : (
                <div className="mt-[16px] flex flex-col gap-[18px] pr-[2px]">
                  {grantedCategories.map(({ category, granted }) => {
                    const items = category.resources.filter((item) => (data.access[item.id] ?? "none") !== "none")
                    return (
                      <div key={category.id} className="border-l-[1.5px] border-[#E3E8EF] pl-[14px]">
                        <div className="flex items-center justify-between gap-[10px]">
                          <p className="text-[12px] font-[600] leading-[16px] text-[#1A2C44]">{category.name}</p>
                          <span className="shrink-0 text-[11px] font-[500] leading-[16px] text-[#8792A2]">{granted} {granted === 1 ? "permission" : "permissions"}</span>
                        </div>
                        <div className="mt-[8px] flex flex-col gap-[7px]">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-[10px] text-[12px] leading-[16px]">
                              <span className="min-w-0 truncate text-[#3C4257]">{item.name}</span>
                              <span className={`shrink-0 font-[500] ${data.access[item.id] === "write" ? "text-[#1A2C44]" : "text-[#68778B]"}`}>{data.access[item.id] === "write" ? "Write" : "Read"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
