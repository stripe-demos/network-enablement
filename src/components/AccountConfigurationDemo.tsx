'use client'

import { useState } from "react"

import { AccountConfigurationCreationEditor, type AccountConfigurationPayload } from "@/components/creation-workspace/AccountConfigurationCreationEditor"
import { AccountConfigurationOptionsPopover } from "@/components/creation-workspace/AccountConfigurationOptionsPopover"
import { DashboardBackdrop } from "@/components/creation-workspace/DashboardBackdrop"
import { DemoContextBar } from "@/components/creation-workspace/DemoContextBar"
import { AccountCompletionToast } from "@/components/creation-workspace/account-configuration/AccountConfigurationResult"
import { AccountConflictNudgeModeProvider } from "@/components/creation-workspace/accountConflictNudgeMode"
import { AccountOnboardingStyleProvider, useAccountOnboardingStyle } from "@/components/creation-workspace/accountOnboardingStyle"
import { AccountPropertiesLayoutProvider } from "@/components/creation-workspace/accountPropertiesLayout"
import { AccountSelectionStyleProvider } from "@/components/creation-workspace/accountSelectionStyle"
import { InputFillProvider } from "@/components/creation-workspace/inputFill"
import { LayoutSplitProvider } from "@/components/creation-workspace/layoutSplit"
import { ProductFormStyleProvider } from "@/components/creation-workspace/productFormStyle"
import { SegmentedStyleProvider } from "@/components/creation-workspace/segmentedStyle"

function DemoExperience() {
  const [isOpen, setIsOpen] = useState(true)
  const [runKey, setRunKey] = useState(0)
  const [accountCompletion, setAccountCompletion] = useState<AccountConfigurationPayload | null>(null)
  const { accountOnboardingStyle } = useAccountOnboardingStyle()

  const launch = () => {
    setAccountCompletion(null)
    setRunKey((current) => current + 1)
    setIsOpen(true)
  }

  return (
    <main className="example-ui min-h-screen bg-white text-[#142234]">
      <DashboardBackdrop
        flow="account-configurations"
        exampleLabel="Account configuration"
        patternLabel="Standalone demo"
        onBack={() => {}}
        showContextBar={false}
      />

      {!isOpen ? (
        <button
          type="button"
          className="fixed right-[40px] top-[84px] z-[35] flex h-[32px] items-center rounded-[7px] bg-[#675DFF] px-[12px] text-[13px] font-[600] text-white shadow-[0_1px_2px_rgba(20,19,78,0.28)] hover:bg-[#5B52F0]"
          onClick={launch}
        >
          Add configurations
        </button>
      ) : null}

      {isOpen ? (
        <AccountConfigurationCreationEditor
          key={runKey}
          isOpen
          onClose={() => setIsOpen(false)}
          onSubmit={setAccountCompletion}
        />
      ) : null}

      <DemoContextBar
        patternLabel="Standalone demo"
        exampleLabel="Account configuration"
        placement="bottom-left"
        onBack={() => setIsOpen(false)}
        trailingAction={<AccountConfigurationOptionsPopover />}
      />

      {accountCompletion && accountOnboardingStyle !== "success-page" ? (
        <AccountCompletionToast
          payload={accountCompletion}
          actionable={accountOnboardingStyle === "toast-actions" && accountCompletion.source === "new"}
          onDismiss={() => setAccountCompletion(null)}
        />
      ) : null}
    </main>
  )
}

export function AccountConfigurationDemo() {
  return (
    <InputFillProvider initial={false}>
      <SegmentedStyleProvider initial="segmented">
        <ProductFormStyleProvider initial="current" ignorePersisted>
          <LayoutSplitProvider initial="fixed" ignorePersisted>
            <AccountSelectionStyleProvider initial="picker" ignorePersisted>
              <AccountConflictNudgeModeProvider initial="automatic" ignorePersisted>
                <AccountOnboardingStyleProvider initial="success-page" ignorePersisted>
                  <AccountPropertiesLayoutProvider initial="combined" ignorePersisted>
                    <DemoExperience />
                  </AccountPropertiesLayoutProvider>
                </AccountOnboardingStyleProvider>
              </AccountConflictNudgeModeProvider>
            </AccountSelectionStyleProvider>
          </LayoutSplitProvider>
        </ProductFormStyleProvider>
      </SegmentedStyleProvider>
    </InputFillProvider>
  )
}
