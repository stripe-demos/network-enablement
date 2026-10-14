'use client'

import { useEffect } from "react"
import type { WorkflowObject } from "./useWorkflowState"

/**
 * Syncs newly-created object names onto invoice/subscription forms and
 * syncs meter names onto parent price objects.
 */
export function useWorkflowSync(
  objects: WorkflowObject[],
  updateObjectData: (id: string, data: Record<string, any>) => void
) {
  useEffect(() => {
    const invoiceObj = objects.find((o) => o.kind === "invoice")
    const subscriptionObj = objects.find((o) => o.kind === "subscription")
    const customerObj = objects.find((o) => o.kind === "customer")
    const productObj = objects.find((o) => o.kind === "product")
    const couponObj = objects.find((o) => o.kind === "coupon")

    if (invoiceObj) {
      const updates: Record<string, any> = {}
      if (invoiceObj.data.customerId === "_new" && customerObj) {
        const name = (customerObj.data.name as string) || "New customer"
        if (invoiceObj.data.customerName !== name) updates.customerName = name
      }
      if (invoiceObj.data.productId === "_new" && productObj?.data.name && invoiceObj.data.productName !== productObj.data.name) {
        updates.productName = productObj.data.name
      }
      if (couponObj) {
        if (!invoiceObj.data.couponId || invoiceObj.data.couponId === "_new") {
          if (invoiceObj.data.couponId !== "_new") updates.couponId = "_new"
          if (couponObj.data.name && invoiceObj.data.couponName !== couponObj.data.name) updates.couponName = couponObj.data.name
          if (couponObj.data.amount && invoiceObj.data.couponAmount !== couponObj.data.amount) updates.couponAmount = couponObj.data.amount
          if (couponObj.data.discountType && invoiceObj.data.couponDiscountType !== couponObj.data.discountType) updates.couponDiscountType = couponObj.data.discountType
        }
      }
      if (Object.keys(updates).length > 0) {
        updateObjectData(invoiceObj.id, updates)
      }
    }

    if (subscriptionObj) {
      const updates: Record<string, any> = {}
      if (subscriptionObj.data.customerId === "_new" && customerObj?.data.name && subscriptionObj.data.customerName !== customerObj.data.name) {
        updates.customerName = customerObj.data.name
      }
      if (subscriptionObj.data.productId === "_new" && productObj?.data.name && subscriptionObj.data.productName !== productObj.data.name) {
        updates.productName = productObj.data.name
      }
      if (Object.keys(updates).length > 0) {
        updateObjectData(subscriptionObj.id, updates)
      }
    }

    const meterObjs = objects.filter((o) => o.kind === "meter")
    const priceObjs = objects.filter((o) => o.kind === "price")
    for (const meterObj of meterObjs) {
      const parentPrice = priceObjs.find((p) => p.data.usageType === "metered" && !p.data.meterName && meterObj.data.name)
        ?? priceObjs.find((p) => p.data.usageType === "metered")
      if (parentPrice && meterObj.data.name && parentPrice.data.meterName !== meterObj.data.name) {
        updateObjectData(parentPrice.id, { meterName: meterObj.data.name })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects])
}
