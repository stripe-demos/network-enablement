import Image from "next/image"

import { cn } from "@/lib/utils"

const FLAG_SRC: Record<string, string> = {
  USD: "/flags/us.svg",
  EUR: "/flags/eu.svg",
  GBP: "/flags/gb.svg",
  JPY: "/flags/jp.svg",
  CAD: "/flags/ca.svg",
  AUD: "/flags/au.svg",
  NZD: "/flags/nz.svg",
  CHF: "/flags/ch.svg",
  CNY: "/flags/cn.svg",
  HKD: "/flags/hk.svg",
  SGD: "/flags/sg.svg",
  INR: "/flags/in.svg",
  BRL: "/flags/br.svg",
  MXN: "/flags/mx.svg",
  SEK: "/flags/se.svg",
  NOK: "/flags/no.svg",
  DKK: "/flags/dk.svg",
  PLN: "/flags/pl.svg",
  CZK: "/flags/cz.svg",
}

export function hasCurrencyFlag(currency: string) {
  return Boolean(FLAG_SRC[currency])
}

export function CurrencyFlag({
  currency,
  size = 16,
  className,
}: {
  currency: string
  size?: number
  className?: string
}) {
  const src = FLAG_SRC[currency]
  if (!src) return null
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  )
}
