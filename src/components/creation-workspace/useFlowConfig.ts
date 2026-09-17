'use client'

import { useMemo } from "react"
import type { ComponentType } from "react"
import type { WorkflowConfig, FullBillingForms } from "./workflowConfig"
import {
  createInvoiceWorkflowConfig,
  createSubscriptionWorkflowConfig,
  createUsageBillingWorkflowConfig,
  createCustomerEntryWorkflowConfig,
  createProductEntryWorkflowConfig,
  createCouponEntryWorkflowConfig,
  createContractWorkflowConfig,
  createPaymentLinkWorkflowConfig,
} from "./workflowConfig"

type FlowForms = {
  invoice: ComponentType<any>
  customer: ComponentType<any>
  product: ComponentType<any>
  coupon: ComponentType<any>
  meter: ComponentType<any>
  price: ComponentType<any>
  subscription: ComponentType<any>
  pricingPlan: ComponentType<any>
  contract: ComponentType<any>
  paymentLink: ComponentType<any>
  invoicePreview: ComponentType<any>
  subscriptionPreview: ComponentType<any>
  meterPreview: ComponentType<any>
  pricePreview: ComponentType<any>
  productPreview: ComponentType<any>
  contractPreview: ComponentType<any>
  paymentLinkPreview: ComponentType<any>
}

export function useFlowConfig(flow: string, forms: FlowForms): WorkflowConfig {
  return useMemo(() => {
    const fullBillingForms: FullBillingForms = forms

    switch (flow) {
      case "invoices":
        return createInvoiceWorkflowConfig({
          invoice: forms.invoice,
          customer: forms.customer,
          product: forms.product,
          coupon: forms.coupon,
          meter: forms.meter,
          price: forms.price,
          invoicePreview: forms.invoicePreview,
          meterPreview: forms.meterPreview,
          pricePreview: forms.pricePreview,
          productPreview: forms.productPreview,
        })
      case "subscriptions":
        return createSubscriptionWorkflowConfig({
          subscription: forms.subscription,
          customer: forms.customer,
          pricingPlan: forms.pricingPlan,
          product: forms.product,
          coupon: forms.coupon,
          price: forms.price,
          subscriptionPreview: forms.subscriptionPreview,
          pricePreview: forms.pricePreview,
        })
      case "usage-billing":
        return createUsageBillingWorkflowConfig({
          meter: forms.meter,
          product: forms.product,
          customer: forms.customer,
          price: forms.price,
          pricePreview: forms.pricePreview,
        })
      case "customers":
        return createCustomerEntryWorkflowConfig(fullBillingForms)
      case "products":
        return createProductEntryWorkflowConfig(fullBillingForms)
      case "coupons":
        return createCouponEntryWorkflowConfig(fullBillingForms)
      case "payment-links":
        return createPaymentLinkWorkflowConfig({
          paymentLink: forms.paymentLink,
          product: forms.product,
          price: forms.price,
          paymentLinkPreview: forms.paymentLinkPreview,
          productPreview: forms.productPreview,
          pricePreview: forms.pricePreview,
        })
      case "contracts":
        return createContractWorkflowConfig({
          contract: forms.contract,
          customer: forms.customer,
          contractPreview: forms.contractPreview,
        })
      default:
        return createInvoiceWorkflowConfig({
          invoice: forms.invoice,
          customer: forms.customer,
          product: forms.product,
          coupon: forms.coupon,
          meter: forms.meter,
          price: forms.price,
          invoicePreview: forms.invoicePreview,
          meterPreview: forms.meterPreview,
          pricePreview: forms.pricePreview,
          productPreview: forms.productPreview,
        })
    }
  }, [flow, forms])
}
