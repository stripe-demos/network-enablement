export type AccountSource = "existing" | "new"

export type UserPath = "direct" | "platform"

export type ConfigurationKind = "merchant" | "customer" | "recipient"

export type PayoutCollectionMode = "manual" | "email"

export type PayoutMethod = "stripe-balance" | "bank-account" | "debit-card"

export type PayoutMethodDetailDraft = {
  primary: string
  secondary: string
}

export type OnboardingAction = "send-email" | "copy-link" | "deferred"

export type FeePayer = "connected-account" | "platform"
export type NegativeBalanceLiability = "stripe" | "platform"
export type DashboardAccess = "stripe" | "express" | "none"
export type RequirementCollection = "stripe" | "platform"

export type NetworkAccount = {
  id: string
  name: string
  email: string
  configurations: ConfigurationKind[]
  additionalRoles?: string[]
  country: "UK" | "US" | "CA"
  initials: string
  hasBrandIcon?: boolean
  /** Person name used when this account appears in the Direct user path. */
  directName?: string
  /** Configurations shown in the Direct user path. Merchant is never shown there. */
  directConfigurations?: ConfigurationKind[]
}

export type AccountDetailsDraft = {
  type: "Company" | "Individual"
  registeredName: string
  firstName: string
  lastName: string
  accountEmail: string
  displayName: string
  country: string
  useAccountEmailForBilling: boolean
  billingEmail: string
  billingCountry: string
  billingLine1: string
  billingLine2: string
  billingCity: string
  billingState: string
  billingPostalCode: string
  billingPhone: string
  billingPhoneCountry: "US" | "CA" | "GB"
  taxId: string
  taxStatus: "taxable" | "exempt" | "reverse"
  language: string
  sameAsBilling: boolean
  shippingName: string
  shippingCountry: string
  shippingLine1: string
  shippingLine2: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingPhone: string
  shippingPhoneCountry: "US" | "CA" | "GB"
  shippingAddress: string
  payoutCollectionMode: PayoutCollectionMode
  payoutMethods: PayoutMethod[]
  payoutMethodDetails: Record<PayoutMethod, PayoutMethodDetailDraft>
  useAccountEmailForPayout: boolean
  payoutEmail: string
  onboardingAction: Exclude<OnboardingAction, "deferred">
  useAccountEmailForOnboarding: boolean
  onboardingEmail: string
  disabledCapabilities: string[]
  additionalCapabilities: string[]
  traits: {
    feePayer: FeePayer
    useLegacyFeeType: boolean
    negativeBalanceLiability: NegativeBalanceLiability
    dashboardAccess: DashboardAccess
    requirementCollection: RequirementCollection
  }
}

export type AccountConfigurationPayload = {
  source: AccountSource
  userPath?: UserPath
  account: NetworkAccount | AccountDetailsDraft
  configurations: ConfigurationKind[]
  deactivatedConfigurations?: ConfigurationKind[]
  details: AccountDetailsDraft
  capabilities: string[]
  recipient?: {
    collectionMode: PayoutCollectionMode
    methods: PayoutMethod[]
    email?: string
  }
  onboarding?: {
    action: OnboardingAction
    email: string
    link: string
  }
}

export type ConfigurationOption = {
  id: ConfigurationKind
  title: string
  relationship: string
  description: string
  capabilities: string[]
}

export function getConfigurationOptions(userPath?: UserPath) {
  if (userPath === "direct") return CONFIGURATION_OPTIONS.filter((option) => option.id !== "merchant")
  return CONFIGURATION_OPTIONS
}

export const CONFIGURATION_OPTIONS: ConfigurationOption[] = [
  {
    id: "customer",
    title: "Customer",
    relationship: "Makes payments to you",
    description: "This account will be able to make single or recurring payments to you, for example paying a monthly subscription.",
    capabilities: [],
  },
  {
    id: "merchant",
    title: "Merchant",
    relationship: "Accepts customer payments",
    description: "This account will be able to sell products and services and accept payments from their customers, for example a Shopify merchant who accepts card payments from shoppers on their own storefront.",
    capabilities: ["Card payments"],
  },
  {
    id: "recipient",
    title: "Recipient",
    relationship: "Receives funds from you",
    description: "This account will receive funds from you either into their Stripe balance, or an external payout method like a bank account or card.",
    capabilities: ["Transfers", "Payouts"],
  },
]

export type CapabilityItem = {
  name: string
  required?: boolean
}

export type CapabilityGroup = {
  id: "merchant" | "recipient" | "other"
  title: string
  items: CapabilityItem[]
}

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    id: "merchant",
    title: "Merchant",
    items: [
      { name: "Card payments", required: true },
      { name: "Canadian pre-authorized debit payments" },
      { name: "Affirm payments" },
      { name: "Afterpay Clearpay payments" },
      { name: "Amazon Pay payments" },
      { name: "Bacs Debit payments" },
      { name: "Bancontact payments" },
      { name: "BLIK payments" },
      { name: "Cartes Bancaires payments" },
      { name: "Cash App Pay payments" },
      { name: "EPS payments" },
      { name: "UK Bank Transfer payments" },
      { name: "iDEAL payments" },
      { name: "Kakao Pay payments" },
      { name: "Klarna payments" },
      { name: "Korean cards payments" },
      { name: "Link payments" },
      { name: "Multibanco payments" },
      { name: "Naver Pay payments" },
      { name: "OXXO payments" },
      { name: "P24 payments" },
      { name: "Pay by Bank payments" },
      { name: "PAYCO payments" },
      { name: "Samsung Pay payments" },
      { name: "SEPA Bank Transfer payments" },
      { name: "SEPA Direct Debit payments" },
      { name: "ACH debit payments" },
      { name: "US Bank Transfer payments" },
      { name: "Zip payments" },
      { name: "Sunbit payments" },
    ],
  },
  {
    id: "recipient",
    title: "Recipient",
    items: [
      { name: "Transfers", required: true },
      { name: "Payouts", required: true },
    ],
  },
  {
    id: "other",
    title: "Other capabilities",
    items: [
      { name: "Bizum payments" },
      { name: "MB WAY payments" },
      { name: "Pix payments" },
      { name: "Satispay payments" },
      { name: "Scalapay payments" },
      { name: "Pay with Stripe balance" },
      { name: "Tax reporting (US 1099-K)" },
      { name: "Tax reporting (US 1099-MISC)" },
    ],
  },
]

export function getCapabilityGroup(name: string) {
  return CAPABILITY_GROUPS.find((group) => group.items.some((item) => item.name === name))
}

function initialsFromName(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

export const NETWORK_ACCOUNTS: NetworkAccount[] = [
  { id: "acct_nathan", name: "Nathan Richardson", email: "nrichards@example.com", configurations: ["merchant", "customer"], country: "US", initials: "NR" },
  { id: "acct_harbourwell", name: "Harbourwell Fitness", directName: "Amelia Hart", email: "ahart@harbourwell.example", configurations: ["merchant", "customer"], country: "UK", initials: "HF" },
  { id: "acct_juniper", name: "Juniper Yoga Collective", email: "accounts@juniperyoga.example", configurations: ["merchant"], directConfigurations: ["recipient"], country: "UK", initials: "JY", hasBrandIcon: true },
  { id: "acct_tandem", name: "Tandem Fitness Network", directName: "Jordan Hale", email: "finance@tandemfitness.example", configurations: ["merchant"], directConfigurations: ["recipient"], country: "UK", initials: "TF", hasBrandIcon: true },
  { id: "acct_cedar", name: "Cedar Therapy Group", directName: "Elena Voss", email: "info@cedartherapy.example", configurations: ["merchant", "customer"], directConfigurations: ["recipient"], country: "US", initials: "CG" },
  { id: "acct_lucent", name: "Lucent Recovery Studio", directName: "Marcus Reed", email: "payments@lucentrecovery.example", configurations: ["merchant", "customer"], country: "US", initials: "LS" },
  { id: "acct_aspen", name: "Aspen Therapy Center", directName: "Sofia Alvarez", email: "info@aspentherapy.example", configurations: ["merchant", "customer"], directConfigurations: ["recipient"], country: "US", initials: "AT", hasBrandIcon: true },
  { id: "acct_priya", name: "Priya Shah", email: "priya.shah@example.com", configurations: ["customer"], country: "US", initials: "PS" },
  { id: "acct_cameron", name: "Cameron Ellis", email: "cameron.ellis@example.com", configurations: ["customer"], additionalRoles: ["Money manager"], country: "US", initials: "CE" },
]

export function networkAccountFromCreated(account: {
  id: string
  name: string
  detail?: string
  email?: string
  country?: string
}): NetworkAccount {
  const name = account.name.trim() || "New account"
  const country = account.country === "United Kingdom" || account.country === "UK"
    ? "UK"
    : account.country === "Canada" || account.country === "CA"
      ? "CA"
      : "US"
  return {
    id: account.id,
    name,
    email: (account.email || account.detail || "").trim(),
    configurations: ["customer"],
    country,
    initials: initialsFromName(name) || "NA",
  }
}

export function getDisplayedNetworkAccount(account: NetworkAccount, userPath?: UserPath): NetworkAccount {
  if (userPath !== "direct") return account
  const name = account.directName ?? account.name
  const configurations = (account.directConfigurations ?? account.configurations.filter((configuration) => configuration !== "merchant"))
    .filter((configuration) => configuration !== "merchant")
  return {
    ...account,
    name,
    initials: initialsFromName(name),
    hasBrandIcon: !account.directName && Boolean(account.hasBrandIcon),
    configurations: configurations.length > 0 ? configurations : ["recipient"],
  }
}

export const INITIAL_ACCOUNT_DETAILS: AccountDetailsDraft = {
  type: "Company",
  registeredName: "",
  firstName: "",
  lastName: "",
  accountEmail: "",
  displayName: "",
  country: "",
  useAccountEmailForBilling: true,
  billingEmail: "",
  billingCountry: "",
  billingLine1: "",
  billingLine2: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  billingPhone: "",
  billingPhoneCountry: "US",
  taxId: "",
  taxStatus: "taxable",
  language: "en-US",
  sameAsBilling: true,
  shippingName: "",
  shippingCountry: "",
  shippingLine1: "",
  shippingLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
  shippingPhone: "",
  shippingPhoneCountry: "US",
  shippingAddress: "",
  payoutCollectionMode: "manual",
  payoutMethods: [],
  payoutMethodDetails: {
    "stripe-balance": { primary: "", secondary: "" },
    "bank-account": { primary: "", secondary: "" },
    "debit-card": { primary: "", secondary: "" },
  },
  useAccountEmailForPayout: true,
  payoutEmail: "",
  onboardingAction: "send-email",
  useAccountEmailForOnboarding: true,
  onboardingEmail: "",
  disabledCapabilities: [],
  additionalCapabilities: [],
  traits: {
    feePayer: "platform",
    useLegacyFeeType: false,
    negativeBalanceLiability: "stripe",
    dashboardAccess: "stripe",
    requirementCollection: "stripe",
  },
}

export const PAYOUT_METHODS: { id: PayoutMethod; label: string; description: string }[] = [
  { id: "stripe-balance", label: "Stripe balance", description: "Keep funds in this account’s Stripe balance" },
  { id: "bank-account", label: "Bank account", description: "Deposit to a bank account" },
  { id: "debit-card", label: "Debit card", description: "Deposit to a debit card" },
]

export const NETWORK_ACCOUNT_BY_ID = new Map(NETWORK_ACCOUNTS.map((account) => [account.id, account]))

export function getAccountRoles(account: NetworkAccount) {
  const configurationLabels = account.configurations.map((kind) => (
    CONFIGURATION_OPTIONS.find((option) => option.id === kind)?.title ?? kind
  ))
  return [...configurationLabels, ...(account.additionalRoles ?? [])]
}

export function getCapabilities(configurations: ConfigurationKind[], disabled: string[] = [], additional: string[] = []) {
  const disabledSet = new Set(disabled)
  const defaults = CONFIGURATION_OPTIONS
    .filter((option) => configurations.includes(option.id))
    .flatMap((option) => option.capabilities)
    .filter((capability) => !disabledSet.has(capability))
  return Array.from(new Set([...defaults, ...additional]))
}

export function getCapabilitiesForGroup(
  groupId: CapabilityGroup["id"],
  configurations: ConfigurationKind[],
  disabled: string[] = [],
  additional: string[] = [],
) {
  const requested = new Set(getCapabilities(configurations, disabled, additional))
  const group = CAPABILITY_GROUPS.find((candidate) => candidate.id === groupId)
  return group?.items.map((item) => item.name).filter((name) => requested.has(name)) ?? []
}

export function getAvailableConfigurations(account: NetworkAccount | null) {
  if (!account) return CONFIGURATION_OPTIONS
  const current = new Set(account.configurations)
  return CONFIGURATION_OPTIONS.filter((option) => !current.has(option.id))
}

export function getDraftName(details: AccountDetailsDraft) {
  if (details.displayName?.trim()) return details.displayName.trim()
  if (details.type === "Company") return details.registeredName.trim()
  return `${details.firstName.trim()} ${details.lastName.trim()}`.trim()
}

export function getPayoutEmail(details: AccountDetailsDraft) {
  return details.useAccountEmailForPayout ? details.accountEmail.trim() : details.payoutEmail.trim()
}

export const ACCOUNT_ONBOARDING_LINK = "https://connect.stripe.com/d/setup/acct_demo"

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function findMatchingNetworkAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(normalizedEmail)) return undefined

  const matches = NETWORK_ACCOUNTS.filter((account) => (
    account.email.toLowerCase() === normalizedEmail
  ))
  return matches.length === 1 ? matches[0] : undefined
}

export function getOnboardingEmail(details: AccountDetailsDraft) {
  return details.useAccountEmailForOnboarding ? details.accountEmail.trim() : details.onboardingEmail.trim()
}

export function isNewAccountIdentityValid(details: AccountDetailsDraft) {
  const hasName = details.type === "Company"
    ? Boolean(details.registeredName.trim())
    : Boolean(details.firstName.trim() && details.lastName.trim())
  return hasName && EMAIL_PATTERN.test(details.accountEmail.trim()) && Boolean(details.country)
}

export const CONFIGURATION_ACCEPT_THRESHOLD = 0.5
const CONFIGURATION_FALLBACK_THRESHOLD = 0.35

export function pickConfigurationsFromScores(
  scores: Partial<Record<ConfigurationKind, number>>,
  userPath?: UserPath,
): ConfigurationKind[] {
  const available = getConfigurationOptions(userPath).map((option) => option.id)
  const accepted = available.filter((id) => (scores[id] ?? 0) >= CONFIGURATION_ACCEPT_THRESHOLD)
  if (accepted.length > 0) return accepted
  const fallback = available
    .slice()
    .sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))[0]
  return fallback && (scores[fallback] ?? 0) >= CONFIGURATION_FALLBACK_THRESHOLD ? [fallback] : []
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value))
}

function scoreAccountDescription(description: string): Record<ConfigurationKind, number> {
  const text = description.toLowerCase()
  const has = (pattern: RegExp) => pattern.test(text)

  let merchant = 0
  if (has(/\baccepts?\b[\s\S]{0,32}\b(customer )?payments?\b/)) merchant += 0.85
  if (has(/\b(merchant|storefront|shopify|marketplace|shoppers?|end customers?)\b/)) merchant += 0.7
  if (has(/\bsells?\b/) && !has(/\bsells?\s+(us|to us)\b/)) merchant += 0.55
  if (has(/\bsellers?\b/) && has(/\b(payments?|payouts?|store|shop)\b/)) merchant += 0.55
  if (has(/\b(shops?|store)\b/)) merchant += 0.4
  if (has(/\bcard payments?\b/)) merchant += 0.45

  let recipient = 0
  if (has(/\b(payouts?|receives? funds|receive money|transfers?)\b/)) recipient += 0.8
  if (has(/\bpay(s|ing|ed)? out\b/)) recipient += 0.8
  if (has(/\b(contractor|freelancer|vendor|supplier)\b/)) recipient += 0.7
  if (has(/\binvoices us\b/)) recipient += 0.85
  if (has(/\bwe (pay|payout)\b/)) recipient += 0.7

  let customer = 0
  if (has(/\b(subscriber|subscription|pays us|pays you|make[s]? payments to (you|us)|our customer)\b/)) customer += 0.85
  if (has(/\bpays? (our|your)\b/)) customer += 0.75
  if (has(/\bbuyer\b/)) customer += 0.6
  if (has(/\bbuys from (us|you)\b/)) customer += 0.8
  if (has(/\binvoice(s|d)? (them|the account|this account)\b/)) customer += 0.6
  if (has(/\bas a customer\b/) && !has(/\binvoices us as a customer\b/)) customer += 0.5
  if (has(/\bcustomer\b/) && !has(/\bcustomer payments?\b/) && !has(/\binvoices us as a customer\b/)) customer += 0.2

  return {
    customer: clampScore(customer),
    merchant: clampScore(merchant),
    recipient: clampScore(recipient),
  }
}

export function recommendConfigurationsFromDescription(description: string, userPath?: UserPath): ConfigurationKind[] {
  const text = description.trim()
  if (!text) return []
  return pickConfigurationsFromScores(scoreAccountDescription(text), userPath)
}

export type ClassificationHighlight = {
  start: number
  end: number
  kind: ConfigurationKind
  score: number
}

const FILLER_WORD = /^(a|an|the|and|or|but|then|maybe|also|just|basically|that|this|these|those|them|their|they|can|could|would|should|will|to|of|in|on|at|by|for|with|from|some|any|able|be|been|being|do|does|did|so|as|if|than|too|very|more|most|such|into|over|after|before|about)$/i
const EVIDENCE_PHRASE = /\b(?:(?:accepts?|accepting|receives?|receiving)\s+(?:some\s+)?(?:funds|payments?|money|payouts?)|(?:pay|pays|paid|paying)\s+out(?:\s+(?:those|these|the|to)\s+\w+)?|end customers?|card payments?|invoices us|pays us|buys from (?:us|you))\b/gi
const SIGNAL_WORD = /\b(contractors?|freelancers?|vendors?|suppliers?|payouts?|transfers?|invoices?|subscribers?|subscriptions?|buyers?|merchants?|sellers?|storefronts?|shopify|marketplaces?|shoppers?|shops?|stores?|payments?|customers?|memberships?|earnings?|funds|money)\b/gi

function nextWordStart(text: string, index: number) {
  let edge = index
  while (edge < text.length && /\s/.test(text[edge]!)) edge += 1
  return edge
}

function previousWordEnd(text: string, index: number) {
  let edge = index
  while (edge > 0 && /\s/.test(text[edge - 1]!)) edge -= 1
  return edge
}

function wordAtLeft(text: string, index: number) {
  const end = previousWordEnd(text, index)
  if (end === 0) return { start: 0, end: 0, value: "" }
  let start = end
  while (start > 0 && !/\s/.test(text[start - 1]!) && !/[.!?;:]/.test(text[start - 1]!)) start -= 1
  return { start, end, value: text.slice(start, end) }
}

function wordAtRight(text: string, index: number) {
  const start = nextWordStart(text, index)
  if (start >= text.length) return { start, end: start, value: "" }
  let end = start
  while (end < text.length && !/\s/.test(text[end]!) && !/[.!?;:]/.test(text[end]!)) end += 1
  return { start, end, value: text.slice(start, end) }
}

function expandSpanLeft(text: string, index: number, words: number) {
  let cursor = index
  let taken = 0
  while (taken < words) {
    const word = wordAtLeft(text, cursor)
    if (!word.value || /[.!?;:]/.test(text[word.end] ?? "") || FILLER_WORD.test(word.value)) break
    cursor = word.start
    taken += 1
  }
  return cursor
}

function expandSpanRight(text: string, index: number, words: number) {
  let cursor = index
  let taken = 0
  while (taken < words) {
    const word = wordAtRight(text, cursor)
    if (!word.value || FILLER_WORD.test(word.value)) break
    cursor = word.end
    taken += 1
  }
  return cursor
}

function trimFiller(text: string, start: number, end: number) {
  let from = start
  let to = end
  while (from < to && /\s/.test(text[from]!)) from += 1
  while (to > from && /\s/.test(text[to - 1]!)) to -= 1
  while (from < to) {
    const lead = wordAtRight(text, from)
    if (!lead.value || lead.start !== from || !FILLER_WORD.test(lead.value)) break
    from = nextWordStart(text, lead.end)
  }
  while (to > from) {
    const trail = wordAtLeft(text, to)
    if (!trail.value || trail.end !== to || !FILLER_WORD.test(trail.value)) break
    to = previousWordEnd(text, trail.start)
  }
  return { start: from, end: to, text: text.slice(from, to) }
}

export function extractCandidateSpans(description: string) {
  const spans: { start: number; end: number; text: string }[] = []
  const seen = new Set<string>()

  const add = (start: number, end: number) => {
    const span = trimFiller(description, start, end)
    if (span.end - span.start < 3) return
    const key = `${span.start}:${span.end}`
    if (seen.has(key)) return
    seen.add(key)
    spans.push(span)
  }

  const phrases = new RegExp(EVIDENCE_PHRASE.source, "gi")
  let match: RegExpExecArray | null
  while ((match = phrases.exec(description))) {
    add(match.index, match.index + match[0].length)
  }

  const pattern = new RegExp(SIGNAL_WORD.source, "gi")
  while ((match = pattern.exec(description))) {
    const start = expandSpanLeft(description, match.index, 1)
    const end = expandSpanRight(description, match.index + match[0].length, 1)
    add(start, end)
    if (spans.length >= 8) break
  }
  return spans.slice(0, 8)
}

export function resolveHighlightOverlaps(highlights: ClassificationHighlight[]) {
  const chosen: ClassificationHighlight[] = []
  const ranked = highlights.slice().sort((a, b) => b.score - a.score || a.start - b.start)
  for (const highlight of ranked) {
    if (chosen.some((existing) => highlight.start < existing.end && highlight.end > existing.start)) continue
    chosen.push(highlight)
  }
  return chosen.sort((a, b) => a.start - b.start)
}

export function highlightAccountDescription(description: string, userPath?: UserPath): ClassificationHighlight[] {
  const available = new Set(getConfigurationOptions(userPath).map((option) => option.id))
  const highlights = extractCandidateSpans(description).flatMap((span) => {
    const ranked = Object.entries(scoreAccountDescription(span.text)) as Array<[ConfigurationKind, number]>
    ranked.sort((a, b) => b[1] - a[1])
    const [kind, score] = ranked[0] ?? ["customer", 0]
    if (!available.has(kind) || score < CONFIGURATION_FALLBACK_THRESHOLD) return []
    return [{ start: span.start, end: span.end, kind, score }]
  })
  return resolveHighlightOverlaps(highlights)
}

export function explainRecommendedConfigurations(recommended: ConfigurationKind[]) {
  return recommended.flatMap((id) => {
    const option = CONFIGURATION_OPTIONS.find((candidate) => candidate.id === id)
    if (!option) return []
    return [{ id, title: option.title, body: option.description }]
  })
}
