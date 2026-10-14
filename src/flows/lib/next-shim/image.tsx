// Shim for `next/image` so the flows (ported from a Next.js app) run unchanged
// under Vite. Renders a plain <img> and drops Next-only props.
import type { ImgHTMLAttributes } from "react"

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: string
  unoptimized?: boolean
}

export default function Image({ fill, priority, quality, placeholder, unoptimized, style, ...rest }: ImageProps) {
  void quality
  void placeholder
  void unoptimized
  return (
    <img
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...rest}
    />
  )
}
