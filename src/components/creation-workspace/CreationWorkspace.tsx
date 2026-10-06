'use client'

import type { MouseEvent, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { NoPreviewState } from "@/components/creation-workspace/NoPreviewState"
import { ScrollWithFade } from "@/components/ScrollWithFade"
import { useLayoutSplit } from "@/components/creation-workspace/layoutSplit"
import { useNarrowFormWidth, NarrowFormWidthProvider } from "@/components/creation-workspace/narrowFormWidth"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

export type WorkspaceMode = "single" | "related" | "hierarchical"

export type WorkspacePresentation = "fullscreen" | "modal" | "large-modal" | "standard-small"

type FormPanelStyle = "default" | "card-full" | "card-hug"

type CreationWorkspaceProps = {
  mode: WorkspaceMode
  header: ReactNode
  navigator?: ReactNode
  editor: ReactNode
  /** Object-specific preview (e.g. invoice) when the active kind supports it */
  preview?: ReactNode
  /** Full-width bar rendered between header and column layout */
  toolbar?: ReactNode
  isOpen: boolean
  onClose?: () => void
  /** Modal: centered card + dimmed backdrop. Fullscreen: existing full-viewport shell. */
  presentation?: WorkspacePresentation
  /** When true, hide the top header bar entirely */
  hideHeader?: boolean
  /** Form panel visual treatment */
  formPanelStyle?: FormPanelStyle
  /** Render inside an existing positioned surface instead of owning a fixed overlay */
  embedded?: boolean
  /** "standard-small" only: fixed width (px) of the preview column inside the 48px gutter. Defaults to 420. */
  standardSmallPreviewWidth?: number
  /** "standard-small" only: fixed width (px) of the form column. Defaults to 280. */
  standardSmallFormWidth?: number
  /** "large-modal" only: size the surface to its editor instead of using the fixed 80% canvas. */
  largeModalHugContent?: boolean
  /** Skip the enter fade/scale so a screen that is already open does not flash. */
  skipEnterAnimation?: boolean
}

const dissolveEase = [0.25, 0.1, 0.25, 1.0] as const
const smoothOutEase = [0.22, 1, 0.36, 1] as const

export function CreationWorkspace({
  mode,
  header,
  navigator,
  editor,
  preview,
  toolbar,
  isOpen,
  onClose,
  presentation = "fullscreen",
  hideHeader = false,
  formPanelStyle = "default",
  embedded = false,
  standardSmallPreviewWidth,
  standardSmallFormWidth,
  largeModalHugContent = false,
  skipEnterAnimation = false,
}: CreationWorkspaceProps) {
  const { productFormStyle } = useProductFormStyle()
  const isRefreshSurface = productFormStyle === "refresh"
  const enterTransition = skipEnterAnimation ? { duration: 0 } : { duration: 0.32, ease: dissolveEase }
  const hugEnterTransition = skipEnterAnimation ? { duration: 0 } : largeModalHugContent ? { duration: 0.25, ease: smoothOutEase } : { duration: 0.32, ease: dissolveEase }
  const dimTransition = skipEnterAnimation ? { duration: 0 } : { duration: 0.3, ease: dissolveEase }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={embedded ? "relative h-full min-h-0 w-full" : "fixed inset-0 z-30"} role="dialog" aria-modal="true">
          {/* Backdrop — cross-fades between dimmed modals and white fullscreen. */}
          {!embedded && (
            <AnimatePresence initial={!skipEnterAnimation}>
              {presentation === "modal" || presentation === "large-modal" || presentation === "standard-small" ? (
                <motion.div
                  key="backdrop-dim"
                  className="absolute inset-0 bg-black/40"
                  initial={skipEnterAnimation ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={skipEnterAnimation ? { opacity: 1 } : { opacity: 0 }}
                  transition={dimTransition}
                  onClick={presentation === "large-modal" || presentation === "standard-small" ? onClose : undefined}
                />
              ) : (
                <motion.div
                  key="backdrop-white"
                  className="absolute inset-0 bg-white"
                  initial={skipEnterAnimation ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={skipEnterAnimation ? { opacity: 1 } : { opacity: 0 }}
                  transition={dimTransition}
                />
              )}
            </AnimatePresence>
          )}

          {/* Content — cross-dissolve between modal card and fullscreen shell.
              Both surfaces are absolute-positioned so they overlay during the transition. */}
          <AnimatePresence mode="sync" initial={!skipEnterAnimation}>
            {presentation === "modal" ? (
              <motion.div
                key="surface-modal"
                className="absolute inset-0 z-10 flex items-center justify-center px-[16px]"
                initial={skipEnterAnimation ? false : { opacity: 0, scale: 1.01 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={skipEnterAnimation ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.03 }}
                transition={enterTransition}
              >
                <div className={`flex max-h-[min(90vh,760px)] w-full ${navigator ? "max-w-[680px]" : "max-w-[480px]"} flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]`}>
                  {header}
                  <div className="flex min-h-0 flex-1">
                    {navigator && (
                      <div className="shrink-0 overflow-y-auto">
                        {navigator}
                      </div>
                    )}
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <ModalBodyLayout editor={editor} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : presentation === "large-modal" ? (
              <motion.div
                key="surface-large-modal"
                className="absolute inset-0 z-10 flex items-center justify-center p-[24px]"
                initial={skipEnterAnimation ? false : { opacity: 0, scale: largeModalHugContent ? 0.96 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={skipEnterAnimation ? { opacity: 1, scale: 1 } : { opacity: 0, scale: largeModalHugContent ? 0.96 : 0.98 }}
                transition={hugEnterTransition}
                onClick={(event: MouseEvent<HTMLDivElement>) => {
                  if (event.target === event.currentTarget) onClose?.()
                }}
              >
                <div
                  className={`flex max-h-[calc(100vh-48px)] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)] ${largeModalHugContent ? "w-auto" : "max-w-full"}`}
                  style={largeModalHugContent ? undefined : { width: "min(80vw, 1280px)", height: "80vh" }}
                  data-large-modal-hug={largeModalHugContent ? "true" : undefined}
                >
                  {!hideHeader && header}
                  {toolbar}
                  <div className={`flex min-h-0 flex-1 ${largeModalHugContent ? "overflow-y-auto" : ""}`}>
                    {mode === "single" && (largeModalHugContent ? editor : <SingleLayout navigator={navigator} editor={editor} formPanelStyle={formPanelStyle} />)}
                    {mode === "related" && (
                      <RelatedLayout navigator={navigator} editor={editor} preview={preview} formPanelStyle={formPanelStyle} />
                    )}
                    {mode === "hierarchical" && (
                      <HierarchicalLayout navigator={navigator} editor={editor} preview={preview} />
                    )}
                  </div>
                </div>
              </motion.div>
            ) : presentation === "standard-small" ? (
              <motion.div
                key="surface-standard-small"
                className="absolute inset-0 z-10 flex items-center justify-center p-[24px]"
                initial={skipEnterAnimation ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={skipEnterAnimation ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
                transition={enterTransition}
              >
                {/* Hug-to-content modal: sizes to exactly header + narrow form + 420px preview. */}
                <div className="flex max-h-[90vh] w-auto max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]">
                  {/* Refresh keeps a divider under the header here (unlike the borderless fullscreen cards). */}
                  {!hideHeader && (isRefreshSurface ? <div className="border-b border-[#EAF0F6]">{header}</div> : header)}
                  {toolbar}
                  <div className="flex min-h-0 flex-1">
                    {mode === "single" && <SingleLayout navigator={navigator} editor={editor} formPanelStyle={formPanelStyle} />}
                    {mode === "related" && (
                      <RelatedLayout navigator={navigator} editor={editor} preview={preview} formPanelStyle={formPanelStyle} standardSmall standardSmallPreviewWidth={standardSmallPreviewWidth} standardSmallFormWidth={standardSmallFormWidth} />
                    )}
                    {mode === "hierarchical" && (
                      <HierarchicalLayout navigator={navigator} editor={editor} preview={preview} />
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="surface-full"
                className={`absolute inset-0 z-10 flex flex-col ${isRefreshSurface ? "bg-[#F6F9FC]" : "bg-white"}`}
                initial={skipEnterAnimation ? false : isRefreshSurface ? { opacity: 0, scale: 0.96 } : { opacity: 0 }}
                animate={isRefreshSurface ? { opacity: 1, scale: 1 } : { opacity: 1 }}
                exit={skipEnterAnimation ? { opacity: 1, scale: 1 } : isRefreshSurface ? { opacity: 0, scale: 0.96 } : { opacity: 0 }}
                transition={skipEnterAnimation ? { duration: 0 } : isRefreshSurface ? { duration: 0.25, ease: [0.22, 1, 0.36, 1] } : { duration: 0.2 }}
              >
                {!hideHeader && header}
                {toolbar}
                <div className="flex min-h-0 flex-1">
                  {mode === "single" && <SingleLayout navigator={navigator} editor={editor} formPanelStyle={formPanelStyle} />}
                  {mode === "related" && (
                    <RelatedLayout navigator={navigator} editor={editor} preview={preview} formPanelStyle={formPanelStyle} />
                  )}
                  {mode === "hierarchical" && (
                    <HierarchicalLayout navigator={navigator} editor={editor} preview={preview} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Modal body: single column scroll (no preview column) ─────────────

function ModalBodyLayout({ editor }: { editor: ReactNode }) {
  return (
    <div className="px-[16px] py-[16px]">
      {editor}
    </div>
  )
}

// ── Single mode: centered form ───────────────────────────────────────

function SingleLayout({ navigator, editor, formPanelStyle = "default" }: { navigator?: ReactNode; editor: ReactNode; formPanelStyle?: FormPanelStyle }) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const isCard = formPanelStyle === "card-full" || formPanelStyle === "card-hug"

  return (
    <div className="flex min-h-0 flex-1">
      {navigator && (
        <div className={isRefresh ? "shrink-0 overflow-hidden border-r border-[#EAF0F6] bg-white" : "shrink-0 overflow-y-auto"}>
          {navigator}
        </div>
      )}
      <ScrollWithFade enabled={isRefresh} className={`flex flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable] ${isRefresh ? "bg-white" : isCard ? "bg-[#F8FAFB] p-[8px]" : ""}`}>
        {isCard && !isRefresh ? (
          <div className={`flex flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] ${formPanelStyle === "card-full" ? "flex-1" : ""}`}>
            <div className={`mx-auto flex w-full max-w-[520px] flex-col py-[24px] px-[16px] ${formPanelStyle === "card-full" ? "flex-1" : ""}`}>
              {editor}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex flex-1 max-w-[520px] flex-col py-[24px] px-[16px]">
            {editor}
          </div>
        )}
      </ScrollWithFade>
    </div>
  )
}

// ── Related mode: journey nav + form + optional preview ──────────────

function RelatedLayout({
  navigator,
  editor,
  preview,
  formPanelStyle = "default",
  standardSmall = false,
  standardSmallPreviewWidth = 420,
  standardSmallFormWidth = 280,
}: {
  navigator?: ReactNode
  editor: ReactNode
  preview?: ReactNode
  formPanelStyle?: FormPanelStyle
  /** "Standard small": force a narrow (280px) form beside a fixed-width preview with a 48px gutter, so the modal hugs its content. */
  standardSmall?: boolean
  /** Width (px) of the preview column in the standardSmall layout. */
  standardSmallPreviewWidth?: number
  /** Width (px) of the form column in the standardSmall layout. Defaults to 280. */
  standardSmallFormWidth?: number
}) {
  const { layoutSplit } = useLayoutSplit()
  const { narrowFormWidth } = useNarrowFormWidth()
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"
  // Figma insets the standard form column by 24px; compact/refresh use 16px.
  const formInnerPad = isRefresh
    ? "px-[28px] pt-[24px] pb-[16px]"
    : isSail
      ? "px-[24px] pt-[24px] pb-[16px]"
      : "px-[16px] py-[16px]"
  const rightPanel = preview ?? <NoPreviewState />
  const isCard = formPanelStyle === "card-full" || formPanelStyle === "card-hug"

  // Standard small: fixed narrow form + fixed 420px preview (48px gutter), both shrink-0
  // so the parent modal hugs to exactly the content it needs.
  if (standardSmall) {
    const formPanel = isRefresh
      ? "flex shrink-0 flex-col overflow-y-auto [scrollbar-gutter:stable] border-r border-[#EAF0F6] bg-white"
      : "flex shrink-0 flex-col overflow-y-auto [scrollbar-gutter:stable] border-r border-[#EBEEF1]"
    return (
      <div className="flex min-h-0 min-w-0 flex-1">
        {navigator && (
          <div className={isRefresh ? "shrink-0 overflow-hidden border-r border-[#EAF0F6] bg-white" : "shrink-0 overflow-y-auto"}>
            {navigator}
          </div>
        )}
        <ScrollWithFade enabled={isRefresh} className={formPanel} style={{ width: standardSmallFormWidth }}>
          {/* Signal to forms that they're in the narrow (~280px) standard-small column so wide
              controls (e.g. InvoiceForm's Payment collection segmented control) can adapt. */}
          <NarrowFormWidthProvider initial={true}>
            <div className={`flex flex-1 flex-col ${formInnerPad}`}>{editor}</div>
          </NarrowFormWidthProvider>
        </ScrollWithFade>
        <div
          className={`relative shrink-0 overflow-y-auto ${isRefresh ? "refresh-microdot-canvas" : ""}`}
          style={isRefresh ? undefined : {
            background: "var(--neutral-25, #F4F7FA)",
            boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.02) inset, 0 0 39px 0 rgba(0, 0, 0, 0.01) inset, 0 0 77px 0 rgba(0, 0, 0, 0.03) inset",
          }}
        >
          <div className="flex h-full items-center justify-center p-[48px]">
            <div className="shrink-0" style={{ width: standardSmallPreviewWidth }}>{rightPanel}</div>
          </div>
        </div>
      </div>
    )
  }

  const isFlexible = layoutSplit === "equal" || layoutSplit === "centered"
  const maxWidth = narrowFormWidth ? "max-w-[280px]" : isRefresh ? "" : "max-w-[400px]"

  const formContent = layoutSplit === "centered" ? (
    <div className={`mx-auto w-full ${maxWidth}`}>{editor}</div>
  ) : (
    editor
  )

  const formPanelClass = (() => {
    const sizing = isFlexible ? "flex-1 basis-0 min-w-0" : narrowFormWidth ? `w-full ${maxWidth} shrink-0` : isRefresh ? "refresh-form-panel-width shrink-0" : `w-full ${maxWidth} shrink-0`
    if (isRefresh) return `flex ${sizing} flex-col overflow-y-auto [scrollbar-gutter:stable] border-r border-[#EAF0F6] bg-white`
    if (isCard) return `flex ${sizing} flex-col overflow-y-auto [scrollbar-gutter:stable] bg-[#F8FAFB] p-[8px]`
    return `flex ${sizing} flex-col overflow-y-auto [scrollbar-gutter:stable] border-r border-[#EBEEF1]`
  })()

  const previewPanelClass = (() => {
    const sizing = isFlexible ? "flex-1 basis-0 min-w-0" : "min-w-[280px] flex-1 sm:min-w-[320px]"
    if (isRefresh) return `refresh-microdot-canvas relative ${sizing} overflow-y-auto`
    return `relative ${sizing} overflow-y-auto`
  })()

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      {navigator && (
        <div className={isRefresh ? "shrink-0 overflow-hidden border-r border-[#EAF0F6] bg-white" : "shrink-0 overflow-y-auto"}>
          {navigator}
        </div>
      )}
      {isCard && !isRefresh ? (
        <div className={formPanelClass}>
          <div className={`flex flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] ${formPanelStyle === "card-full" ? "flex-1" : ""}`}>
            <div className={`flex flex-col px-[16px] py-[16px] ${formPanelStyle === "card-full" ? "flex-1" : ""}`}>{formContent}</div>
          </div>
        </div>
      ) : (
        <ScrollWithFade enabled={isRefresh} className={formPanelClass}>
          <div className={`flex flex-1 flex-col ${formInnerPad}`}>{formContent}</div>
        </ScrollWithFade>
      )}
      <div
        className={previewPanelClass}
        style={isRefresh ? undefined : {
          background: "var(--neutral-25, #F4F7FA)",
          boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.02) inset, 0 0 39px 0 rgba(0, 0, 0, 0.01) inset, 0 0 77px 0 rgba(0, 0, 0, 0.03) inset",
        }}
      >
        <div className="flex h-full items-center justify-center p-[24px]">
          {rightPanel}
        </div>
      </div>
    </div>
  )
}

// ── Hierarchical mode: sidebar tree + form + preview ─────────────────

function HierarchicalLayout({
  navigator,
  editor,
  preview,
}: {
  navigator: ReactNode
  editor: ReactNode
  preview?: ReactNode
}) {
  const { narrowFormWidth } = useNarrowFormWidth()
  const { productFormStyle } = useProductFormStyle()
  const { layoutSplit } = useLayoutSplit()
  const isRefresh = productFormStyle === "refresh"

  const fixedWidth = narrowFormWidth ? "w-[280px]" : isRefresh ? "refresh-form-panel-width" : "w-[400px]"
  const centeredMaxWidth = narrowFormWidth ? "max-w-[280px]" : isRefresh ? "" : "max-w-[400px]"

  const formPanelClass = (() => {
    const base = isRefresh
      ? "overflow-hidden border-r border-[#EAF0F6] bg-white"
      : "overflow-y-auto [scrollbar-gutter:stable] border-r border-[#EBEEF1]"
    switch (layoutSplit) {
      case "equal":
      case "centered":
        return `flex-1 basis-0 min-w-0 ${base}`
      default:
        return `${fixedWidth} shrink-0 ${base}`
    }
  })()

  const previewPanelClass = (() => {
    const base = isRefresh ? "refresh-microdot-canvas" : ""
    switch (layoutSplit) {
      case "equal":
      case "centered":
        return `flex-1 basis-0 min-w-0 overflow-y-auto ${base}`
      default:
        return `flex-1 overflow-y-auto ${base}`
    }
  })()

  return (
    <div className="flex min-h-0 flex-1">
      {navigator && (
        <div className={isRefresh ? "w-fit shrink-0 overflow-hidden border-r border-[#EAF0F6] bg-white" : "w-fit shrink-0 overflow-y-auto border-r border-[#EBEEF1]"}>
          {navigator}
        </div>
      )}
      <ScrollWithFade enabled={isRefresh} className={formPanelClass}>
        {layoutSplit === "centered" ? (
          <div className={`mx-auto w-full ${centeredMaxWidth}`}>{editor}</div>
        ) : (
          editor
        )}
      </ScrollWithFade>
      {preview && (
        <div
          className={previewPanelClass}
          style={isRefresh ? undefined : {
            background: "var(--neutral-25, #F4F7FA)",
            boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.02) inset, 0 0 39px 0 rgba(0, 0, 0, 0.01) inset, 0 0 77px 0 rgba(0, 0, 0, 0.03) inset",
          }}
        >
          <div className="flex h-full items-center justify-center p-[24px]">
            {preview}
          </div>
        </div>
      )}
    </div>
  )
}
