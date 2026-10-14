'use client'

import type { ReactNode } from "react"
import { createToggleContext } from "@/lib/createToggleContext"

export type HeaderStyle = "bar" | "inline"
export type ButtonPlacement = "flow" | "bottom" | "header"
export type FormPanelStyle = "default" | "card-full" | "card-hug"

const headerStyleCtx = createToggleContext<HeaderStyle>("HeaderStyle", "bar", true)
const buttonPlacementCtx = createToggleContext<ButtonPlacement>("ButtonPlacement", "header", true)
const formPanelStyleCtx = createToggleContext<FormPanelStyle>("FormPanelStyle", "default", true)

export function HeaderStyleProvider({ children }: { children: ReactNode }) {
  return (
    <headerStyleCtx.Provider>
      <buttonPlacementCtx.Provider>
        <formPanelStyleCtx.Provider>
          {children}
        </formPanelStyleCtx.Provider>
      </buttonPlacementCtx.Provider>
    </headerStyleCtx.Provider>
  )
}

export function useHeaderStyle() {
  const { value: headerStyle, setValue: setHeaderStyle } = headerStyleCtx.useValue()
  const { value: buttonPlacement, setValue: setButtonPlacement } = buttonPlacementCtx.useValue()
  const { value: formPanelStyle, setValue: setFormPanelStyle } = formPanelStyleCtx.useValue()
  return { headerStyle, setHeaderStyle, buttonPlacement, setButtonPlacement, formPanelStyle, setFormPanelStyle }
}
