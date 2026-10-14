'use client'

import { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect, useId } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ProductForm } from "./forms/ProductForm"
import { PriceForm, validatePriceData } from "./forms/PriceForm"
import { SubscriptionFeeForm, CreditGrantForm, RateCardForm, RateForm } from "./forms/ProductItemForms"
import { ProductPreviewPanel } from "./ProductPreviewPanel"
import { MeterEditorModal } from "./MeterEditorModal"
import { getCompactPriceLabel, getCurrencySymbol } from "./previewUtils"
import { PortalEditorShell } from "./PortalEditorShell"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { ControlTooltip } from "@/components/product-catalog/ControlTooltip"
import { EXISTING_METERS } from "./forms/shared/mockEntities"

// A pricing plan can contain direct prices, rate cards (with nested usage rates),
// subscription fees, and credit grants — mirroring the real pricing-plan editor.
type ItemKind = "price" | "rate-card" | "rate" | "subscription-fee" | "credit-grant"

type EditorItem = {
  id: string
  kind: ItemKind
}

type FullProductEditorProps = {
  isOpen: boolean
  onClose: () => void
  onCreate?: (planData: Record<string, any>, items: any[]) => void
  onPortalBack?: () => void
  portalOrigin?: string
  presentation?: 'portal' | 'fullscreen' | '80-modal'
  initialProductData?: Record<string, any>
  initialFocusField?: string
  // Related-objects demo: show a one-time explainer over the 80% modal so people understand
  // they've layered a bigger editor over their original flow without leaving it.
  showRelatedHint?: boolean
}

// ── Per-kind glyphs — the exact icons from the pricing-plan editor
// (ProductCatalogIcons.tsx), inlined so the starter stays self-contained.
// Mask ids are made unique per instance so multiple copies never collide.
function ItemGlyph({ kind }: { kind: ItemKind }) {
  const uid = useId().replace(/:/g, "")
  switch (kind) {
    case "rate-card":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1.25" y="1.5" width="9.5" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.05" />
          <rect x="1.25" y="7" width="9.5" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.05" />
        </svg>
      )
    case "price":
    case "rate":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4.66797 0.950195C4.94642 0.950215 5.21326 1.06092 5.41016 1.25781L10.5352 6.38281C10.9452 6.79285 10.9452 7.45715 10.5352 7.86719L7.86719 10.5352C7.45715 10.9452 6.79285 10.9452 6.38281 10.5352L1.25781 5.41016C1.06092 5.21326 0.950215 4.94642 0.950195 4.66797V2C0.950195 1.4201 1.4201 0.950195 2 0.950195H4.66797Z" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="3.35" cy="3.35" r="0.85" fill="currentColor" />
        </svg>
      )
    case "subscription-fee":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <mask id={`sf-${uid}`} fill="white"><rect x="1" y="2" width="10" height="8" rx="1" /></mask>
          <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2.4" mask={`url(#sf-${uid})`} />
          <rect x="5.45001" y="4.5" width="1.2" height="3" rx="0.6" fill="currentColor" />
        </svg>
      )
    case "credit-grant":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <mask id={`cg-${uid}`} fill="white"><rect x="1" y="4" width="10" height="7" rx="1" /></mask>
          <rect x="1" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="2.4" mask={`url(#cg-${uid})`} />
          <rect x="5.5" y="5" width="1.2" height="5" fill="currentColor" />
          <circle cx="4.57146" cy="3.12857" r="1.42857" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7.42857" cy="3.12857" r="1.42857" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
  }
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform ${open ? "rotate-90" : ""}`}>
      <path d="M2.75 1.5L5.25 4L2.75 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ITEM_TITLE: Record<ItemKind, string> = {
  "price": "Price",
  "rate-card": "Rate card",
  "rate": "Rate",
  "subscription-fee": "Subscription fee",
  "credit-grant": "Credit grant",
}

function defaultItemData(kind: ItemKind): Record<string, any> {
  switch (kind) {
    case "price": return { priceType: "recurring", pricingCategory: "flat_rate", pricingModel: "standard", billingPeriod: "monthly", currency: "USD", usageType: "licensed" }
    case "subscription-fee": return { billingPeriod: "monthly", currency: "USD" }
    case "credit-grant": return { currency: "USD", expiry: "never" }
    case "rate-card": return { currency: "USD" }
    case "rate": return { currency: "USD" }
    default: return { currency: "USD" }
  }
}

function initialEditorState(initialProductData?: Record<string, any>, initialFocusField?: string) {
  if (!initialProductData) {
    return {
      planData: { name: "", description: "" },
      items: [] as EditorItem[],
      itemDataMap: {} as Record<string, Record<string, any>>,
      activeNode: "product" as const,
    }
  }

  const {
    _prices,
    _pricingType,
    _inlineAmount,
    _inlineCurrency,
    _inlineBillingPeriod,
    _inlineTaxBehavior,
    ...planData
  } = initialProductData
  const existingPrices = Array.isArray(_prices) && _prices.length > 0
    ? _prices
    : [{
        priceType: _pricingType === "one_off" ? "one_time" : "recurring",
        amount: _inlineAmount ?? "",
        currency: _inlineCurrency ?? "USD",
        billingPeriod: _inlineBillingPeriod ?? "monthly",
        taxBehavior: _inlineTaxBehavior ?? "auto",
      }]
  const items: EditorItem[] = existingPrices.map((_: Record<string, any>, index: number) => ({
    id: `item-${index + 1}`,
    kind: "price",
  }))
  const itemDataMap = Object.fromEntries(existingPrices.map((price: Record<string, any>, index: number) => [
    items[index].id,
    {
      ...defaultItemData("price"),
      ...price,
      priceType: price.priceType === "one_off" ? "one_time" : (price.priceType ?? "recurring"),
    },
  ]))

  return {
    planData: { ...planData, name: planData.name ?? "", description: planData.description ?? "" },
    items,
    itemDataMap,
    activeNode: initialFocusField && !initialFocusField.startsWith("_inline") && initialFocusField !== "_pricingType"
      ? "product" as const
      : items[0].id,
  }
}

function periodShort(billingPeriod?: string) {
  return (billingPeriod ?? "month").replace("ly", "").replace("dai", "day")
}

function TreeNodeLabel({ label }: { label: string }) {
  if (label.endsWith(" · $0.00")) {
    return (
      <span className="min-w-0 flex-1 truncate font-[500]">
        {label.slice(0, -5)}
        <span className="text-[#818DA0]">$0.00</span>
      </span>
    )
  }

  return <span className="min-w-0 flex-1 truncate font-[500]">{label}</span>
}

// ── Right-click context menu on tree rows ────────────────────────────
function NodeContextMenu({ menu, onClose, onDuplicate, onDelete }: { menu: { top: number; left: number; itemId: string }; onClose: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: menu.top, left: menu.left })

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let { top, left } = menu
    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8
    if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8
    setPos({ top: Math.max(8, top), left: Math.max(8, left) })
  }, [menu])

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    const timer = window.setTimeout(() => { document.addEventListener("click", onDown); document.addEventListener("contextmenu", onDown) }, 0)
    document.addEventListener("keydown", onKey)
    return () => { window.clearTimeout(timer); document.removeEventListener("click", onDown); document.removeEventListener("contextmenu", onDown); document.removeEventListener("keydown", onKey) }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] w-max overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white py-[4px] shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
      style={{ top: pos.top, left: pos.left }}
      role="menu"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8] whitespace-nowrap"
        onClick={() => { onDuplicate(); onClose() }}
      >
        Duplicate
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[500] text-[#C0123C] transition-colors hover:bg-[#F5F6F8] whitespace-nowrap"
        onClick={() => { onDelete(); onClose() }}
      >
        Delete
      </button>
    </div>,
    document.body,
  )
}

export function FullProductEditor({ isOpen, onClose, onCreate, onPortalBack, portalOrigin, presentation, initialProductData, initialFocusField, showRelatedHint }: FullProductEditorProps) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"
  // Tree-node visual language — mirrors the pricing-plan editor (PlanSidebarNav).
  // Text scales with the UI style so the tree tracks the form's type ramp
  // (Compact 12px · Standard 14px · Refresh 13px).
  const nodeText = isRefresh
    ? "text-[13px] leading-[20px] tracking-[-0.065px]"
    : isSail
      ? "text-[14px] leading-[20px] tracking-[-0.15px]"
      : "text-[12px] leading-[16px] tracking-[-0.024px]"
  const nodeActive = isRefresh ? "bg-[#F1F6FB] text-[#142234]" : "bg-[#F7F5FD] text-[#1A2C44]"
  const nodeIdle = isRefresh ? "text-[#142234] hover:bg-[#F1F6FB]" : "text-[#1A2C44] hover:bg-[#F4F7FA]"
  const addNodeClass = isRefresh ? "text-[#2C219E] hover:bg-[#F1F6FB]" : "text-[#533AFD] hover:bg-[#F5F6F8]"

  const [planData, setPlanData] = useState<Record<string, any>>({ name: "", description: "" })
  const [items, setItems] = useState<EditorItem[]>([])
  // Keyed by item id AND rate id. A rate-card's entry holds `rateIds: string[]`;
  // each rate id has its own entry ({ name, amount, unitLabel, currency }).
  const [itemDataMap, setItemDataMap] = useState<Record<string, Record<string, any>>>({})
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [activeNode, setActiveNode] = useState<"product" | string>("product")
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number; itemId: string } | null>(null)
  const [meterRecords, setMeterRecords] = useState<Record<string, Record<string, any>>>(() => Object.fromEntries(
    EXISTING_METERS.map((meter) => [meter.id, { id: meter.id, name: meter.name, displayName: meter.name, aggregation: meter.detail?.toLowerCase() ?? "sum" }]),
  ))
  const [meterEditor, setMeterEditor] = useState<{ priceId: string; meterId?: string } | null>(null)
  const [validationByNode, setValidationByNode] = useState<Record<string, string[]>>({})
  const [submitError, setSubmitError] = useState("")
  const idCounter = useRef(0)
  const wasOpenRef = useRef(false)
  const formAreaRef = useRef<HTMLDivElement>(null)
  const pendingFocusFieldRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const initial = initialEditorState(initialProductData, initialFocusField)
      setPlanData(initial.planData)
      setItems(initial.items)
      setItemDataMap(initial.itemDataMap)
      setExpandedCards({})
      setActiveNode(initial.activeNode)
      setShowDiscardWarning(false)
      setIsExiting(false)
      setContextMenu(null)
      setMeterEditor(null)
      setValidationByNode({})
      setSubmitError("")
      idCounter.current = initial.items.length
      pendingFocusFieldRef.current = initialFocusField ?? null
    }
    wasOpenRef.current = isOpen
  }, [initialFocusField, initialProductData, isOpen])

  useEffect(() => {
    if (!isOpen || !pendingFocusFieldRef.current) return

    const frame = window.requestAnimationFrame(() => {
      const focusField = pendingFocusFieldRef.current
      if (!focusField || !formAreaRef.current) return
      const marker = formAreaRef.current.querySelector<HTMLElement>(`[data-focus-field="${focusField}"]`)
      const focusTarget = marker?.matches("input, textarea, button, [tabindex]")
        ? marker
        : marker?.querySelector<HTMLElement>("input, textarea, button, [tabindex]")
      if (!focusTarget) return
      focusTarget.focus({ preventScroll: true })
      pendingFocusFieldRef.current = null
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeNode, isOpen])

  const nextId = useCallback(() => { idCounter.current += 1; return `item-${idCounter.current}` }, [])

  const addItem = useCallback((kind: ItemKind) => {
    if (kind === "rate-card") {
      // A new rate card starts with one rate so the nesting is immediately visible.
      const cardId = nextId()
      const rateId = nextId()
      setItems((prev) => [...prev, { id: cardId, kind: "rate-card" }])
      setItemDataMap((prev) => ({ ...prev, [cardId]: { currency: "USD", rateIds: [rateId] }, [rateId]: defaultItemData("rate") }))
      setExpandedCards((prev) => ({ ...prev, [cardId]: true }))
      setActiveNode(cardId)
      return
    }
    const id = nextId()
    setItems((prev) => [...prev, { id, kind }])
    setItemDataMap((prev) => ({ ...prev, [id]: defaultItemData(kind) }))
    setActiveNode(id)
  }, [nextId])

  const addRate = useCallback((cardId: string) => {
    const rateId = nextId()
    setItemDataMap((prev) => ({
      ...prev,
      [rateId]: defaultItemData("rate"),
      [cardId]: { ...prev[cardId], rateIds: [...(prev[cardId]?.rateIds ?? []), rateId] },
    }))
    setExpandedCards((prev) => ({ ...prev, [cardId]: true }))
    setActiveNode(rateId)
  }, [nextId])

  const toggleExpand = useCallback((cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !(prev[cardId] ?? true) }))
  }, [])

  const duplicateItem = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx !== -1) {
        const orig = prev[idx]
        const newId = nextId()
        if (orig.kind === "rate-card") {
          setItemDataMap((m) => {
            const origData = m[id] ?? {}
            const origRateIds: string[] = origData.rateIds ?? []
            const newRateIds = origRateIds.map(() => nextId())
            const next: Record<string, Record<string, any>> = { ...m, [newId]: { ...origData, rateIds: newRateIds } }
            origRateIds.forEach((rid, i) => { next[newRateIds[i]] = { ...(m[rid] ?? {}) } })
            return next
          })
          setExpandedCards((e) => ({ ...e, [newId]: true }))
        } else {
          setItemDataMap((m) => ({ ...m, [newId]: { ...(m[id] ?? {}) } }))
        }
        const copy: EditorItem = { id: newId, kind: orig.kind }
        const nextItems = [...prev]
        nextItems.splice(idx + 1, 0, copy)
        setActiveNode(newId)
        return nextItems
      }
      // A rate → duplicate within its parent card.
      const parent = prev.find((i) => (itemDataMap[i.id]?.rateIds ?? []).includes(id))
      if (parent) {
        const newRateId = nextId()
        setItemDataMap((m) => {
          const rids: string[] = m[parent.id]?.rateIds ?? []
          const at = rids.indexOf(id)
          const nextRids = [...rids]
          nextRids.splice(at + 1, 0, newRateId)
          return { ...m, [newRateId]: { ...(m[id] ?? {}) }, [parent.id]: { ...m[parent.id], rateIds: nextRids } }
        })
        setActiveNode(newRateId)
      }
      return prev
    })
  }, [nextId, itemDataMap])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx !== -1) {
        const orig = prev[idx]
        const childRateIds: string[] = orig.kind === "rate-card" ? (itemDataMap[id]?.rateIds ?? []) : []
        setItemDataMap((m) => {
          const next = { ...m }
          childRateIds.forEach((rid) => delete next[rid])
          delete next[id]
          return next
        })
        setActiveNode((cur) => (cur === id || childRateIds.includes(cur as string) ? "product" : cur))
        return prev.filter((i) => i.id !== id)
      }
      // A rate → remove from its parent card.
      const parent = prev.find((i) => (itemDataMap[i.id]?.rateIds ?? []).includes(id))
      if (parent) {
        setItemDataMap((m) => {
          const next = { ...m, [parent.id]: { ...m[parent.id], rateIds: (m[parent.id]?.rateIds ?? []).filter((r: string) => r !== id) } }
          delete next[id]
          return next
        })
        setActiveNode((cur) => (cur === id ? parent.id : cur))
      }
      return prev
    })
  }, [itemDataMap])

  const updateItemData = useCallback((id: string, data: Record<string, any>) => {
    setItemDataMap((prev) => ({ ...prev, [id]: { ...prev[id], ...data } }))
    setValidationByNode((current) => {
      if (!current[id]) return current
      const next = { ...current }
      delete next[id]
      return next
    })
    setSubmitError("")
  }, [])

  const handlePlanChange = useCallback((data: Record<string, any>) => {
    setPlanData((prev) => ({ ...prev, ...data }))
    setValidationByNode((current) => {
      if (!current.product) return current
      const next = { ...current }
      delete next.product
      return next
    })
    setSubmitError("")
  }, [])

  const hasProgress = planData.name || planData.description || items.length > 0

  const handlePortalBack = useCallback(() => {
    if (hasProgress) setShowDiscardWarning(true)
    else (onPortalBack ?? onClose)()
  }, [hasProgress, onClose, onPortalBack])

  const getItemLabel = useCallback((item: EditorItem) => {
    const d = itemDataMap[item.id] ?? {}
    switch (item.kind) {
      case "price":
        return getCompactPriceLabel(d)
      case "subscription-fee":
        return `${d.name?.trim() || "Subscription"} · ${d.amount ? `${getCurrencySymbol(d.currency)}${d.amount}/${periodShort(d.billingPeriod)}` : "Not set"}`
      case "credit-grant":
        return `${d.name?.trim() || "Credit grant"} · ${d.amount ? `${getCurrencySymbol(d.currency)}${d.amount}` : "Not set"}`
      case "rate-card":
        return `${d.name?.trim() || "Rate card"} · ${(d.rateIds ?? []).length} ${(d.rateIds ?? []).length === 1 ? "rate" : "rates"}`
      case "rate":
        return getCompactPriceLabel({ ...d, pricingCategory: d.pricingCategory ?? "usage_based", usageType: "metered" })
    }
  }, [itemDataMap])

  const getRateLabel = useCallback((rateId: string) => {
    const d = itemDataMap[rateId] ?? {}
    return getCompactPriceLabel({ ...d, pricingCategory: d.pricingCategory ?? "usage_based", usageType: "metered" })
  }, [itemDataMap])

  // Resolve the active node → its kind + id (rates aren't top-level items).
  const activeInfo = useMemo((): { kind: ItemKind | "product"; id?: string; parentId?: string } => {
    if (activeNode === "product") return { kind: "product" }
    const item = items.find((i) => i.id === activeNode)
    if (item) return { kind: item.kind, id: item.id }
    const parent = items.find((i) => (itemDataMap[i.id]?.rateIds ?? []).includes(activeNode))
    if (parent) return { kind: "rate", id: activeNode, parentId: parent.id }
    return { kind: "product" }
  }, [activeNode, items, itemDataMap])

  const getFormTitle = () => (activeInfo.kind === "product" ? "Product" : ITEM_TITLE[activeInfo.kind])

  const previewItems = useMemo(
    () => items.map((i) => {
      const d = itemDataMap[i.id] ?? {}
      if (i.kind === "rate-card") {
        const rates = (d.rateIds ?? []).map((rid: string) => ({ id: rid, ...(itemDataMap[rid] ?? {}) }))
        return { id: i.id, kind: i.kind, ...d, rates }
      }
      return { id: i.id, kind: i.kind, ...d }
    }),
    [items, itemDataMap],
  )

  const meterOptions = useMemo(
    () => Object.values(meterRecords).map((meter) => ({
      id: String(meter.id),
      name: String(meter.displayName || meter.name),
      detail: String(meter.aggregation || "sum").replace(/^./, (letter) => letter.toUpperCase()),
    })),
    [meterRecords],
  )

  if (!isOpen) return null

  const renderForm = () => {
    if (activeInfo.kind === "product") {
      return <ProductForm data={planData} onChange={handlePlanChange} hidePricing nameLabel="Product name" namePlaceholder="e.g. Pro" errorFields={new Set(validationByNode.product ?? [])} />
    }
    const id = activeInfo.id!
    const data = itemDataMap[id] ?? {}
    const onChange = (patch: Record<string, any>) => updateItemData(id, patch)
    switch (activeInfo.kind) {
      case "price": return (
        <PriceForm
          data={data}
          onChange={onChange}
          errorFields={new Set(validationByNode[id] ?? [])}
          meterOptions={meterOptions}
          onAddObject={(kind) => { if (kind === "meter") setMeterEditor({ priceId: id }) }}
          onEditMeter={(meterId) => setMeterEditor({ priceId: id, meterId })}
        />
      )
      case "rate-card": return <RateCardForm data={data} onChange={onChange} />
      case "rate": return <RateForm data={data} onChange={onChange} />
      case "subscription-fee": return <SubscriptionFeeForm data={data} onChange={onChange} />
      case "credit-grant": return <CreditGrantForm data={data} onChange={onChange} />
      default: return null
    }
  }

  const handleCreate = () => {
    if (!String(planData.name ?? "").trim()) {
      setValidationByNode({ product: ["name"] })
      setSubmitError("Enter a product name")
      setActiveNode("product")
      return
    }
    if (items.length === 0) {
      setSubmitError("Add at least one price")
      setActiveNode("product")
      return
    }

    for (const item of items) {
      if (item.kind !== "price") continue
      const fields = validatePriceData(itemDataMap[item.id] ?? {})
      if (fields.size > 0) {
        setValidationByNode({ [item.id]: Array.from(fields) })
        setSubmitError("Complete the highlighted price fields")
        setActiveNode(item.id)
        return
      }
    }

    setValidationByNode({})
    setSubmitError("")
    if (onCreate && portalOrigin) {
      setIsExiting(true)
      setTimeout(() => onCreate(planData, previewItems), 350)
    } else if (onCreate) {
      onCreate(planData, previewItems)
    } else {
      onClose()
    }
  }

  const editorContent = (
    <div className={`flex min-h-0 flex-1 flex-col ${isRefresh ? "gap-[4px] bg-[#F6F9FC] p-[8px]" : ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between bg-white ${isRefresh ? "rounded-[8px] px-[20px] py-[14px]" : "border-b border-[#ECF1F6] px-[20px] py-[12px]"}`}>
        <p className={isRefresh ? "text-[15px] font-[675] leading-[20px] tracking-[-0.15px] text-[#142234]" : tokens.modalTitleClass}>
          {planData.name || "New product"}
        </p>
        <div className="flex items-center gap-[8px]">
          <button type="button" className={tokens.secondaryButtonClass} onClick={onClose}>
            Discard
          </button>
          <button
            type="button"
            className={tokens.primaryButtonClass}
            onClick={handleCreate}
          >
            Create product
          </button>
        </div>
      </div>

      {submitError && (
        <div role="alert" className="border-b border-[#F8C6D0] bg-[#FFF5F7] px-[20px] py-[8px] text-[12px] font-[500] text-[#C0123C]">
          {submitError}
        </div>
      )}

      {/* Body: sidebar + form + preview */}
      <div className={`flex min-h-0 flex-1 ${isRefresh ? "gap-[4px]" : ""}`}>
        {/* Tree sidebar */}
        <div className={`w-[220px] shrink-0 overflow-y-auto px-[8px] py-[12px] ${isRefresh ? "rounded-[8px] bg-white" : "border-r border-[#EBEEF1]"}`}>
          <div className="flex flex-col gap-[2px]">
            {/* Product root node */}
            <button
              type="button"
              className={`flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left font-[500] ${nodeText} transition-colors ${activeNode === "product" ? nodeActive : nodeIdle}`}
              onClick={() => setActiveNode("product")}
            >
              <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[#3C4F69]">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 12" fill="none">
                  <path d="M9.20215 2.45391C9.33538 2.3781 9.50087 2.47439 9.50098 2.62774V7.57109C9.50098 7.6677 9.4491 7.75655 9.36523 7.80449L5.29102 10.1326C5.15772 10.2086 4.99219 10.1123 4.99219 9.95879V5.01641C4.99219 4.91979 5.04404 4.82997 5.12793 4.78203L9.20215 2.45391Z" stroke="currentColor" />
                  <path d="M0.799805 2.45391C0.666572 2.3781 0.501082 2.47439 0.500977 2.62774V7.57109C0.500977 7.6677 0.552852 7.75655 0.636719 7.80449L4.71094 10.1326C4.84424 10.2086 5.00977 10.1123 5.00977 9.95879V5.01641C5.00977 4.91979 4.95791 4.82997 4.87402 4.78203L0.799805 2.45391Z" stroke="currentColor" />
                  <path d="M9.13199 2.49882L5.37978 4.65718C5.14255 4.79364 4.85069 4.79378 4.61333 4.65756L0.851973 2.49888C0.781458 2.45841 0.786144 2.35517 0.860036 2.32126L4.67543 0.570118C4.87934 0.476529 5.11394 0.476631 5.31777 0.570396L9.12392 2.32129C9.19771 2.35523 9.20239 2.45833 9.13199 2.49882Z" stroke="currentColor" />
                </svg>
              </span>
              <span className="truncate">Overview</span>
            </button>

            {/* Item children */}
            {items.length > 0 && (
              <div className="flex flex-col gap-[2px]">
                {items.map((item) => {
                  const itemLabel = getItemLabel(item)
                  if (item.kind === "rate-card") {
                    const d = itemDataMap[item.id] ?? {}
                    const rateIds: string[] = d.rateIds ?? []
                    const open = expandedCards[item.id] ?? true
                    return (
                      <div key={item.id} className="flex flex-col gap-[2px]">
                        {/* Rate-card row (expandable) */}
                        <div
                          role="button"
                          tabIndex={0}
                          className={`flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left font-[400] ${nodeText} transition-colors ${activeNode === item.id ? nodeActive : nodeIdle}`}
                          onClick={() => setActiveNode(item.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveNode(item.id) } }}
                          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ top: e.clientY, left: e.clientX, itemId: item.id }) }}
                        >
                          <button
                            type="button"
                            aria-label={open ? "Collapse" : "Expand"}
                            className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[#7D8BA4] transition-colors hover:text-[#3C4F69]"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(item.id) }}
                          >
                            <ChevronGlyph open={open} />
                          </button>
                          <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[#7D8BA4]">
                            <ItemGlyph kind="rate-card" />
                          </span>
                          <TreeNodeLabel label={itemLabel} />
                        </div>
                        {/* Nested rates + inline add-rate */}
                        {open && (
                          <>
                            {rateIds.map((rid) => {
                              const rateLabel = getRateLabel(rid)
                              return (
                                <button
                                  key={rid}
                                  type="button"
                                  className={`flex w-full items-center gap-[8px] rounded-[6px] pl-[34px] pr-[8px] py-[4px] text-left font-[400] ${nodeText} transition-colors ${activeNode === rid ? nodeActive : nodeIdle}`}
                                  onClick={() => setActiveNode(rid)}
                                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ top: e.clientY, left: e.clientX, itemId: rid }) }}
                                >
                                  <span className="w-[14px] shrink-0" />
                                  <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[#7D8BA4]">
                                    <ItemGlyph kind="rate" />
                                  </span>
                                  <TreeNodeLabel label={rateLabel} />
                                </button>
                              )
                            })}
                            <button
                              type="button"
                              className={`flex w-full items-center gap-[8px] rounded-[6px] pl-[34px] pr-[8px] py-[4px] text-left ${isRefresh ? "font-[500]" : "font-[600]"} ${nodeText} ${addNodeClass}`}
                              onClick={() => addRate(item.id)}
                            >
                              <span className="w-[14px] shrink-0" />
                              <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center">
                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                  <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </span>
                              Add rate
                            </button>
                          </>
                        )}
                      </div>
                    )
                  }
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left font-[400] ${nodeText} transition-colors ${activeNode === item.id ? nodeActive : nodeIdle}`}
                      onClick={() => setActiveNode(item.id)}
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ top: e.clientY, left: e.clientX, itemId: item.id }) }}
                    >
                      <span className="w-[14px] shrink-0" />
                      <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[#7D8BA4]">
                        <ItemGlyph kind={item.kind} />
                      </span>
                      <TreeNodeLabel label={itemLabel} />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Add item button */}
            <button
              type="button"
              className={`flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left ${isRefresh ? "font-[500]" : "font-[600]"} ${nodeText} ${addNodeClass}`}
              onClick={() => addItem("price")}
            >
              <span className="w-[14px] shrink-0" />
              <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              Add price
            </button>
          </div>
        </div>

        {/* Form area */}
        <div ref={formAreaRef} className={`w-[300px] shrink-0 overflow-y-auto ${isRefresh ? "rounded-[8px] bg-white" : "border-r border-[#EBEEF1]"}`}>
          <div className={`flex items-center justify-between gap-[12px] ${isRefresh ? "px-[20px] pt-[16px]" : "px-[16px] pt-[12px]"}`}>
            <p className={`text-[14px] font-[500] leading-[20px] tracking-[-0.15px] ${isRefresh ? "text-[#142234]" : "text-[#1A2C44]"}`}>
              {getFormTitle()}
            </p>
            {activeInfo.kind !== "product" && activeInfo.id && (
              <div className="flex items-center gap-[8px] shrink-0">
                <ControlTooltip label="Duplicate">
                <button
                  type="button"
                  aria-label="Duplicate"
                  className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white transition-colors hover:bg-[#F5F6F8]"
                  onClick={() => duplicateItem(activeInfo.id!)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <path d="M9.75 0C10.8546 0 11.75 0.895431 11.75 2V7.5C11.75 8.60457 10.8546 9.5 9.75 9.5H8.75V10C8.75 11.1046 7.85457 12 6.75 12H2.25C1.14543 12 0.25 11.1046 0.25 10V4C0.25 3.30964 0.809644 2.75 1.5 2.75C1.91421 2.75 2.25 3.08579 2.25 3.5C2.25 3.82617 2.04077 4.10086 1.75 4.2041V10C1.75 10.2761 1.97386 10.5 2.25 10.5H6.75C7.02614 10.5 7.25 10.2761 7.25 10V9.5H5.25C4.14543 9.5 3.25 8.60457 3.25 7.5V2C3.25 0.895431 4.14543 0 5.25 0H9.75ZM5.25 1.5C4.97386 1.5 4.75 1.72386 4.75 2V7.5C4.75 7.77614 4.97386 8 5.25 8H9.75C10.0261 8 10.25 7.77614 10.25 7.5V2C10.25 1.72386 10.0261 1.5 9.75 1.5H5.25Z" fill="#3C4F69" />
                  </svg>
                </button>
                </ControlTooltip>
                <ControlTooltip label="Delete">
                <button
                  type="button"
                  aria-label="Delete"
                  className="group flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white transition-colors hover:border-[#FAA9B8] hover:bg-[#FEF4F6]"
                  onClick={() => removeItem(activeInfo.id!)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="#3C4F69" className="group-hover:fill-[#E61947]" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]" />
                  </svg>
                </button>
                </ControlTooltip>
              </div>
            )}
          </div>
          <div className={isRefresh ? "px-[20px] pb-[24px] pt-[16px]" : "px-[16px] pb-[16px] pt-[12px]"}>
            {renderForm()}
          </div>
        </div>

        {/* Preview area */}
        <div
          className={`flex-1 flex items-center justify-center p-[24px] ${isRefresh ? "rounded-[8px]" : portalOrigin ? "rounded-br-[12px]" : ""}`}
          style={isRefresh ? {
            backgroundColor: '#F6F9FC',
            backgroundImage: 'radial-gradient(circle, #D5DEE7 0.5px, transparent 0.5px)',
            backgroundSize: '14px 14px',
          } : {
            backgroundColor: '#f9fafb',
            backgroundImage: 'radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)',
            backgroundSize: '14px 14px',
          }}
        >
          <ProductPreviewPanel data={{ ...planData, _items: previewItems }} />
        </div>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <NodeContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onDuplicate={() => duplicateItem(contextMenu.itemId)}
          onDelete={() => removeItem(contextMenu.itemId)}
        />
      )}
    </div>
  )

  const resolvedPresentation = presentation ?? (portalOrigin ? 'portal' : 'fullscreen')

  return (
    <AnimatePresence>
      {resolvedPresentation === 'portal' ? (
        /* Portal flow: bg fades in, panel grows from modal size */
        <PortalEditorShell
          key="portal-product-editor"
          originLabel={portalOrigin ?? ""}
          currentLabel={planData.name || "New product"}
          onBack={handlePortalBack}
          isExiting={isExiting}
        >
          {editorContent}
        </PortalEditorShell>
      ) : resolvedPresentation === '80-modal' ? (
        /* 80% modal: large overlay panel */
        <motion.div
          key="80-modal-product-editor"
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="relative flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
            style={{ width: '80vw', height: '80vh' }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          >
            {editorContent}
          </motion.div>

          {/* Related-objects explainer: this 80% modal is layered over the original flow.
              Sits just above the panel (which is 80vh tall, so ~10vh of headroom) and points down at it. */}
          {showRelatedHint && (
            <motion.div
              className="pointer-events-none absolute left-1/2 z-[61] -translate-x-1/2"
              style={{ top: 'calc(10vh - 68px)' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="max-w-[360px] rounded-[10px] bg-[#1A2234] px-[14px] py-[10px] text-[12px] font-[400] leading-[17px] text-white shadow-[0_12px_32px_-8px_rgba(10,16,28,0.5)]">
                <span className="font-[600]">You’re in the 80% modal now.</span> It’s the full editor layered over your original flow — you haven’t left it. Close it and you’re right back where you were.
              </div>
              <div className="mx-auto h-0 w-0 border-x-[7px] border-t-[7px] border-x-transparent border-t-[#1A2234]" />
            </motion.div>
          )}
        </motion.div>
      ) : (
        /* Full-page scale-up "grow" — shared with the Standard editors */
        <motion.div
          key="full-product-editor"
          className="fixed inset-0 z-[60] flex flex-col bg-white"
          initial={{ opacity: 0, scale: 0.92, borderRadius: '12px' }}
          animate={{ opacity: 1, scale: 1, borderRadius: '0px' }}
          exit={{ opacity: 0, scale: 0.92, borderRadius: '12px' }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          style={{ transformOrigin: 'center center' }}
        >
          {editorContent}
        </motion.div>
      )}

      {/* Discard warning modal — when navigating back via portal bar */}
      {showDiscardWarning && (
        <div key="discard-warning" className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowDiscardWarning(false)} />
          <div className="relative z-10 w-[360px] rounded-[12px] border border-[#EBEEF1] bg-white p-[24px] shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]">
            <p className={tokens.modalTitleClass}>
              Discard changes?
            </p>
            <p className="mt-[8px] text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
              You have unsaved changes to this product. Going back will discard your progress.
            </p>
            <div className="mt-[16px] flex items-center justify-end gap-[8px]">
              <button
                type="button"
                className={tokens.secondaryButtonClass}
                onClick={() => setShowDiscardWarning(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="flex h-[28px] items-center rounded-[6px] border border-[#DF1B41] bg-[#DF1B41] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#C5173A]"
                onClick={onPortalBack ?? onClose}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <MeterEditorModal
        isOpen={Boolean(meterEditor)}
        initialData={meterEditor?.meterId ? meterRecords[meterEditor.meterId] : undefined}
        onClose={() => setMeterEditor(null)}
        onSave={(draft) => {
          if (!meterEditor) return
          const meterId = meterEditor.meterId ?? `meter-${Date.now()}`
          const meter = {
            ...meterRecords[meterId],
            ...draft,
            id: meterId,
            displayName: String(draft.displayName || draft.name),
          }
          setMeterRecords((current) => ({ ...current, [meterId]: meter }))
          updateItemData(meterEditor.priceId, {
            meterId,
            meterName: meter.displayName,
          })
          setMeterEditor(null)
        }}
      />
    </AnimatePresence>
  )
}
