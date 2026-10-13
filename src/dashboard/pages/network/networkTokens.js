// Colors and text styles for the Stripe network onboarding steps, from the
// Dashboard visual refresh frames in Figma. See networkControls.jsx.
import { color } from '@dashboard/ui'

export const ink = {
  primary: '#142333',   // newslate/1000
  strong: '#081524',    // newslate/1100
  secondary: '#4F647A', // newslate/600
  brand: color.actionPrimary, // blurple/600 #533AFD
  divider: '#E9F0F7',   // newslate/50
  areaFill: '#F6F9FC',  // newslate/25
  brandTint: '#EFEEFF', // blurple-tones/50
}

export const text = {
  body: { fontSize: 13, fontWeight: 400, lineHeight: '20px', letterSpacing: -0.065, color: ink.secondary },
  bodyEmphasized: { fontSize: 13, fontWeight: 500, lineHeight: '20px', letterSpacing: -0.065, color: ink.primary },
  title: { fontSize: 15, fontWeight: 600, lineHeight: '20px', letterSpacing: -0.075, color: ink.primary },
  link: { fontSize: 13, fontWeight: 400, lineHeight: '20px', letterSpacing: -0.065, color: ink.brand },
}

// Content column width used by the Figma frames.
export const STEP_WIDTH = 520
