'use client'

import { useState, useRef, useEffect, useCallback } from "react"

// ── Types ────────────────────────────────────────────────────────────

export type ConsoleContextItem = {
  nodeType: string
  nodeName: string
  fieldName: string
}

type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
  taskLabel?: string
  toolCount?: number
}

type PlanAction = {
  id: string
  name: string
  arguments: Record<string, unknown>
}

type ConsoleChatPaneProps = {
  onBack: () => void
  contextItems: ConsoleContextItem[]
  planContext: {
    name: string
    description: string
    currency: string
    rateCards: { id: number; name: string; rates: { id: number; name: string; meter: string; unitPrice: string; priceType: string }[] }[]
    creditGrants: { id: number; name: string; amount: string; period: string }[]
    subscriptionFees: { id: number; name: string; amount: string; period: string }[]
  }
}

// ── Component ────────────────────────────────────────────────────────

let nextId = 1

export function ConsoleChatPane({ onBack, contextItems, planContext }: ConsoleChatPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const buildSystemPrompt = useCallback(() => {
    const focusContext = contextItems.length > 0
      ? `\n\nThe user is currently focused on: ${contextItems.map(i => `${i.nodeType} "${i.nodeName}"${i.fieldName ? ` → ${i.fieldName}` : ""}`).join(", ")}`
      : ""

    return `You are a pricing plan assistant embedded in Stripe's pricing plan editor. You can both advise AND take actions on the plan using tools.

Current plan: "${planContext.name}" (${planContext.currency})
${planContext.description}

Rate cards:
${planContext.rateCards.map(rc => `  [id:${rc.id}] ${rc.name}: ${rc.rates.map(r => `[id:${r.id}] ${r.name} ($${r.unitPrice}/${r.meter}, ${r.priceType})`).join(", ")}`).join("\n")}

Credit grants: ${planContext.creditGrants.map(cg => `[id:${cg.id}] ${cg.name} ($${cg.amount}/${cg.period})`).join(", ") || "None"}
Subscription fees: ${planContext.subscriptionFees.map(sf => `[id:${sf.id}] ${sf.name} ($${sf.amount}/${sf.period})`).join(", ") || "None"}
${focusContext}

When the user asks you to DO something (duplicate, add, delete, change price), USE THE TOOLS to do it — do NOT ask for clarification. If the user has a focused item, assume the action applies to that item. For example, "duplicate 3 times" with a focused subscription fee means duplicate THAT fee 3 times. When they ask for advice, respond with text. Be concise — under 100 words for text responses.`
  }, [contextItems, planContext])

  const handleSubmit = useCallback(async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim()
    if (!trimmed || isStreaming) return

    const userMessage: ChatMessage = { id: nextId++, role: "user", content: trimmed }
    const assistantMessage: ChatMessage = {
      id: nextId++,
      role: "assistant",
      content: "",
      taskLabel: inferTaskLabel(trimmed, contextItems),
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsStreaming(true)

    const systemPrompt = buildSystemPrompt()
    const payloadMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.filter(m => m.content).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: trimmed },
    ]

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages, model: "gpt-4o" }),
      })

      if (!res.ok) {
        const err = await res.text().catch(() => `Request failed (${res.status})`)
        setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...m, content: `Error: ${err}` } : m))
        return
      }

      const data = await res.json() as { content: string; actions: PlanAction[] }

      const content = data.content || (data.actions.length > 0 ? "Done." : "")

      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content, toolCount: data.actions.length }
          : m
      ))

      if (data.actions.length > 0) {
        window.dispatchEvent(new CustomEvent("console-plan-action", { detail: { batch: data.actions } }))
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id ? { ...m, content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` } : m
      ))
    } finally {
      setIsStreaming(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [input, isStreaming, messages, buildSystemPrompt, contextItems])

  const handleQuickAction = useCallback((text: string) => {
    handleSubmit(text)
  }, [handleSubmit])

  const suggestedActions = getSuggestedActions(contextItems, messages)

  const hasMessages = messages.length > 0
  const title = hasMessages ? inferConversationTitle(messages) : "New conversation"

  return (
    <div className="flex h-full w-full flex-col bg-[#0D0D0D]">
      {/* Header */}
      <div className="flex items-center justify-between px-[20px] py-[12px]">
        <button
          type="button"
          className="flex items-center gap-[6px] text-[12px] font-[500] text-[#888888] transition-colors hover:text-[#E5E5E5]"
          onClick={onBack}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2.5L4 6L7.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to editor
        </button>
      </div>

      {/* Conversation title + menu */}
      <div className="flex items-center justify-between px-[20px] pb-[8px]">
        <span className="text-[15px] font-[400] text-[#CCCCCC]">{title}</span>
        {hasMessages && (
          <button type="button" className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] text-[#666666] hover:text-[#999999]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="7" r="1.2" fill="currentColor" />
              <circle cx="7" cy="7" r="1.2" fill="currentColor" />
              <circle cx="11" cy="7" r="1.2" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      {/* Context chips (from sparkle clicks) */}
      {contextItems.length > 0 && (
        <div className="flex flex-wrap gap-[6px] px-[20px] pb-[12px]">
          {contextItems.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-[4px] rounded-[6px] bg-[#1A1A1A] px-[8px] py-[3px] text-[11px] font-[500] text-[#AAAAAA]"
            >
              <span className="text-[#999999]">{item.nodeType}</span>
              <span className="text-[#444444]">·</span>
              <span>{item.nodeName}</span>
            </span>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-[20px]">
        {!hasMessages ? (
          /* Empty state — input at top */
          <div className="pt-[8px]">
            <ConsoleInputField
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="Ask anything"
              disabled={isStreaming}
            />
          </div>
        ) : (
          /* Message thread */
          <div className="flex flex-col gap-[20px] pb-[16px]">
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <UserBubble content={msg.content} />
                ) : (
                  <>
                    <AssistantBlock
                      content={msg.content}
                      taskLabel={msg.taskLabel}
                      toolCount={msg.toolCount}
                      isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id}
                    />
                    {idx === messages.length - 1 && suggestedActions.length > 0 && !isStreaming && msg.toolCount === 0 && (
                      <div className="flex flex-wrap gap-[6px] pt-[12px]">
                        {suggestedActions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="rounded-[8px] border border-[#2A2A2A] bg-[#161616] px-[10px] py-[5px] text-[12px] text-[#AAAAAA] transition-colors hover:border-[#444444] hover:text-[#E5E5E5]"
                            onClick={() => handleQuickAction(action)}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up input */}
      {hasMessages && (
        <div className="px-[20px] pb-[16px] pt-[8px]">
          <ConsoleInputField
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Follow up"
            disabled={isStreaming}
          />
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────

import { forwardRef } from "react"

const ConsoleInputField = forwardRef<
  HTMLInputElement,
  { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; disabled: boolean }
>(function ConsoleInputField({ value, onChange, onSubmit, placeholder, disabled }, ref) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="text-[15px] font-[500] text-[#888888]">$</span>
      <input
        ref={ref}
        className="flex-1 bg-transparent text-[15px] text-[#E5E5E5] placeholder-[#555555] outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
          }
        }}
        disabled={disabled}
      />
    </div>
  )
})

function UserBubble({ content }: { content: string }) {
  return (
    <div className="rounded-[12px] bg-[#1C1C1C] px-[16px] py-[12px]">
      <p className="text-[14px] leading-[22px] text-[#E8E8E8]">{content}</p>
    </div>
  )
}

function AssistantBlock({
  content,
  taskLabel,
  toolCount,
  isStreaming,
}: {
  content: string
  taskLabel?: string
  toolCount?: number
  isStreaming: boolean
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      {/* Task block */}
      {taskLabel && (
        <div className="flex flex-col gap-[2px]">
          <div className="flex items-center gap-[8px]">
            <span className="text-[12px] text-[#666666]">■</span>
            <span className="text-[13px] font-[600] text-[#CCCCCC]">Task</span>
            <span className="text-[13px] text-[#888888]">{taskLabel}</span>
          </div>
          {toolCount != null && (
            <div className="pl-[20px]">
              <span className="text-[12px] text-[#666666]">↳ Used {toolCount} tool{toolCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* Response text */}
      {content && (
        <div className="flex gap-[8px]">
          <span className="mt-[3px] text-[12px] text-[#666666]">■</span>
          <p className="flex-1 text-[14px] leading-[22px] text-[#E8E8E8] whitespace-pre-wrap">
            {content}
            {isStreaming && <span className="ml-[2px] inline-block h-[14px] w-[2px] animate-pulse bg-[#E8E8E8]" />}
          </p>
        </div>
      )}

      {/* Streaming indicator when no content yet */}
      {!content && isStreaming && (
        <div className="flex items-center gap-[8px] pl-[20px]">
          <span className="text-[12px] text-[#555555] animate-pulse">Thinking...</span>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

function inferTaskLabel(userMessage: string, contextItems: ConsoleContextItem[]): string {
  const msg = userMessage.toLowerCase()
  if (msg.includes("price") || msg.includes("charge") || msg.includes("cost")) {
    return "Analyze pricing recommendations"
  }
  if (msg.includes("name") || msg.includes("rename") || msg.includes("suggest")) {
    return "Generate naming suggestions"
  }
  if (msg.includes("structure") || msg.includes("organize") || msg.includes("restructure")) {
    return "Analyze plan structure"
  }
  if (contextItems.length > 0) {
    return `Analyze ${contextItems[0].fieldName.toLowerCase()} for ${contextItems[0].nodeName}`
  }
  return "Analyze pricing plan"
}

function inferConversationTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.role === "user")
  if (!firstUser) return "New conversation"
  const content = firstUser.content
  if (content.length <= 30) return content
  return content.slice(0, 27) + "..."
}

function getSuggestedActions(contextItems: ConsoleContextItem[], messages: ChatMessage[]): string[] {
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")
  const lastContent = lastAssistant?.content.toLowerCase() ?? ""

  if (lastContent.includes("confirm")) {
    return ["Yes", "No, cancel"]
  }
  if (lastContent.includes("price") || lastContent.includes("amount") || lastContent.includes("how much")) {
    return ["Increase by 10%", "Increase by 20%", "Double it"]
  }

  if (contextItems.length === 0) {
    return ["Add a rate card", "Review pricing"]
  }

  const nodeType = contextItems[0].nodeType
  const name = contextItems[0].nodeName
  if (nodeType === "rate") {
    return [`Duplicate ${name}`, `Increase price by 10%`, `Delete ${name}`]
  }
  if (nodeType === "rateCard") {
    return [`Duplicate ${name}`, `Add a rate`, `Delete ${name}`]
  }
  if (nodeType === "subscriptionFee") {
    return [`Duplicate ${name}`, `Increase by 10%`, `Delete ${name}`]
  }
  if (nodeType === "creditGrant") {
    return [`Duplicate ${name}`, `Increase by 10%`, `Delete ${name}`]
  }
  return [`Duplicate ${name}`, `Delete ${name}`]
}
