import type { ProductFormStyle } from "@/components/creation-workspace/productFormStyle"

// ── Current (Compact) tokens ────────────────────────────────────────

export const labelClass = "text-[12px] font-[400] leading-[16px] text-[#273951]"

export const inputClass =
  "h-[30px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-3 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all"

export const textareaClass =
  "min-h-[80px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white px-3 py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all"

export const selectClass =
  "h-[30px] w-full appearance-none rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] pr-[28px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all"

const errorInputCurrent =
  "h-[30px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-3 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none focus:border-[#DF1B41] focus:shadow-[0_0_0_1.5px_rgba(223,27,65,0.2)] transition-all"

const helperCurrent = "text-[12px] font-[400] leading-[16px] text-[#596171]"

// ── Sail (Standard) tokens ──────────────────────────────────────────

const sailLabel = "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]"

const sailInput =
  "h-[30px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"

const sailTextarea =
  "min-h-[88px] w-full resize-y rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[4px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"

const sailSelect =
  "h-[30px] w-full appearance-none rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] pr-[28px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"

const errorInputSail =
  "h-[30px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none focus:border-[#DF1B41] focus:shadow-[0_0_0_4px_rgba(223,27,65,0.16)] transition-all"

const helperSail = "text-[13px] font-[400] leading-[18px] tracking-[-0.08px] text-[#596171]"

// ── Refresh tokens ──────────────────────────────────────────────────
// Source of truth: Figma "Checkout Editor Prototype" node 196:356.
// Palette: NewSlate/1000 #142234 (primary text), NewSlate/600 #526378 (secondary/helper),
// NewSlate/100 #d5dee7 (input border), NewSlate/50 #eaf0f6 (dividers/off-track),
// NewSlate/33 #f1f6fb (object fill), NewBlurple/800 #2c219e (accent).

const refreshLabel = "text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234]"

const refreshInputWhite =
  "h-[32px] w-full rounded-[6px] border border-[#D5DEE7] bg-white px-[10px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"

const refreshInputFilled =
  "h-[32px] w-full rounded-[6px] border border-transparent bg-[#EAF0F6] px-[10px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"

const refreshTextareaWhite =
  "min-h-[80px] w-full resize-none rounded-[6px] border border-[#D5DEE7] bg-white px-[10px] py-[8px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"

const refreshTextareaFilled =
  "min-h-[80px] w-full resize-none rounded-[6px] border border-transparent bg-[#EAF0F6] px-[10px] py-[8px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"

const refreshSelectWhite =
  "h-[32px] w-full appearance-none rounded-[6px] border border-[#D5DEE7] bg-white px-[10px] pr-[28px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"

const refreshSelectFilled =
  "h-[32px] w-full appearance-none rounded-[6px] border border-transparent bg-[#EAF0F6] px-[10px] pr-[28px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"

const errorInputRefresh =
  "h-[32px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-[10px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B] outline-none focus:border-[#DF1B41] focus:shadow-[0_0_0_1.5px_rgba(223,27,65,0.2)] transition-all"

const helperRefresh = "text-[11px] font-[400] leading-[16px] tracking-[-0.055px] text-[#526378]"

// ── Modal chrome (shared across the modal shells; keyed off form style) ──

const currentPrimaryButton =
  "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
const currentSecondaryButton =
  "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
const currentModalTitle = "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
const currentCloseButton =
  "flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-[#6C7688] transition-colors hover:bg-[#F5F6F8]"

const refreshPrimaryButton =
  "flex h-[32px] items-center justify-center gap-[6px] rounded-full bg-[#142234] px-[12px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-white transition-colors hover:bg-[#0F1A28]"
const refreshSecondaryButton =
  "flex h-[32px] items-center justify-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#EAF0F6]"
const refreshModalTitle = "text-[20px] font-[600] leading-[24px] tracking-[-0.2px] text-[#142234]"
const refreshCloseButton =
  "flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#F1F6FB] text-[#526378] transition-colors hover:bg-[#EAF0F6]"

// ── Token provider ──────────────────────────────────────────────────

export function getFormTokens(style: ProductFormStyle, options?: { filled?: boolean }) {
  if (style === "sail") {
    return {
      labelClass: sailLabel,
      inputClass: sailInput,
      textareaClass: sailTextarea,
      selectClass: sailSelect,
      errorInputClass: errorInputSail,
      helperClass: helperSail,
      toggleRow: "flex items-center justify-between text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]",
      checkboxText: "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]",
      sectionTitle: "text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-[#1A2C44]",
      primaryButtonClass: currentPrimaryButton,
      secondaryButtonClass: currentSecondaryButton,
      modalTitleClass: currentModalTitle,
      closeButtonClass: currentCloseButton,
      toggle: {
        trackClass: "h-[20px] w-[38px]",
        knobClass: "top-0 h-[18px] w-[18px] border",
        onClass: "border-[#533AFD] bg-[#675DFF]",
        offClass: "border-[#D4DEE9] bg-[#ECF1F6]",
        knobOnPos: "left-[18px]",
        knobOffPos: "left-0",
        knobOnBorder: "border-[#533AFD]",
        knobOffBorder: "border-[#D4DEE9]",
      },
    }
  }
  if (style === "refresh") {
    const filled = options?.filled ?? false
    return {
      labelClass: refreshLabel,
      inputClass: filled ? refreshInputFilled : refreshInputWhite,
      textareaClass: filled ? refreshTextareaFilled : refreshTextareaWhite,
      selectClass: filled ? refreshSelectFilled : refreshSelectWhite,
      errorInputClass: errorInputRefresh,
      helperClass: helperRefresh,
      toggleRow: "flex items-center justify-between text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234]",
      checkboxText: "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234]",
      sectionTitle: "text-[14px] font-[675] leading-[20px] tracking-[-0.07px] text-[#142234]",
      primaryButtonClass: refreshPrimaryButton,
      secondaryButtonClass: refreshSecondaryButton,
      modalTitleClass: refreshModalTitle,
      closeButtonClass: refreshCloseButton,
      toggle: {
        trackClass: "h-[20px] w-[36px]",
        // Borderless white knob that nearly fills the 20px track with a symmetric 1px
        // inset (the track's own 1px border supplies the gap, so the knob uses top-0/left-0).
        // The earlier 16px knob + its own border read as a pale "padding" ring against
        // the #F1F6FB off-fill; a flush 18px circle matches Figma switch 196:393.
        knobClass: "top-0 h-[18px] w-[18px]",
        onClass: "border-[#2C219E] bg-[#2C219E] hover:border-[#241A86] hover:bg-[#241A86]",
        // Off = filled pale pill (#F1F6FB) with a #D5DEE7 border (same crisp outline as inputs).
        offClass: "border-[#D5DEE7] bg-[#F1F6FB] hover:border-[#C1CCD7]",
        knobOnPos: "left-[16px]",
        knobOffPos: "left-0",
        knobOnBorder: "",
        knobOffBorder: "",
      },
    }
  }
  return {
    labelClass,
    inputClass,
    textareaClass,
    selectClass,
    errorInputClass: errorInputCurrent,
    helperClass: helperCurrent,
    toggleRow: "flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#273951]",
    checkboxText: "text-[12px] font-[400] leading-[16px] text-[#6C7688]",
    sectionTitle: "text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44]",
    primaryButtonClass: currentPrimaryButton,
    secondaryButtonClass: currentSecondaryButton,
    modalTitleClass: currentModalTitle,
    closeButtonClass: currentCloseButton,
    toggle: {
      trackClass: "h-[16px] w-[30px]",
      knobClass: "top-0 h-[14px] w-[14px] border",
      onClass: "border-[#533AFD] bg-[#675DFF]",
      offClass: "border-[#D4DEE9] bg-[#ECF1F6]",
      knobOnPos: "left-[14px]",
      knobOffPos: "left-0",
      knobOnBorder: "border-[#533AFD]",
      knobOffBorder: "border-[#D4DEE9]",
    },
  }
}
