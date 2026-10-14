'use client'

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react"

import { cn } from "@/lib/utils"

type ScrollWithFadeProps = HTMLAttributes<HTMLDivElement> & {
  enabled?: boolean
  fadeSizePx?: number
}

export const ScrollWithFade = forwardRef<HTMLDivElement, ScrollWithFadeProps>(
  function ScrollWithFade(
    { enabled = true, fadeSizePx = 18, className, onScroll, style, ...props },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLDivElement | null>(null)
    const [fade, setFade] = useState({ top: false, bottom: false })

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef],
    )

    const sync = useCallback(() => {
      const node = localRef.current
      if (!node || !enabled) {
        setFade({ top: false, bottom: false })
        return
      }

      const overflow = node.scrollHeight - node.clientHeight
      if (overflow <= 1) {
        setFade({ top: false, bottom: false })
        return
      }

      setFade({
        top: node.scrollTop > 1,
        bottom: overflow - node.scrollTop > 1,
      })
    }, [enabled])

    useLayoutEffect(() => {
      sync()
      const node = localRef.current
      if (!node || typeof ResizeObserver === "undefined") return
      const observer = new ResizeObserver(sync)
      observer.observe(node)
      return () => observer.disconnect()
    }, [sync, props.children])

    return (
      <div
        {...props}
        ref={setRefs}
        data-fade-top={enabled && fade.top ? "true" : "false"}
        data-fade-bottom={enabled && fade.bottom ? "true" : "false"}
        className={cn(enabled && "refresh-scroll-fade", className)}
        style={{ "--refresh-scroll-fade-size": `${fadeSizePx}px`, ...style } as CSSProperties}
        onScroll={(event) => {
          sync()
          onScroll?.(event)
        }}
      />
    )
  },
)
