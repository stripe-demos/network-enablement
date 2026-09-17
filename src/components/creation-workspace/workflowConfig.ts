import type { ComponentType } from "react"
import type { WorkflowObject } from "./useWorkflowState"

// ── Types ────────────────────────────────────────────────────────────

export type PreviewProps = {
  /** Data from the currently active object */
  data: Record<string, any>
  /** All objects in the workflow (for cross-object previews like invoice totals) */
  allObjects: WorkflowObject[]
  /** The workflow config */
  config: WorkflowConfig
}

export type ObjectKindConfig = {
  label: string
  /** Icon key matching CatalogObjectGlyph kinds or custom identifiers */
  icon: string
  /** The form component rendered when this object is active */
  formComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; errorFields?: Set<string>; onAddObject?: (kind: string, existingId?: string) => void }>
  /** Optional preview component rendered in the right panel when this kind is active */
  previewComponent?: ComponentType<PreviewProps>
  /** Suggested next objects that can be created from this one */
  suggestedNext?: {
    kind: string
    /** Short action label, e.g. "Add a customer" */
    actionLabel: string
    /** Explanation of why, e.g. "to receive this invoice" */
    reason: string
  }[]
  /** Can multiple instances of this kind exist? Default: false */
  allowMultiple?: boolean
  /** Kind that must exist in the workflow before this one can be added */
  dependsOn?: string
  /** Fields that must be non-empty for "complete" status */
  requiredFields?: string[]
}

export type ReviewProps = {
  objects: WorkflowObject[]
  config: WorkflowConfig
  onConfirm: () => void
  onBack: () => void
}

export type LifecycleConfig = {
  strategy: "batch" | "sequential" | "review-then-submit"
  submitLabel: string
  reviewLabel?: string
  confirmLabel?: string
  reviewComponent?: ComponentType<ReviewProps>
}

export type WorkflowConfig = {
  objectKinds: Record<string, ObjectKindConfig>
  initialObjectKind: string
  lifecycle: LifecycleConfig
  discardLabel?: string
  /**
   * Tier 2: kinds shown in the global "+" add menu. Defaults to all keys in `objectKinds`.
   * Tier 1 contextual suggestions come from each kind's `suggestedNext`.
   */
  addMenuKinds?: string[]
}

/** All billing object forms — used for merged entry-point workflows and general "+" menu. */
export type FullBillingForms = {
  invoice: ComponentType<any>
  customer: ComponentType<any>
  product: ComponentType<any>
  coupon: ComponentType<any>
  meter: ComponentType<any>
  price: ComponentType<any>
  subscription: ComponentType<any>
  pricingPlan: ComponentType<any>
  invoicePreview: ComponentType<any>
  subscriptionPreview: ComponentType<any>
  meterPreview: ComponentType<any>
  pricePreview: ComponentType<any>
  productPreview: ComponentType<any>
}

// ── Base object metadata (shared across all flows) ───────────────────

type BaseObjectMeta = Omit<ObjectKindConfig, "formComponent" | "previewComponent" | "suggestedNext">

const BASE_OBJECT_META: Record<string, BaseObjectMeta> = {
  invoice:      { label: "Invoice",      icon: "invoice",      requiredFields: ["name", "amount", "customerId", "productId"] },
  subscription: { label: "Subscription", icon: "subscription", requiredFields: ["customerId", "productId"] },
  customer:     { label: "Customer",     icon: "customer",     requiredFields: ["email"] },
  pricingPlan:  { label: "Pricing plan", icon: "pricingPlan" },
  product:      { label: "Product",      icon: "product",      allowMultiple: true, requiredFields: ["name"] },
  meter:        { label: "Meter",        icon: "meter",        dependsOn: "price", requiredFields: ["name"] },
  price:        { label: "Price",        icon: "price",        dependsOn: "product", allowMultiple: true, requiredFields: [] },
  coupon:       { label: "Coupon",       icon: "coupon",       requiredFields: ["name", "amount"] },
  contract:     { label: "Contract",    icon: "contract",     requiredFields: ["name", "parentPlanId"] },
  paymentLink:  { label: "Payment Link", icon: "paymentLink",  requiredFields: ["linkType"] },
}

type ObjectKindOverride = {
  formComponent: ComponentType<any>
  previewComponent?: ComponentType<any>
  suggestedNext?: ObjectKindConfig["suggestedNext"]
  dependsOn?: string
  requiredFields?: string[]
  allowMultiple?: boolean
}

function buildObjectKinds(
  kinds: Record<string, ObjectKindOverride>
): Record<string, ObjectKindConfig> {
  const result: Record<string, ObjectKindConfig> = {}
  for (const [key, overrides] of Object.entries(kinds)) {
    const base = BASE_OBJECT_META[key]
    if (!base) throw new Error(`Unknown object kind: ${key}`)
    result[key] = {
      ...base,
      ...overrides,
      suggestedNext: overrides.suggestedNext ?? [],
    }
  }
  return result
}

function mergedBillingObjectKinds(forms: FullBillingForms): Record<string, ObjectKindConfig> {
  return buildObjectKinds({
    invoice: {
      formComponent: forms.invoice,
      previewComponent: forms.invoicePreview,
      suggestedNext: [
        { kind: "customer", actionLabel: "Add a customer", reason: "to receive this invoice." },
        { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this invoice." },
      ],
    },
    subscription: {
      formComponent: forms.subscription,
      previewComponent: forms.subscriptionPreview,
      suggestedNext: [
        { kind: "customer", actionLabel: "Add a customer", reason: "to subscribe to this plan." },
        { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this subscription." },
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to send a one-time charge alongside it." },
      ],
    },
    customer: {
      formComponent: forms.customer,
      suggestedNext: [
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to bill this customer." },
        { kind: "subscription", actionLabel: "Create a subscription", reason: "for recurring billing." },
        { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount an invoice or subscription." },
      ],
    },
    pricingPlan: {
      formComponent: forms.pricingPlan,
      suggestedNext: [
        { kind: "meter", actionLabel: "Add a meter", reason: "to track usage for a rate card on this plan." },
      ],
    },
    product: {
      formComponent: forms.product,
      previewComponent: forms.productPreview,
      suggestedNext: [
        { kind: "price", actionLabel: "Add a price", reason: "to define how this product is billed." },
        { kind: "subscription", actionLabel: "Create a subscription", reason: "to sell this product on a recurring basis." },
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to bill for this product as a one-time charge." },
      ],
    },
    meter: {
      formComponent: forms.meter,
      previewComponent: forms.meterPreview,
    },
    price: {
      formComponent: forms.price,
      previewComponent: forms.pricePreview,
      suggestedNext: [
        { kind: "meter", actionLabel: "Add a meter", reason: "to track usage for this price." },
      ],
    },
    coupon: {
      formComponent: forms.coupon,
      suggestedNext: [
        { kind: "subscription", actionLabel: "Create a subscription", reason: "to apply this discount on a recurring basis." },
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to discount a one-time payment." },
      ],
    },
  })
}

function stripPreviews(kinds: Record<string, ObjectKindConfig>, onlyKinds?: string[]): Record<string, ObjectKindConfig> {
  const result = { ...kinds }
  for (const key of Object.keys(result)) {
    if (!onlyKinds || onlyKinds.includes(key)) {
      result[key] = { ...result[key] }
      delete result[key].previewComponent
    }
  }
  return result
}

/** Customer-first: simple modal, no preview panel. */
export function createCustomerEntryWorkflowConfig(forms: FullBillingForms): WorkflowConfig {
  const objectKinds = stripPreviews(mergedBillingObjectKinds(forms))
  return {
    initialObjectKind: "customer",
    discardLabel: "Discard",
    addMenuKinds: ["invoice", "subscription"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create customer",
    },
    objectKinds,
  }
}

/** Product-first: no preview panel; contextual detail for product/price/meter via tool styles. */
export function createProductEntryWorkflowConfig(forms: FullBillingForms): WorkflowConfig {
  const objectKinds = stripPreviews(mergedBillingObjectKinds(forms))
  return {
    initialObjectKind: "product",
    discardLabel: "Discard",
    addMenuKinds: ["product", "price", "meter", "coupon", "subscription", "invoice", "pricingPlan"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create product",
    },
    objectKinds,
  }
}

/** Coupon-first: simple modal, no preview panel. */
export function createCouponEntryWorkflowConfig(forms: FullBillingForms): WorkflowConfig {
  const objectKinds = stripPreviews(mergedBillingObjectKinds(forms))
  return {
    initialObjectKind: "coupon",
    discardLabel: "Discard",
    addMenuKinds: ["coupon", "subscription", "invoice", "product"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create coupon",
    },
    objectKinds,
  }
}

/** Contract-first: form + preview, select customer + pricing plan. */
export function createContractWorkflowConfig(forms: {
  contract: ComponentType<any>
  customer: ComponentType<any>
  contractPreview: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "contract",
    discardLabel: "Discard",
    addMenuKinds: ["contract", "customer"],
    lifecycle: { strategy: "batch", submitLabel: "Create contract" },
    objectKinds: buildObjectKinds({
      contract: {
        formComponent: forms.contract,
        previewComponent: forms.contractPreview,
        suggestedNext: [
          { kind: "customer", actionLabel: "Add a customer", reason: "to assign this contract to." },
        ],
      },
      customer: { formComponent: forms.customer },
    }),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

export type FlowEdge = { fromLabel: string; toLabel: string; reason: string }

export type OmissionReason = "backwards" | "skips-step" | "unrelated" | "uncommon"
export type FlowOmission = { fromLabel: string; notSuggested: string; reason: OmissionReason; rationale: string }

/** Exhaustive omissions — every object pair not in suggested, with rationale.
 *  "uncommon" = orange tier (possible but not typical).
 *  "backwards" / "skips-step" / "unrelated" = red tier (not suggested). */
export function getFlowOmissions(): FlowOmission[] {
  return [
    // Invoice → green: Customer, Coupon
    { fromLabel: "Invoice", notSuggested: "Product", reason: "uncommon", rationale: "Merchants usually have products already; some create per-invoice." },
    { fromLabel: "Invoice", notSuggested: "Pricing plan", reason: "uncommon", rationale: "Coupled with product — merchants usually set these up separately." },
    { fromLabel: "Invoice", notSuggested: "Subscription", reason: "backwards", rationale: "Subscriptions generate invoices, not the reverse." },
    { fromLabel: "Invoice", notSuggested: "Meter", reason: "skips-step", rationale: "Through metered prices (v1) or plan rate cards (v2)." },

    // Subscription → green: Customer, Coupon, Invoice
    { fromLabel: "Subscription", notSuggested: "Product", reason: "uncommon", rationale: "Products are usually set up already, but possible in some flows." },
    { fromLabel: "Subscription", notSuggested: "Pricing plan", reason: "backwards", rationale: "Pricing plans are complex structures — set them up before creating subscriptions." },
    { fromLabel: "Subscription", notSuggested: "Meter", reason: "skips-step", rationale: "Through metered prices (v1) or plan rate cards (v2)." },

    // Customer → green: Invoice, Subscription, Coupon
    { fromLabel: "Customer", notSuggested: "Product", reason: "uncommon", rationale: "Catalog items are usually created separately, but possible." },
    { fromLabel: "Customer", notSuggested: "Pricing plan", reason: "backwards", rationale: "Billing structures are typically set up before adding customers." },
    { fromLabel: "Customer", notSuggested: "Meter", reason: "skips-step", rationale: "Connected through subscriptions and prices/plans." },

    // Pricing plan → green: Meter
    { fromLabel: "Pricing plan", notSuggested: "Coupon", reason: "uncommon", rationale: "Possible for plan-wide discounts." },
    { fromLabel: "Pricing plan", notSuggested: "Product", reason: "unrelated", rationale: "Products are a v1 concept; pricing plans are v2." },
    { fromLabel: "Pricing plan", notSuggested: "Invoice", reason: "skips-step", rationale: "Invoices are generated by subscriptions to this plan." },
    { fromLabel: "Pricing plan", notSuggested: "Subscription", reason: "backwards", rationale: "You reach the plan from the subscription." },
    { fromLabel: "Pricing plan", notSuggested: "Customer", reason: "skips-step", rationale: "Customers are set on the subscription, not the plan." },

    // Product → green: Meter, Subscription, Invoice
    { fromLabel: "Product", notSuggested: "Pricing plan", reason: "unrelated", rationale: "Pricing plans are a v2 concept; products are v1." },
    { fromLabel: "Product", notSuggested: "Customer", reason: "skips-step", rationale: "Customers connect through invoices or subscriptions." },
    { fromLabel: "Product", notSuggested: "Coupon", reason: "backwards", rationale: "Coupon references the product (applies_to), not the reverse." },

    // Meter → green: Pricing plan
    { fromLabel: "Meter", notSuggested: "Invoice", reason: "skips-step", rationale: "Through metered prices (v1) or plan rate cards (v2)." },
    { fromLabel: "Meter", notSuggested: "Subscription", reason: "skips-step", rationale: "Through prices (v1) or plan rate cards (v2)." },
    { fromLabel: "Meter", notSuggested: "Customer", reason: "skips-step", rationale: "Connected through subscriptions and prices/plans." },
    { fromLabel: "Meter", notSuggested: "Product", reason: "backwards", rationale: "Meters are standalone; product is upstream in the catalog." },
    { fromLabel: "Meter", notSuggested: "Coupon", reason: "unrelated", rationale: "Measurement vs. discounting." },

    // Coupon → green: Subscription, Invoice
    { fromLabel: "Coupon", notSuggested: "Customer", reason: "uncommon", rationale: "Discounts typically reach customers through invoices or subscriptions, but possible." },
    { fromLabel: "Coupon", notSuggested: "Product", reason: "backwards", rationale: "Product should exist first; coupon's applies_to references it." },
    { fromLabel: "Coupon", notSuggested: "Pricing plan", reason: "skips-step", rationale: "Discounts live on subscriptions or invoices, not on plans." },
    { fromLabel: "Coupon", notSuggested: "Meter", reason: "unrelated", rationale: "Measurement vs. discounting." },
  ]
}

/** Derive Tier 1 suggestion edges from a config's objectKinds. */
export function deriveFlowEdges(config: WorkflowConfig): FlowEdge[] {
  const edges: FlowEdge[] = []
  for (const [, kindConfig] of Object.entries(config.objectKinds)) {
    for (const s of kindConfig.suggestedNext ?? []) {
      const target = config.objectKinds[s.kind]
      if (target) edges.push({ fromLabel: kindConfig.label, toLabel: target.label, reason: s.reason })
    }
  }
  return edges
}

/** Full merged billing Tier 1 graph (all object kinds, not scoped to an entry flow). */
export function getFullBillingFlowEdges(): FlowEdge[] {
  const stub = (() => () => null) as any
  const dummyForms: FullBillingForms = {
    invoice: stub, customer: stub, product: stub, coupon: stub,
    meter: stub, price: stub, subscription: stub, pricingPlan: stub,
    invoicePreview: stub, subscriptionPreview: stub, meterPreview: stub, pricePreview: stub, productPreview: stub,
  }
  const kinds = mergedBillingObjectKinds(dummyForms)
  const fakeConfig: WorkflowConfig = {
    objectKinds: kinds,
    initialObjectKind: "invoice",
    lifecycle: { strategy: "batch", submitLabel: "" },
  }
  return deriveFlowEdges(fakeConfig)
}

export function getPrimaryLabel(config: WorkflowConfig, _phase?: "editing" | "reviewing", objectCount?: number): string {
  if (objectCount && objectCount > 1) return `Create all (${objectCount})`
  return config.lifecycle.submitLabel
}

// ── Invoice flow config ──────────────────────────────────────────────

export function createInvoiceWorkflowConfig(forms: {
  invoice: ComponentType<any>
  customer: ComponentType<any>
  product: ComponentType<any>
  coupon: ComponentType<any>
  meter: ComponentType<any>
  price: ComponentType<any>
  review?: ComponentType<any>
  invoicePreview?: ComponentType<any>
  meterPreview?: ComponentType<any>
  pricePreview?: ComponentType<any>
  productPreview?: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "invoice",
    discardLabel: "Discard",
    addMenuKinds: ["invoice", "customer", "coupon", "meter", "price", "product"],
    lifecycle: { strategy: "batch", submitLabel: "Create invoice" },
    objectKinds: buildObjectKinds({
      invoice: {
        formComponent: forms.invoice,
        previewComponent: forms.invoicePreview,
        suggestedNext: [
          { kind: "customer", actionLabel: "Add a customer", reason: "to receive this invoice." },
          { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this invoice." },
        ],
      },
      customer: {
        formComponent: forms.customer,
        suggestedNext: [{ kind: "product", actionLabel: "Add a product", reason: "to include on the invoice." }],
      },
      product: {
        formComponent: forms.product,
        previewComponent: forms.productPreview,
        suggestedNext: [{ kind: "price", actionLabel: "Add a price", reason: "to define how this product is billed." }],
      },
      price: { formComponent: forms.price, previewComponent: forms.pricePreview },
      meter: { formComponent: forms.meter, previewComponent: forms.meterPreview },
      coupon: {
        formComponent: forms.coupon,
        suggestedNext: [{ kind: "product", actionLabel: "Add a product", reason: "to add as a line item on the invoice." }],
      },
    }),
  }
}

// ── Subscription flow config ─────────────────────────────────────────

export function createSubscriptionWorkflowConfig(forms: {
  subscription: ComponentType<any>
  customer: ComponentType<any>
  pricingPlan: ComponentType<any>
  product: ComponentType<any>
  coupon: ComponentType<any>
  price?: ComponentType<any>
  subscriptionPreview?: ComponentType<any>
  pricePreview?: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "subscription",
    discardLabel: "Discard",
    addMenuKinds: ["subscription", "customer", "pricingPlan", "product", "coupon", "invoice"],
    lifecycle: { strategy: "batch", submitLabel: "Create subscription" },
    objectKinds: buildObjectKinds({
      subscription: {
        formComponent: forms.subscription,
        previewComponent: forms.subscriptionPreview,
        suggestedNext: [
          { kind: "customer", actionLabel: "Add a customer", reason: "to subscribe to this plan." },
          { kind: "pricingPlan", actionLabel: "Select a pricing plan", reason: "to define billing (v2)." },
          { kind: "product", actionLabel: "Add a product", reason: "to define what's being billed (v1)." },
          { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this subscription." },
          { kind: "invoice", actionLabel: "Create an invoice", reason: "to send a one-time charge alongside this subscription." },
        ],
      },
      customer: {
        formComponent: forms.customer,
        suggestedNext: [
          { kind: "pricingPlan", actionLabel: "Select a pricing plan", reason: "to define billing (v2)." },
          { kind: "product", actionLabel: "Add a product", reason: "to define what's being billed (v1)." },
        ],
      },
      pricingPlan: {
        formComponent: forms.pricingPlan,
        suggestedNext: [
          { kind: "product", actionLabel: "Add a product", reason: "to include in this subscription." },
          { kind: "meter", actionLabel: "Add a meter", reason: "to track usage for a rate card on this plan." },
          { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this subscription." },
        ],
      },
      product: {
        formComponent: forms.product,
        requiredFields: ["name", "unitPrice"],
        suggestedNext: forms.price
          ? [{ kind: "price", actionLabel: "Add a price", reason: "to define how this product is billed." }]
          : [],
      },
      ...(forms.price ? {
        price: { formComponent: forms.price, previewComponent: forms.pricePreview },
      } : {}),
      coupon: { formComponent: forms.coupon },
    }),
  }
}

// ── Usage-based billing flow config ─────────────────────────────────

export function createUsageBillingWorkflowConfig(forms: {
  meter: ComponentType<any>
  product: ComponentType<any>
  customer: ComponentType<any>
  price?: ComponentType<any>
  pricePreview?: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "meter",
    discardLabel: "Discard",
    addMenuKinds: ["meter", "product", "customer"],
    lifecycle: { strategy: "batch", submitLabel: "Set up billing" },
    objectKinds: buildObjectKinds({
      meter: {
        formComponent: forms.meter,
        dependsOn: undefined,
        suggestedNext: [{ kind: "product", actionLabel: "Add a product", reason: "to bill usage against." }],
      },
      product: {
        formComponent: forms.product,
        requiredFields: ["name", "unitPrice"],
        suggestedNext: [
          ...(forms.price
            ? [{ kind: "price", actionLabel: "Add a price", reason: "to define how this product is billed." }]
            : []),
          { kind: "customer", actionLabel: "Add a customer", reason: "to bill for usage." },
        ],
      },
      ...(forms.price ? {
        price: { formComponent: forms.price, previewComponent: forms.pricePreview },
      } : {}),
      customer: { formComponent: forms.customer },
    }),
  }
}

// ── Simple customer config ───────────────────────────────────────────

export function createCustomerWorkflowConfig(forms: {
  customer: ComponentType<any>
  invoice?: ComponentType<any>
  subscription?: ComponentType<any>
  product?: ComponentType<any>
  coupon?: ComponentType<any>
  meter?: ComponentType<any>
  price?: ComponentType<any>
  pricingPlan?: ComponentType<any>
  invoicePreview?: ComponentType<any>
  subscriptionPreview?: ComponentType<any>
  meterPreview?: ComponentType<any>
  pricePreview?: ComponentType<any>
  productPreview?: ComponentType<any>
}): WorkflowConfig {
  const full =
    forms.invoice &&
    forms.subscription &&
    forms.product &&
    forms.coupon &&
    forms.meter &&
    forms.price &&
    forms.pricingPlan &&
    forms.invoicePreview &&
    forms.subscriptionPreview

  if (full) {
    return createCustomerEntryWorkflowConfig({
      invoice: forms.invoice!,
      customer: forms.customer,
      product: forms.product!,
      coupon: forms.coupon!,
      meter: forms.meter!,
      price: forms.price!,
      subscription: forms.subscription!,
      pricingPlan: forms.pricingPlan!,
      invoicePreview: forms.invoicePreview!,
      subscriptionPreview: forms.subscriptionPreview!,
      meterPreview: forms.meterPreview!,
      pricePreview: forms.pricePreview!,
      productPreview: forms.productPreview ?? (() => null),
    })
  }

  return {
    initialObjectKind: "customer",
    discardLabel: "Discard",
    lifecycle: { strategy: "batch", submitLabel: "Create customer" },
    objectKinds: buildObjectKinds({
      customer: {
        formComponent: forms.customer,
        requiredFields: ["name"],
        suggestedNext: forms.invoice
          ? [{ kind: "invoice", actionLabel: "Create an invoice", reason: "for this customer." }]
          : [],
      },
      ...(forms.invoice ? {
        invoice: { formComponent: forms.invoice },
      } : {}),
    }),
  }
}

// ── Payment Link flow config ────────────────────────────────────────

export function createPaymentLinkWorkflowConfig(forms: {
  paymentLink: ComponentType<any>
  product: ComponentType<any>
  price: ComponentType<any>
  paymentLinkPreview?: ComponentType<any>
  productPreview?: ComponentType<any>
  pricePreview?: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "paymentLink",
    discardLabel: "Discard",
    addMenuKinds: ["paymentLink", "product", "price"],
    lifecycle: { strategy: "batch", submitLabel: "Create link" },
    objectKinds: buildObjectKinds({
      paymentLink: {
        formComponent: forms.paymentLink,
        previewComponent: forms.paymentLinkPreview,
        suggestedNext: [
          { kind: "product", actionLabel: "Add a product", reason: "to sell through this link." },
        ],
      },
      product: {
        formComponent: forms.product,
        requiredFields: ["name"],
        suggestedNext: [{ kind: "price", actionLabel: "Add a price", reason: "to define how this product is billed." }],
        previewComponent: forms.productPreview,
      },
      price: { formComponent: forms.price, previewComponent: forms.pricePreview },
    }),
  }
}
