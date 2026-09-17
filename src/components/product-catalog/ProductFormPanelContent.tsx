'use client'

import type { ComponentProps } from "react"

import { PriceFormSection } from "@/components/PriceFormSection"
import { ProductInfoCard } from "@/components/ProductInfoCard"
import { MeterForm } from "@/components/MeterForm"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

type ProductFormPanelContentProps = {
  activeObjectForm: "product" | "meter" | "price"
  productInfoProps: ComponentProps<typeof ProductInfoCard>
  meterFormProps: ComponentProps<typeof MeterForm>
  priceFormProps: ComponentProps<typeof PriceFormSection>
}

export function ProductFormPanelContent({
  activeObjectForm,
  productInfoProps,
  meterFormProps,
  priceFormProps,
}: ProductFormPanelContentProps) {
  const { productFormStyle } = useProductFormStyle()

  if (activeObjectForm === "product") {
    return <ProductInfoCard {...productInfoProps} />
  }

  if (activeObjectForm === "meter") {
    return <MeterForm {...meterFormProps} />
  }

  return (
    <div className={productFormStyle === "refresh" ? "text-[#142234]" : "text-[#353A44]"}>
      <PriceFormSection {...priceFormProps} />
    </div>
  )
}


