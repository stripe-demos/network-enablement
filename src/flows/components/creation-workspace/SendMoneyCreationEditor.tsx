'use client'

import { SendFlowApp } from "@/send-flow/SendFlowApp"

type SendMoneyCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
}

export function SendMoneyCreationEditor({ isOpen, onClose }: SendMoneyCreationEditorProps) {
  if (!isOpen) return null
  return <SendFlowApp key="send-money" onClose={onClose} />
}
