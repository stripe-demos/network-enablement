import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { StandardLandingPage } from "@/components/StandardLandingPage"

import "./globals.css"

createRoot(document.getElementById("flows-root")!).render(
  <StrictMode>
    <StandardLandingPage />
  </StrictMode>,
)
