'use client'

import { useState } from "react"

import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { BuyButtonForm } from "@/components/creation-workspace/forms/BuyButtonForm"
import { BuyButtonPreview } from "@/components/creation-workspace/BuyButtonPreview"

type BuyButtonCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (objects: { kind: string; data: Record<string, any> }[]) => void
  presentation?: WorkspacePresentation
  embedded?: boolean
}

// A standalone object: a short style form beside a live preview. No related-object
// graph, so it keeps its own local state instead of going through the workflow config.
export function BuyButtonCreationEditor({
  isOpen,
  onClose,
  onSubmit,
  presentation = "standard-small",
  embedded = false,
}: BuyButtonCreationEditorProps) {
  const [data, setData] = useState<Record<string, any>>({
    product: "pro",
    buttonType: "Button",
    cta: "Pay",
    color: "#635BFF",
    shape: "Rounded",
  })

  const handleSubmit = () => {
    onSubmit?.([{ kind: "buyButton", data }])
    onClose()
  }

  return (
    <CreationWorkspace
      mode="related"
      presentation={presentation}
      isOpen={isOpen}
      embedded={embedded}
      standardSmallPreviewWidth={300}
      header={
        <SimpleCreationHeader
          title="Create buy button"
          onDiscard={onClose}
          onSubmit={handleSubmit}
          submitLabel="Create button"
          discardLabel="Discard"
        />
      }
      editor={
        <BuyButtonForm
          data={data}
          onChange={(next) => setData((prev) => ({ ...prev, ...next }))}
        />
      }
      preview={<BuyButtonPreview data={data} />}
    />
  )
}
