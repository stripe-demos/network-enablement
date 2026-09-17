'use client'

import { useState } from "react"

import { AccountConfigurationCreationEditor, type AccountConfigurationPayload } from "@/components/creation-workspace/AccountConfigurationCreationEditor"
import { AccountConfigurationOptionsPopover } from "@/components/creation-workspace/AccountConfigurationOptionsPopover"
import { CreationWorkspace } from "@/components/creation-workspace/CreationWorkspace"
import { DashboardBackdrop } from "@/components/creation-workspace/DashboardBackdrop"
import { DemoContextBar } from "@/components/creation-workspace/DemoContextBar"
import { AccountCompletionToast } from "@/components/creation-workspace/account-configuration/AccountConfigurationResult"
import { UserPathPicker } from "@/components/creation-workspace/account-configuration/UserPathPicker"
import type { UserPath } from "@/components/creation-workspace/account-configuration/model"
import { AccountConflictNudgeModeProvider } from "@/components/creation-workspace/accountConflictNudgeMode"
import { AccountOnboardingStyleProvider, useAccountOnboardingStyle } from "@/components/creation-workspace/accountOnboardingStyle"
import { AccountPropertiesLayoutProvider } from "@/components/creation-workspace/accountPropertiesLayout"
import { AccountSelectionStyleProvider } from "@/components/creation-workspace/accountSelectionStyle"
import { InputFillProvider } from "@/components/creation-workspace/inputFill"
import { LayoutSplitProvider } from "@/components/creation-workspace/layoutSplit"
import { ProductFormStyleProvider } from "@/components/creation-workspace/productFormStyle"
import { SegmentedStyleProvider } from "@/components/creation-workspace/segmentedStyle"

function DemoExperience({
  onExit,
  patternLabel = "Standalone demo",
  exampleLabel = "Account creation",
}: {
  onExit?: () => void
  patternLabel?: string
  exampleLabel?: string
}) {
  const [userPath, setUserPath] = useState<UserPath | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const [accountCompletion, setAccountCompletion] = useState<AccountConfigurationPayload | null>(null)
  const { accountOnboardingStyle } = useAccountOnboardingStyle()
  const canLaunch = Boolean(userPath)

  const launch = () => {
    if (!userPath) return
    setAccountCompletion(null)
    setRunKey((current) => current + 1)
    setIsEditorOpen(true)
  }

  return (
    <main className="example-ui min-h-screen bg-white text-[#142234]">
      <DashboardBackdrop
        flow="account-configurations"
        exampleLabel={exampleLabel}
        patternLabel={patternLabel}
        onBack={() => {}}
        showContextBar={false}
        headerAction={
          <button
            type="button"
            disabled={!canLaunch}
            className={`flex h-[32px] items-center gap-[6px] rounded-[7px] border px-[12px] text-[13px] font-[600] shadow-[0_1px_2px_rgba(20,34,52,0.06)] ${
              canLaunch
                ? "border-[#D4DEE9] bg-white text-[#1A2C44] hover:bg-[#F5F6F8]"
                : "cursor-not-allowed border-[#E4E9EF] bg-[#F5F6F8] text-[#9CA3B0]"
            }`}
            onClick={launch}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6.7 0.85C6.7 0.380558 6.31944 0 5.85 0C5.38056 0 5 0.380558 5 0.85V5H0.85C0.380558 5 0 5.38056 0 5.85C0 6.31944 0.380558 6.7 0.85 6.7H5V10.85C5 11.3194 5.38056 11.7 5.85 11.7C6.31944 11.7 6.7 11.3194 6.7 10.85V6.7H10.85C11.3194 6.7 11.7 6.31944 11.7 5.85C11.7 5.38056 11.3194 5 10.85 5H6.7V0.85Z" fill="currentColor" />
            </svg>
            Add
          </button>
        }
      />

      {!userPath ? (
        <CreationWorkspace
          mode="single"
          presentation="large-modal"
          isOpen
          largeModalHugContent
          hideHeader
          header={null}
          editor={<UserPathPicker onChoose={setUserPath} />}
        />
      ) : null}

      {isEditorOpen && userPath ? (
        <AccountConfigurationCreationEditor
          key={runKey}
          isOpen
          userPath={userPath}
          onClose={() => setIsEditorOpen(false)}
          onSubmit={setAccountCompletion}
        />
      ) : null}

      <DemoContextBar
        patternLabel={patternLabel}
        exampleLabel={exampleLabel}
        placement="bottom-left"
        onBack={() => {
          if (isEditorOpen) {
            setIsEditorOpen(false)
            return
          }
          if (onExit) {
            onExit()
            return
          }
          setIsEditorOpen(false)
        }}
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

export function AccountConfigurationDemo({
  onExit,
  patternLabel,
  exampleLabel,
}: {
  onExit?: () => void
  patternLabel?: string
  exampleLabel?: string
} = {}) {
  return (
    <InputFillProvider initial={false}>
      <SegmentedStyleProvider initial="segmented">
        <ProductFormStyleProvider initial="current" ignorePersisted>
          <LayoutSplitProvider initial="fixed" ignorePersisted>
            <AccountSelectionStyleProvider initial="picker" ignorePersisted>
              <AccountConflictNudgeModeProvider initial="automatic" ignorePersisted>
                <AccountOnboardingStyleProvider initial="success-page" ignorePersisted>
                  <AccountPropertiesLayoutProvider initial="combined" ignorePersisted>
                    <DemoExperience onExit={onExit} patternLabel={patternLabel} exampleLabel={exampleLabel} />
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
