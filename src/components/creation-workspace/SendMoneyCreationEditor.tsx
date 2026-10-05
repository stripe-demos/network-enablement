'use client'

import { useMemo, useState } from "react"

import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { EntityDropdown } from "@/components/creation-workspace/forms/EntityDropdown"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { NETWORK_ACCOUNTS } from "@/components/creation-workspace/account-configuration/model"

type SendMoneyCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (objects: { kind: string; data: Record<string, unknown> }[]) => void
  presentation?: WorkspacePresentation
  embedded?: boolean
}

type SendMoneyDraft = {
  recipientId: string
  amount: string
  description: string
}

const INITIAL_DRAFT: SendMoneyDraft = {
  recipientId: "",
  amount: "",
  description: "",
}

function formatAmount(amount: string) {
  const value = Number.parseFloat(amount)
  if (!Number.isFinite(value) || value <= 0) return "$0.00"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

export function SendMoneyCreationEditor({
  isOpen,
  onClose,
  onSubmit,
  presentation = "fullscreen",
  embedded = false,
}: SendMoneyCreationEditorProps) {
  const [data, setData] = useState<SendMoneyDraft>(INITIAL_DRAFT)
  const tokens = getFormTokens("current")
  const recipients = useMemo(
    () => NETWORK_ACCOUNTS.map((account) => ({
      id: account.id,
      name: account.name,
      detail: account.email,
    })),
    [],
  )
  const recipient = recipients.find((item) => item.id === data.recipientId) ?? null
  const readyToSubmit = Boolean(data.recipientId && Number.parseFloat(data.amount) > 0)

  const handleSubmit = () => {
    if (!readyToSubmit) return
    onSubmit?.([{ kind: "payout", data }])
    onClose()
  }

  return (
    <CreationWorkspace
      mode="related"
      presentation={presentation}
      isOpen={isOpen}
      embedded={embedded}
      header={
        <SimpleCreationHeader
          title="Send money"
          onDiscard={onClose}
          onSubmit={handleSubmit}
          submitLabel="Send money"
          discardLabel="Discard"
          submitDisabled={!readyToSubmit}
        />
      }
      editor={
        <div className="flex flex-col gap-[16px]">
          <EntityDropdown
            label="Recipient"
            placeholder="Select an account"
            searchPlaceholder="Search accounts"
            items={recipients}
            selectedId={data.recipientId}
            onSelect={(recipientId) => setData((current) => ({ ...current, recipientId }))}
          />
          <label className="block">
            <span className={tokens.labelClass}>Amount</span>
            <div className="relative mt-[6px]">
              <span className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-[12px] font-[500] text-[#6C7688]">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={data.amount}
                onChange={(event) => setData((current) => ({ ...current, amount: event.target.value }))}
                className={`${tokens.inputClass} pl-[22px]`}
              />
            </div>
          </label>
          <label className="block">
            <span className={tokens.labelClass}>Description</span>
            <input
              type="text"
              placeholder="What’s this for?"
              value={data.description}
              onChange={(event) => setData((current) => ({ ...current, description: event.target.value }))}
              className={`${tokens.inputClass} mt-[6px]`}
            />
          </label>
        </div>
      }
      preview={
        <div className="flex h-full items-center justify-center p-[40px]">
          <div className="w-full max-w-[360px] overflow-hidden rounded-[14px] border border-[#EBEEF1] bg-white shadow-[0_8px_24px_rgba(20,34,52,0.06)]">
            <div className="border-b border-[#EBEEF1] px-[20px] py-[16px]">
              <p className="text-[12px] font-[600] uppercase tracking-[0.4px] text-[#6C7688]">Payout</p>
              <p className="mt-[6px] text-[28px] font-[650] tracking-[-0.4px] text-[#1A2C44]">{formatAmount(data.amount)}</p>
            </div>
            <div className="space-y-[12px] px-[20px] py-[16px]">
              <div>
                <p className="text-[11px] font-[500] text-[#6C7688]">To</p>
                <p className="mt-[2px] text-[13px] font-[600] text-[#1A2C44]">{recipient?.name ?? "Select a recipient"}</p>
                {recipient?.detail ? <p className="text-[12px] text-[#6C7688]">{recipient.detail}</p> : null}
              </div>
              {data.description.trim() ? (
                <div>
                  <p className="text-[11px] font-[500] text-[#6C7688]">Description</p>
                  <p className="mt-[2px] text-[13px] font-[500] text-[#1A2C44]">{data.description}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      }
    />
  )
}
