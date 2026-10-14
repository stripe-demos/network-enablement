'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { CustomSelect } from "@/components/creation-workspace/forms/shared/CustomSelect"
import { PriceForm, validatePriceData } from "@/components/creation-workspace/forms/PriceForm"
import { getPriceDisplay } from "@/components/creation-workspace/previewUtils"
import { CURRENCY_OPTIONS, EXISTING_METERS } from "@/components/creation-workspace/forms/shared/mockEntities"
import { SegmentedControl } from "@/components/SegmentedControl"
import { FullProductEditor } from "@/components/creation-workspace/FullProductEditor"
import { ProductPreviewPanel } from "@/components/creation-workspace/ProductPreviewPanel"
import { MeterEditorModal } from "@/components/creation-workspace/MeterEditorModal"

type ProductMiniPrice = {
  id: string
  name?: string
  amount?: string
  priceType?: string
  pricingCategory?: string
  pricingModel?: string
  chargeType?: string
  tierMode?: string
  billingPeriod?: string
  currency?: string
  taxBehavior?: string
  usageType?: string
  unitLabel?: string
  meterId?: string
  meterName?: string
  packageSize?: string
  currencyOptions?: { id: string; currency: string; amount: string }[]
  priceDescription?: string
  lookupKey?: string
  tiers?: { id: number; firstUnit: string; lastUnit: string; perUnit: string; flatFee: string }[]
}

type StandardProductMiniEditorProps = {
  isOpen: boolean
  onClose: () => void
  onCreate?: (productData: Record<string, any>, prices: ProductMiniPrice[]) => void
  initialProductData?: Record<string, any>
  presentation?: "fullscreen" | "80-modal"
}

type PriceModalState = {
  mode: "create" | "edit"
  priceId?: string
  draft: ProductMiniPrice
} | null

const categoryOptions = [
  { value: "general-electronics", label: "General — Electronics" },
  { value: "software", label: "Software" },
  { value: "business-services", label: "Business services" },
  { value: "education", label: "Education" },
  { value: "donations", label: "Donations" },
  { value: "financial-services", label: "Financial services" },
  { value: "gambling", label: "Gambling and games of chance" },
  { value: "regulated-goods", label: "Regulated or age-restricted goods" },
]

const metadataDefaultRows = [
  { key: "", value: "" },
]

const standardSelectTriggerClass =
  "flex h-[30px] w-full items-center justify-between rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
const standardSelectOptionClass = "text-[14px] leading-[20px] tracking-[-0.15px]"

function StandardDropdownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="12" viewBox="0 0 9 12" fill="none" className="h-[12px] w-[8.6px] shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.226171 7.24258C0.534026 6.92566 1.0405 6.91831 1.35742 7.22617L4.30003 10.0846L7.24258 7.22622C7.55949 6.91836 8.06597 6.92571 8.37383 7.24263C8.68169 7.55954 8.67434 8.06602 8.35742 8.37388L4.85745 11.7738C4.70224 11.9246 4.50113 12 4.30003 12C4.09893 12 3.89783 11.9246 3.74261 11.7738L0.242579 8.37383C-0.0743389 8.06597 -0.081685 7.5595 0.226171 7.24258Z" fill="#474E5A" />
      <path fillRule="evenodd" clipRule="evenodd" d="M3.74261 0.22617C3.89783 0.0753911 4.09893 0 4.30003 0C4.50113 0 4.70224 0.0753906 4.85746 0.226175L8.35743 3.62613C8.67434 3.93398 8.68168 4.44046 8.37383 4.75738C8.06597 5.07429 7.55949 5.08163 7.24257 4.77378L4.30003 1.91532L1.35742 4.77378C1.0405 5.08164 0.534026 5.07429 0.226171 4.75737C-0.081685 4.44046 -0.0743389 3.93398 0.242579 3.62612L3.74261 0.22617Z" fill="#474E5A" />
    </svg>
  )
}

function useMiniFormTokens() {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })

  return { productFormStyle, tokens }
}

function docsLinkClassFor(style: string) {
  if (style === "refresh") return "font-[500] text-[#2C219E] hover:underline"
  if (style === "current") return "font-[500] text-[#533AFD] hover:underline"
  return "font-[600] text-[#533AFD] hover:underline"
}

function actionButtonClassFor(style: string) {
  if (style === "refresh") {
    return "-ml-[8px] w-fit rounded-full px-[8px] py-[4px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#2C219E] transition-colors hover:bg-[#F1F6FB]"
  }
  if (style === "current") {
    return "-ml-[8px] w-fit rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:bg-[#F0EDFF] hover:text-[#4730E0]"
  }
  return "-ml-[8px] w-fit rounded-[6px] px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] transition-colors hover:bg-[#F0EDFF] hover:text-[#4730E0]"
}

function modalTitleClassFor(style: string) {
  if (style === "refresh") return "text-[15px] font-[675] leading-[20px] tracking-[-0.15px] text-[#142234]"
  if (style === "sail") return "text-[15px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
  return "text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
}

function modalSecondaryButtonClassFor(style: string) {
  if (style === "refresh") {
    return "flex h-[32px] items-center justify-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#EAF0F6]"
  }
  if (style === "sail") {
    return "flex h-[28px] items-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]"
  }
  return "flex h-[26px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
}

function modalPrimaryButtonClassFor(style: string) {
  if (style === "refresh") {
    return "flex h-[32px] items-center justify-center gap-[6px] rounded-full bg-[#142234] px-[12px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-white transition-colors hover:bg-[#0F1A28]"
  }
  if (style === "sail") {
    return "flex h-[28px] items-center whitespace-nowrap rounded-[6px] bg-[#675DFF] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(20,19,78,0.32),0px_0px_0px_1px_#625AFA] transition-colors hover:bg-[#5B52F0]"
  }
  return "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
}

function selectOverridesFor(style: string) {
  if (style !== "sail") return {}
  return {
    buttonClassName: standardSelectTriggerClass,
    chevronIcon: <StandardDropdownIcon />,
    dropdownOptionClassName: standardSelectOptionClass,
  }
}

function createBlankPrice(id: string): ProductMiniPrice {
  return {
    id,
    priceType: "recurring",
    pricingCategory: "flat_rate",
    pricingModel: "standard",
    billingPeriod: "monthly",
    currency: "USD",
    taxBehavior: "auto",
    usageType: "licensed",
  }
}

function claimUniquePriceId(requestedId: string | undefined, usedIds: Set<string>) {
  if (requestedId && !usedIds.has(requestedId)) {
    usedIds.add(requestedId)
    return requestedId
  }

  let sequence = 1
  while (usedIds.has(`price-${sequence}`)) sequence += 1
  const id = `price-${sequence}`
  usedIds.add(id)
  return id
}

function nextPriceSequence(prices: ProductMiniPrice[]) {
  const usedIds = new Set(prices.map((price) => price.id))
  let sequence = 1
  while (usedIds.has(`price-${sequence}`)) sequence += 1
  return sequence
}

function pricesFromInitialData(data?: Record<string, any>): ProductMiniPrice[] {
  if (!data) return []
  if (Array.isArray(data._prices) && data._prices.length > 0) {
    const usedIds = new Set<string>()

    return data._prices.map((price: Record<string, any>, index: number) => {
      const id = claimUniquePriceId(price.id == null ? `price-${index + 1}` : String(price.id), usedIds)
      return {
        ...createBlankPrice(id),
        ...price,
        id,
      }
    })
  }

  return []
}

function createInitialProductData(initialProductData?: Record<string, any>) {
  return {
    name: initialProductData?.name ?? "",
    description: initialProductData?.description ?? "",
    imageUrl: initialProductData?.imageUrl ?? null,
    category: initialProductData?.category ?? "general-electronics",
    taxCode: initialProductData?.taxCode ?? "default",
    taxBehavior: initialProductData?.taxBehavior ?? "unspecified",
    _pricingType: initialProductData?._pricingType ?? "recurring",
    _inlineAmount: initialProductData?._inlineAmount ?? "",
    _inlineCurrency: initialProductData?._inlineCurrency ?? "USD",
    _inlineTaxBehavior: initialProductData?._inlineTaxBehavior ?? "auto",
    _inlineBillingPeriod: initialProductData?._inlineBillingPeriod ?? "monthly",
    labelName: initialProductData?.labelName ?? "",
    labelId: initialProductData?.labelId ?? "",
    labelLocale: initialProductData?.labelLocale ?? "Americas",
    metadataRows: initialProductData?.metadataRows ?? metadataDefaultRows,
    featureRows: initialProductData?.featureRows ?? metadataDefaultRows,
  }
}

function inlinePriceFromProductData(productData: Record<string, any>): ProductMiniPrice | null {
  const amount = typeof productData._inlineAmount === "string" ? productData._inlineAmount.trim() : ""
  if (!amount) return null

  return {
    ...createBlankPrice("price-inline"),
    amount,
    currency: productData._inlineCurrency ?? "USD",
    taxBehavior: productData._inlineTaxBehavior ?? "auto",
    billingPeriod: productData._inlineBillingPeriod ?? "monthly",
    priceType: productData._pricingType === "one_off" ? "one_time" : "recurring",
  }
}

function priceDraftFromProductData(id: string, productData: Record<string, any>): ProductMiniPrice {
  return {
    ...createBlankPrice(id),
    amount: typeof productData._inlineAmount === "string" ? productData._inlineAmount.trim() : "",
    currency: productData._inlineCurrency ?? "USD",
    taxBehavior: productData._inlineTaxBehavior ?? "auto",
    billingPeriod: productData._inlineBillingPeriod ?? "monthly",
    priceType: productData._pricingType === "one_off" ? "one_time" : "recurring",
  }
}

function useProductMiniData(initialProductData?: Record<string, any>) {
  const [productData, setProductData] = useState<Record<string, any>>(() => createInitialProductData(initialProductData))
  const [prices, setPrices] = useState<ProductMiniPrice[]>(() => pricesFromInitialData(initialProductData))

  return { productData, setProductData, prices, setPrices }
}

function priceLabel(price: ProductMiniPrice, index: number) {
  const presentation = getPriceDisplay(price)
  return `${presentation.title}, ${presentation.detail || `price ${index + 1}`}`
}

function DisclosureSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const { productFormStyle, tokens } = useMiniFormTokens()
  const isRefresh = productFormStyle === "refresh"
  const rowHeight = productFormStyle === "current" ? "h-[44px]" : isRefresh ? "h-[52px]" : "h-[60px]"
  const titleClass = productFormStyle === "current"
    ? "text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44]"
    : isRefresh
      ? tokens.sectionTitle
      : "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
  const borderClass = isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"
  const hoverClass = isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F7F9FB]"
  const chevronColor = isRefresh ? "#526378" : "#6C7688"

  return (
    <div className={`t-acc border-t ${borderClass}`} data-open={isOpen ? "true" : "false"}>
      <div className={`flex ${rowHeight} items-center p-[4px]`}>
        <button
          type="button"
          aria-label={`${title} section`}
          aria-expanded={isOpen}
          className={`t-acc-head flex h-full w-full items-center justify-between rounded-[8px] px-[20px] text-left ${titleClass} transition-colors ${hoverClass}`}
          onClick={onToggle}
        >
          <span>{title}</span>
          <span className="t-acc-chevron shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke={chevronColor} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
      <div className="t-acc-panel" aria-hidden={!isOpen}>
        <div className="t-acc-panel-inner min-h-0 flex flex-col gap-[12px] px-[24px] pb-[20px] pt-[8px]" inert={!isOpen}>
          {children}
        </div>
      </div>
    </div>
  )
}

function ProductField({ label, helper, children, focusField }: { label: ReactNode; helper?: string; children: ReactNode; focusField?: string }) {
  const { productFormStyle, tokens } = useMiniFormTokens()
  const gap = productFormStyle === "current" ? "gap-[4px]" : "gap-[6px]"
  const inlineHelper = productFormStyle === "refresh" && helper

  return (
    <div className={`flex flex-col ${gap}`} data-focus-field={focusField}>
      {inlineHelper ? (
        <div className="flex min-w-0 items-baseline gap-[6px]">
          <label className={`${tokens.labelClass} shrink-0`}>{label}</label>
          <p className={`${tokens.helperClass} min-w-0 truncate`}>{helper}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <label className={tokens.labelClass}>{label}</label>
          {helper && <p className={tokens.helperClass}>{helper}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

const uploadMotion = {
  settleDuration: 0.34,
  ease: [0.22, 1, 0.36, 1] as const,
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)
    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  return prefersReducedMotion
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function imageFileLabel(file: File | null) {
  const extension = file?.name.split(".").pop()
  if (extension && extension.length <= 4) return extension.toUpperCase()
  return "IMG"
}

function imageFileDetails(file: File) {
  const extension = imageFileLabel(file)
  const size = file.size >= 1_000_000
    ? `${(file.size / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(file.size / 1_000))} KB`

  return `${extension} · ${size}`
}

function DragFileIllustration({ label }: { label: string }) {
  return (
    <div className="relative h-[48px] w-[42px] drop-shadow-[0_9px_10px_rgba(55,47,128,0.18)]">
      <div className="absolute inset-[4px_1px_0_5px] rotate-[7deg] rounded-[6px] border border-[#DCD8FF] bg-[#EFEDFF]" />
      <svg className="absolute inset-0" viewBox="0 0 42 48" fill="none" aria-hidden="true">
        <path d="M7 1.25H27.5L40.75 14.5V41.5C40.75 44.4 38.4 46.75 35.5 46.75H7C4.1 46.75 1.75 44.4 1.75 41.5V6.5C1.75 3.6 4.1 1.25 7 1.25Z" fill="white" stroke="#C9C4FF" strokeWidth="1.5" />
        <path d="M27.5 1.5V11C27.5 13.07 29.18 14.75 31.25 14.75H40.5" fill="#EFEDFF" />
        <path d="M27.5 1.5V11C27.5 13.07 29.18 14.75 31.25 14.75H40.5" stroke="#C9C4FF" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="8" y="20" width="26.5" height="17" rx="3.5" fill="#F4F2FF" stroke="#D6D2FF" />
        <circle cx="14.25" cy="25.25" r="2.25" fill="#8D84FF" />
        <path d="M10.5 34L17.1 28.1C17.84 27.44 18.97 27.47 19.67 28.17L22.2 30.7L25.26 27.64C26 26.9 27.21 26.94 27.9 27.73L32.5 33" stroke="#675DFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute bottom-[6px] left-[9px] rounded-[3px] bg-[#675DFF] px-[3px] py-[1px] text-[6px] font-[700] leading-[7px] tracking-[0.05em] text-white">
        {label}
      </span>
    </div>
  )
}

function UploadDrop({
  imageUrl,
  onChange,
}: {
  imageUrl: string | null
  onChange: (next: string | null) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const reduceMotion = usePrefersReducedMotion()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null)
  const previewCloseRef = useRef<HTMLButtonElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const dragDepthRef = useRef(0)
  const dropTimeoutRef = useRef<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isDropSettling, setIsDropSettling] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; details: string } | null>(null)
  const [imageError, setImageError] = useState("")
  const [dragFileLabel, setDragFileLabel] = useState("IMG")
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0, rotate: -6 })
  const dropHeight = productFormStyle === "current" ? "min-h-[88px]" : "min-h-[104px]"
  const textClass = productFormStyle === "current"
    ? "text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#6C7688]"
    : productFormStyle === "refresh"
      ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#68778B]"
      : "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#818DA0]"
  const browseClass = productFormStyle === "current"
    ? "rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[2px] font-[600] text-[#273951] shadow-[0_1px_1px_rgba(20,34,52,0.04)]"
    : productFormStyle === "refresh"
      ? "rounded-full bg-[#F1F6FB] px-[10px] py-[2px] font-[500] text-[#142234]"
      : "rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[3px] font-[600] text-[#273951] shadow-[0_1px_1px_rgba(20,34,52,0.04)]"

  useEffect(() => () => {
    if (dropTimeoutRef.current !== null) window.clearTimeout(dropTimeoutRef.current)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  useEffect(() => {
    if (!isPreviewOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPreviewOpen(false)
      if (event.key === "Tab") {
        event.preventDefault()
        previewCloseRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.requestAnimationFrame(() => previewCloseRef.current?.focus())

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      previewTriggerRef.current?.focus()
    }
  }, [isPreviewOpen])

  const validateFile = (file: File | null) => {
    if (!file) return "Choose a JPEG, PNG, or WEBP image"
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Use a JPEG, PNG, or WEBP image"
    if (file.size > 2 * 1024 * 1024) return "Image must be 2 MB or smaller"
    return ""
  }

  const handleFile = (file: File | null) => {
    const error = validateFile(file)
    if (error || !file) {
      setImageError(error)
      return false
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const nextUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextUrl
    setUploadedFile({ name: file.name, details: imageFileDetails(file) })
    setImageError("")
    onChange(nextUrl)
    return true
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.item(0) ?? null)
    event.target.value = ""
  }

  const updateDragPosition = (event: DragEvent<HTMLDivElement>) => {
    const rect = dropRef.current?.getBoundingClientRect()
    if (!rect) return

    const rawX = event.clientX - rect.left - rect.width / 2
    const rawY = event.clientY - rect.top - rect.height / 2
    const maxX = Math.max(8, rect.width / 2 - 30)
    const maxY = Math.max(4, rect.height / 2 - 28)
    const cursorGap = 58
    const previewX = rawX + cursorGap <= maxX
      ? rawX + cursorGap
      : rawX - cursorGap

    setDragPosition({
      x: clamp(previewX, -maxX, maxX),
      y: clamp(rawY - 16, -maxY, maxY),
      rotate: clamp((rawX / (rect.width / 2)) * 10, -10, 10),
    })
    setDragFileLabel(imageFileLabel(event.dataTransfer.files?.item(0) ?? null))
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.item(0) ?? null
    dragDepthRef.current = 0

    const error = validateFile(file)
    if (error || !file) {
      setImageError(error)
      setIsDragActive(false)
      return
    }

    setDragFileLabel(imageFileLabel(file))
    setIsDropSettling(true)

    dropTimeoutRef.current = window.setTimeout(() => {
      handleFile(file)
      setIsDragActive(false)
      setIsDropSettling(false)
      dropTimeoutRef.current = null
    }, reduceMotion ? 0 : uploadMotion.settleDuration * 1000)
  }

  const removeImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setUploadedFile(null)
    setImageError("")
    setIsPreviewOpen(false)
    onChange(null)
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
      <div
        ref={dropRef}
        aria-busy={isDropSettling}
        className={`relative flex ${dropHeight} w-full items-center justify-center overflow-hidden rounded-[6px] border outline-none transition-[border-color,background-color,box-shadow] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isDragActive
            ? "border-[#675DFF] bg-[#F7F5FF] shadow-[inset_0_0_0_1px_rgba(103,93,255,0.06),0_6px_18px_rgba(103,93,255,0.10)]"
            : imageUrl
              ? "border-solid border-[#D8DEE4] bg-[#FAFBFC] p-[8px] hover:border-[#B6C0CD]"
              : "border-dashed border-[#D8DEE4] bg-white hover:border-[#B6C0CD] hover:bg-[#FAFBFC]"
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          if (isDropSettling) return
          dragDepthRef.current += 1
          updateDragPosition(event)
          setIsDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = "copy"
          if (isDropSettling) return
          updateDragPosition(event)
          setIsDragActive(true)
        }}
        onDragLeave={() => {
          if (isDropSettling) return
          dragDepthRef.current -= 1
          if (dragDepthRef.current <= 0) {
            dragDepthRef.current = 0
            setIsDragActive(false)
          }
        }}
        onDrop={onDrop}
      >
        <motion.span
          className="flex h-full w-full items-center justify-center"
          animate={{
            opacity: isDragActive ? 0.16 : 1,
            scale: isDragActive && !reduceMotion ? 0.97 : 1,
            filter: isDragActive && !reduceMotion ? "blur(1px)" : "blur(0px)",
          }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: uploadMotion.ease }}
        >
          {imageUrl ? (
            <motion.span
              key={imageUrl}
              className="group/image-card flex h-full w-full min-w-0 items-center gap-[12px]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.72, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: reduceMotion ? 0 : 0.42, ease: uploadMotion.ease }}
            >
              <button
                ref={previewTriggerRef}
                type="button"
                aria-label="View product image"
                className="group relative h-[72px] w-[88px] shrink-0 overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white p-[4px] outline-none transition-[border-color,box-shadow] hover:border-[#B6C0CD] focus-visible:border-[#675DFF] focus-visible:shadow-[0_0_0_3px_rgba(103,93,255,0.18)]"
                onClick={() => setIsPreviewOpen(true)}
              >
                <img src={imageUrl} alt="Uploaded product image" className="h-full w-full rounded-[3px] object-contain" />
                <span className="absolute inset-0 flex items-center justify-center bg-[rgba(20,34,52,0.58)] text-white opacity-0 transition-opacity duration-[150ms] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="7.75" cy="7.75" r="4.75" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11.3 11.3L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7.75 5.75V9.75M5.75 7.75H9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>

              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-[13px] font-[600] leading-[18px] tracking-[-0.08px] text-[#273951]" aria-live="polite">
                  Image uploaded
                </span>
                <span className="max-w-[220px] truncate text-[12px] font-[400] leading-[16px] text-[#6C7688]">
                  {uploadedFile?.name ?? "Click the preview to view full size"}
                </span>
                {uploadedFile && (
                  <span className="text-[11px] font-[400] leading-[15px] text-[#818DA0]">
                    {uploadedFile.details}
                  </span>
                )}
              </span>

              <span className="pointer-events-none ml-auto flex shrink-0 items-center gap-[4px] opacity-0 transition-opacity duration-[150ms] group-hover/image-card:pointer-events-auto group-hover/image-card:opacity-100 group-focus-within/image-card:pointer-events-auto group-focus-within/image-card:opacity-100 motion-reduce:transition-none">
                <button
                  type="button"
                  aria-label="Replace product image"
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#F0EDFF] focus-visible:bg-[#F0EDFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#675DFF]"
                  onClick={() => inputRef.current?.click()}
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none" className="h-[10.61px] w-[10.61px]">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.206568 7.25358C0.22268 7.0119 0.325969 6.78427 0.497246 6.61299L6.6709 0.43934C7.25669 -0.146446 8.20643 -0.146447 8.79222 0.43934L10.1709 1.81802C10.7567 2.40381 10.7567 3.35355 10.1709 3.93934L3.99725 10.113C3.82597 10.2843 3.59835 10.3876 3.35666 10.4037L0.266643 10.6097C0.115722 10.6197 -0.00949439 10.4945 0.000567011 10.3436L0.206568 7.25358ZM1.59227 9.01797L1.69075 7.54081L5.76188 3.46968L7.14056 4.84836L3.06943 8.91949L1.59227 9.01797ZM8.20122 3.7877L9.11024 2.87868L7.73156 1.5L6.82254 2.40902L8.20122 3.7877Z" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Remove product image"
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#FEF4F6] hover:text-[#C0123C] focus-visible:bg-[#FEF4F6] focus-visible:text-[#C0123C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0123C]"
                  onClick={removeImage}
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="h-[12px] w-[12px]">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="currentColor" />
                  </svg>
                </button>
              </span>
            </motion.span>
          ) : (
            <button
              type="button"
              aria-label="Upload product image"
              className={`flex h-full w-full items-center justify-center rounded-[5px] outline-none focus-visible:shadow-[inset_0_0_0_3px_rgba(103,93,255,0.18)] ${textClass}`}
              onClick={() => {
                if (!isDropSettling) inputRef.current?.click()
              }}
            >
              <span className="flex items-center gap-[8px]">
                <span>Drop to upload or</span>
                <span className={browseClass}>
                  Browse
                </span>
              </span>
            </button>
          )}
        </motion.span>

        <AnimatePresence>
          {isDragActive && (
            <motion.span
              key="drop-glow"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,93,255,0.16),rgba(103,93,255,0)_66%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: isDropSettling ? 1 : 0.72 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDragActive && (
            <motion.span
              key="drop-target"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[48px] w-[48px] -translate-x-1/2 -translate-y-1/2"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
              animate={isDropSettling
                ? { opacity: 0, scale: 0.72, filter: "blur(3px)" }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.82 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: uploadMotion.ease }}
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full border border-dashed border-[#9188FF] bg-white/80 shadow-[0_5px_18px_rgba(103,93,255,0.15),inset_0_0_0_5px_rgba(103,93,255,0.05)]" />
              <span className="absolute inset-[9px] flex items-center justify-center rounded-full bg-[#E9E6FF] text-[#5A50E6] shadow-[inset_0_0_0_1px_rgba(103,93,255,0.14)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2.25V9.25M4.25 6.75L7 9.5L9.75 6.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 11.5H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="absolute left-1/2 top-[52px] -translate-x-1/2 whitespace-nowrap text-[10px] font-[600] leading-[12px] tracking-[-0.02em] text-[#5A50E6]">
                Release to upload
              </span>
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDragActive && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
              <motion.span
                className="block"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.72, y: dragPosition.y + 8, rotate: -10 }}
                animate={isDropSettling
                  ? { opacity: 0, scale: 0.46, x: 0, y: 0, rotate: 0, filter: "blur(5px)" }
                  : { opacity: 1, scale: 1, x: dragPosition.x, y: dragPosition.y, rotate: dragPosition.rotate, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={isDropSettling
                  ? { duration: reduceMotion ? 0 : uploadMotion.settleDuration, ease: uploadMotion.ease }
                  : reduceMotion
                    ? { duration: 0 }
                    : {
                        x: { type: "spring", stiffness: 430, damping: 32, mass: 0.52 },
                        y: { type: "spring", stiffness: 430, damping: 32, mass: 0.52 },
                        rotate: { type: "spring", stiffness: 360, damping: 28, mass: 0.55 },
                        opacity: { duration: 0.16 },
                        scale: { duration: 0.22, ease: uploadMotion.ease },
                      }}
              >
                <DragFileIllustration label={dragFileLabel} />
              </motion.span>
            </span>
          )}
        </AnimatePresence>
      </div>

      {imageError && <p role="alert" className="mt-[4px] text-[11px] leading-[16px] text-[#DF1B41]">{imageError}</p>}

      <AnimatePresence>
        {isPreviewOpen && imageUrl && (
          <motion.div
            key="product-image-preview"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,26,36,0.64)] p-[24px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: uploadMotion.ease }}
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Product image preview"
              className="relative flex max-h-[min(760px,calc(100vh-48px))] max-w-[min(880px,calc(100vw-48px))] flex-col overflow-hidden rounded-[12px] border border-[#D8DEE4] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: uploadMotion.ease }}
              onClick={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
            >
              <div className="flex h-[48px] shrink-0 items-center justify-between border-b border-[#ECF1F6] px-[16px]">
                <div className="min-w-0">
                  <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]">Product image</p>
                  {uploadedFile && <p className="max-w-[520px] truncate text-[11px] leading-[14px] text-[#818DA0]">{uploadedFile.name}</p>}
                </div>
                <button
                  ref={previewCloseRef}
                  type="button"
                  aria-label="Close image preview"
                  className="-mr-[6px] flex h-[30px] w-[30px] items-center justify-center rounded-[6px] text-[#596171] outline-none transition-colors hover:bg-[#F1F3F5] focus-visible:shadow-[0_0_0_3px_rgba(103,93,255,0.18)]"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex min-h-0 items-center justify-center bg-[#F5F6F8] p-[24px]">
                <img src={imageUrl} alt="Product image" className="max-h-[min(640px,calc(100vh-144px))] max-w-[min(800px,calc(100vw-96px))] rounded-[6px] object-contain shadow-[0_1px_3px_rgba(15,23,42,0.10)]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function PriceTypeToggle({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={["recurring", "one_off"] as const}
      getDisplayValue={(option) => option === "recurring" ? "Recurring" : "One-off"}
      variantOverride="toggle"
    />
  )
}

function ManagedPaymentsRow({ category }: { category: string }) {
  const { productFormStyle } = useProductFormStyle()
  const eligible = !["donations", "financial-services", "gambling", "regulated-goods"].includes(category)
  const rowClass = productFormStyle === "current"
    ? "text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#273951]"
    : productFormStyle === "refresh"
      ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234]"
      : "text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#273951]"
  const badgeClass = eligible
    ? productFormStyle === "refresh"
      ? "rounded-full bg-[#E5FFD8] px-[7px] py-[1px] text-[12px] leading-[16px] text-[#197A16]"
      : "rounded-[5px] border border-[#A4E38B] bg-[#E5FFD8] px-[6px] py-[1px] text-[#197A16]"
    : productFormStyle === "refresh"
      ? "rounded-full bg-[#F1F3F5] px-[7px] py-[1px] text-[12px] leading-[16px] text-[#596171]"
      : "rounded-[5px] border border-[#D8DEE4] bg-[#F5F6F8] px-[6px] py-[1px] text-[#596171]"

  return (
    <div className={`flex items-center gap-[8px] ${rowClass}`}>
      <span>Managed payments</span>
      <span className={badgeClass}>
        {eligible ? "Eligible" : "Not eligible"}
      </span>
    </div>
  )
}

function StandardSelectField({
  label,
  value,
  onChange,
  options,
  focusField,
}: {
  label: ReactNode
  value: string
  onChange: (next: string) => void
  options: { value: string; label: string; prefix?: string }[]
  focusField?: string
}) {
  const { productFormStyle } = useProductFormStyle()
  const overrides = selectOverridesFor(productFormStyle)

  return (
    <ProductField label={label} focusField={focusField}>
      <CustomSelect
        label=""
        value={value}
        onChange={onChange}
        options={options}
        {...overrides}
      />
    </ProductField>
  )
}

function AdditionalPrices({
  prices,
  onEditPrice,
  onDeletePrice,
}: {
  prices: ProductMiniPrice[]
  onEditPrice: (price: ProductMiniPrice) => void
  onDeletePrice: (id: string) => void
}) {
  if (prices.length === 0) return null

  return (
    <div className="flex flex-col gap-[8px] pt-[4px]">
      {prices.map((price, index) => {
        const presentation = getPriceDisplay(price)
        return (
        <div key={price.id} className="group relative rounded-[8px] border border-[#D8DEE4] bg-white px-[12px] py-[10px] pr-[76px]">
          <p className="truncate text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44]">
            {presentation.title}
          </p>
          <div className="pointer-events-none absolute right-[12px] top-1/2 flex -translate-y-1/2 items-center gap-[4px] opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
            <button
              type="button"
              aria-label={`Edit ${priceLabel(price, index)}`}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#F0EDFF] focus-visible:bg-[#F0EDFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#675DFF]"
              onClick={() => onEditPrice(price)}
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none" className="h-[10.61px] w-[10.61px]">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.206568 7.25358C0.22268 7.0119 0.325969 6.78427 0.497246 6.61299L6.6709 0.43934C7.25669 -0.146446 8.20643 -0.146447 8.79222 0.43934L10.1709 1.81802C10.7567 2.40381 10.7567 3.35355 10.1709 3.93934L3.99725 10.113C3.82597 10.2843 3.59835 10.3876 3.35666 10.4037L0.266643 10.6097C0.115722 10.6197 -0.00949439 10.4945 0.000567011 10.3436L0.206568 7.25358ZM1.59227 9.01797L1.69075 7.54081L5.76188 3.46968L7.14056 4.84836L3.06943 8.91949L1.59227 9.01797ZM8.20122 3.7877L9.11024 2.87868L7.73156 1.5L6.82254 2.40902L8.20122 3.7877Z" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={`Delete ${priceLabel(price, index)}`}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#FEF4F6] hover:text-[#C0123C] focus-visible:bg-[#FEF4F6] focus-visible:text-[#C0123C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0123C]"
              onClick={() => onDeletePrice(price.id)}
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="h-[12px] w-[12px]">
                <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p className="mt-[4px] truncate text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#596171]">
            {presentation.detail}
          </p>
        </div>
        )
      })}
    </div>
  )
}

function ProductDetailsForm({
  productData,
  prices,
  onChange,
  onEditPrice,
  onDeletePrice,
  onAddPrice,
  onMorePricingOptions,
  onFocusField,
  errorFields,
}: {
  productData: Record<string, any>
  prices: ProductMiniPrice[]
  onChange: (patch: Record<string, any>) => void
  onEditPrice: (price: ProductMiniPrice) => void
  onDeletePrice: (id: string) => void
  onAddPrice: () => void
  onMorePricingOptions: () => void
  onFocusField: (field: string) => void
  errorFields?: Set<string>
}) {
  const { productFormStyle, tokens } = useMiniFormTokens()
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const pricingType = productData._pricingType ?? "recurring"
  const formGap = productFormStyle === "current" ? "gap-[16px]" : productFormStyle === "refresh" ? "gap-[16px]" : "gap-[24px]"
  const panelPadding = productFormStyle === "current" ? "px-[20px] pb-[20px] pt-[20px]" : "px-[24px] pb-[24px] pt-[24px]"
  const descriptionMinHeight = productFormStyle === "current" ? "!min-h-[100px]" : productFormStyle === "refresh" ? "!min-h-[120px]" : "!min-h-[140px]"
  const docsLinkClass = docsLinkClassFor(productFormStyle)
  const actionClass = actionButtonClassFor(productFormStyle)
  const amountSymbolClass = productFormStyle === "refresh"
    ? "text-[13px] text-[#3F5064]"
    : productFormStyle === "sail"
      ? "text-[14px] text-[#596171]"
      : "text-[12px] text-[#6C7688]"
  const metadataRows = Array.isArray(productData.metadataRows) ? productData.metadataRows : metadataDefaultRows
  const featureRows = Array.isArray(productData.featureRows) ? productData.featureRows : metadataDefaultRows

  return (
    <div
      className="flex flex-col"
      onFocusCapture={(event) => {
        const field = (event.target as HTMLElement).closest<HTMLElement>("[data-focus-field]")?.dataset.focusField
        if (field) onFocusField(field)
      }}
    >
      <div className={`flex flex-col ${formGap} ${panelPadding}`}>
        <ProductField label="Name" focusField="name">
          <input
            className={errorFields?.has("name") ? tokens.errorInputClass : tokens.inputClass}
            placeholder="API access"
            value={productData.name ?? ""}
            onChange={(event) => onChange({ name: event.target.value })}
          />
          {errorFields?.has("name") && <p className="text-[11px] text-[#DF1B41]">Enter a product name</p>}
        </ProductField>

        <ProductField label="Description" focusField="description">
          <textarea
            className={`${tokens.textareaClass} ${descriptionMinHeight} resize-none`}
            placeholder="Describe the product or service"
            value={productData.description ?? ""}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </ProductField>

        <ProductField label="Product image" focusField="imageUrl">
          <UploadDrop
            imageUrl={productData.imageUrl ?? null}
            onChange={(imageUrl) => onChange({ imageUrl })}
          />
        </ProductField>

        <div className="flex flex-col gap-[8px]">
          <StandardSelectField
            label={<>Category <span className="font-[400] text-[#6C7688]">·</span> <a className={docsLinkClass} href="https://docs.stripe.com/tax/tax-categories" target="_blank" rel="noreferrer">Docs</a></>}
            value={productData.category ?? "general-electronics"}
            onChange={(category) => onChange({ category })}
            options={categoryOptions}
            focusField="category"
          />
          <ManagedPaymentsRow category={productData.category ?? "general-electronics"} />
        </div>

        {prices.length === 0 ? (
          <div className="flex flex-col gap-[16px]">
            <ProductField label="Price type" focusField="_pricingType">
              <PriceTypeToggle
                value={pricingType}
                onChange={(next) => onChange({ _pricingType: next })}
              />
            </ProductField>

            <ProductField label="Amount" focusField="_inlineAmount">
              <div className="flex items-center gap-[8px]">
                <div className="relative min-w-0 flex-1">
                  <span className={`pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 ${amountSymbolClass}`}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`${errorFields?.has("amount") ? tokens.errorInputClass : tokens.inputClass} !pl-[22px]`}
                    placeholder="0.00"
                    value={productData._inlineAmount ?? ""}
                    onChange={(event) => onChange({ _inlineAmount: event.target.value })}
                  />
                </div>
                <div className="w-[144px] shrink-0" data-focus-field="_inlineCurrency">
                  <CustomSelect
                    label=""
                    value={productData._inlineCurrency ?? "USD"}
                    onChange={(currency) => onChange({ _inlineCurrency: currency })}
                    options={CURRENCY_OPTIONS}
                    {...selectOverridesFor(productFormStyle)}
                  />
                </div>
              </div>
              {errorFields?.has("amount") && <p className="text-[11px] text-[#DF1B41]">Enter a valid amount</p>}
            </ProductField>

            {pricingType === "recurring" && (
              <StandardSelectField
                label="Billing period"
                value={productData._inlineBillingPeriod ?? "monthly"}
                onChange={(billingPeriod) => onChange({ _inlineBillingPeriod: billingPeriod })}
                focusField="_inlineBillingPeriod"
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                  { value: "weekly", label: "Weekly" },
                  { value: "daily", label: "Daily" },
                ]}
              />
            )}

            <button
              type="button"
              aria-label="More pricing options"
              className={`${actionClass} mt-[-4px]`}
              onClick={onMorePricingOptions}
            >
              More pricing options →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            <AdditionalPrices
              prices={prices}
              onEditPrice={onEditPrice}
              onDeletePrice={onDeletePrice}
            />
            <button
              type="button"
              aria-label="Add another price"
              className={actionClass}
              onClick={onAddPrice}
            >
              Add another price
            </button>
          </div>
        )}
      </div>

      <DisclosureSection title="Labels" isOpen={labelsOpen} onToggle={() => setLabelsOpen((open) => !open)}>
        <ProductField label="Name" helper="This will appear on customers' receipts and invoices.">
          <input
            className={tokens.inputClass}
            placeholder="Everything must go"
            value={productData.labelName ?? ""}
            onChange={(event) => onChange({ labelName: event.target.value })}
          />
        </ProductField>
        <ProductField label="ID" helper="This will appear on customers' receipts and invoices.">
          <input
            className={tokens.inputClass}
            placeholder="prod_api_access"
            value={productData.labelId ?? ""}
            onChange={(event) => onChange({ labelId: event.target.value })}
          />
        </ProductField>
        <CustomSelect
          label="Locale"
          value={productData.labelLocale ?? "Americas"}
          onChange={(labelLocale) => onChange({ labelLocale })}
          options={[
            { value: "Americas", label: "Americas" },
            { value: "Europe", label: "Europe" },
            { value: "Asia Pacific", label: "Asia Pacific" },
          ]}
        />
      </DisclosureSection>

      <DisclosureSection title="Meta data and features" isOpen={metadataOpen} onToggle={() => setMetadataOpen((open) => !open)}>
        {metadataRows.map((row: { key: string; value: string }, index: number) => (
          <div key={`metadata-${index}`} className="grid grid-cols-2 gap-[8px]">
            <ProductField label={index === 0 ? "Key" : ""}>
              <input className={tokens.inputClass} placeholder="Key" value={row.key ?? ""} onChange={(event) => onChange({ metadataRows: metadataRows.map((item: { key: string; value: string }, rowIndex: number) => rowIndex === index ? { ...item, key: event.target.value } : item) })} />
            </ProductField>
            <ProductField label={index === 0 ? "Value" : ""}>
              <input className={tokens.inputClass} placeholder="Value" value={row.value ?? ""} onChange={(event) => onChange({ metadataRows: metadataRows.map((item: { key: string; value: string }, rowIndex: number) => rowIndex === index ? { ...item, value: event.target.value } : item) })} />
            </ProductField>
          </div>
        ))}
        <button
          type="button"
          className={actionClass}
          onClick={() => onChange({ metadataRows: [...metadataRows, { key: "", value: "" }] })}
        >
          Add meta data
        </button>
        {featureRows.map((row: { key: string; value: string }, index: number) => (
          <div key={`feature-${index}`} className="grid grid-cols-2 gap-[8px]">
            <ProductField label={index === 0 ? "Feature title" : ""}>
              <input className={tokens.inputClass} placeholder="Feature title" value={row.key ?? ""} onChange={(event) => onChange({ featureRows: featureRows.map((item: { key: string; value: string }, rowIndex: number) => rowIndex === index ? { ...item, key: event.target.value } : item) })} />
            </ProductField>
            <ProductField label={index === 0 ? "Description" : ""}>
              <input className={tokens.inputClass} placeholder="Feature description" value={row.value ?? ""} onChange={(event) => onChange({ featureRows: featureRows.map((item: { key: string; value: string }, rowIndex: number) => rowIndex === index ? { ...item, value: event.target.value } : item) })} />
            </ProductField>
          </div>
        ))}
        <button
          type="button"
          className={actionClass}
          onClick={() => onChange({ featureRows: [...featureRows, { key: "", value: "" }] })}
        >
          Add feature
        </button>
      </DisclosureSection>
    </div>
  )
}

function PriceEditorModal({
  state,
  onChange,
  onCancel,
  onSave,
  errorFields,
  meterOptions,
  onAddMeter,
  onEditMeter,
}: {
  state: NonNullable<PriceModalState>
  onChange: (patch: Record<string, any>) => void
  onCancel: () => void
  onSave: () => void
  errorFields: Set<string>
  meterOptions: { id: string; name: string; detail?: string }[]
  onAddMeter: () => void
  onEditMeter: (meterId: string) => void
}) {
  const { productFormStyle } = useMiniFormTokens()
  const titleClass = modalTitleClassFor(productFormStyle)
  const secondaryButtonClass = modalSecondaryButtonClassFor(productFormStyle)
  const primaryButtonClass = modalPrimaryButtonClassFor(productFormStyle)

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 px-[24px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onCancel}
    >
      <motion.div
        className="flex max-h-[min(720px,calc(100vh-80px))] w-full max-w-[420px] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.16),0px_4px_16px_rgba(0,0,0,0.08)]"
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        onClick={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
          <p className={titleClass}>{state.mode === "create" ? "Add price" : "Edit price"}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[16px]">
          <PriceForm
            data={state.draft}
            onChange={onChange}
            errorFields={errorFields}
            meterOptions={meterOptions}
            onAddObject={(kind) => { if (kind === "meter") onAddMeter() }}
            onEditMeter={onEditMeter}
          />
        </div>
        <div className="flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]">
          <button type="button" className={secondaryButtonClass} onClick={onCancel}>
            Discard
          </button>
          <button type="button" className={primaryButtonClass} onClick={onSave}>
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ProductPreviewPane({
  data,
  prices,
  reduceMotion,
}: {
  data: Record<string, any>
  prices: ProductMiniPrice[]
  reduceMotion: boolean
}) {
  const previewData = prices.length > 0
    ? {
        ...data,
        _pricingType: undefined,
        _inlineAmount: undefined,
        _inlineCurrency: undefined,
        _inlineTaxBehavior: undefined,
        _inlineBillingPeriod: undefined,
        _prices: prices,
      }
    : { ...data, _prices: prices }

  return (
    <motion.div
      key="product-preview-pane"
      className="flex min-w-0 flex-1 items-center justify-center rounded-br-[12px]"
      initial={reduceMotion ? false : { opacity: 0, x: 12, filter: "blur(2px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8, filter: "blur(2px)" }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: "#FAFBFC",
      }}
    >
      <ProductPreviewPanel data={previewData} />
    </motion.div>
  )
}

export function StandardProductMiniEditor({
  isOpen,
  onClose,
  onCreate,
  initialProductData,
  presentation = "fullscreen",
}: StandardProductMiniEditorProps) {
  const { productFormStyle } = useProductFormStyle()
  const titleClass = modalTitleClassFor(productFormStyle)
  const secondaryButtonClass = modalSecondaryButtonClassFor(productFormStyle)
  const primaryButtonClass = modalPrimaryButtonClassFor(productFormStyle)
  const { productData, setProductData, prices, setPrices } = useProductMiniData(initialProductData)
  const [priceModal, setPriceModal] = useState<PriceModalState>(null)
  const [priceErrors, setPriceErrors] = useState<Set<string>>(new Set())
  const [productErrors, setProductErrors] = useState<Set<string>>(new Set())
  const [submitError, setSubmitError] = useState("")
  const [meterRecords, setMeterRecords] = useState<Record<string, Record<string, any>>>(() => Object.fromEntries(
    EXISTING_METERS.map((meter) => [meter.id, { id: meter.id, name: meter.name, displayName: meter.name, aggregation: meter.detail?.toLowerCase() ?? "sum" }]),
  ))
  const [meterEditor, setMeterEditor] = useState<{ meterId?: string } | null>(null)
  const [isFullProductEditorOpen, setIsFullProductEditorOpen] = useState(false)
  const previewOpen = prices.length > 0
  const reduceMotion = usePrefersReducedMotion()
  const nextIdRef = useRef(nextPriceSequence(prices))
  const wasOpenRef = useRef(false)
  const lastFocusedFieldRef = useRef<string | null>(null)

  const openCreatePriceModal = useCallback(() => {
    const usedIds = new Set(prices.map((price) => price.id))
    while (usedIds.has(`price-${nextIdRef.current}`)) nextIdRef.current += 1
    const id = `price-${nextIdRef.current++}`
    setPriceErrors(new Set())
    setPriceModal({ mode: "create", draft: priceDraftFromProductData(id, productData) })
  }, [prices, productData])

  const openEditPriceModal = useCallback((price: ProductMiniPrice) => {
    setPriceErrors(new Set())
    setPriceModal({ mode: "edit", priceId: price.id, draft: { ...price } })
  }, [])

  const deletePrice = useCallback((id: string) => {
    setPrices((current) => current.filter((price) => price.id !== id))
    setPriceModal((current) => current?.priceId === id ? null : current)
  }, [setPrices])

  const updateProductData = useCallback((patch: Record<string, any>) => {
    setProductData((current) => ({ ...current, ...patch }))
    setProductErrors(new Set())
    setSubmitError("")
  }, [setProductData])

  const updatePriceDraft = useCallback((patch: Record<string, any>) => {
    setPriceModal((current) => current ? { ...current, draft: { ...current.draft, ...patch } } : current)
    setPriceErrors(new Set())
    setSubmitError("")
  }, [])

  const savePriceModal = useCallback(() => {
    if (!priceModal) return
    const validation = validatePriceData(priceModal.draft)
    if (validation.size > 0) {
      setPriceErrors(validation)
      return
    }
    if (priceModal.mode === "create") {
      setPrices((current) => {
        const id = claimUniquePriceId(priceModal.draft.id, new Set(current.map((price) => price.id)))
        return [...current, { ...priceModal.draft, id }]
      })
    } else if (priceModal.priceId) {
      setPrices((current) => current.map((price) => price.id === priceModal.priceId ? { ...priceModal.draft, id: priceModal.priceId } : price))
    }
    setPriceErrors(new Set())
    setPriceModal(null)
  }, [priceModal, setPrices])

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const nextPrices = pricesFromInitialData(initialProductData)
      setProductData(createInitialProductData(initialProductData))
      setPrices(nextPrices)
      setPriceModal(null)
      setPriceErrors(new Set())
      setProductErrors(new Set())
      setSubmitError("")
      setMeterEditor(null)
      setIsFullProductEditorOpen(false)
      lastFocusedFieldRef.current = null
      nextIdRef.current = nextPriceSequence(nextPrices)
    }
    wasOpenRef.current = isOpen
  }, [initialProductData, isOpen, setPrices, setProductData])

  if (!isOpen) return null

  const title = productData.name?.trim() ? productData.name : "New product"
  const inlinePrice = inlinePriceFromProductData(productData)
  const pricesForCreate = prices.length > 0 ? prices : inlinePrice ? [inlinePrice] : []
  const advancedInitialProductData = prices.length > 0
    ? { ...productData, _prices: prices }
    : productData
  const meterOptions = Object.values(meterRecords).map((meter) => ({
    id: String(meter.id),
    name: String(meter.displayName || meter.name),
    detail: String(meter.aggregation || "sum").replace(/^./, (letter) => letter.toUpperCase()),
  }))

  const createProduct = () => {
    const nextProductErrors = new Set<string>()
    if (!String(productData.name ?? "").trim()) nextProductErrors.add("name")

    if (prices.length === 0) {
      if (!inlinePrice) {
        nextProductErrors.add("amount")
      } else {
        validatePriceData(inlinePrice).forEach((field) => nextProductErrors.add(field))
      }
    } else {
      const invalidPrice = prices.find((price) => validatePriceData(price).size > 0)
      if (invalidPrice) {
        setPriceErrors(validatePriceData(invalidPrice))
        setPriceModal({ mode: "edit", priceId: invalidPrice.id, draft: { ...invalidPrice } })
        setSubmitError("Complete the highlighted price fields")
        setProductErrors(nextProductErrors)
        return
      }
    }

    if (nextProductErrors.size > 0) {
      setProductErrors(nextProductErrors)
      setSubmitError(nextProductErrors.has("name") ? "Enter a product name" : "Complete the highlighted price fields")
      return
    }

    setProductErrors(new Set())
    setSubmitError("")
    if (onCreate) onCreate(productData, pricesForCreate)
    else onClose()
  }

  const editorContent = (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[12px]">
        <p className={titleClass}>{title}</p>
        <div className="flex items-center gap-[8px]">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Discard
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={createProduct}
          >
            Create product
          </button>
        </div>
      </div>

      {submitError && <div role="alert" className="border-b border-[#F8C6D0] bg-[#FFF5F7] px-[20px] py-[8px] text-[12px] font-[500] text-[#C0123C]">{submitError}</div>}

      <div className="flex min-h-0 flex-1 bg-white">
        <motion.div
          layout
          className={previewOpen
            ? "w-[42%] min-w-[340px] max-w-[451px] shrink-0 overflow-y-auto border-r border-[#EBEEF1] bg-white"
            : "h-full w-full overflow-y-auto bg-white"}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductDetailsForm
            productData={productData}
            prices={prices}
            onChange={updateProductData}
            onEditPrice={openEditPriceModal}
            onDeletePrice={deletePrice}
            onAddPrice={openCreatePriceModal}
            onMorePricingOptions={() => setIsFullProductEditorOpen(true)}
            onFocusField={(field) => { lastFocusedFieldRef.current = field }}
            errorFields={productErrors}
          />
        </motion.div>

        <AnimatePresence initial={false}>
          {previewOpen && <ProductPreviewPane data={productData} prices={prices} reduceMotion={reduceMotion} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {priceModal && (
          <PriceEditorModal
            key="price-editor-modal"
            state={priceModal}
            onChange={updatePriceDraft}
            onCancel={() => { setPriceModal(null); setPriceErrors(new Set()) }}
            onSave={savePriceModal}
            errorFields={priceErrors}
            meterOptions={meterOptions}
            onAddMeter={() => setMeterEditor({})}
            onEditMeter={(meterId) => setMeterEditor({ meterId })}
          />
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {presentation === "80-modal" ? (
        <motion.div
          key="standard-product-mini-modal"
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="relative flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            style={{ width: "94vw", height: "80vh" }}
            initial={{ scale: 0.95, opacity: 0, maxWidth: previewOpen ? 1510 : 560 }}
            animate={{ scale: 1, opacity: 1, maxWidth: previewOpen ? 1510 : 560 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            {editorContent}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="standard-product-mini-fullscreen"
          className="fixed inset-0 z-[60] flex flex-col bg-white"
          initial={{ opacity: 0, scale: 0.92, borderRadius: "12px" }}
          animate={{ opacity: 1, scale: 1, borderRadius: "0px" }}
          exit={{ opacity: 0, scale: 0.92, borderRadius: "12px" }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          style={{ transformOrigin: "center center" }}
        >
          {editorContent}
        </motion.div>
        )}
      </AnimatePresence>

      <MeterEditorModal
        isOpen={Boolean(meterEditor)}
        initialData={meterEditor?.meterId ? meterRecords[meterEditor.meterId] : undefined}
        onClose={() => setMeterEditor(null)}
        onSave={(draft) => {
          if (!meterEditor) return
          const meterId = meterEditor.meterId ?? `meter-${Date.now()}`
          const meterName = String(draft.displayName || draft.name)
          const meter = { ...meterRecords[meterId], ...draft, id: meterId, displayName: meterName }
          setMeterRecords((current) => ({ ...current, [meterId]: meter }))
          setPriceModal((current) => current ? {
            ...current,
            draft: { ...current.draft, meterId, meterName },
          } : current)
          setPrices((current) => current.map((price) => price.meterId === meterId ? { ...price, meterName } : price))
          setPriceErrors(new Set())
          setMeterEditor(null)
        }}
      />

      <FullProductEditor
        isOpen={isFullProductEditorOpen}
        initialProductData={advancedInitialProductData}
        initialFocusField={lastFocusedFieldRef.current ?? undefined}
        onClose={() => setIsFullProductEditorOpen(false)}
        onCreate={(createdProductData, createdItems) => {
          const createdPrices = createdItems
            .filter((item) => item.kind === "price")
            .map(({ kind: _kind, ...price }) => price as ProductMiniPrice)

          if (onCreate) {
            onCreate(createdProductData, createdPrices)
          } else {
            setProductData(createdProductData)
            setPrices(createdPrices)
            setIsFullProductEditorOpen(false)
          }
        }}
      />
    </>
  )
}
