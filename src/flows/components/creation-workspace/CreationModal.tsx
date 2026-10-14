'use client'

import type { ComponentType, ReactNode } from "react"
import { CreationModalShell } from "./CreationModalShell"

type CreationModalProps = {
  isOpen: boolean
  label: string
  FormComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }>
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  onClose: () => void
  /** Optional right-side preview panel. When provided, the modal expands to accommodate it. */
  previewPanel?: ReactNode
  /** Whether this modal is pushed behind a stacked child modal */
  isPushed?: boolean
  onAddObject?: (kind: string) => void
  /** Optional inline child content rendered below the form (e.g. non-permanent child objects) */
  children?: ReactNode
}

export function CreationModal({
  isOpen,
  label,
  FormComponent,
  data,
  onChange,
  onClose,
  previewPanel,
  isPushed,
  onAddObject,
  children,
}: CreationModalProps) {
  const hasPreview = !!previewPanel
  const modalWidth = hasPreview ? "w-[780px]" : "w-[480px]"

  return (
    <CreationModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`New ${label.toLowerCase()}`}
      primaryLabel={`Create ${label.toLowerCase()}`}
      modalWidth={modalWidth}
      isPushed={isPushed}
    >
      <div className="flex min-h-0 flex-1">
        <div className={`${hasPreview ? "w-[400px] border-r border-[#ECF1F6]" : "flex-1"} overflow-y-auto px-[20px] py-[16px]`}>
          <FormComponent data={data} onChange={onChange} onAddObject={onAddObject} />
          {children}
        </div>
        {hasPreview && (
          <div className="flex-1 overflow-y-auto bg-[#F8FAFB] px-[20px] py-[16px]">
            {previewPanel}
          </div>
        )}
      </div>
    </CreationModalShell>
  )
}
