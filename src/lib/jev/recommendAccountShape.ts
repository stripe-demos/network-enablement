import {
  CONFIGURATION_OPTIONS,
  extractCandidateSpans,
  highlightAccountDescription,
  pickConfigurationsFromScores,
  recommendConfigurationsFromDescription,
  resolveHighlightOverlaps,
  type ClassificationHighlight,
  type ConfigurationKind,
  type UserPath,
} from "@/components/creation-workspace/account-configuration/model"

export type RecommendAccountShapeResult = {
  configurations: ConfigurationKind[]
  source: "jev" | "heuristic"
  highlights: ClassificationHighlight[]
}

type NoulAnswer = {
  type?: string
  noul?: number
}

type SystemOneResponse = {
  answers?: Record<string, NoulAnswer>
}

const JEV_QUESTIONS: Record<ConfigurationKind, { instructions: string; true: string; false: string }> = {
  customer: {
    instructions: "Should this account be configured as a Customer of the user creating it?",
    true: "This account makes payments to the user. They buy from the user, pay invoices the user sends, or subscribe to the user.",
    false: "This account does not pay the user. Them invoicing the user, or the user paying them, does not make them a Customer.",
  },
  recipient: {
    instructions: "Should this account be configured as a Recipient of the user creating it?",
    true: "This account receives funds, payouts, or transfers from the user. Contractors, vendors, and sellers receiving settlements are Recipients.",
    false: "This account does not receive money from the user.",
  },
  merchant: {
    instructions: "Should this account be configured as a Merchant?",
    true: "This account accepts payments from their own end customers, for example a seller with a storefront collecting card payments.",
    false: "This account does not accept payments from end customers. Receiving payouts from the user is Recipient, not Merchant.",
  },
}

function jevEndpoint() {
  if (process.env.TYPESAFE_API_KEY) {
    return {
      apiKey: process.env.TYPESAFE_API_KEY,
      url: process.env.TYPESAFE_BASE_URL ?? "https://api.typesafe.ai/v1/systemone",
      model: process.env.TYPESAFE_DEFAULT_MODEL ?? "jev-latest",
    }
  }
  if (process.env.AI_GATEWAY_API_KEY) {
    return {
      apiKey: process.env.AI_GATEWAY_API_KEY,
      url: "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
      model: "typesafe-ai/jev",
    }
  }
  return null
}

function buildQuestions(kinds: ConfigurationKind[]) {
  return Object.fromEntries(kinds.map((id) => {
    const option = CONFIGURATION_OPTIONS.find((candidate) => candidate.id === id)
    const question = JEV_QUESTIONS[id]
    return [id, {
      type: "noul" as const,
      instructions: question.instructions,
      criteria: {
        true: `${option?.relationship}. ${question.true}`,
        false: question.false,
      },
    }]
  }))
}

function buildSpanQuestions(spans: { text: string }[], kinds: ConfigurationKind[]) {
  const questions: Record<string, {
    type: "noul"
    instructions: { phrase: string; question: string }
    criteria: { true: string; false: string }
  }> = {}
  spans.forEach((span, index) => {
    for (const kind of kinds) {
      const option = CONFIGURATION_OPTIONS.find((candidate) => candidate.id === kind)
      questions[`p${index}_${kind}`] = {
        type: "noul",
        instructions: {
          phrase: span.text,
          question: `Does the quoted phrase support configuring this account as a ${option?.title}? ${JEV_QUESTIONS[kind].instructions}`,
        },
        criteria: {
          true: `The phrase is evidence that this account ${option?.relationship.toLowerCase()}.`,
          false: "The phrase is not evidence for that configuration, or it is about a different party.",
        },
      }
    }
  })
  return questions
}

function noulFromAnswers(answers: SystemOneResponse["answers"], key: string) {
  const value = answers?.[key]?.noul
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

async function evaluateWithJev(input: {
  description: string
  files: string[]
  kinds: ConfigurationKind[]
  spans: { start: number; end: number; text: string }[]
}): Promise<{ scores: Partial<Record<ConfigurationKind, number>>; highlights: ClassificationHighlight[] }> {
  const endpoint = jevEndpoint()
  if (!endpoint) throw new Error("Jev is not configured")

  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${endpoint.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: endpoint.model,
      state: {
        account_description: input.description,
        attached_files: input.files,
        perspective: "A Stripe user is creating a connected account and described what that account does.",
      },
      questions: {
        ...buildQuestions(input.kinds),
        ...buildSpanQuestions(input.spans, input.kinds),
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Jev request failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`)
  }

  const payload = await response.json() as SystemOneResponse
  const scores: Partial<Record<ConfigurationKind, number>> = {}
  for (const id of input.kinds) {
    const noul = noulFromAnswers(payload.answers, id)
    if (noul !== undefined) scores[id] = noul
  }

  const highlights: ClassificationHighlight[] = []
  input.spans.forEach((span, index) => {
    let best: ClassificationHighlight | undefined
    for (const kind of input.kinds) {
      const noul = noulFromAnswers(payload.answers, `p${index}_${kind}`) ?? 0
      if (noul < 0.62) continue
      if (!best || noul > best.score) {
        best = { start: span.start, end: span.end, kind, score: noul }
      }
    }
    if (best) highlights.push(best)
  })

  return {
    scores,
    highlights: resolveHighlightOverlaps(highlights),
  }
}

export async function recommendAccountShape(input: {
  description: string
  userPath?: UserPath
  files?: string[]
}): Promise<RecommendAccountShapeResult> {
  const description = input.description.trim()
  if (!description) return { configurations: [], source: "heuristic", highlights: [] }

  const kinds = CONFIGURATION_OPTIONS
    .map((option) => option.id)
    .filter((id) => input.userPath !== "direct" || id !== "merchant")
  const spans = extractCandidateSpans(description)

  if (jevEndpoint()) {
    try {
      const { scores, highlights } = await evaluateWithJev({
        description,
        files: input.files ?? [],
        kinds,
        spans,
      })
      const configurations = pickConfigurationsFromScores(scores, input.userPath)
      return {
        configurations,
        source: "jev",
        highlights: highlights.filter((highlight) => configurations.includes(highlight.kind)),
      }
    } catch (error) {
      console.warn("[jev] falling back to heuristic", error)
    }
  }

  return {
    configurations: recommendConfigurationsFromDescription(description, input.userPath),
    source: "heuristic",
    highlights: highlightAccountDescription(description, input.userPath),
  }
}
