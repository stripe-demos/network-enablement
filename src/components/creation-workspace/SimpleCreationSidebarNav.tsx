'use client'

import type { ReactElement } from "react"
import { motion, AnimatePresence } from "framer-motion"

type NavItem = {
  id: string
  kind: string
  label: string
}

type SimpleCreationSidebarNavProps = {
  items: NavItem[]
  activeItemId: string | null
  onSelectItem: (id: string) => void
  errorItemIds?: Set<string>
}

const KIND_ICONS: Record<string, (props: { className?: string }) => ReactElement> = {
  invoice: InvoiceNavIcon,
  subscription: SubscriptionNavIcon,
  customer: CustomerNavIcon,
  product: ProductNavIcon,
  coupon: CouponNavIcon,
  meter: MeterNavIcon,
  pricingPlan: PricingPlanNavIcon,
}

function InvoiceNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12" fill="none" className={className} aria-hidden="true">
      <path d="M2.50024 3.7C2.50024 3.3134 2.81364 3 3.20024 3H5.30005C5.68665 3 6.00005 3.3134 6.00005 3.7C6.00005 4.0866 5.68665 4.4 5.30005 4.4H3.20024C2.81364 4.4 2.50024 4.0866 2.50024 3.7Z" fill="#3C4F69"/>
      <path d="M3.2 6C2.8134 6 2.5 6.3134 2.5 6.7C2.5 7.0866 2.8134 7.4 3.2 7.4H6.79995C7.18655 7.4 7.49995 7.0866 7.49995 6.7C7.49995 6.3134 7.18655 6 6.79995 6H3.2Z" fill="#3C4F69"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.80352 11.4345C5.92932 11.4764 6.06663 11.4667 6.18524 11.4074L7.94721 10.5264C7.98193 10.509 8.02021 10.5 8.05902 10.5H9C9.55229 10.5 10 10.0523 10 9.5V2C10 0.89543 9.10457 0 8 0H2C0.89543 0 0 0.895431 0 2V11C0 11.5523 0.447715 12 1 12H2.38197C2.45959 12 2.53615 11.9819 2.60557 11.9472L4.40738 11.0463C4.46668 11.0167 4.53534 11.0118 4.59824 11.0327L5.80352 11.4345ZM3.78129 9.79411C4.17268 9.59842 4.6258 9.5662 5.04096 9.70459L5.89258 9.98846L7.32111 9.27419C7.55023 9.15964 7.80287 9.1 8.05902 9.1H8.6V2C8.6 1.66863 8.33137 1.4 8 1.4H2C1.66863 1.4 1.4 1.66863 1.4 2V10.6H2.1695L3.78129 9.79411Z" fill="#3C4F69"/>
    </svg>
  )
}

function SubscriptionNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 3C1.5 2.44772 1.94772 2 2.5 2H9.5C10.0523 2 10.5 2.44772 10.5 3V9C10.5 9.55228 10.0523 10 9.5 10H2.5C1.94772 10 1.5 9.55228 1.5 9V3ZM4.5 5C4.22386 5 4 5.22386 4 5.5C4 5.77614 4.22386 6 4.5 6H7.5C7.77614 6 8 5.77614 8 5.5C8 5.22386 7.77614 5 7.5 5H4.5ZM4.5 7C4.22386 7 4 7.22386 4 7.5C4 7.77614 4.22386 8 4.5 8H6C6.27614 8 6.5 7.77614 6.5 7.5C6.5 7.22386 6.27614 7 6 7H4.5Z" fill="currentColor"/>
    </svg>
  )
}

function CustomerNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 6.75C9.57107 6.75 11.25 8.42893 11.25 10.5C11.25 11.3284 10.5784 12 9.75 12H1.5L1.34668 11.9922C0.590277 11.9154 0 11.2767 0 10.5C0 8.49378 1.57543 6.85551 3.55664 6.75488L3.75 6.75H7.5ZM3.75 8.25C2.50736 8.25 1.5 9.25736 1.5 10.5H9.75C9.75 9.25736 8.74264 8.25 7.5 8.25H3.75ZM5.625 0C7.28185 0 8.625 1.34315 8.625 3C8.625 4.65685 7.28185 6 5.625 6C3.96815 6 2.625 4.65685 2.625 3C2.625 1.34315 3.96815 0 5.625 0ZM5.625 1.5C4.79657 1.5 4.125 2.17157 4.125 3C4.125 3.82843 4.79657 4.5 5.625 4.5C6.45343 4.5 7.125 3.82843 7.125 3C7.125 2.17157 6.45343 1.5 5.625 1.5Z" fill="#3C4F69"/>
    </svg>
  )
}

function ProductNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M2 2.5C2 1.94772 2.44772 1.5 3 1.5H9C9.55228 1.5 10 1.94772 10 2.5V9.5C10 10.0523 9.55228 10.5 9 10.5H3C2.44772 10.5 2 10.0523 2 9.5V2.5ZM4 4C3.72386 4 3.5 4.22386 3.5 4.5C3.5 4.77614 3.72386 5 4 5H8C8.27614 5 8.5 4.77614 8.5 4.5C8.5 4.22386 8.27614 4 8 4H4Z" fill="currentColor"/>
    </svg>
  )
}

function CouponNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 3C1.5 2.44772 1.94772 2 2.5 2H9.5C10.0523 2 10.5 2.44772 10.5 3V4.5C9.67157 4.5 9 5.17157 9 6C9 6.82843 9.67157 7.5 10.5 7.5V9C10.5 9.55228 10.0523 10 9.5 10H2.5C1.94772 10 1.5 9.55228 1.5 9V7.5C2.32843 7.5 3 6.82843 3 6C3 5.17157 2.32843 4.5 1.5 4.5V3Z" fill="currentColor"/>
    </svg>
  )
}

function MeterNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M6 10.5C8.48528 10.5 10.5 8.48528 10.5 6C10.5 3.51472 8.48528 1.5 6 1.5C3.51472 1.5 1.5 3.51472 1.5 6C1.5 8.48528 3.51472 10.5 6 10.5ZM6 3.5V6L8 7.5" fill="currentColor"/>
    </svg>
  )
}

function PricingPlanNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path d="M9.86599 8.26403C10.1577 8.10138 10.623 8.10649 10.9051 8.27477C11.1871 8.44313 11.1799 8.71149 10.8885 8.87438L6.63748 11.2474C6.00951 11.5979 5.01096 11.5953 4.38845 11.2416L0.219507 8.87145C-0.0696369 8.70715 -0.0736995 8.43884 0.210718 8.27184C0.495324 8.10504 0.960577 8.10284 1.24978 8.26696L5.42068 10.6371C5.47475 10.6676 5.5615 10.6683 5.61599 10.6381L9.86599 8.26403Z" fill="currentColor"/>
      <path d="M9.86599 5.55212C10.1577 5.38945 10.623 5.39455 10.9051 5.56286C11.1871 5.73123 11.1799 5.99958 10.8885 6.16247L6.63748 8.53552C6.00951 8.88598 5.01095 8.88339 4.38845 8.52966L0.219507 6.15954C-0.0696369 5.99523 -0.0736995 5.72692 0.210718 5.55993C0.495331 5.39311 0.96057 5.3909 1.24978 5.55505L5.42068 7.92517C5.47475 7.95564 5.56151 7.95639 5.61599 7.92614L9.86599 5.55212Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.37576 0.271845C5.0042 -0.0906524 6.02165 -0.0905775 6.65017 0.271845L10.4138 2.4447C11.0419 2.80755 11.042 3.39533 10.4138 3.75817L6.65017 5.93102C6.02172 6.29325 5.00413 6.29332 4.37576 5.93102L0.612085 3.75817C-0.0160347 3.39533 -0.0159895 2.80755 0.612085 2.4447L4.37576 0.271845Z" fill="currentColor"/>
    </svg>
  )
}

function FallbackNavIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" fill="currentColor"/>
    </svg>
  )
}

export function SimpleCreationSidebarNav({
  items,
  activeItemId,
  onSelectItem,
  errorItemIds,
}: SimpleCreationSidebarNavProps) {
  const rowBase =
    "flex w-full items-center gap-[6px] rounded-[6px] pl-[8px] pr-[12px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors"
  const activeStyle = "bg-[#F7F5FD] text-[#1A2C44]"
  const inactiveStyle = "text-[#50617A] hover:bg-[#F4F7FA]"

  return (
    <AnimatePresence>
      <motion.aside
        className="flex h-full w-max shrink-0 flex-col border-r border-[#ECF1F6] bg-white"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "auto", opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <nav className="flex flex-col gap-[2px] px-[16px] py-[10px]">
          {items.map((item) => {
            const isActive = item.id === activeItemId
            const hasError = errorItemIds?.has(item.id)
            const IconComponent = KIND_ICONS[item.kind] ?? FallbackNavIcon

            return (
              <button
                key={item.id}
                type="button"
                className={`${rowBase} ${isActive ? activeStyle : inactiveStyle} ${hasError ? "!text-[#DF1B41]" : ""}`}
                onClick={() => onSelectItem(item.id)}
              >
                <span className="flex h-[12px] w-[12px] shrink-0 items-center justify-center">
                  <IconComponent />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </motion.aside>
    </AnimatePresence>
  )
}
