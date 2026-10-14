'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type ChildSettingStyle = "indent" | "rail" | "linked" | "accent" | "elbow" | "dot" | "outline" | "tint" | "filled"

const { Provider: ChildSettingStyleProvider, useValue } =
  createToggleContext<ChildSettingStyle>("ChildSettingStyle", "filled", true)

function useChildSettingStyle() {
  const { value: childSettingStyle, setValue: setChildSettingStyle } = useValue()
  return { childSettingStyle, setChildSettingStyle }
}

/**
 * Class for a revealed child block so it reads as belonging to the toggle above it.
 *
 * Most modes never fill the parent+child group — a shaded box around only some rows
 * produced the inconsistent "snake". Grouping comes from the child alone:
 *   - indent: the child tucks in under the toggle
 *   - rail:   a full-height left accent line
 *   - linked: a rail whose rounded spine reaches up into the gap so it reads as
 *             dropping straight out of the toggle
 *   - accent: a rail in soft lavender that echoes the purple ON-toggle
 *   - elbow:  a tree-style corner connector at the top-left (best for 1-line children)
 *   - dot:    a small marker in the left gutter
 *   - outline: a hairline border box around the child (grouping without a fill)
 *   - tint:   the child sits on a light attached surface
 *   - filled: the WHOLE section (toggle + child) fills — handled by the wrapper via
 *             getChildSettingFillClass, so the child itself stays plain here.
 *
 * Colours are written as full literal classes (never interpolated) so Tailwind's JIT
 * can see them. Top spacing is owned by the wrapper's flex gap — no top margin here.
 */
function getChildSettingContentClass(
  style: ChildSettingStyle,
  theme: { surface: string; padding: string; isRefresh: boolean },
): string {
  const r = theme.isRefresh
  switch (style) {
    case "rail":
      return r
        ? "border-l-[2px] border-[#D5DEE7] pl-[14px]"
        : "border-l-[2px] border-[#D8DEE4] pl-[14px]"
    case "linked":
      // Rail that connects: a rounded spine reaching up into the gap toward the toggle.
      return r
        ? "relative pl-[14px] before:content-[''] before:absolute before:left-0 before:top-[-10px] before:bottom-0 before:w-[2px] before:rounded-full before:bg-[#D5DEE7]"
        : "relative pl-[14px] before:content-[''] before:absolute before:left-0 before:top-[-10px] before:bottom-0 before:w-[2px] before:rounded-full before:bg-[#D8DEE4]"
    case "accent":
      // Rail tinted to echo the purple ON-toggle, so it reads as intentional UI.
      return "border-l-[2px] border-[#BDB6F7] pl-[14px]"
    case "elbow":
      return r
        ? "relative pl-[20px] before:content-[''] before:absolute before:left-[1px] before:top-[2px] before:h-[12px] before:w-[9px] before:rounded-bl-[6px] before:border-b-[1.5px] before:border-l-[1.5px] before:border-[#D5DEE7]"
        : "relative pl-[20px] before:content-[''] before:absolute before:left-[1px] before:top-[2px] before:h-[12px] before:w-[9px] before:rounded-bl-[6px] before:border-b-[1.5px] before:border-l-[1.5px] before:border-[#D8DEE4]"
    case "dot":
      return r
        ? "relative pl-[18px] before:content-[''] before:absolute before:left-0 before:top-[7px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#C1CCD7]"
        : "relative pl-[18px] before:content-[''] before:absolute before:left-0 before:top-[7px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#B6C0CD]"
    case "outline":
      // Group the child with a hairline border box — no fill, just an outline.
      return r
        ? `rounded-[6px] border border-[#EAF0F6] ${theme.padding}`
        : `rounded-[6px] border border-[#E3E8EF] ${theme.padding}`
    case "tint":
      return `rounded-[6px] ${theme.surface} ${theme.padding}`
    case "filled":
      return ""
    case "indent":
    default:
      return "pl-[24px]"
  }
}

/**
 * Fill applied to the WRAPPER (toggle row + revealed child) in the "filled" mode when
 * the setting is on. In a divided list the cell already has full-bleed padding, so we
 * only add the surface tint; otherwise we round + pad it into a self-contained block.
 * Returns "" for every other mode / when the setting is off.
 */
function getChildSettingFillClass(
  style: ChildSettingStyle,
  enabled: boolean,
  theme: { surface: string; padding: string },
  opts: { divided?: boolean } = {},
): string {
  if (style !== "filled" || !enabled) return ""
  return opts.divided ? theme.surface : `rounded-[6px] ${theme.surface} ${theme.padding}`
}

export {
  ChildSettingStyleProvider,
  useChildSettingStyle,
  getChildSettingContentClass,
  getChildSettingFillClass,
}
