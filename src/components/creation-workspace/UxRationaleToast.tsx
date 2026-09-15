'use client'

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

type UxRationaleToastProps = {
  message: string | null
  onDismiss: () => void
}

export function UxRationaleToast({ message, onDismiss }: UxRationaleToastProps) {
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!message) return
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      onDismiss()
      timeoutRef.current = null
    }, 5000)
    return () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
    }
  }, [message, onDismiss])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 z-[1002] -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-[#1A2C44] px-[14px] py-[10px] shadow-[0_15px_35px_rgba(48,49,61,0.15),0_5px_15px_rgba(0,0,0,0.2)]"
        >
          <span className="text-[13px] font-[450] leading-[18px] text-white">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export const RATIONALE_MESSAGES: Record<string, Record<string, string>> = {
  intent: {
    customer: "Independent creation: customer exists as its own API object regardless of this invoice's fate.",
    product: "Independent creation: product persists in your catalog even if this flow is abandoned.",
    coupon: "Independent creation: coupon is a reusable object that lives beyond this transaction.",
    price: "Bundled creation: price only makes sense attached to a product, so it stays within its parent.",
    meter: "Independent creation: meter is a permanent usage-tracking object, created separately so multiple prices can share it.",
  },
  ideal: {
    customer: "Peer object — created independently via modal because it exists outside this invoice's scope.",
    product: "Catalog object — added as a workspace tab because it's part of what you're building together.",
    coupon: "Peer object — created independently via modal because it exists outside this invoice's scope.",
    price: "Child object — shown in a side panel because it only exists as part of this product.",
    meter: "Permanent object — shown in a side panel for setup. It will persist independently for reuse across prices.",
  },
  navigate: {
    customer: "Peer object — full page because customers are permanent and exist beyond this invoice.",
    product: "Peer object — full page because products are permanent catalog items created independently.",
    coupon: "Peer object — full page because coupons are permanent and reusable across transactions.",
    price: "Child object — sheet within the product because a price can't exist without its parent product.",
    meter: "Permanent object — stacked sheet because meters persist independently, but you're setting it up in context of this price.",
  },
  compose: {
    customer: "Peer object — focused dialog because customers are permanent API objects, created independently of this invoice.",
    product: "Peer object — focused dialog because products persist in your catalog regardless of this flow.",
    coupon: "Peer object — focused dialog because coupons are permanent, reusable discount objects.",
    price: "Child object — sheet within the product dialog because prices are bound to their parent product.",
    meter: "Permanent object — stacked sheet because meters persist independently, but you're defining it in the context of this price.",
  },
}
