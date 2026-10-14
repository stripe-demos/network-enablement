import {
  CONFIGURATION_ACCEPT_THRESHOLD,
  CONFIGURATION_OPTIONS,
  extractCandidateSpans,
  highlightAccountDescription,
  pickConfigurationsFromScores,
  recommendConfigurationsFromDescription,
  resolveHighlightOverlaps,
  scoreAccountDescription,
  type ClassificationHighlight,
  type ConfigurationKind,
  type UserPath,
} from "../../components/creation-workspace/account-configuration/model"

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

const ROLE_INDEPENDENCE = "Each role is independent. Answer whether THIS role applies, even if other roles also apply. Do not lower confidence because the account is also a Merchant, Customer, or Recipient."

const MONEY_FLOW_GUIDE = [
  "The writer is the platform (we/you/our app/our platform).",
  "This account/them is the connected account being created.",
  "Their customers are that account's end buyers, never the platform.",
  "Customer: this account pays the platform — invoices, subscriptions, or any fee the platform charges them (monthly, listing, SaaS, take-rate). 'We charge them a monthly fee' is Customer.",
  "Merchant: this account accepts payments from its own end customers. 'Their customers pay them directly' is Merchant, not Customer.",
  "Recipient: the platform pays this account — payouts, transfers, contractor settlements. 'We pay them out' is Recipient.",
  "Selling on the platform and paying the platform a fee is Merchant AND Customer.",
  "Selling on the platform and receiving settlements from the platform is Merchant AND Recipient.",
  ROLE_INDEPENDENCE,
].join(" ")

const JEV_QUESTIONS: Record<ConfigurationKind, { instructions: string; true: string; false: string }> = {
  customer: {
    instructions: `Should this account be configured as a Customer of the platform? ${ROLE_INDEPENDENCE}`,
    true: "This account pays the platform: it buys from the platform, pays the platform's invoices, subscribes, or the platform charges it a fee. 'We charge them a fee to list on our platform' is Customer even if they also sell to end buyers.",
    false: "This account does not pay the platform. 'Their customers pay them' is Merchant. The platform paying this account is Recipient.",
  },
  recipient: {
    instructions: `Should this account be configured as a Recipient of the platform? ${ROLE_INDEPENDENCE}`,
    true: "The platform sends this account money: payouts, transfers, or settlements. Contractors, vendors, and sellers the platform pays are Recipients even if they also sell to end buyers.",
    false: "The platform does not pay this account. End customers paying this account is Merchant. This account paying the platform a fee is Customer.",
  },
  merchant: {
    instructions: `Should this account be configured as a Merchant? ${ROLE_INDEPENDENCE}`,
    true: "This account accepts payments from its own end customers — selling through the platform, a storefront, or 'their customers pay them directly'. That remains Merchant even if the platform also charges them a fee.",
    false: "This account does not accept payments from end customers. A platform fee is Customer. Receiving payouts from the platform is Recipient.",
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
          true: `The phrase is evidence for ${option?.title}. ${JEV_QUESTIONS[kind].true}`,
          false: `The phrase is not evidence for ${option?.title}, or it is about a different party. ${JEV_QUESTIONS[kind].false}`,
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

function blendClassificationScores(
  jev: Partial<Record<ConfigurationKind, number>>,
  description: string,
  kinds: ConfigurationKind[],
) {
  const heuristic = scoreAccountDescription(description)
  const scores: Partial<Record<ConfigurationKind, number>> = {}
  for (const id of kinds) {
    const model = jev[id]
    const fallback = heuristic[id]
    if (model === undefined) scores[id] = fallback
    else if (fallback >= 0.8 && model < CONFIGURATION_ACCEPT_THRESHOLD) scores[id] = fallback
    else scores[id] = model
  }
  return scores
}

function mergeHighlights(
  preferred: ClassificationHighlight[],
  fallback: ClassificationHighlight[],
  configurations: ConfigurationKind[],
) {
  const accepted = new Set(configurations)
  const fromJev = preferred.filter((highlight) => accepted.has(highlight.kind))
  const covered = new Set(fromJev.map((highlight) => highlight.kind))
  const extras = fallback.filter((highlight) => accepted.has(highlight.kind) && !covered.has(highlight.kind))
  return resolveHighlightOverlaps([...fromJev, ...extras])
}

async function evaluateWithJev(input: {
  description: string
  files: string[]
  kinds: ConfigurationKind[]
  spans: { start: number; end: number; text: string }[]
  userPath?: UserPath
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
        user_path: input.userPath === "direct" ? "direct" : "platform",
        path_note: input.userPath === "direct"
          ? "Direct users cannot configure Merchant. Only Customer (this account pays the user) and Recipient (the user pays this account) apply."
          : "Platform users can configure Customer, Merchant, and Recipient together when the money flows support it.",
        perspective: "A Stripe user is creating a connected account and described how that account uses their product and how money moves.",
        money_flow: MONEY_FLOW_GUIDE,
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
        userPath: input.userPath,
      })
      const blended = blendClassificationScores(scores, description, kinds)
      const configurations = pickConfigurationsFromScores(blended, input.userPath)
      return {
        configurations,
        source: "jev",
        highlights: mergeHighlights(highlights, highlightAccountDescription(description, input.userPath), configurations),
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
