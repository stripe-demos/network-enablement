'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type ProductFormStyle = "current" | "sail" | "refresh"

const { Provider: ProductFormStyleProvider, useValue } =
  createToggleContext<ProductFormStyle>("ProductFormStyle", "current", "session")

function useProductFormStyle() {
  const { value: productFormStyle, setValue: setProductFormStyle } = useValue()
  return { productFormStyle, setProductFormStyle }
}

export { ProductFormStyleProvider, useProductFormStyle }
