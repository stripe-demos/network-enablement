import {
  getCapabilitiesForGroup,
  getDraftName,
  type AccountDetailsDraft,
  type AccountSource,
  type ConfigurationKind,
  type NetworkAccount,
  type UserPath,
} from "./model"

export type AccountApiPreviewInput = {
  source: AccountSource
  selectedAccount: NetworkAccount | null
  configurations: ConfigurationKind[]
  details: AccountDetailsDraft
  userPath?: UserPath
}

const CAPABILITY_KEYS: Record<string, string> = {
  "Card payments": "card_payments",
  Transfers: "transfers",
}

function capabilityKey(name: string) {
  return CAPABILITY_KEYS[name] ?? name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

function countryCode(country: string | undefined) {
  if (country === "United States" || country === "US") return "us"
  if (country === "United Kingdom" || country === "UK") return "gb"
  if (country === "Canada" || country === "CA") return "ca"
  return undefined
}

function dashboardValue(access: AccountDetailsDraft["traits"]["dashboardAccess"]) {
  if (access === "express") return "express"
  if (access === "none") return "none"
  return "full"
}

function requestCapability(capabilities: Record<string, unknown>, name: string) {
  if (name === "Payouts") {
    const existing = (capabilities.stripe_balance as Record<string, unknown> | undefined) ?? {}
    capabilities.stripe_balance = {
      ...existing,
      payouts: { requested: true },
    }
    return
  }
  capabilities[capabilityKey(name)] = { requested: true }
}

function configurationRequest(
  kind: ConfigurationKind,
  capabilities: string[],
) {
  const entries: Record<string, unknown> = {}
  if (kind === "customer") requestCapability(entries, "Automatic indirect tax")
  capabilities.forEach((name) => requestCapability(entries, name))
  return Object.keys(entries).length > 0 ? { capabilities: entries } : {}
}

function addressFromDetails(
  details: AccountDetailsDraft,
  prefix: "billing" | "shipping",
) {
  const country = countryCode(
    prefix === "billing"
      ? details.billingCountry || details.country
      : details.shippingCountry || details.billingCountry || details.country,
  )
  const line1 = (prefix === "billing" ? details.billingLine1 : details.shippingLine1).trim()
  const line2 = (prefix === "billing" ? details.billingLine2 : details.shippingLine2).trim()
  const city = (prefix === "billing" ? details.billingCity : details.shippingCity).trim()
  const state = (prefix === "billing" ? details.billingState : details.shippingState).trim()
  const postalCode = (prefix === "billing" ? details.billingPostalCode : details.shippingPostalCode).trim()
  if (!line1 && !city && !postalCode) return null
  const address: Record<string, string> = {}
  if (country) address.country = country
  if (line1) address.line1 = line1
  if (line2) address.line2 = line2
  if (city) address.city = city
  if (state) address.state = state
  if (postalCode) address.postal_code = postalCode
  return address
}

function pickIdentity(details: AccountDetailsDraft, account: NetworkAccount | null, isNew: boolean) {
  const identity: Record<string, unknown> = {}
  const country = isNew ? countryCode(details.country) : countryCode(account?.country)
  if (country) identity.country = country

  if (isNew) {
    const hasIdentity = Boolean(getDraftName(details) || details.country || details.accountEmail.trim())
    if (hasIdentity) identity.entity_type = details.type === "Individual" ? "individual" : "company"
    if (details.type === "Company") {
      const businessDetails: Record<string, unknown> = {}
      if (details.registeredName.trim()) businessDetails.registered_name = details.registeredName.trim()
      const addresses: Record<string, unknown>[] = []
      const principal = addressFromDetails(details, "billing")
      if (principal) addresses.push({ purpose: "principal_place_of_business", ...principal })
      if (!details.sameAsBilling) {
        const administrative = addressFromDetails(details, "shipping")
        if (administrative) addresses.push({ purpose: "administrative", ...administrative })
      }
      if (addresses.length > 0) businessDetails.additional_addresses = addresses
      if (Object.keys(businessDetails).length > 0) identity.business_details = businessDetails
    }
    if (details.type === "Individual" && (details.firstName.trim() || details.lastName.trim())) {
      const individual: Record<string, string> = {}
      if (details.firstName.trim()) individual.given_name = details.firstName.trim()
      if (details.lastName.trim()) individual.surname = details.lastName.trim()
      identity.individual = individual
    }
  }

  return identity
}

export function isAccountApiPreviewEmpty(input: AccountApiPreviewInput) {
  return input.source !== "new" && !input.selectedAccount
}

export function buildAccountApiRequest(input: AccountApiPreviewInput) {
  const { source, selectedAccount, configurations, details, userPath } = input
  const isNew = source === "new"
  const account = isNew ? null : selectedAccount
  const existingConfigurations = isNew ? [] : account?.configurations ?? []
  const effectiveConfigurations = Array.from(new Set([...existingConfigurations, ...configurations]))
  const displayName = isNew ? getDraftName(details) : account?.name ?? ""
  const contactEmail = isNew ? details.accountEmail.trim() : account?.email ?? ""
  const contactPhone = isNew ? details.billingPhone.trim() : ""
  const hasStarted = isNew
    ? Boolean(displayName || contactEmail || contactPhone || details.country || configurations.length > 0)
    : Boolean(account)

  if (!hasStarted) return {}

  const request: Record<string, unknown> = {}
  if (contactEmail) request.contact_email = contactEmail
  if (contactPhone) request.contact_phone = contactPhone
  if (displayName) request.display_name = displayName

  const identity = pickIdentity(details, account, isNew)
  if (Object.keys(identity).length > 0) request.identity = identity

  if (effectiveConfigurations.length > 0) {
    const configuration: Record<string, unknown> = {}
    effectiveConfigurations.forEach((kind) => {
      const groupCapabilities = kind === "customer"
        ? []
        : getCapabilitiesForGroup(kind, effectiveConfigurations, details.disabledCapabilities, details.additionalCapabilities)
      configuration[kind] = configurationRequest(kind, groupCapabilities)
    })
    request.configuration = configuration
  }

  const showPlatformSettings = userPath !== "direct" && (
    effectiveConfigurations.includes("merchant") || effectiveConfigurations.includes("recipient")
  )
  if (showPlatformSettings) {
    request.defaults = {
      responsibilities: {
        fees_collector: details.traits.feePayer === "platform" ? "application" : "stripe",
        losses_collector: details.traits.negativeBalanceLiability === "stripe" ? "stripe" : "application",
      },
    }
    request.dashboard = dashboardValue(details.traits.dashboardAccess)
  }

  const include: string[] = []
  if (request.configuration) {
    for (const kind of ["customer", "merchant", "recipient"] as const) {
      if ((request.configuration as Record<string, unknown>)[kind]) include.push(`configuration.${kind}`)
    }
  }
  if (request.identity) include.push("identity")
  if (request.defaults) include.push("defaults")
  if (include.length > 0) request.include = include

  return request
}

export function buildAccountApiLlmPrompt(input: AccountApiPreviewInput, payload: Record<string, unknown>) {
  const action = input.source === "new" ? "create" : "update"
  const path = input.userPath ?? "platform"
  const configuration = payload.configuration && typeof payload.configuration === "object"
    ? Object.keys(payload.configuration as Record<string, unknown>).join(", ")
    : "none yet"
  return [
    `Stripe Accounts v2 ${action} request preview.`,
    `POST https://api.stripe.com/v2/core/accounts`,
    `Path: ${path}. Configurations: ${configuration}.`,
    "This is the JSON body for the corresponding API request.",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n")
}

export function collectJsonPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return prefix ? [prefix] : []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectJsonPaths(item, `${prefix}[${index}]`))
  }
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return [path, ...collectJsonPaths(child, path)]
  })
}

export function collapseToSectionRoots(added: string[]): Set<string> {
  const roots = new Set<string>()
  const sorted = [...added].sort((a, b) => a.length - b.length)
  for (const path of sorted) {
    const covered = [...roots].some((root) => (
      path === root || path.startsWith(`${root}.`) || path.startsWith(`${root}[`)
    ))
    if (!covered) roots.add(path)
  }
  return roots
}

function isCoveredJsonPath(path: string, roots: Set<string>) {
  return [...roots].some((root) => (
    path === root || path.startsWith(`${root}.`) || path.startsWith(`${root}[`)
  ))
}

export function mergeDisplayPayload(
  current: unknown,
  previous: unknown,
  path: string,
  leavingRoots: Set<string>,
): unknown {
  if (current === undefined) {
    return isCoveredJsonPath(path, leavingRoots) ? previous : undefined
  }
  if (
    previous === undefined
    || current === null
    || previous === null
    || typeof current !== "object"
    || typeof previous !== "object"
    || Array.isArray(current)
    || Array.isArray(previous)
  ) {
    return current
  }

  const currentObj = current as Record<string, unknown>
  const previousObj = previous as Record<string, unknown>
  const keys: string[] = []
  for (const key of Object.keys(previousObj)) {
    const childPath = path ? `${path}.${key}` : key
    if (key in currentObj || isCoveredJsonPath(childPath, leavingRoots)) keys.push(key)
  }
  for (const key of Object.keys(currentObj)) {
    if (!keys.includes(key)) keys.push(key)
  }

  const result: Record<string, unknown> = {}
  for (const key of keys) {
    const childPath = path ? `${path}.${key}` : key
    const merged = mergeDisplayPayload(currentObj[key], previousObj[key], childPath, leavingRoots)
    if (merged !== undefined || key in currentObj) result[key] = merged
  }
  return result
}
