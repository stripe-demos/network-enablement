'use client'

import { useEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"

import FlagIcon from "@/send-flow/prototypes/prototype2/ui/FlagIcon"
import { SelectControl } from "@/components/creation-workspace/account-configuration/AccountConfigurationPrimitives"

export type PhoneCountry = "US" | "CA" | "GB"

export type AddressValue = {
  name?: string
  country: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  phone: string
  phoneCountry: PhoneCountry
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
]

const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon",
]

const PHONE_COUNTRIES: Array<{ id: PhoneCountry; prefix: string; country: string }> = [
  { id: "US", prefix: "+1", country: "United States" },
  { id: "CA", prefix: "+1", country: "Canada" },
  { id: "GB", prefix: "+44", country: "United Kingdom" },
]

export function phoneCountryFromBillingCountry(country: string): PhoneCountry {
  if (country === "Canada" || country === "CA") return "CA"
  if (country === "United Kingdom" || country === "GB" || country === "UK") return "GB"
  return "US"
}

export function formatAddressSummary(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ")
}

function regionOptionsForCountry(country: string) {
  if (country === "Canada") return { label: "Province", options: CA_PROVINCES }
  if (country === "United States") return { label: "State", options: US_STATES }
  return null
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-[#6C7688]">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Flag({ code }: { code: PhoneCountry }) {
  return <FlagIcon code={code} className="inline-flex h-[12px] w-[16px] shrink-0 items-center overflow-hidden rounded-[2px]" />
}

function FlagMenu<T extends string>({
  open,
  items,
  value,
  coords,
  width,
  menuRef,
  onSelect,
}: {
  open: boolean
  items: Array<{ id: T; code: PhoneCountry; label: string }>
  value: T
  coords: { top: number; left: number }
  width?: number
  menuRef: RefObject<HTMLDivElement | null>
  onSelect: (id: T) => void
}) {
  if (!open) return null
  return createPortal(
    <div
      ref={menuRef}
      className="overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-[0_8px_24px_rgba(20,34,52,0.12)]"
      style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 10000, width: width ?? 168, minWidth: 168 }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`flex w-full items-center gap-[8px] px-[10px] py-[6px] text-left text-[12px] leading-[16px] text-[#1A2C44] hover:bg-[#F8FAFB] ${item.id === value ? "bg-[#F8F7FF]" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          <Flag code={item.code} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  )
}

function useFlagMenu() {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 168 })
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuHeight = menuRef.current?.offsetHeight ?? 124
    const gap = 6
    const opensUp = rect.bottom + gap + menuHeight > window.innerHeight - 8
    setCoords({
      top: opensUp ? rect.top - gap - menuHeight : rect.bottom + gap,
      left: Math.min(rect.left, window.innerWidth - 180),
      width: Math.max(rect.width, 168),
    })
  }

  useEffect(() => {
    if (!open) return
    updatePosition()
    const frame = window.requestAnimationFrame(updatePosition)
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onReposition = () => updatePosition()
    window.addEventListener("mousedown", onPointer)
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("mousedown", onPointer)
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [open])

  return { open, setOpen, coords, rootRef, menuRef }
}

function PhoneCountrySelect({
  value,
  onChange,
}: {
  value: PhoneCountry
  onChange: (value: PhoneCountry) => void
}) {
  const menu = useFlagMenu()
  const items = PHONE_COUNTRIES.map((item) => ({ id: item.id, code: item.id, label: item.country }))

  return (
    <div ref={menu.rootRef} className="relative">
      <button
        type="button"
        aria-label="Phone country"
        aria-expanded={menu.open}
        className="flex h-full items-center gap-[4px] rounded-[4px] px-[2px] outline-none"
        onClick={() => menu.setOpen((current) => !current)}
      >
        <Flag code={value} />
        <Chevron />
      </button>
      <FlagMenu
        open={menu.open}
        items={items}
        value={value}
        coords={menu.coords}
        menuRef={menu.menuRef}
        onSelect={(id) => {
          onChange(id)
          menu.setOpen(false)
        }}
      />
    </div>
  )
}

export function CountrySelect({
  value,
  onChange,
  className,
  placeholder = "Select a country",
  ariaLabel = "Country",
}: {
  value: string
  onChange: (country: string) => void
  className: string
  placeholder?: string
  ariaLabel?: string
}) {
  const menu = useFlagMenu()
  const items = PHONE_COUNTRIES.map((item) => ({ id: item.country, code: item.id, label: item.country }))
  const selected = items.find((item) => item.id === value || item.code === value)

  return (
    <div ref={menu.rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={menu.open}
        data-styled-select
        className={`${className} flex items-center gap-[8px] !pr-[10px] text-left ${selected ? "" : "font-[400] text-[#6C7688]"}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          menu.setOpen((current) => !current)
        }}
      >
        {selected ? <Flag code={selected.code} /> : null}
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <Chevron />
      </button>
      <FlagMenu
        open={menu.open}
        items={items}
        value={selected?.id ?? ""}
        coords={menu.coords}
        width={menu.coords.width}
        menuRef={menu.menuRef}
        onSelect={(country) => {
          onChange(country)
          menu.setOpen(false)
        }}
      />
    </div>
  )
}

export function AddressFields({
  value,
  tokens,
  disabled,
  showCountry = true,
  onChange,
}: {
  value: AddressValue
  tokens: { inputClass: string; selectClass: string }
  disabled?: boolean
  showCountry?: boolean
  onChange: (patch: Partial<AddressValue>) => void
}) {
  const region = regionOptionsForCountry(value.country)
  const phoneMeta = PHONE_COUNTRIES.find((item) => item.id === value.phoneCountry) ?? PHONE_COUNTRIES[0]
  const lock = disabled ? "pointer-events-none opacity-55" : ""

  return (
    <div className={`flex flex-col gap-[6px] ${lock}`}>
      {value.name !== undefined ? (
        <input className={tokens.inputClass} aria-label="Recipient name" placeholder="Full name" value={value.name ?? ""} onChange={(event) => onChange({ name: event.target.value })} />
      ) : null}
      {showCountry ? (
        <CountrySelect
          className={tokens.selectClass}
          value={value.country}
          onChange={(country) => onChange({ country, state: "", phoneCountry: phoneCountryFromBillingCountry(country) })}
        />
      ) : null}
      <input className={tokens.inputClass} aria-label="Street address" placeholder="Street address" value={value.line1 ?? ""} onChange={(event) => onChange({ line1: event.target.value })} />
      <input className={tokens.inputClass} aria-label="Apartment, unit, or other" placeholder="Apartment, unit, or other" value={value.line2 ?? ""} onChange={(event) => onChange({ line2: event.target.value })} />
      <input className={tokens.inputClass} aria-label="City" placeholder="City" value={value.city ?? ""} onChange={(event) => onChange({ city: event.target.value })} />
      {region ? (
        <SelectControl className={tokens.selectClass} value={value.state} onChange={(state) => onChange({ state })} ariaLabel={region.label}>
          <option value="">{region.label}</option>
          {region.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </SelectControl>
      ) : null}
      <input className={tokens.inputClass} aria-label="Postal code" placeholder="Postal code" value={value.postalCode ?? ""} onChange={(event) => onChange({ postalCode: event.target.value })} />
      <div className="flex h-[30px] w-full items-center rounded-[6px] border border-[#E3E8EF] bg-white pl-[8px] pr-[10px] transition-all hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7]">
        <PhoneCountrySelect value={value.phoneCountry} onChange={(phoneCountry) => onChange({ phoneCountry })} />
        <input
          type="tel"
          aria-label="Phone"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none placeholder:text-[#6C7688] not-placeholder-shown:font-[500]"
          placeholder={`${phoneMeta.prefix} (201) 555-0123`}
          value={value.phone ?? ""}
          onChange={(event) => onChange({ phone: event.target.value })}
        />
      </div>
    </div>
  )
}
