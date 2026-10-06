'use client'

import { useState } from "react"

import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { DashboardBackdrop } from "@/components/creation-workspace/DashboardBackdrop"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { useAccountOnboardingStyle } from "@/components/creation-workspace/accountOnboardingStyle"
import { useAccountSelectionStyle } from "@/components/creation-workspace/accountSelectionStyle"
import { AccountConfigurationForm } from "@/components/creation-workspace/account-configuration/AccountConfigurationForm"
import { AccountConfigurationPreview } from "@/components/creation-workspace/account-configuration/AccountConfigurationPreview"
import { AccountSuccessPage, copyAccountOnboardingLink } from "@/components/creation-workspace/account-configuration/AccountConfigurationResult"
import {
  ACCOUNT_ONBOARDING_LINK,
  EMAIL_PATTERN,
  INITIAL_ACCOUNT_DETAILS,
  getCapabilities,
  getOnboardingEmail,
  getPayoutEmail,
  isNewAccountIdentityValid,
  type AccountConfigurationPayload,
  type AccountDetailsDraft,
  type AccountSource,
  type ConfigurationKind,
  type NetworkAccount,
  type UserPath,
} from "@/components/creation-workspace/account-configuration/model"

export type { AccountConfigurationPayload } from "@/components/creation-workspace/account-configuration/model"

type AccountConfigurationCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (payload: AccountConfigurationPayload) => void
  presentation?: WorkspacePresentation
  embedded?: boolean
  userPath: UserPath
}

function countryName(country: NetworkAccount["country"]) {
  if (country === "UK") return "United Kingdom"
  if (country === "CA") return "Canada"
  return "United States"
}

export function AccountConfigurationCreationEditor({
  isOpen,
  onClose,
  onSubmit,
  presentation = "fullscreen",
  embedded = false,
  userPath,
}: AccountConfigurationCreationEditorProps) {
  const { accountSelectionStyle } = useAccountSelectionStyle()
  const { accountOnboardingStyle } = useAccountOnboardingStyle()
  const [source, setSource] = useState<AccountSource>("existing")
  const [selectedAccount, setSelectedAccount] = useState<NetworkAccount | null>(null)
  const [details, setDetails] = useState<AccountDetailsDraft>(INITIAL_ACCOUNT_DETAILS)
  const [configurations, setConfigurations] = useState<ConfigurationKind[]>([])
  const [completedPayload, setCompletedPayload] = useState<AccountConfigurationPayload | null>(null)

  const updateDetails = (patch: Partial<AccountDetailsDraft>) => {
    setDetails((current) => ({ ...current, ...patch }))
  }

  const selectExistingAccount = (account: NetworkAccount) => {
    setSource("existing")
    setSelectedAccount(account)
    setConfigurations((current) => current.filter((configuration) => !account.configurations.includes(configuration)))
    const country = countryName(account.country)
    setDetails((current) => ({
      ...current,
      accountEmail: account.email,
      country,
      billingCountry: current.billingCountry || country,
    }))
  }

  const chooseExisting = () => {
    setSource("existing")
    if (selectedAccount) {
      setConfigurations((current) => current.filter((configuration) => !selectedAccount.configurations.includes(configuration)))
    }
  }

  const prepareNew = () => {
    setDetails(INITIAL_ACCOUNT_DETAILS)
  }

  const chooseNew = () => {
    setSource("new")
  }

  const accountReady = source === "existing" ? Boolean(selectedAccount) : isNewAccountIdentityValid(details)
  const onboardingEmailReady = source !== "new"
    || accountOnboardingStyle !== "pre-save"
    || details.onboardingAction === "copy-link"
    || EMAIL_PATTERN.test(getOnboardingEmail(details))
  const hasConfigurationChanges = configurations.length > 0
  const configurationsReady = source === "new" ? configurations.length > 0 : hasConfigurationChanges
  const readyToSubmit = accountReady && configurationsReady && onboardingEmailReady
  const submitDisabledReason = (() => {
    if (source === "existing" && !selectedAccount) return "Select an account to continue."
    if (source === "new" && !accountReady) {
      const missing = [
        details.type === "Company"
          ? (!details.registeredName.trim() ? "an account name" : null)
          : (!(details.firstName.trim() && details.lastName.trim()) ? "the account holder’s full name" : null),
        !EMAIL_PATTERN.test(details.accountEmail.trim()) ? "a valid account email" : null,
        !details.country ? "a country" : null,
      ].filter((item): item is string => Boolean(item))
      const requirements = missing.length > 2
        ? `${missing.slice(0, -1).join(", ")}, and ${missing.at(-1)}`
        : missing.join(" and ")
      return `Add ${requirements} to continue.`
    }
    if (!configurationsReady) return source === "new"
      ? "Select at least one configuration to continue."
      : "Select a configuration to add."
    if (!onboardingEmailReady) return "Enter a valid onboarding email to continue."
    return undefined
  })()

  const buildPayload = (): AccountConfigurationPayload => {
    const capabilities = getCapabilities(configurations, details.disabledCapabilities, details.additionalCapabilities)
    const onboardingEmail = getOnboardingEmail(details) || details.accountEmail
    return {
      source,
      userPath,
      account: source === "existing" ? selectedAccount! : details,
      configurations,
      details,
      capabilities,
      recipient: configurations.includes("recipient") ? {
        collectionMode: details.payoutCollectionMode,
        methods: details.payoutCollectionMode === "manual" ? details.payoutMethods : [],
        email: details.payoutCollectionMode === "email" ? getPayoutEmail(details) : undefined,
      } : undefined,
      onboarding: source === "new" ? {
        action: accountOnboardingStyle === "pre-save" ? details.onboardingAction : "deferred",
        email: onboardingEmail,
        link: ACCOUNT_ONBOARDING_LINK,
      } : undefined,
    }
  }

  const handleSubmit = async () => {
    if (!readyToSubmit) return
    const payload = buildPayload()
    onSubmit?.(payload)
    if (accountOnboardingStyle === "success-page") {
      setCompletedPayload(payload)
      return
    }
    if (payload.onboarding?.action === "copy-link") await copyAccountOnboardingLink(payload.onboarding.link)
    onClose()
  }

  if (completedPayload && accountOnboardingStyle === "success-page") {
    return (
      <>
        {!embedded ? (
          <DashboardBackdrop
            flow="account-configurations"
            exampleLabel="Account configuration"
            patternLabel="Standard pattern"
            onBack={onClose}
            showContextBar={false}
          />
        ) : null}
        <CreationWorkspace
          mode="single"
          presentation={embedded ? presentation : "large-modal"}
          isOpen={isOpen}
          onClose={onClose}
          embedded={embedded}
          largeModalHugContent={!embedded}
          hideHeader
          skipEnterAnimation
          header={null}
          editor={<AccountSuccessPage payload={completedPayload} hugContent={!embedded} onClose={onClose} onViewAccount={onClose} />}
        />
      </>
    )
  }

  const submitLabel = source === "new"
    ? accountSelectionStyle !== "related-modal" ? "Create account" : "Add configurations"
    : "Update configurations"

  return (
    <CreationWorkspace
      mode="related"
      presentation={presentation}
      isOpen={isOpen}
      embedded={embedded}
      skipEnterAnimation
      header={
        <SimpleCreationHeader
          title="Add configurations"
          onDiscard={onClose}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
          submitDisabled={!readyToSubmit}
          submitDisabledReason={submitDisabledReason}
          discardLabel="Discard"
        />
      }
      editor={
        <AccountConfigurationForm
          selectionStyle={accountSelectionStyle}
          onboardingStyle={accountOnboardingStyle}
          source={source}
          selectedAccountId={selectedAccount?.id ?? ""}
          details={details}
          configurations={configurations}
          existingConfigurations={source === "existing" ? selectedAccount?.configurations ?? [] : []}
          userPath={userPath}
          onChooseExisting={chooseExisting}
          onPrepareNew={prepareNew}
          onChooseNew={chooseNew}
          onSelectExisting={selectExistingAccount}
          onDetailsChange={updateDetails}
          onConfigurationsChange={setConfigurations}
        />
      }
      preview={
        <div className="relative flex h-full min-h-0 w-full overflow-hidden">
          <AccountConfigurationPreview source={source} selectedAccount={selectedAccount} configurations={configurations} details={details} userPath={userPath} />
        </div>
      }
    />
  )
}
