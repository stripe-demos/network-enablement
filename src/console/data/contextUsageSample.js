// Illustrative prototype data, not a model limit or measured token usage.
export const SAMPLE_CONTEXT_LIMIT = 128_000;
const CATEGORIES = [
  { label: 'System prompt', share: 0.02, color: 'var(--color-icon-subtle)' },
  { label: 'Tool definitions', share: 0.12, color: 'var(--color-accent-lilac)' },
  { label: 'Skills', share: 0.04, color: 'var(--color-accent-yellow)' },
  { label: 'MCP & dynamic tools', share: 0.06, color: 'var(--color-accent-blurple)' },
  { label: 'Summarized conversation', share: 0.18, color: 'var(--color-accent-blue)' },
  { label: 'Conversation', share: 0.58, color: 'var(--color-accent-orange)' },
];

export function contextUsageSample(percent) {
  const used = Math.round(SAMPLE_CONTEXT_LIMIT * Math.max(0, Math.min(100, percent)) / 100);
  let remaining = used;
  const categories = CATEGORIES.map((category, index) => {
    const tokens = index === CATEGORIES.length - 1 ? remaining : Math.round(used * category.share);
    remaining -= tokens;
    return { ...category, tokens };
  });
  return { used, limit: SAMPLE_CONTEXT_LIMIT, categories };
}

export function formatTokenCount(tokens) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(tokens);
}
