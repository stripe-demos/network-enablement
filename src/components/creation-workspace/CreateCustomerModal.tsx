"use client"

import { useEffect, useState } from "react"

import { AccountConflictNudgeModeProvider } from "@/components/creation-workspace/accountConflictNudgeMode"
import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { CustomerForm, isComposeAccountReady } from "@/components/creation-workspace/forms/CustomerForm"
import { ProductFormStyleProvider } from "@/components/creation-workspace/productFormStyle"
import type { NetworkAccount } from "@/components/creation-workspace/account-configuration/model"

export function CreateCustomerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [data, setData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (isOpen) setData({})
  }, [isOpen])

  const adoptExisting = (_account: NetworkAccount) => {
    onClose()
  }

  return (
    <AccountConflictNudgeModeProvider initial="automatic" ignorePersisted>
      <CreationModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Create customer account"
        primaryLabel="Create account"
        primaryDisabled={!isComposeAccountReady(data)}
        onPrimary={onClose}
      >
        <ProductFormStyleProvider initial="current">
          <div className="overflow-y-auto px-[20px] py-[16px]">
            <CustomerForm
              layout="single-config"
              data={data}
              onChange={(next) => setData((current) => ({ ...current, ...next }))}
              onUseExistingAccount={adoptExisting}
            />
          </div>
        </ProductFormStyleProvider>
      </CreationModalShell>
    </AccountConflictNudgeModeProvider>
  )
}
