import { type ReactNode } from "react"

export function renderHighlightedText(text: string, needle: string): ReactNode {
  const trimmedNeedle = needle.trim()
  if (!trimmedNeedle) return text

  const lowerText = text.toLowerCase()
  const lowerNeedle = trimmedNeedle.toLowerCase()
  if (!lowerText.includes(lowerNeedle)) return text

  const parts: ReactNode[] = []
  let idx = 0
  while (idx < text.length) {
    const next = lowerText.indexOf(lowerNeedle, idx)
    if (next === -1) {
      parts.push(text.slice(idx))
      break
    }

    if (next > idx) parts.push(text.slice(idx, next))
    parts.push(
      <span key={`${next}-${lowerNeedle}`} className="rounded-[3px] bg-[#E2FBFE] px-0.5">
        {text.slice(next, next + trimmedNeedle.length)}
      </span>,
    )
    idx = next + trimmedNeedle.length
  }

  return <>{parts}</>
}
