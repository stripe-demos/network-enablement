import {
  getCapabilitiesForGroup,
  getDraftName,
  type AccountDetailsDraft,
  type AccountSource,
  type ConfigurationKind,
  type NetworkAccount,
  type UserPath,
} from "./model"

const EXISTING_APPLIED_AT = "2024-03-12T16:22:00.000Z"
const EXISTING_CREATED_AT = "2024-03-12T16:22:00.000Z"

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

function assignCapability(
  capabilities: Record<string, unknown>,
  name: string,
  status: "active" | "pending",
) {
  if (name === "Payouts") {
    const existing = (capabilities.stripe_balance as Record<string, unknown> | undefined) ?? {}
    capabilities.stripe_balance = {
      ...existing,
      payouts: { status },
    }
    return
  }
  capabilities[capabilityKey(name)] = { status }
}

function configurationBlock(
  kind: ConfigurationKind,
  capabilities: string[],
  isExisting: boolean,
) {
  const block: Record<string, unknown> = {}
  if (isExisting) block.applied = EXISTING_APPLIED_AT
  if (capabilities.length > 0) {
    const entries: Record<string, unknown> = {}
    capabilities.forEach((name) => assignCapability(entries, name, isExisting ? "active" : "pending"))
    block.capabilities = entries
  }
  return block
}

function pickIdentity(details: AccountDetailsDraft, account: NetworkAccount | null, isNew: boolean) {
  const identity: Record<string, unknown> = {}
  const country = isNew ? countryCode(details.country) : countryCode(account?.country)
  if (country) identity.country = country

  if (isNew) {
    const hasIdentity = Boolean(getDraftName(details) || details.country || details.accountEmail.trim())
    if (hasIdentity) identity.entity_type = details.type === "Individual" ? "individual" : "company"
    if (details.type === "Company" && details.registeredName.trim()) {
      identity.business_details = { registered_name: details.registeredName.trim() }
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

export function buildAccountApiResponse(input: AccountApiPreviewInput) {
  const { source, selectedAccount, configurations, details, userPath } = input
  const isNew = source === "new"
  const account = isNew ? null : selectedAccount
  const existingConfigurations = isNew ? [] : account?.configurations ?? []
  const effectiveConfigurations = Array.from(new Set([...existingConfigurations, ...configurations]))
  const displayName = isNew ? getDraftName(details) : account?.name ?? ""
  const contactEmail = isNew ? details.accountEmail.trim() : account?.email ?? ""
  const hasStarted = isNew
    ? Boolean(displayName || contactEmail || details.country || configurations.length > 0)
    : Boolean(account)

  const fields: Record<string, unknown> = {
    object: "v2.core.account",
  }

  if (!hasStarted) return fields

  if (account) {
    fields.id = account.id
    fields.created = EXISTING_CREATED_AT
  }

  if (effectiveConfigurations.length > 0) {
    fields.applied_configurations = effectiveConfigurations
    const configuration: Record<string, unknown> = {}
    effectiveConfigurations.forEach((kind) => {
      const groupCapabilities = kind === "customer"
        ? []
        : getCapabilitiesForGroup(kind, effectiveConfigurations, details.disabledCapabilities, details.additionalCapabilities)
      configuration[kind] = configurationBlock(kind, groupCapabilities, existingConfigurations.includes(kind))
    })
    const otherCapabilities = getCapabilitiesForGroup(
      "other",
      effectiveConfigurations,
      details.disabledCapabilities,
      details.additionalCapabilities,
    )
    if (otherCapabilities.length > 0) {
      const host = effectiveConfigurations.includes("merchant")
        ? "merchant"
        : effectiveConfigurations.includes("recipient")
          ? "recipient"
          : "customer"
      const hostBlock = (configuration[host] as Record<string, unknown>) ?? {}
      const hostCapabilities = (hostBlock.capabilities as Record<string, unknown> | undefined) ?? {}
      otherCapabilities.forEach((name) => assignCapability(hostCapabilities, name, "pending"))
      configuration[host] = { ...hostBlock, capabilities: hostCapabilities }
    }
    fields.configuration = configuration
  }

  if (contactEmail) fields.contact_email = contactEmail
  if (displayName) fields.display_name = displayName

  const identity = pickIdentity(details, account, isNew)
  if (Object.keys(identity).length > 0) fields.identity = identity

  const showPlatformSettings = userPath !== "direct" && (
    effectiveConfigurations.includes("merchant") || effectiveConfigurations.includes("recipient")
  )
  if (showPlatformSettings) {
    fields.dashboard = dashboardValue(details.traits.dashboardAccess)
    fields.defaults = {
      responsibilities: {
        fees_collector: details.traits.feePayer === "platform" ? "application" : "stripe",
        losses_collector: details.traits.negativeBalanceLiability === "stripe" ? "stripe" : "application",
      },
    }
  }

  fields.livemode = false

  return {
    ...(fields.id ? { id: fields.id } : {}),
    object: fields.object,
    ...(fields.applied_configurations ? { applied_configurations: fields.applied_configurations } : {}),
    ...(fields.configuration ? { configuration: fields.configuration } : {}),
    ...(fields.contact_email ? { contact_email: fields.contact_email } : {}),
    ...(fields.created ? { created: fields.created } : {}),
    ...(fields.dashboard ? { dashboard: fields.dashboard } : {}),
    ...(fields.defaults ? { defaults: fields.defaults } : {}),
    ...(fields.display_name ? { display_name: fields.display_name } : {}),
    ...(fields.identity ? { identity: fields.identity } : {}),
    livemode: fields.livemode,
  }
}

export function buildAccountApiLlmPrompt(input: AccountApiPreviewInput, payload: Record<string, unknown>) {
  const action = input.source === "new" ? "create" : "update"
  const path = input.userPath ?? "platform"
  const applied = Array.isArray(payload.applied_configurations)
    ? (payload.applied_configurations as string[]).join(", ")
    : "none yet"
  return [
    `Stripe Accounts v2 response preview (${action}).`,
    `Path: ${path}. Configurations: ${applied}.`,
    "Use this object to write or explain the corresponding API request.",
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
