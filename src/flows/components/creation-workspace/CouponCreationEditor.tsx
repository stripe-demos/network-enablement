'use client'

import { useState } from "react"

import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { CouponForm } from "@/components/creation-workspace/forms/CouponForm"
import { CouponPreview } from "@/components/creation-workspace/CouponPreview"

type CouponCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (objects: { kind: string; data: Record<string, any> }[]) => void
  presentation?: WorkspacePresentation
  embedded?: boolean
}

// The Simple coupon form (all its progressively-revealed settings) moved into the
// Standard-mini presentation: a narrow scrolling form column beside a live coupon
// preview. Standalone object — keeps its own local state rather than the workflow graph.
export function CouponCreationEditor({
  isOpen,
  onClose,
  onSubmit,
  presentation = "standard-small",
  embedded = false,
}: CouponCreationEditorProps) {
  const [data, setData] = useState<Record<string, any>>({
    discountType: "Percentage off",
    currency: "USD",
    duration: "once",
  })

  const handleSubmit = () => {
    onSubmit?.([{ kind: "coupon", data }])
    onClose()
  }

  return (
    <CreationWorkspace
      mode="related"
      presentation={presentation}
      isOpen={isOpen}
      embedded={embedded}
      standardSmallFormWidth={360}
      standardSmallPreviewWidth={300}
      header={
        <SimpleCreationHeader
          title="Create coupon"
          onDiscard={onClose}
          onSubmit={handleSubmit}
          submitLabel="Create coupon"
          discardLabel="Discard"
        />
      }
      editor={
        <CouponForm
          data={data}
          onChange={(next) => setData((prev) => ({ ...prev, ...next }))}
        />
      }
      preview={<CouponPreview data={data} />}
    />
  )
}
