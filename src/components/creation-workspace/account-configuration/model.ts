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
  taxId: string
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
    capabilities: [],
  },
  {
    id: "merchant",
    title: "Merchant",
    relationship: "Accepts customer payments",
    capabilities: ["Card payments"],
  },
  {
    id: "recipient",
    title: "Recipient",
    relationship: "Receives funds from you",
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
  { id: "acct_harbourwell", name: "Harbourwell Fitness", directName: "Amelia Hart", email: "nrichards@example.com", configurations: ["merchant", "customer"], country: "UK", initials: "HF" },
  { id: "acct_juniper", name: "Juniper Yoga Collective", directName: "Maya Chen", email: "accounts@juniperyoga.example", configurations: ["merchant"], directConfigurations: ["recipient"], country: "UK", initials: "JY", hasBrandIcon: true },
  { id: "acct_tandem", name: "Tandem Fitness Network", directName: "Jordan Hale", email: "finance@tandemfitness.example", configurations: ["merchant"], directConfigurations: ["recipient"], country: "UK", initials: "TF", hasBrandIcon: true },
  { id: "acct_cedar", name: "Cedar Therapy Group", directName: "Elena Voss", email: "info@cedartherapy.example", configurations: ["merchant", "customer"], directConfigurations: ["recipient"], country: "US", initials: "CG" },
  { id: "acct_lucent", name: "Lucent Recovery Studio", directName: "Marcus Reed", email: "payments@lucentrecovery.example", configurations: ["merchant", "customer"], country: "US", initials: "LS" },
  { id: "acct_aspen", name: "Aspen Therapy Center", directName: "Sofia Alvarez", email: "info@aspentherapy.example", configurations: ["merchant", "customer"], directConfigurations: ["recipient"], country: "US", initials: "AT", hasBrandIcon: true },
  { id: "acct_priya", name: "Priya Shah", email: "priya.shah@example.com", configurations: ["customer"], country: "US", initials: "PS" },
  { id: "acct_cameron", name: "Cameron Ellis", email: "cameron.ellis@example.com", configurations: ["customer"], additionalRoles: ["Money manager"], country: "US", initials: "CE" },
]

export function getDisplayedNetworkAccount(account: NetworkAccount, userPath?: UserPath): NetworkAccount {
  if (userPath !== "direct") return account
  const name = account.directName ?? account.name
  const configurations = (account.directConfigurations ?? account.configurations.filter((configuration) => configuration !== "merchant"))
    .filter((configuration) => configuration !== "merchant")
  return {
    ...account,
    name,
    initials: initialsFromName(name),
    hasBrandIcon: false,
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
  taxId: "",
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

export function getOnboardingEmail(details: AccountDetailsDraft) {
  return details.useAccountEmailForOnboarding ? details.accountEmail.trim() : details.onboardingEmail.trim()
}

export function isNewAccountIdentityValid(details: AccountDetailsDraft) {
  const hasName = details.type === "Company"
    ? Boolean(details.registeredName.trim())
    : Boolean(details.firstName.trim() && details.lastName.trim())
  return hasName && EMAIL_PATTERN.test(details.accountEmail.trim()) && Boolean(details.country)
}
