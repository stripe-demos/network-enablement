import { PROMPT_RULES } from './consolePrompts.js'

export function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

// One stable set per local calendar day, shared by the hero and its dropdown.
// Pick across topics so a day never consists entirely of one kind of question.
export function getDailyConsolePrompts(dayKey = localDayKey()) {
  const groups = PROMPT_RULES.map((rule) => rule.prompts.map(({ text }) => text))
  groups.push(['Which customers have cards expiring soon?'])
  let seed = [...dayKey].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) | 0, 0) >>> 0
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let i = groups.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[groups[i], groups[j]] = [groups[j], groups[i]]
  }
  return groups.slice(0, 4).map((group) => group[Math.floor(random() * group.length)])
}
